import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Users, FileText, Send, Key, UserCheck, ChevronsLeft, ChevronsRight } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Analytics & Indicateurs', icon: LayoutDashboard, category: 'Pilotage', roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'vehicules', path: '/vehicules', label: 'Flotte Automobile', icon: Car, category: 'Gestion Parc', roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'demandes', path: '/demandes', label: 'Demandes & Missions', icon: Send, category: 'Réservation', roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'] },
  { id: 'affectations', path: '/affectations', label: 'Affectations & Restitutions', icon: Key, category: 'Missions', roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE'] },
  { id: 'conducteurs', path: '/conducteurs', label: 'Conducteurs & Chauffeurs', icon: UserCheck, category: 'Gestion Parc', roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE'] },
  { id: 'utilisateurs', path: '/utilisateurs', label: 'Gestion Utilisateurs & Rôles', icon: Users, category: 'Administration', roles: ['ADMIN'] },
  { id: 'audit', path: '/audit', label: 'Journal d\'Audit Système', icon: FileText, category: 'Sécurité', roles: ['ADMIN', 'GESTIONNAIRE_CENTRAL'] },
];

export default function Sidebar({ user, collapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const syncTime = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const roleName = user?.role?.nom || user?.role || 'CONSULTATION';

  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(roleName));

  return (
    <aside className={`${
      collapsed ? 'w-[72px]' : 'w-[260px]'
    } bg-[#070D1B] border-r border-[#C5A059]/20 text-white flex flex-col flex-shrink-0 transition-all duration-300 relative shadow-2xl z-40`}>
      
      {/* Header / Brand Section */}
      <div className={`p-4 flex items-center border-b border-white/10 ${collapsed ? 'flex-col justify-center gap-3' : 'justify-between gap-3'}`}>
        {!collapsed ? (
          <div className="min-w-0 flex flex-col">
            <h2 className="text-sm font-black font-['Outfit'] tracking-wider text-[#FFFFFF] uppercase flex items-center gap-1.5 leading-tight">
              PARK AUTO <span className="gold-gradient-text">MEF</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-300 leading-tight mt-1">
              Ministère de l'Économie et des Finances
            </span>
            <span className="text-[10px] font-bold text-[#E5C17C] tracking-wide uppercase leading-tight mt-0.5">
              Royaume du Maroc
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center font-black text-[#070D1B] text-xs shadow-md">
            MEF
          </div>
        )}

        <button 
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg bg-[#0F172A] border border-[#C5A059]/30 flex items-center justify-center text-[#E5C17C] hover:bg-[#C5A059] hover:text-[#070D1B] transition-all cursor-pointer shadow-sm flex-shrink-0"
          title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu Header */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1 text-[10px] font-bold tracking-widest text-[#E5C17C]/70 uppercase">
          Modules Système
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-1.5 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/vehicules' && location.pathname.startsWith('/vehicules/'));
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                collapsed ? 'justify-center p-3' : 'px-3.5 py-3 gap-3'
              } ${
                isActive 
                  ? 'gold-gradient-bg text-[#070D1B] font-extrabold shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${
                isActive ? 'text-[#070D1B]' : 'text-slate-400 group-hover:text-[#E5C17C]'
              }`} />
              
              {!collapsed && (
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="truncate leading-tight">{item.label}</span>
                  <span className={`text-[9px] font-bold ${isActive ? 'text-[#070D1B]/70' : 'text-slate-500'}`}>
                    {item.category}
                  </span>
                </div>
              )}

              {/* Tooltip on hover when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] border border-[#C5A059]/30 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                  <span className="text-[10px] text-[#E5C17C] block font-normal">{item.category}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-white/10 bg-black/20 flex flex-col gap-2">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src="/assets/mef_seal_gold.jpg" 
            alt="Sceau MEF" 
            className="w-8 h-8 rounded-lg object-cover opacity-70 border border-[#C5A059]/30 flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-white leading-tight">Park Auto MEF v1.2</span>
              <span className="text-[9px] text-[#E5C17C] font-semibold">Système Opérationnel</span>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="text-[9px] text-slate-500 text-center border-t border-white/5 pt-1.5">
            Dernière sync : {syncTime}
          </div>
        )}
      </div>

    </aside>
  );
}
