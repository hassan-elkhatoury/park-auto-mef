import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, FileSpreadsheet, FileText, TrendingUp, DollarSign, Fuel, Wrench, Building2, Car, AlertTriangle, RefreshCw, Leaf } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportingService } from '../services/reportingService';
import { MoroccanPlate } from '../utils/vehicule';

export default function RapportsView() {
  const [summary, setSummary] = useState(null);
  const [tcoVehicules, setTcoVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directions'); // 'directions', 'vehicules'
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, vehRes] = await Promise.all([
        reportingService.getSummary().catch(() => null),
        reportingService.getTcoVehicules().catch(() => [])
      ]);
      setSummary(sumRes);
      setTcoVehicules(vehRes || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des données de reporting');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setDownloadingFormat('excel');
      const blob = await reportingService.exportExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_TCO_MEF_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Rapport Excel généré avec succès');
    } catch (err) {
      toast.error('Erreur lors de l\'export Excel');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportPdf = async () => {
    try {
      setDownloadingFormat('pdf');
      const blob = await reportingService.exportPdf();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_Executif_MEF_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Rapport PDF généré avec succès');
    } catch (err) {
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-6 h-6 text-[#C59B27]" />
          <div>
            <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
              Reporting Exécutif & Tableau de Bord TCO
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Calcul du Coût Global d'Exploitation (Total Cost of Ownership) pour la Direction du Budget et du DAG
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={downloadingFormat === 'excel'}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {downloadingFormat === 'excel' ? 'Génération...' : 'Exporter Excel (.xlsx)'}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={downloadingFormat === 'pdf'}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            {downloadingFormat === 'pdf' ? 'Génération...' : 'Rapport PDF (.pdf)'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Flotte Automobile</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#0A1E3F] mt-3">{summary.totalVehicules} <span className="text-xs font-normal text-slate-500">Véhicules</span></div>
            <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
              Taux d'immobilisation : {summary.tauxImmobilisation}% ({summary.vehiculesEnMaintenance} en maintenance)
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Dépenses Carburant</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Fuel className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#0A1E3F] mt-3">
              {summary.coutTotalCarburant ? summary.coutTotalCarburant.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} <span className="text-xs font-normal text-slate-500">MAD</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              Volume consommé : <strong className="text-[#0A1E3F]">{summary.totalLitresConsommes ? summary.totalLitresConsommes.toLocaleString() : '0'} L</strong>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Dépenses Maintenance</span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#0A1E3F] mt-3">
              {summary.coutTotalMaintenance ? summary.coutTotalMaintenance.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} <span className="text-xs font-normal text-slate-500">MAD</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              Alertes actives : <strong className="text-amber-600">{summary.alertesActivesCount} échéances</strong>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#0A1E3F] text-white rounded-2xl border border-slate-200/80 shadow-sm p-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#C59B27] uppercase tracking-wider">Coût Global (TCO Total)</span>
                <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 text-[#C59B27] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-white mt-3">
                {summary.tcoGlobal ? summary.tcoGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} <span className="text-xs font-normal text-slate-300">MAD</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Emissions CO2 : {(summary.totalEmissionsCO2Kg / 1000).toFixed(2)} Tonnes CO2
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('directions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'directions'
              ? 'gold-gradient-bg text-[#0A1E3F] shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          TCO par Direction MEF
        </button>

        <button
          onClick={() => setActiveTab('vehicules')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'vehicules'
              ? 'gold-gradient-bg text-[#0A1E3F] shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Car className="w-4 h-4" />
          TCO Détaillé par Véhicule ({tcoVehicules.length})
        </button>
      </div>

      {/* Tab 1: TCO Par Direction */}
      {activeTab === 'directions' && summary && summary.tcoParDirection && (
        <motion.div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0A1E3F]">Répartition du Coût Global (TCO) par Direction du MEF</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Direction MEF</th>
                  <th>Véhicules</th>
                  <th>Acquisition Total</th>
                  <th>Carburant Total</th>
                  <th>Maintenance Total</th>
                  <th>TCO Total (MAD)</th>
                  <th>TCO Moyen / Véhicule</th>
                </tr>
              </thead>
              <tbody>
                {summary.tcoParDirection.map((d) => (
                  <tr key={d.direction}>
                    <td className="font-bold text-[#0A1E3F]">{d.direction}</td>
                    <td>{d.nombreVehicules}</td>
                    <td>{d.totalAcquisition.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    <td className="text-amber-600 font-semibold">{d.totalCarburant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    <td className="text-orange-600 font-semibold">{d.totalMaintenance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    <td className="text-emerald-700 font-bold">{d.tcoTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    <td className="font-semibold text-slate-700">{d.tcoMoyenParVehicule.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                  </tr>
                ))}
                {summary.tcoParDirection.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500 text-xs">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Tab 2: TCO Par Véhicule */}
      {activeTab === 'vehicules' && (
        <motion.div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0A1E3F]">Analyse TCO Individuelle de la Flotte</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Immatriculation & Modèle</th>
                  <th>Direction</th>
                  <th>Kilométrage</th>
                  <th>Acquisition</th>
                  <th>Carburant</th>
                  <th>Maintenance</th>
                  <th>TCO Total</th>
                  <th>Conso (L/100km)</th>
                </tr>
              </thead>
              <tbody>
                {tcoVehicules.map((v) => (
                  <tr key={v.vehiculeId}>
                    <td>
                      <MoroccanPlate immatriculation={v.immatriculation} />
                      <div className="text-xs text-slate-500 mt-1">{v.marqueModele}</div>
                    </td>
                    <td className="font-medium text-slate-700">{v.direction}</td>
                    <td className="font-mono text-slate-600">{v.kilometrageActuel ? v.kilometrageActuel.toLocaleString() : 0} km</td>
                    <td>{v.coutAcquisition ? v.coutAcquisition.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                    <td className="text-amber-600 font-semibold">{v.coutCarburantTotal ? v.coutCarburantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                    <td className="text-orange-600 font-semibold">{v.coutMaintenanceTotal ? v.coutMaintenanceTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                    <td className="text-emerald-700 font-bold">{v.tcoTotal ? v.tcoTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                    <td className="font-semibold text-slate-700">{v.consommationMoyenne ? `${v.consommationMoyenne} L/100km` : 'N/A'}</td>
                  </tr>
                ))}
                {tcoVehicules.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500 text-xs">
                      Aucun véhicule trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </div>
  );
}
