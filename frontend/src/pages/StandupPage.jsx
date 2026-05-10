import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { standupAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function StandupPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [standups, setStandups] = useState([]);
  const [form, setForm] = useState({ didLastWeek: '', nextSteps: '', blockers: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectAPI.getOne(projectId),
      standupAPI.getPrompt(projectId),
      user.role !== 'student' ? standupAPI.getProject(projectId) : standupAPI.getMy(projectId)
    ]).then(([p, pr, s]) => {
      setProject(p.data);
      setPrompt(pr.data);
      setStandups(s.data);
    }).finally(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await standupAPI.submit({ projectId, answers: form });
      toast.success('Standup submitted! AI is analyzing your report...');
      setPrompt(prev => ({ ...prev, submitted: true }));
      setForm({ didLastWeek: '', nextSteps: '', blockers: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={`/projects/${projectId}/kanban`} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Standup</h1>
          <p className="text-gray-500 text-sm">{project?.title} · Week {prompt?.week}</p>
        </div>
      </div>

      {/* Student: Submit form */}
      {user.role === 'student' && (
        <div className="card p-6">
          {prompt?.submitted ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Standup submitted for Week {prompt.week}</h3>
              <p className="text-gray-500 text-sm mt-1">Veronica is analyzing your report against board activity...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm font-medium text-gray-700">Week {prompt?.week} standup — takes 2 minutes</p>
              </div>
              <div>
                <label className="label text-base">1. What did you accomplish this week? 🎯</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="Describe what tasks you completed, code you wrote, research you did..."
                  value={form.didLastWeek} onChange={e => setForm({ ...form, didLastWeek: e.target.value })} required />
              </div>
              <div>
                <label className="label text-base">2. What are your next steps? 🚀</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="What will you work on next week? Be specific..."
                  value={form.nextSteps} onChange={e => setForm({ ...form, nextSteps: e.target.value })} required />
              </div>
              <div>
                <label className="label text-base">3. Any blockers or challenges? 🚫</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="Anything blocking your progress? Type 'None' if all clear..."
                  value={form.blockers} onChange={e => setForm({ ...form, blockers: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Weekly Standup'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Faculty: View all standups */}
      {user.role !== 'student' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Team Standup Reports — Week {prompt?.week}</h2>
          {standups.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">No standups submitted yet this week</div>
          ) : standups.map(s => (
            <div key={s._id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {s.student?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.student?.name}</p>
                    <p className="text-xs text-gray-500">{s.student?.department} · {format(new Date(s.submittedAt), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.discrepancyFlags?.length > 0 && (
                    <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-3 h-3" /> {s.discrepancyFlags.length} flag(s)
                    </span>
                  )}
                  <span className={`badge ${s.sentimentScore > 0.2 ? 'bg-green-100 text-green-700' : s.sentimentScore < -0.2 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.sentimentScore > 0.2 ? '😊 Positive' : s.sentimentScore < -0.2 ? '😟 Stressed' : '😐 Neutral'}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Did last week</p>
                  <p className="text-sm text-gray-700">{s.answers?.didLastWeek}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Next steps</p>
                  <p className="text-sm text-gray-700">{s.answers?.nextSteps}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Blockers</p>
                  <p className="text-sm text-gray-700">{s.answers?.blockers}</p>
                </div>
              </div>

              {/* Board snapshot */}
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                <span>✅ {s.boardMovementSnapshot?.tasksCompleted} completed</span>
                <span>🔄 {s.boardMovementSnapshot?.tasksMovedToProgress} in progress</span>
                <span>⏱ {s.boardMovementSnapshot?.totalHoursLogged?.toFixed(1)}h logged</span>
              </div>

              {/* AI Summary */}
              {s.aiSummary && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary-700 mb-1">🤖 Veronica's Analysis</p>
                  <p className="text-sm text-primary-800">{s.aiSummary}</p>
                  {s.discrepancyFlags?.map((f, i) => (
                    <p key={i} className="text-xs text-red-600 mt-1">⚠️ {f}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
