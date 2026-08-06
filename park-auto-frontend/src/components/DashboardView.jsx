import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car, CheckCircle2, Calendar, Wrench, RotateCw, BarChart3, Fuel,
  Send, ClipboardCheck, XCircle, Clock, ArrowRight, FileText, User, Loader2,
  TrendingDown, TrendingUp, Activity, Droplets, ShieldAlert, AlertTriangle, CreditCard, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../services/api';
import { vehiculeService } from '../services/vehiculeService';
import { carburantService } from '../services/carburantService';
import { maintenanceService } from '../services/maintenanceService';
import { DIRECTIONS_MEF, FUEL_LABELS, MoroccanPlate } from '../utils/vehicule';

// Animated counter component
function AnimatedCounter({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0 || !value) { setDisplay(0); return; }
    let start = 0;
    const numericValue = typeof value === 'number' ? Math.round(value) : parseInt(value, 10) || 0;
    const step = Math.ceil(numericValue / (duration * 60)) || 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= numericValue) { setDisplay(numericValue); clearInterval(timer); }
      else setDisplay(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

// 8-Pointed Star Moroccan Zellij Emblem SVG
function MoroccanStarEmblem() {
  return (
    <svg className="w-9 h-9 text-[#C59B27] flex-shrink-0" viewBox="0 0 100 100" fill="none">
      <path d="M50 5 L61.8 23.2 L83.2 16.8 L76.8 38.2 L95 50 L76.8 61.8 L83.2 83.2 L61.8 76.8 L50 95 L38.2 76.8 L16.8 83.2 L23.2 61.8 L5 50 L23.2 38.2 L16.8 16.8 L38.2 23.2 Z"
            stroke="currentColor" strokeWidth="3" fill="rgba(197, 155, 39, 0.1)" />
      <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <polygon points="50,34 54,46 66,50 54,54 50,66 46,54 34,50 46,46" fill="currentColor" />
    </svg>
  );
}

const FUEL_COLORS = { DIESEL: '#0A1E3F', ESSENCE: '#C59B27', HYBRIDE: '#0D7A5F', ELECTRIQUE: '#1565C0' };

const TOOLTIP_STYLE = {
  backgroundColor: '#0A1E3F',
  border: '1px solid #122B55',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
};

const isMaintenance = (v) => ['EN_ENTRETIEN', 'EN_REPARATION', 'IMMOBILISE', 'EN_MAINTENANCE'].includes(v.statutAdministratif);

const DEMAND_STATUS = {
  EN_ATTENTE_VALIDATION: { badge: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock, label: 'En Attente N1' },
  VALIDEE_SERVICE: { badge: 'bg-blue-100 text-blue-800 border-blue-300', icon: ClipboardCheck, label: 'Validée Service' },
  APPROUVEE_AFFECTEE: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2, label: 'Affectée' },
  TERMINEE: { badge: 'bg-slate-100 text-slate-700 border-slate-300', icon: CheckCircle2, label: 'Terminée' },
  REJETEE: { badge: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Rejetée' },
};

const ROLE_LABELS = {
  ADMIN: 'Administrateur Système',
  ADMIN_CENTRAL: 'Administrateur Central MEF',
  GESTIONNAIRE_CENTRAL: 'Gestionnaire Central du Parc',
  GESTIONNAIRE_LOCAL: 'Gestionnaire Local du Parc',
  CHEF_PARC_REGIONAL: 'Chef du Parc Régional',
  RESPONSABLE_PARC: 'Responsable du Parc MEF',
  RESPONSABLE_FINANCIER: 'Responsable Financier',
  RESPONSABLE_SERVICE: 'Responsable de Service',
  CONDUCTEUR: 'Conducteur / Chauffeur',
  CHAUFFEUR: 'Conducteur / Chauffeur',
  CONSULTATION: 'Auditeur / Consultation',
};

export default function DashboardView({ user }) {
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [pleins, setPleins] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  const roleName = user?.role?.nom || user?.role || 'CONSULTATION';
  const fullName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehRes, demRes, pleinsRes, cartesRes, anomRes, intervRes, alertesRes] = await Promise.allSettled([
        vehiculeService.getVehicules(),
        api.get('/demandes'),
        carburantService.getPleins(),
        carburantService.getCartes(),
        carburantService.getAnomalies(),
        maintenanceService.getInterventions(),
        maintenanceService.getAlertes(),
      ]);

      if (vehRes.status === 'fulfilled') {
        const list = vehRes.value?.content || vehRes.value?.data || (Array.isArray(vehRes.value) ? vehRes.value : []);
        setVehicules(Array.isArray(list) ? list : []);
      }
      if (demRes.status === 'fulfilled') {
        const d = demRes.value?.data || demRes.value;
        setDemandes(Array.isArray(d) ? d : (d?.content || []));
      }
      if (pleinsRes.status === 'fulfilled') {
        const p = pleinsRes.value?.data || pleinsRes.value;
        setPleins(Array.isArray(p) ? p : []);
      }
      if (cartesRes.status === 'fulfilled') {
        const c = cartesRes.value?.data || cartesRes.value;
        setCartes(Array.isArray(c) ? c : []);
      }
      if (anomRes.status === 'fulfilled') {
        const a = anomRes.value?.data || anomRes.value;
        setAnomalies(Array.isArray(a) ? a : []);
      }
      if (intervRes.status === 'fulfilled') {
        const i = intervRes.value?.data || intervRes.value;
        setInterventions(Array.isArray(i) ? i : []);
      }
      if (alertesRes.status === 'fulfilled') {
        const al = alertesRes.value?.data || alertesRes.value;
        setAlertes(Array.isArray(al) ? al : []);
      }
    } catch (err) {
      console.error('Erreur de chargement du tableau de bord:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const onGlobalRefresh = () => fetchData();
    window.addEventListener('parkauto:refresh', onGlobalRefresh);
    return () => window.removeEventListener('parkauto:refresh', onGlobalRefresh);
  }, []);

  const userDirection = user?.direction;
  const filteredVehicules = useMemo(() => {
    if (['CHEF_PARC_REGIONAL', 'CHEF_SERVICE', 'RESPONSABLE_SERVICE'].includes(roleName) && userDirection) {
      return vehicules.filter(v => v.direction === userDirection);
    }
    return vehicules;
  }, [vehicules, roleName, userDirection]);

  const metrics = useMemo(() => ({
    total: filteredVehicules.length,
    disponibles: filteredVehicules.filter((v) => v.statutAdministratif === 'DISPONIBLE').length,
    enMission: filteredVehicules.filter((v) => ['AFFECTE', 'RESERVE', 'EN_MISSION'].includes(v.statutAdministratif)).length,
    maintenance: filteredVehicules.filter(isMaintenance).length,
  }), [filteredVehicules]);

  const financialMetrics = useMemo(() => {
    const totalFuelSpent = pleins.reduce((sum, p) => sum + (parseFloat(p.montantTTC) || 0), 0);
    const totalMaintenanceSpent = interventions.reduce((sum, i) => sum + (parseFloat(i.montantTotal) || 0), 0);
    const activeCardsCount = cartes.filter(c => c.statut === 'ACTIVE').length;
    
    return {
      totalFuelSpent,
      totalMaintenanceSpent,
      totalAlertes: alertes.length,
      totalAnomalies: anomalies.length,
      activeCardsCount
    };
  }, [pleins, interventions, alertes, anomalies, cartes]);

  const demandStats = useMemo(() => ({
    enAttente: demandes.filter((d) => d.statut === 'EN_ATTENTE_VALIDATION').length,
    validees: demandes.filter((d) => d.statut === 'VALIDEE_SERVICE').length,
    affectees: demandes.filter((d) => ['APPROUVEE_AFFECTEE', 'EN_COURS'].includes(d.statut)).length,
    terminees: demandes.filter((d) => d.statut === 'TERMINEE').length,
    rejetees: demandes.filter((d) => d.statut === 'REJETEE').length,
  }), [demandes]);

  const directionData = useMemo(() =>
    DIRECTIONS_MEF.map((d) => ({
      name: d.short,
      fullName: d.value,
      véhicules: filteredVehicules.filter((v) => v.direction === d.value).length,
    })),
  [filteredVehicules]);

  const fuelData = useMemo(() =>
    Object.keys(FUEL_LABELS)
      .map((key) => ({
        name: FUEL_LABELS[key],
        value: filteredVehicules.filter((v) => v.typeCarburant === key).length,
        color: FUEL_COLORS[key],
      }))
      .filter((f) => f.value > 0),
  [filteredVehicules]);

  const totalFuelVehicles = useMemo(() => fuelData.reduce((sum, f) => sum + f.value, 0), [fuelData]);

  const mainKpiCards = [
    { label: 'Total Flotte', sub: 'Véhicules enregistrés', value: metrics.total, icon: Car, iconBg: 'bg-[#0A1E3F]', bar: 'bg-[#0A1E3F]', delay: 0 },
    { label: 'Disponibles', sub: 'Prêts à être affectés', value: metrics.disponibles, icon: CheckCircle2, iconBg: 'bg-[#0D7A5F]', bar: 'bg-[#0D7A5F]', delay: 0.08 },
    { label: 'En Mission', sub: 'Affectés / En Service', value: metrics.enMission, icon: Calendar, iconBg: 'bg-[#1565C0]', bar: 'bg-[#1565C0]', delay: 0.16 },
    { label: 'En Maintenance', sub: 'Entretien / Immobilisés', value: metrics.maintenance, icon: Wrench, iconBg: 'bg-[#C47D2B]', bar: 'bg-[#C47D2B]', delay: 0.24 },
  ];

  const financialKpiCards = [
    { label: 'Carburant Total (MAD)', sub: 'Dépenses enregistrées', value: Math.round(financialMetrics.totalFuelSpent), icon: Fuel, iconBg: 'bg-[#0A1E3F]', bar: 'bg-[#C59B27]', isCurrency: true },
    { label: 'Maintenance (MAD)', sub: 'Coût des interventions', value: Math.round(financialMetrics.totalMaintenanceSpent), icon: DollarSign, iconBg: 'bg-[#0D7A5F]', bar: 'bg-[#0D7A5F]', isCurrency: true },
    { label: 'Alertes Légales & Km', sub: 'Échéances à traiter', value: financialMetrics.totalAlertes, icon: ShieldAlert, iconBg: 'bg-[#C47D2B]', bar: 'bg-[#C47D2B]' },
    { label: 'Cartes Carburant', sub: 'Cartes actives MEF', value: financialMetrics.activeCardsCount, icon: CreditCard, iconBg: 'bg-[#1565C0]', bar: 'bg-[#1565C0]' },
  ];

  if (loading && vehicules.length === 0 && demandes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm moroccan-star-bg relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <MoroccanStarEmblem />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase">
                {fullName ? `Bienvenue, ${fullName}` : 'Tableau de Bord'}
              </h2>
              <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">لوحة القيادة والمؤشرات</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="gold-gradient-text font-extrabold uppercase tracking-wider text-[10px]">{ROLE_LABELS[roleName] || roleName}</span>
              · Vue d'ensemble de la flotte automobile du Ministère
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="bg-[#0A1E3F] hover:bg-[#122B55] text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 relative z-10"
        >
          <RotateCw className={`w-4 h-4 text-[#D7B14A] ${loading ? 'animate-spin' : ''}`} />
          Actualiser les Données
        </button>
      </div>

      {roleName === 'CONDUCTEUR' || roleName === 'CHAUFFEUR' ? (
        <DriverDashboard
          user={user}
          vehicules={vehicules}
          pleins={pleins}
          demandes={demandes}
          interventions={interventions}
          alertes={alertes}
          navigate={navigate}
        />
      ) : (
        <ManagementDashboard
          mainKpiCards={mainKpiCards}
          financialKpiCards={financialKpiCards}
          directionData={directionData}
          fuelData={fuelData}
          totalFuelVehicles={totalFuelVehicles}
          demandes={demandes}
          demandStats={demandStats}
          navigate={navigate}
          vehicules={filteredVehicules}
          alertes={alertes}
          interventions={interventions}
          pleins={pleins}
        />
      )}
    </div>
  );
}

