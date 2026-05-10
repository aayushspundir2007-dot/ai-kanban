import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, activityAPI, projectAPI } from '../services/api';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import {
  FolderIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon,
  UsersIcon, ChartBarIcon, CalendarIcon, ArrowRightIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDashboard(),
      activityAPI.getAll(),
      projectAPI.getAll()
    ]).then(([s, a, p]) => {
      setStats(s.data);
      setActivity(a.data);
      setProjects(p.data?.projects || p.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1 capitalize">{user?.role} Dashboard · {user?.department || 'University'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin' ? (
          <>
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={UsersIcon} color="blue" />
            <StatCard title="Total Projects" value={stats?.totalProjects ?? 0} icon={FolderIcon} color="purple" />
            <StatCard title="Total Tasks" value={stats?.totalTasks ?? 0} icon={CheckCircleIcon} color="green" />
            <StatCard title="Pending Approvals" value={stats?.projectsByStatus?.find(s => s._id === 'active')?.count ?? 0} icon={ClockIcon} color="yellow" />
          </>
        ) : user?.role === 'faculty' ? (
          <>
            <StatCard title="My Projects" value={stats?.totalProjects ?? 0} icon={FolderIcon} color="blue" />
            <StatCard title="Active Projects" value={stats?.activeProjects ?? 0} icon={ChartBarIcon} color="green" />
            <StatCard title="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={ClockIcon} color="yellow" />
            <StatCard title="Total Tasks" value={stats?.totalTasks ?? 0} icon={CheckCircleIcon} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="My Projects" value={stats?.totalProjects ?? 0} icon={FolderIcon} color="blue" />
            <StatCard title="Completed" value={stats?.completedProjects ?? 0} icon={CheckCircleIcon} color="green" />
            <StatCard title="Overdue Tasks" value={stats?.overdueTasks ?? 0} icon={ExclamationTriangleIcon} color="red" />
            <StatCard title="Avg Progress" value={`${stats?.avgProgress ?? 0}%`} icon={ChartBarIcon} color="purple" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Deadline Countdowns */}
        {projects.filter(p => p.deadline && p.status === 'active').length > 0 && (
          <div className="card p-5 lg:col-span-3">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-violet-500" /> Upcoming Deadlines
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects
                .filter(p => p.deadline && p.status === 'active')
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .slice(0, 6)
                .map(p => {
                  const days = differenceInDays(new Date(p.deadline), new Date());
                  const urgent = days <= 3;
                  const warning = days <= 7;
                  return (
                    <Link key={p._id} to={`/projects/${p._id}`}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:shadow-sm ${urgent ? 'bg-red-50 border-red-200' : warning ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                        <p className={`text-xs mt-0.5 ${urgent ? 'text-red-600 font-semibold' : warning ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `${days}d left`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Progress</p>
                          <p className="text-sm font-bold text-gray-900">{p.progress || 0}%</p>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/projects" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <FolderIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View Projects</p>
                <p className="text-xs text-gray-500">Manage your projects</p>
              </div>
            </Link>
            {user?.role === 'student' && (
              <Link to="/projects?new=true" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Project</p>
                  <p className="text-xs text-gray-500">Start a new project</p>
                </div>
              </Link>
            )}
            <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <ChartBarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Analytics</p>
                <p className="text-xs text-gray-500">View performance metrics</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 8).map(log => (
                <div key={log._id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                    {log.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{log.user?.name}</span> {log.action}
                      {log.details && <span className="text-gray-500"> — {log.details}</span>}
                    </p>
                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
