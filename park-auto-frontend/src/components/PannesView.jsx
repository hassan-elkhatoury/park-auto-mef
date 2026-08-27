import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Wrench, Truck, CheckCircle2, Clock, Plus, Search, Filter, 
  RefreshCw, X, DollarSign, Calendar, MapPin, User, Car, ShieldAlert, FileText, 
  CheckCircle, AlertCircle, Building2, Eye, Edit, Trash2, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { panneService } from '../services/panneService';
import { vehiculeService } from '../services/vehiculeService';
import { garageService } from '../services/garageService';
import api from '../services/api';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

const URGENCES = [
  { value: 'CRITIQUE', label: 'Critique (Immobilisant Immédiat)', short: 'Critique', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'ELEVEE', label: 'Élevée (Intervention Urgente)', short: 'Élevée', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'MOYENNE', label: 'Moyenne (Panne Standard)', short: 'Moyenne', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'FAIBLE', label: 'Faible (Anomalie Mineure)', short: 'Faible', color: 'bg-blue-100 text-blue-800 border-blue-200' }
];

export default function PannesView() {
  const [activeTab, setActiveTab] = useState('liste'); // 'liste' | 'declarer'
  const [pannes, setPannes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [conducteurs, setConducteurs] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [urgenceFilter, setUrgenceFilter] = useState('ALL');
  const [vehiculeFilter, setVehiculeFilter] = useState('ALL');

  // Modals
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [selectedPanneForCloture, setSelectedPanneForCloture] = useState(null);
  const [selectedPanneDetail, setSelectedPanneDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, loading: false });

  // Declaration / Edit Form
  const [form, setForm] = useState({
    id: null,
    vehiculeId: '',
    conducteurId: '',
    garageAgreeId: '',
    dateDeclaration: new Date().toISOString().slice(0, 16),
    lieuPanne: '',
    kilometragePanne: '',
    naturePanne: '',
    descriptionSymptomes: '',
    degreUrgence: 'MOYENNE',
    immobilisante: true,
    remorquageRequis: false,
    societeRemorquage: 'SOS Remorquage Rabat Assistance',
    diagnosticAtelier: '',
    dureeImmobilisationJours: 2,
    coutEstimeDevis: '1500',
    statut: 'DECLAREE',
    observations: ''
  });

  // Cloture Form
  const [clotureForm, setClotureForm] = useState({
    kilometrageReel: '',
    coutReelReparation: '',
    dateReparation: new Date().toISOString().slice(0, 16),
    referenceBonSortie: '',
    referenceFacture: '',
    garantieAccordee: 'Garantie 6 mois pièces et main d\'œuvre',
    observations: '',
    pieces: []
  });

  const [newPiece, setNewPiece] = useState({
    referencePiece: '',
    designation: '',
    categorie: 'Mécanique',
    quantite: 1,
    prixUnitaire: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, vData, cData, gData] = await Promise.all([
        panneService.getAll().catch(() => []),
        vehiculeService.getVehicules().catch(() => []),
        api.get('/conducteurs').catch(() => []),
        garageService.getActifs().catch(() => [])
      ]);
      const pList = Array.isArray(pData) ? pData : (pData?.data || pData?.content || []);
      setPannes(Array.isArray(pList) ? pList : []);
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
      const cList = cData?.data || cData;
      setConducteurs(Array.isArray(cList) ? cList : (cList?.content || []));
      const gList = Array.isArray(gData) ? gData : (gData?.data || []);
      setGarages(Array.isArray(gList) ? gList : []);
    } catch (err) {
      console.error('Erreur chargement pannes:', err);
      toast.error('Erreur lors du chargement des pannes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicule = (vId) => {
    const v = vehicules.find(item => String(item.id) === String(vId));
    setForm(prev => ({
      ...prev,
      vehiculeId: vId,
      kilometragePanne: v?.kilometrageActuel != null ? String(v.kilometrageActuel) : ''
    }));
  };

  const handleEditPanne = (panne) => {
    setForm({
      id: panne.id,
      vehiculeId: panne.vehiculeId || '',
      conducteurId: panne.conducteurId || '',
      garageAgreeId: panne.garageAgreeId || '',
      dateDeclaration: panne.dateDeclaration ? panne.dateDeclaration.slice(0, 16) : new Date().toISOString().slice(0, 16),
      lieuPanne: panne.lieuPanne || '',
      kilometragePanne: panne.kilometragePanne ? String(panne.kilometragePanne) : '',
      naturePanne: panne.naturePanne || '',
      descriptionSymptomes: panne.descriptionSymptomes || '',
      degreUrgence: panne.degreUrgence || 'MOYENNE',
      immobilisante: Boolean(panne.immobilisante),
      remorquageRequis: Boolean(panne.remorquageRequis),
      societeRemorquage: panne.societeRemorquage || 'SOS Remorquage Rabat Assistance',
      diagnosticAtelier: panne.diagnosticAtelier || '',
      dureeImmobilisationJours: panne.dureeImmobilisationJours || 2,
      coutEstimeDevis: panne.coutEstimeDevis ? String(panne.coutEstimeDevis) : '1500',
      statut: panne.statut || 'DECLAREE',
      observations: panne.observations || ''
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
        garageAgreeId: form.garageAgreeId ? Number(form.garageAgreeId) : null,
        kilometragePanne: form.kilometragePanne ? Number(form.kilometragePanne) : null,
        dureeImmobilisationJours: form.dureeImmobilisationJours ? Number(form.dureeImmobilisationJours) : null,
        coutEstimeDevis: form.coutEstimeDevis ? parseFloat(form.coutEstimeDevis) : 0
      };

      if (form.id) {
        await panneService.modifier(form.id, payload);
        toast.success('Dossier de panne mis à jour avec succès !');
      } else {
        await panneService.declarer(payload);
        toast.success(
          form.immobilisante 
            ? 'Panne enregistrée ! Véhicule automatiquement immobilisé au statut EN_REPARATION.' 
            : 'Panne enregistrée avec succès !'
        );
      }

      setSearchTerm('');
      setStatutFilter('ALL');
      setUrgenceFilter('ALL');
      setVehiculeFilter('ALL');
      setForm({
        id: null,
        vehiculeId: '',
        conducteurId: '',
        garageAgreeId: '',
        dateDeclaration: new Date().toISOString().slice(0, 16),
        lieuPanne: '',
        kilometragePanne: '',
        naturePanne: '',
        descriptionSymptomes: '',
        degreUrgence: 'MOYENNE',
        immobilisante: true,
        remorquageRequis: false,
        societeRemorquage: 'SOS Remorquage Rabat Assistance',
        diagnosticAtelier: '',
        dureeImmobilisationJours: 2,
        coutEstimeDevis: '1500',
        statut: 'DECLAREE',
        observations: ''
      });
      setActiveTab('liste');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erreur lors de l’enregistrement de la panne');
    }
  };

  const openClotureModal = (panne) => {
    const v = vehicules.find(item => item.id === panne.vehiculeId);
    const kmActuel = v?.kilometrageActuel || panne.kilometragePanne || 0;

    setSelectedPanneForCloture(panne);
    setClotureForm({
      kilometrageReel: String(kmActuel),
      coutReelReparation: panne.coutEstimeDevis ? String(panne.coutEstimeDevis) : '1200',
      dateReparation: new Date().toISOString().slice(0, 16),
      referenceBonSortie: `BS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      referenceFacture: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      garantieAccordee: 'Garantie 6 mois pièces et main d\'œuvre',
      observations: '',
      pieces: []
    });
    setShowClotureModal(true);
  };

  const handleAddPieceToCloture = () => {
    if (!newPiece.referencePiece || !newPiece.designation || !newPiece.prixUnitaire) {
      toast.error('Veuillez remplir la référence, la désignation et le prix de la pièce.');
      return;
    }
    const pu = parseFloat(newPiece.prixUnitaire);
    const qty = Number(newPiece.quantite || 1);
    setClotureForm(prev => ({
      ...prev,
      pieces: [...prev.pieces, { ...newPiece, quantite: qty, prixUnitaire: pu, montantTotal: pu * qty }]
    }));
    setNewPiece({ referencePiece: '', designation: '', categorie: 'Mécanique', quantite: 1, prixUnitaire: '' });
  };

  const handleRemovePieceFromCloture = (idx) => {
    setClotureForm(prev => ({
      ...prev,
      pieces: prev.pieces.filter((_, i) => i !== idx)
    }));
  };

  const handleClotureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPanneForCloture) return;

    const v = vehicules.find(item => item.id === selectedPanneForCloture.vehiculeId);
    const kmActuel = v?.kilometrageActuel || 0;
    const kmSaisi = Number(clotureForm.kilometrageReel);

    // Contrôle strict du kilométrage croissant
    if (kmSaisi < kmActuel) {
      toast.error(`Le kilométrage réel (${kmSaisi} km) ne peut pas être inférieur au kilométrage actuel (${kmActuel} km).`);
      return;
    }

    try {
      const payload = {
        kilometrageReel: kmSaisi,
        coutReelReparation: clotureForm.coutReelReparation ? parseFloat(clotureForm.coutReelReparation) : 0,
        dateReparation: clotureForm.dateReparation,
        referenceBonSortie: clotureForm.referenceBonSortie,
        referenceFacture: clotureForm.referenceFacture,
        garantieAccordee: clotureForm.garantieAccordee,
        observations: clotureForm.observations,
        pieces: clotureForm.pieces
      };
      await panneService.cloturer(selectedPanneForCloture.id, payload);
      toast.success('Réparation clôturée avec succès ! Le véhicule est remis au statut DISPONIBLE.');
      setShowClotureModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erreur lors de la clôture');
    }
  };

  const confirmDeletePanne = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await panneService.delete(deleteModal.item.id);
      toast.success('Dossier de panne supprimé avec succès');
      setDeleteModal({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Filtered Pannes
  const filteredPannes = pannes.filter(p => {
    const matchSearch = (p.immatriculation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.marqueModele || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.naturePanne || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.lieuPanne || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.diagnosticAtelier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === 'ALL' || p.statut === statutFilter;
    const matchUrgence = urgenceFilter === 'ALL' || p.degreUrgence === urgenceFilter;
    const matchVehicule = vehiculeFilter === 'ALL' || String(p.vehiculeId) === vehiculeFilter;
    return matchSearch && matchStatut && matchUrgence && matchVehicule;
  });

  // KPI calculations
  const totalPannes = pannes.length;
  const pannesActives = pannes.filter(p => p.statut !== 'REPAREE' && p.statut !== 'ANNULEE').length;
  const remorquagesActifs = pannes.filter(p => p.remorquageRequis && p.statut !== 'REPAREE').length;
  const reparees = pannes.filter(p => p.statut === 'REPAREE').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0A1E3F]">Gestion des Pannes Curatives & Remorquage Urgent</h1>
            <p className="text-xs text-slate-500">Déclaration, diagnostic atelier, assistance remorquage et clôture formelle</p>
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
                garageAgreeId: '',
                dateDeclaration: new Date().toISOString().slice(0, 16),
                lieuPanne: '',
                kilometragePanne: vehicules[0]?.kilometrageActuel ? String(vehicules[0].kilometrageActuel) : '',
                naturePanne: '',
                descriptionSymptomes: '',
                degreUrgence: 'MOYENNE',
                immobilisante: true,
                remorquageRequis: false,
                societeRemorquage: 'SOS Remorquage Rabat Assistance',
                diagnosticAtelier: '',
                dureeImmobilisationJours: 2,
                coutEstimeDevis: '1500',
                statut: 'DECLAREE',
                observations: ''
              });
              setActiveTab(activeTab === 'liste' ? 'declarer' : 'liste');
            }}
            className="px-4 py-2.5 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {activeTab === 'liste' ? (
              <>
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Déclarer une Panne</span>
              </>
            ) : (
              <span>Voir le Tableau des Pannes</span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{pannesActives}</div>
            <div className="text-xs font-medium text-slate-500">Pannes Actives en Cours</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{remorquagesActifs}</div>
            <div className="text-xs font-medium text-slate-500">Demandes de Remorquage</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{reparees}</div>
            <div className="text-xs font-medium text-slate-500">Réparations Clôturées</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0A1E3F]">{totalPannes}</div>
            <div className="text-xs font-medium text-slate-500">Total Dossiers Pannes</div>
          </div>
        </div>
      </div>

      {/* View 1: Declaration Form (Figure 5.2) */}
      {activeTab === 'declarer' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-[#0A1E3F]">
                {form.id ? `Modifier le Dossier de Panne #${form.id}` : 'Déclaration de Panne & Demande de Remorquage'}
              </h2>
              <p className="text-xs text-slate-500 font-normal">Application immédiate de l'immobilisation automatique du véhicule</p>
            </div>
          </div>

          <form onSubmit={handleDeclarerSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Véhicule */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule Concerné *</label>
                <select
                  required
                  value={form.vehiculeId}
                  onChange={(e) => handleSelectVehicule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Sélectionner un véhicule --</option>
                  {vehicules.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.immatriculation} - {v.marque} {v.modele} ({v.direction || 'MEF'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conducteur */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Conducteur / Déclarant</label>
                <select
                  value={form.conducteurId}
                  onChange={(e) => setForm({ ...form, conducteurId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Sélectionner le conducteur --</option>
                  {conducteurs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom} ({c.matricule})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Heure */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date & Heure de la Panne *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.dateDeclaration}
                  onChange={(e) => setForm({ ...form, dateDeclaration: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              {/* Kilométrage au moment de la panne */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kilométrage Estimé au Moment de la Panne</label>
                <input
                  type="number"
                  value={form.kilometragePanne}
                  onChange={(e) => setForm({ ...form, kilometragePanne: e.target.value })}
                  placeholder="Ex: 48500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono font-bold"
                />
              </div>

              {/* Lieu de la Panne */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Localisation / Lieu Précis de la Panne *</label>
                <input
                  type="text"
                  required
                  value={form.lieuPanne}
                  onChange={(e) => setForm({ ...form, lieuPanne: e.target.value })}
                  placeholder="Ex: Autoroute Rabat-Casablanca PK 28 / Avenue Annakhil Hay Riad"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              {/* Nature de la Panne */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nature / Motif de la Panne *</label>
                <input
                  type="text"
                  required
                  value={form.naturePanne}
                  onChange={(e) => setForm({ ...form, naturePanne: e.target.value })}
                  placeholder="Ex: Défaillance démarreur / Fuite liquide refroidissement / Éclatement pneu"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              {/* Description des Symptômes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description des Symptômes & Circonstances</label>
                <textarea
                  rows="3"
                  value={form.descriptionSymptomes}
                  onChange={(e) => setForm({ ...form, descriptionSymptomes: e.target.value })}
                  placeholder="Détaillez le comportement anormal du véhicule (bruit, fumée, voyants allumés, perte de puissance...)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>

              {/* Degré d'urgence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Degré d'Urgence</label>
                <select
                  value={form.degreUrgence}
                  onChange={(e) => setForm({ ...form, degreUrgence: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  {URGENCES.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              {/* Garage Agréé Assigné */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Atelier / Garage Agréé MEF Assigné</label>
                <select
                  value={form.garageAgreeId}
                  onChange={(e) => setForm({ ...form, garageAgreeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Garage Central MEF (Par défaut) --</option>
                  {garages.map((g) => (
                    <option key={g.id} value={g.id}>{g.nomGarage} ({g.ville})</option>
                  ))}
                </select>
              </div>

              {/* Diagnostic Atelier */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Diagnostic d'Atelier / Travaux Préconisés</label>
                <input
                  type="text"
                  value={form.diagnosticAtelier}
                  onChange={(e) => setForm({ ...form, diagnosticAtelier: e.target.value })}
                  placeholder="Ex: Remplacement alternateur et contrôle du faisceau de charge"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                />
              </div>
            </div>

            {/* Towing & Immobilization checkboxes */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/70 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="immobCheck"
                  checked={form.immobilisante}
                  onChange={(e) => setForm({ ...form, immobilisante: e.target.checked })}
                  className="w-4 h-4 text-[#0A1E3F] rounded border-slate-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="immobCheck" className="text-xs font-bold text-amber-900 cursor-pointer">
                  Véhicule Immobilisant (Interdiction de circulation & passage automatique au statut EN_REPARATION)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remorqCheck"
                  checked={form.remorquageRequis}
                  onChange={(e) => setForm({ ...form, remorquageRequis: e.target.checked })}
                  className="w-4 h-4 text-[#0A1E3F] rounded border-slate-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="remorqCheck" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-600" />
                  Demande de Remorquage d'Urgence Requise (Assistance Dépannage)
                </label>
              </div>

              {form.remorquageRequis && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Prestataire de Remorquage / Société d'Assistance</label>
                  <input
                    type="text"
                    value={form.societeRemorquage}
                    onChange={(e) => setForm({ ...form, societeRemorquage: e.target.value })}
                    placeholder="Ex: SOS Remorquage Rabat Assistance"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                </div>
              )}
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
                <span>{form.id ? 'Mettre à Jour le Dossier' : 'Enregistrer & Déclencher la Prise en Charge'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* View 2: Pannes Enterprise Table (Compact & Fully Responsive) */}
      {activeTab === 'liste' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher immatriculation, panne, lieu..."
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
                <option value="DECLAREE">Déclarée</option>
                <option value="EN_DIAGNOSTIC">En Diagnostic</option>
                <option value="EN_REPARATION">En Réparation</option>
                <option value="REPAREE">Réparée (Clôturée)</option>
              </select>

              <select
                value={urgenceFilter}
                onChange={(e) => setUrgenceFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0A1E3F] cursor-pointer"
              >
                <option value="ALL">Toutes les Urgences</option>
                <option value="CRITIQUE">Critique</option>
                <option value="ELEVEE">Élevée</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="FAIBLE">Faible</option>
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
                {filteredPannes.length} pannes
              </span>
            </div>
          </div>

          {/* Table Container with Compact Padding and zero horizontal scroll constraint */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0A1E3F] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C59B27]" /> Registre des Pannes Curatives & Remorquage ({filteredPannes.length})
              </h3>
            </div>

            <div className="w-full">
              <table className="enterprise-table enterprise-table--compact w-full table-auto">
                <thead>
                  <tr>
                    <th className="w-[18%]">Véhicule</th>
                    <th className="w-[22%]">Nature Panne & Urgence</th>
                    <th className="w-[18%]">Lieu & Date</th>
                    <th className="w-[16%]">Atelier / Dépannage</th>
                    <th className="w-[11%]">Coût TTC</th>
                    <th className="w-[7%]">Statut</th>
                    <th className="w-[8%] !text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPannes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-500">Aucun dossier de panne ne correspond aux critères sélectionnés.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredPannes.map((p) => {
                      const urgenceCfg = URGENCES.find(u => u.value === p.degreUrgence) || URGENCES[2];
                      const isReparee = p.statut === 'REPAREE';

                      return (
                        <tr key={p.id}>
                          {/* Véhicule */}
                          <td>
                            <div className="font-mono font-bold text-xs text-[#0A1E3F] bg-slate-100 border border-slate-300 px-2 py-0.5 rounded w-max">
                              {p.immatriculation}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5 font-semibold truncate">{p.marqueModele}</div>
                            <div className="text-[9px] text-[#C59B27] font-bold">{p.direction || 'Direction MEF'}</div>
                          </td>

                          {/* Nature & Urgence */}
                          <td>
                            <div className="font-bold text-[#0A1E3F] text-xs leading-snug line-clamp-1">{p.naturePanne}</div>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border ${urgenceCfg.color}`}>
                                {urgenceCfg.short}
                              </span>
                              {p.immobilisante && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase text-red-700 bg-red-50 border border-red-200">
                                  Immobilisé
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Lieu & Date */}
                          <td className="text-xs text-slate-600">
                            <div className="flex items-center gap-1 font-medium truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.lieuPanne || 'Rabat'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{p.dateDeclaration ? new Date(p.dateDeclaration).toLocaleDateString('fr-FR') : 'N/A'}</span>
                            </div>
                          </td>

                          {/* Atelier & Remorquage */}
                          <td>
                            <div className="text-xs font-bold text-[#0A1E3F] truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.garageNom || 'Garage Central MEF'}</span>
                            </div>
                            {p.remorquageRequis ? (
                              <div className="text-[10px] text-orange-600 font-bold mt-0.5 flex items-center gap-1">
                                <Truck className="w-3 h-3 text-orange-500 shrink-0" />
                                <span>Remorquage</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 mt-0.5">Sans remorquage</div>
                            )}
                          </td>

                          {/* Coût */}
                          <td className="font-extrabold text-xs">
                            {isReparee && p.coutReelReparation ? (
                              <span className="text-emerald-700 font-mono">{Number(p.coutReelReparation).toLocaleString('fr-FR')} DH</span>
                            ) : (
                              <span className="text-slate-500 font-mono text-[11px]">{p.coutEstimeDevis ? Number(p.coutEstimeDevis).toLocaleString() + ' DH' : '-'}</span>
                            )}
                          </td>

                          {/* Statut */}
                          <td>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              isReparee 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {p.statut}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="!text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {!isReparee && (
                                <button
                                  onClick={() => openClotureModal(p)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                                  title="Clôturer la réparation"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedPanneDetail(p)}
                                className="p-1.5 text-slate-400 hover:text-[#C59B27] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Voir les détails complets"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleEditPanne(p)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Modifier la panne"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeleteModal({ isOpen: true, item: p, loading: false })}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer la panne"
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

      {/* RICH DETAIL MODAL : FICHE DE PANNE & RÉPARATION CURATIVE */}
      <AnimatePresence>
        {selectedPanneDetail && (
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
                    <AlertTriangle className="w-4 h-4" />
                    Dossier Panne #{selectedPanneDetail.id}
                  </div>
                  <h2 className="text-lg font-black font-outfit mt-1 text-white">
                    {selectedPanneDetail.naturePanne}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPanneDetail(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Header Urgence & Statut */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Degré d'Urgence:</span>
                    <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                      (URGENCES.find(u => u.value === selectedPanneDetail.degreUrgence) || URGENCES[2]).color
                    }`}>
                      {selectedPanneDetail.degreUrgence}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Statut:</span>
                    <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                      selectedPanneDetail.statut === 'REPAREE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {selectedPanneDetail.statut}
                    </span>
                  </div>
                </div>

                {/* Véhicule */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Véhicule Attribué</div>
                  <div className="flex items-center justify-between">
                    <MoroccanPlate plate={selectedPanneDetail.immatriculation} />
                    <div className="text-right">
                      <div className="font-bold text-[#0A1E3F] text-sm">{selectedPanneDetail.marqueModele}</div>
                      <div className="text-[11px] font-bold text-[#C59B27]">{selectedPanneDetail.direction || 'Direction MEF'}</div>
                    </div>
                  </div>
                </div>

                {/* Grid Informations Panne */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Date & Heure Panne</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedPanneDetail.dateDeclaration ? new Date(selectedPanneDetail.dateDeclaration).toLocaleString('fr-FR') : '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Kilométrage Déclaré</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <Car className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedPanneDetail.kilometragePanne ? selectedPanneDetail.kilometragePanne.toLocaleString() + ' km' : 'Non spécifié'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Lieu de la Panne</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedPanneDetail.lieuPanne || '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Atelier MEF Assigné</span>
                    <span className="font-extrabold text-[#0A1E3F] text-xs flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedPanneDetail.garageNom || 'Garage Central MEF'}
                    </span>
                  </div>
                </div>

                {/* Remorquage Block */}
                <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <div>
                      <div className="text-xs font-bold text-orange-950">
                        {selectedPanneDetail.remorquageRequis ? 'Remorquage d\'Urgence Requis' : 'Aucun Remorquage Nécessaire'}
                      </div>
                      {selectedPanneDetail.remorquageRequis && selectedPanneDetail.societeRemorquage && (
                        <div className="text-[11px] text-orange-800">Prestataire : {selectedPanneDetail.societeRemorquage}</div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedPanneDetail.remorquageRequis ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedPanneDetail.remorquageRequis ? 'ACTIF' : 'NON'}
                  </span>
                </div>

                {/* Symptômes & Diagnostic */}
                {selectedPanneDetail.descriptionSymptomes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] block uppercase">Symptômes & Circonstances</span>
                    <p className="text-slate-700 text-xs font-medium leading-relaxed italic">"{selectedPanneDetail.descriptionSymptomes}"</p>
                  </div>
                )}

                {selectedPanneDetail.diagnosticAtelier && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-blue-700 font-bold text-[10px] block uppercase">Diagnostic Atelier & Devis</span>
                    <p className="text-blue-900 text-xs font-medium leading-relaxed">{selectedPanneDetail.diagnosticAtelier}</p>
                  </div>
                )}

                {/* Clôture info if reparee */}
                {selectedPanneDetail.statut === 'REPAREE' && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Bilan de Clôture de Réparation</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Coût Réel Réparation:</span>
                        <span className="font-bold font-mono text-emerald-800 block text-sm">{selectedPanneDetail.coutReelReparation || 0} DH TTC</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Date d'Achèvement:</span>
                        <span className="font-bold text-slate-800 block">
                          {selectedPanneDetail.dateReparation ? new Date(selectedPanneDetail.dateReparation).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">N° Bon de Sortie:</span>
                        <span className="font-mono font-bold text-slate-800 block">{selectedPanneDetail.referenceBonSortie || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Réf. Facture / GED:</span>
                        <span className="font-mono font-bold text-slate-800 block">{selectedPanneDetail.referenceFacture || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => setSelectedPanneDetail(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fermer
                </button>

                <div className="flex items-center gap-2">
                  {selectedPanneDetail.statut !== 'REPAREE' && (
                    <button
                      onClick={() => {
                        const itemToClose = selectedPanneDetail;
                        setSelectedPanneDetail(null);
                        openClotureModal(itemToClose);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Clôturer la Réparation
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const itemToEdit = selectedPanneDetail;
                      setSelectedPanneDetail(null);
                      handleEditPanne(itemToEdit);
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

      {/* Modale de Clôture de Réparation */}
      <AnimatePresence>
        {showClotureModal && selectedPanneForCloture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/80 max-h-[90vh] flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      Clôture de Réparation Curative
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Contrôle du kilométrage, validation des coûts et remise en service</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowClotureModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleClotureSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  {/* Véhicule info card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Véhicule en Réparation</span>
                      <div className="text-xs font-bold text-[#0A1E3F]">{selectedPanneForCloture.immatriculation} - {selectedPanneForCloture.marqueModele}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Panne : {selectedPanneForCloture.naturePanne}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-medium">Kilométrage Actuel au Compteur</span>
                      <div className="text-sm font-mono font-bold text-[#0A1E3F]">
                        {vehicules.find(v => v.id === selectedPanneForCloture.vehiculeId)?.kilometrageActuel || selectedPanneForCloture.kilometragePanne || 0} km
                      </div>
                    </div>
                  </div>

                  {/* Kilométrage réel */}
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-900 mb-1.5">
                      Kilométrage Réel Relevé à la Clôture *
                    </label>
                    <input
                      type="number"
                      required
                      value={clotureForm.kilometrageReel}
                      onChange={(e) => setClotureForm({ ...clotureForm, kilometrageReel: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                    {Number(clotureForm.kilometrageReel) < (vehicules.find(v => v.id === selectedPanneForCloture.vehiculeId)?.kilometrageActuel || 0) && (
                      <div className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Attention : Le kilométrage saisi ne peut pas être inférieur au kilométrage actuel du véhicule !
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Coût Réel TTC (DH) *</label>
                      <input
                        type="number"
                        step="10"
                        required
                        value={clotureForm.coutReelReparation}
                        onChange={(e) => setClotureForm({ ...clotureForm, coutReelReparation: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date d'Achèvement</label>
                      <input
                        type="datetime-local"
                        value={clotureForm.dateReparation}
                        onChange={(e) => setClotureForm({ ...clotureForm, dateReparation: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">N° Bon de Sortie d'Atelier</label>
                      <input
                        type="text"
                        value={clotureForm.referenceBonSortie}
                        onChange={(e) => setClotureForm({ ...clotureForm, referenceBonSortie: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                        placeholder="ex: BS-2026-0045"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Réf. Facture / GED</label>
                      <input
                        type="text"
                        value={clotureForm.referenceFacture}
                        onChange={(e) => setClotureForm({ ...clotureForm, referenceFacture: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                        placeholder="ex: FACT-2026-991"
                      />
                    </div>
                  </div>

                  {/* Pièces Remplacées */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#C59B27]" />
                        Pièces de Rechange Remplacées
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Réf Pièce"
                        value={newPiece.referencePiece}
                        onChange={(e) => setNewPiece({ ...newPiece, referencePiece: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                      <input
                        type="text"
                        placeholder="Désignation"
                        value={newPiece.designation}
                        onChange={(e) => setNewPiece({ ...newPiece, designation: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                      <input
                        type="number"
                        placeholder="Prix (DH)"
                        value={newPiece.prixUnitaire}
                        onChange={(e) => setNewPiece({ ...newPiece, prixUnitaire: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddPieceToCloture}
                        className="px-3 py-2 bg-[#0A1E3F] text-white rounded-xl text-xs font-bold hover:bg-[#122B55] transition-all cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </div>

                    {clotureForm.pieces.length > 0 && (
                      <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                        {clotureForm.pieces.map((pc, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                            <span className="font-mono text-slate-700 font-semibold">{pc.referencePiece} — {pc.designation}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-700">{pc.prixUnitaire} DH</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePieceFromCloture(idx)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowClotureModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={Number(clotureForm.kilometrageReel) < (vehicules.find(v => v.id === selectedPanneForCloture.vehiculeId)?.kilometrageActuel || 0)}
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Valider la Clôture & Remettre à DISPONIBLE</span>
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
        title="Supprimer le Dossier de Panne"
        message={`Voulez-vous vraiment supprimer le dossier de panne "${deleteModal.item?.naturePanne}" enregistré pour le véhicule ${deleteModal.item?.immatriculation} ?`}
        onConfirm={confirmDeletePanne}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, loading: false })}
        loading={deleteModal.loading}
      />
    </div>
  );
}
