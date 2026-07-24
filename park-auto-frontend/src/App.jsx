import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import LoginView from './components/LoginView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import VehiculesListView from './components/VehiculesListView';
import VehiculeDetailView from './components/VehiculeDetailView';
import UtilisateursView from './components/UtilisateursView';
import AuditView from './components/AuditView';
import ForceChangePasswordModal from './components/ForceChangePasswordModal';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        localStorage.clear();
        return null;
      }
    }
    return null;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.clear();
      setUser(null);
      toast.error('Session expirée. Veuillez vous reconnecter.');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#0F1D32', color: '#fff', border: '1px solid #1B3050', fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: '8px' }, duration: 4000 }} />
        <Routes>
          <Route path="/login" element={<LoginView onLoginSuccess={(u) => { setUser(u); navigate('/dashboard'); }} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  const mustChangePassword = user.doitChangerMotDePasse === true || user.mustChangePassword === true || user.firstLogin === true;

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FB] overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0F1D32', color: '#fff', border: '1px solid #1B3050', fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: '8px' }, duration: 4000 }} />
      {mustChangePassword && (
        <ForceChangePasswordModal 
          user={user} 
          onPasswordChanged={(updatedUser) => setUser(updatedUser)} 
        />
      )}
      <Navbar user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto bg-[#F8F9FB]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/vehicules" element={<VehiculesListView />} />
            <Route path="/vehicules/:id" element={<VehiculeDetailView />} />
            <Route path="/utilisateurs" element={<UtilisateursView />} />
            <Route path="/audit" element={<AuditView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
