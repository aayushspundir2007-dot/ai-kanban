import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contributionAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const gradeColors = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-700' };

export default function ContributionPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [matrix, setMatrix] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    Promise.all([projectAPI.getOne(projectId), contributionAPI.get(projectId)])
      .then(([p, c]) => { setProject(p.data); setMatrix(c.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const recalculate = async () => {
    setCalculating(true);
    try {
      const { data } = await contributionAPI.calculate(projectId);
      setMatrix(data);
      toast.success('Contribution matrix recalculated');
    } catch { toast.error('Failed to calculate'); }
    finally { setCalculating(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const barData = matrix.map(m => ({
    name: m.student?.name?.split(' ')[0] || 'Student',
    score: m.contributionScore,
    tasks: m.metrics?.cardsCompleted,
    hours: m.metrics?.totalHoursLogged
  }));

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="btn-ghost p-2"><ArrowLeftIcon className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contribution Matrix</h1>
            <p className="text-gray-500 text-sm">{project?.title}</p>
          </div>
        </div>
        {(user.role === 'faculty' || user.role === 'admin') && (
          <button onClick={recalculate} disabled={calculating} className="btn-primary">
            <ArrowPathIcon className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Recalculate'}
          </button>
        )}
      </div>

      {matrix.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No contribution data yet.</p>
          {(user.role === 'faculty' || user.role === 'admin') && (
            <button onClick={recalculate} className="btn-primary">Calculate Now</button>
          )}
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Team Contribution Scores</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Score" />
                <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks Done" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Individual cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {matrix.map(m => (
              <div key={m._id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      {m.student?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{m.student?.name}</p>
                      <p className="text-xs text-gray-500">{m.student?.department} · {m.student?.enrollmentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{m.contributionScore}<span className="text-sm text-gray-400">/100</span></div>
                    <span className={`badge ${gradeColors[m.suggestedGrade] || 'bg-gray-100 text-gray-600'}`}>
                      Grade: {m.suggestedGrade || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  {[
                    { label: 'Tasks Done', value: m.metrics?.cardsCompleted },
                    { label: 'Hours', value: `${m.metrics?.totalHoursLogged}h` },
                    { label: 'Team %', value: `${m.percentageOfTeam}%` },
                    { label: 'Created', value: m.metrics?.cardsCreated },
                    { label: 'Deliverables', value: m.metrics?.deliverablesUploaded },
                    { label: 'Blockers Fixed', value: m.metrics?.blockerResolutions }
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {m.metrics?.anomalyFlags > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-xs text-red-700">
                    ⚠️ {m.metrics.anomalyFlags} effort anomaly flag(s) detected
                  </div>
                )}

                {m.aiJustification && (
                  <div className="bg-primary-50 rounded-lg p-3 text-xs text-primary-800">
                    🤖 {m.aiJustification}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
