import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Clock, Power } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-FR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const initials = user ? (user.prenom[0] + user.nom[0]).toUpperCase() : 'AD';
  const roleName = user && user.role ? (user.role.nom || 'ADMINISTRATEUR') : 'ADMINISTRATEUR';

  return (
    <header className="bg-[#070D1B] border-b border-[#C5A059]/20 text-white sticky top-0 z-50 shadow-md">
      <div className="px-7 py-3 flex items-center justify-between">
        
        {/* Left Title & Menu */}
        <div className="flex items-center gap-4">
          <button className="text-[#E5C17C] hover:text-white cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          <h3 className="font-['Outfit'] font-extrabold text-lg text-white">
            Tableau de Bord Général
          </h3>
        </div>

        {/* Center Search */}
        <div className="flex-1 max-w-[480px] mx-6">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Recherche rapide (immatriculation, marque, inventaire...)..."
              className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-white/15 rounded-xl text-xs text-white outline-none focus:border-[#E5C17C]"
            />
          </div>
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#E5C17C] px-3.5 py-1.5 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{time}</span>
          </div>

          <div className="relative">
            <button className="w-9 h-9 rounded-xl bg-[#0F172A] border border-white/15 text-slate-300 flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">12</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-white/15">
            <div className="w-9 h-9 rounded-full gold-gradient-bg text-[#070D1B] font-black text-xs flex items-center justify-center shadow-[0_2px_8px_rgba(197,160,89,0.35)]">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{user ? `${user.prenom} ${user.nom}` : 'Youssef EL Amrani'}</span>
              <span className="text-[10px] text-[#E5C17C] font-bold uppercase">{roleName}</span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            title="Déconnexion"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
