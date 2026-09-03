import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import LoginView from './components/LoginView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import api, { logoutSession } from './services/api';

const DashboardView = lazy(() => import('./components/DashboardView'));
const VehiculesListView = lazy(() => import('./components/VehiculesListView'));
const VehiculeDetailView = lazy(() => import('./components/VehiculeDetailView'));
const UtilisateursView = lazy(() => import('./components/UtilisateursView'));
const DemandesView = lazy(() => import('./components/DemandesView'));
const DemandeDetailView = lazy(() => import('./components/DemandeDetailView'));
const AffectationsView = lazy(() => import('./components/AffectationsView'));
const AffectationDetailView = lazy(() => import('./components/AffectationDetailView'));
const ConducteursView = lazy(() => import('./components/ConducteursView'));
const ConducteurDetailView = lazy(() => import('./components/ConducteurDetailView'));
const ForceChangePasswordModal = lazy(() => import('./components/ForceChangePasswordModal'));
const AuditView = lazy(() => import('./components/AuditView'));
const CarburantView = lazy(() => import('./components/CarburantView'));
const MaintenanceView = lazy(() => import('./components/MaintenanceView'));
const PannesView = lazy(() => import('./components/PannesView'));
const SinistresView = lazy(() => import('./components/SinistresView'));
const GaragesView = lazy(() => import('./components/GaragesView'));
const RapportsView = lazy(() => import('./components/RapportsView'));
const AssurancesView = lazy(() => import('./components/AssurancesView'));
const VisitesTaxesReformeView = lazy(() => import('./components/VisitesTaxesReformeView'));
const BudgetView = lazy(() => import('./components/BudgetView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const ChangePasswordView = lazy(() => import('./components/ChangePasswordView'));

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Chargement du module…</p>
      </div>
    </div>
  );
}

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
    const savedRefresh = localStorage.getItem('refreshToken');
    if (savedUser && (savedToken || savedRefresh)) {
      const accessOk = isJwtValid(savedToken);
      const refreshOk = isJwtValid(savedRefresh);
      if (!accessOk && !refreshOk) {
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

  useEffect(() => {
    const handleAuthForbidden = (e) => {
      toast.error(e?.detail || 'Accès refusé');
    };

    window.addEventListener('auth:forbidden', handleAuthForbidden);
    return () => window.removeEventListener('auth:forbidden', handleAuthForbidden);
  }, []);

  // Fetch pending notification count (role-aware)
  useEffect(() => {
    if (!user) return;
    const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'ADMIN');

    const safeFetch = async (url) => {
      try {
        const res = await api.get(url);
        const data = res?.data;
        if (Array.isArray(data)) return data;
        if (data?.content && Array.isArray(data.content)) return data.content;
        if (data?.data && Array.isArray(data.data)) return data.data;
        return [];
      } catch { return []; }
    };

    const fetchNotifications = async () => {
      let count = 0;

      // Demandes — all roles
      const demandes = await safeFetch('/demandes');
      if (roleName === 'CONDUCTEUR') {
        count += demandes.filter(d => ['EN_ATTENTE_VALIDATION', 'VALIDEE_SERVICE', 'EN_COURS'].includes(d.statut)).length;
      } else if (roleName === 'RESPONSABLE_SERVICE') {
        count += demandes.filter(d => d.statut === 'EN_ATTENTE_VALIDATION').length;
      } else if (roleName !== 'CONSULTATION') {
        count += demandes.filter(d => ['EN_ATTENTE_VALIDATION', 'VALIDEE_SERVICE'].includes(d.statut)).length;
      }

      // Pannes — managers + conducteur
      if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONDUCTEUR'].includes(roleName)) {
        const pannes = await safeFetch('/pannes');
        count += pannes.filter(p => ['DECLAREE', 'EN_DIAGNOSTIC', 'EN_REPARATION'].includes(p.statut)).length;
      }

      // Maintenance — managers + finance
      if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE'].includes(roleName)) {
        const maint = await safeFetch('/maintenance/interventions');
        count += maint.filter(m => ['PROGRAMMEE', 'EN_COURS'].includes(m.statut)).length;
      }

      // Sinistres — managers + finance
      if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER'].includes(roleName)) {
        const sinistres = await safeFetch('/sinistres');
        count += sinistres.filter(s => ['DECLARE', 'EN_EXPERTISE', 'EN_COURS_D_EXPERTISE', 'TRANSMIS'].includes(s.statut)).length;
      }

      setNotificationCount(count);
    };

    fetchNotifications();
    const onRefresh = () => fetchNotifications();
    window.addEventListener('parkauto:refresh', onRefresh);
    return () => window.removeEventListener('parkauto:refresh', onRefresh);
  }, [user, location.pathname]);

  const handleLogout = async () => {
    // Révocation serveur des jetons (access + refresh) avant purge de la session locale
    await logoutSession();
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
        <Suspense fallback={null}>
          <ForceChangePasswordModal
            user={user}
            onPasswordChanged={(updatedUser) => setUser(updatedUser)}
          />
        </Suspense>
      )}
      <Navbar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} notificationCount={notificationCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          user={user}
          collapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-[#F4F6FB]">
          <Suspense fallback={<PageFallback />}>
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
            <Route path="/profil" element={<ProfileView user={user} onUserUpdate={(u) => setUser(u)} />} />
            <Route path="/profil/mot-de-passe" element={<ChangePasswordView user={user} onUserUpdate={(u) => setUser(u)} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
