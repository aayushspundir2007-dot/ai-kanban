import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import KanbanPage from './pages/KanbanPage';
import UsersPage from './pages/UsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PricingPage from './pages/PricingPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import StandupPage from './pages/StandupPage';
import ContributionPage from './pages/ContributionPage';
import HealthPage from './pages/HealthPage';
import StakeholderPage from './pages/StakeholderPage';
import GroupFormationPage from './pages/GroupFormationPage';
import PortfolioPage from './pages/PortfolioPage';
import MeetingsPage from './pages/MeetingsPage';
import LandingPage from './pages/LandingPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/kanban" element={<KanbanPage />} />
        <Route path="/projects/:id/standup" element={<StandupPage />} />
        <Route path="/projects/:id/contribution" element={<ContributionPage />} />
        <Route path="/projects/:id/health" element={<HealthPage />} />
        <Route path="/projects/:id/stakeholders" element={<StakeholderPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/groups" element={<GroupFormationPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/users" element={
          <ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
