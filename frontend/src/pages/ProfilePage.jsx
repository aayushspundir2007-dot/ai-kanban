import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, setUser, isPremium } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', enrollmentId: user?.enrollmentId || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      setUser(data.user);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setChangingPw(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Profile Info */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge bg-primary-100 text-primary-700 capitalize">{user?.role}</span>
              {isPremium && (
                <span className="badge bg-yellow-100 text-yellow-700 flex items-center gap-1">
                  <ShieldCheckIcon className="w-3 h-3" /> Premium
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <input className="input" placeholder="CSE, ECE..." value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label">{user?.role === 'student' ? 'Enrollment ID' : 'Employee ID'}</label>
              <input className="input" value={form.enrollmentId}
                onChange={e => setForm({ ...form, enrollmentId: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={changingPw}>
            {changingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Subscription Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Subscription</h2>
        <div className={`p-4 rounded-lg ${isPremium ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
          <p className="font-medium text-gray-900">{isPremium ? '⭐ Premium Plan' : '🆓 Free Plan'}</p>
          <p className="text-sm text-gray-500 mt-1">
            {isPremium
              ? 'You have access to all AI features, file uploads, and advanced analytics.'
              : 'Upgrade to Premium for AI task suggestions, deadline risk prediction, document generation, and more.'}
          </p>
          {!isPremium && (
            <a href="/pricing" className="btn-primary mt-3 inline-flex text-sm">Upgrade to Premium</a>
          )}
        </div>
      </div>
    </div>
  );
}
