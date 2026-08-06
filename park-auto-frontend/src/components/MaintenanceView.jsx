import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, ShieldAlert, AlertTriangle, Calendar, Plus, RefreshCw, CheckCircle2, Clock, Car, Filter, X, DollarSign, Eye, Trash2, Edit, MapPin, User, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { maintenanceService } from '../services/maintenanceService';
import { vehiculeService } from '../services/vehiculeService';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

export default function MaintenanceView() {
  const [activeTab, setActiveTab] = useState('interventions'); // 'interventions', 'alertes'
  const [interventions, setInterventions] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, PREVENTIVE, CURATIVE
  const [filterStatut, setFilterStatut] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [selectedInterventionForDetail, setSelectedInterventionForDetail] = useState(null);
  const [selectedAlerteForDetail, setSelectedAlerteForDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, loading: false });

  const [form, setForm] = useState({
    vehiculeId: '',
    typeMaintenance: 'PREVENTIVE',
    natureOperation: 'VIDANGE',
    datePrevisionnelle: new Date().toISOString().split('T')[0],
    kilometragePrevu: '',
    prestataire: 'Garage Agréé MEF',
    coutMainOeuvre: '350',
    coutPieces: '850',
    montantTotal: '1200',
    piecesRemplacees: '',
    statut: 'PROGRAMMEE',
    immobilisation: false,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iData, aData, vData] = await Promise.all([
        maintenanceService.getInterventions().catch(() => []),
        maintenanceService.getAlertes().catch(() => []),
        vehiculeService.getVehicules().catch(() => [])
      ]);
      setInterventions(Array.isArray(iData) ? iData : (iData?.data || iData?.content || []));
      setAlertes(Array.isArray(aData) ? aData : (aData?.data || aData?.content || []));
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
    } catch (err) {
      console.error('Erreur chargement maintenance:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleTraiterAlerte = (a) => {
    let typeMaint = 'PREVENTIVE';
    let natureOp = 'VIDANGE';
    let desc = `Traitement de l'alerte: ${a.titre}`;
    let prestataire = 'Garage Agréé MEF';
    let costMO = '350';
    let costPieces = '850';
    let totalCost = '1200';

    const tAlerte = (a.typeAlerte || '').toUpperCase();
    if (tAlerte.includes('KM') || tAlerte.includes('ENTRETIEN')) {
      typeMaint = 'PREVENTIVE';
      natureOp = 'VIDANGE';
      desc = `Vidange moteur et révision périodique automatique suite au dépassement du seuil de ${a.kilometrageSeuil || 10000} km.`;
    } else if (tAlerte.includes('VISITE') || tAlerte.includes('CONTROLE') || tAlerte.includes('TECHNIQUE')) {
      typeMaint = 'PREVENTIVE';
      natureOp = 'REVISION_PERIODIQUE';
      desc = `Faire passer la Visite Technique réglementaire MEF obligatoire.`;
      prestataire = 'Centre de Visite Technique Agréé';
      costMO = '150';
      costPieces = '0';
      totalCost = '150';
    } else if (tAlerte.includes('ASSURANCE')) {
      typeMaint = 'PREVENTIVE';
      natureOp = 'AUTRE';
      desc = `Renouvellement annuel du contrat d'assurance flotte MEF.`;
      prestataire = 'Compagnie d\'Assurance Flotte';
      costMO = '0';
      costPieces = '3500';
      totalCost = '3500';
    } else if (tAlerte.includes('VIGNETTE')) {
      typeMaint = 'PREVENTIVE';
      natureOp = 'AUTRE';
      desc = `Paiement et renouvellement annuel de la vignette de taxe automobile MEF.`;
      prestataire = 'Recette des Impôts / MEF';
      costMO = '0';
      costPieces = '1500';
      totalCost = '1500';
    }

    setForm({
      vehiculeId: a.vehiculeId || '',
      typeMaintenance: typeMaint,
      natureOperation: natureOp,
      datePrevisionnelle: new Date().toISOString().split('T')[0],
      kilometragePrevu: a.kilometrageActuel || a.kilometrageSeuil || '',
      prestataire: prestataire,
      coutMainOeuvre: costMO,
      coutPieces: costPieces,
      montantTotal: totalCost,
      piecesRemplacees: '',
      statut: 'PROGRAMMEE',
      immobilisation: false,
      description: desc
    });
    setShowModal(true);
  };

  const handleEditIntervention = (i) => {
    setForm({
      id: i.id,
      vehiculeId: i.vehiculeId || i.vehicule?.id || '',
      typeMaintenance: i.typeMaintenance || 'PREVENTIVE',
      natureOperation: i.natureOperation || 'VIDANGE',
      datePrevisionnelle: i.datePrevisionnelle || new Date().toISOString().split('T')[0],
      kilometragePrevu: i.kilometragePrevu ? String(i.kilometragePrevu) : '',
      prestataire: i.prestataire || 'Garage Agréé MEF',
      coutMainOeuvre: i.coutMainOeuvre ? String(i.coutMainOeuvre) : '0',
      coutPieces: i.coutPieces ? String(i.coutPieces) : '0',
      montantTotal: i.montantTotal ? String(i.montantTotal) : '0',
      piecesRemplacees: i.piecesRemplacees || '',
      statut: i.statut || 'PROGRAMMEE',
      immobilisation: Boolean(i.immobilisation),
      description: i.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const mo = parseFloat(form.coutMainOeuvre || '0');
      const p = parseFloat(form.coutPieces || '0');
      const total = form.montantTotal ? parseFloat(form.montantTotal) : (mo + p);

      const payload = {
        ...form,
        vehiculeId: Number(form.vehiculeId),
        kilometragePrevu: form.kilometragePrevu ? parseInt(form.kilometragePrevu) : null,
        coutMainOeuvre: mo,
        coutPieces: p,
        montantTotal: total
      };

      await maintenanceService.enregistrerIntervention(payload);
      toast.success('Intervention de maintenance enregistrée avec succès');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l’enregistrement de l’intervention');
    }
  };

  const confirmDeleteIntervention = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await maintenanceService.deleteIntervention(deleteModal.item.id);
      toast.success('Intervention de maintenance supprimée avec succès');
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredInterventions = interventions.filter(item => {
    const matchType = filterType === 'ALL' || item.typeMaintenance === filterType;
    const matchStatut = filterStatut === 'ALL' || item.statut === filterStatut;
    return matchType && matchStatut;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#C59B27]" />
            Maintenance du Parc & Alertes Légales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Planification préventive (90% seuil km), pannes curatives et suivi des contrôles/assurances
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Programmer
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('interventions')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'interventions'
                ? 'gold-gradient-bg text-[#0A1E3F] shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Interventions ({interventions.length})
          </button>
          <button
            onClick={() => setActiveTab('alertes')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'alertes'
                ? 'gold-gradient-bg text-[#0A1E3F] shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Alertes & Échéances ({alertes.length})
          </button>
        </div>

        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab 1: Interventions List */}
      {activeTab === 'interventions' && (
        <div className="space-y-4">
          {/* Filters */}
          <motion.div 
            className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Filtrer:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Tous les Types</option>
              <option value="PREVENTIVE">Maintenance Préventive</option>
              <option value="CURATIVE">Réparation Curative</option>
            </select>

            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="PROGRAMMEE">Programmée</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </motion.div>

          {/* Table */}
          <motion.div 
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0A1E3F] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#C59B27]" /> Liste des Interventions
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Type & Opération</th>
                    <th>Date & Kilométrage</th>
                    <th>Prestataire & Description</th>
                    <th>Coût Total</th>
                    <th>Statut & État</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Wrench className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-xs font-bold text-slate-500">Aucune intervention de maintenance trouvée.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map((i) => (
                      <tr key={i.id}>
                        <td className="whitespace-nowrap">
                          <MoroccanPlate immatriculation={i.immatriculation} />
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{i.marqueModele}</div>
                        </td>

                        <td>
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            i.typeMaintenance === 'PREVENTIVE' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {i.typeMaintenance}
                          </span>
                          <div className="font-bold text-[#0A1E3F] text-xs mt-0.5 leading-tight">{i.natureOperation}</div>
                        </td>

                        <td className="whitespace-nowrap text-slate-600 font-medium text-xs">
                          {i.datePrevisionnelle ? new Date(i.datePrevisionnelle).toLocaleDateString('fr-FR') : '-'}
                          {i.kilometragePrevu && <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{i.kilometragePrevu.toLocaleString()} km</div>}
                        </td>

                        <td className="max-w-[200px]">
                          <div className="font-bold text-[#0A1E3F] text-xs truncate">{i.prestataire}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{i.description || i.piecesRemplacees || '-'}</div>
                        </td>

                        <td className="whitespace-nowrap font-extrabold text-[#0A1E3F] text-xs">
                          {i.montantTotal ? i.montantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </td>

                        <td className="whitespace-nowrap">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            i.statut === 'TERMINEE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            i.statut === 'EN_COURS' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                            i.statut === 'PROGRAMMEE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {i.statut}
                          </span>
                          {i.immobilisation && (
                            <div className="mt-1 text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full block w-max">
                              Immobilisé
                            </div>
                          )}
                        </td>

                        <td className="!text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditIntervention(i)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier l'intervention / Changer le statut"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedInterventionForDetail(i)}
                              className="p-1.5 text-slate-400 hover:text-[#C59B27] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, item: i, loading: false })}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer l'intervention"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab 2: Alerts Panel (Enterprise Table View) */}
      {activeTab === 'alertes' && (
        <motion.div 
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-[#0A1E3F] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#C59B27]" /> Tableau des Alertes & Échéances Légales ({alertes.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  <th>Sévérité & Type</th>
                  <th>Véhicule & Direction</th>
                  <th>Titre & Description</th>
                  <th>Échéance / Jauge Km</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-500">Aucune alerte active dans le parc.</span>
                    </td>
                  </tr>
                ) : (
                  alertes.map((a) => {
                    const isCrit = a.niveauSeverite === 'CRITIQUE';
                    const isWarn = a.niveauSeverite === 'ATTENTION';

                    return (
                      <tr key={a.id}>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            isCrit ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            isWarn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isCrit ? <AlertCircle className="w-3.5 h-3.5" /> : isWarn ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            {a.typeAlerte}
                          </span>
                        </td>

                        <td>
                          <MoroccanPlate immatriculation={a.immatriculation} />
                          <div className="text-[11px] text-slate-500 mt-1 font-medium">{a.marqueModele}</div>
                          <div className="text-[10px] font-bold text-[#C59B27]">{a.direction || 'Direction MEF'}</div>
                        </td>

                        <td>
                          <div className="font-bold text-[#0A1E3F] text-xs">{a.titre}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{a.message}</div>
                        </td>

                        <td>
                          {a.dateEcheance ? (
                            <span className="text-slate-600 font-bold text-xs flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#C59B27]" /> {new Date(a.dateEcheance).toLocaleDateString('fr-FR')}
                            </span>
                          ) : a.kilometrageActuel ? (
                            <span className="font-mono text-xs text-slate-700 font-extrabold block">
                              Gauge: {a.kilometrageActuel?.toLocaleString()} / {a.kilometrageSeuil?.toLocaleString()} km
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        <td className="!text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTraiterAlerte(a)}
                              className="gold-gradient-bg text-[#0A1E3F] font-black text-[11px] px-3 py-1.5 rounded-lg shadow-sm hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                              title="Traiter l'alerte"
                            >
                              <Wrench className="w-3.5 h-3.5" /> Traiter
                            </button>
                            <button
                              onClick={() => setSelectedAlerteForDetail(a)}
                              className="p-1.5 text-slate-400 hover:text-[#0A1E3F] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Voir les détails de l'alerte"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modal - Programmer Intervention */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F4F6FB] rounded-xl flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-[#C59B27]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0A1E3F]">Programmer une Maintenance</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Véhicule *</label>
                  <select
                    required
                    value={form.vehiculeId}
                    onChange={(e) => setForm({ ...form, vehiculeId: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                  >
                    <option value="">Sélectionner un véhicule...</option>
                    {(Array.isArray(vehicules) ? vehicules : []).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele} ({v.kilometrageActuel || 0} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Type de Maintenance *</label>
                  <select
                    value={form.typeMaintenance}
                    onChange={(e) => setForm({ ...form, typeMaintenance: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-bold text-[#0A1E3F]"
                  >
                    <option value="PREVENTIVE">Maintenance Préventive (Périodique)</option>
                    <option value="CURATIVE">Maintenance Curative (Réparation / Panne)</option>
                    <option value="REGLEMENTAIRE">Contrôle Réglementaire & Visite Technique</option>
                    <option value="SINISTRE_ACCIDENT">Sinistre, Accident & Carrosserie</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Nature de l'Opération *</label>
                  <select
                    value={form.natureOperation}
                    onChange={(e) => setForm({ ...form, natureOperation: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-bold text-[#0A1E3F]"
                  >
                    <optgroup label="Entretien Préventif & Périodique">
                      <option value="VIDANGE">Vidange Moteur & Huile</option>
                      <option value="FILTRES">Remplacement Filtres complets (Air, Carburant, Habitacle)</option>
                      <option value="REVISION_PERIODIQUE">Révision Générale Périodique</option>
                      <option value="DISTRIBUTION">Kit de Distribution & Pompe à Eau</option>
                    </optgroup>
                    <optgroup label="Organes de Sécurité & Liaison au Sol">
                      <option value="FREINS">Système de Freinage (Plaquettes, Disques)</option>
                      <option value="PNEUMATIQUES">Changement Pneumatiques & Parallélisme</option>
                      <option value="AMORTISSEURS_SUSPENSION">Amortisseurs & Suspensions</option>
                      <option value="BATTERIE">Batterie & Circuit Électrique</option>
                    </optgroup>
                    <optgroup label="Moteur & Organes Mécaniques">
                      <option value="EMBRAYAGE_TRANSMISSION">Kit Embrayage & Transmission</option>
                      <option value="INJECTION_TURBO">Injecteurs, Turbo & Depollution (EGR/FAP)</option>
                      <option value="CIRCUIT_REFROIDISSEMENT">Circuit de Refroidissement & Radiateur</option>
                      <option value="REPARATION_PANNE">Diagnostic Scanner & Panne Mécanique</option>
                    </optgroup>
                    <optgroup label="Confort, Carrosserie & Conformité">
                      <option value="CLIMATISATION">Climatisation & Recharge Gaz</option>
                      <option value="ECLAIRAGE_SIGNALISATION">Éclairage, Phares & Signalisation</option>
                      <option value="PARE_BRISE_VITRAGE">Remplacement Pare-Brise & Vitrage</option>
                      <option value="CARROSSERIE_PEINTURE">Travaux de Carrosserie & Peinture</option>
                      <option value="CONTROLE_TECHNIQUE">Passage Visite Technique Obligatoire</option>
                      <option value="AUTRE">Autre Opération Spécifique MEF</option>
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Date Prévisionnelle</label>
                    <input
                      type="date"
                      value={form.datePrevisionnelle}
                      onChange={(e) => setForm({ ...form, datePrevisionnelle: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Statut</label>
                    <select
                      value={form.statut}
                      onChange={(e) => setForm({ ...form, statut: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                    >
                      <option value="PROGRAMMEE">Programmée</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINEE">Terminée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Prestataire / Garage</label>
                    <input
                      type="text"
                      value={form.prestataire}
                      onChange={(e) => setForm({ ...form, prestataire: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Montant Total Estimé (MAD)</label>
                    <input
                      type="number"
                      value={form.montantTotal}
                      onChange={(e) => setForm({ ...form, montantTotal: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center">
                      <Car className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0A1E3F] block">Immobilisation du Véhicule</span>
                      <span className="text-[10px] text-slate-500">Le véhicule sera indisponible</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.immobilisation}
                      onChange={(e) => setForm({ ...form, immobilisation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C59B27]"></div>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Description & Pièces à remplacer</label>
                  <textarea
                    rows="3"
                    placeholder="Détail de l'intervention..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    Enregistrer l'Intervention
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RICH DETAIL MODAL - FICHE D'INTERVENTION DE MAINTENANCE */}
      <AnimatePresence>
        {selectedInterventionForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[620px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="bg-[#0A1E3F] text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#C59B27] text-xs font-black uppercase tracking-wider">
                    <Wrench className="w-4 h-4" />
                    Fiche d'Intervention #{selectedInterventionForDetail.id}
                  </div>
                  <h2 className="text-lg font-black font-outfit mt-1 text-white">
                    {selectedInterventionForDetail.natureOperation}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedInterventionForDetail(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Status & Type Header */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Type:</span>
                    <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                      selectedInterventionForDetail.typeMaintenance === 'PREVENTIVE' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {selectedInterventionForDetail.typeMaintenance}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Statut:</span>
                    <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                      selectedInterventionForDetail.statut === 'TERMINEE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      selectedInterventionForDetail.statut === 'EN_COURS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {selectedInterventionForDetail.statut}
                    </span>
                  </div>
                </div>

                {/* Véhicule Block */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Véhicule Attribué</div>
                  <div className="flex items-center justify-between">
                    <MoroccanPlate immatriculation={selectedInterventionForDetail.immatriculation} />
                    <span className="font-bold text-[#0A1E3F] text-sm">{selectedInterventionForDetail.marqueModele}</span>
                  </div>
                </div>

                {/* Interventions Specifications Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Date Prévisionnelle</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedInterventionForDetail.datePrevisionnelle ? new Date(selectedInterventionForDetail.datePrevisionnelle).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Kilométrage Prévu</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <Car className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedInterventionForDetail.kilometragePrevu ? selectedInterventionForDetail.kilometragePrevu.toLocaleString() + ' km' : 'Non spécifié'}
                    </span>
                  </div>
                </div>

                {/* Prestataire & Immobilisation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Prestataire / Garage</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs mt-1 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-[#C59B27]" /> {selectedInterventionForDetail.prestataire || 'Garage Agréé MEF'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Immobilisation Véhicule</span>
                    <span className="font-extrabold text-xs mt-1 block">
                      {selectedInterventionForDetail.immobilisation ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Oui (Véhicule Immobilisé)</span>
                      ) : (
                        <span className="text-slate-600 font-bold">Non</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Financial Matrix */}
                <div className="p-4 bg-[#F4F6FB] rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Décomposition des Coûts</span>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">Main d'Œuvre:</span>
                    <span className="font-bold text-[#0A1E3F]">{selectedInterventionForDetail.coutMainOeuvre ? selectedInterventionForDetail.coutMainOeuvre.toLocaleString() : '0'} MAD</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">Pièces Détachées & Consommables:</span>
                    <span className="font-bold text-[#0A1E3F]">{selectedInterventionForDetail.coutPieces ? selectedInterventionForDetail.coutPieces.toLocaleString() : '0'} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="font-extrabold text-[#0A1E3F]">Montant Total TTC:</span>
                    <span className="font-black text-[#C59B27]">{selectedInterventionForDetail.montantTotal ? selectedInterventionForDetail.montantTotal.toLocaleString() : '0'} MAD</span>
                  </div>
                </div>

                {/* Description & Notes */}
                {selectedInterventionForDetail.description && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Notes & Description</span>
                    <p className="text-slate-700 text-xs font-medium leading-relaxed">{selectedInterventionForDetail.description}</p>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => setSelectedInterventionForDetail(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    const itemToEdit = selectedInterventionForDetail;
                    setSelectedInterventionForDetail(null);
                    handleEditIntervention(itemToEdit);
                  }}
                  className="gold-gradient-bg text-[#0A1E3F] font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4" /> Modifier / Changer le Statut
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RICH DETAIL MODAL - FICHE D'ALERTE & ÉCHÉANCE */}
      <AnimatePresence>
        {selectedAlerteForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="bg-[#0A1E3F] text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#C59B27] text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Alerte #{selectedAlerteForDetail.id || 'MEF'}
                  </div>
                  <h2 className="text-lg font-black font-outfit mt-1 text-white">
                    {selectedAlerteForDetail.titre}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAlerteForDetail(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Severity & Type */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Sévérité:</span>
                    <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                      selectedAlerteForDetail.niveauSeverite === 'CRITIQUE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      selectedAlerteForDetail.niveauSeverite === 'ATTENTION' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {selectedAlerteForDetail.niveauSeverite || 'INFORMATION'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Type Alerte:</span>
                    <span className="font-black text-[#0A1E3F] uppercase">{selectedAlerteForDetail.typeAlerte}</span>
                  </div>
                </div>

                {/* Véhicule */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Véhicule Concerné</div>
                  <div className="flex items-center justify-between">
                    <MoroccanPlate immatriculation={selectedAlerteForDetail.immatriculation} />
                    <div className="text-right">
                      <div className="font-bold text-[#0A1E3F] text-sm">{selectedAlerteForDetail.marqueModele}</div>
                      <div className="text-[11px] font-bold text-[#C59B27]">{selectedAlerteForDetail.direction || 'Direction MEF'}</div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1">
                  <span className="text-amber-800 font-bold text-[10px] uppercase block">Détail du Téléservice</span>
                  <p className="text-slate-800 font-medium text-xs leading-relaxed">{selectedAlerteForDetail.message}</p>
                </div>

                {/* Date or Gauge */}
                {selectedAlerteForDetail.dateEcheance ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Date d'Échéance Légale:</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#C59B27]" />
                      {new Date(selectedAlerteForDetail.dateEcheance).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ) : selectedAlerteForDetail.kilometrageActuel ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Kilométrage Actuel / Seuil:</span>
                    <span className="font-mono font-extrabold text-[#0A1E3F] text-xs">
                      {selectedAlerteForDetail.kilometrageActuel?.toLocaleString()} / {selectedAlerteForDetail.kilometrageSeuil?.toLocaleString()} km
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => setSelectedAlerteForDetail(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    const alertToTreat = selectedAlerteForDetail;
                    setSelectedAlerteForDetail(null);
                    handleTraiterAlerte(alertToTreat);
                  }}
                  className="gold-gradient-bg text-[#0A1E3F] font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Wrench className="w-4 h-4" /> Traiter l'Alerte Maintenant
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM MODAL FOR DELETE */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Supprimer l'Intervention"
        message={`Voulez-vous vraiment supprimer l'intervention de maintenance "${deleteModal.item?.natureOperation}" enregistrée pour le véhicule ${deleteModal.item?.immatriculation} ?`}
        onConfirm={confirmDeleteIntervention}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, loading: false })}
        loading={deleteModal.loading}
      />
    </div>
  );
}
