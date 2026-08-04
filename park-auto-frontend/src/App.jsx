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
import DemandesView from './components/DemandesView';
import DemandeDetailView from './components/DemandeDetailView';
import AffectationsView from './components/AffectationsView';
import AffectationDetailView from './components/AffectationDetailView';
import ConducteursView from './components/ConducteursView';
import ConducteurDetailView from './components/ConducteurDetailView';
import ForceChangePasswordModal from './components/ForceChangePasswordModal';
import AuditView from './components/AuditView';
import CarburantView from './components/CarburantView';
import RapportsView from './components/RapportsView';

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
  const [selectedDemandeForAffectation, setSelectedDemandeForAffectation] = useState(null);
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

  const handleOpenAffectationModal = (demande) => {
    setSelectedDemandeForAffectation(demande);
    navigate('/affectations');
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#0A1E3F', color: '#fff', border: '1px solid #122B55', fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: '8px' }, duration: 4000 }} />
        <Routes>
          <Route path="/login" element={<LoginView onLoginSuccess={(u) => { setUser(u); navigate('/dashboard'); }} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  const mustChangePassword = user.doitChangerMotDePasse === true || user.mustChangePassword === true || user.firstLogin === true;

  return (
    <div className="h-screen flex flex-col bg-[#F4F6FB] overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0A1E3F', color: '#fff', border: '1px solid #122B55', fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: '8px' }, duration: 4000 }} />
      {mustChangePassword && (
        <ForceChangePasswordModal 
          user={user} 
          onPasswordChanged={(updatedUser) => setUser(updatedUser)} 
        />
      )}
      <Navbar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          user={user}
          collapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-[#F4F6FB]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView user={user} />} />
            <Route path="/vehicules" element={<VehiculesListView />} />
            <Route path="/vehicules/:id" element={<VehiculeDetailView />} />
            <Route path="/demandes" element={<DemandesView onOpenAffectationModal={handleOpenAffectationModal} />} />
            <Route path="/demandes/:id" element={<DemandeDetailView />} />
            <Route path="/affectations" element={<AffectationsView selectedDemandeForAffectation={selectedDemandeForAffectation} onCloseDemandeSelection={() => setSelectedDemandeForAffectation(null)} />} />
            <Route path="/affectations/:id" element={<AffectationDetailView />} />
            <Route path="/conducteurs" element={<ConducteursView />} />
            <Route path="/conducteurs/:id" element={<ConducteurDetailView />} />
            <Route path="/carburant" element={<CarburantView />} />
            <Route path="/rapports" element={<RapportsView />} />
            <Route path="/utilisateurs" element={<UtilisateursView />} />
            <Route path="/audit" element={<AuditView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
