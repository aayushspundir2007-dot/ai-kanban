import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const quickLogin = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)'}} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AcademiKan</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">AI-Powered Academic<br />Project Management</h2>
            <p className="text-violet-200 mt-3 text-lg">Kanban boards, AI insights, classroom tools — all in one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'AI Task Suggestions', icon: '🤖' },
              { label: 'Kanban Boards', icon: '📋' },
              { label: 'Google Classroom', icon: '🎓' },
              { label: 'Smart Analytics', icon: '📊' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm text-white font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-violet-300 text-sm">Manav Rachna University · Academic Excellence Platform</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AcademiKan</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span> : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '👨‍🎓 Student', email: 'student@demo.com', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: '👩‍🏫 Faculty', email: 'faculty@demo.com', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                { label: '⚙️ Admin', email: 'admin@demo.com', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                { label: '👩‍🎓 Student 2', email: 'student2@demo.com', color: 'bg-green-50 text-green-700 border-green-100' },
              ].map(d => (
                <button key={d.email} onClick={() => quickLogin(d.email)}
                  className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all hover:scale-105 ${d.color}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Click to fill · password: password123</p>
          </div>

          <p className="text-sm text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
