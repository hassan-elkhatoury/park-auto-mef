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
import MaintenanceView from './components/MaintenanceView';
import PannesView from './components/PannesView';
import SinistresView from './components/SinistresView';
import GaragesView from './components/GaragesView';
import RapportsView from './components/RapportsView';
import AssurancesView from './components/AssurancesView';
import VisitesTaxesReformeView from './components/VisitesTaxesReformeView';
import BudgetView from './components/BudgetView';

const isJwtValid = (token) => {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload || !payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (e) {
    return false;
  }
};

// Helper component for Role-Based Access Control on Routes
function ProtectedRoute({ user, allowedRoles, children }) {
  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'CONSULTATION');
  if (allowedRoles && !allowedRoles.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      if (!isJwtValid(savedToken)) {
        localStorage.clear();
        return null;
      }
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
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.clear();
      setUser(null);
      navigate('/login');
      toast.error('Session expirée. Veuillez vous reconnecter.');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [navigate]);

  // Fetch pending notification count
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { default: api } = await import('./services/api');
        const res = await api.get('/demandes');
        const demandes = Array.isArray(res?.data) ? res.data : (res?.data?.content || []);
        const pending = demandes.filter(d => d.statut === 'EN_ATTENTE_VALIDATION' || d.statut === 'VALIDEE_SERVICE').length;
        setNotificationCount(pending);
      } catch (e) {
        // Silently fail — notification badge just won't show
      }
    };
    fetchNotifications();
    // Refresh on navigation changes
    const onRefresh = () => fetchNotifications();
    window.addEventListener('parkauto:refresh', onRefresh);
    return () => window.removeEventListener('parkauto:refresh', onRefresh);
  }, [user, location.pathname]);

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

  const ALL_ROLES = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'];
  const MANAGERS_AND_FINANCE = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'];
  const MANAGERS_ONLY = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONSULTATION'];
  const BUDGET_ROLES = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE'];
  const ADMIN_ROLES = ['ADMIN', 'GESTIONNAIRE_CENTRAL'];

  return (
    <div className="h-screen flex flex-col bg-[#F4F6FB] overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0A1E3F', color: '#fff', border: '1px solid #122B55', fontSize: '13px', fontFamily: 'Inter, sans-serif', borderRadius: '8px' }, duration: 4000 }} />
      {mustChangePassword && (
        <ForceChangePasswordModal 
          user={user} 
          onPasswordChanged={(updatedUser) => setUser(updatedUser)} 
        />
      )}
      <Navbar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} notificationCount={notificationCount} />
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
            <Route path="/vehicules" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><VehiculesListView /></ProtectedRoute>} />
            <Route path="/vehicules/:id" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><VehiculeDetailView /></ProtectedRoute>} />
            <Route path="/demandes" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><DemandesView onOpenAffectationModal={handleOpenAffectationModal} /></ProtectedRoute>} />
            <Route path="/demandes/:id" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><DemandeDetailView /></ProtectedRoute>} />
            <Route path="/affectations" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_ONLY}><AffectationsView selectedDemandeForAffectation={selectedDemandeForAffectation} onCloseDemandeSelection={() => setSelectedDemandeForAffectation(null)} /></ProtectedRoute>} />
            <Route path="/affectations/:id" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_ONLY}><AffectationDetailView /></ProtectedRoute>} />
            <Route path="/conducteurs" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_ONLY}><ConducteursView /></ProtectedRoute>} />
            <Route path="/conducteurs/:id" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_ONLY}><ConducteurDetailView /></ProtectedRoute>} />
            <Route path="/carburant" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><CarburantView /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_AND_FINANCE}><MaintenanceView /></ProtectedRoute>} />
            <Route path="/pannes" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><PannesView /></ProtectedRoute>} />
            <Route path="/sinistres" element={<ProtectedRoute user={user} allowedRoles={ALL_ROLES}><SinistresView /></ProtectedRoute>} />
            <Route path="/garages" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_AND_FINANCE}><GaragesView /></ProtectedRoute>} />
            <Route path="/rapports" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_AND_FINANCE}><RapportsView /></ProtectedRoute>} />
            <Route path="/assurances" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_AND_FINANCE}><AssurancesView /></ProtectedRoute>} />
            <Route path="/visites-reforme" element={<ProtectedRoute user={user} allowedRoles={MANAGERS_AND_FINANCE}><VisitesTaxesReformeView /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute user={user} allowedRoles={BUDGET_ROLES}><BudgetView /></ProtectedRoute>} />
            <Route path="/utilisateurs" element={<ProtectedRoute user={user} allowedRoles={ADMIN_ROLES}><UtilisateursView /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute user={user} allowedRoles={ADMIN_ROLES}><AuditView /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
