import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, projectAPI, healthAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PriorityBadge from '../components/PriorityBadge';
import TaskDrawer from '../components/TaskDrawer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  PlusIcon, TrashIcon, PencilIcon,
  ArrowLeftIcon, CalendarIcon, ClockIcon, LinkIcon,
  ExclamationTriangleIcon, ShieldCheckIcon, FunnelIcon,
} from '@heroicons/react/24/outline';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-50', dot: 'bg-slate-400', border: 'border-slate-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50', dot: 'bg-blue-500', border: 'border-blue-200' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-50', dot: 'bg-red-500', border: 'border-red-200' },
  { id: 'review', label: 'In Review', color: 'bg-yellow-50', dot: 'bg-yellow-500', border: 'border-yellow-200' },
  { id: 'completed', label: 'Completed', color: 'bg-green-50', dot: 'bg-green-500', border: 'border-green-200' }
];

const emptyForm = {
  title: '', description: '', priority: 'medium', deadline: '',
  assignedTo: '', labels: '', estimatedHours: '', storyPoints: 1, status: 'todo'
};

export default function KanbanPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [health, setHealth] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blockerModal, setBlockerModal] = useState(false);
  const [blockerNote, setBlockerNote] = useState('');
  const [blockerTaskId, setBlockerTaskId] = useState(null);
  const [timeModal, setTimeModal] = useState(false);
  const [timeForm, setTimeForm] = useState({ startTime: '', endTime: '', note: '' });
  const [drawerTask, setDrawerTask] = useState(null);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    const [p, t] = await Promise.all([
      projectAPI.getOne(projectId),
      taskAPI.getByProject(projectId)
    ]);
    setProject(p.data);
    setTasks(t.data);
    const allMembers = [p.data.owner, ...(p.data.members || [])].filter(Boolean);
    setMembers(allMembers);
    setLoading(false);
  };

  const loadHealth = async () => {
    try {
      const { data } = await healthAPI.getScore(projectId);
      setHealth(data);
    } catch { /* skip */ }
  };

  useEffect(() => { load(); loadHealth(); }, [projectId]);

  const getColumnTasks = (status) =>
    tasks
      .filter(t => t.status === status)
      .filter(t => !filterPriority || t.priority === filterPriority)
      .filter(t => !filterAssignee || t.assignedTo?._id === filterAssignee || t.assignedTo === filterAssignee)
      .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.order - b.order);

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus, order: destination.index } : t));
    try {
      await taskAPI.update(draggableId, { status: newStatus, order: destination.index });
    } catch { toast.error('Failed to move task'); load(); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        labels: form.labels.split(',').map(l => l.trim()).filter(Boolean),
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        storyPoints: Number(form.storyPoints) || 1
      };
      if (editTask) {
        const { data } = await taskAPI.update(editTask._id, payload);
        setTasks(prev => prev.map(t => t._id === editTask._id ? data : t));
        toast.success('Task updated');
      } else {
        const { data } = await taskAPI.create(projectId, payload);
        setTasks(prev => [...prev, data]);
        toast.success('Task created');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await taskAPI.delete(taskId);
    setTasks(prev => prev.filter(t => t._id !== taskId));
    toast.success('Deleted');
  };

  const handleSetBlocker = async () => {
    try {
      await taskAPI.setBlocker(blockerTaskId, { blockedByIds: [], blockerNote });
      toast.success('Task marked as blocked');
      setBlockerModal(false);
      load();
    } catch { toast.error('Failed'); }
  };

  const handleResolveBlocker = async (taskId) => {
    try {
      await taskAPI.resolveBlocker(taskId);
      toast.success('Blocker resolved');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleLogTime = async () => {
    try {
      await taskAPI.logTime(selectedTask._id, timeForm);
      toast.success('Time logged');
      setTimeModal(false);
      load();
    } catch { toast.error('Failed'); }
  };

  const loadResources = async (task) => {
    // AI resources removed
  };

  const loadAISuggestions = async () => {
    // AI suggestions removed
  };

  const healthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="btn-ghost p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project?.title}</h1>
            <p className="text-sm text-gray-500">{tasks.length} tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {health && (
            <span className={`badge font-semibold px-3 py-1 ${healthColor(health.healthScore)}`}>
              Health: {health.healthScore}/100
            </span>
          )}
          <Link to={`/projects/${projectId}/standup`} className="btn-secondary text-sm">
            📋 Standup
          </Link>
          <button onClick={() => { setEditTask(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary text-sm">
            <PlusIcon className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 w-48" />
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">All members</option>
          {members.map(m => m && <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        {(filterPriority || filterAssignee || searchQuery) && (
          <button onClick={() => { setFilterPriority(''); setFilterAssignee(''); setSearchQuery(''); }}
            className="text-xs text-violet-600 hover:underline">Clear filters</button>
        )}
      </div>

      {/* Health risks */}
      {health?.risks?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {health.risks.map((r, i) => (
            <div key={i} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${r.level === 'high' ? 'bg-red-100 text-red-700' : r.level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              {r.message}
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className={`rounded-xl p-3 ${col.color} border ${col.border} min-h-[400px] flex flex-col`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className="font-semibold text-gray-700 text-sm">{col.label}</h3>
                    <span className="badge bg-white text-gray-600 shadow-sm">{colTasks.length}</span>
                  </div>
                  <button onClick={() => { setEditTask(null); setForm({ ...emptyForm, status: col.id }); setShowModal(true); }}
                    className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                    <PlusIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`flex-1 space-y-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-white/60' : ''}`}>
                      {colTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing transition-all ${snapshot.isDragging ? 'shadow-lg rotate-1 scale-105' : 'hover:shadow-md'}`}
                              onClick={() => setDrawerTask(task)}>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {task.isAISuggested && <span className="badge bg-yellow-100 text-yellow-700 text-xs">🤖 AI</span>}
                                {task.stakeholderApproved && <span className="badge bg-green-100 text-green-700 text-xs">✓ Approved</span>}
                                {task.blockedBy?.length > 0 && <span className="badge bg-red-100 text-red-700 text-xs">🚫 Blocked</span>}
                                {task.externalLinks?.length > 0 && <span className="badge bg-purple-100 text-purple-700 text-xs"><LinkIcon className="w-2.5 h-2.5 inline" /> {task.externalLinks[0].source}</span>}
                              </div>

                              <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                              {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}

                              {/* Blocker note */}
                              {task.status === 'blocked' && task.blockerNote && (
                                <div className="mt-1.5 p-1.5 bg-red-50 rounded text-xs text-red-700">
                                  🚫 {task.blockerNote}
                                </div>
                              )}

                              {/* Labels */}
                              {task.labels?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {task.labels.map(l => <span key={l} className="badge bg-primary-50 text-primary-600 text-xs">{l}</span>)}
                                </div>
                              )}

                              {/* Meta */}
                              <div className="flex items-center justify-between mt-2">
                                <PriorityBadge priority={task.priority} />
                                <div className="flex items-center gap-1.5">
                                  {task.estimatedHours > 0 && (
                                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                      <ClockIcon className="w-3 h-3" />{task.estimatedHours}h
                                    </span>
                                  )}
                                  {task.deadline && (
                                    <span className={`text-xs flex items-center gap-0.5 ${new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                      <CalendarIcon className="w-3 h-3" />{format(new Date(task.deadline), 'MMM d')}
                                    </span>
                                  )}
                                  {task.assignedTo && (
                                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold" title={task.assignedTo.name}>
                                      {task.assignedTo.name?.[0]?.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-1 mt-2 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setEditTask(task); setForm({ title: task.title, description: task.description || '', priority: task.priority, deadline: task.deadline ? task.deadline.split('T')[0] : '', assignedTo: task.assignedTo?._id || '', labels: task.labels?.join(', ') || '', estimatedHours: task.estimatedHours || '', storyPoints: task.storyPoints || 1, status: task.status }); setShowModal(true); }}
                                  className="btn-ghost text-xs py-0.5 px-1.5 text-gray-400 hover:text-gray-700" title="Edit">
                                  <PencilIcon className="w-3 h-3" />
                                </button>
                                {task.status !== 'blocked' ? (
                                  <button onClick={() => { setBlockerTaskId(task._id); setBlockerModal(true); }}
                                    className="btn-ghost text-xs py-0.5 px-1.5 text-gray-400 hover:text-red-500" title="Mark blocked">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleResolveBlocker(task._id)}
                                    className="btn-ghost text-xs py-0.5 px-1.5 text-green-500 hover:text-green-700" title="Resolve blocker">
                                    <ShieldCheckIcon className="w-3 h-3" />
                                  </button>
                                )}
                                <button onClick={() => { setSelectedTask(task); setTimeModal(true); }}
                                  className="btn-ghost text-xs py-0.5 px-1.5 text-gray-400 hover:text-blue-500" title="Log time">
                                  <ClockIcon className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDelete(task._id)}
                                  className="btn-ghost text-xs py-0.5 px-1.5 text-gray-400 hover:text-red-500" title="Delete">
                                  <TrashIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTask ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="label">Est. Hours</label>
              <input type="number" className="input" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} min={0} />
            </div>
            <div>
              <label className="label">Story Points</label>
              <input type="number" className="input" value={form.storyPoints} onChange={e => setForm({ ...form, storyPoints: e.target.value })} min={1} max={13} />
            </div>
          </div>
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map(m => m && <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Labels (comma separated)</label>
            <input className="input" value={form.labels} onChange={e => setForm({ ...form, labels: e.target.value })} placeholder="frontend, api, urgent" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Saving...' : editTask ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Blocker Modal */}
      <Modal open={blockerModal} onClose={() => setBlockerModal(false)} title="Mark Task as Blocked" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Describe why this task is blocked. Faculty will be notified.</p>
          <textarea className="input resize-none" rows={3} placeholder="e.g. Waiting for API credentials from client..."
            value={blockerNote} onChange={e => setBlockerNote(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setBlockerModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSetBlocker} className="btn-danger flex-1 justify-center">Mark Blocked</button>
          </div>
        </div>
      </Modal>

      {/* Time Log Modal */}
      <Modal open={timeModal} onClose={() => setTimeModal(false)} title="Log Time" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Task: <span className="font-medium text-gray-900">{selectedTask?.title}</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <input type="datetime-local" className="input" value={timeForm.startTime} onChange={e => setTimeForm({ ...timeForm, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="datetime-local" className="input" value={timeForm.endTime} onChange={e => setTimeForm({ ...timeForm, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" placeholder="What did you work on?" value={timeForm.note} onChange={e => setTimeForm({ ...timeForm, note: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTimeModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleLogTime} className="btn-primary flex-1 justify-center">Log Time</button>
          </div>
        </div>
      </Modal>

      {/* Task Drawer */}
      {drawerTask && (
        <TaskDrawer
          task={drawerTask}
          members={members}
          onClose={() => setDrawerTask(null)}
          onUpdate={(updated) => {
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
            setDrawerTask(updated);
          }}
          onDelete={(taskId) => {
            handleDelete(taskId);
            setDrawerTask(null);
          }}
        />
      )}
    </div>
  );
}
