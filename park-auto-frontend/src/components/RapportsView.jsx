import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, FileSpreadsheet, FileText, TrendingUp, DollarSign, Fuel, Wrench, Building2, Car, AlertTriangle, RefreshCw, Leaf } from 'lucide-react';
import { reportingService } from '../services/reportingService';

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
      console.error('Erreur chargement reporting:', err);
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
    } catch (err) {
      console.error('Erreur export Excel:', err);
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
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="flex-1 p-7 overflow-y-auto zellige-pattern min-h-screen">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div
          className="relative bg-white rounded-2xl border border-cardline shadow-sm px-6 py-5 overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 card-zellij-watermark opacity-60 pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-md">
                <FileBarChart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black font-outfit text-[#0A1E3F] leading-tight">
                    Reporting Exécutif & Tableau de Bord TCO
                  </h2>
                  <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">التقارير والتكلفة الإجمالية</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Calcul du Coût Global d'Exploitation (Total Cost of Ownership) pour la Direction du Budget et du DAG
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                disabled={downloadingFormat === 'excel'}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all border border-emerald-800 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {downloadingFormat === 'excel' ? 'Génération...' : 'Exporter Excel (.xlsx)'}
              </button>
              <button
                onClick={handleExportPdf}
                disabled={downloadingFormat === 'pdf'}
                className="inline-flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all border border-rose-800 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {downloadingFormat === 'pdf' ? 'Génération...' : 'Rapport PDF (.pdf)'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              className="bg-white rounded-2xl border border-cardline p-5 shadow-sm relative overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Flotte Automobile</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#0A1E3F] mt-3">{summary.totalVehicules} <span className="text-xs font-normal text-slate-500">Véhicules</span></div>
              <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                Taux d'immobilisation : {summary.tauxImmobilisation}% ({summary.vehiculesEnMaintenance} en maintenance)
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl border border-cardline p-5 shadow-sm relative overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Dépenses Carburant</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
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
              className="bg-white rounded-2xl border border-cardline p-5 shadow-sm relative overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Dépenses Maintenance</span>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
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
              className="bg-[#0A1E3F] rounded-2xl border border-[#C59B27]/30 p-5 shadow-sm relative overflow-hidden text-white"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <div className="zellige-sidebar-art absolute inset-0 opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#C59B27] uppercase tracking-wider">Coût Global (TCO Total)</span>
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 text-[#D7B14A] flex items-center justify-center">
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
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('directions')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'directions'
                ? 'bg-[#0A1E3F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            TCO par Direction MEF
          </button>

          <button
            onClick={() => setActiveTab('vehicules')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'vehicules'
                ? 'bg-[#0A1E3F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car className="w-4 h-4" />
            TCO Détaillé par Véhicule ({tcoVehicules.length})
          </button>
        </div>

        {/* Tab 1: TCO Par Direction */}
        {activeTab === 'directions' && summary && summary.tcoParDirection && (
          <div className="bg-white rounded-2xl border border-cardline shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-base font-black text-[#0A1E3F]">Répartition du Coût Global (TCO) par Direction du MEF</h3>
            
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-[#0A1E3F] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Direction MEF</th>
                    <th className="py-3.5 px-4">Véhicules</th>
                    <th className="py-3.5 px-4">Acquisition Total</th>
                    <th className="py-3.5 px-4">Carburant Total</th>
                    <th className="py-3.5 px-4">Maintenance Total</th>
                    <th className="py-3.5 px-4">TCO Total (MAD)</th>
                    <th className="py-3.5 px-4">TCO Moyen / Véhicule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {summary.tcoParDirection.map((d) => (
                    <tr key={d.direction} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-black text-[#0A1E3F]">{d.direction}</td>
                      <td className="py-4 px-4 font-bold text-slate-700">{d.nombreVehicules}</td>
                      <td className="py-4 px-4 text-slate-600">{d.totalAcquisition.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                      <td className="py-4 px-4 text-amber-700 font-bold">{d.totalCarburant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                      <td className="py-4 px-4 text-orange-700 font-bold">{d.totalMaintenance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                      <td className="py-4 px-4 text-emerald-800 font-black text-sm">{d.tcoTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                      <td className="py-4 px-4 text-slate-700 font-bold">{d.tcoMoyenParVehicule.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: TCO Par Véhicule */}
        {activeTab === 'vehicules' && (
          <div className="bg-white rounded-2xl border border-cardline shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-base font-black text-[#0A1E3F]">Analyse TCO Individuelle de la Flotte</h3>
            
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-[#0A1E3F] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Immatriculation & Modèle</th>
                    <th className="py-3.5 px-4">Direction</th>
                    <th className="py-3.5 px-4">Kilométrage</th>
                    <th className="py-3.5 px-4">Acquisition</th>
                    <th className="py-3.5 px-4">Carburant</th>
                    <th className="py-3.5 px-4">Maintenance</th>
                    <th className="py-3.5 px-4">TCO Total</th>
                    <th className="py-3.5 px-4">Conso (L/100km)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {tcoVehicules.map((v) => (
                    <tr key={v.vehiculeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-[#0A1E3F] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {v.immatriculation}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{v.marqueModele}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-bold">{v.direction}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{v.kilometrageActuel ? v.kilometrageActuel.toLocaleString() : 0} km</td>
                      <td className="py-3.5 px-4 text-slate-600">{v.coutAcquisition ? v.coutAcquisition.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                      <td className="py-3.5 px-4 text-amber-700 font-bold">{v.coutCarburantTotal ? v.coutCarburantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                      <td className="py-3.5 px-4 text-orange-700 font-bold">{v.coutMaintenanceTotal ? v.coutMaintenanceTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                      <td className="py-3.5 px-4 text-emerald-800 font-black text-[#0A1E3F]">{v.tcoTotal ? v.tcoTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{v.consommationMoyenne ? `${v.consommationMoyenne} L/100km` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
