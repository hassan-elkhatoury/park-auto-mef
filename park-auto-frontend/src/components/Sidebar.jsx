import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Send, Key, UserCheck, Shield, ChevronRight, Fuel,
  Wrench, BarChart3, Users, ShieldCheck, ClipboardCheck, TrendingUp,
  AlertTriangle, ShieldAlert, Building2
} from 'lucide-react';

const ALL = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'];
const MANAGERS = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONSULTATION'];
const OPS = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION'];
const FINANCE = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE'];
const ADMINS = ['ADMIN', 'GESTIONNAIRE_CENTRAL'];

const MENU_SECTIONS = [
  {
    id: 'accueil',
    label: 'Pilotage',
    items: [
      { id: 'dashboard', path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ALL },
    ],
  },
  {
    id: 'missions',
    label: 'Parc & missions',
    items: [
      { id: 'vehicules', path: '/vehicules', label: 'Véhicules', icon: Car, roles: ALL },
      { id: 'conducteurs', path: '/conducteurs', label: 'Conducteurs', icon: UserCheck, roles: MANAGERS },
      { id: 'demandes', path: '/demandes', label: 'Demandes', icon: Send, roles: ALL },
      { id: 'affectations', path: '/affectations', label: 'Affectations', icon: Key, roles: MANAGERS },
    ],
  },
  {
    id: 'exploitation',
    label: 'Exploitation',
    items: [
      { id: 'carburant', path: '/carburant', label: 'Carburant', icon: Fuel, roles: ALL },
      { id: 'maintenance', path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: OPS },
      { id: 'pannes', path: '/pannes', label: 'Pannes', icon: AlertTriangle, roles: ALL },
      { id: 'garages', path: '/garages', label: 'Garages agréés', icon: Building2, roles: OPS },
    ],
  },
  {
    id: 'risques',
    label: 'Risques & conformité',
    items: [
      { id: 'sinistres', path: '/sinistres', label: 'Sinistres', icon: ShieldAlert, roles: ALL },
      { id: 'assurances', path: '/assurances', label: 'Assurances', icon: ShieldCheck, roles: OPS },
      { id: 'visites-reforme', path: '/visites-reforme', label: 'Visites & réforme', icon: ClipboardCheck, roles: OPS },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'budget', path: '/budget', label: 'Budget', icon: TrendingUp, roles: FINANCE },
      { id: 'rapports', path: '/rapports', label: 'Rapports TCO', icon: BarChart3, roles: OPS },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { id: 'utilisateurs', path: '/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ADMINS },
      { id: 'audit', path: '/audit', label: 'Journal d’audit', icon: Shield, roles: ADMINS },
    ],
  },
];

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

const isItemActive = (pathname, path) =>
  pathname === path || pathname.startsWith(`${path}/`);

export default function Sidebar({ user, collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'CONSULTATION');
  const sections = MENU_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(roleName)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className={`${
      collapsed ? 'w-[78px]' : 'w-[260px]'
    } bg-[#091B36] text-white flex flex-col flex-shrink-0 transition-all duration-300 relative shadow-2xl z-40 border-r border-[#C59B27]/25 overflow-hidden`}>

      <div className="absolute top-0 left-0 right-0 h-[3px] gold-gradient-bg" />

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

      <nav className="flex-1 px-3 py-3 flex flex-col overflow-y-auto sidebar-scroll">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className={sectionIndex > 0 ? 'mt-3' : ''}>
            {collapsed ? (
              <div className="mx-3 mb-1 border-t border-white/10" />
            ) : (
              <p className="px-3 mb-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#C59B27]/80">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(location.pathname, item.path);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`group relative flex items-center rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                      collapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-2.5'
                    } ${
                      isActive
                        ? 'bg-[#C59B27] text-[#071530] font-extrabold shadow-lg shadow-[#C59B27]/25'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-[#071530]/15 text-[#071530]' : 'text-slate-300 group-hover:text-[#D7B14A]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {!collapsed && (
                      <span className="truncate leading-none flex-1 text-left">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#071530] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
