import { useEffect, useState } from 'react';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

const typeColors = {
  deadline_reminder: 'bg-red-100 text-red-700',
  feedback: 'bg-blue-100 text-blue-700',
  approval: 'bg-green-100 text-green-700',
  task_update: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
  ai_suggestion: 'bg-yellow-100 text-yellow-700'
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationAPI.getAll().then(({ data }) => setNotifications(data)).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const deleteNotif = async (id) => {
    await notificationAPI.delete(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckIcon className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n._id} className={`card p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-4 border-l-primary-500' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${typeColors[n.type] || 'bg-gray-100 text-gray-700'}`}>
                    {n.type.replace(/_/g, ' ')}
                  </span>
                  {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
                <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              <button onClick={() => deleteNotif(n._id)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 flex-shrink-0">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
