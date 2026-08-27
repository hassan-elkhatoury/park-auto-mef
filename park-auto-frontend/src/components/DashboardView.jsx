import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car, CheckCircle2, Calendar, Wrench, RotateCw, BarChart3, Fuel,
  Send, ClipboardCheck, XCircle, Clock, ArrowRight, FileText, User, Loader2,
  TrendingDown, TrendingUp, Activity, Droplets, ShieldAlert, AlertTriangle,
  CreditCard, DollarSign, Percent, Leaf, Gauge, PieChart as PieChartIcon,
  Users, Shield, Eye
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

// ═══ Animated Counter ═══
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

// ═══ Moroccan Star Emblem ═══
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

// ═══ Constants ═══
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

const ROLE_DESCRIPTIONS = {
  ADMIN: 'Vue complète — Pilotage global de la flotte MEF',
  GESTIONNAIRE_CENTRAL: 'Vue complète — Gestion centralisée du parc automobile',
  GESTIONNAIRE_LOCAL: 'Vue régionale — Gestion locale du parc',
  RESPONSABLE_FINANCIER: 'Vue financière — TCO, Budget & Prévisions',
  RESPONSABLE_SERVICE: 'Vue service — Validations & Demandes',
  CONDUCTEUR: 'Mes missions & demandes de déplacement',
  CHAUFFEUR: 'Mes missions & demandes de déplacement',
  CONSULTATION: 'Vue en lecture seule — Consultation & Audit',
};

