import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import InviteEmployee from './pages/InviteEmployee';
import Login from './pages/Login';
import AcceptInvite from './pages/AcceptInvite';
import Announcements from './pages/Announcements';
import Billing from './pages/Billing';
import Support from './pages/Support';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProjectWorkspace from './pages/ProjectWorkspace';
import FeaturePlaceholder from './pages/FeaturePlaceholder';
import { restoreSession } from './services/api';

// Route Guard component
const AuthGuard = ({ children }) => {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    let active = true;
    restoreSession().then(data => {
      if (!active) return;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setStatus('authenticated');
    }).catch(() => {
      if (active) setStatus('anonymous');
    });
    return () => { active = false; };
  }, []);
  if (status === 'checking') return <div className="min-h-screen grid place-items-center bg-background font-bold">Restoring your workspace…</div>;
  return status === 'authenticated' ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />

        {/* Protected workspace routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id/workspace" element={<ProjectWorkspace />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="team" element={<Team />} />
          <Route path="team/invite" element={<InviteEmployee />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="billing" element={<Billing />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="attendance" element={<FeaturePlaceholder />} />
          <Route path="reports" element={<FeaturePlaceholder />} />
          <Route path="organization-settings" element={<FeaturePlaceholder />} />
          <Route path="hr-roles" element={<FeaturePlaceholder />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
