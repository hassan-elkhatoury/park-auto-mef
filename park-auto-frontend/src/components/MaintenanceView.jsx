import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, ShieldAlert, AlertTriangle, Calendar, Plus, RefreshCw, CheckCircle2, Clock, 
  Car, Filter, X, DollarSign, Eye, Trash2, Edit, MapPin, User, FileText, AlertCircle, CheckCircle, Building2, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { maintenanceService } from '../services/maintenanceService';
import { vehiculeService } from '../services/vehiculeService';
import { garageService } from '../services/garageService';
import { MoroccanPlate } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

export default function MaintenanceView() {
  const [activeTab, setActiveTab] = useState('interventions'); // 'interventions' | 'alertes'
  const [interventions, setInterventions] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSearch, setFilterSearch]     = useState('');
  const [filterType, setFilterType]         = useState('ALL');
  const [filterStatut, setFilterStatut]     = useState('ALL');
  const [filterNature, setFilterNature]     = useState('ALL');
  const [filterVehicule, setFilterVehicule] = useState('ALL');
  const [filterImmob, setFilterImmob]       = useState('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [selectedInterventionForDetail, setSelectedInterventionForDetail] = useState(null);
  const [selectedInterventionForCloture, setSelectedInterventionForCloture] = useState(null);
  const [selectedAlerteForDetail, setSelectedAlerteForDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, loading: false });

  // Creation / Edit Form
  const [form, setForm] = useState({
    id: null,
    vehiculeId: '',
    garageAgreeId: '',
    typeMaintenance: 'PREVENTIVE',
    natureOperation: 'VIDANGE',
    datePrevisionnelle: new Date().toISOString().split('T')[0],
    kilometragePrevu: '',
    prestataire: 'Garage Central MEF Rabat',
    coutMainOeuvre: '350',
    coutPieces: '850',
    montantTotal: '1200',
    piecesRemplacees: '',
    statut: 'PROGRAMMEE',
    immobilisation: false,
    description: ''
  });

  // Cloture Form
  const [clotureForm, setClotureForm] = useState({
    kilometrageRealise: '',
    dateRealisation: new Date().toISOString().split('T')[0],
    coutMainOeuvre: '350',
    coutPieces: '850',
    montantTotal: '1200',
    prestataire: 'Garage Central MEF Rabat',
    garageAgreeId: '',
    piecesRemplacees: '',
    referenceFacture: '',
    description: '',
    pieces: []
  });

  const [newPiece, setNewPiece] = useState({
    referencePiece: '',
    designation: '',
    categorie: 'Filtration',
    quantite: 1,
    prixUnitaire: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let loadErrors = [];
      const [iData, aData, vData, gData] = await Promise.all([
        maintenanceService.getInterventions().catch((e) => { loadErrors.push(e); return []; }),
        maintenanceService.getAlertes().catch((e) => { loadErrors.push(e); return []; }),
        vehiculeService.getVehicules().catch((e) => { loadErrors.push(e); return []; }),
        garageService.getActifs().catch((e) => { loadErrors.push(e); return []; })
      ]);
      if (loadErrors.length > 0) toast.error(`Certaines données n'ont pas pu être chargées (${loadErrors.length} erreur(s)).`);
      setInterventions(Array.isArray(iData) ? iData : (iData?.data || iData?.content || []));
      setAlertes(Array.isArray(aData) ? aData : (aData?.data || aData?.content || []));
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
      setGarages(Array.isArray(gData) ? gData : (gData?.data || []));
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
    let prestataire = garages[0]?.nomGarage || 'Garage Central MEF Rabat';
    let costMO = '350';
    let costPieces = '850';
    let totalCost = '1200';

    const tAlerte = (a.typeAlerte || '').toUpperCase();
    if (tAlerte.includes('KM') || tAlerte.includes('ENTRETIEN') || tAlerte.includes('MAINTENANCE')) {
      typeMaint = 'PREVENTIVE';
      natureOp = 'VIDANGE';
      desc = `Vidange moteur et révision périodique suite au seuil de ${a.kilometrageSeuil || 10000} km atteint à 90%.`;
    }

    setForm({
      id: null,
      vehiculeId: a.vehiculeId || '',
      garageAgreeId: garages[0]?.id ? String(garages[0].id) : '',
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
      garageAgreeId: i.garageAgreeId ? String(i.garageAgreeId) : '',
      typeMaintenance: i.typeMaintenance || 'PREVENTIVE',
      natureOperation: i.natureOperation || 'VIDANGE',
      datePrevisionnelle: i.datePrevisionnelle || new Date().toISOString().split('T')[0],
      kilometragePrevu: i.kilometragePrevu ? String(i.kilometragePrevu) : '',
      prestataire: i.prestataire || 'Garage Central MEF Rabat',
      coutMainOeuvre: i.coutMainOeuvre ? String(i.coutMainOeuvre) : '350',
      coutPieces: i.coutPieces ? String(i.coutPieces) : '850',
      montantTotal: i.montantTotal ? String(i.montantTotal) : '1200',
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
        garageAgreeId: form.garageAgreeId ? Number(form.garageAgreeId) : null,
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

  // Clôture Handler
  const openClotureModal = (intervention) => {
    const v = vehicules.find(item => item.id === intervention.vehiculeId);
    const kmActuel = v?.kilometrageActuel || intervention.kilometragePrevu || 0;

    setSelectedInterventionForCloture(intervention);
    setClotureForm({
      kilometrageRealise: String(kmActuel),
      dateRealisation: new Date().toISOString().split('T')[0],
      coutMainOeuvre: intervention.coutMainOeuvre ? String(intervention.coutMainOeuvre) : '350',
      coutPieces: intervention.coutPieces ? String(intervention.coutPieces) : '850',
      montantTotal: intervention.montantTotal ? String(intervention.montantTotal) : '1200',
      prestataire: intervention.prestataire || 'Garage Central MEF Rabat',
      garageAgreeId: intervention.garageAgreeId ? String(intervention.garageAgreeId) : '',
      piecesRemplacees: intervention.piecesRemplacees || '',
      referenceFacture: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      description: intervention.description || '',
      pieces: []
    });
    setShowClotureModal(true);
  };

  const handleAddPieceToCloture = () => {
    if (!newPiece.referencePiece || !newPiece.designation || !newPiece.prixUnitaire) {
      toast.error('Veuillez renseigner la référence, la désignation et le prix de la pièce.');
      return;
    }
    const pu = parseFloat(newPiece.prixUnitaire);
    const qty = parseInt(newPiece.quantite || '1', 10);
    const addedTotal = pu * qty;

    setClotureForm(prev => {
      const currentPiecesCost = parseFloat(prev.coutPieces || '0');
      const newPiecesCost = currentPiecesCost + addedTotal;
      const mo = parseFloat(prev.coutMainOeuvre || '0');
      return {
        ...prev,
        coutPieces: String(newPiecesCost),
        montantTotal: String(mo + newPiecesCost),
        pieces: [...prev.pieces, { ...newPiece, quantite: qty, prixUnitaire: pu, montantTotal: addedTotal }]
      };
    });
    setNewPiece({ referencePiece: '', designation: '', categorie: 'Filtration', quantite: 1, prixUnitaire: '' });
  };

  const handleRemovePieceFromCloture = (idx) => {
    setClotureForm(prev => {
      const pieceToRemove = prev.pieces[idx];
      const removedCost = pieceToRemove ? pieceToRemove.prixUnitaire * pieceToRemove.quantite : 0;
      const newPiecesCost = Math.max(0, parseFloat(prev.coutPieces || '0') - removedCost);
      const mo = parseFloat(prev.coutMainOeuvre || '0');
      return {
        ...prev,
        coutPieces: String(newPiecesCost),
        montantTotal: String(mo + newPiecesCost),
        pieces: prev.pieces.filter((_, i) => i !== idx)
      };
    });
  };

  const handleClotureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterventionForCloture) return;

    const v = vehicules.find(item => item.id === selectedInterventionForCloture.vehiculeId);
    const kmActuel = v?.kilometrageActuel || 0;
    const kmSaisi = Number(clotureForm.kilometrageRealise);

    // Contrôle strict du kilométrage croissant
    if (kmSaisi < kmActuel) {
      toast.error(`Le kilométrage réel (${kmSaisi} km) ne peut pas être inférieur au kilométrage actuel du véhicule (${kmActuel} km).`);
      return;
    }

    try {
      const payload = {
        kilometrageRealise: kmSaisi,
        dateRealisation: clotureForm.dateRealisation,
        coutMainOeuvre: parseFloat(clotureForm.coutMainOeuvre || '0'),
        coutPieces: parseFloat(clotureForm.coutPieces || '0'),
        montantTotal: parseFloat(clotureForm.montantTotal || '0'),
        prestataire: clotureForm.prestataire,
        garageAgreeId: clotureForm.garageAgreeId ? Number(clotureForm.garageAgreeId) : null,
        piecesRemplacees: clotureForm.pieces.map(p => `${p.quantite}x ${p.designation} (${p.referencePiece})`).join(', ') || clotureForm.piecesRemplacees,
        referenceFacture: clotureForm.referenceFacture,
        description: clotureForm.description,
        pieces: clotureForm.pieces
      };

      await maintenanceService.cloturerIntervention(selectedInterventionForCloture.id, payload);
      toast.success('Intervention clôturée avec succès ! Compteur mis à jour et véhicule remis à DISPONIBLE.');
      setShowClotureModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erreur lors de la clôture');
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
    const matchSearch = !filterSearch.trim() ||
      (item.immatriculation || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
      (item.marqueModele   || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
      (item.prestataire    || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
      (item.description    || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
      (item.natureOperation|| '').toLowerCase().includes(filterSearch.toLowerCase());
    const matchType    = filterType    === 'ALL' || item.typeMaintenance === filterType;
    const matchStatut  = filterStatut  === 'ALL' || item.statut          === filterStatut;
    const matchNature  = filterNature  === 'ALL' || item.natureOperation  === filterNature;
    const matchVeh     = filterVehicule=== 'ALL' || String(item.vehiculeId || item.vehicule?.id) === filterVehicule;
    const matchImmob   = filterImmob   === 'ALL' ||
      (filterImmob === 'OUI' ? Boolean(item.immobilisation) : !item.immobilisation);
    return matchSearch && matchType && matchStatut && matchNature && matchVeh && matchImmob;
  });

  const hasActiveFilters = filterSearch || filterType !== 'ALL' || filterStatut !== 'ALL' ||
    filterNature !== 'ALL' || filterVehicule !== 'ALL' || filterImmob !== 'ALL';

  const resetFilters = () => {
    setFilterSearch(''); setFilterType('ALL'); setFilterStatut('ALL');
    setFilterNature('ALL'); setFilterVehicule('ALL'); setFilterImmob('ALL');
  };

  // 90% threshold alerts (Figure 5.1)
  const maintenanceAlerts90 = alertes.filter(a => a.typeAlerte === 'MAINTENANCE_PREVENTIVE');

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
            Maintenance du Parc & Alertes d'Entretien
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Planification préventive par seuils kilométriques, clôture avec contrôle strict du kilométrage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setForm({
                id: null,
                vehiculeId: vehicules[0]?.id ? String(vehicules[0].id) : '',
                garageAgreeId: garages[0]?.id ? String(garages[0].id) : '',
                typeMaintenance: 'PREVENTIVE',
                natureOperation: 'VIDANGE',
                datePrevisionnelle: new Date().toISOString().split('T')[0],
                kilometragePrevu: vehicules[0]?.kilometrageActuel ? String(vehicules[0].kilometrageActuel) : '50000',
                prestataire: garages[0]?.nomGarage || 'Garage Central MEF Rabat',
                coutMainOeuvre: '350',
                coutPieces: '850',
                montantTotal: '1200',
                piecesRemplacees: '',
                statut: 'PROGRAMMEE',
                immobilisation: false,
                description: ''
              });
              setShowModal(true);
            }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Programmer un Entretien
          </button>
        </div>
      </motion.div>

      {/* Jauges de Seuil Kilométrique & Alertes 90% */}
      {maintenanceAlerts90.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 text-amber-900 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">Alerte Seuil d'Entretien Préventif à 90%</h3>
                <p className="text-xs text-amber-800">Véhicules ayant atteint ou dépassé 90% du seuil kilométrique fixé pour révision</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-white font-extrabold text-xs rounded-full shadow-xs">
              {maintenanceAlerts90.length} Véhicules en Alerte
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {maintenanceAlerts90.map((a) => {
              const kmActuel = a.kilometrageActuel || 0;
              const kmSeuil = a.kilometrageSeuil || 10000;
              const pct = Math.min(100, Math.round((kmActuel / kmSeuil) * 100));
              const isOver = kmActuel >= kmSeuil;

              return (
                <div key={a.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-[#0A1E3F]">{a.immatriculation}</div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isOver ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {pct}% du seuil ({isOver ? 'DÉPASSÉ' : '90% ATTEINT'})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{a.marqueModele} — <span className="font-semibold text-slate-700">{a.direction || 'MEF'}</span></div>

                    {/* Gauge Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                        <span>Compteur : {kmActuel.toLocaleString()} km</span>
                        <span>Seuil : {kmSeuil.toLocaleString()} km</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isOver ? 'bg-red-600' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTraiterAlerte(a)}
                    className="w-full py-2 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Planifier Révision Immédiate</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            Alertes d'Échéances ({alertes.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Interventions List */}
      {activeTab === 'interventions' && (
        <div className="space-y-4">
          {/* Filters */}
          <motion.div
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Filtres :</span>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Rechercher véhicule, prestataire, opération..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] placeholder:text-slate-400"
                />
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {filterSearch && (
                  <button onClick={() => setFilterSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <span className="text-[11px] font-extrabold text-[#0A1E3F] bg-[#EBF3FA] border border-blue-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                {filteredInterventions.length} / {interventions.length} résultats
              </span>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#C59B27]"
              >
                <option value="ALL">Tous les Types</option>
                <option value="PREVENTIVE">Préventive</option>
                <option value="CURATIVE">Curative</option>
                <option value="REGLEMENTAIRE">Réglementaire</option>
              </select>

              <select
                value={filterStatut}
                onChange={e => setFilterStatut(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#C59B27]"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="PROGRAMMEE">Programmée</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINEE">Terminée</option>
                <option value="ANNULEE">Annulée</option>
              </select>

              <select
                value={filterVehicule}
                onChange={e => setFilterVehicule(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#C59B27] max-w-[200px]"
              >
                <option value="ALL">Tous les Véhicules</option>
                {vehicules.map(v => (
                  <option key={v.id} value={String(v.id)}>
                    {v.immatriculation} — {v.marque} {v.modele}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div 
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0A1E3F] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#C59B27]" /> Registre des Interventions de Maintenance
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Type & Opération</th>
                    <th>Date & Kilométrage</th>
                    <th>Prestataire / Garage Agréé</th>
                    <th>Coût Total</th>
                    <th>Statut</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-500">Aucune intervention de maintenance trouvée.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map((i) => {
                      const isTerminee = i.statut === 'TERMINEE';

                      return (
                        <tr key={i.id}>
                          <td className="whitespace-nowrap">
                            <MoroccanPlate plate={i.immatriculation} size="sm" />
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
                            <div className="font-bold text-[#0A1E3F] text-xs truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {i.garageNom || i.prestataire}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{i.description || '-'}</div>
                          </td>

                          <td className="whitespace-nowrap font-extrabold text-[#0A1E3F] text-xs">
                            {i.montantTotal ? i.montantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} DH
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
                              {!isTerminee && (
                                <button
                                  onClick={() => openClotureModal(i)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all mr-1"
                                  title="Clôturer l'intervention"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Clôturer</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleEditIntervention(i)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedInterventionForDetail(i)}
                                className="p-1.5 text-slate-400 hover:text-[#C59B27] hover:bg-amber-50 rounded-lg transition-colors"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, item: i, loading: false })}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
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
        </div>
      )}

      {/* Tab 2: Alerts Panel */}
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
                  alertes.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          a.niveauSeverite === 'CRITIQUE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {a.niveauSeverite}
                        </span>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">{a.typeAlerte}</div>
                      </td>

                      <td className="whitespace-nowrap">
                        <MoroccanPlate plate={a.immatriculation} size="sm" />
                        <div className="text-[10px] text-slate-500 mt-0.5">{a.marqueModele}</div>
                      </td>

                      <td>
                        <div className="font-bold text-[#0A1E3F] text-xs">{a.titre}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{a.message}</div>
                      </td>

                      <td className="whitespace-nowrap font-mono text-xs text-slate-700">
                        {a.dateEcheance ? new Date(a.dateEcheance).toLocaleDateString('fr-FR') : (
                          <span>{a.kilometrageActuel?.toLocaleString()} / {a.kilometrageSeuil?.toLocaleString()} km</span>
                        )}
                      </td>

                      <td className="!text-right whitespace-nowrap">
                        <button
                          onClick={() => handleTraiterAlerte(a)}
                          className="px-3 py-1.5 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs ml-auto"
                        >
                          <Wrench className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Traiter Alerte</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Program Maintenance Modal */}
      <AnimatePresence>
        {showModal && (
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
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {form.id ? 'Modifier l’Intervention' : 'Planifier un Entretien Préventif'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Gestion de la maintenance du parc MEF</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Véhicule *</label>
                      <select
                        required
                        value={form.vehiculeId}
                        onChange={(e) => setForm({ ...form, vehiculeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">-- Sélectionner un véhicule --</option>
                        {vehicules.map((v) => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de Maintenance</label>
                      <select
                        value={form.typeMaintenance}
                        onChange={(e) => setForm({ ...form, typeMaintenance: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="PREVENTIVE">Préventive</option>
                        <option value="CURATIVE">Curative</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nature d'Opération</label>
                      <select
                        value={form.natureOperation}
                        onChange={(e) => setForm({ ...form, natureOperation: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="VIDANGE">Vidange & Filtres</option>
                        <option value="FREINS">Système de Freinage</option>
                        <option value="PNEUMATIQUES">Pneumatiques & Géométrie</option>
                        <option value="BATTERIE">Batterie & Électrique</option>
                        <option value="CLIMATISATION">Climatisation</option>
                        <option value="REVISION_PERIODIQUE">Révision Générale</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date Prévisionnelle</label>
                      <input
                        type="date"
                        value={form.datePrevisionnelle}
                        onChange={(e) => setForm({ ...form, datePrevisionnelle: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Kilométrage Prévu</label>
                      <input
                        type="number"
                        value={form.kilometragePrevu}
                        onChange={(e) => setForm({ ...form, kilometragePrevu: e.target.value })}
                        placeholder="Ex: 50000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Garage Agréé MEF</label>
                      <select
                        value={form.garageAgreeId}
                        onChange={(e) => setForm({ ...form, garageAgreeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all cursor-pointer font-medium"
                      >
                        <option value="">-- Garage Central MEF Rabat --</option>
                        {garages.map((g) => (
                          <option key={g.id} value={g.id}>{g.nomGarage} ({g.ville})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Coût Main d'Œuvre (DH)</label>
                      <input
                        type="number"
                        value={form.coutMainOeuvre}
                        onChange={(e) => setForm({ ...form, coutMainOeuvre: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Coût Pièces (DH)</label>
                      <input
                        type="number"
                        value={form.coutPieces}
                        onChange={(e) => setForm({ ...form, coutPieces: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Travaux Prévus</label>
                      <textarea
                        rows="2"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                        placeholder="Détail des vérifications et travaux..."
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Enregistrer l'Entretien</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modale de Clôture d'une Réparation Curative & Contrôle du Kilométrage */}
      <AnimatePresence>
        {showClotureModal && selectedInterventionForCloture && (
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
                      Clôture de Maintenance & Contrôle Kilométrique
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Validation des coûts réels et remise en service</p>
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
                  {/* Véhicule & Compteur Actuel Info */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Véhicule concerné</span>
                      <div className="text-xs font-bold text-[#0A1E3F]">{selectedInterventionForCloture.immatriculation} - {selectedInterventionForCloture.marqueModele}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Opération : {selectedInterventionForCloture.natureOperation}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-medium">Kilométrage Actuel au Compteur</span>
                      <div className="text-sm font-mono font-bold text-[#0A1E3F]">
                        {vehicules.find(v => v.id === selectedInterventionForCloture.vehiculeId)?.kilometrageActuel || selectedInterventionForCloture.kilometragePrevu || 0} km
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
                      value={clotureForm.kilometrageRealise}
                      onChange={(e) => setClotureForm({ ...clotureForm, kilometrageRealise: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                    {Number(clotureForm.kilometrageRealise) < (vehicules.find(v => v.id === selectedInterventionForCloture.vehiculeId)?.kilometrageActuel || 0) && (
                      <div className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Attention : Le kilométrage saisi ne peut pas être inférieur au kilométrage actuel du véhicule !
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Main d'Œuvre (DH)</label>
                      <input
                        type="number"
                        step="10"
                        value={clotureForm.coutMainOeuvre}
                        onChange={(e) => {
                          const mo = parseFloat(e.target.value || '0');
                          const p = parseFloat(clotureForm.coutPieces || '0');
                          setClotureForm({ ...clotureForm, coutMainOeuvre: e.target.value, montantTotal: String(mo + p) });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Coût Pièces (DH)</label>
                      <input
                        type="number"
                        step="10"
                        value={clotureForm.coutPieces}
                        onChange={(e) => {
                          const p = parseFloat(e.target.value || '0');
                          const mo = parseFloat(clotureForm.coutMainOeuvre || '0');
                          setClotureForm({ ...clotureForm, coutPieces: e.target.value, montantTotal: String(mo + p) });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Total TTC</label>
                      <input
                        type="number"
                        readOnly
                        value={clotureForm.montantTotal}
                        className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-800"
                      />
                    </div>
                  </div>

                  {/* Pièces de Rechange Remplacées */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#C59B27]" />
                        Détail des Pièces Détachées Remplacées
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Réf. Facture / Document GED</label>
                    <input
                      type="text"
                      value={clotureForm.referenceFacture}
                      onChange={(e) => setClotureForm({ ...clotureForm, referenceFacture: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      placeholder="ex: FACT-2026-0889"
                    />
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
                    disabled={Number(clotureForm.kilometrageRealise) < (vehicules.find(v => v.id === selectedInterventionForCloture.vehiculeId)?.kilometrageActuel || 0)}
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Valider Clôture & Remettre à DISPONIBLE</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
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
