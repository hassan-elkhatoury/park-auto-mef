import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, ShieldAlert, Plus, Search, Filter, CheckCircle2, Clock, X, 
  Trash2, Edit, Upload, AlertTriangle, FileText, CheckCircle, Car, MapPin, 
  DollarSign, Wrench, Building, Eye, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { visiteTechniqueService } from '../services/visiteTechniqueService';
import { taxeService } from '../services/taxeService';
import { reformeService } from '../services/reformeService';
import { vehiculeService } from '../services/vehiculeService';
import { getApiErrorMessage } from '../services/api';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

const RESULTATS_VISITE = [
  { key: 'FAVORABLE', label: 'Favorable', color: 'emerald' },
  { key: 'CONTRE_VISITE_OBLIGATOIRE', label: 'Contre-visite obligatoire', color: 'amber' },
  { key: 'REFUSEE', label: 'Refusée', color: 'rose' }
];

const TYPES_TAXE = ['VIGNETTE', 'TAXE_CIRCULATION'];
const STATUTS_REFORME = ['INITIE', 'EN_COURS_DE_REFORME', 'VALIDE', 'REFORME', 'VENDU'];

export default function VisitesTaxesReformeView() {
  const [activeTab, setActiveTab] = useState('visites'); // 'visites', 'taxes', 'reforme'
  const [visites, setVisites] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [reformes, setReformes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showVisiteModal, setShowVisiteModal] = useState(false);
  const [showTaxeModal, setShowTaxeModal] = useState(false);
  const [showReformeModal, setShowReformeModal] = useState(false);

  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, type: '', loading: false });

  // Forms
  const [visiteForm, setVisiteForm] = useState({
    id: null, vehiculeId: '', dateVisite: '', centre: '', resultat: 'FAVORABLE', dateProchaine: '', observations: ''
  });

  const [taxeForm, setTaxeForm] = useState({
    id: null, vehiculeId: '', annee: new Date().getFullYear(), type: 'VIGNETTE', montant: '', statut: 'PAYEE', dateEcheance: '', referencePaiement: ''
  });

  const [reformeForm, setReformeForm] = useState({
    id: null, vehiculeId: '', motifReforme: '', dateDecision: '', pvCommission: '', statut: 'INITIE', prixCession: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vData, tData, rData, vehData] = await Promise.all([
        visiteTechniqueService.getAll().catch(() => []),
        taxeService.getAll().catch(() => []),
        reformeService.getAll().catch(() => []),
        vehiculeService.getVehicules().catch(() => [])
      ]);
      setVisites(Array.isArray(vData) ? vData : (vData?.content || vData?.data || []));
      setTaxes(Array.isArray(tData) ? tData : (tData?.content || tData?.data || []));
      setReformes(Array.isArray(rData) ? rData : (rData?.content || rData?.data || []));
      const vList = Array.isArray(vehData) ? vehData : (vehData?.content || vehData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
    } catch (err) {
      console.error('Erreur chargement visites/taxes/réforme:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Visite Handler
  const handleVisiteSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...visiteForm,
        vehiculeId: Number(visiteForm.vehiculeId)
      };
      if (visiteForm.id) {
        await visiteTechniqueService.update(visiteForm.id, payload);
        toast.success('Visite technique modifiée avec succès');
      } else {
        await visiteTechniqueService.create(payload);
        if (visiteForm.resultat === 'CONTRE_VISITE_OBLIGATOIRE') {
          toast.success('🔧 Visite enregistrée — Ordre de réparation créé automatiquement sous 15 jours');
        } else {
          toast.success('Visite technique enregistrée avec succès');
        }
      }
      setShowVisiteModal(false);
      resetVisiteForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la visite technique'));
    }
  };

  // Taxe Handler
  const handleTaxeSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taxeForm,
        vehiculeId: Number(taxeForm.vehiculeId),
        annee: Number(taxeForm.annee),
        montant: taxeForm.montant ? parseFloat(taxeForm.montant) : 0
      };
      if (taxeForm.id) {
        await taxeService.update(taxeForm.id, payload);
        toast.success('Taxe modifiée avec succès');
      } else {
        await taxeService.create(payload);
        toast.success('Paiement de taxe enregistré avec succès');
      }
      setShowTaxeModal(false);
      resetTaxeForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de l\'enregistrement de la taxe'));
    }
  };

  // Réforme Handler
  const handleReformeSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...reformeForm,
        vehiculeId: Number(reformeForm.vehiculeId),
        prixCession: reformeForm.prixCession ? parseFloat(reformeForm.prixCession) : 0
      };
      if (reformeForm.id) await reformeService.update(reformeForm.id, payload);
      else await reformeService.create(payload);
      toast.success(reformeForm.id ? 'Procédure de réforme modifiée avec succès' : 'Procédure de réforme enregistrée avec succès');
      setShowReformeModal(false);
      resetReformeForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la procédure de réforme'));
    }
  };

  // Valider Réforme
  const handleValiderReforme = async (reformeId) => {
    try {
      await reformeService.valider(reformeId);
      toast.success('Réforme validée définitivement — Véhicule sorti de l\'inventaire actif');
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Le Procès-Verbal de la Commission de Réforme est obligatoire pour valider.'));
    }
  };

  const handleDeleteConfirm = async () => {
    const { item, type } = deleteModal;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      if (type === 'visite') await visiteTechniqueService.delete(item.id);
      else if (type === 'taxe') await taxeService.delete(item.id);
      else if (type === 'reforme') await reformeService.delete(item.id);
      toast.success('Élément supprimé avec succès');
      setDeleteModal({ isOpen: false, item: null, type: '', loading: false });
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la suppression'));
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const resetVisiteForm = () => {
    setVisiteForm({ id: null, vehiculeId: '', dateVisite: '', centre: '', resultat: 'FAVORABLE', dateProchaine: '', observations: '' });
  };
  const resetTaxeForm = () => {
    setTaxeForm({ id: null, vehiculeId: '', annee: new Date().getFullYear(), type: 'VIGNETTE', montant: '', statut: 'PAYEE', dateEcheance: '', referencePaiement: '' });
  };
  const resetReformeForm = () => {
    setReformeForm({ id: null, vehiculeId: '', motifReforme: '', dateDecision: '', pvCommission: '', statut: 'INITIE', prixCession: '' });
  };

  // Filtered
  const filteredVisites = visites.filter(v => {
    const q = searchTerm.toLowerCase();
    return !searchTerm || (v.immatriculation && v.immatriculation.toLowerCase().includes(q)) || (v.centre && v.centre.toLowerCase().includes(q));
  });

  const filteredTaxes = taxes.filter(t => {
    const q = searchTerm.toLowerCase();
    return !searchTerm || (t.immatriculation && t.immatriculation.toLowerCase().includes(q)) || (t.referencePaiement && t.referencePaiement.toLowerCase().includes(q));
  });

  const filteredReformes = reformes.filter(r => {
    const q = searchTerm.toLowerCase();
    return !searchTerm || (r.immatriculation && r.immatriculation.toLowerCase().includes(q)) || (r.motifReforme && r.motifReforme.toLowerCase().includes(q));
  });

  const contreVisiteCount = visites.filter(v => v.resultat === 'CONTRE_VISITE_OBLIGATOIRE').length;
  const taxesRetardCount = taxes.filter(t => t.statut === 'EN_RETARD').length;
  const reformesEnCoursCount = reformes.filter(r => r.statut === 'EN_COURS_DE_REFORME' || r.statut === 'INITIE').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header Banner */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A1E3F]/5 border border-[#C59B27]/30 flex items-center justify-center text-[#C59B27]">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
              Visites Techniques, Taxes & Réforme
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Contrôles réglementaires, contre-visites, vignettes et procédure de réforme des véhicules vétustes
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { resetTaxeForm(); setShowTaxeModal(true); }}
            className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Paiement Taxe
          </button>
          
          <button
            onClick={() => { resetVisiteForm(); setShowVisiteModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Saisir Visite
          </button>
        </div>
      </motion.div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Visites & Contre-visites</span>
            <span className="text-xl font-black text-[#0A1E3F] mt-1 block">{visites.length} réalisées ({contreVisiteCount} contre-visites)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Taxes & Vignettes 2026</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{taxes.filter(t => t.statut === 'PAYEE').length} Payées ({taxesRetardCount} en retard)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Procédure de Réforme</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">{reformesEnCoursCount} Dossiers en cours</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <motion.div 
        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('visites')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'visites' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Visites Techniques ({visites.length})
          </button>

          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'taxes' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Taxes & Vignettes ({taxes.length})
          </button>

          <button
            onClick={() => setActiveTab('reforme')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reforme' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Réforme & Déclassement ({reformes.length})
          </button>
        </div>

        {activeTab === 'visites' && (
          <button
            onClick={() => { resetVisiteForm(); setShowVisiteModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle Visite
          </button>
        )}

        {activeTab === 'taxes' && (
          <button
            onClick={() => { resetTaxeForm(); setShowTaxeModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Régler Taxe / Vignette
          </button>
        )}

        {activeTab === 'reforme' && (
          <button
            onClick={() => { resetReformeForm(); setShowReformeModal(true); }}
            className="border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Initier Réforme
          </button>
        )}
      </motion.div>

      {/* Search Toolbar */}
      <motion.div 
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par immatriculation, centre, motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Affichage de <span className="text-[#0A1E3F] font-extrabold">
            {activeTab === 'visites' ? filteredVisites.length : activeTab === 'taxes' ? filteredTaxes.length : filteredReformes.length}
          </span> élément(s)
        </div>
      </motion.div>

      {/* Tab 1: Visites Techniques */}
      {activeTab === 'visites' && (
        <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Date & Centre</th>
                  <th>Résultat Visite</th>
                  <th>Prochaine Échéance</th>
                  <th>Observations</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisites.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucune visite technique enregistrée.</span>
                    </td>
                  </tr>
                ) : (
                  filteredVisites.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <MoroccanPlate immatriculation={v.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{v.marqueModele}</div>
                      </td>

                      <td>
                        <div className="font-bold text-[#0A1E3F]">
                          {v.dateVisite ? new Date(v.dateVisite).toLocaleDateString('fr-FR') : '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C59B27]" /> {v.centre || 'Dekra Technival'}
                        </div>
                      </td>

                      <td>
                        {v.resultat === 'FAVORABLE' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> FAVORABLE
                          </span>
                        ) : v.resultat === 'CONTRE_VISITE_OBLIGATOIRE' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> CONTRE-VISITE OBLIGATOIRE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            REFUSÉE
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="text-xs font-bold text-[#0A1E3F]">
                          {v.dateProchaine ? new Date(v.dateProchaine).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </td>

                      <td className="text-xs text-slate-600 max-w-xs truncate">
                        {v.observations || 'Aucune observation'}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail({ item: v, type: 'visite' })}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Voir les détails de la visite"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setVisiteForm(v); setShowVisiteModal(true); }}
                            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Modifier la visite"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: v, type: 'visite', loading: false })}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer la visite"
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
      )}

      {/* Tab 2: Taxes & Vignettes */}
      {activeTab === 'taxes' && (
        <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Année & Type</th>
                  <th>Montant</th>
                  <th>Date Échéance</th>
                  <th>Référence Paiement</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaxes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucun paiement de taxe enregistré.</span>
                    </td>
                  </tr>
                ) : (
                  filteredTaxes.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <MoroccanPlate immatriculation={t.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{t.marqueModele}</div>
                      </td>

                      <td>
                        <div className="font-extrabold text-[#0A1E3F]">Année {t.annee}</div>
                        <div className="text-[10px] uppercase font-bold text-[#C59B27]">{t.type}</div>
                      </td>

                      <td className="font-extrabold text-[#0A1E3F]">
                        {t.montant ? t.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                      </td>

                      <td className="text-xs font-semibold text-slate-700">
                        {t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                      </td>

                      <td className="text-xs font-mono text-slate-600">
                        {t.referencePaiement || 'N/A'}
                      </td>

                      <td>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                          t.statut === 'PAYEE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          t.statut === 'EXONEREE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {t.statut}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail({ item: t, type: 'taxe' })}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Voir les détails de la taxe"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setTaxeForm(t); setShowTaxeModal(true); }}
                            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Modifier la taxe"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: t, type: 'taxe', loading: false })}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer la taxe"
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
      )}

      {/* Tab 3: Réforme & Déclassement */}
      {activeTab === 'reforme' && (
        <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Motif de Réforme</th>
                  <th>Date Décision</th>
                  <th>PV Commission</th>
                  <th>Prix Cession</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReformes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucune procédure de réforme initiée.</span>
                    </td>
                  </tr>
                ) : (
                  filteredReformes.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <MoroccanPlate immatriculation={r.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{r.marqueModele}</div>
                      </td>

                      <td className="text-xs text-slate-700 max-w-xs">
                        {r.motifReforme}
                      </td>

                      <td className="text-xs font-bold text-[#0A1E3F]">
                        {r.dateDecision ? new Date(r.dateDecision).toLocaleDateString('fr-FR') : '-'}
                      </td>

                      <td>
                        {r.pvCommission ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                            <FileText className="w-3 h-3 text-blue-600" /> {r.pvCommission}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            ⚠️ PV Commission Manquant
                          </span>
                        )}
                      </td>

                      <td className="font-extrabold text-[#0A1E3F]">
                        {r.prixCession ? r.prixCession.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                      </td>

                      <td>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                          r.statut === 'REFORME' || r.statut === 'VENDU' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {r.statut}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail({ item: r, type: 'reforme' })}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Voir les détails de la réforme"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setReformeForm(r); setShowReformeModal(true); }}
                            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Modifier le dossier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {r.statut !== 'REFORME' && r.statut !== 'VENDU' && (
                            <button
                              onClick={() => handleValiderReforme(r.id)}
                              className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title="Valider la réforme"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: r, type: 'reforme', loading: false })}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer la réforme"
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
      )}

      {/* Modal Visite */}
      <AnimatePresence>
        {showVisiteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {visiteForm.id ? 'Modifier la Visite Technique' : 'Saisir une Visite Technique'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Contrôle de conformité et validité réglementaire</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowVisiteModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleVisiteSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule *</label>
                      <select
                        required
                        value={visiteForm.vehiculeId}
                        onChange={(e) => setVisiteForm({ ...visiteForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de visite *</label>
                      <input
                        type="date"
                        required
                        value={visiteForm.dateVisite}
                        onChange={(e) => setVisiteForm({ ...visiteForm, dateVisite: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Centre de contrôle</label>
                      <input
                        type="text"
                        placeholder="Centre Dekra Technival Rabat"
                        value={visiteForm.centre}
                        onChange={(e) => setVisiteForm({ ...visiteForm, centre: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Résultat de la visite</label>
                      <select
                        value={visiteForm.resultat}
                        onChange={(e) => setVisiteForm({ ...visiteForm, resultat: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {RESULTATS_VISITE.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de prochaine visite</label>
                      <input
                        type="date"
                        value={visiteForm.dateProchaine || ''}
                        onChange={(e) => setVisiteForm({ ...visiteForm, dateProchaine: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence du PV de visite</label>
                      <input
                        type="text"
                        placeholder="ex: PV-VT-2026-041"
                        value={visiteForm.pvVisite || ''}
                        onChange={(e) => setVisiteForm({ ...visiteForm, pvVisite: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations</label>
                    <textarea rows="2" placeholder="Remarques du contrôleur..." value={visiteForm.observations || ''} onChange={(e) => setVisiteForm({ ...visiteForm, observations: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowVisiteModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>{visiteForm.id ? 'Enregistrer les modifications' : 'Enregistrer Visite'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Taxe */}
      <AnimatePresence>
        {showTaxeModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {taxeForm.id ? 'Modifier Taxe / Vignette' : 'Enregistrer Taxe / Vignette'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Paiement des vignettes et taxes à l'essieu</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowTaxeModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTaxeSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule *</label>
                      <select
                        required
                        value={taxeForm.vehiculeId}
                        onChange={(e) => setTaxeForm({ ...taxeForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de taxe</label>
                      <select value={taxeForm.type} onChange={(e) => setTaxeForm({ ...taxeForm, type: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        {TYPES_TAXE.map(type => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut</label>
                      <select value={taxeForm.statut} onChange={(e) => setTaxeForm({ ...taxeForm, statut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        <option value="PAYEE">Payée</option><option value="EN_RETARD">En retard</option><option value="EXONEREE">Exonérée</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date d'échéance</label>
                      <input type="date" value={taxeForm.dateEcheance || ''} onChange={(e) => setTaxeForm({ ...taxeForm, dateEcheance: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Année *</label>
                      <input
                        type="number"
                        required
                        value={taxeForm.annee}
                        onChange={(e) => setTaxeForm({ ...taxeForm, annee: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1500.00"
                        value={taxeForm.montant}
                        onChange={(e) => setTaxeForm({ ...taxeForm, montant: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence Paiement</label>
                      <input
                        type="text"
                        placeholder="VIG-2026-XXXX"
                        value={taxeForm.referencePaiement}
                        onChange={(e) => setTaxeForm({ ...taxeForm, referencePaiement: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowTaxeModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{taxeForm.id ? 'Enregistrer les modifications' : 'Enregistrer Taxe'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Réforme */}
      <AnimatePresence>
        {showReformeModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {reformeForm.id ? 'Modifier la Réforme Véhicule' : 'Initier Réforme Véhicule'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Déclassement et sortie du patrimoine de l'État</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowReformeModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReformeSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#C59B27] shrink-0" />
                    <span>Le Procès-Verbal de la Commission de Réforme doit être joint pour permettre la validation finale.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule à réformer *</label>
                      <select
                        required
                        value={reformeForm.vehiculeId}
                        onChange={(e) => setReformeForm({ ...reformeForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de décision</label>
                      <input type="date" value={reformeForm.dateDecision || ''} onChange={(e) => setReformeForm({ ...reformeForm, dateDecision: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut du dossier</label>
                      <select value={reformeForm.statut} onChange={(e) => setReformeForm({ ...reformeForm, statut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        {STATUTS_REFORME.filter(s => s !== 'REFORME' && s !== 'VENDU').map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Prix de cession estimé (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="35000.00"
                        value={reformeForm.prixCession}
                        onChange={(e) => setReformeForm({ ...reformeForm, prixCession: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fichier PV Commission de Réforme *</label>
                    <input
                      type="text"
                      required
                      placeholder="PV_Commission_Reforme_2026.pdf"
                      value={reformeForm.pvCommission}
                      onChange={(e) => setReformeForm({ ...reformeForm, pvCommission: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Motif du déclassement *</label>
                    <textarea
                      rows="3"
                      required
                      placeholder="Détaillez le motif technique ou l'usure de l'engin..."
                      value={reformeForm.motifReforme}
                      onChange={(e) => setReformeForm({ ...reformeForm, motifReforme: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowReformeModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{reformeForm.id ? 'Enregistrer les modifications' : 'Initier la Réforme'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItemDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-[#0A1E3F] px-6 py-4 flex items-center justify-between border-b border-[#C59B27]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                      {selectedItemDetail.type === 'visite' && 'Fiche Visite Technique'}
                      {selectedItemDetail.type === 'taxe' && 'Fiche Taxe & Vignette'}
                      {selectedItemDetail.type === 'reforme' && 'Fiche Réforme & Déclassement'}
                    </h3>
                    <p className="text-[11px] text-[#C59B27] font-mono">
                      {selectedItemDetail.type === 'visite' && (selectedItemDetail.item.centre || 'Dekra Technival')}
                      {selectedItemDetail.type === 'taxe' && `Année ${selectedItemDetail.item.annee} — ${selectedItemDetail.item.type}`}
                      {selectedItemDetail.type === 'reforme' && (selectedItemDetail.item.pvCommission || 'Dossier de réforme')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItemDetail(null)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Vehicle section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Véhicule Concerné</span>
                    <div className="font-bold text-[#0A1E3F] text-sm">{selectedItemDetail.item.marqueModele || 'Véhicule MEF'}</div>
                  </div>
                  <MoroccanPlate immatriculation={selectedItemDetail.item.immatriculation} />
                </div>

                {selectedItemDetail.type === 'visite' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date Visite</span>
                        <span className="font-bold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.dateVisite ? new Date(selectedItemDetail.item.dateVisite).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Centre Contrôle</span>
                        <span className="font-bold text-slate-700 text-xs">{selectedItemDetail.item.centre || 'Dekra Technival'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Résultat</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          selectedItemDetail.item.resultat === 'FAVORABLE' ? 'bg-emerald-100 text-emerald-800' :
                          selectedItemDetail.item.resultat === 'CONTRE_VISITE_OBLIGATOIRE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedItemDetail.item.resultat?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prochaine Échéance</span>
                        <span className="font-bold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.dateProchaine ? new Date(selectedItemDetail.item.dateProchaine).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                    </div>

                    {selectedItemDetail.item.observations && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Observations :</span>
                        <p className="text-slate-600 font-medium">{selectedItemDetail.item.observations}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedItemDetail.type === 'taxe' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Année</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">{selectedItemDetail.item.annee}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type Taxe</span>
                        <span className="font-extrabold text-[#C59B27] text-xs uppercase">{selectedItemDetail.item.type}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Réglé</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.montant ? selectedItemDetail.item.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Statut Paiement</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          selectedItemDetail.item.statut === 'PAYEE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedItemDetail.item.statut}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Référence Paiement</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">{selectedItemDetail.item.referencePaiement || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItemDetail.type === 'reforme' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date Décision</span>
                        <span className="font-bold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.dateDecision ? new Date(selectedItemDetail.item.dateDecision).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Statut Procédure</span>
                        <span className="font-extrabold text-amber-800 text-xs">{selectedItemDetail.item.statut}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prix de Cession</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.prixCession ? selectedItemDetail.item.prixCession.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PV Commission</span>
                        <span className="font-bold text-blue-700 text-xs">{selectedItemDetail.item.pvCommission || 'Non téléversé'}</span>
                      </div>
                    </div>

                    {selectedItemDetail.item.motifReforme && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Motif de Réforme :</span>
                        <p className="text-slate-600 font-medium">{selectedItemDetail.item.motifReforme}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => {
                    const itemToEdit = selectedItemDetail.item;
                    const type = selectedItemDetail.type;
                    setSelectedItemDetail(null);
                    if (type === 'visite') { setVisiteForm(itemToEdit); setShowVisiteModal(true); }
                    else if (type === 'taxe') { setTaxeForm(itemToEdit); setShowTaxeModal(true); }
                    else if (type === 'reforme') { setReformeForm(itemToEdit); setShowReformeModal(true); }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Modifier cet enregistrement
                </button>

                <button
                  onClick={() => setSelectedItemDetail(null)}
                  className="ml-auto px-5 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Confirmation de suppression"
        message="Êtes-vous sûr de vouloir supprimer cet enregistrement ?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, type: '', loading: false })}
        loading={deleteModal.loading}
      />
    </div>
  );
}
