import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import StatCard from '../components/StatCard';
import { FolderIcon, UsersIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const projectStatusData = stats?.projectsByStatus?.map(s => ({
    name: s._id, value: s.count
  })) || [];

  const userRoleData = stats?.usersByRole?.map(r => ({
    name: r._id, value: r.count
  })) || [];

  const monthlyData = stats?.monthlyProjects?.map(m => ({
    name: `${m._id.month}/${m._id.year}`,
    projects: m.count
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Performance metrics and insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin' ? (
          <>
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={UsersIcon} color="blue" />
            <StatCard title="Total Projects" value={stats?.totalProjects ?? 0} icon={FolderIcon} color="purple" />
            <StatCard title="Total Tasks" value={stats?.totalTasks ?? 0} icon={CheckCircleIcon} color="green" />
            <StatCard title="Active Projects" value={stats?.projectsByStatus?.find(s => s._id === 'active')?.count ?? 0} icon={ClockIcon} color="yellow" />
          </>
        ) : user?.role === 'faculty' ? (
          <>
            <StatCard title="My Projects" value={stats?.totalProjects ?? 0} icon={FolderIcon} color="blue" />
            <StatCard title="Active" value={stats?.activeProjects ?? 0} icon={CheckCircleIcon} color="green" />
            <StatCard title="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={ClockIcon} color="yellow" />
            <StatCard title="Total Tasks" value={stats?.totalTasks ?? 0} icon={CheckCircleIcon} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="My Projects" value={stats?.totalProjects ?? 0} icon={FolderIcon} color="blue" />
            <StatCard title="Completed" value={stats?.completedProjects ?? 0} icon={CheckCircleIcon} color="green" />
            <StatCard title="Overdue Tasks" value={stats?.overdueTasks ?? 0} icon={ClockIcon} color="red" />
            <StatCard title="Avg Progress" value={`${stats?.avgProgress ?? 0}%`} icon={FolderIcon} color="purple" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Project Status Pie */}
        {projectStatusData.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Projects by Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {projectStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Users by Role (admin only) */}
        {user?.role === 'admin' && userRoleData.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Users by Role</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userRoleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Projects (admin only) */}
        {user?.role === 'admin' && monthlyData.length > 0 && (
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4">Projects Created Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="projects" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Student task breakdown */}
        {user?.role === 'student' && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Task Breakdown</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Total', value: stats?.totalTasks ?? 0 },
                { name: 'Completed', value: stats?.completedTasks ?? 0 },
                { name: 'Overdue', value: stats?.overdueTasks ?? 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Activity (admin) */}
      {user?.role === 'admin' && stats?.recentActivity?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent System Activity</h2>
          <div className="space-y-3">
            {stats.recentActivity.map(log => (
              <div key={log._id} className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                  {log.user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-gray-700"><span className="font-medium">{log.user?.name}</span> {log.action}</span>
                <span className="text-gray-400 ml-auto text-xs">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
