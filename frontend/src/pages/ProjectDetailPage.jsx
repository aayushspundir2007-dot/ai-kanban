import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectAPI, commentAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ChatBubbleLeftIcon,
  CheckBadgeIcon, XCircleIcon, ArrowTopRightOnSquareIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      projectAPI.getOne(id),
      commentAPI.get('project', id),
      analyticsAPI.getProject(id)
    ]).then(([p, c, a]) => {
      setProject(p.data);
      setComments(c.data);
      setAnalytics(a.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await commentAPI.create({ content: newComment, projectId: id, type: 'comment' });
      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch { toast.error('Failed to post comment'); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (status) => {
    try {
      await projectAPI.approve(id, { status });
      setProject(prev => ({ ...prev, approvalStatus: status }));
      toast.success(`Project ${status}`);
    } catch { toast.error('Failed to update approval'); }
  };

  const generateDoc = async (docType) => {};
  const loadRisk = async () => {};

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!project) return <p className="text-center text-gray-500 py-12">Project not found</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-primary-100 text-primary-700 capitalize">{project.type}</span>
              <span className={`badge ${project.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : project.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {project.approvalStatus}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-500 mt-1">{project.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags?.map(tag => (
                <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
              ))}
            </div>
          </div>
          <Link to={`/projects/${id}/kanban`} className="btn-primary flex-shrink-0">
            <ArrowTopRightOnSquareIcon className="w-4 h-4" /> Open Kanban
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-gray-500">Owner</p><p className="font-medium">{project.owner?.name}</p></div>
          <div><p className="text-gray-500">Supervisor</p><p className="font-medium">{project.faculty?.name || 'Not assigned'}</p></div>
          <div><p className="text-gray-500">Deadline</p><p className="font-medium">{project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'Not set'}</p></div>
          <div><p className="text-gray-500">Status</p><p className="font-medium capitalize">{project.status}</p></div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Overall Progress</span>
            <span>{project.progress || 0}%</span>
          </div>
          <ProgressBar value={project.progress || 0} size="lg" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Comments + Approval */}
        <div className="lg:col-span-2 space-y-6">
          {/* Faculty Approval */}
          {(user?.role === 'faculty' || user?.role === 'admin') && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Approval Actions</h2>
              <div className="flex gap-2">
                <button onClick={() => handleApprove('approved')} className="btn bg-green-600 text-white hover:bg-green-700 flex-1 justify-center">
                  <CheckBadgeIcon className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleApprove('revision_needed')} className="btn bg-yellow-500 text-white hover:bg-yellow-600 flex-1 justify-center">
                  Needs Revision
                </button>
                <button onClick={() => handleApprove('rejected')} className="btn-danger flex-1 justify-center">
                  <XCircleIcon className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5" /> Comments & Feedback
            </h2>
            <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
              ) : comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                    {c.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{c.author?.name}</span>
                      <span className="badge bg-gray-100 text-gray-500 capitalize">{c.author?.role}</span>
                      <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={submitComment} className="flex gap-2">
              <input className="input flex-1" placeholder="Add a comment..." value={newComment}
                onChange={e => setNewComment(e.target.value)} />
              <button type="submit" className="btn-primary" disabled={submitting}>Post</button>
            </form>
          </div>
        </div>

        {/* Right: AI + Analytics */}
        <div className="space-y-4">
          {/* Task Stats */}
          {analytics && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Task Overview</h2>
              <div className="space-y-2">
                {Object.entries(analytics.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm font-medium">
                  <span>Total</span><span>{analytics.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Features */}
          {/* Files */}
          {project.files?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <PaperClipIcon className="w-5 h-5" /> Files
              </h2>
              <div className="space-y-2">
                {project.files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                    <PaperClipIcon className="w-4 h-4" /> {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
