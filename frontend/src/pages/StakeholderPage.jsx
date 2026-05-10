import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stakeholderAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, LinkIcon, TrashIcon, PlusIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function StakeholderPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [project, setProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ label: '', canComment: false, expiresInDays: 30 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectAPI.getOne(projectId), stakeholderAPI.listTokens(projectId)])
      .then(([p, t]) => { setProject(p.data); setTokens(t.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const createToken = async (e) => {
    e.preventDefault();
    try {
      const { data } = await stakeholderAPI.createToken({ projectId, ...form });
      setTokens(prev => [data.token, ...prev]);
      toast.success('Share link created!');
      navigator.clipboard.writeText(data.shareUrl);
      toast.success('Link copied to clipboard');
      setShowModal(false);
    } catch { toast.error('Failed to create link'); }
  };

  const revokeToken = async (id) => {
    if (!confirm('Revoke this access link?')) return;
    await stakeholderAPI.revokeToken(id);
    setTokens(prev => prev.filter(t => t._id !== id));
    toast.success('Link revoked');
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/stakeholder/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="btn-ghost p-2"><ArrowLeftIcon className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stakeholder Portal</h1>
            <p className="text-gray-500 text-sm">{project?.title}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Create Share Link
        </button>
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Share secure links with external mentors, NGO supervisors, or industry partners.
          They can view your project board and approve specific tasks — no university login required.
        </p>
      </div>

      {tokens.length === 0 ? (
        <div className="card p-12 text-center">
          <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No share links created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map(t => (
            <div key={t._id} className={`card p-4 ${!t.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{t.label}</p>
                    <span className={`badge ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {format(new Date(t.expiresAt), 'MMM d, yyyy')}
                    {t.lastAccessedAt && ` · Last accessed: ${format(new Date(t.lastAccessedAt), 'MMM d')}`}
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    {t.permissions?.canView && <span>👁 View</span>}
                    {t.permissions?.canComment && <span>💬 Comment</span>}
                    {t.permissions?.canApprove?.length > 0 && <span>✅ Approve {t.permissions.canApprove.length} task(s)</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {t.isActive && (
                    <button onClick={() => copyLink(t.token)} className="btn-secondary text-xs py-1.5 px-3">
                      <ClipboardDocumentIcon className="w-3.5 h-3.5" /> Copy Link
                    </button>
                  )}
                  <button onClick={() => revokeToken(t._id)} className="btn-ghost text-red-500 text-xs py-1.5 px-2">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Stakeholder Link" size="sm">
        <form onSubmit={createToken} className="space-y-4">
          <div>
            <label className="label">Stakeholder Label</label>
            <input className="input" placeholder="e.g. NGO Supervisor, Industry Mentor" value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div>
            <label className="label">Expires In (days)</label>
            <input type="number" className="input" value={form.expiresInDays} min={1} max={365}
              onChange={e => setForm({ ...form, expiresInDays: parseInt(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="canComment" checked={form.canComment}
              onChange={e => setForm({ ...form, canComment: e.target.checked })} />
            <label htmlFor="canComment" className="text-sm text-gray-700">Allow commenting</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Create & Copy Link</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
