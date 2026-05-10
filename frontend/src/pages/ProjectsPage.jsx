import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700'
};

const approvalColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revision_needed: 'bg-orange-100 text-orange-700'
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(searchParams.get('new') === 'true');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'software', deadline: '', tags: '', facultyId: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    projectAPI.getAll({ search, status: filterStatus })
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, filterStatus]);
  useEffect(() => { userAPI.getFaculty().then(({ data }) => setFaculty(data)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      await projectAPI.create(payload);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ title: '', description: '', type: 'software', deadline: '', tags: '', facultyId: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'student' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search projects..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FunnelIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No projects found</p>
          {user?.role === 'student' && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Create your first project</button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{project.type}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <span className={`badge ${statusColors[project.status]}`}>{project.status}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description || 'No description'}</p>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{project.taskCount || 0} tasks</span>
                </div>
                <ProgressBar value={project.progress || 0} />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>By {project.owner?.name}</span>
                {project.deadline && <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>}
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge ${approvalColors[project.approvalStatus]}`}>{project.approvalStatus}</span>
                <div className="flex-1" />
                <Link to={`/projects/${project._id}/kanban`} className="btn-secondary text-xs py-1.5 px-3">
                  Kanban
                </Link>
                <Link to={`/projects/${project._id}`} className="btn-primary text-xs py-1.5 px-3">
                  <EyeIcon className="w-3.5 h-3.5" />
                </Link>
                {(user?.role === 'admin' || project.owner?._id === user?._id) && (
                  <button onClick={() => handleDelete(project._id)} className="btn-ghost text-red-500 text-xs py-1.5 px-2">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Project Title *</label>
            <input className="input" placeholder="My Research Project" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Brief description..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Project Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="software">Software</option>
                <option value="research">Research</option>
                <option value="hardware">Hardware</option>
                <option value="design">Design</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="input" value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Assign Faculty Supervisor</label>
            <select className="input" value={form.facultyId} onChange={e => setForm({ ...form, facultyId: e.target.value })}>
              <option value="">Select faculty (optional)</option>
              {faculty.map(f => (
                <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" placeholder="AI, Machine Learning, Web" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
