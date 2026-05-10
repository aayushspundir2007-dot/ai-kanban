import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    notificationAPI.getAll().then(({ data }) => setNotifications(data)).catch(() => {});
    const interval = setInterval(() => {
      notificationAPI.getAll().then(({ data }) => setNotifications(data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const typeColors = {
    deadline_reminder: 'bg-red-100 text-red-700',
    feedback: 'bg-blue-100 text-blue-700',
    approval: 'bg-green-100 text-green-700',
    task_update: 'bg-purple-100 text-purple-700',
    system: 'bg-gray-100 text-gray-700',
    ai_suggestion: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <BellIcon className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">No notifications</p>
            ) : notifications.map(n => (
              <div key={n._id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start gap-2">
                  <span className={`badge mt-0.5 ${typeColors[n.type] || 'bg-gray-100 text-gray-700'}`}>
                    {n.type.replace('_', ' ')}
                  </span>
                  {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-100">
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-primary-600 hover:underline">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
