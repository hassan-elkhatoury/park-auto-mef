import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Send, Key, UserCheck, Shield, ChevronRight, Fuel, Wrench, BarChart3, Settings, Users } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Tableau de Bord', sub: 'Pilotage', icon: LayoutDashboard, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'vehicules', path: '/vehicules', label: 'Flotte Automobile', sub: 'Gestion du Parc', icon: Car, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'demandes', path: '/demandes', label: 'Demandes & Missions', sub: 'Réservations', icon: Send, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'affectations', path: '/affectations', label: 'Affectations & Restitutions', sub: 'Missions', icon: Key, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE'] },
  { id: 'conducteurs', path: '/conducteurs', label: 'Conducteurs & Chauffeurs', sub: 'Gestion du Personnel', icon: UserCheck, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE'] },
  { id: 'carburant', path: '/carburant', label: 'Carburant & Cartes', sub: 'Consommation L/100km', icon: Fuel, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'maintenance', path: '/maintenance', label: 'Entretien & Alertes', sub: 'Pannes & Échéances', icon: Wrench, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
  { id: 'rapports', path: '/rapports', label: 'Reporting Exécutif (TCO)', sub: 'Analyses & Exports', icon: BarChart3, roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'] },
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

// Zellige architectural silhouette for sidebar bottom
function ZelligeSilhouette() {
  return (
    <svg
      className="w-full opacity-20"
      viewBox="0 0 280 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Mosque / arch silhouette */}
      <path
        d="M20 120 Q40 85 70 95 Q90 70 110 80 Q130 55 140 60 Q150 55 170 80 Q190 70 210 95 Q240 85 260 120 Z"
        fill="url(#zellige-grad)" opacity="0.4"
      />
      {/* Central dome */}
      <ellipse cx="140" cy="70" rx="28" ry="22" stroke="#C59B27" strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Minarets */}
      <rect x="65" y="75" width="6" height="45" rx="2" fill="#C59B27" opacity="0.25" />
      <rect x="209" y="75" width="6" height="45" rx="2" fill="#C59B27" opacity="0.25" />
      {/* Star ornament */}
      <polygon
        points="140,52 143,60 152,63 143,66 140,74 137,66 128,63 137,60"
        fill="#C59B27" opacity="0.45"
      />
      {/* Small arches */}
      <path d="M85 120 Q95 100 105 120" stroke="#C59B27" strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M175 120 Q185 100 195 120" stroke="#C59B27" strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M125 120 Q140 95 155 120" stroke="#C59B27" strokeWidth="1" fill="none" opacity="0.35" />
      <defs>
        <linearGradient id="zellige-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C59B27" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C59B27" stopOpacity="0.08" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Sidebar({ user, collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  const roleName = user?.role?.nom || user?.role || 'CONSULTATION';
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

      {/* Bottom Zellige Architectural Watermark */}
      <div className="flex-shrink-0 px-2 pb-1 pointer-events-none select-none">
        <ZelligeSilhouette />
      </div>

      {/* Bottom gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] gold-gradient-bg opacity-70" />
    </aside>
  );
}
