import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { healthAPI, projectAPI } from '../services/api';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';

export default function HealthPage() {
  const { id: projectId } = useParams();
  const [health, setHealth] = useState(null);
  const [burndown, setBurndown] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [p, h, b] = await Promise.all([
        projectAPI.getOne(projectId),
        healthAPI.getScore(projectId),
        healthAPI.getBurndown(projectId)
      ]);
      setProject(p.data);
      setHealth(h.data);
      setBurndown(b.data);
    } catch { toast.error('Failed to load health data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [projectId]);

  const scoreColor = (s) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';
  const scoreBg = (s) => s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-yellow-50 border-yellow-200' : s >= 40 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="btn-ghost p-2"><ArrowLeftIcon className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Health</h1>
            <p className="text-gray-500 text-sm">{project?.title}</p>
          </div>
        </div>
        <button onClick={load} className="btn-secondary"><ArrowPathIcon className="w-4 h-4" /> Refresh</button>
      </div>

      {health && (
        <>
          {/* Health Score */}
          <div className={`card p-6 border-2 ${scoreBg(health.healthScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Project Health Score</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-5xl font-bold" style={{ color: scoreColor(health.healthScore) }}>
                    {health.healthScore}
                  </span>
                  <span className="text-gray-400 text-xl mb-1">/100</span>
                </div>
              </div>
              <div className="w-24 h-24 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={scoreColor(health.healthScore)} strokeWidth="3"
                    strokeDasharray={`${health.healthScore} 100`} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Task Velocity', value: health.breakdown?.taskVelocity, icon: '⚡' },
              { label: 'Blocker Resolution', value: health.breakdown?.blockerResolutionTime, icon: '🔓' },
              { label: 'Communication', value: health.breakdown?.communicationScore, icon: '💬' },
              { label: 'On-Time Rate', value: health.breakdown?.onTimeRate, icon: '⏰' }
            ].map(({ label, value, icon }) => (
              <div key={label} className="card p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-2xl font-bold text-gray-900">{value ?? 0}<span className="text-sm text-gray-400">%</span></div>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, backgroundColor: scoreColor(value ?? 0) }} />
                </div>
              </div>
            ))}
          </div>

          {/* Risks */}
          {health.risks?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Risk Flags</h2>
              <div className="space-y-2">
                {health.risks.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${r.level === 'high' ? 'bg-red-50 border border-red-200' : r.level === 'medium' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <span className={`badge ${r.level === 'high' ? 'bg-red-100 text-red-700' : r.level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.level}
                    </span>
                    <p className="text-sm text-gray-700">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Burndown Chart */}
      {burndown?.data?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Burndown Chart</h2>
          <p className="text-xs text-gray-500 mb-3">Total story points: {burndown.totalPoints} · {burndown.totalDays} days</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={burndown.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis />
              <Tooltip labelFormatter={d => `Date: ${d}`} />
              <ReferenceLine y={0} stroke="#666" />
              <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} dot={false} name="Planned" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-slate-400 inline-block" style={{ borderTop: '2px dashed' }} /> Planned</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-blue-500 inline-block" /> Actual</span>
          </div>
        </div>
      )}
    </div>
  );
}
