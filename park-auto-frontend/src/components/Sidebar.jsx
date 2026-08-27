import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Car, Send, Key, UserCheck, Shield, ChevronRight, Fuel, 
  Wrench, BarChart3, Settings, Users, ShieldCheck, ClipboardCheck, TrendingUp,
  AlertTriangle, ShieldAlert, Building2
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Tableau de Bord', sub: 'Pilotage', icon: LayoutDashboard, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'vehicules', path: '/vehicules', label: 'Flotte Automobile', sub: 'Gestion du Parc', icon: Car, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'demandes', path: '/demandes', label: 'Demandes & Missions', sub: 'Réservations', icon: Send, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'affectations', path: '/affectations', label: 'Affectations & Restitutions', sub: 'Missions', icon: Key, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'conducteurs', path: '/conducteurs', label: 'Conducteurs & Chauffeurs', sub: 'Gestion du Personnel', icon: UserCheck, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'carburant', path: '/carburant', label: 'Carburant & Cartes', sub: 'Consommation L/100km', icon: Fuel, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'maintenance', path: '/maintenance', label: 'Entretien & Alertes 90%', sub: 'Révisions Périodiques', icon: Wrench, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'pannes', path: '/pannes', label: 'Pannes & Dépannage', sub: 'Remorquage & Ateliers', icon: AlertTriangle, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'sinistres', path: '/sinistres', label: 'Sinistres & Accidents', sub: 'Workflow Assurances', icon: ShieldAlert, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'garages', path: '/garages', label: 'Garages & Pièces MEF', sub: 'Prestataires Conventionnés', icon: Building2, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'rapports', path: '/rapports', label: 'Reporting Exécutif (TCO)', sub: 'Analyses & Exports', icon: BarChart3, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'assurances', path: '/assurances', label: 'Polices d’Assurance', sub: 'Contrats & Garanties', icon: ShieldCheck, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'visites-reforme', path: '/visites-reforme', label: 'Visites & Réforme', sub: 'VT & Taxes & Réforme', icon: ClipboardCheck, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'budget', path: '/budget', label: 'Budget & Prévisions', sub: 'Suivi Budgétaire', icon: TrendingUp, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE'] },
  { id: 'utilisateurs', path: '/utilisateurs', label: 'Gestion des Utilisateurs', sub: 'Comptes & Accès', icon: Users, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL'] },
  { id: 'audit', path: '/audit', label: "Journal d'Audit", sub: 'Sécurité & Traçabilité', icon: Shield, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL'] },
];

// Moroccan 8-pointed star emblem fallback for the sidebar header
function StarEmblem() {
  return (
    <svg className="w-11 h-11 flex-shrink-0" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M50 5 L61.8 23.2 L83.2 16.8 L76.8 38.2 L95 50 L76.8 61.8 L83.2 83.2 L61.8 76.8 L50 95 L38.2 76.8 L16.8 83.2 L23.2 61.8 L5 50 L23.2 38.2 L16.8 16.8 L38.2 23.2 Z"
            stroke="#C59B27" strokeWidth="2.5" fill="rgba(197, 155, 39, 0.12)" />
      <circle cx="50" cy="50" r="20" stroke="#C59B27" strokeWidth="1.8" fill="none" />
      <polygon points="50,37 53.5,46.5 63,50 53.5,53.5 50,63 46.5,53.5 37,50 46.5,46.5" fill="#C59B27" />
    </svg>
  );
}

export default function Sidebar({ user, collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'CONSULTATION');
  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(roleName));

  return (
    <aside className={`${
      collapsed ? 'w-[78px]' : 'w-[278px]'
    } bg-[#091B36] text-white flex flex-col flex-shrink-0 transition-all duration-300 relative shadow-2xl z-40 border-r border-[#C59B27]/25 overflow-hidden`}>

      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] gold-gradient-bg" />

      {/* Header: Coat of Arms + Bilingual Titles + Brand */}
      <div className={`px-5 pt-6 pb-4 border-b border-white/10 relative ${
        collapsed ? 'flex flex-col items-center text-center px-2' : ''
      }`}>
        <div className={`flex items-center gap-3 w-full ${collapsed ? 'justify-center' : ''}`}>
          {logoError ? (
            <StarEmblem />
          ) : (
            <img
              src="/assets/logo.png"
              alt="Ministère de l'Économie et des Finances"
              className="h-12 w-auto object-contain flex-shrink-0"
              onError={() => setLogoError(true)}
            />
          )}
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-amiri text-[15px] text-gold font-bold leading-snug" dir="rtl">
                وزارة الاقتصاد والمالية
              </span>

              <span className="text-[9px] text-slate-400 font-medium leading-tight mt-1">
                Ministère de l'Économie et des Finances
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto sidebar-scroll">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/vehicules' && location.pathname.startsWith('/vehicules/')) || (item.path === '/demandes' && location.pathname.startsWith('/demandes/')) || (item.path === '/affectations' && location.pathname.startsWith('/affectations/')) || (item.path === '/conducteurs' && location.pathname.startsWith('/conducteurs/')) || (item.path === '/utilisateurs' && location.pathname.startsWith('/utilisateurs'));

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'
              } ${
                isActive
                  ? 'bg-[#C59B27] text-[#071530] font-extrabold shadow-lg shadow-[#C59B27]/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? `${item.label} — ${item.sub}` : undefined}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-[#071530]/15 text-[#071530]' : 'text-slate-300 group-hover:text-[#D7B14A]'
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>

              {!collapsed && (
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="truncate leading-tight">{item.label}</span>
                  <span className={`text-[9px] font-medium ${isActive ? 'text-[#071530]/80' : 'text-slate-500'}`}>
                    {item.sub}
                  </span>
                </div>
              )}

              {isActive && !collapsed && (
                <ChevronRight className="w-4 h-4 text-[#071530] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
