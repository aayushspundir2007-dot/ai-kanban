import { useState, useEffect, useRef } from 'react';
import { meetingAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon, PlusIcon, TrashIcon, LinkIcon,
  CalendarIcon, ClockIcon, UserGroupIcon, XMarkIcon,
  PlayIcon, CheckCircleIcon, VideoCameraSlashIcon
} from '@heroicons/react/24/outline';
import { format, isPast, isToday } from 'date-fns';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600'
};

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // meeting in video call
  const [form, setForm] = useState({
    title: '', description: '', scheduledAt: '', duration: 60,
    meetLink: '', participants: []
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [mRes, uRes] = await Promise.all([meetingAPI.getAll(), userAPI.getAll()]);
      setMeetings(mRes.data);
      setUsers(uRes.data?.users || uRes.data || []);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await meetingAPI.create(form);
      toast.success('Meeting scheduled');
      setShowForm(false);
      setForm({ title: '', description: '', scheduledAt: '', duration: 60, meetLink: '', participants: [] });
      fetchAll();
    } catch { toast.error('Failed to create meeting'); }
  }

  async function handleStatus(id, status) {
    try {
      await meetingAPI.update(id, { status });
      setMeetings(prev => prev.map(m => m._id === id ? { ...m, status } : m));
      toast.success(`Meeting marked as ${status}`);
    } catch { toast.error('Update failed'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this meeting?')) return;
    try {
      await meetingAPI.delete(id);
      setMeetings(prev => prev.filter(m => m._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  }

  const upcoming = meetings.filter(m => m.status === 'scheduled' || m.status === 'ongoing');
  const past = meetings.filter(m => m.status === 'completed' || m.status === 'cancelled');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and join video meetings</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium">
          <PlusIcon className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming & Ongoing</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <VideoCameraIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No upcoming meetings. Schedule one!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(m => <MeetingCard key={m._id} meeting={m} user={user}
              onDelete={handleDelete} onStatus={handleStatus} onJoin={() => setActiveCall(m)} />)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Meetings</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map(m => <MeetingCard key={m._id} meeting={m} user={user}
              onDelete={handleDelete} onStatus={handleStatus} onJoin={() => setActiveCall(m)} />)}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">Schedule Meeting</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Sprint Review, Project Sync..." />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Agenda or notes..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date & Time *</label>
                  <input required type="datetime-local" value={form.scheduledAt}
                    onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                  <input type="number" value={form.duration} min={15} max={480}
                    onChange={e => setForm({ ...form, duration: +e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Meeting Link (optional)</label>
                <input value={form.meetLink} onChange={e => setForm({ ...form, meetLink: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="https://meet.google.com/... or leave blank for built-in" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {activeCall && (
        <VideoCallModal meeting={activeCall} onClose={() => setActiveCall(null)} />
      )}
    </div>
  );
}

function MeetingCard({ meeting, user, onDelete, onStatus, onJoin }) {
  const isHost = meeting.host?._id === user?._id || meeting.host === user?._id;
  const scheduled = new Date(meeting.scheduledAt);
  const todayMeeting = isToday(scheduled);
  const past = isPast(scheduled) && meeting.status === 'scheduled';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{meeting.title}</h3>
          {meeting.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{meeting.description}</p>}
        </div>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[meeting.status]}`}>
          {meeting.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarIcon className="w-3.5 h-3.5" />
          {format(scheduled, 'MMM d, yyyy')}
          {todayMeeting && <span className="text-violet-600 font-medium">Today</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ClockIcon className="w-3.5 h-3.5" />
          {format(scheduled, 'h:mm a')} · {meeting.duration} min
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <UserGroupIcon className="w-3.5 h-3.5" />
          Hosted by {meeting.host?.name || 'You'}
        </div>
      </div>

      <div className="flex gap-2">
        {/* Join / Open link */}
        {meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
          meeting.meetLink ? (
            <a href={meeting.meetLink} target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 transition-colors">
              <LinkIcon className="w-3.5 h-3.5" /> Open Link
            </a>
          ) : (
            <button onClick={onJoin}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 transition-colors">
              <VideoCameraIcon className="w-3.5 h-3.5" /> Join Call
            </button>
          )
        )}

        {/* Host controls */}
        {isHost && meeting.status === 'scheduled' && (
          <button onClick={() => onStatus(meeting._id, 'completed')}
            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors" title="Mark complete">
            <CheckCircleIcon className="w-4 h-4" />
          </button>
        )}
        {isHost && (
          <button onClick={() => onDelete(meeting._id)}
            className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function VideoCallModal({ meeting, onClose }) {
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, []);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
    } catch (err) {
      setError('Camera/mic access denied. Please allow permissions and try again.');
    }
  }

  function stopStream() {
    stream?.getTracks().forEach(t => t.stop());
  }

  function toggleMic() {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  }

  function toggleCam() {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold text-white">{meeting.title}</h3>
            <p className="text-xs text-gray-400">In-browser video call (local preview)</p>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Video area */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {error ? (
            <div className="text-center p-8">
              <VideoCameraSlashIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          ) : (
            <>
              <video ref={localVideoRef} autoPlay muted playsInline
                className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`} />
              {!camOn && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-white text-3xl font-bold">
                    {meeting.host?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <p className="text-gray-400 text-sm">Camera off</p>
                </div>
              )}
              {/* Live badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-5 py-4">
          <button onClick={toggleMic}
            className={`p-3 rounded-full transition-colors ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white'}`}
            title={micOn ? 'Mute' : 'Unmute'}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {micOn
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              }
            </svg>
          </button>

          <button onClick={toggleCam}
            className={`p-3 rounded-full transition-colors ${camOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white'}`}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}>
            {camOn ? <VideoCameraIcon className="w-5 h-5" /> : <VideoCameraSlashIcon className="w-5 h-5" />}
          </button>

          <button onClick={handleClose}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors">
            Leave Call
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 pb-4">
          This is a local preview. For multi-user calls, add a meeting link (Google Meet, Zoom, etc.)
        </p>
      </div>
    </div>
  );
}
