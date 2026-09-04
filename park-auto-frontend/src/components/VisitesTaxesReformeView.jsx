import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, Plus, Search, X, 
  Trash2, Edit, FileText, DollarSign, Eye, Check, Download,
  MapPin, CheckCircle2, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { visiteTechniqueService } from '../services/visiteTechniqueService';
import { taxeService } from '../services/taxeService';
import { reformeService } from '../services/reformeService';
import { vehiculeService } from '../services/vehiculeService';
import { documentService } from '../services/documentService';
import { getApiErrorMessage } from '../services/api';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';
import GedDocumentsPanel from './GedDocumentsPanel';
import MefSelect from './ui/MefSelect';

const RESULTATS_VISITE = [
  { key: 'FAVORABLE', label: 'Favorable', color: 'emerald' },
  { key: 'CONTRE_VISITE_OBLIGATOIRE', label: 'Contre-visite obligatoire', color: 'amber' },
  { key: 'REFUSEE', label: 'Refusée', color: 'rose' }
];

const TYPES_TAXE = ['VIGNETTE', 'TAXE_CIRCULATION'];
const LIBELLE_STATUT_REFORME = {
  INITIE: 'Initié',
  EN_COURS_DE_REFORME: 'En cours de réforme',
  VALIDE: 'Validé (PV réunis)',
  REFORME: 'Réformé — sorti du parc',
  VENDU: 'Vendu / cédé'
};
const ETAPES_REFORME = [
  { key: 'INITIE', label: 'Initié' },
  { key: 'EN_COURS_DE_REFORME', label: 'En cours' },
  { key: 'VALIDE', label: 'Validé' },
  { key: 'REFORME', label: 'Sorti' },
  { key: 'VENDU', label: 'Cédé' }
];
const TABS = ['visites', 'taxes', 'reforme'];
// RG07 — le dossier de réforme comporte les deux PV (Commission de réforme + Domaines) et les données de cession
const EMPTY_REFORME_FORM = {
  id: null, vehiculeId: '', sinistreId: null, motifReforme: '', dateDecision: '',
  pvCommission: '', datePvCommission: '', pvDomaines: '', datePvDomaines: '',
  prixCession: '', dateCession: '', acquereur: '', observation: ''
};
const toReformeForm = (r) => ({
  ...EMPTY_REFORME_FORM,
  ...r,
  dateDecision: r.dateDecision || '',
  datePvCommission: r.datePvCommission || '',
  datePvDomaines: r.datePvDomaines || '',
  dateCession: r.dateCession || '',
  pvCommission: r.pvCommission || '',
  pvDomaines: r.pvDomaines || '',
  acquereur: r.acquereur || '',
  observation: r.observation || '',
  prixCession: r.prixCession != null ? String(r.prixCession) : ''
});

const readCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function VisitesTaxesReformeView({ user: userProp }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = userProp || readCurrentUser();
  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'CONSULTATION');
  const canManage = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER'].includes(roleName);
  const canValiderReforme = ['ADMIN'].includes(roleName);
  const canUploadGed = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'RESPONSABLE_FINANCIER'].includes(roleName);
  const canDeleteGed = ['ADMIN', 'GESTIONNAIRE_CENTRAL'].includes(roleName);

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(TABS.includes(tabFromUrl) ? tabFromUrl : 'visites');
  const [pendingCommissionFiles, setPendingCommissionFiles] = useState([]);
  const [pendingDomainesFiles, setPendingDomainesFiles] = useState([]);

  const goTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'visites' ? {} : { tab }, { replace: true });
  };
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

  const [reformeForm, setReformeForm] = useState(EMPTY_REFORME_FORM);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let loadErrors = [];
      const [vData, tData, rData, vehData] = await Promise.all([
        visiteTechniqueService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        taxeService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        reformeService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        vehiculeService.getVehicules().catch((e) => { loadErrors.push(e); return []; })
      ]);
      if (loadErrors.length > 0) toast.error(`Certaines données n'ont pas pu être chargées (${loadErrors.length} erreur(s)).`);
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
      // Le statut n'est jamais envoyé depuis le formulaire : les transitions passent par la machine à états serveur
      const { statut, transitionsPossibles, nbDocumentsGED, immatriculation, marqueModele, dateSortieParc, ...champs } = reformeForm;
      const payload = {
        ...champs,
        vehiculeId: Number(reformeForm.vehiculeId),
        dateDecision: reformeForm.dateDecision || null,
        datePvCommission: reformeForm.datePvCommission || null,
        datePvDomaines: reformeForm.datePvDomaines || null,
        dateCession: reformeForm.dateCession || null,
        pvCommission: reformeForm.pvCommission || null,
        pvDomaines: reformeForm.pvDomaines || null,
        acquereur: reformeForm.acquereur || null,
        observation: reformeForm.observation || null,
        prixCession: reformeForm.prixCession ? parseFloat(reformeForm.prixCession) : null
      };
      const saved = reformeForm.id
        ? await reformeService.update(reformeForm.id, payload)
        : await reformeService.create(payload);
      const entityId = reformeForm.id || saved?.id;
      if (entityId && pendingCommissionFiles.length) {
        try {
          await documentService.uploadMany(pendingCommissionFiles, 'reforme', entityId, 'PV_COMMISSION');
        } catch (uploadErr) {
          toast.error(getApiErrorMessage(uploadErr, 'Dossier enregistré, mais le PV Commission n’a pas pu être déposé.'));
        }
      }
      if (entityId && pendingDomainesFiles.length) {
        try {
          await documentService.uploadMany(pendingDomainesFiles, 'reforme', entityId, 'PV_DOMAINES');
        } catch (uploadErr) {
          toast.error(getApiErrorMessage(uploadErr, 'Dossier enregistré, mais le PV Domaines n’a pas pu être déposé.'));
        }
      }
      toast.success(reformeForm.id ? 'Procédure de réforme modifiée avec succès' : 'Procédure de réforme enregistrée avec succès');
      setShowReformeModal(false);
      resetReformeForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la procédure de réforme'));
    }
  };

  // Valider Réforme (RG07 : PV Commission + PV Domaines obligatoires, contrôlés côté serveur)
  const handleValiderReforme = async (reformeId) => {
    try {
      await reformeService.valider(reformeId);
      toast.success('Réforme validée définitivement — Véhicule sorti de l\'inventaire actif');
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Les PV de la Commission de Réforme et des Domaines sont obligatoires pour valider.'));
    }
  };

  // Transition de statut contrôlée par la machine à états serveur
  const handleChangerStatutReforme = async (reformeId, statut) => {
    if (!statut) return;
    try {
      await reformeService.changerStatut(reformeId, statut);
      toast.success(`Dossier de réforme passé au statut « ${LIBELLE_STATUT_REFORME[statut] || statut} »`);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Transition de statut refusée par le serveur.'));
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
    setPendingCommissionFiles([]);
    setPendingDomainesFiles([]);
    setReformeForm(EMPTY_REFORME_FORM);
  };

  const handleOpenPvCommission = async (reformeId) => {
    try {
      await reformeService.openPvCommissionPdf(reformeId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible d’ouvrir le PV de commission.'));
    }
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
            onClick={() => goTab('visites')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'visites' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Visites Techniques ({visites.length})
          </button>

          <button
            onClick={() => goTab('taxes')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'taxes' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Taxes & Vignettes ({taxes.length})
          </button>

          <button
            onClick={() => goTab('reforme')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reforme' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Réforme & Déclassement ({reformes.length})
          </button>
        </div>

        {canManage && activeTab === 'visites' && (
          <button
            onClick={() => { resetVisiteForm(); setShowVisiteModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle Visite
          </button>
        )}

        {canManage && activeTab === 'taxes' && (
          <button
            onClick={() => { resetTaxeForm(); setShowTaxeModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Régler Taxe / Vignette
          </button>
        )}

        {canManage && activeTab === 'reforme' && (
          <button
            onClick={() => { resetReformeForm(); setShowReformeModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
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
                          {canManage && (
                            <>
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
                            </>
                          )}
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
                          {canManage && (
                            <>
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
                            </>
                          )}
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
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {filteredReformes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <span className="text-xs font-bold text-slate-500">Aucune procédure de réforme initiée.</span>
            </div>
          ) : (
            filteredReformes.map((r) => {
              const stepIndex = Math.max(0, ETAPES_REFORME.findIndex((s) => s.key === r.statut));
              const pvOk = Boolean(r.pvCommissionPresent);
              const domOk = Boolean(r.pvDomainesPresent);
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div>
                        <MoroccanPlate immatriculation={r.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{r.marqueModele}</div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">{r.motifReforme}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Décision : {r.dateDecision ? new Date(r.dateDecision).toLocaleDateString('fr-FR') : 'non datée'}
                          {r.prixCession ? ` · Cession ${r.prixCession.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD` : ''}
                          {r.dateSortieParc ? ` · Sortie ${new Date(r.dateSortieParc).toLocaleDateString('fr-FR')}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black ${
                      r.statut === 'REFORME' || r.statut === 'VENDU' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      r.statut === 'VALIDE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {LIBELLE_STATUT_REFORME[r.statut] || r.statut}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    {ETAPES_REFORME.map((etape, idx) => (
                      <div key={etape.key} className={`rounded-lg px-2 py-1.5 text-center text-[10px] font-extrabold ${
                        idx < stepIndex ? 'bg-emerald-50 text-emerald-700' :
                        idx === stepIndex ? 'bg-[#0A1E3F] text-[#C59B27]' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {idx + 1}. {etape.label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`rounded-xl border p-3 ${pvOk ? 'border-blue-200 bg-blue-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">PV Commission</p>
                      <p className={`text-xs font-bold mt-1 ${pvOk ? 'text-blue-800' : 'text-rose-700'}`}>
                        {pvOk ? (r.pvCommission || 'Pièce GED jointe ou référence saisie') : 'Manquant — joindre le scan ou générer le PV'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenPvCommission(r.id)}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#0A1E3F] hover:text-[#C59B27] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Télécharger le PV officiel
                      </button>
                    </div>
                    <div className={`rounded-xl border p-3 ${domOk ? 'border-indigo-200 bg-indigo-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">PV des Domaines</p>
                      <p className={`text-xs font-bold mt-1 ${domOk ? 'text-indigo-800' : 'text-rose-700'}`}>
                        {domOk ? (r.pvDomaines || 'Pièce GED jointe ou référence saisie') : 'Manquant — joindre le PV scanné des Domaines'}
                      </p>
                      {r.nbDocumentsGED > 0 && (
                        <p className="text-[10px] text-slate-500 font-semibold mt-2">{r.nbDocumentsGED} pièce(s) GED sur le dossier</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {canValiderReforme && Array.isArray(r.transitionsPossibles) && r.transitionsPossibles.length > 0 && (
                      <MefSelect
                        value=""
                        onChange={(e) => handleChangerStatutReforme(r.id, e.target.value)}
                        className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                      >
                        <option value="">Avancer le dossier…</option>
                        {r.transitionsPossibles.map((s) => (
                          <option key={s} value={s}>{LIBELLE_STATUT_REFORME[s] || s}</option>
                        ))}
                      </MefSelect>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedItemDetail({ item: r, type: 'reforme' })}
                      className="h-8 px-3 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Dossier
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => { setReformeForm(toReformeForm(r)); setShowReformeModal(true); }}
                        className="h-8 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Modifier
                      </button>
                    )}
                    {canValiderReforme && r.statut !== 'REFORME' && r.statut !== 'VENDU' && (
                      <button
                        type="button"
                        onClick={() => handleValiderReforme(r.id)}
                        disabled={!pvOk || !domOk}
                        className="h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!pvOk || !domOk ? 'RG07 : PV Commission et PV Domaines requis' : 'Valider et sortir du parc'}
                      >
                        <Check className="w-3.5 h-3.5" /> Valider
                      </button>
                    )}
                    {canManage && r.statut !== 'VALIDE' && r.statut !== 'REFORME' && r.statut !== 'VENDU' && (
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, item: r, type: 'reforme', loading: false })}
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center cursor-pointer"
                        title="Supprimer la réforme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
                      <MefSelect
                        required
                        value={visiteForm.vehiculeId}
                        onChange={(e) => setVisiteForm({ ...visiteForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </MefSelect>
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
                      <MefSelect
                        value={visiteForm.resultat}
                        onChange={(e) => setVisiteForm({ ...visiteForm, resultat: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {RESULTATS_VISITE.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </MefSelect>
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
                      <MefSelect
                        required
                        value={taxeForm.vehiculeId}
                        onChange={(e) => setTaxeForm({ ...taxeForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </MefSelect>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de taxe</label>
                      <MefSelect value={taxeForm.type} onChange={(e) => setTaxeForm({ ...taxeForm, type: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        {TYPES_TAXE.map(type => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                      </MefSelect>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut</label>
                      <MefSelect value={taxeForm.statut} onChange={(e) => setTaxeForm({ ...taxeForm, statut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        <option value="PAYEE">Payée</option><option value="EN_RETARD">En retard</option><option value="EXONEREE">Exonérée</option>
                      </MefSelect>
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
                    <span>RG07 — Le PV de la Commission de Réforme <strong>et</strong> le PV des Domaines sont obligatoires pour la validation finale. Le statut évolue via les transitions contrôlées depuis la liste (INITIÉ → EN COURS → VALIDÉ → RÉFORMÉ → VENDU).</span>
                  </div>
                  {reformeForm.id && (
                    <div className="text-xs text-slate-600 font-semibold">
                      Statut actuel : <span className="text-[#0A1E3F] font-black">{LIBELLE_STATUT_REFORME[reformeForm.statut] || reformeForm.statut || 'Initié'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule à réformer *</label>
                      <MefSelect
                        required
                        value={reformeForm.vehiculeId}
                        onChange={(e) => setReformeForm({ ...reformeForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </MefSelect>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de décision</label>
                      <input type="date" value={reformeForm.dateDecision || ''} onChange={(e) => setReformeForm({ ...reformeForm, dateDecision: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence PV Commission de Réforme</label>
                      <input
                        type="text"
                        placeholder="PV-COM-2026-014"
                        value={reformeForm.pvCommission}
                        onChange={(e) => setReformeForm({ ...reformeForm, pvCommission: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date PV Commission</label>
                      <input type="date" value={reformeForm.datePvCommission || ''} onChange={(e) => setReformeForm({ ...reformeForm, datePvCommission: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence PV des Domaines</label>
                      <input
                        type="text"
                        placeholder="PV-DOM-2026-007"
                        value={reformeForm.pvDomaines}
                        onChange={(e) => setReformeForm({ ...reformeForm, pvDomaines: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date PV des Domaines</label>
                      <input type="date" value={reformeForm.datePvDomaines || ''} onChange={(e) => setReformeForm({ ...reformeForm, datePvDomaines: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GedDocumentsPanel
                      entite="reforme"
                      entiteId={reformeForm.id}
                      typeDocument="PV_COMMISSION"
                      canUpload={canUploadGed && Boolean(reformeForm.id)}
                      canDelete={canDeleteGed}
                      pendingFiles={pendingCommissionFiles}
                      onPendingFilesChange={canUploadGed ? setPendingCommissionFiles : undefined}
                      title="Scan du PV Commission"
                      hint="PDF signé de la commission — ou générez-le depuis le dossier"
                    />
                    <GedDocumentsPanel
                      entite="reforme"
                      entiteId={reformeForm.id}
                      typeDocument="PV_DOMAINES"
                      canUpload={canUploadGed && Boolean(reformeForm.id)}
                      canDelete={canDeleteGed}
                      pendingFiles={pendingDomainesFiles}
                      onPendingFilesChange={canUploadGed ? setPendingDomainesFiles : undefined}
                      title="Scan du PV des Domaines"
                      hint="Pièce obligatoire RG07 (scan PDF / photo)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Prix de cession (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="35000.00"
                        value={reformeForm.prixCession}
                        onChange={(e) => setReformeForm({ ...reformeForm, prixCession: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Obligatoire pour clôturer le dossier en « Vendu / cédé ».</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de cession</label>
                      <input type="date" value={reformeForm.dateCession || ''} onChange={(e) => setReformeForm({ ...reformeForm, dateCession: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Acquéreur (Domaines / vente aux enchères)</label>
                      <input
                        type="text"
                        placeholder="Direction des Domaines de l'État — adjudicataire..."
                        value={reformeForm.acquereur}
                        onChange={(e) => setReformeForm({ ...reformeForm, acquereur: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations</label>
                    <textarea
                      rows="2"
                      placeholder="Remarques de la commission, état du véhicule, pièces jointes GED..."
                      value={reformeForm.observation}
                      onChange={(e) => setReformeForm({ ...reformeForm, observation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
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
              className={`bg-white rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-200 ${selectedItemDetail.type === 'reforme' ? 'max-w-2xl' : 'max-w-lg'}`}
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
                      {selectedItemDetail.type === 'reforme' && `Dossier REF-${selectedItemDetail.item.id}`}
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
                        <span className="font-extrabold text-amber-800 text-xs">{LIBELLE_STATUT_REFORME[selectedItemDetail.item.statut] || selectedItemDetail.item.statut}</span>
                        {selectedItemDetail.item.dateSortieParc && (
                          <span className="block text-[10px] text-slate-500 mt-1">Sortie du parc le {new Date(selectedItemDetail.item.dateSortieParc).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prix de Cession</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.prixCession ? selectedItemDetail.item.prixCession.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PV Commission de Réforme</span>
                        <span className={`font-bold text-xs ${selectedItemDetail.item.pvCommissionPresent ? 'text-blue-700' : 'text-rose-600'}`}>
                          {selectedItemDetail.item.pvCommission || (selectedItemDetail.item.pvCommissionPresent ? 'Pièce GED jointe' : 'Manquant')}
                        </span>
                        {selectedItemDetail.item.datePvCommission && (
                          <span className="block text-[10px] text-slate-500 mt-1">du {new Date(selectedItemDetail.item.datePvCommission).toLocaleDateString('fr-FR')}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenPvCommission(selectedItemDetail.item.id)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0A1E3F] hover:text-[#C59B27] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Ouvrir le PV officiel
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PV des Domaines</span>
                        <span className={`font-bold text-xs ${selectedItemDetail.item.pvDomainesPresent ? 'text-indigo-700' : 'text-rose-600'}`}>
                          {selectedItemDetail.item.pvDomaines || (selectedItemDetail.item.pvDomainesPresent ? 'Pièce GED jointe' : 'Manquant')}
                        </span>
                        {selectedItemDetail.item.datePvDomaines && (
                          <span className="block text-[10px] text-slate-500 mt-1">du {new Date(selectedItemDetail.item.datePvDomaines).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                      {(selectedItemDetail.item.acquereur || selectedItemDetail.item.dateCession) && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cession</span>
                          <span className="font-bold text-[#0A1E3F] text-xs">
                            {selectedItemDetail.item.acquereur || 'Acquéreur non renseigné'}
                            {selectedItemDetail.item.dateCession ? ` — le ${new Date(selectedItemDetail.item.dateCession).toLocaleDateString('fr-FR')}` : ''}
                          </span>
                        </div>
                      )}
                      {selectedItemDetail.item.sinistreId && (
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 col-span-2 text-xs text-rose-800 font-semibold">
                          Procédure ouverte automatiquement suite au sinistre n° {selectedItemDetail.item.sinistreId} (perte totale).
                        </div>
                      )}
                    </div>
                    {selectedItemDetail.item.observation && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Observations :</span>
                        <p className="text-slate-600 font-medium">{selectedItemDetail.item.observation}</p>
                      </div>
                    )}

                    {selectedItemDetail.item.motifReforme && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Motif de Réforme :</span>
                        <p className="text-slate-600 font-medium">{selectedItemDetail.item.motifReforme}</p>
                      </div>
                    )}
                    <GedDocumentsPanel
                      entite="reforme"
                      entiteId={selectedItemDetail.item.id}
                      typeDocument="PV_COMMISSION"
                      canUpload={canUploadGed}
                      canDelete={canDeleteGed}
                      title="Pièces GED — PV Commission"
                    />
                    <GedDocumentsPanel
                      entite="reforme"
                      entiteId={selectedItemDetail.item.id}
                      typeDocument="PV_DOMAINES"
                      canUpload={canUploadGed}
                      canDelete={canDeleteGed}
                      title="Pièces GED — PV des Domaines"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                {canManage && (
                <button
                  onClick={() => {
                    const itemToEdit = selectedItemDetail.item;
                    const type = selectedItemDetail.type;
                    setSelectedItemDetail(null);
                    if (type === 'visite') { setVisiteForm(itemToEdit); setShowVisiteModal(true); }
                    else if (type === 'taxe') { setTaxeForm(itemToEdit); setShowTaxeModal(true); }
                    else if (type === 'reforme') { setReformeForm(toReformeForm(itemToEdit)); setShowReformeModal(true); }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Modifier cet enregistrement
                </button>
                )}

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
