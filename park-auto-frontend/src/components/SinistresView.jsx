import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, AlertOctagon, Plus, Search, Filter, RefreshCw, 
  Trash2, Edit, Calendar, MapPin, User, Car, FileText, CheckCircle2, Clock, 
  DollarSign, ArrowRight, X, AlertCircle, Building2, CheckCircle, Eye, Layers, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sinistreService } from '../services/sinistreService';
import { vehiculeService } from '../services/vehiculeService';
import { assuranceService } from '../services/assuranceService';
import { garageService } from '../services/garageService';
import api from '../services/api';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

const STATUTS_SINISTRE = [
  { key: 'DECLARE', label: '1. Déclaré', desc: 'Dossier ouvert, constat déposé' },
  { key: 'TRANSMIS', label: '2. Transmis Assurance', desc: 'Dossier transmis à la compagnie' },
  { key: 'EN_COURS_D_EXPERTISE', label: '3. En Expertise', desc: 'Expert mandaté sur le véhicule' },
  { key: 'INDEMNISE', label: '4. Indemnisé', desc: 'Remboursement versé par l\'assureur' },
  { key: 'CLOTURE', label: '5. Clôturé & Homologué', desc: 'Véhicule remis à DISPONIBLE' }
];

export default function SinistresView() {
  const [activeTab, setActiveTab] = useState('liste'); // 'liste' | 'declarer'
  const [sinistres, setSinistres] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [conducteurs, setConducteurs] = useState([]);
  const [assurances, setAssurances] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [natureFilter, setNatureFilter] = useState('ALL');
  const [vehiculeFilter, setVehiculeFilter] = useState('ALL');

  // Modals
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedSinistreForWorkflow, setSelectedSinistreForWorkflow] = useState(null);
  const [selectedSinistreDetail, setSelectedSinistreDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, loading: false });

  // Declaration / Edit Form
  const [form, setForm] = useState({
    id: null,
    vehiculeId: '',
    conducteurId: '',
    assuranceId: '',
    garageAgreeId: '',
    dateAccident: new Date().toISOString().split('T')[0],
    lieuAccident: '',
    description: '',
    tiersImpliques: '',
    natureAccident: 'COLLISION',
    montantDommages: '6500',
    montantFranchise: '1500',
    montantRembourse: '5000',
    statut: 'DECLARE',
    referenceExpertise: '',
    numeroConstat: '',
    refPvPolice: '',
    remorquageRequis: false,
    perteTotale: false,
    observations: ''
  });

  // Workflow update Form
  const [workflowForm, setWorkflowForm] = useState({
    statut: 'TRANSMIS',
    perteTotale: false,
    referenceExpertise: '',
    montantDommages: '',
    montantFranchise: '',
    montantRembourse: '',
    observations: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let loadErrors = [];
      const [sData, vData, cData, aData, gData] = await Promise.all([
        sinistreService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        vehiculeService.getVehicules().catch((e) => { loadErrors.push(e); return []; }),
        api.get('/conducteurs').catch((e) => { loadErrors.push(e); return []; }),
        assuranceService.getAll().catch((e) => { loadErrors.push(e); return []; }),
        garageService.getActifs().catch((e) => { loadErrors.push(e); return []; })
      ]);
      if (loadErrors.length > 0) toast.error(`Certaines données n'ont pas pu être chargées (${loadErrors.length} erreur(s)).`);
      const sList = Array.isArray(sData) ? sData : (sData?.data || sData?.content || []);
      setSinistres(Array.isArray(sList) ? sList : []);
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
      const cList = cData?.data || cData;
      setConducteurs(Array.isArray(cList) ? cList : (cList?.content || []));
      const aList = Array.isArray(aData) ? aData : (aData?.data || aData?.content || []);
      setAssurances(Array.isArray(aList) ? aList : []);
      const gList = Array.isArray(gData) ? gData : (gData?.data || []);
      setGarages(Array.isArray(gList) ? gList : []);
    } catch (err) {
      console.error('Erreur chargement sinistres:', err);
      toast.error('Erreur lors du chargement des sinistres');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicule = (vId) => {
    const vAssur = assurances.find(a => a.vehiculeId === Number(vId) && a.statut === 'ACTIVE');
    setForm(prev => ({
      ...prev,
      vehiculeId: vId,
      assuranceId: vAssur?.id ? String(vAssur.id) : ''
    }));
  };

  const handleEditSinistre = (sinistre) => {
    setForm({
      id: sinistre.id,
      vehiculeId: sinistre.vehiculeId || '',
      conducteurId: sinistre.conducteurId || '',
      assuranceId: sinistre.assuranceId || '',
      garageAgreeId: sinistre.garageAgreeId || '',
      dateAccident: sinistre.dateAccident ? sinistre.dateAccident.slice(0, 10) : new Date().toISOString().split('T')[0],
      lieuAccident: sinistre.lieuAccident || '',
      description: sinistre.description || '',
      tiersImpliques: sinistre.tiersImpliques || '',
      natureAccident: sinistre.natureAccident || 'COLLISION',
      montantDommages: sinistre.montantDommages != null ? String(sinistre.montantDommages) : '6500',
      montantFranchise: sinistre.montantFranchise != null ? String(sinistre.montantFranchise) : '1500',
      montantRembourse: sinistre.montantRembourse != null ? String(sinistre.montantRembourse) : '5000',
      statut: sinistre.statut || 'DECLARE',
      referenceExpertise: sinistre.referenceExpertise || '',
      numeroConstat: sinistre.numeroConstat || '',
      refPvPolice: sinistre.refPvPolice || '',
      remorquageRequis: Boolean(sinistre.remorquageRequis),
      perteTotale: Boolean(sinistre.perteTotale),
      observations: sinistre.observations || ''
    });
    setActiveTab('declarer');
  };

  const handleDeclarerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.vehiculeId) {
        toast.error('Veuillez sélectionner un véhicule.');
        return;
      }
      const payload = {
        ...form,
        vehiculeId: Number(form.vehiculeId),
        conducteurId: form.conducteurId ? Number(form.conducteurId) : null,
        assuranceId: form.assuranceId ? Number(form.assuranceId) : null,
        garageAgreeId: form.garageAgreeId ? Number(form.garageAgreeId) : null,
        montantDommages: form.montantDommages ? parseFloat(form.montantDommages) : 0,
        montantFranchise: form.montantFranchise ? parseFloat(form.montantFranchise) : 0,
        montantRembourse: form.montantRembourse ? parseFloat(form.montantRembourse) : 0
      };

      if (form.id) {
        await sinistreService.modifier(form.id, payload);
        toast.success('Dossier de sinistre mis à jour avec succès !');
      } else {
        await sinistreService.declarer(payload);
        toast.success('Sinistre déclaré avec succès ! Le véhicule est passé au statut ACCIDENTE.');
      }

      setSearchTerm('');
      setStatutFilter('ALL');
      setNatureFilter('ALL');
      setVehiculeFilter('ALL');
      setForm({
        id: null,
        vehiculeId: '',
        conducteurId: '',
        assuranceId: '',
        garageAgreeId: '',
        dateAccident: new Date().toISOString().split('T')[0],
        lieuAccident: '',
        description: '',
        tiersImpliques: '',
        natureAccident: 'COLLISION',
        montantDommages: '6500',
        montantFranchise: '1500',
        montantRembourse: '5000',
        statut: 'DECLARE',
        referenceExpertise: '',
        numeroConstat: '',
        refPvPolice: '',
        remorquageRequis: false,
        perteTotale: false,
        observations: ''
      });
      setActiveTab('liste');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erreur lors de l’enregistrement du sinistre');
    }
  };

  const openWorkflowModal = (sinistre) => {
    setSelectedSinistreForWorkflow(sinistre);
    setWorkflowForm({
      statut: sinistre.statut === 'DECLARE' ? 'TRANSMIS' : (sinistre.statut === 'TRANSMIS' ? 'EN_COURS_D_EXPERTISE' : (sinistre.statut === 'EN_COURS_D_EXPERTISE' ? 'INDEMNISE' : 'CLOTURE')),
      referenceExpertise: sinistre.referenceExpertise || `EXP-MEF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      montantDommages: sinistre.montantDommages != null ? String(sinistre.montantDommages) : '6500',
      montantFranchise: sinistre.montantFranchise != null ? String(sinistre.montantFranchise) : '1500',
      montantRembourse: sinistre.montantRembourse != null ? String(sinistre.montantRembourse) : '5000',
      perteTotale: Boolean(sinistre.perteTotale),
      observations: sinistre.observations || ''
    });
    setShowWorkflowModal(true);
  };

  const handleWorkflowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSinistreForWorkflow) return;
    try {
      const payload = {
        ...selectedSinistreForWorkflow,
        statut: workflowForm.statut,
        referenceExpertise: workflowForm.referenceExpertise,
        montantDommages: workflowForm.montantDommages ? parseFloat(workflowForm.montantDommages) : 0,
        montantFranchise: workflowForm.montantFranchise ? parseFloat(workflowForm.montantFranchise) : 0,
        montantRembourse: workflowForm.montantRembourse ? parseFloat(workflowForm.montantRembourse) : 0,
        perteTotale: Boolean(workflowForm.perteTotale),
        observations: workflowForm.observations
      };
      await sinistreService.modifier(selectedSinistreForWorkflow.id, payload);
      toast.success(
        workflowForm.statut === 'CLOTURE'
          ? (workflowForm.perteTotale
              ? 'Dossier clôturé en perte totale : une procédure de réforme (RG07) a été ouverte automatiquement pour ce véhicule.'
              : 'Dossier de sinistre clôturé ! Le véhicule est ré-homologué et remis à DISPONIBLE.')
          : 'Statut du sinistre mis à jour !'
      );
      setShowWorkflowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const confirmDeleteSinistre = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await sinistreService.delete(deleteModal.item.id);
      toast.success('Dossier de sinistre supprimé avec succès');
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Filtered Sinistres
  const filteredSinistres = sinistres.filter(s => {
    const matchSearch = (s.immatriculation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.marqueModele || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.lieuAccident || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.tiersImpliques || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.numeroConstat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.referenceExpertise || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === 'ALL' || s.statut === statutFilter;
    const matchNature = natureFilter === 'ALL' || s.natureAccident === natureFilter;
    const matchVehicule = vehiculeFilter === 'ALL' || String(s.vehiculeId) === vehiculeFilter;
    return matchSearch && matchStatut && matchNature && matchVehicule;
  });

  // KPI calculations
  const totalSinistres = sinistres.length;
  const enCours = sinistres.filter(s => s.statut !== 'CLOTURE' && s.statut !== 'CLOS').length;
  const totalDommages = sinistres.reduce((sum, s) => sum + (Number(s.montantDommages) || 0), 0);
  const totalFranchise = sinistres.reduce((sum, s) => sum + (Number(s.montantFranchise) || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-50 rounded-xl text-red-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0A1E3F]">Registre des Sinistres & Workflow d'Assurance</h1>
            <p className="text-xs text-slate-500">Déclaration d'accident, expertise automobile, indemnisation et remise en circulation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={() => {
              setForm({
                id: null,
                vehiculeId: vehicules[0]?.id ? String(vehicules[0].id) : '',
                conducteurId: '',
                assuranceId: '',
                garageAgreeId: '',
                dateAccident: new Date().toISOString().split('T')[0],
                lieuAccident: '',
                description: '',
                tiersImpliques: '',
                natureAccident: 'COLLISION',
                montantDommages: '6500',
                montantFranchise: '1500',
                montantRembourse: '5000',
                statut: 'DECLARE',
                referenceExpertise: '',
                numeroConstat: '',
                refPvPolice: '',
                remorquageRequis: false,
                perteTotale: false,
                observations: ''
              });
              setActiveTab(activeTab === 'liste' ? 'declarer' : 'liste');
            }}
            className="px-4 py-2.5 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {activeTab === 'liste' ? (
              <>
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Déclarer un Sinistre</span>
              </>
            ) : (
              <span>Voir le Tableau des Sinistres</span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-700">{enCours}</div>
            <div className="text-xs font-medium text-slate-500">Sinistres en Cours</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0A1E3F]">{totalDommages.toLocaleString()} DH</div>
            <div className="text-xs font-medium text-slate-500">Montant Global Dommages</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{totalFranchise.toLocaleString()} DH</div>
            <div className="text-xs font-medium text-slate-500">Franchises Restées à Charge</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{totalSinistres - enCours}</div>
            <div className="text-xs font-medium text-slate-500">Dossiers Clôturés & Réglés</div>
          </div>
        </div>
      </div>

      {/* Declaration / Edit Form Tab */}
      {activeTab === 'declarer' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-[#0A1E3F]">
                {form.id ? `Modifier le Dossier de Sinistre #${form.id}` : 'Déclaration Immédiate d’Accident / Sinistre Automobile'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">Passage automatique du véhicule au statut ACCIDENTE</p>
            </div>
          </div>

          <form onSubmit={handleDeclarerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule Accidenté *</label>
                <select
                  required
                  value={form.vehiculeId}
                  onChange={(e) => handleSelectVehicule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Sélectionner un véhicule --</option>
                  {vehicules.map((v) => (
                    <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Conducteur au Moment du Sinistre</label>
                <select
                  value={form.conducteurId}
                  onChange={(e) => setForm({ ...form, conducteurId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Sélectionner le conducteur --</option>
                  {conducteurs.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom} {c.prenom} ({c.matricule})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de l'Accident *</label>
                <input
                  type="date"
                  required
                  value={form.dateAccident}
                  onChange={(e) => setForm({ ...form, dateAccident: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nature de l'Accident</label>
                <select
                  value={form.natureAccident}
                  onChange={(e) => setForm({ ...form, natureAccident: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  <option value="COLLISION">Collision</option>
                  <option value="INCENDIE">Incendie</option>
                  <option value="VOL">Vol</option>
                  <option value="VANDALISME">Vandalisme</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Lieu Précis de l'Accident *</label>
                <input
                  type="text"
                  required
                  value={form.lieuAccident}
                  onChange={(e) => setForm({ ...form, lieuAccident: e.target.value })}
                  placeholder="Ex: Rond-point Bab Rouah, Avenue Hassan II, Rabat"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">N° Constat Amiable</label>
                <input
                  type="text"
                  value={form.numeroConstat}
                  onChange={(e) => setForm({ ...form, numeroConstat: e.target.value })}
                  placeholder="Ex: CONST-2026-0042"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Réf. PV de Police / Gendarmerie</label>
                <input
                  type="text"
                  value={form.refPvPolice}
                  onChange={(e) => setForm({ ...form, refPvPolice: e.target.value })}
                  placeholder="Ex: PV-POL-RABAT-991"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiers Impliqués & Coordonnées</label>
                <input
                  type="text"
                  value={form.tiersImpliques}
                  onChange={(e) => setForm({ ...form, tiersImpliques: e.target.value })}
                  placeholder="Ex: Véhicule tiers immatriculé 12345-B-1, Assureur RMA, Conducteur M. Tazi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description Détaillée des Circonstances</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Circonstances précises de l'accident, choc avant/arrière, dégâts apparents..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Estimation Dommages (DH TTC)</label>
                <input
                  type="number"
                  step="100"
                  value={form.montantDommages}
                  onChange={(e) => setForm({ ...form, montantDommages: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Franchise MEF (DH)</label>
                <input
                  type="number"
                  step="100"
                  value={form.montantFranchise}
                  onChange={(e) => setForm({ ...form, montantFranchise: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                />
              </div>

              <label className="md:col-span-2 flex items-start gap-3 p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.perteTotale)}
                  onChange={(e) => setForm({ ...form, perteTotale: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-rose-600 cursor-pointer"
                />
                <span className="text-xs text-slate-700">
                  <span className="font-extrabold text-rose-800 block">Perte totale présumée (véhicule irréparable)</span>
                  <span className="text-slate-600">Si confirmée à la clôture du dossier, une procédure de réforme (RG07) sera ouverte automatiquement au lieu de remettre le véhicule en service.</span>
                </span>
              </label>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block">Information Importante :</span>
                L'enregistrement de ce dossier passera automatiquement le véhicule au statut <span className="font-bold">ACCIDENTE</span> et interdira toute nouvelle affectation jusqu'à la clôture officielle du dossier d'assurance.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('liste')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{form.id ? 'Mettre à Jour le Dossier' : 'Déclarer le Sinistre & Immobiliser le Véhicule'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* View 2: Sinistres Enterprise Table (Compact & Fully Responsive) */}
      {activeTab === 'liste' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher sinistre, immatriculation, constat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0A1E3F]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0A1E3F] cursor-pointer"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="DECLARE">1. Déclaré</option>
                <option value="TRANSMIS">2. Transmis</option>
                <option value="EN_COURS_D_EXPERTISE">3. En Expertise</option>
                <option value="INDEMNISE">4. Indemnisé</option>
                <option value="CLOTURE">5. Clôturé</option>
              </select>

              <select
                value={natureFilter}
                onChange={(e) => setNatureFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0A1E3F] cursor-pointer"
              >
                <option value="ALL">Toutes Natures</option>
                <option value="COLLISION">Collision</option>
                <option value="INCENDIE">Incendie</option>
                <option value="VOL">Vol</option>
                <option value="VANDALISME">Vandalisme</option>
              </select>

              <select
                value={vehiculeFilter}
                onChange={(e) => setVehiculeFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0A1E3F] cursor-pointer max-w-[160px]"
              >
                <option value="ALL">Tous Véhicules</option>
                {vehicules.map(v => (
                  <option key={v.id} value={String(v.id)}>{v.immatriculation} - {v.marque}</option>
                ))}
              </select>

              <span className="text-[11px] font-extrabold text-[#0A1E3F] bg-[#EBF3FA] border border-blue-100 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                {filteredSinistres.length} sinistres
              </span>
            </div>
          </div>

          {/* Table Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0A1E3F] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#C59B27]" /> Registre des Sinistres & Suivi d'Assurance ({filteredSinistres.length})
              </h3>
            </div>

            <div className="w-full">
              <table className="enterprise-table enterprise-table--compact w-full table-auto">
                <thead>
                  <tr>
                    <th className="w-[18%]">Véhicule</th>
                    <th className="w-[18%]">Date & Nature</th>
                    <th className="w-[20%]">Lieu & Réf. Constat</th>
                    <th className="w-[20%]">Balance Financière (DH)</th>
                    <th className="w-[14%]">Workflow</th>
                    <th className="w-[10%] !text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSinistres.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-500">Aucun dossier de sinistre ne correspond aux critères sélectionnés.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredSinistres.map((s) => {
                      const isClosed = s.statut === 'CLOTURE' || s.statut === 'CLOS';

                      return (
                        <tr key={s.id}>
                          {/* Véhicule */}
                          <td>
                            <div className="font-mono font-bold text-xs text-[#0A1E3F] bg-slate-100 border border-slate-300 px-2 py-0.5 rounded w-max">
                              {s.immatriculation}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5 font-semibold truncate">{s.marqueModele}</div>
                            <div className="text-[9px] text-[#C59B27] font-bold">{s.direction || 'Direction MEF'}</div>
                          </td>

                          {/* Date & Nature */}
                          <td>
                            <div className="font-bold text-[#0A1E3F] text-xs leading-tight flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>{s.natureAccident}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{s.dateAccident ? new Date(s.dateAccident).toLocaleDateString('fr-FR') : '-'}</span>
                            </div>
                          </td>

                          {/* Lieu & Références */}
                          <td className="text-xs text-slate-600">
                            <div className="flex items-center gap-1 font-medium truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{s.lieuAccident || 'Rabat'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              {s.numeroConstat ? `Constat: ${s.numeroConstat}` : `Réf: SIN-${s.id}`}
                            </div>
                          </td>

                          {/* Balance Financière */}
                          <td className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="text-[8px] text-slate-400 block font-sans">Dommages</span>
                                <span className="font-bold text-slate-800">{Number(s.montantDommages || 0).toLocaleString()}</span>
                              </div>
                              <div className="border-l border-slate-200 pl-1.5">
                                <span className="text-[8px] text-amber-700 block font-sans">Franchise</span>
                                <span className="font-bold text-amber-700">{Number(s.montantFranchise || 0).toLocaleString()}</span>
                              </div>
                              <div className="border-l border-slate-200 pl-1.5">
                                <span className="text-[8px] text-emerald-700 block font-sans">Remboursé</span>
                                <span className="font-bold text-emerald-700">{Number(s.montantRembourse || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </td>

                          {/* Workflow Status */}
                          <td>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              isClosed 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {s.statut}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <div className={`w-1.5 h-1.5 rounded-full ${s.statut !== 'DECLARE' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <div className={`w-1.5 h-1.5 rounded-full ${s.statut === 'EN_COURS_D_EXPERTISE' || s.statut === 'INDEMNISE' || isClosed ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <div className={`w-1.5 h-1.5 rounded-full ${s.statut === 'INDEMNISE' || isClosed ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="!text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openWorkflowModal(s)}
                                className="p-1.5 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-lg transition-all cursor-pointer"
                                title="Avancer le workflow d'assurance"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                              </button>

                              <button
                                onClick={() => setSelectedSinistreDetail(s)}
                                className="p-1.5 text-slate-400 hover:text-[#C59B27] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Voir les détails complets"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleEditSinistre(s)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Modifier le dossier"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeleteModal({ isOpen: true, item: s, loading: false })}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer le dossier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* RICH DETAIL MODAL : FICHE COMPLETE DE SINISTRE & ASSURANCE */}
      <AnimatePresence>
        {selectedSinistreDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[650px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="bg-[#0A1E3F] text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#C59B27] text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Dossier Sinistre #{selectedSinistreDetail.id}
                  </div>
                  <h2 className="text-lg font-black font-outfit mt-1 text-white">
                    {selectedSinistreDetail.natureAccident} — {selectedSinistreDetail.immatriculation}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSinistreDetail(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Workflow Stepper */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cycle d'Instruction du Sinistre</div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span className="text-emerald-700">1. Déclaré</span>
                    <span className={selectedSinistreDetail.statut !== 'DECLARE' ? 'text-emerald-700' : 'text-slate-400'}>2. Transmis</span>
                    <span className={selectedSinistreDetail.statut === 'EN_COURS_D_EXPERTISE' || selectedSinistreDetail.statut === 'INDEMNISE' || selectedSinistreDetail.statut === 'CLOTURE' ? 'text-emerald-700' : 'text-slate-400'}>3. Expertise</span>
                    <span className={selectedSinistreDetail.statut === 'INDEMNISE' || selectedSinistreDetail.statut === 'CLOTURE' ? 'text-emerald-700' : 'text-slate-400'}>4. Indemnisé</span>
                    <span className={selectedSinistreDetail.statut === 'CLOTURE' ? 'text-emerald-700' : 'text-slate-400'}>5. Clôturé</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    <div className="h-2 rounded-full bg-emerald-500" />
                    <div className={`h-2 rounded-full ${selectedSinistreDetail.statut !== 'DECLARE' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className={`h-2 rounded-full ${selectedSinistreDetail.statut === 'EN_COURS_D_EXPERTISE' || selectedSinistreDetail.statut === 'INDEMNISE' || selectedSinistreDetail.statut === 'CLOTURE' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className={`h-2 rounded-full ${selectedSinistreDetail.statut === 'INDEMNISE' || selectedSinistreDetail.statut === 'CLOTURE' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className={`h-2 rounded-full ${selectedSinistreDetail.statut === 'CLOTURE' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                </div>

                {/* Véhicule Block */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Véhicule Impliqué</div>
                  <div className="flex items-center justify-between">
                    <MoroccanPlate plate={selectedSinistreDetail.immatriculation} />
                    <div className="text-right">
                      <div className="font-bold text-[#0A1E3F] text-sm">{selectedSinistreDetail.marqueModele}</div>
                      <div className="text-[11px] font-bold text-[#C59B27]">{selectedSinistreDetail.direction || 'Direction MEF'}</div>
                    </div>
                  </div>
                </div>

                {/* Grid Informations Sinistre */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Date de l'Accident</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedSinistreDetail.dateAccident ? new Date(selectedSinistreDetail.dateAccident).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Lieu du Sinistre</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedSinistreDetail.lieuAccident || '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">N° Constat Amiable</span>
                    <span className="font-mono font-bold text-slate-800 text-xs block mt-1">
                      {selectedSinistreDetail.numeroConstat || 'Non renseigné'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Réf. PV Police / Gendarmerie</span>
                    <span className="font-mono font-bold text-slate-800 text-xs block mt-1">
                      {selectedSinistreDetail.refPvPolice || 'Non renseigné'}
                    </span>
                  </div>
                </div>

                {/* Tiers impliqués */}
                {selectedSinistreDetail.tiersImpliques && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Tiers Impliqués & Assurances</span>
                    <p className="text-slate-700 text-xs font-medium leading-relaxed">{selectedSinistreDetail.tiersImpliques}</p>
                  </div>
                )}

                {/* Description */}
                {selectedSinistreDetail.description && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Description des Circonstances</span>
                    <p className="text-slate-700 text-xs font-medium leading-relaxed italic">"{selectedSinistreDetail.description}"</p>
                  </div>
                )}

                {/* Expertise & Notes */}
                {selectedSinistreDetail.referenceExpertise && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-blue-700 font-bold text-[10px] block uppercase">Rapport d'Expertise Automobile</span>
                    <p className="text-blue-900 text-xs font-mono font-bold">Réf: {selectedSinistreDetail.referenceExpertise}</p>
                    {selectedSinistreDetail.observations && (
                      <p className="text-slate-700 text-xs mt-1">{selectedSinistreDetail.observations}</p>
                    )}
                  </div>
                )}

                {/* Matrice Financière */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Décomposition Financière de la Prise en Charge</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Dommages Estimés</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{Number(selectedSinistreDetail.montantDommages || 0).toLocaleString()} DH</span>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-800 block text-[10px]">Franchise MEF</span>
                      <span className="font-mono font-bold text-amber-800 text-sm">{Number(selectedSinistreDetail.montantFranchise || 0).toLocaleString()} DH</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-emerald-800 block text-[10px]">Remboursé Assureur</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">{Number(selectedSinistreDetail.montantRembourse || 0).toLocaleString()} DH</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => setSelectedSinistreDetail(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fermer
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const itemToWorkflow = selectedSinistreDetail;
                      setSelectedSinistreDetail(null);
                      openWorkflowModal(itemToWorkflow);
                    }}
                    className="px-4 py-2 bg-[#0A1E3F] hover:bg-[#122B55] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Avancer Workflow</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </button>

                  <button
                    onClick={() => {
                      const itemToEdit = selectedSinistreDetail;
                      setSelectedSinistreDetail(null);
                      handleEditSinistre(itemToEdit);
                    }}
                    className="gold-gradient-bg text-[#0A1E3F] font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" /> Modifier le Dossier
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workflow Progression & Closure Modal */}
      <AnimatePresence>
        {showWorkflowModal && selectedSinistreForWorkflow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200/80 max-h-[90vh] flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      Progression Dossier Assurance & Sinistre
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Expertise, montant d'indemnisation et clôture</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowWorkflowModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleWorkflowSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut du Dossier d'Assurance *</label>
                    <select
                      value={workflowForm.statut}
                      onChange={(e) => setWorkflowForm({ ...workflowForm, statut: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-bold"
                    >
                      <option value="DECLARE">1. Déclaré</option>
                      <option value="TRANSMIS">2. Transmis Compagnie Assurance</option>
                      <option value="EN_COURS_D_EXPERTISE">3. En Cours d'Expertise Automobile</option>
                      <option value="INDEMNISE">4. Indemnisé par l'Assureur</option>
                      <option value="CLOTURE">5. Clôturé & Véhicule Homologué (Remise à DISPONIBLE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence du Rapport d'Expertise</label>
                    <input
                      type="text"
                      value={workflowForm.referenceExpertise}
                      onChange={(e) => setWorkflowForm({ ...workflowForm, referenceExpertise: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all font-mono"
                      placeholder="ex: EXP-RMA-2026-904"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Dommages (DH)</label>
                      <input
                        type="number"
                        step="100"
                        value={workflowForm.montantDommages}
                        onChange={(e) => setWorkflowForm({ ...workflowForm, montantDommages: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Franchise MEF (DH)</label>
                      <input
                        type="number"
                        step="100"
                        value={workflowForm.montantFranchise}
                        onChange={(e) => setWorkflowForm({ ...workflowForm, montantFranchise: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Remboursement (DH)</label>
                      <input
                        type="number"
                        step="100"
                        value={workflowForm.montantRembourse}
                        onChange={(e) => setWorkflowForm({ ...workflowForm, montantRembourse: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations / Avis d'Expert</label>
                    <textarea
                      rows="2"
                      value={workflowForm.observations}
                      onChange={(e) => setWorkflowForm({ ...workflowForm, observations: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      placeholder="Remarques éventuelles sur la prise en charge..."
                    />
                  </div>

                  <label className="flex items-start gap-3 p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(workflowForm.perteTotale)}
                      onChange={(e) => setWorkflowForm({ ...workflowForm, perteTotale: e.target.checked })}
                      className="mt-0.5 w-4 h-4 accent-rose-600 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700">
                      <span className="font-extrabold text-rose-800 block">Véhicule déclaré en perte totale par l'expert</span>
                      <span className="text-slate-600">À la clôture, le véhicule ne sera pas remis en service : une procédure de réforme (RG07) sera ouverte automatiquement et rattachée à ce sinistre.</span>
                    </span>
                  </label>

                  {workflowForm.statut === 'CLOTURE' && !workflowForm.perteTotale && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        La clôture remettra automatiquement le véhicule au statut <strong className="text-emerald-800">DISPONIBLE</strong> et imputera la franchise sur le budget de la Direction.
                      </span>
                    </div>
                  )}
                  {workflowForm.statut === 'CLOTURE' && workflowForm.perteTotale && (
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        Perte totale : à la clôture, le véhicule passera au statut <strong>EN COURS DE RÉFORME</strong> et un dossier de réforme sera créé dans l'onglet « Réforme &amp; Déclassement » (PV Commission et PV Domaines à joindre).
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowWorkflowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mettre à Jour le Dossier</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM MODAL FOR DELETE */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Supprimer le Dossier de Sinistre"
        message={`Voulez-vous vraiment supprimer le dossier de sinistre "${deleteModal.item?.natureAccident}" enregistré pour le véhicule ${deleteModal.item?.immatriculation} ?`}
        onConfirm={confirmDeleteSinistre}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, loading: false })}
        loading={deleteModal.loading}
      />
    </div>
  );
}
