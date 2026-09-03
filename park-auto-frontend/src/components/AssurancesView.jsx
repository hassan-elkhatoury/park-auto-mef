import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Plus, Search, Filter, RefreshCw, 
  FileText, CheckCircle2, Clock, X, Info, Eye, Trash2, Edit, Car, Calendar, 
  DollarSign, User, AlertOctagon, MapPin, Building, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assuranceService } from '../services/assuranceService';
import { sinistreService } from '../services/sinistreService';
import { infractionService } from '../services/infractionService';
import { vehiculeService } from '../services/vehiculeService';
import api, { getApiErrorMessage } from '../services/api';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

const COMPAGNIES = ['AXA', 'RMA', 'WAFA', 'SAHAM', 'ATLANTA', 'AUTRE'];
const GARANTIES = ['TOUS_RISQUES', 'TIERS', 'VOL', 'INCENDIE'];
const NATURES_ACCIDENT = ['COLLISION', 'INCENDIE', 'VOL', 'VANDALISME', 'AUTRE'];

export default function AssurancesView() {
  const [activeTab, setActiveTab] = useState('polices'); // 'polices', 'sinistres', 'infractions'
  const [polices, setPolices] = useState([]);
  const [sinistres, setSinistres] = useState([]);
  const [infractions, setInfractions] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [conducteurs, setConducteurs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');

  // Modals
  const [showPoliceModal, setShowPoliceModal] = useState(false);
  const [showSinistreModal, setShowSinistreModal] = useState(false);
  const [showInfractionModal, setShowInfractionModal] = useState(false);

  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, type: '', loading: false });

  // Forms
  const [policeForm, setPoliceForm] = useState({
    id: null, vehiculeId: '', numeroPolice: '', compagnie: 'AXA', typeGarantie: 'TOUS_RISQUES',
    dateDebut: '', dateFin: '', montantPrime: '', franchise: '', statut: 'ACTIVE', documents: '', observations: ''
  });

  const [sinistreForm, setSinistreForm] = useState({
    id: null, vehiculeId: '', conducteurId: '', assuranceId: '', dateAccident: '',
    lieuAccident: '', description: '', tiersImpliques: '', natureAccident: 'COLLISION', montantDommages: '', statut: 'DECLARE', referenceExpertise: ''
  });

  const [infractionForm, setInfractionForm] = useState({
    id: null, vehiculeId: '', conducteurId: '', dateInfraction: '', lieuInfraction: '',
    typeInfraction: '', montantAmende: '', statut: 'EN_ATTENTE', referenceContravention: '', observations: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let loadErrors = [];
      const [pData, sData, iData, vData, cData] = await Promise.all([
        assuranceService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        sinistreService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        infractionService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        vehiculeService.getVehicules().catch((e) => { loadErrors.push(e); return []; }),
        api.get('/conducteurs').catch((e) => { loadErrors.push(e); return []; })
      ]);
      if (loadErrors.length > 0) toast.error(`Certaines données n'ont pas pu être chargées (${loadErrors.length} erreur(s)).`);
      setPolices(Array.isArray(pData) ? pData : (pData?.content || pData?.data || []));
      setSinistres(Array.isArray(sData) ? sData : (sData?.content || sData?.data || []));
      setInfractions(Array.isArray(iData) ? iData : (iData?.content || iData?.data || []));
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
      const cList = cData?.data || cData;
      setConducteurs(Array.isArray(cList) ? cList : (cList?.content || []));
    } catch (err) {
      console.error('Erreur chargement assurances:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Police Handlers
  const handlePoliceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (policeForm.dateDebut && policeForm.dateFin && policeForm.dateFin < policeForm.dateDebut) {
        toast.error('La date de fin doit être postérieure à la date de début.');
        return;
      }
      const payload = {
        ...policeForm,
        vehiculeId: Number(policeForm.vehiculeId),
        montantPrime: policeForm.montantPrime ? parseFloat(policeForm.montantPrime) : 0,
        franchise: policeForm.franchise ? parseFloat(policeForm.franchise) : 0
      };
      if (policeForm.id) await assuranceService.update(policeForm.id, payload);
      else await assuranceService.create(payload);
      toast.success(policeForm.id ? 'Police mise à jour avec succès' : 'Police d\'assurance enregistrée');
      setShowPoliceModal(false);
      resetPoliceForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de l\'enregistrement de la police'));
    }
  };

  // Sinistre Handler
  const handleSinistreSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...sinistreForm,
        vehiculeId: Number(sinistreForm.vehiculeId),
        conducteurId: sinistreForm.conducteurId ? Number(sinistreForm.conducteurId) : null,
        assuranceId: sinistreForm.assuranceId ? Number(sinistreForm.assuranceId) : null,
        montantDommages: sinistreForm.montantDommages ? parseFloat(sinistreForm.montantDommages) : 0
      };
      if (sinistreForm.id) await sinistreService.modifier(sinistreForm.id, payload);
      else await sinistreService.declarer(payload);
      toast.success(sinistreForm.id ? 'Sinistre mis à jour avec succès' : 'Sinistre déclaré — le véhicule est passé en statut ACCIDENTÉ');
      setShowSinistreModal(false);
      resetSinistreForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de l\'enregistrement du sinistre'));
    }
  };

  // Infraction Handler
  const handleInfractionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...infractionForm,
        vehiculeId: Number(infractionForm.vehiculeId),
        conducteurId: infractionForm.conducteurId ? Number(infractionForm.conducteurId) : null,
        montantAmende: infractionForm.montantAmende ? parseFloat(infractionForm.montantAmende) : 0
      };
      if (infractionForm.id) await infractionService.update(infractionForm.id, payload);
      else await infractionService.create(payload);
      toast.success(infractionForm.id ? 'Infraction mise à jour avec succès' : 'Infraction enregistrée avec succès');
      setShowInfractionModal(false);
      resetInfractionForm();
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de l\'enregistrement de l\'infraction'));
    }
  };

  const handleDeleteConfirm = async () => {
    const { item, type } = deleteModal;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      if (type === 'police') await assuranceService.delete(item.id);
      else if (type === 'sinistre') await sinistreService.delete(item.id);
      else if (type === 'infraction') await infractionService.delete(item.id);
      toast.success('Élément supprimé avec succès');
      setDeleteModal({ isOpen: false, item: null, type: '', loading: false });
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la suppression'));
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const generateAutoNumeroPolice = (compagnie = 'AXA') => {
    const year = new Date().getFullYear();
    const prefix = (compagnie || 'AXA').substring(0, 3).toUpperCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `POL-${prefix}-${year}-${randomDigits}`;
  };

  const resetPoliceForm = () => {
    setPoliceForm({ id: null, vehiculeId: '', numeroPolice: generateAutoNumeroPolice('AXA'), compagnie: 'AXA', typeGarantie: 'TOUS_RISQUES', dateDebut: '', dateFin: '', montantPrime: '', franchise: '', statut: 'ACTIVE', documents: '', observations: '' });
  };
  const resetSinistreForm = () => {
    setSinistreForm({ id: null, vehiculeId: '', conducteurId: '', assuranceId: '', dateAccident: '', lieuAccident: '', description: '', tiersImpliques: '', natureAccident: 'COLLISION', montantDommages: '', statut: 'DECLARE', referenceExpertise: '' });
  };
  const resetInfractionForm = () => {
    setInfractionForm({ id: null, vehiculeId: '', conducteurId: '', dateInfraction: '', lieuInfraction: '', typeInfraction: '', montantAmende: '', statut: 'EN_ATTENTE', referenceContravention: '', observations: '' });
  };

  // Filtered lists
  const filteredPolices = polices.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || (p.numeroPolice && p.numeroPolice.toLowerCase().includes(q)) || (p.immatriculation && p.immatriculation.toLowerCase().includes(q)) || (p.compagnie && p.compagnie.toLowerCase().includes(q));
    const matchStatut = statutFilter === 'ALL' || p.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const filteredSinistres = sinistres.filter(s => {
    const q = searchTerm.toLowerCase();
    return !searchTerm || (s.immatriculation && s.immatriculation.toLowerCase().includes(q)) || (s.lieuAccident && s.lieuAccident.toLowerCase().includes(q)) || (s.natureAccident && s.natureAccident.toLowerCase().includes(q));
  });

  const filteredInfractions = infractions.filter(i => {
    const q = searchTerm.toLowerCase();
    return !searchTerm || (i.immatriculation && i.immatriculation.toLowerCase().includes(q)) || (i.referenceContravention && i.referenceContravention.toLowerCase().includes(q)) || (i.typeInfraction && i.typeInfraction.toLowerCase().includes(q));
  });

  // Calculate statistics
  const policesActivesCount = polices.filter(p => p.statut === 'ACTIVE').length;
  const policesJ30Count = polices.filter(p => {
    if (!p.dateFin) return false;
    const diff = (new Date(p.dateFin) - new Date()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 30;
  }).length;
  const sinistresEnCoursCount = sinistres.filter(s => s.statut === 'DECLARE' || s.statut === 'EN_EXPERTISE').length;
  const infractionsEnAttenteCount = infractions.filter(i => i.statut === 'EN_ATTENTE').length;

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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
              Assurances, Sinistres & Infractions
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Polices d'assurance flotte, déclaration des accidents, contrôle d'assurance active et suivi des contraventions
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { resetSinistreForm(); setShowSinistreModal(true); }}
            className="border border-amber-200 bg-amber-50 text-amber-900 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Déclarer Sinistre
          </button>
          
          <button
            onClick={() => { resetPoliceForm(); setShowPoliceModal(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Police
          </button>
        </div>
      </motion.div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Polices Actives</span>
            <span className="text-xl font-black text-[#0A1E3F] mt-1 block">{policesActivesCount} / {polices.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Échéance J-30</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{policesJ30Count} Polices</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Sinistres en Cours</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">{sinistresEnCoursCount} Dossiers</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">PV / Infractions</span>
            <span className="text-xl font-black text-blue-900 mt-1 block">{infractionsEnAttenteCount} Non payées</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
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
            onClick={() => setActiveTab('polices')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'polices' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Polices d'Assurance ({polices.length})
          </button>

          <button
            onClick={() => setActiveTab('sinistres')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sinistres' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Sinistres & Accidents ({sinistres.length})
          </button>

          <button
            onClick={() => setActiveTab('infractions')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'infractions' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Infractions & Amendes ({infractions.length})
          </button>
        </div>

        {activeTab === 'infractions' && (
          <button
            onClick={() => { resetInfractionForm(); setShowInfractionModal(true); }}
            className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle Infraction
          </button>
        )}
      </motion.div>

      {/* Search Bar Toolbar */}
      <motion.div 
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher immatriculation, police, compagnie, lieu..."
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

        {activeTab === 'polices' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIREE">Expirée</option>
              <option value="SUSPENDUE">Suspendue</option>
            </select>
          </div>
        )}

        <div className="text-xs font-bold text-slate-500">
          Affichage de <span className="text-[#0A1E3F] font-extrabold">
            {activeTab === 'polices' ? filteredPolices.length : activeTab === 'sinistres' ? filteredSinistres.length : filteredInfractions.length}
          </span> élément(s)
        </div>
      </motion.div>

      {/* Tab 1: Polices d'Assurance */}
      {activeTab === 'polices' && (
        <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>N° Police & Compagnie</th>
                  <th>Type Garantie</th>
                  <th>Période Contrat</th>
                  <th>Prime & Franchise</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucune police d'assurance trouvée.</span>
                    </td>
                  </tr>
                ) : (
                  filteredPolices.map((p) => {
                    const diffDays = p.dateFin ? Math.ceil((new Date(p.dateFin) - new Date()) / (1000 * 3600 * 24)) : 999;
                    const isExpiringSoon = diffDays > 0 && diffDays <= 30;
                    return (
                      <tr key={p.id}>
                        <td>
                          <MoroccanPlate immatriculation={p.immatriculation} />
                          <div className="text-[11px] text-slate-500 mt-1 font-medium">{p.marqueModele}</div>
                        </td>

                        <td>
                          <div className="font-extrabold text-[#0A1E3F]">{p.numeroPolice}</div>
                          <div className="text-[10px] uppercase font-bold text-[#C59B27] mt-0.5">{p.compagnie}</div>
                        </td>

                        <td>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                            {p.typeGarantie ? p.typeGarantie.replace('_', ' ') : 'TOUS RISQUES'}
                          </span>
                        </td>

                        <td>
                          <div className="text-xs font-semibold text-slate-700">
                            {p.dateDebut ? new Date(p.dateDebut).toLocaleDateString('fr-FR') : '-'} ➔ {p.dateFin ? new Date(p.dateFin).toLocaleDateString('fr-FR') : '-'}
                          </div>
                          {isExpiringSoon && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md mt-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Échéance J-{diffDays}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="font-extrabold text-[#0A1E3F]">
                            {p.montantPrime ? p.montantPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                          </div>
                          {p.franchise && (
                            <div className="text-[10px] text-slate-400 font-medium">Franchise: {p.franchise} MAD</div>
                          )}
                        </td>

                        <td>
                          {p.statut === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                            </span>
                          ) : p.statut === 'EXPIREE' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3 h-3 text-rose-600" /> EXPIREE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                              {p.statut}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedItemDetail({ item: p, type: 'police' })}
                              className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                              title="Voir les détails de la police"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setPoliceForm(p); setShowPoliceModal(true); }}
                              className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                              title="Modifier la police"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, item: p, type: 'police', loading: false })}
                              className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer"
                              title="Supprimer la police"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Tab 2: Sinistres */}
      {activeTab === 'sinistres' && (
        <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Date & Lieu Accident</th>
                  <th>Nature & Dommages</th>
                  <th>Conducteur</th>
                  <th>Statut Dossier</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSinistres.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucun sinistre déclaré.</span>
                    </td>
                  </tr>
                ) : (
                  filteredSinistres.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <MoroccanPlate immatriculation={s.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{s.marqueModele}</div>
                      </td>

                      <td>
                        <div className="font-bold text-[#0A1E3F]">
                          {s.dateAccident ? new Date(s.dateAccident).toLocaleDateString('fr-FR') : '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C59B27]" /> {s.lieuAccident || 'Non spécifié'}
                        </div>
                      </td>

                      <td>
                        <span className="font-extrabold text-[#0A1E3F] block">{s.natureAccident}</span>
                        <span className="text-xs font-black text-rose-700">
                          {s.montantDommages ? s.montantDommages.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </td>

                      <td>
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {s.conducteurNom || 'Conducteur non assigné'}
                        </div>
                      </td>

                      <td>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                          s.statut === 'DECLARE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          s.statut === 'EN_EXPERTISE' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.statut}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail({ item: s, type: 'sinistre' })}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Détails du sinistre"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSinistreForm(s); setShowSinistreModal(true); }}
                            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Modifier le sinistre"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: s, type: 'sinistre', loading: false })}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer dossier"
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

      {/* Tab 3: Infractions */}
      {activeTab === 'infractions' && (
        <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Date & Lieu Contravention</th>
                  <th>Type & Référence</th>
                  <th>Montant Amende</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInfractions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucune infraction enregistrée.</span>
                    </td>
                  </tr>
                ) : (
                  filteredInfractions.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <MoroccanPlate immatriculation={i.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{i.marqueModele}</div>
                      </td>

                      <td>
                        <div className="font-bold text-[#0A1E3F]">
                          {i.dateInfraction ? new Date(i.dateInfraction).toLocaleDateString('fr-FR') : '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C59B27]" /> {i.lieuInfraction || 'Non renseigné'}
                        </div>
                      </td>

                      <td>
                        <div className="font-extrabold text-[#0A1E3F]">{i.typeInfraction || 'Radar fixe'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Ref: {i.referenceContravention || 'N/A'}</div>
                      </td>

                      <td className="font-extrabold text-rose-700">
                        {i.montantAmende ? i.montantAmende.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                      </td>

                      <td>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                          i.statut === 'PAYEE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          i.statut === 'CONTESTEE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {i.statut}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail({ item: i, type: 'infraction' })}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Détails de l'infraction"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setInfractionForm(i); setShowInfractionModal(true); }}
                            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Modifier l'infraction"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: i, type: 'infraction', loading: false })}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer infraction"
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

      {/* Modal Police */}
      <AnimatePresence>
        {showPoliceModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {policeForm.id ? 'Modifier Police d\'Assurance' : 'Nouvelle Police d\'Assurance'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Gestion de la couverture et des garanties</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPoliceModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePoliceSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule concerné *</label>
                      <select
                        required
                        value={policeForm.vehiculeId}
                        onChange={(e) => setPoliceForm({ ...policeForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.immatriculation} - {v.marque} {v.modele}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">N° Police d'assurance *</label>
                        <button
                          type="button"
                          onClick={() => setPoliceForm(prev => ({ ...prev, numeroPolice: generateAutoNumeroPolice(prev.compagnie) }))}
                          className="text-[10px] font-bold text-[#C59B27] hover:text-[#0A1E3F] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Générer un numéro de police automatique"
                        >
                          <RefreshCw className="w-3 h-3" /> Générer auto
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="POL-AXA-2026-XXXX"
                        value={policeForm.numeroPolice}
                        onChange={(e) => setPoliceForm({ ...policeForm, numeroPolice: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Compagnie d'assurance</label>
                      <select
                        value={policeForm.compagnie}
                        onChange={(e) => {
                          const newCompagnie = e.target.value;
                          setPoliceForm(prev => ({
                            ...prev,
                            compagnie: newCompagnie,
                            numeroPolice: !prev.id ? generateAutoNumeroPolice(newCompagnie) : prev.numeroPolice
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        {COMPAGNIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de Garantie</label>
                      <select
                        value={policeForm.typeGarantie}
                        onChange={(e) => setPoliceForm({ ...policeForm, typeGarantie: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        {GARANTIES.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date Début *</label>
                      <input
                        type="date"
                        required
                        value={policeForm.dateDebut}
                        onChange={(e) => setPoliceForm({ ...policeForm, dateDebut: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date Fin (Expiration) *</label>
                      <input
                        type="date"
                        required
                        value={policeForm.dateFin}
                        onChange={(e) => setPoliceForm({ ...policeForm, dateFin: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Prime (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="8500.00"
                        value={policeForm.montantPrime}
                        onChange={(e) => setPoliceForm({ ...policeForm, montantPrime: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Franchise (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1500.00"
                        value={policeForm.franchise}
                        onChange={(e) => setPoliceForm({ ...policeForm, franchise: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut de la police</label>
                      <select value={policeForm.statut} onChange={(e) => setPoliceForm({ ...policeForm, statut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        <option value="ACTIVE">Active</option><option value="EXPIREE">Expirée</option><option value="SUSPENDUE">Suspendue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence des documents</label>
                      <input type="text" placeholder="ex: DOC-POL-2026" value={policeForm.documents || ''} onChange={(e) => setPoliceForm({ ...policeForm, documents: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations</label>
                    <textarea rows="2" placeholder="Remarques éventuelles sur la police..." value={policeForm.observations || ''} onChange={(e) => setPoliceForm({ ...policeForm, observations: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowPoliceModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Sinistre */}
      <AnimatePresence>
        {showSinistreModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {sinistreForm.id ? 'Modifier le Sinistre' : 'Déclarer un Sinistre'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Déclaration immédiate & mise à jour du statut véhicule</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowSinistreModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSinistreSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  {!sinistreForm.id && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>📌 <strong>Information :</strong> La déclaration de sinistre fera basculer automatiquement le statut du véhicule à <strong>ACCIDENTÉ</strong>.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule accidenté *</label>
                      <select
                        required
                        value={sinistreForm.vehiculeId}
                        onChange={(e) => setSinistreForm({ ...sinistreForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de l'accident *</label>
                      <input
                        type="date"
                        required
                        value={sinistreForm.dateAccident}
                        onChange={(e) => setSinistreForm({ ...sinistreForm, dateAccident: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut du dossier</label>
                      <select value={sinistreForm.statut || 'DECLARE'} onChange={(e) => setSinistreForm({ ...sinistreForm, statut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        <option value="DECLARE">Déclaré</option><option value="EN_EXPERTISE">En expertise</option><option value="INDEMNISE">Indemnisé</option><option value="CLOS">Clos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence expertise</label>
                      <input type="text" placeholder="ex: EXP-2026-009" value={sinistreForm.referenceExpertise || ''} onChange={(e) => setSinistreForm({ ...sinistreForm, referenceExpertise: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Description des circonstances</label>
                    <textarea
                      rows="3"
                      placeholder="Précisez les circonstances de l'accident..."
                      value={sinistreForm.description}
                      onChange={(e) => setSinistreForm({ ...sinistreForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowSinistreModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{sinistreForm.id ? 'Enregistrer les modifications' : 'Déclarer le Sinistre'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Infraction */}
      <AnimatePresence>
        {showInfractionModal && (
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
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {infractionForm.id ? 'Modifier l\'Infraction' : 'Enregistrer une Infraction'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Suivi des contraventions et amendes du parc</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowInfractionModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInfractionSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule *</label>
                      <select
                        required
                        value={infractionForm.vehiculeId}
                        onChange={(e) => setInfractionForm({ ...infractionForm, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date d'infraction *</label>
                      <input
                        type="date"
                        required
                        value={infractionForm.dateInfraction}
                        onChange={(e) => setInfractionForm({ ...infractionForm, dateInfraction: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Type d'infraction</label>
                      <input
                        type="text"
                        placeholder="Ex: Excès de vitesse (radar fixe)"
                        value={infractionForm.typeInfraction}
                        onChange={(e) => setInfractionForm({ ...infractionForm, typeInfraction: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Amende (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="300.00"
                        value={infractionForm.montantAmende}
                        onChange={(e) => setInfractionForm({ ...infractionForm, montantAmende: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Lieu de l'infraction</label>
                      <input type="text" placeholder="ex: Rocade Rabat-Salé" value={infractionForm.lieuInfraction || ''} onChange={(e) => setInfractionForm({ ...infractionForm, lieuInfraction: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Conducteur</label>
                      <select value={infractionForm.conducteurId || ''} onChange={(e) => setInfractionForm({ ...infractionForm, conducteurId: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        <option value="">Non renseigné</option>{conducteurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut</label>
                      <select value={infractionForm.statut} onChange={(e) => setInfractionForm({ ...infractionForm, statut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium">
                        <option value="EN_ATTENTE">En attente</option><option value="PAYEE">Payée</option><option value="CONTESTEE">Contestée</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence contravention</label>
                      <input type="text" placeholder="ex: CONTR-2026-883" value={infractionForm.referenceContravention || ''} onChange={(e) => setInfractionForm({ ...infractionForm, referenceContravention: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations</label>
                    <textarea rows="2" placeholder="Remarques sur la contravention..." value={infractionForm.observations || ''} onChange={(e) => setInfractionForm({ ...infractionForm, observations: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]" />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowInfractionModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{infractionForm.id ? 'Enregistrer les modifications' : 'Enregistrer'}</span>
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
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                      {selectedItemDetail.type === 'police' && 'Fiche Police d\'Assurance'}
                      {selectedItemDetail.type === 'sinistre' && 'Fiche Sinistre Déclaré'}
                      {selectedItemDetail.type === 'infraction' && 'Fiche Infraction Routière'}
                    </h3>
                    <p className="text-[11px] text-[#C59B27] font-mono">
                      {selectedItemDetail.type === 'police' && (selectedItemDetail.item.numeroPolice || 'N/A')}
                      {selectedItemDetail.type === 'sinistre' && `Accident du ${selectedItemDetail.item.dateAccident || '-'}`}
                      {selectedItemDetail.type === 'infraction' && (selectedItemDetail.item.referenceContravention || 'Radar Fixe')}
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

                {selectedItemDetail.type === 'police' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">N° Police</span>
                        <span className="font-mono font-extrabold text-[#0A1E3F] text-xs">{selectedItemDetail.item.numeroPolice}</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Compagnie</span>
                        <span className="font-extrabold text-[#C59B27] text-xs uppercase">{selectedItemDetail.item.compagnie}</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type Garantie</span>
                        <span className="font-extrabold text-blue-800 text-xs">{selectedItemDetail.item.typeGarantie?.replace('_', ' ')}</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Statut Contrat</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          selectedItemDetail.item.statut === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedItemDetail.item.statut}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Période Validité</span>
                        <span className="font-semibold text-slate-700 text-xs">
                          {selectedItemDetail.item.dateDebut ? new Date(selectedItemDetail.item.dateDebut).toLocaleDateString('fr-FR') : '-'}
                          {' ➔ '}
                          {selectedItemDetail.item.dateFin ? new Date(selectedItemDetail.item.dateFin).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Prime</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.montantPrime ? selectedItemDetail.item.montantPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Franchise</span>
                        <span className="font-extrabold text-slate-700 text-xs">
                          {selectedItemDetail.item.franchise ? `${selectedItemDetail.item.franchise} MAD` : 'Aucune'}
                        </span>
                      </div>
                    </div>

                    {selectedItemDetail.item.observations && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Observations / Remarques :</span>
                        <p className="text-slate-600 font-medium">{selectedItemDetail.item.observations}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedItemDetail.type === 'sinistre' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date Accident</span>
                        <span className="font-bold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.dateAccident ? new Date(selectedItemDetail.item.dateAccident).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lieu Accident</span>
                        <span className="font-bold text-slate-700 text-xs">{selectedItemDetail.item.lieuAccident || 'Non spécifié'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nature Accident</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">{selectedItemDetail.item.natureAccident}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Dommages</span>
                        <span className="font-extrabold text-rose-700 text-xs">
                          {selectedItemDetail.item.montantDommages ? selectedItemDetail.item.montantDommages.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Conducteur</span>
                        <span className="font-bold text-slate-800 text-xs">{selectedItemDetail.item.conducteurNom || 'Non assigné'}</span>
                      </div>
                    </div>

                    {selectedItemDetail.item.description && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Description des Circonstances :</span>
                        <p className="text-slate-600 font-medium">{selectedItemDetail.item.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedItemDetail.type === 'infraction' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date Infraction</span>
                        <span className="font-bold text-[#0A1E3F] text-xs">
                          {selectedItemDetail.item.dateInfraction ? new Date(selectedItemDetail.item.dateInfraction).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lieu Infraction</span>
                        <span className="font-bold text-slate-700 text-xs">{selectedItemDetail.item.lieuInfraction || 'Non renseigné'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type Infraction</span>
                        <span className="font-extrabold text-[#0A1E3F] text-xs">{selectedItemDetail.item.typeInfraction || 'Radar Fixe'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Amende</span>
                        <span className="font-extrabold text-rose-700 text-xs">
                          {selectedItemDetail.item.montantAmende ? selectedItemDetail.item.montantAmende.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                {['police', 'sinistre', 'infraction'].includes(selectedItemDetail.type) && (
                  <button
                    onClick={() => {
                      const itemToEdit = selectedItemDetail.item;
                      const type = selectedItemDetail.type;
                      setSelectedItemDetail(null);
                      if (type === 'police') { setPoliceForm(itemToEdit); setShowPoliceModal(true); }
                      else if (type === 'sinistre') { setSinistreForm(itemToEdit); setShowSinistreModal(true); }
                      else { setInfractionForm(itemToEdit); setShowInfractionModal(true); }
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
