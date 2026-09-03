import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, Power, Calendar, ChevronDown, ChevronsLeft, ChevronsRight, Landmark, User, Lock, LogOut, FileText, CheckCircle, Car, Wrench, AlertTriangle, ShieldAlert, Fuel, TrendingUp, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserAvatar } from '../services/avatarService';

// Moroccan 8-pointed star badge icon (inline SVG)
function StarBadge({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 100 100" fill="none">
      <path d="M50 5 L61.8 23.2 L83.2 16.8 L76.8 38.2 L95 50 L76.8 61.8 L83.2 83.2 L61.8 76.8 L50 95 L38.2 76.8 L16.8 83.2 L23.2 61.8 L5 50 L23.2 38.2 L16.8 16.8 L38.2 23.2 Z"
            stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

// ── Notification type config ──
const NOTIF_TYPE_CONFIG = {
  demande:     { icon: FileText,      color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Demande' },
  affectation: { icon: Car,           color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Affectation' },
  panne:       { icon: AlertTriangle, color: 'text-orange-600',  bg: 'bg-orange-50',  label: 'Panne' },
  maintenance: { icon: Wrench,        color: 'text-violet-600',  bg: 'bg-violet-50',  label: 'Maintenance' },
  sinistre:    { icon: ShieldAlert,   color: 'text-red-600',     bg: 'bg-red-50',     label: 'Sinistre' },
  alerte:      { icon: ClipboardCheck,color: 'text-rose-600',    bg: 'bg-rose-50',    label: 'Alerte' },
  budget:      { icon: TrendingUp,    color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Budget' },
  assurance:   { icon: ShieldCheck,   color: 'text-teal-600',    bg: 'bg-teal-50',    label: 'Assurance' },
  carburant:   { icon: Fuel,          color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Carburant' },
};

const STATUT_BADGES = {
  EN_ATTENTE_VALIDATION: { label: 'En attente',  cls: 'bg-amber-100 text-amber-800' },
  VALIDEE_SERVICE:       { label: 'Validée',     cls: 'bg-blue-100 text-blue-800' },
  EN_COURS:              { label: 'En cours',    cls: 'bg-emerald-100 text-emerald-800' },
  DECLAREE:              { label: 'Déclarée',    cls: 'bg-orange-100 text-orange-800' },
  DECLARE:               { label: 'Déclaré',     cls: 'bg-orange-100 text-orange-800' },
  EN_DIAGNOSTIC:         { label: 'Diagnostic',  cls: 'bg-violet-100 text-violet-800' },
  EN_REPARATION:         { label: 'Réparation',  cls: 'bg-pink-100 text-pink-800' },
  PROGRAMMEE:            { label: 'Programmée',   cls: 'bg-indigo-100 text-indigo-800' },
  EN_EXPERTISE:          { label: 'Expertise',   cls: 'bg-violet-100 text-violet-800' },
  EN_COURS_D_EXPERTISE:  { label: 'Expertise',   cls: 'bg-violet-100 text-violet-800' },
  TRANSMIS:              { label: 'Transmis',    cls: 'bg-blue-100 text-blue-800' },
  VIGILANCE_80:          { label: 'Alerte 80%',  cls: 'bg-amber-100 text-amber-800' },
  CRITIQUE_95:           { label: 'Critique 95%',cls: 'bg-red-100 text-red-800' },
  EN_RETARD:             { label: 'En retard',   cls: 'bg-red-100 text-red-800' },
  A_PAYER:               { label: 'À payer',     cls: 'bg-amber-100 text-amber-800' },
};

// ── Hook: click outside to close ──
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// ── Safe API fetch helper ──
async function safeFetch(url) {
  try {
    const res = await api.get(url);
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (data?.content && Array.isArray(data.content)) return data.content;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } catch { return []; }
}

// ── Fetch role-based notifications ──
async function fetchRoleNotifications(roleName) {
  const items = [];
  const currentYear = new Date().getFullYear();

  // ══════════════════════════════════════════════
  //  DEMANDES — Relevant for ALL roles
  // ══════════════════════════════════════════════
  const demandes = await safeFetch('/demandes');

  if (roleName === 'CONDUCTEUR') {
    // Conducteur sees their own pending/active demandes
    demandes
      .filter(d => ['EN_ATTENTE_VALIDATION', 'VALIDEE_SERVICE', 'EN_COURS'].includes(d.statut))
      .forEach(d => items.push({
        id: `dem-${d.id}`, type: 'demande', path: `/demandes/${d.id}`,
        title: d.reference || `Demande #${d.id}`,
        subtitle: `${d.destination || ''} — ${d.motif || ''}`.trim().replace(/^— |— $/g, ''),
        statut: d.statut,
      }));
  } else if (roleName === 'RESPONSABLE_SERVICE') {
    // Responsable de service sees demandes awaiting their N1 validation
    demandes
      .filter(d => d.statut === 'EN_ATTENTE_VALIDATION')
      .forEach(d => items.push({
        id: `dem-${d.id}`, type: 'demande', path: `/demandes/${d.id}`,
        title: d.reference || `Demande #${d.id}`,
        subtitle: `${d.destination || ''} — ${d.motif || ''}`.trim().replace(/^— |— $/g, ''),
        detail: d.demandeurNom || (d.demandeur ? `${d.demandeur.prenom} ${d.demandeur.nom}` : ''),
        statut: d.statut,
      }));
  } else if (roleName !== 'CONSULTATION') {
    // ADMIN, GESTIONNAIRE_CENTRAL, GESTIONNAIRE_LOCAL, RESPONSABLE_FINANCIER
    demandes
      .filter(d => ['EN_ATTENTE_VALIDATION', 'VALIDEE_SERVICE'].includes(d.statut))
      .forEach(d => items.push({
        id: `dem-${d.id}`, type: 'demande', path: `/demandes/${d.id}`,
        title: d.reference || `Demande #${d.id}`,
        subtitle: `${d.destination || ''} — ${d.motif || ''}`.trim().replace(/^— |— $/g, ''),
        detail: d.demandeurNom || (d.demandeur ? `${d.demandeur.prenom} ${d.demandeur.nom}` : ''),
        statut: d.statut,
      }));
  }

  // ══════════════════════════════════════════════
  //  PANNES — Managers + Conducteur
  // ══════════════════════════════════════════════
  if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONDUCTEUR'].includes(roleName)) {
    const pannes = await safeFetch('/pannes');
    pannes
      .filter(p => ['DECLAREE', 'EN_DIAGNOSTIC', 'EN_REPARATION'].includes(p.statut))
      .slice(0, 5)
      .forEach(p => items.push({
        id: `pan-${p.id}`, type: 'panne', path: '/pannes',
        title: p.naturePanne || `Panne #${p.id}`,
        subtitle: p.vehicule ? `${p.vehicule.marque} ${p.vehicule.modele} — ${p.vehicule.immatriculation}` : '',
        statut: p.statut,
      }));
  }

  // ══════════════════════════════════════════════
  //  MAINTENANCE — Managers + Finance
  // ══════════════════════════════════════════════
  if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE'].includes(roleName)) {
    const maintenance = await safeFetch('/maintenance/interventions');
    maintenance
      .filter(m => ['PROGRAMMEE', 'EN_COURS'].includes(m.statut))
      .slice(0, 5)
      .forEach(m => items.push({
        id: `mnt-${m.id}`, type: 'maintenance', path: '/maintenance',
        title: m.description || m.natureOperation || `Intervention #${m.id}`,
        subtitle: m.vehicule ? `${m.vehicule.marque} ${m.vehicule.modele}` : (m.prestataire || ''),
        statut: m.statut,
      }));
  }

  // ══════════════════════════════════════════════
  //  ALERTES ECHEANCES — Managers (maintenance 90%, VT J-30, assurances, permis, taxes)
  // ══════════════════════════════════════════════
  if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL'].includes(roleName)) {
    const alertes = await safeFetch('/maintenance/alertes');
    alertes
      .slice(0, 5)
      .forEach((a, i) => items.push({
        id: `alt-${i}`, type: 'alerte', path: '/maintenance',
        title: a.typeAlerte || a.type || 'Alerte échéance',
        subtitle: a.message || a.description || '',
        detail: a.vehicule ? `${a.vehicule.immatriculation}` : '',
        statut: a.niveau || a.severite || '',
      }));
  }

  // ══════════════════════════════════════════════
  //  SINISTRES — Managers + Finance
  // ══════════════════════════════════════════════
  if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER'].includes(roleName)) {
    const sinistres = await safeFetch('/sinistres');
    sinistres
      .filter(s => ['DECLARE', 'EN_EXPERTISE', 'EN_COURS_D_EXPERTISE', 'TRANSMIS'].includes(s.statut))
      .slice(0, 3)
      .forEach(s => items.push({
        id: `sin-${s.id}`, type: 'sinistre', path: '/sinistres',
        title: s.numeroConstat || `Sinistre #${s.id}`,
        subtitle: s.description ? s.description.substring(0, 60) : (s.natureAccident || ''),
        statut: s.statut,
      }));
  }

  // ══════════════════════════════════════════════
  //  BUDGET ALERTS — Finance + Managers
  // ══════════════════════════════════════════════
  if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'RESPONSABLE_FINANCIER'].includes(roleName)) {
    const budgetAlertes = await safeFetch(`/budgets/alertes?annee=${currentYear}`);
    budgetAlertes
      .slice(0, 3)
      .forEach((b, i) => items.push({
        id: `bud-${i}`, type: 'budget', path: '/budget',
        title: b.direction || 'Alerte budgétaire',
        subtitle: b.message || `${b.natureDepense || ''} — ${b.pourcentageConsommation || ''}%`,
        statut: b.niveau || b.type || '',
      }));
  }

  // ══════════════════════════════════════════════
  //  ASSURANCES EXPIRANT — Finance + Managers
  // ══════════════════════════════════════════════
  if (['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER'].includes(roleName)) {
    const expiring = await safeFetch('/assurances/expirant-bientot');
    expiring
      .slice(0, 3)
      .forEach(a => items.push({
        id: `ass-${a.id}`, type: 'assurance', path: '/assurances',
        title: `Police ${a.numeroPolice || '#' + a.id}`,
        subtitle: a.vehicule ? `${a.vehicule.marque} ${a.vehicule.modele} — ${a.vehicule.immatriculation}` : (a.compagnie || ''),
        detail: a.dateFin ? `Expire le ${new Date(a.dateFin).toLocaleDateString('fr-FR')}` : '',
        statut: '',
      }));
  }

  // ══════════════════════════════════════════════
  //  AFFECTATIONS EN COURS — Conducteur
  // ══════════════════════════════════════════════
  if (roleName === 'CONDUCTEUR') {
    const affectations = await safeFetch('/affectations');
    affectations
      .filter(a => a.statut === 'EN_COURS')
      .slice(0, 3)
      .forEach(a => items.push({
        id: `aff-${a.id}`, type: 'affectation', path: `/affectations/${a.id}`,
        title: a.reference || `Affectation #${a.id}`,
        subtitle: a.vehicule ? `${a.vehicule.marque} ${a.vehicule.modele}` : '',
        statut: a.statut,
      }));
  }

  return items;
}


