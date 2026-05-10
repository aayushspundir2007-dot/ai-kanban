import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', enrollmentId: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AcademiKan</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@university.edu" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 6 characters" value={form.password}
                onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty / Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Department</label>
                <input className="input" placeholder="CSE, ECE..." value={form.department}
                  onChange={e => set('department', e.target.value)} />
              </div>
              <div>
                <label className="label">{form.role === 'student' ? 'Enrollment ID' : 'Employee ID'}</label>
                <input className="input" placeholder="ID..." value={form.enrollmentId}
                  onChange={e => set('enrollmentId', e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
