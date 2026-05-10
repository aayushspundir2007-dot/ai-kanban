import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import {
  HomeIcon, FolderIcon, ChartBarIcon, UsersIcon,
  UserCircleIcon, Bars3Icon, XMarkIcon, SparklesIcon,
  AcademicCapIcon, ClipboardDocumentListIcon, VideoCameraIcon,
  BellIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  StarIcon, BookOpenIcon, SunIcon, MoonIcon
} from '@heroicons/react/24/outline';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: HomeIcon, roles: ['student', 'faculty', 'admin'] },
      { to: '/projects', label: 'Projects', icon: FolderIcon, roles: ['student', 'faculty', 'admin'] },
    ]
  },
  {
    label: 'Tools',
    items: [
      { to: '/meetings', label: 'Meetings', icon: VideoCameraIcon, roles: ['student', 'faculty', 'admin'] },
      { to: '/analytics', label: 'Analytics', icon: ChartBarIcon, roles: ['student', 'faculty', 'admin'] },
      { to: '/groups', label: 'Groups & Skills', icon: UsersIcon, roles: ['student', 'faculty', 'admin'] },
      { to: '/portfolio', label: 'Portfolio', icon: BookOpenIcon, roles: ['student'] },
    ]
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', label: 'Users', icon: UsersIcon, roles: ['admin'] },
    ]
  }
];

export default function Layout() {
  const { user, logout, isPremium } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-white">AcademiKan</span>
          <p className="text-xs text-slate-400">AI Academic Tracker</p>
        </div>
      </div>

      {/* User pill */}
      <div className="mx-3 mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
              {isPremium && (
                <span className="flex items-center gap-0.5 text-xs text-yellow-400 font-medium">
                  <StarIcon className="w-3 h-3 fill-yellow-400" /> Pro
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(i => i.roles.includes(user?.role));
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {visibleItems.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-white/8 hover:text-white'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-4.5 h-4.5 w-5 h-5 flex-shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        {!isPremium && (
          <NavLink to="/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-yellow-400 hover:bg-yellow-400/10 transition-all mb-1">
            <StarIcon className="w-5 h-5" />
            Upgrade to Pro
          </NavLink>
        )}
        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-white transition-all" onClick={() => setSidebarOpen(false)}>
          <UserCircleIcon className="w-5 h-5" />
          Profile & Settings
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full shadow-2xl">
            <button className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/10 text-white" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="w-5 h-5 text-gray-600" />
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-gray-500" />}
            </button>
            <NotificationBell />
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.department || user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
