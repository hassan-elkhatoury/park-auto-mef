import React from 'react';
import { 
  PieChart, Car, UserCheck, Shield, FileText 
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: PieChart },
  { id: 'vehicules', label: 'Gestion des Véhicules (Sprint 2)', icon: Car },
  { id: 'utilisateurs', label: 'Gestion Utilisateurs (Sprint 1)', icon: UserCheck },
  { id: 'audit', label: 'Journal d\'Audit (Sprint 1)', icon: FileText }
];

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="w-[270px] bg-[#090F1F] border-r border-[#C5A059]/20 text-white flex flex-col flex-shrink-0 shadow-2xl">
      <div className="p-6 flex flex-col items-center gap-3">
        <img src="/assets/logo.png" alt="MEF Logo" className="max-w-[190px] h-auto drop-shadow-md" />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent mt-1" />
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-2 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-widest text-[#E5C17C] uppercase">
          Modules Actifs — Sprints 1 & 2
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive 
                  ? 'gold-gradient-bg text-[#070D1B] font-extrabold shadow-[0_4px_14px_rgba(197,160,89,0.35)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#070D1B]' : 'text-slate-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 flex items-center gap-3 bg-black/25">
        <Shield className="w-4 h-4 text-emerald-400" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white">Park Auto MEF v1.2</span>
          <span className="text-[10px] text-slate-400">Périmètre : Sprints 1 & 2 Actifs</span>
        </div>
      </div>
    </aside>
  );
}
