import React, { useState, useEffect } from 'react';
import { Bell, Clock, Power, Calendar, ChevronDown, ChevronsLeft, ChevronsRight, Landmark } from 'lucide-react';

export default function Navbar({ user, onLogout, collapsed, onToggleCollapse }) {
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
  const roleName = user && user.role ? (user.role.nom || 'ADMIN') : 'ADMIN';

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 text-[#0A1E3F] shadow-sm">
      {/* Top institutional gold accent */}
      <div className="h-[3px] gold-gradient-bg" />
      <div className="h-16 px-6 flex items-center justify-between">

        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-slate-600 hover:bg-[#C59B27]/10 transition-all cursor-pointer group"
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronsRight className="w-5 h-5 group-hover:text-[#C59B27] transition-colors" /> : <ChevronsLeft className="w-5 h-5 group-hover:text-[#C59B27] transition-colors" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex w-9 h-9 rounded-lg bg-[#0A1E3F] items-center justify-center text-[#D7B14A] shadow-sm flex-shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black font-['Outfit'] tracking-wide text-[#0A1E3F] flex items-center gap-2">
                PARK AUTO <span className="text-[#C59B27]">MEF</span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#C59B27] opacity-40" />
              </h1>
              <p className="text-[11px] text-[#64748B] font-medium hidden sm:block leading-tight -mt-0.5">
                Ministère de l'Économie et des Finances
              </p>
            </div>
          </div>
        </div>

        {/* Right: Date, Clock, Notifications, Profile, Logout */}
        <div className="flex items-center gap-4">
          {/* Date Chip */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#0A1E3F] font-semibold bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-[#C59B27]" />
            <span className="capitalize">{dateStr}</span>
          </div>

          {/* Clock Chip */}
          <div className="flex items-center gap-1.5 text-xs text-[#0A1E3F] font-bold bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm">
            <Clock className="w-4 h-4 text-[#C59B27]" />
            <span className="tabular-nums">{time}</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-slate-600 hover:bg-[#C59B27]/10 transition-all cursor-pointer group">
            <Bell className="w-5 h-5 group-hover:text-[#C59B27] transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#C1272D] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1 shadow-sm">
              12
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 cursor-pointer hover:bg-[#C59B27]/5 px-2.5 py-1.5 rounded-xl transition-all group">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#E2E8F0] shadow-sm flex-shrink-0 group-hover:border-[#C59B27] transition-colors">
              <img
                src="/assets/avatar_admin.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-full h-full gold-gradient-bg text-[#071530] text-xs font-black flex items-center justify-center">${initials}</div>`;
                }}
              />
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-xs font-bold text-[#0A1E3F] leading-tight">
                {user ? `${user.prenom} ${user.nom}` : 'Système Administrateur'}
              </span>
              <span className="text-[10px] gold-gradient-text font-extrabold leading-tight uppercase tracking-wider">
                {roleName}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#C59B27] hidden lg:block" />
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-[#C59B27] hover:bg-[#C59B27]/10 transition-all cursor-pointer group"
            title="Déconnexion"
          >
            <Power className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

      </div>
    </header>
  );
}
