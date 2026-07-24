import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, Power, Calendar } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const initials = user ? (user.prenom[0] + user.nom[0]).toUpperCase() : 'SA';
  const roleName = user && user.role ? (user.role.nom || 'Administrateur') : 'Administrateur';

  return (
    <header className="bg-[#070D1B] border-b border-[#C5A059]/30 sticky top-0 z-50 text-white shadow-xl">
      <div className="h-16 px-6 flex items-center justify-between">
        
        {/* Left: Brand & Page context */}
        <div className="flex items-center gap-4">
          <img src="/assets/logo.png" alt="Armoiries du Royaume" className="h-9 w-auto drop-shadow" />
          <img src="/assets/mef_seal_gold.jpg" alt="Sceau Officiel MEF" className="h-9 w-9 rounded-lg object-cover border border-[#C5A059]/50 shadow-[0_0_14px_rgba(197,160,89,0.3)] hidden sm:block" />
          <div className="hidden sm:block w-px h-8 bg-[#C5A059]/30" />
          <div className="flex flex-col">
            <h1 className="text-base font-extrabold font-['Outfit'] tracking-wide text-white flex items-center gap-2">
              PARK AUTO <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5C17C] via-[#C5A059] to-[#9B783E]">MEF</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Ministère de l'Économie et des Finances — Royaume du Maroc
            </p>
          </div>
        </div>

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-3">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#E5C17C]" />
            <span className="capitalize">{dateStr}</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 text-xs text-[#E5C17C] font-bold bg-[#0F172A] border border-[#C5A059]/30 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular-nums">{time}</span>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-white/15" />

          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-xl bg-[#0F172A] border border-white/15 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#C5A059]/50 transition-all cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C8102E] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-[#070D1B]">12</span>
          </button>

          {/* Separator */}
          <div className="w-px h-5 bg-white/15" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5 bg-[#0F172A]/80 border border-[#C5A059]/30 rounded-xl px-3 py-1.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#C5A059] shadow-sm">
              <img 
                src="/assets/avatar_admin.jpg" 
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-full h-full gold-gradient-bg text-[#070D1B] text-[11px] font-black flex items-center justify-center">${initials}</div>`;
                }}
              />
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-bold text-white leading-tight">{user ? `${user.prenom} ${user.nom}` : 'Système Administrateur'}</span>
              <span className="text-[10px] text-[#E5C17C] font-semibold leading-tight uppercase tracking-wider">{roleName}</span>
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-all cursor-pointer"
            title="Déconnexion"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}


