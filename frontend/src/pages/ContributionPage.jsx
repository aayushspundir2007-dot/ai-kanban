import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contributionAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, ArrowPathIcon, ClockIcon,
  CheckCircleIcon, UserGroupIcon, TrophyIcon
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  C: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  F: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const BAR_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function ContributionPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [matrix, setMatrix] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    Promise.all([projectAPI.getOne(projectId), contributionAPI.get(projectId)])
      .then(([p, c]) => {
        setProject(p.data);
        setMatrix(c.data.sort((a, b) => b.contributionScore - a.contributionScore));
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const recalculate = async () => {
    setCalculating(true);
    try {
      const { data } = await contributionAPI.calculate(projectId);
      setMatrix(data.sort((a, b) => b.contributionScore - a.contributionScore));
      toast.success('Contribution recalculated');
    } catch { toast.error('Failed to calculate'); }
    finally { setCalculating(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
    </div>
  );

  const barData = matrix.map(m => ({
    name: m.student?.name?.split(' ')[0] || 'Member',
    Score: m.contributionScore,
    Tasks: m.metrics?.cardsCompleted || 0,
    Hours: m.metrics?.totalHoursLogged || 0,
  }));

  const pieData = matrix.map(m => ({
    name: m.student?.name?.split(' ')[0] || 'Member',
    value: m.percentageOfTeam || 0,
  }));

  const totalTasks = matrix.reduce((s, m) => s + (m.metrics?.cardsCompleted || 0), 0);
  const totalHours = matrix.reduce((s, m) => s + (m.metrics?.totalHoursLogged || 0), 0);

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="btn-ghost p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contribution Matrix</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{project?.title}</p>
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
          <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No contribution data yet.</p>
          {(user.role === 'faculty' || user.role === 'admin') ? (
            <button onClick={recalculate} disabled={calculating} className="btn-primary">
              {calculating ? 'Calculating...' : 'Calculate Now'}
            </button>
          ) : (
            <p className="text-sm text-gray-400">Ask your faculty to calculate contributions.</p>
          )}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <UserGroupIcon className="w-6 h-6 text-violet-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{matrix.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contributors</p>
            </div>
            <div className="card p-4 text-center">
              <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
            </div>
            <div className="card p-4 text-center">
              <ClockIcon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalHours}h</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Hours</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Contribution Scores</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Share (%)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" /> Contributor Leaderboard
            </h2>
            <div className="space-y-3">
              {matrix.map((m, idx) => (
                <div key={m._id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {/* Rank */}
                  <div className="text-2xl w-8 text-center flex-shrink-0">
                    {RANK_ICONS[idx] || <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold flex-shrink-0">
                    {m.student?.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{m.student?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.student?.department}</p>
                  </div>

                  {/* Metrics */}
                  <div className="hidden sm:flex items-center gap-4 text-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.metrics?.cardsCompleted || 0}</p>
                      <p className="text-xs text-gray-400">Tasks</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.metrics?.totalHoursLogged || 0}h</p>
                      <p className="text-xs text-gray-400">Hours</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.percentageOfTeam || 0}%</p>
                      <p className="text-xs text-gray-400">Share</p>
                    </div>
                  </div>

                  {/* Score + Grade */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{m.contributionScore}<span className="text-xs text-gray-400">/100</span></p>
                    <span className={`badge text-xs ${GRADE_COLORS[m.suggestedGrade] || 'bg-gray-100 text-gray-600'}`}>
                      {m.suggestedGrade || 'N/A'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="hidden md:block w-24">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                        style={{ width: `${m.contributionScore}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            {matrix.map(m => (
              <div key={m._id} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm">
                    {m.student?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{m.student?.name}</p>
                    <p className="text-xs text-gray-400">{m.student?.enrollmentId}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{m.contributionScore}/100</p>
                    <p className="text-xs text-gray-400">{m.percentageOfTeam}% of team</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Completed', value: m.metrics?.cardsCompleted || 0 },
                    { label: 'Created', value: m.metrics?.cardsCreated || 0 },
                    { label: 'Hours', value: `${m.metrics?.totalHoursLogged || 0}h` },
                    { label: 'On Time', value: m.metrics?.onTimeDeliveries || 0 },
                    { label: 'Comments', value: m.metrics?.commentsMade || 0 },
                    { label: 'Blockers', value: m.metrics?.blockerResolutions || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {m.metrics?.anomalyFlags > 0 && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                    ⚠️ {m.metrics.anomalyFlags} anomaly flag(s) detected
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