// ── Notification dropdown ──
function NotificationDropdown({ notifications, loading, onClose, onNavigate }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  // Group notifications by type
  const grouped = {};
  notifications.forEach(n => {
    if (!grouped[n.type]) grouped[n.type] = [];
    grouped[n.type].push(n);
  });

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-[420px] max-h-[480px] bg-white rounded-xl shadow-2xl border border-[#E2E8F0] z-[100] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#C59B27]" />
          <span className="text-sm font-bold text-[#0A1E3F]">Notifications</span>
          {notifications.length > 0 && (
            <span className="min-w-[20px] h-5 bg-[#C1272D] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
              {notifications.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <div className="w-6 h-6 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Chargement…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <CheckCircle className="w-10 h-10 mb-2 text-emerald-300" />
            <p className="text-sm font-medium">Aucune notification</p>
            <p className="text-xs mt-1">Tout est à jour !</p>
          </div>
        ) : (
          Object.entries(grouped).map(([type, typeItems]) => {
            const cfg = NOTIF_TYPE_CONFIG[type] || NOTIF_TYPE_CONFIG.demande;
            const Icon = cfg.icon;
            return (
              <div key={type}>
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#F1F5F9]">
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{cfg.label}s</span>
                  <span className="text-[10px] font-semibold text-slate-400 ml-auto">{typeItems.length}</span>
                </div>
                {/* Items */}
                <div className="divide-y divide-[#F1F5F9]">
                  {typeItems.map((n) => {
                    const badge = STATUT_BADGES[n.statut];
                    return (
                      <button
                        key={n.id}
                        onClick={() => { onNavigate(n.path); onClose(); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#FFFBEA] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#0A1E3F] truncate">{n.title}</span>
                              {badge && (
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                            {n.subtitle && (
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.subtitle}</p>
                            )}
                            {n.detail && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{n.detail}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Profile dropdown ──
function ProfileDropdown({ user, roleName, avatarUrl, onClose, onLogout, onNavigate }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  const initials = ((user?.prenom?.[0] || 'S') + (user?.nom?.[0] || 'A')).toUpperCase();
  const currentAvatar = avatarUrl || getUserAvatar(user);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] z-[100] overflow-hidden">
      {/* User info header */}
      <div className="px-4 py-4 bg-gradient-to-br from-[#0A1E3F] to-[#122B55] text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#C59B27]/50 shadow flex-shrink-0">
            <img
              src={currentAvatar}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<div class="w-full h-full gold-gradient-bg text-[#071530] text-sm font-black flex items-center justify-center">${initials}</div>`;
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-[11px] text-[#C59B27] font-semibold uppercase tracking-wider">{roleName}</p>
            <p className="text-[10px] text-slate-300 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        <button
          onClick={() => { onNavigate('/profil'); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0A1E3F] hover:bg-[#FFFBEA] transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 text-[#64748B]" />
          <span className="font-medium">Mon profil</span>
        </button>
        <button
          onClick={() => {
            onNavigate('/profil/mot-de-passe');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0A1E3F] hover:bg-[#FFFBEA] transition-colors cursor-pointer"
        >
          <Lock className="w-4 h-4 text-[#64748B]" />
          <span className="font-medium">Changer le mot de passe</span>
        </button>
      </div>

      {/* Divider + Logout */}
      <div className="border-t border-[#E2E8F0] py-1.5">
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C1272D] hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>

      {/* Footer: matricule + direction */}
      {(user?.matricule || user?.direction) && (
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            {user?.matricule && <span>Matricule : <b className="text-slate-500">{user.matricule}</b></span>}
            {user?.direction && <span>{user.direction}</span>}
          </div>
        </div>
      )}
    </div>
  );
}


export default function Navbar({ user, onLogout, collapsed, onToggleCollapse, notificationCount = 0 }) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const navigate = useNavigate();

  const roleName = user && user.role
    ? (typeof user.role === 'string' ? user.role : (user.role.nom || user.role.name || 'ADMIN'))
    : 'ADMIN';

  const [avatarUrl, setAvatarUrl] = useState(() => getUserAvatar(user));

  useEffect(() => {
    setAvatarUrl(getUserAvatar(user));
  }, [user]);

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e?.detail?.avatarUrl) {
        setAvatarUrl(e.detail.avatarUrl);
      }
    };
    window.addEventListener('parkauto:avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('parkauto:avatar-updated', handleAvatarUpdate);
  }, []);

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

  const handleBellClick = useCallback(async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    setShowNotifications(true);
    setShowProfile(false);
    setLoadingNotifs(true);
    try {
      const items = await fetchRoleNotifications(roleName);
      setNotifications(items);
    } finally {
      setLoadingNotifs(false);
    }
  }, [showNotifications, roleName]);

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const initials = ((user?.prenom?.[0] || 'S') + (user?.nom?.[0] || 'A')).toUpperCase();

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

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-[#C59B27]/40 bg-white p-0.5 flex items-center justify-center">
              <img 
                src="/assets/park_auto_logo.jpg" 
                alt="Logo PARK AUTO MEF" 
                className="w-full h-full object-contain" 
              />
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
        <div className="flex items-center gap-3">
          {/* Date Chip */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#0A1E3F] font-semibold bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-full shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
            <span className="capitalize">{dateStr}</span>
          </div>

          {/* Clock Chip */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#0A1E3F] font-bold bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-full shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
            <span className="tabular-nums">{time}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className={`relative p-2 rounded-lg transition-all cursor-pointer group ${showNotifications ? 'bg-[#C59B27]/15 text-[#C59B27]' : 'text-slate-600 hover:bg-[#C59B27]/10'}`}
            >
              <Bell className={`w-5 h-5 transition-colors ${showNotifications ? 'text-[#C59B27]' : 'group-hover:text-[#C59B27]'}`} />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#C1272D] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1 shadow-sm animate-pulse">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                loading={loadingNotifs}
                onClose={() => setShowNotifications(false)}
                onNavigate={handleNavigate}
              />
            )}
          </div>

          {/* User Profile Pill with Star Badge */}
          <div className="relative">
            <div
              onClick={handleProfileClick}
              className={`flex items-center gap-2.5 cursor-pointer px-2.5 py-1.5 rounded-xl transition-all group ${showProfile ? 'bg-[#C59B27]/10 ring-1 ring-[#C59B27]/30' : 'hover:bg-[#C59B27]/5'}`}
            >
              <div className={`w-9 h-9 rounded-full overflow-hidden border-2 shadow-sm flex-shrink-0 transition-colors ${showProfile ? 'border-[#C59B27]' : 'border-[#E2E8F0] group-hover:border-[#C59B27]'}`}>
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full gold-gradient-bg text-[#071530] text-xs font-black flex items-center justify-center">${initials}</div>`;
                  }}
                />
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-xs font-bold text-[#0A1E3F] leading-tight flex items-center gap-1.5">
                  {user ? `${user.prenom} ${user.nom}` : 'Système Administrateur'}
                  <StarBadge className="text-[#C59B27]" />
                </span>
                <span className="text-[10px] gold-gradient-text font-extrabold leading-tight uppercase tracking-wider">
                  {roleName}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#C59B27] hidden lg:block transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
            </div>
            {showProfile && (
              <ProfileDropdown
                user={user}
                roleName={roleName}
                avatarUrl={avatarUrl}
                onClose={() => setShowProfile(false)}
                onLogout={onLogout}
                onNavigate={handleNavigate}
              />
            )}
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
