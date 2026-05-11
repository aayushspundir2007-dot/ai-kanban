import { Link } from 'react-router-dom';
import {
  SparklesIcon, ChartBarIcon, UserGroupIcon, VideoCameraIcon,
  ClipboardDocumentListIcon, ShieldCheckIcon, ArrowRightIcon,
  CheckIcon, StarIcon, AcademicCapIcon, BoltIcon
} from '@heroicons/react/24/outline';

const features = [
  { icon: ClipboardDocumentListIcon, title: 'Kanban Boards', desc: 'Drag-and-drop task management with priorities, deadlines, blockers, and time tracking.', color: 'bg-violet-100 text-violet-600' },
  { icon: ChartBarIcon, title: 'Smart Analytics', desc: 'Project health scores, burndown charts, contribution matrix, and engagement heatmaps.', color: 'bg-blue-100 text-blue-600' },
  { icon: UserGroupIcon, title: 'Team Collaboration', desc: 'Group formation, standup reports, stakeholder portals, and real-time notifications.', color: 'bg-green-100 text-green-600' },
  { icon: VideoCameraIcon, title: 'Meetings & Video', desc: 'Schedule meetings with built-in browser video calls or external links.', color: 'bg-pink-100 text-pink-600' },
  { icon: AcademicCapIcon, title: 'Classroom Tools', desc: 'Assignments, submissions, grading, quizzes, announcements, and whiteboards.', color: 'bg-orange-100 text-orange-600' },
  { icon: ShieldCheckIcon, title: 'Role-Based Access', desc: 'Separate dashboards for students, faculty, and admins with fine-grained permissions.', color: 'bg-teal-100 text-teal-600' },
];

const stats = [
  { value: '3', label: 'User Roles' },
  { value: '20+', label: 'Features' },
  { value: '100%', label: 'Free to Try' },
  { value: '∞', label: 'Projects' },
];

const steps = [
  { step: '01', title: 'Create an account', desc: 'Sign up as a student, faculty, or admin in seconds.' },
  { step: '02', title: 'Start a project', desc: 'Create your project, add tasks, and invite team members.' },
  { step: '03', title: 'Track & collaborate', desc: 'Use Kanban boards, standups, and analytics to stay on top.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">AcademiKan</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-violet-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-violet-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 transition-colors">Sign in</Link>
            <Link to="/register" className="text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-violet-200 dark:border-violet-800">
            <BoltIcon className="w-3.5 h-3.5" />
            Academic Project Management Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Manage academic projects
            <span className="block bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              the smart way
            </span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AcademiKan brings Kanban boards, team collaboration, classroom tools, and analytics together in one platform built for universities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25">
              Start for free <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-semibold text-base border border-gray-200 dark:border-gray-700 hover:border-violet-300 transition-colors">
              Try demo account
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything your team needs</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">Built specifically for academic environments — from solo projects to full classroom management.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get started in minutes</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">No setup required. Just sign up and start tracking.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
                  <span className="text-white font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple pricing</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Start free, upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
              <h3 className="font-bold text-xl mb-1">Free</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Perfect for getting started</p>
              <p className="text-4xl font-extrabold mb-6">$0<span className="text-base font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-3 mb-8">
                {['Up to 3 projects', 'Kanban boards', 'Team collaboration', 'Basic analytics'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block text-center border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:border-violet-400 transition-colors">
                Get started free
              </Link>
            </div>
            {/* Premium */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <StarIcon className="w-3 h-3" /> Popular
              </div>
              <h3 className="font-bold text-xl mb-1">Premium</h3>
              <p className="text-violet-200 text-sm mb-6">For serious teams</p>
              <p className="text-4xl font-extrabold mb-6">$9<span className="text-base font-normal text-violet-200">/mo</span></p>
              <ul className="space-y-3 mb-8">
                {['Unlimited projects', 'Advanced analytics', 'File uploads', 'Priority support', 'Portfolio generator'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-violet-100">
                    <CheckIcon className="w-4 h-4 text-white flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block text-center bg-white text-violet-700 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to get organized?</h2>
          <p className="text-violet-200 text-lg mb-10">Join students and faculty already using AcademiKan to manage their academic projects.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-white text-violet-700 px-8 py-4 rounded-2xl font-semibold text-base hover:bg-violet-50 transition-colors shadow-xl">
            Create free account <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">AcademiKan</span>
          </div>
          <p className="text-xs text-gray-400">© 2024 AcademiKan. Built for academic excellence.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link to="/login" className="hover:text-violet-600 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-violet-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