// ═══ MAIN COMPONENT ═══
export default function DashboardView({ user }) {
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [pleins, setPleins] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [budgetSynthese, setBudgetSynthese] = useState(null);
  const [loading, setLoading] = useState(true);

  const roleName = user?.role?.nom || user?.role || 'CONSULTATION';
  const fullName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';
  const userId = user?.id;

  // Determine which data to fetch based on role
  const isFinancialRole = roleName === 'RESPONSABLE_FINANCIER';
  const isDriverRole = ['CONDUCTEUR', 'CHAUFFEUR'].includes(roleName);
  const isManagementRole = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'CHEF_PARC_REGIONAL', 'RESPONSABLE_PARC'].includes(roleName);
  const isServiceHead = roleName === 'RESPONSABLE_SERVICE';
  const isConsultation = roleName === 'CONSULTATION';

  const fetchData = async () => {
    try {
      setLoading(true);

      // Core data — always fetched
      const corePromises = [
        vehiculeService.getVehicules(),
        api.get('/demandes'),
      ];

      // Role-specific data
      const rolePromises = [];

      if (!isDriverRole) {
        rolePromises.push(
          carburantService.getPleins(),
          carburantService.getCartes(),
          carburantService.getAnomalies(),
          maintenanceService.getInterventions(),
          maintenanceService.getAlertes(),
        );
      }

      // Executive summary for management & financial roles
      if (isManagementRole || isFinancialRole || isConsultation) {
        rolePromises.push(
          api.get('/reporting/summary').catch(() => ({ data: null })),
        );
      }

      // Budget data for financial role
      if (isFinancialRole) {
        rolePromises.push(
          api.get('/budgets/synthese').catch(() => ({ data: null })),
        );
      }

      const [coreResults, roleResults] = await Promise.all([
        Promise.allSettled(corePromises),
        Promise.allSettled(rolePromises),
      ]);

      // Parse core results
      const [vehRes, demRes] = coreResults;

      if (vehRes.status === 'fulfilled') {
        const list = vehRes.value?.content || vehRes.value?.data || (Array.isArray(vehRes.value) ? vehRes.value : []);
        setVehicules(Array.isArray(list) ? list : []);
      }
      if (demRes.status === 'fulfilled') {
        const d = demRes.value?.data || demRes.value;
        setDemandes(Array.isArray(d) ? d : (d?.content || []));
      }

      // Parse role-specific results
      if (!isDriverRole) {
        let idx = 0;
        if (roleResults[idx]?.status === 'fulfilled') {
          const p = roleResults[idx].value?.data || roleResults[idx].value;
          setPleins(Array.isArray(p) ? p : []);
        }
        idx++;
        if (roleResults[idx]?.status === 'fulfilled') {
          const c = roleResults[idx].value?.data || roleResults[idx].value;
          setCartes(Array.isArray(c) ? c : []);
        }
        idx++;
        if (roleResults[idx]?.status === 'fulfilled') {
          const a = roleResults[idx].value?.data || roleResults[idx].value;
          setAnomalies(Array.isArray(a) ? a : []);
        }
        idx++;
        if (roleResults[idx]?.status === 'fulfilled') {
          const i = roleResults[idx].value?.data || roleResults[idx].value;
          setInterventions(Array.isArray(i) ? i : []);
        }
        idx++;
        if (roleResults[idx]?.status === 'fulfilled') {
          const al = roleResults[idx].value?.data || roleResults[idx].value;
          setAlertes(Array.isArray(al) ? al : []);
        }
        idx++;

        // Executive summary
        if ((isManagementRole || isFinancialRole || isConsultation) && roleResults[idx]?.status === 'fulfilled') {
          const summary = roleResults[idx].value?.data || roleResults[idx].value;
          setExecutiveSummary(summary);
          idx++;
        }

        // Budget synthese
        if (isFinancialRole && roleResults[idx]?.status === 'fulfilled') {
          const budget = roleResults[idx].value?.data || roleResults[idx].value;
          setBudgetSynthese(Array.isArray(budget) ? budget : (budget ? [budget] : []));
        }
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

  // ═══ Computed Metrics ═══
  const userDirection = user?.direction;
  const filteredVehicules = useMemo(() => {
    if (['GESTIONNAIRE_LOCAL', 'CHEF_PARC_REGIONAL', 'CHEF_SERVICE', 'RESPONSABLE_SERVICE'].includes(roleName) && userDirection) {
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
    total: demandes.length,
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

  // ═══ KPI Cards ═══
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

  // ═══ Loading State ═══
  if (loading && vehicules.length === 0 && demandes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // ═══ Render ═══
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ═══ Welcome Header ═══ */}
      <DashboardHeader
        fullName={fullName}
        roleName={roleName}
        loading={loading}
        onRefresh={fetchData}
      />

      {/* ═══ Role-Based Dashboard Content ═══ */}
      {isDriverRole ? (
        <DriverDashboard
          user={user}
          userId={userId}
          demandes={demandes}
          vehicules={vehicules}
          pleins={pleins}
          navigate={navigate}
        />
      ) : isFinancialRole ? (
        <FinancialDashboard
          mainKpiCards={mainKpiCards}
          financialKpiCards={financialKpiCards}
          executiveSummary={executiveSummary}
          budgetSynthese={budgetSynthese}
          anomalies={anomalies}
          pleins={pleins}
          interventions={interventions}
          fuelData={fuelData}
          totalFuelVehicles={totalFuelVehicles}
          navigate={navigate}
        />
      ) : isServiceHead ? (
        <ServiceHeadDashboard
          mainKpiCards={mainKpiCards}
          demandes={demandes}
          demandStats={demandStats}
          navigate={navigate}
          vehicules={filteredVehicules}
          userDirection={userDirection}
          pleins={pleins}
        />
      ) : isConsultation ? (
        <ConsultationOverview
          mainKpiCards={mainKpiCards}
          financialKpiCards={financialKpiCards}
          directionData={directionData}
          fuelData={fuelData}
          totalFuelVehicles={totalFuelVehicles}
          demandes={demandes}
          demandStats={demandStats}
          navigate={navigate}
          vehicules={filteredVehicules}
          pleins={pleins}
          executiveSummary={executiveSummary}
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
          executiveSummary={executiveSummary}
        />
      )}
    </div>
  );
}


/* =====================================================================
   SHARED: Dashboard Header with Role-aware Welcome
   ===================================================================== */
function DashboardHeader({ fullName, roleName, loading, onRefresh }) {
  return (
    <motion.div
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath fill='%23C59B27' d='M40 0l11.71 11.71H68.29V28.29L80 40l-11.71 11.71v16.57H51.71L40 80l-11.71-11.71H11.71V51.71L0 40l11.71-11.71V11.71h16.57z'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
      }} />

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
            · {ROLE_DESCRIPTIONS[roleName] || 'Vue d\'ensemble de la flotte automobile du Ministère'}
          </p>
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="bg-[#0A1E3F] hover:bg-[#122B55] text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 relative z-10"
      >
        <RotateCw className={`w-4 h-4 text-[#D7B14A] ${loading ? 'animate-spin' : ''}`} />
        Actualiser les Données
      </button>
    </motion.div>
  );
}


/* =====================================================================
   SHARED: Executive Summary Strip (from /api/reporting/summary)
   ===================================================================== */
function ExecutiveSummaryStrip({ executiveSummary }) {
  if (!executiveSummary) return null;

  const items = [
    {
      label: 'Taux d\'utilisation',
      value: executiveSummary.tauxUtilisation != null ? `${Math.round(executiveSummary.tauxUtilisation)}%` : '—',
      icon: Percent,
      color: 'text-[#0D7A5F]',
      bg: 'bg-emerald-50',
    },
    {
      label: 'TCO Global (MAD)',
      value: executiveSummary.tcoGlobal != null ? Math.round(executiveSummary.tcoGlobal).toLocaleString() : '—',
      icon: DollarSign,
      color: 'text-[#C59B27]',
      bg: 'bg-amber-50',
    },
    {
      label: 'Taux Immobilisation',
      value: executiveSummary.tauxImmobilisation != null ? `${Math.round(executiveSummary.tauxImmobilisation)}%` : '—',
      icon: Wrench,
      color: 'text-[#C47D2B]',
      bg: 'bg-orange-50',
    },
    {
      label: 'Émissions CO₂ (kg)',
      value: executiveSummary.emissionsCO2 != null ? Math.round(executiveSummary.emissionsCO2).toLocaleString() : '—',
      icon: Leaf,
      color: 'text-[#1565C0]',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <motion.div
      className="bg-gradient-to-r from-[#0A1E3F] to-[#122B55] rounded-2xl p-5 shadow-lg border border-[#1A3666]"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
        <h3 className="font-outfit font-extrabold text-sm text-white">Indicateurs Exécutifs</h3>
        <span className="text-[10px] text-[#C59B27] font-bold uppercase tracking-wider ml-1">API Reporting</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-xl font-black font-outfit text-white block">{item.value}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


/* =====================================================================
   SHARED: KPI Cards Grid
   ===================================================================== */
function KpiCardsGrid({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Array.isArray(cards) ? cards : []).map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
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


/* =====================================================================
   SHARED: Fleet Charts (Direction Bar + Fuel Pie)
   ===================================================================== */
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
   SHARED: Recent Demandes List
   ===================================================================== */
function RecentDemandes({ demandes, navigate, limit = 6, emptyHint = 'Aucune demande enregistrée pour le moment.' }) {
  const recent = [...demandes]
    .sort((a, b) => new Date(b.createdAt || b.dateCreation || 0) - new Date(a.createdAt || a.dateCreation || 0))
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
   SHARED: Demand Pipeline
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
          <motion.div
            key={it.label}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${it.color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{it.label}</p>
              <p className="text-2xl font-black text-[#0A1E3F]">{it.count}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


/* =====================================================================
   SHARED: Activité Récente
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
    .sort((a, b) => new Date(b.createdAt || b.dateCreation || 0) - new Date(a.createdAt || a.dateCreation || 0))
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
   SHARED: Consommation Moyenne
   ===================================================================== */
function ConsommationMoyenne({ pleins = [] }) {
  const pleinsWithConso = pleins.filter((p) => p.consommationMoyenne && p.consommationMoyenne > 0);
  const avgConso = pleinsWithConso.length > 0
    ? (pleinsWithConso.reduce((sum, p) => sum + p.consommationMoyenne, 0) / pleinsWithConso.length).toFixed(1)
    : null;

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
   SHARED: Live Alert Center Table
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
   ROLE: CONDUCTEUR / CHAUFFEUR — Driver Dashboard
   ===================================================================== */
function DriverDashboard({ user, userId, demandes, vehicules, pleins, navigate }) {
  // Filter demandes for this driver (match by user ID or demandeur info)
  const myDemandes = useMemo(() => {
    return demandes.filter((d) => {
      const demandeurId = d.demandeurId || d.demandeur?.id;
      return demandeurId === userId || demandeurId === String(userId) ||
             d.demandeur?.email === user?.email;
    });
  }, [demandes, userId, user?.email]);

  // Find assigned vehicle
  const assignedVehicle = useMemo(() => {
    return vehicules.find(v =>
      v.conducteurId === userId ||
      v.conducteur?.id === userId ||
      (v.statutAdministratif === 'AFFECTE' && v.conducteur?.email === user?.email)
    );
  }, [vehicules, userId, user?.email]);

  const myStats = useMemo(() => ({
    enAttente: myDemandes.filter((d) => d.statut === 'EN_ATTENTE_VALIDATION').length,
    affectees: myDemandes.filter((d) => ['APPROUVEE_AFFECTEE', 'EN_COURS'].includes(d.statut)).length,
    terminees: myDemandes.filter((d) => d.statut === 'TERMINEE').length,
    total: myDemandes.length,
  }), [myDemandes]);

  const cards = [
    { label: 'Mes Demandes', sub: 'Total enregistré', value: myStats.total, icon: Send, iconBg: 'bg-[#0A1E3F]', bar: 'bg-[#0A1E3F]' },
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
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow"
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

      {/* Assigned Vehicle Card */}
      {assignedVehicle && (
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-7 rounded-full bg-[#C59B27]" />
            <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Mon Véhicule Affecté</h3>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-14 h-14 rounded-xl bg-[#0A1E3F] flex items-center justify-center text-white">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-[#0A1E3F] text-sm">{assignedVehicle.marque} {assignedVehicle.modele}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <MoroccanPlate immatriculation={assignedVehicle.immatriculation} />
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {assignedVehicle.typeCarburant && FUEL_LABELS[assignedVehicle.typeCarburant]} · {assignedVehicle.kilometrageActuel?.toLocaleString() || '—'} km
              </p>
            </div>
            <button
              onClick={() => navigate(`/vehicules/${assignedVehicle.id}`)}
              className="ml-auto text-[11px] font-bold text-[#C59B27] hover:text-[#94700E] flex items-center gap-1 cursor-pointer"
            >
              Détails <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}

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
   ROLE: RESPONSABLE_FINANCIER — Financial Dashboard
   ===================================================================== */
function FinancialDashboard({ mainKpiCards, financialKpiCards, executiveSummary, budgetSynthese, anomalies, pleins, interventions, fuelData, totalFuelVehicles, navigate }) {
  // Budget execution data for chart
  const budgetChartData = useMemo(() => {
    if (!budgetSynthese || !Array.isArray(budgetSynthese)) return [];
    return budgetSynthese.map(b => ({
      name: b.typeDepense || b.direction || b.libelle || 'Budget',
      alloue: b.montantAlloue || b.budgetAlloue || 0,
      consomme: b.montantConsomme || b.budgetConsomme || 0,
      taux: b.tauxExecution || (b.montantAlloue ? Math.round((b.montantConsomme / b.montantAlloue) * 100) : 0),
    }));
  }, [budgetSynthese]);

  // Monthly fuel cost trend from pleins
  const fuelCostTrend = useMemo(() => {
    const monthMap = {};
    pleins.forEach(p => {
      if (!p.datePlein) return;
      const d = new Date(p.datePlein);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { name: label, montant: 0 };
      monthMap[key].montant += parseFloat(p.montantTTC) || 0;
    });
    return Object.values(monthMap).slice(-6);
  }, [pleins]);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <ExecutiveSummaryStrip executiveSummary={executiveSummary} />

      {/* Financial KPIs */}
      <KpiCardsGrid cards={financialKpiCards} />

      {/* Fleet KPIs (smaller) */}
      <KpiCardsGrid cards={mainKpiCards} />

      {/* Charts Row: Budget Execution + Fuel Cost Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Budget Execution */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
                <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Exécution Budgétaire</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Taux de consommation par type</p>
            </div>
          </div>

          {budgetChartData.length > 0 ? (
            <div className="space-y-3">
              {budgetChartData.map((b, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0A1E3F]">{b.name}</span>
                    <span className="text-[10px] font-extrabold text-[#C59B27]">{b.taux}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: b.taux > 90 ? '#C1272D' : b.taux > 70 ? '#C47D2B' : '#0D7A5F' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(b.taux, 100)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-slate-400">Consommé: {Math.round(b.consomme).toLocaleString()} MAD</span>
                    <span className="text-[10px] text-slate-400">Alloué: {Math.round(b.alloue).toLocaleString()} MAD</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <DollarSign className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">Aucune donnée budgétaire disponible</p>
            </div>
          )}
        </motion.div>

        {/* Fuel Cost Trend */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
                <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">Tendance Coût Carburant</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Évolution mensuelle des dépenses</p>
            </div>
          </div>

          {fuelCostTrend.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={fuelCostTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="fuelCostGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C59B27" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C59B27" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => [`${Math.round(val).toLocaleString()} MAD`, 'Dépense']} />
                <Area type="monotone" dataKey="montant" stroke="#C59B27" strokeWidth={2.5} fill="url(#fuelCostGradient)" dot={{ fill: '#C59B27', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[11px] text-slate-400 font-medium">Données insuffisantes pour le graphique</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-7 rounded-full bg-red-500" />
            <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Anomalies de Surconsommation ({anomalies.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Date</th>
                  <th>Consommation</th>
                  <th>Station</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 5).map((a, idx) => (
                  <tr key={a.id || idx}>
                    <td className="font-mono font-bold text-[#0A1E3F] text-xs">{a.vehicule?.immatriculation || a.immatriculation || '—'}</td>
                    <td className="text-xs">{a.datePlein ? new Date(a.datePlein).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>
                      <span className="text-xs font-bold text-red-600">{a.consommationMoyenne?.toFixed(1) || '—'} L/100km</span>
                    </td>
                    <td className="text-xs">{a.stationService || '—'}</td>
                    <td className="text-xs font-bold">{a.montantTTC ? `${parseFloat(a.montantTTC).toLocaleString()} MAD` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Consommation Moyenne */}
      <ConsommationMoyenne pleins={pleins} />
    </div>
  );
}


/* =====================================================================
   ROLE: RESPONSABLE_SERVICE — Service Head Dashboard
   ===================================================================== */
function ServiceHeadDashboard({ mainKpiCards, demandes, demandStats, navigate, vehicules, userDirection, pleins }) {
  // Pending N1 validations (highlight for this role)
  const pendingN1 = demandes.filter(d => d.statut === 'EN_ATTENTE_VALIDATION');

  return (
    <div className="space-y-6">
      {/* Urgent Action Card — Pending Validations */}
      {pendingN1.length > 0 && (
        <motion.div
          className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 p-5 shadow-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-outfit font-extrabold text-base text-[#0A1E3F]">
                  {pendingN1.length} Demande{pendingN1.length > 1 ? 's' : ''} en Attente de Validation N1
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">Ces demandes nécessitent votre validation en tant que Responsable de Service</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/demandes')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              Valider Maintenant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Fleet KPIs (filtered by direction) */}
      <KpiCardsGrid cards={mainKpiCards} />

      {/* Direction Context */}
      {userDirection && (
        <motion.div
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A1E3F] flex items-center justify-center text-[#D7B14A] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Périmètre de gestion</p>
              <p className="font-outfit font-extrabold text-sm text-[#0A1E3F]">{userDirection}</p>
            </div>
            <div className="ml-auto flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black font-outfit text-[#0A1E3F]">{vehicules.length}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Véhicules</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black font-outfit text-[#C59B27]">{demandStats.total}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Demandes</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Demand Pipeline */}
      <DemandPipeline demandStats={demandStats} />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentDemandes demandes={demandes} navigate={navigate} limit={8} />
        </div>
        <ConsommationMoyenne pleins={pleins} />
      </div>
    </div>
  );
}


/* =====================================================================
   ROLE: CONSULTATION — Read-only Overview
   ===================================================================== */
function ConsultationOverview({ mainKpiCards, financialKpiCards, directionData, fuelData, totalFuelVehicles, demandes, demandStats, navigate, vehicules, pleins, executiveSummary }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary (if available) */}
      <ExecutiveSummaryStrip executiveSummary={executiveSummary} />

      <KpiCardsGrid cards={mainKpiCards || []} />
      <KpiCardsGrid cards={financialKpiCards || []} />
      <FleetCharts directionData={directionData || []} fuelData={fuelData || []} totalFuelVehicles={totalFuelVehicles || 0} />
      <DemandPipeline demandStats={demandStats || { enAttente: 0, validees: 0, affectees: 0, terminees: 0, rejetees: 0 }} />

      {/* Bottom Row */}
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
   ROLE: ADMIN / GESTIONNAIRE — Full Management Dashboard
   ===================================================================== */
function ManagementDashboard({ mainKpiCards, financialKpiCards, directionData, fuelData, totalFuelVehicles, demandes, demandStats, navigate, vehicules, alertes, interventions, pleins, executiveSummary }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary (if available) */}
      <ExecutiveSummaryStrip executiveSummary={executiveSummary} />

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