function KpiCardsGrid({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Array.isArray(cards) ? cards : []).map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center text-white shadow-sm`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">{card.label}</span>
                <span className="text-2xl font-black font-outfit text-[#0A1E3F]">
                  <AnimatedCounter value={card.value} /> {card.isCurrency ? 'MAD' : ''}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 block">{card.sub}</span>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.bar}`} />
          </motion.div>
        );
      })}
    </div>
  );
}

const KpiCards = ({ kpiCards }) => <KpiCardsGrid cards={kpiCards} />;

function FleetCharts({ directionData, fuelData, totalFuelVehicles }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <motion.div
        className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
              <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Répartition par Direction MEF</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Nombre de véhicules rattachés à chaque direction</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={directionData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: 'rgba(10,30,63,0.04)' }}
              labelFormatter={(label) => directionData.find((d) => d.name === label)?.fullName || label}
            />
            <Bar dataKey="véhicules" fill="#0A1E3F" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
              <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Répartition par Carburant</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Motorisation de la flotte</p>
          </div>
        </div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={fuelData.length > 0 ? fuelData : [{ name: 'Diesel', value: totalFuelVehicles || 1, color: '#0A1E3F' }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                stroke="#fff"
                strokeWidth={3}
              >
                {(fuelData.length > 0 ? fuelData : [{ color: '#0A1E3F' }]).map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-3xl font-black font-outfit text-[#0A1E3F] block leading-none">
              {totalFuelVehicles}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 block mt-1">Véhicules</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-[11px] font-bold text-slate-700">
          {(fuelData.length > 0 ? fuelData : [{ name: 'Diesel', color: '#0A1E3F', value: 0 }]).map((f) => (
            <span key={f.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
              {f.name}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


/* =====================================================================
   Recent Demandes List (real data from /demandes)
   ===================================================================== */
function RecentDemandes({ demandes, navigate, limit = 6, emptyHint = 'Aucune demande enregistrée pour le moment.' }) {
  const recent = [...demandes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-[#C59B27]" />
          <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Dernières Demandes de Déplacement</h3>
        </div>
        <Link to="/demandes" className="text-[11px] font-bold text-[#C59B27] hover:text-[#94700E] flex items-center gap-1 transition-colors">
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">{emptyHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recent.map((d) => {
            const s = DEMAND_STATUS[d.statut] || DEMAND_STATUS.TERMINEE;
            const Icon = s.icon;
            return (
              <button
                key={d.id}
                onClick={() => navigate(`/demandes/${d.id}`)}
                className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 border-l-4 border-l-[#C59B27] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0A1E3F] flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-[#0A1E3F] block leading-tight truncate">
                      <span className="font-mono text-[#C59B27]">{d.reference}</span> — {d.motif}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                      {d.destination}
                      {d.dateHeureDepart ? ` · ${new Date(d.dateHeureDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 border flex-shrink-0 ml-3 ${s.badge}`}>
                  <Icon className="w-3 h-3" /> {s.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   CONDUCTEUR : Mes missions & demandes
   ===================================================================== */
function DriverDashboard({ demandes, userId, navigate, onRefresh, loading }) {
  const myDemandes = demandes.filter((d) => d.demandeurId === userId || d.demandeurId === String(userId));
  const myStats = {
    enAttente: myDemandes.filter((d) => d.statut === 'EN_ATTENTE_VALIDATION').length,
    affectees: myDemandes.filter((d) => ['APPROUVEE_AFFECTEE', 'EN_COURS'].includes(d.statut)).length,
    terminees: myDemandes.filter((d) => d.statut === 'TERMINEE').length,
  };

  const cards = [
    { label: 'Mes Demandes', sub: 'Total enregistré', value: myDemandes.length, icon: Send, iconBg: 'bg-[#0A1E3F]', bar: 'bg-[#0A1E3F]' },
    { label: 'En Attente / En Cours', sub: 'Demandes ouvertes', value: myStats.enAttente + myStats.affectees, icon: Clock, iconBg: 'bg-[#1565C0]', bar: 'bg-[#1565C0]' },
    { label: 'Missions Terminées', sub: 'Clôturées', value: myStats.terminees, icon: CheckCircle2, iconBg: 'bg-[#0D7A5F]', bar: 'bg-[#0D7A5F]' },
  ];

  return (
    <div className="space-y-6">
      {/* Driver KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center text-white shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{card.label}</span>
                  <span className="text-3xl font-black font-outfit text-[#0A1E3F]">
                    <AnimatedCounter value={card.value} />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 block">{card.sub}</span>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.bar}`} />
            </motion.div>
          );
        })}
      </div>

      {/* My demandes */}
      <RecentDemandes
        demandes={myDemandes}
        navigate={navigate}
        limit={8}
        emptyHint="Aucune demande de déplacement à votre nom pour le moment."
      />
    </div>
  );
}

/* =====================================================================
   Demand Pipeline
   ===================================================================== */
function DemandPipeline({ demandStats = {} }) {
  const items = [
    { label: 'En Attente N1', count: demandStats.enAttente || 0, icon: Clock, color: 'bg-amber-500' },
    { label: 'Validées Service', count: demandStats.validees || 0, icon: ClipboardCheck, color: 'bg-blue-500' },
    { label: 'Affectées / En Cours', count: demandStats.affectees || 0, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Terminées', count: demandStats.terminees || 0, icon: FileText, color: 'bg-slate-500' },
    { label: 'Rejetées', count: demandStats.rejetees || 0, icon: XCircle, color: 'bg-red-500' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${it.color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{it.label}</p>
              <p className="text-2xl font-black text-[#0A1E3F]">{it.count}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =====================================================================
   Activité Récente
   ===================================================================== */
function ActiviteRecente({ demandes = [], navigate }) {
  const ACTIVITY_STATUS_MAP = {
    TERMINEE: { label: 'Terminé', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    VALIDEE_SERVICE: { label: 'Validée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    APPROUVEE_AFFECTEE: { label: 'Affectée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    EN_ATTENTE_VALIDATION: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    EN_COURS: { label: 'En cours', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    REJETEE: { label: 'Rejeté', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  };

  const recent = [...demandes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
            <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Activité Récente</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dernières actions et mises à jour</p>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400">Aucune activité récente</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recent.map((d) => {
            const status = ACTIVITY_STATUS_MAP[d.statut] || ACTIVITY_STATUS_MAP.EN_ATTENTE_VALIDATION;
            return (
              <button
                key={d.id}
                onClick={() => navigate(`/demandes/${d.id}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-[#0A1E3F] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C59B27]/10">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#0A1E3F] block truncate">{d.motif || d.reference || 'Demande'}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {d.destination || ''}
                      {d.dateHeureDepart ? ` · ${new Date(d.dateHeureDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 flex-shrink-0 ml-2 ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* =====================================================================
   Consommation Moyenne — computed from real pleins (fuel records)
   ===================================================================== */
function ConsommationMoyenne({ pleins = [] }) {
  // Use real consommationMoyenne from fuel records (set by backend per plein)
  const pleinsWithConso = pleins.filter((p) => p.consommationMoyenne && p.consommationMoyenne > 0);
  const avgConso = pleinsWithConso.length > 0
    ? (pleinsWithConso.reduce((sum, p) => sum + p.consommationMoyenne, 0) / pleinsWithConso.length).toFixed(1)
    : null;

  // Chart: last 10 fuel records sorted by date ascending
  const consoData = [...pleinsWithConso]
    .sort((a, b) => new Date(a.datePlein || 0) - new Date(b.datePlein || 0))
    .slice(-10)
    .map((p, idx) => ({
      name: p.datePlein ? new Date(p.datePlein).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : `P${idx + 1}`,
      conso: p.consommationMoyenne,
    }));

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
          <Droplets className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
            <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Consommation Moyenne</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Moyenne flotte enregistrée</p>
        </div>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <span className="text-4xl font-black font-outfit text-[#0A1E3F] leading-none">{avgConso || '—'}</span>
        <span className="text-sm font-bold text-slate-500 pb-0.5">L/100km</span>
      </div>

      {consoData.length >= 2 ? (
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={consoData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="consoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00A896" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="conso" stroke="#00A896" strokeWidth={2.5} fill="url(#consoGradient)" dot={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => [`${val} L/100km`, 'Consommation']} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[100px] flex items-center justify-center">
          <p className="text-[11px] text-slate-400 font-medium">
            {avgConso ? 'Données insuffisantes pour le graphique' : 'Aucune donnée de consommation'}
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* =====================================================================
   Live Alert Center Table (Sprint 3 Integration)
   ===================================================================== */
function DashboardAlertCenter({ alertes = [], navigate }) {
  const topAlertes = alertes.slice(0, 5);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-[#C59B27]" />
          <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#C59B27]" />
            Alertes &amp; Échéances à Traiter ({alertes.length})
          </h3>
        </div>
        <button
          onClick={() => navigate('/maintenance')}
          className="text-[11px] font-bold text-[#C59B27] hover:text-[#94700E] flex items-center gap-1 transition-colors cursor-pointer"
        >
          Voir tout <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {topAlertes.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
          <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Toutes les échéances et seuils de maintenance sont à jour.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="enterprise-table w-full">
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Immatriculation</th>
                <th>Alerte / Échéance</th>
                <th>Direction</th>
                <th className="!text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {topAlertes.map((a, idx) => {
                const isCrit = a.niveauSeverite === 'CRITIQUE';
                return (
                  <tr key={a.id || idx}>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isCrit ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {a.typeAlerte || 'ALERTE'}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-[#0A1E3F] text-xs">{a.immatriculation || '—'}</td>
                    <td>
                      <div className="font-bold text-[#0A1E3F] text-xs">{a.titre || a.message}</div>
                      {a.titre && a.message && <div className="text-[10px] text-slate-500 line-clamp-1">{a.message}</div>}
                    </td>
                    <td className="text-xs font-bold text-[#C59B27]">{a.direction || '—'}</td>
                    <td className="!text-right">
                      <button
                        onClick={() => navigate('/maintenance')}
                        className="gold-gradient-bg text-[#0A1E3F] font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm hover:brightness-105 transition-all cursor-pointer"
                      >
                        Traiter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

/* =====================================================================
   CONSULTATION : Read-only fleet overview
   ===================================================================== */
function ConsultationOverview({ mainKpiCards, financialKpiCards, directionData, fuelData, totalFuelVehicles, demandes, demandStats, navigate, vehicules, pleins }) {
  return (
    <div className="space-y-6">
      <KpiCardsGrid cards={mainKpiCards || []} />
      <KpiCardsGrid cards={financialKpiCards || []} />
      <FleetCharts directionData={directionData || []} fuelData={fuelData || []} totalFuelVehicles={totalFuelVehicles || 0} />
      <DemandPipeline demandStats={demandStats || { enAttente: 0, validees: 0, affectees: 0, terminees: 0, rejetees: 0 }} />

      {/* Bottom Row: Activité Récente + Consommation Moyenne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ActiviteRecente demandes={demandes || []} navigate={navigate} />
        </div>
        <ConsommationMoyenne pleins={pleins || []} />
      </div>
    </div>
  );
}

/* =====================================================================
   MANAGEMENT : Full dashboard
   ===================================================================== */
function ManagementDashboard({ mainKpiCards, financialKpiCards, directionData, fuelData, totalFuelVehicles, demandes, demandStats, navigate, vehicules, alertes, interventions, pleins }) {
  return (
    <div className="space-y-6">
      {/* Primary Fleet KPIs */}
      <KpiCardsGrid cards={mainKpiCards || []} />

      {/* Financial & Operational KPIs */}
      <KpiCardsGrid cards={financialKpiCards || []} />

      {/* Charts Row */}
      <FleetCharts directionData={directionData || []} fuelData={fuelData || []} totalFuelVehicles={totalFuelVehicles || 0} />

      {/* Live Alert Center Table */}
      <DashboardAlertCenter alertes={alertes || []} navigate={navigate} />

      {/* Demand Status Pipeline */}
      <DemandPipeline demandStats={demandStats || { enAttente: 0, validees: 0, affectees: 0, terminees: 0, rejetees: 0 }} />

      {/* Bottom Row: Activité Récente + Consommation Moyenne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ActiviteRecente demandes={demandes || []} navigate={navigate} />
        </div>
        <ConsommationMoyenne pleins={pleins || []} />
      </div>
    </div>
  );
}
