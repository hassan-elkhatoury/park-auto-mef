import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Wrench, ShieldCheck, Plus, Search, Filter, RefreshCw, 
  Trash2, Edit, Phone, Mail, MapPin, Star, Tag, CheckCircle2, X, DollarSign, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { garageService } from '../services/garageService';
import ConfirmModal from './ConfirmModal';

export default function GaragesView() {
  const [activeTab, setActiveTab] = useState('garages'); // 'garages' | 'pieces'
  const [garages, setGarages] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [villeFilter, setVilleFilter] = useState('ALL');
  const [specialiteFilter, setSpecialiteFilter] = useState('ALL');
  const [categorieFilter, setCategorieFilter] = useState('ALL');

  // Modals
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [showPieceModal, setShowPieceModal] = useState(false);
  const [selectedGarageDetail, setSelectedGarageDetail] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, garageId: null, loading: false });

  // Forms
  const [garageForm, setGarageForm] = useState({
    id: null,
    nomGarage: '',
    raisonSociale: '',
    ville: 'Rabat',
    adresse: '',
    telephone: '',
    email: '',
    contactNom: '',
    referenceConvention: '',
    agreeMEF: true,
    specialites: 'Mécanique générale, Révision périodique, Diagnostic électronique',
    tarifHoraireMo: '180',
    remisePiecesPct: '15',
    noteEvaluation: '4.8',
    observations: '',
    actif: true
  });

  const [pieceForm, setPieceForm] = useState({
    id: null,
    referencePiece: '',
    designation: '',
    categorie: 'Filtration',
    quantite: 10,
    prixUnitaire: '150',
    garageId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gData, pData] = await Promise.all([
        garageService.getAll().catch(() => []),
        garageService.getAllPieces().catch(() => [])
      ]);
      setGarages(Array.isArray(gData) ? gData : (gData?.data || gData?.content || []));
      setPieces(Array.isArray(pData) ? pData : (pData?.data || pData?.content || []));
    } catch (err) {
      console.error('Erreur chargement garages & pièces:', err);
      toast.error('Erreur lors du chargement du référentiel');
    } finally {
      setLoading(false);
    }
  };

  const handleGarageSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...garageForm,
        tarifHoraireMo: parseFloat(garageForm.tarifHoraireMo || '0'),
        remisePiecesPct: parseFloat(garageForm.remisePiecesPct || '0'),
        noteEvaluation: parseFloat(garageForm.noteEvaluation || '4.5')
      };
      await garageService.save(payload);
      toast.success(garageForm.id ? 'Garage mis à jour avec succès' : 'Nouveau garage agréé MEF enregistré !');
      setShowGarageModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement du garage");
    }
  };

  const handlePieceSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...pieceForm,
        quantite: parseInt(pieceForm.quantite || '1', 10),
        prixUnitaire: parseFloat(pieceForm.prixUnitaire || '0'),
        garageId: pieceForm.garageId ? Number(pieceForm.garageId) : null
      };
      await garageService.savePiece(payload);
      toast.success('Pièce de rechange ajoutée au catalogue !');
      setShowPieceModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement de la pièce");
    }
  };

  const handleDeleteGarage = (id) => {
    setDeleteModal({ isOpen: true, garageId: id, loading: false });
  };

  const confirmDeleteGarage = async () => {
    if (!deleteModal.garageId) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await garageService.delete(deleteModal.garageId);
      toast.success('Garage supprimé avec succès');
      setDeleteModal({ isOpen: false, garageId: null, loading: false });
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openEditGarage = (g) => {
    setGarageForm({
      id: g.id,
      nomGarage: g.nomGarage || '',
      raisonSociale: g.raisonSociale || '',
      ville: g.ville || 'Rabat',
      adresse: g.adresse || '',
      telephone: g.telephone || '',
      email: g.email || '',
      contactNom: g.contactNom || '',
      referenceConvention: g.referenceConvention || '',
      agreeMEF: g.agreeMEF !== false,
      specialites: g.specialites || '',
      tarifHoraireMo: g.tarifHoraireMo != null ? String(g.tarifHoraireMo) : '180',
      remisePiecesPct: g.remisePiecesPct != null ? String(g.remisePiecesPct) : '15',
      noteEvaluation: g.noteEvaluation != null ? String(g.noteEvaluation) : '4.8',
      observations: g.observations || '',
      actif: g.actif !== false
    });
    setShowGarageModal(true);
  };

  // Filtered Garages
  const filteredGarages = garages.filter(g => {
    const matchSearch = (g.nomGarage || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (g.ville || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (g.specialites || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (g.referenceConvention || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchVille = villeFilter === 'ALL' || (g.ville || '').toUpperCase() === villeFilter.toUpperCase();
    return matchSearch && matchVille;
  });

  // Filtered Pieces
  const filteredPieces = pieces.filter(p => {
    const matchSearch = (p.referencePiece || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.garageNom || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categorieFilter === 'ALL' || (p.categorie || '').toUpperCase() === categorieFilter.toUpperCase();
    return matchSearch && matchCat;
  });

  // Stats calculation
  const totalGarages = garages.length;
  const activeGarages = garages.filter(g => g.actif).length;
  const totalPiecesStock = pieces.reduce((sum, p) => sum + (p.quantite || 0), 0);
  const avgRemise = totalGarages > 0 ? (garages.reduce((sum, g) => sum + (Number(g.remisePiecesPct) || 0), 0) / totalGarages).toFixed(1) : '12.5';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0A1E3F]/10 rounded-xl text-[#0A1E3F]">
              <Building2 className="w-6 h-6 text-[#0A1E3F]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0A1E3F]">Répertoire des Garages Agréés & Pièces Détachées</h1>
              <p className="text-xs text-slate-500">Référentiel des prestataires qualifiés et catalogue des pièces de rechange MEF</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          {activeTab === 'garages' ? (
            <button
              onClick={() => {
                setGarageForm({
                  id: null,
                  nomGarage: '',
                  raisonSociale: '',
                  ville: 'Rabat',
                  adresse: '',
                  telephone: '',
                  email: '',
                  contactNom: '',
                  referenceConvention: `CONV-MEF-2026-0${garages.length + 1}`,
                  agreeMEF: true,
                  specialites: 'Mécanique générale, Électricité, Révision périodique',
                  tarifHoraireMo: '180',
                  remisePiecesPct: '15',
                  noteEvaluation: '4.8',
                  observations: '',
                  actif: true
                });
                setShowGarageModal(true);
              }}
              className="px-4 py-2.5 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Nouveau Garage Agréé</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setPieceForm({
                  id: null,
                  referencePiece: '',
                  designation: '',
                  categorie: 'Filtration',
                  quantite: 10,
                  prixUnitaire: '150',
                  garageId: garages[0]?.id ? String(garages[0].id) : ''
                });
                setShowPieceModal(true);
              }}
              className="px-4 py-2.5 bg-[#0A1E3F] hover:bg-[#122B55] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Ajouter une Pièce</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0A1E3F]">{totalGarages}</div>
            <div className="text-xs font-medium text-slate-500">Garages Conventionnés</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{activeGarages}</div>
            <div className="text-xs font-medium text-slate-500">Garages Actifs MEF</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{avgRemise}%</div>
            <div className="text-xs font-medium text-slate-500">Remise Moyenne Pièces</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">{totalPiecesStock}</div>
            <div className="text-xs font-medium text-slate-500">Unités Pièces Référencées</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('garages')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'garages'
              ? 'border-[#0A1E3F] text-[#0A1E3F]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Répertoire des Garages Agréés ({garages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pieces')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'pieces'
              ? 'border-[#0A1E3F] text-[#0A1E3F]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalogue des Pièces de Rechange ({pieces.length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'garages' ? "Rechercher un garage, ville, spécialité..." : "Rechercher une pièce, référence, garage..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0A1E3F] transition-all"
          />
        </div>

        {activeTab === 'garages' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={villeFilter}
              onChange={(e) => setVilleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0A1E3F]"
            >
              <option value="ALL">Toutes les Villes</option>
              <option value="Rabat">Rabat</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Fès">Fès</option>
              <option value="Tanger">Tanger</option>
              <option value="Marrakech">Marrakech</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categorieFilter}
              onChange={(e) => setCategorieFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0A1E3F]"
            >
              <option value="ALL">Toutes les Catégories</option>
              <option value="Filtration">Filtration</option>
              <option value="Freinage">Freinage</option>
              <option value="Électrique">Électrique</option>
              <option value="Pneumatique">Pneumatique</option>
              <option value="Moteur">Moteur</option>
              <option value="Suspension">Suspension</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Garages List */}
      {activeTab === 'garages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGarages.map((g) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-[#0A1E3F]">{g.nomGarage}</h3>
                    <p className="text-[11px] text-slate-500">{g.raisonSociale || 'Prestataire Agréé MEF'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    g.agreeMEF ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ShieldCheck className="w-3 h-3" />
                    {g.agreeMEF ? 'Agréé MEF' : 'Non conventionné'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{g.adresse || g.ville}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Taux MO Négocié</span>
                    <span className="font-bold text-[#0A1E3F]">{g.tarifHoraireMo || 180} DH/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Remise Pièces</span>
                    <span className="font-bold text-emerald-700">-{g.remisePiecesPct || 15}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Convention N°</span>
                    <span className="font-mono text-slate-700 font-semibold">{g.referenceConvention || 'CONV-MEF-2026'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Note Qualité</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {g.noteEvaluation || 4.8}/5
                    </span>
                  </div>
                </div>

                {g.specialites && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">Spécialités :</span>
                    <div className="flex flex-wrap gap-1">
                      {g.specialites.split(',').map((spec, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md text-[10px] font-medium">
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  {g.telephone && (
                    <a href={`tel:${g.telephone}`} className="flex items-center gap-1 text-slate-600 hover:text-[#0A1E3F]" title={g.telephone}>
                      <Phone className="w-3 h-3" />
                      <span>{g.telephone}</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditGarage(g)}
                    className="p-1.5 text-slate-500 hover:text-[#0A1E3F] hover:bg-slate-100 rounded-lg transition-all"
                    title="Modifier"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGarage(g.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredGarages.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Aucun garage agréé ne correspond aux critères de recherche.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pieces Table */}
      {activeTab === 'pieces' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A1E3F]/5 text-[#0A1E3F] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Réf. Pièce</th>
                  <th className="py-3.5 px-4">Désignation</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Garage Fournisseur</th>
                  <th className="py-3.5 px-4 text-center">Quantité</th>
                  <th className="py-3.5 px-4 text-right">Prix Unitaire</th>
                  <th className="py-3.5 px-4 text-right">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPieces.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0A1E3F]">{p.referencePiece}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{p.designation}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                        {p.categorie || 'Pièce Générale'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{p.garageNom || 'Garage Central MEF'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#0A1E3F]">{p.quantite}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">{p.prixUnitaire} DH</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{p.montantTotal || (p.prixUnitaire * p.quantite)} DH</td>
                  </tr>
                ))}
                {filteredPieces.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      Aucune pièce détachée enregistrée dans le catalogue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Garage Form Modal */}
      <AnimatePresence>
        {showGarageModal && (
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
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {garageForm.id ? 'Modifier le Garage Agréé' : 'Nouveau Garage Partenaire MEF'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Conventionnement, tarifs MO et remises négociées</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowGarageModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGarageSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom du Garage *</label>
                      <input
                        type="text"
                        required
                        value={garageForm.nomGarage}
                        onChange={(e) => setGarageForm({ ...garageForm, nomGarage: e.target.value })}
                        placeholder="Ex: Garage Central MEF Takaddoum"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Ville *</label>
                      <input
                        type="text"
                        required
                        value={garageForm.ville}
                        onChange={(e) => setGarageForm({ ...garageForm, ville: e.target.value })}
                        placeholder="Ex: Rabat"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">N° Convention MEF</label>
                      <input
                        type="text"
                        value={garageForm.referenceConvention}
                        onChange={(e) => setGarageForm({ ...garageForm, referenceConvention: e.target.value })}
                        placeholder="Ex: CONV-MEF-2026-01"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Adresse Complète</label>
                      <input
                        type="text"
                        value={garageForm.adresse}
                        onChange={(e) => setGarageForm({ ...garageForm, adresse: e.target.value })}
                        placeholder="Ex: Zone Industrielle Takaddoum N° 45, Rabat"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone</label>
                      <input
                        type="text"
                        value={garageForm.telephone}
                        onChange={(e) => setGarageForm({ ...garageForm, telephone: e.target.value })}
                        placeholder="0537-75-12-34"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={garageForm.email}
                        onChange={(e) => setGarageForm({ ...garageForm, email: e.target.value })}
                        placeholder="contact@garage.ma"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Taux Horaire MO (DH HT) *</label>
                      <input
                        type="number"
                        step="10"
                        value={garageForm.tarifHoraireMo}
                        onChange={(e) => setGarageForm({ ...garageForm, tarifHoraireMo: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Remise sur Pièces (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={garageForm.remisePiecesPct}
                        onChange={(e) => setGarageForm({ ...garageForm, remisePiecesPct: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Spécialités Techniques</label>
                      <input
                        type="text"
                        value={garageForm.specialites}
                        onChange={(e) => setGarageForm({ ...garageForm, specialites: e.target.value })}
                        placeholder="Ex: Mécanique générale, Électricité, Tôlerie, Pneumatiques"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowGarageModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Enregistrer le Garage</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Piece Form Modal */}
      <AnimatePresence>
        {showPieceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80 max-h-[90vh] flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      Ajouter une Pièce de Rechange au Catalogue
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Gestion des stocks et référencement fournisseurs</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPieceModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePieceSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence Pièce *</label>
                    <input
                      type="text"
                      required
                      value={pieceForm.referencePiece}
                      onChange={(e) => setPieceForm({ ...pieceForm, referencePiece: e.target.value })}
                      placeholder="Ex: FLT-OIL-5W30"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Désignation *</label>
                    <input
                      type="text"
                      required
                      value={pieceForm.designation}
                      onChange={(e) => setPieceForm({ ...pieceForm, designation: e.target.value })}
                      placeholder="Ex: Filtre à huile synthétique OEM"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie</label>
                      <select
                        value={pieceForm.categorie}
                        onChange={(e) => setPieceForm({ ...pieceForm, categorie: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        <option value="Filtration">Filtration</option>
                        <option value="Freinage">Freinage</option>
                        <option value="Électrique">Électrique</option>
                        <option value="Pneumatique">Pneumatique</option>
                        <option value="Moteur">Moteur</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        value={pieceForm.quantite}
                        onChange={(e) => setPieceForm({ ...pieceForm, quantite: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Prix Unitaire (DH TTC)</label>
                      <input
                        type="number"
                        step="10"
                        value={pieceForm.prixUnitaire}
                        onChange={(e) => setPieceForm({ ...pieceForm, prixUnitaire: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Garage Agréé</label>
                      <select
                        value={pieceForm.garageId}
                        onChange={(e) => setPieceForm({ ...pieceForm, garageId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        <option value="">-- Sélectionner un garage --</option>
                        {garages.map((g) => (
                          <option key={g.id} value={g.id}>{g.nomGarage} ({g.ville})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPieceModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Ajouter la Pièce</span>
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
        title="Suppression du garage agréé"
        message="Êtes-vous sûr de vouloir supprimer ce garage agréé ? Cette action est irréversible."
        variant="danger"
        confirmText="Supprimer"
        loading={deleteModal.loading}
        onConfirm={confirmDeleteGarage}
        onClose={() => setDeleteModal({ isOpen: false, garageId: null, loading: false })}
      />
    </div>
  );
}
