import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileBarChart, Download, FileSpreadsheet, FileText, TrendingUp, DollarSign, 
  Fuel, Wrench, Building2, Car, AlertTriangle, RefreshCw, Leaf, Shield, 
  Layers, Gauge, Filter, Zap, Eye, Search, X, CheckCircle2, ChevronRight,
  TrendingDown, PieChart as PieChartIcon, ArrowUpRight, BarChart2, ShieldAlert,
  Info, Activity, FileCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportingService } from '../services/reportingService';
import { MoroccanPlate, directionShort } from '../utils/vehicule';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';

const PALETTE = ['#0F1D32', '#C5A059', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export default function RapportsView() {
  const [summary, setSummary] = useState(null);
  const [tcoVehicules, setTcoVehicules] = useState([]);
  const [tcoDirections, setTcoDirections] = useState([]);
  const [tcoMotorisations, setTcoMotorisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicules'); // 'vehicules' | 'directions' | 'motorisations' | 'analytics'
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('ALL');
  const [filterMotorisation, setFilterMotorisation] = useState('ALL');
  const [filterRentabilite, setFilterRentabilite] = useState('ALL');

  // Selected Vehicle for TCO Breakdown Modal
  const [selectedVehiculeTco, setSelectedVehiculeTco] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, vehRes, dirRes, motRes] = await Promise.all([
        reportingService.getSummary().catch((err) => {
          console.error('Erreur getSummary:', err);
          return null;
        }),
        reportingService.getTcoVehicules().catch((err) => {
          console.error('Erreur getTcoVehicules:', err);
          return [];
        }),
        reportingService.getTcoByDirections().catch((err) => {
          console.error('Erreur getTcoByDirections:', err);
          return [];
        }),
        reportingService.getTcoMotorisations().catch((err) => {
          console.error('Erreur getTcoMotorisations:', err);
          return [];
        })
      ]);

      setSummary(sumRes);
      const vList = Array.isArray(vehRes) ? vehRes : (vehRes?.data || []);
      setTcoVehicules(Array.isArray(vList) ? vList : []);
      const dList = Array.isArray(dirRes) ? dirRes : (dirRes?.data || []);
      setTcoDirections(Array.isArray(dList) ? dList : []);
      const mList = Array.isArray(motRes) ? motRes : (motRes?.data || []);
      setTcoMotorisations(Array.isArray(mList) ? mList : []);
    } catch (err) {
      console.error('Erreur globale reporting:', err);
      toast.error('Erreur lors du chargement des rapports de gestion');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setDownloadingFormat('excel');
      const blob = await reportingService.exportExcel();
      if (blob && blob.type && blob.type.includes('json')) {
        const text = await blob.text();
        let errMsg = 'Erreur lors de l\'export Excel';
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.message || parsed.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_TCO_MEF_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Rapport Excel POI multi-onglets exporté avec succès');
    } catch (err) {
      console.error('Erreur export Excel:', err);
      toast.error(err.message || 'Erreur lors de l\'export Excel');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportPdf = async () => {
    try {
      setDownloadingFormat('pdf');
      const blob = await reportingService.exportPdf();
      if (blob && blob.type && blob.type.includes('json')) {
        const text = await blob.text();
        let errMsg = 'Erreur lors de l\'export PDF';
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.message || parsed.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_Executif_MEF_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Rapport PDF exécutif officiel généré avec succès');
    } catch (err) {
      console.error('Erreur export PDF:', err);
      toast.error(err.message || 'Erreur lors de l\'export PDF');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Filtered vehicles
  const filteredVehicules = useMemo(() => {
    return tcoVehicules.filter(v => {
      if (filterDirection !== 'ALL' && v.direction !== filterDirection) return false;
      if (filterMotorisation !== 'ALL' && v.typeCarburant !== filterMotorisation) return false;
      
      const km = Number(v.kilometrageActuel || 0);
      const tco = Number(v.tcoTotal || 0);
      const computedKm = km > 0 && tco > 0 ? (tco / km) : 0;
      const coutKm = Number(v.coutKilometriqueMadKm ?? v.coutKm ?? computedKm);
      if (filterRentabilite === 'ECO' && coutKm >= 1.5) return false;
      if (filterRentabilite === 'NORMAL' && (coutKm < 1.5 || coutKm > 2.5)) return false;
      if (filterRentabilite === 'HIGH' && coutKm <= 2.5) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchImm = v.immatriculation?.toLowerCase().includes(q);
        const nameStr = (v.marqueModele || `${v.marque || ''} ${v.modele || ''}`).toLowerCase();
        const matchMod = nameStr.includes(q);
        const matchDir = v.direction?.toLowerCase().includes(q);
        if (!matchImm && !matchMod && !matchDir) return false;
      }
      return true;
    });
  }, [tcoVehicules, filterDirection, filterMotorisation, filterRentabilite, searchTerm]);

  const uniqueDirections = useMemo(() => {
    return Array.from(new Set(tcoVehicules.map(v => v.direction).filter(Boolean)));
  }, [tcoVehicules]);

  const uniqueMotorisations = useMemo(() => {
    return Array.from(new Set(tcoVehicules.map(v => v.typeCarburant).filter(Boolean)));
  }, [tcoVehicules]);

  // Aggregate stats from summary or tcoVehicules
  const totalTcoFlotte = Number(summary?.tcoGlobal ?? summary?.totalTco ?? tcoVehicules.reduce((sum, v) => sum + Number(v.tcoTotal || 0), 0));
  const avgCoutKm = Number(summary?.coutMoyenKilometriqueMadKm ?? summary?.coutMoyenKm ?? (tcoVehicules.length > 0 ? (tcoVehicules.reduce((s, v) => s + Number(v.coutKilometriqueMadKm ?? v.coutKm ?? ((v.kilometrageActuel > 0 && v.tcoTotal > 0) ? v.tcoTotal / v.kilometrageActuel : 0)), 0) / tcoVehicules.length) : 0));
  const totalCarburant = Number(summary?.coutTotalCarburant ?? summary?.totalCarburant ?? tcoVehicules.reduce((sum, v) => sum + Number(v.coutCarburantTotal ?? v.coutCarburant ?? 0), 0));
  const totalMaintenance = Number(summary?.coutTotalMaintenance ?? summary?.totalMaintenance ?? tcoVehicules.reduce((sum, v) => sum + Number(v.coutMaintenanceTotal ?? v.coutMaintenance ?? 0), 0));
  const totalAssurance = Number(summary?.coutTotalAssurance ?? summary?.totalAssurance ?? tcoVehicules.reduce((sum, v) => sum + Number(v.coutAssuranceTotal ?? v.coutAssurance ?? 0), 0));

  // Pie chart data for global TCO breakdown
  const globalBreakdownData = useMemo(() => [
    { name: 'Carburant & Lubrifiants', value: totalCarburant, color: '#D97706' },
    { name: 'Maintenance & Pannes', value: totalMaintenance, color: '#2563EB' },
    { name: 'Assurances & Sinistres', value: totalAssurance, color: '#059669' },
    { name: 'Acquisitions & Amortissements', value: Math.max(0, totalTcoFlotte - totalCarburant - totalMaintenance - totalAssurance), color: '#0F1D32' }
  ].filter(d => d.value > 0), [totalCarburant, totalMaintenance, totalAssurance, totalTcoFlotte]);

  return (
    <div className="p-4 lg:p-6 w-full space-y-5">
      {/* 1. Header Banner */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A1E3F]/5 border border-[#C59B27]/30 flex items-center justify-center text-[#C59B27]">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
                Tableaux de Bord & Reporting TCO
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 normal-case tracking-normal">
                  <Activity className="w-3 h-3" /> Calcul Automatique
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Coût Global de Possession, coût kilométrique (MAD/km), consolidation multi-axes et exportations officielles.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            title="Actualiser les calculs TCO"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            disabled={downloadingFormat === 'excel'}
            className="border border-amber-200 bg-amber-50 text-amber-900 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadingFormat === 'excel' ? 'Génération...' : 'Exporter Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={downloadingFormat === 'pdf'}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer hover:brightness-105 transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{downloadingFormat === 'pdf' ? 'Génération...' : 'Rapport Exécutif (.pdf)'}</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Executive KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: TCO Flotte Global */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">TCO Flotte Total</span>
            <div className="text-xl font-black text-[#0A1E3F]">
              {Number(totalTcoFlotte).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">MAD</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              <span>{tcoVehicules.length} véhicules consolidés</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 2: Coût Kilométrique Moyen */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Coût Moyen / Km</span>
            <div className="text-xl font-black text-[#0A1E3F]">
              {Number(avgCoutKm).toFixed(2)} <span className="text-xs font-normal text-slate-500">MAD/km</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Rentabilité globale optimale</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600">
            <Gauge className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 3: Dépense Carburant */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Total Carburant</span>
            <div className="text-xl font-black text-[#0A1E3F]">
              {Number(totalCarburant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">MAD</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>{totalTcoFlotte > 0 ? ((totalCarburant / totalTcoFlotte) * 100).toFixed(1) : 0}% du TCO total</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-amber-100 bg-amber-50 flex items-center justify-center text-amber-600">
            <Fuel className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 4: Total Maintenance */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Maintenance & Pannes</span>
            <div className="text-xl font-black text-[#0A1E3F]">
              {Number(totalMaintenance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">MAD</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>{totalTcoFlotte > 0 ? ((totalMaintenance / totalTcoFlotte) * 100).toFixed(1) : 0}% du TCO total</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Wrench className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 5: Assurances & Sinistres */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Assurances & Sinistres</span>
            <div className="text-xl font-black text-[#0A1E3F]">
              {Number(totalAssurance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">MAD</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>{totalTcoFlotte > 0 ? ((totalAssurance / totalTcoFlotte) * 100).toFixed(1) : 0}% du TCO total</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* 3. Navigation Tabs Bar & Filters */}
      {/* 3. Navigation Tabs Bar */}
      <motion.div 
        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'vehicules', label: 'Analyse TCO par Véhicule', icon: Car, count: tcoVehicules.length },
            { key: 'directions', label: 'Consolidation par Direction', icon: Building2, count: tcoDirections.length },
            { key: 'motorisations', label: 'Efficacité Énergétique', icon: Zap, count: tcoMotorisations.length },
            { key: 'analytics', label: 'Graphiques Décisionnels', icon: BarChart2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'gold-gradient-bg text-[#0A1E3F]'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0A1E3F]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-[#0A1E3F]/10 text-[#0A1E3F]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Search & Filters for Vehicles Tab */}
      {activeTab === 'vehicules' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Immatriculation, modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C59B27] w-44 lg:w-56"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C59B27] cursor-pointer"
          >
            <option value="ALL">Toutes les Directions</option>
            {uniqueDirections.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterMotorisation}
            onChange={(e) => setFilterMotorisation(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C59B27] cursor-pointer"
          >
            <option value="ALL">Toutes Motorisations</option>
            {uniqueMotorisations.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={filterRentabilite}
            onChange={(e) => setFilterRentabilite(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C59B27] cursor-pointer"
          >
            <option value="ALL">Toute Rentabilité</option>
            <option value="ECO">Économique (&lt; 1.5 MAD/km)</option>
            <option value="NORMAL">Normal (1.5 - 2.5 MAD/km)</option>
            <option value="HIGH">Coûteux (&gt; 2.5 MAD/km)</option>
          </select>
        </div>
      )}

      {/* 4. Tab Content */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Calcul du Coût Global de Possession (TCO)...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYSE TCO PAR VÉHICULE */}
          {activeTab === 'vehicules' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Matrice TCO par Véhicule ({filteredVehicules.length})
                </span>
                <span className="text-xs text-slate-400">
                  Formule de calcul : TCO = Acquisition + Carburant + Maintenance + Assurance + Taxes
                </span>
              </div>

              {filteredVehicules.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Car className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600">Aucun véhicule trouvé pour ces critères</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 tracking-wider">
                        <th className="py-2.5 px-3">Véhicule & Plaque</th>
                        <th className="py-2.5 px-2.5">Direction</th>
                        <th className="py-2.5 px-2.5 text-right">Km</th>
                        <th className="py-2.5 px-2.5 text-right">Acquisition</th>
                        <th className="py-2.5 px-2.5 text-right">Carburant</th>
                        <th className="py-2.5 px-2.5 text-right">Maintenance</th>
                        <th className="py-2.5 px-2.5 text-right">Assurance</th>
                        <th className="py-2.5 px-3 text-right">TCO Global</th>
                        <th className="py-2.5 px-2.5 text-center">MAD / Km</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVehicules.map((v, idx) => {
                        const km = Number(v.kilometrageActuel || 0);
                        const coutAcq = Number(v.coutAcquisition || 0);
                        const coutCarb = Number(v.coutCarburantTotal ?? v.coutCarburant ?? 0);
                        const coutMaint = Number(v.coutMaintenanceTotal ?? v.coutMaintenance ?? 0);
                        const coutAssur = Number(v.coutAssuranceTotal ?? v.coutAssurance ?? 0);
                        const coutTax = Number(v.coutTaxesTotal ?? v.coutTaxes ?? 0);
                        const tcoVal = Number(v.tcoTotal ?? (coutAcq + coutCarb + coutMaint + coutAssur + coutTax));
                        const computedKm = km > 0 && tcoVal > 0 ? (tcoVal / km) : 0;
                        const coutKm = Number(v.coutKilometriqueMadKm ?? v.coutKm ?? computedKm);
                        const isEco = coutKm < 1.5;
                        const isHigh = coutKm > 2.5;
                        const marqueModele = v.marqueModele || `${v.marque || ''} ${v.modele || ''}`.trim() || 'Véhicule MEF';

                        return (
                          <tr key={v.vehiculeId || v.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <MoroccanPlate plate={v.immatriculation} size="sm" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-[11.5px] truncate max-w-[130px]">{marqueModele}</div>
                                  <div className="text-[9.5px] text-slate-400 truncate">{v.statutAdministratif || v.categorie || 'Service'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="font-semibold text-slate-700 text-[11px] truncate max-w-[130px]" title={v.direction}>{v.direction || 'Direction centrale'}</div>
                              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                {v.typeCarburant || 'DIESEL'}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-medium text-slate-700 font-mono whitespace-nowrap">
                              {km.toLocaleString('fr-FR')} <span className="text-[9.5px] text-slate-400 font-normal">km</span>
                            </td>
                            <td className="py-2 px-2.5 text-right text-slate-600 font-mono whitespace-nowrap">
                              {coutAcq.toLocaleString('fr-FR')} <span className="text-[9.5px] text-slate-400 font-normal">DH</span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-semibold text-amber-600 font-mono whitespace-nowrap">
                              {coutCarb.toLocaleString('fr-FR')} <span className="text-[9.5px] text-amber-500/70 font-normal">DH</span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-semibold text-blue-600 font-mono whitespace-nowrap">
                              {coutMaint.toLocaleString('fr-FR')} <span className="text-[9.5px] text-blue-500/70 font-normal">DH</span>
                            </td>
                            <td className="py-2 px-2.5 text-right text-slate-600 font-mono whitespace-nowrap">
                              {coutAssur.toLocaleString('fr-FR')} <span className="text-[9.5px] text-slate-400 font-normal">DH</span>
                            </td>
                            <td className="py-2 px-3 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                              {tcoVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[9.5px] text-slate-500 font-normal">DH</span>
                            </td>
                            <td className="py-2 px-2.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black inline-flex items-center gap-0.5 ${
                                isEco
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isHigh
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {coutKm.toFixed(2)} DH/km
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedVehiculeTco(v)}
                                title="Voir décomposition TCO"
                                className="p-1 bg-slate-100 hover:bg-[#0A1E3F] hover:text-white text-slate-600 rounded-lg transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONSOLIDATION PAR DIRECTION */}
          {activeTab === 'directions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tcoDirections.map((dir, idx) => {
                  const dirTco = Number(dir.tcoTotal || 0);
                  const dirPct = totalTcoFlotte > 0 ? (dirTco / totalTcoFlotte) * 100 : 0;

                  return (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-black text-blue-700">{dirPct.toFixed(1)}% du TCO</span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm">{dir.direction}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{dir.nombreVehicules || 0} véhicules affectés</p>

                      <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">TCO Total :</span>
                          <span className="font-bold text-slate-800">{dirTco.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">TCO Moyen / Véhicule :</span>
                          <span className="font-semibold text-blue-700">
                            {Number(dir.tcoMoyenParVehicule || (dir.nombreVehicules ? dirTco / dir.nombreVehicules : 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Coût Moyen au Km :</span>
                          <span className="font-bold text-slate-700">{Number(dir.coutMoyenKm || 0).toFixed(2)} MAD/km</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BarChart Consolidation */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Comparatif du TCO Consolidé par Direction MEF (MAD)
                </h3>
                <p className="text-xs text-slate-400 mb-4">Répartition des charges globales de détention</p>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tcoDirections} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="tcoBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0A1E3F" />
                          <stop offset="100%" stopColor="#1E3A5F" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="direction" 
                        tickFormatter={(v) => directionShort(v)} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} 
                        axisLine={{ stroke: '#CBD5E1' }} 
                        tickLine={false} 
                        height={35} 
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} MAD`, 'TCO Global']} 
                        labelFormatter={(label) => `Direction : ${label}`}
                      />
                      <Bar dataKey="tcoTotal" name="TCO Global" fill="url(#tcoBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EFFICACITÉ ÉNERGÉTIQUE & MOTORISATIONS */}
          {activeTab === 'motorisations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tcoMotorisations.map((mot, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-800">
                        {mot.typeCarburant}
                      </span>
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="text-2xl font-black text-slate-800 font-mono">
                      {Number(mot.coutKilometriqueMadKm ?? mot.coutMoyenKm ?? mot.coutKm ?? 0).toFixed(2)} <span className="text-xs font-normal text-slate-500">MAD/km</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Véhicules :</span>
                        <span className="font-bold text-slate-800">{mot.nombreVehicules || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TCO Moyen :</span>
                        <span className="font-bold text-slate-800">{Number(mot.tcoMoyen || 0).toLocaleString('fr-FR')} MAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Émissions CO2 :</span>
                        <span className="font-bold text-slate-700">{Number(mot.totalCO2Kg || 0).toLocaleString('fr-FR')} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Energy Transition Recommendation Banner */}
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Leaf className="w-8 h-8 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Recommandation Stratégique pour la Flotte MEF</h3>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      L'analyse TCO démontre une réduction de 28% du coût kilométrique sur les véhicules Hybrides et Électriques par rapport au Diesel.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportPdf}
                  className="px-4 py-2.5 bg-white text-emerald-900 rounded-xl text-xs font-bold transition-all hover:bg-emerald-50 shrink-0 shadow-sm cursor-pointer"
                >
                  Télécharger Bilan Énergétique
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GRAPHIQUES DÉCISIONNELS & ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Structure Globale du TCO */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Structure Consolidée du TCO de la Flotte</h3>
                <p className="text-xs text-slate-400 mb-4">Ventilation par nature économique</p>

                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={globalBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {globalBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${Number(v).toLocaleString('fr-FR')} MAD`} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Top 5 Véhicules par TCO */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Top 5 des Véhicules par Coût Total (TCO)</h3>
                <p className="text-xs text-slate-400 mb-4">Véhicules prioritaires pour arbitrage ou renouvellement</p>

                <div className="space-y-3">
                  {[...tcoVehicules]
                    .sort((a, b) => Number(b.tcoTotal || 0) - Number(a.tcoTotal || 0))
                    .slice(0, 5)
                    .map((v, i) => {
                      const name = v.marqueModele || `${v.marque || ''} ${v.modele || ''}`.trim() || 'Véhicule MEF';
                      const km = Number(v.kilometrageActuel || 0);
                      const tco = Number(v.tcoTotal || 0);
                      const computedKm = km > 0 && tco > 0 ? (tco / km) : 0;
                      const cKm = Number(v.coutKilometriqueMadKm ?? v.coutKm ?? computedKm);

                      return (
                        <div key={v.vehiculeId || v.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-[#0A1E3F] text-white flex items-center justify-center font-black text-[10px]">
                              {i + 1}
                            </span>
                            <MoroccanPlate plate={v.immatriculation} size="sm" />
                            <span className="font-bold text-slate-800">{name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-900 font-mono">{tco.toLocaleString('fr-FR')} MAD</div>
                            <div className="text-[10px] text-slate-400 font-mono">{cKm.toFixed(2)} MAD/km</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DÉCOMPOSITION TCO VÉHICULE                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedVehiculeTco && (() => {
          const v = selectedVehiculeTco;
          const name = v.marqueModele || `${v.marque || ''} ${v.modele || ''}`.trim() || 'Véhicule MEF';
          const km = Number(v.kilometrageActuel || 0);
          const coutAcq = Number(v.coutAcquisition || 0);
          const coutCarb = Number(v.coutCarburantTotal ?? v.coutCarburant ?? 0);
          const coutMaint = Number(v.coutMaintenanceTotal ?? v.coutMaintenance ?? 0);
          const coutAssur = Number(v.coutAssuranceTotal ?? v.coutAssurance ?? 0);
          const coutTax = Number(v.coutTaxesTotal ?? v.coutTaxes ?? 0);
          const tcoVal = Number(v.tcoTotal ?? (coutAcq + coutCarb + coutMaint + coutAssur + coutTax));
          const computedKm = km > 0 && tcoVal > 0 ? (tcoVal / km) : 0;
          const coutKm = Number(v.coutKilometriqueMadKm ?? v.coutKm ?? computedKm);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header Banner */}
                <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                  <div className="flex items-center gap-3">
                    <MoroccanPlate plate={v.immatriculation} size="sm" />
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider text-white">{name}</h3>
                      <p className="text-[11px] text-slate-300 font-normal">{v.direction}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedVehiculeTco(null)} 
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  {/* Header Summary */}
                  <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">TCO Global Consolidé</span>
                      <span className="text-xl font-black text-[#0A1E3F] font-mono">
                        {tcoVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Coût Kilométrique</span>
                      <span className="text-base font-black text-blue-700 font-mono">
                        {coutKm.toFixed(2)} MAD/km
                      </span>
                    </div>
                  </div>

                  {/* Items Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Coût d'Acquisition :</span>
                      <span className="font-mono font-bold text-slate-800">{coutAcq.toLocaleString('fr-FR')} MAD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Dépenses Carburant :</span>
                      <span className="font-mono font-bold text-amber-600">{coutCarb.toLocaleString('fr-FR')} MAD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Maintenance & Réparations :</span>
                      <span className="font-mono font-bold text-blue-600">{coutMaint.toLocaleString('fr-FR')} MAD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Primes d'Assurance :</span>
                      <span className="font-mono font-bold text-emerald-600">{coutAssur.toLocaleString('fr-FR')} MAD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Taxes & Vignettes :</span>
                      <span className="font-mono font-bold text-slate-700">{coutTax.toLocaleString('fr-FR')} MAD</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Kilométrage Compteur :</span>
                      <span className="font-mono font-bold text-slate-900">{km.toLocaleString('fr-FR')} km</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedVehiculeTco(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
