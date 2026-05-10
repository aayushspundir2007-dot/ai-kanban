import { useState } from 'react';
import { taskAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PriorityBadge from './PriorityBadge';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  XMarkIcon, CalendarIcon, ClockIcon, UserCircleIcon,
  ChatBubbleLeftIcon, TagIcon, CheckCircleIcon,
  ExclamationTriangleIcon, PencilIcon, TrashIcon
} from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  review: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export default function TaskDrawer({ task, onClose, onUpdate, onDelete, members = [] }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  const loadComments = async () => {
    if (commentsLoaded) return;
    setLoadingComments(true);
    try {
      const { data } = await commentAPI.get('task', task._id);
      setComments(data);
      setCommentsLoaded(true);
    } catch { /* skip */ }
    finally { setLoadingComments(false); }
  };

  useState(() => { loadComments(); }, [task._id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await commentAPI.create({ content: comment, taskId: task._id, type: 'comment' });
      setComments(prev => [...prev, data]);
      setComment('');
    } catch { toast.error('Failed to post comment'); }
    finally { setSubmitting(false); }
  };

  const changeStatus = async (status) => {
    try {
      const { data } = await taskAPI.update(task._id, { status });
      onUpdate(data);
      setEditingStatus(false);
      toast.success(`Moved to ${status.replace('_', ' ')}`);
    } catch { toast.error('Failed to update status'); }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
  const daysLeft = task.deadline
    ? Math.ceil((new Date(task.deadline) - new Date()) / 86400000)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[task.status]}`}>
                {task.status.replace('_', ' ')}
              </span>
              <PriorityBadge priority={task.priority} />
              {task.isAISuggested && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">🤖 AI</span>}
              {isOverdue && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚠ Overdue</span>}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{task.title}</h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
              <TrashIcon className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Blocker note */}
          {task.status === 'blocked' && task.blockerNote && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{task.blockerNote}</p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Deadline */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> Deadline</p>
              {task.deadline ? (
                <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {format(new Date(task.deadline), 'MMM d, yyyy')}
                  {daysLeft !== null && (
                    <span className={`block text-xs mt-0.5 ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                  )}
                </p>
              ) : <p className="text-sm text-gray-400">Not set</p>}
            </div>

            {/* Assigned to */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><UserCircleIcon className="w-3.5 h-3.5" /> Assigned to</p>
              <p className="text-sm font-medium text-gray-900">{task.assignedTo?.name || 'Unassigned'}</p>
            </div>

            {/* Time */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> Time</p>
              <p className="text-sm font-medium text-gray-900">
                {task.actualHours > 0 ? `${task.actualHours}h / ` : ''}{task.estimatedHours > 0 ? `${task.estimatedHours}h est.` : 'Not set'}
              </p>
            </div>

            {/* Story points */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Story Points</p>
              <p className="text-sm font-medium text-gray-900">{task.storyPoints || 1} pts</p>
            </div>
          </div>

          {/* Labels */}
          {task.labels?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5" /> Labels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map(l => (
                  <span key={l} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Change status */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Move to</p>
            <div className="flex flex-wrap gap-2">
              {['todo', 'in_progress', 'review', 'completed'].map(s => (
                <button key={s} onClick={() => changeStatus(s)}
                  disabled={task.status === s}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${task.status === s ? 'opacity-40 cursor-default border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 text-gray-600'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Time entries */}
          {task.timeEntries?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Time Log</p>
              <div className="space-y-1.5">
                {task.timeEntries.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-600">{e.note || 'Work session'}</span>
                    <span className="font-medium text-gray-900">{e.duration ? `${Math.round(e.duration / 60 * 10) / 10}h` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <ChatBubbleLeftIcon className="w-3.5 h-3.5" /> Comments {comments.length > 0 && `(${comments.length})`}
            </p>
            {loadingComments ? (
              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600" /></div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No comments yet</p>
            ) : (
              <div className="space-y-3 mb-3">
                {comments.map(c => (
                  <div key={c._id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                      {c.author?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900">{c.author?.name}</span>
                        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-gray-700">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={submitComment} className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <button type="submit" disabled={submitting || !comment.trim()}
                className="px-3 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
                Post
              </button>
            </form>
          </div>

          {/* Created at */}
          <p className="text-xs text-gray-300 text-center pb-2">
            Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
