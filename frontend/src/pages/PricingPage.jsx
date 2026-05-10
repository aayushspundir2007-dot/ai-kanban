import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const FREE_FEATURES = [
  'Up to 3 projects',
  'Basic Kanban board',
  'Task management',
  'Comments & feedback',
  'Basic notifications'
];

const PREMIUM_FEATURES = [
  'Unlimited projects',
  'AI task suggestions',
  'Deadline risk prediction',
  'AI document generation (SRS, Abstract, Report)',
  'Smart reminders',
  'File uploads (10MB)',
  'Advanced analytics',
  'Priority support'
];

export default function PricingPage() {
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await subscriptionAPI.checkout();
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-gray-500 mt-3 text-lg">Choose the plan that fits your academic journey</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Free</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">Perfect for getting started</p>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {user ? (
              <Link to="/dashboard" className="btn-secondary w-full justify-center">
                {isPremium ? 'Downgrade' : 'Current Plan'}
              </Link>
            ) : (
              <Link to="/register" className="btn-secondary w-full justify-center">Get Started Free</Link>
            )}
          </div>

          {/* Premium Plan */}
          <div className="card p-8 border-2 border-primary-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" /> Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Premium</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-primary-600">$9</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">Full AI-powered experience</p>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckIcon className="w-4 h-4 text-primary-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {isPremium ? (
              <div className="btn-primary w-full justify-center opacity-75 cursor-default">Current Plan ✓</div>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Redirecting...' : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Secure payment powered by Stripe. Cancel anytime.
          {!user && <> · <Link to="/login" className="text-primary-600 hover:underline">Login</Link> to subscribe</>}
        </p>
      </div>
    </div>
  );
}
