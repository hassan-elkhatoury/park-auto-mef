import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, CreditCard, AlertTriangle, Plus, Search, Filter, RefreshCw, MapPin, Gauge, X, Info, Eye, Trash2, Edit, CheckCircle2, Calendar, FileText, DollarSign, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { carburantService } from '../services/carburantService';
import { vehiculeService } from '../services/vehiculeService';
import { MoroccanPlate, FUEL_LABELS } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';

export default function CarburantView() {
  const [activeTab, setActiveTab] = useState('pleins'); // 'pleins', 'cartes', 'anomalies'
  const [pleins, setPleins] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [carteSearchTerm, setCarteSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  // Modals state
  const [showPleinModal, setShowPleinModal] = useState(false);
  const [showCarteModal, setShowCarteModal] = useState(false);
  const [selectedPleinForDetail, setSelectedPleinForDetail] = useState(null);
  const [selectedCarteForDetail, setSelectedCarteForDetail] = useState(null);
  
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    type: 'plein', // 'plein' | 'carte'
    loading: false
  });

  // Form State - Refuel
  const [pleinForm, setPleinForm] = useState({
    vehiculeId: '',
    carteCarburantId: '',
    quantiteLitres: '',
    prixUnitaire: '12.80',
    montantTTC: '',
    kilometrage: '',
    typeCarburant: 'DIESEL',
    stationService: 'TotalEnergies Agdal Rabat',
    referenceTicket: '',
    referenceFacture: '',
    observation: ''
  });

  // Form State - Card
  const [carteForm, setCarteForm] = useState({
    numeroCarte: '',
    fournisseur: 'TotalEnergies',
    vehiculeId: '',
    serviceAttribue: '',
    plafondMensuel: '3500',
    solde: '3500',
    dateExpiration: '',
    observation: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, cData, vData, aData] = await Promise.all([
        carburantService.getPleins().catch(() => []),
        carburantService.getCartes().catch(() => []),
        vehiculeService.getVehicules().catch(() => []),
        carburantService.getAnomalies().catch(() => [])
      ]);
      setPleins(Array.isArray(pData) ? pData : (pData?.data || pData?.content || []));
      setCartes(Array.isArray(cData) ? cData : (cData?.data || cData?.content || []));
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
      setAnomalies(Array.isArray(aData) ? aData : (aData?.data || aData?.content || []));
    } catch (err) {
      console.error('Erreur chargement données carburant:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePleinSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...pleinForm,
        vehiculeId: Number(pleinForm.vehiculeId),
        carteCarburantId: pleinForm.carteCarburantId ? Number(pleinForm.carteCarburantId) : null,
        quantiteLitres: parseFloat(pleinForm.quantiteLitres),
        prixUnitaire: parseFloat(pleinForm.prixUnitaire),
        montantTTC: parseFloat(pleinForm.montantTTC || (pleinForm.quantiteLitres * pleinForm.prixUnitaire)),
        kilometrage: parseInt(pleinForm.kilometrage)
      };
      await carburantService.enregistrerPlein(payload);
      toast.success('Plein de carburant enregistré avec succès');
      setShowPleinModal(false);
      setPleinForm({ vehiculeId: '', carteCarburantId: '', quantiteLitres: '', prixUnitaire: '12.80', montantTTC: '', kilometrage: '', typeCarburant: 'DIESEL', stationService: 'TotalEnergies Agdal Rabat', referenceTicket: '', referenceFacture: '', observation: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l’enregistrement du plein');
    }
  };

  const handleCarteSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...carteForm,
        vehiculeId: carteForm.vehiculeId ? Number(carteForm.vehiculeId) : null,
        plafondMensuel: carteForm.plafondMensuel ? parseFloat(carteForm.plafondMensuel) : 3000,
        solde: carteForm.solde ? parseFloat(carteForm.solde) : 3000,
        dateExpiration: carteForm.dateExpiration ? carteForm.dateExpiration : null,
        dateActivation: carteForm.dateActivation ? carteForm.dateActivation : null
      };
      await carburantService.enregistrerCarte(payload);
      toast.success('Carte carburant enregistrée avec succès !');
      setShowCarteModal(false);
      setCarteForm({ numeroCarte: '', fournisseur: 'TotalEnergies', vehiculeId: '', serviceAttribue: 'Service Logistique', plafondMensuel: '3500', solde: '3500', dateExpiration: '', observation: '' });
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de l’enregistrement de la carte';
      toast.error(errorMsg);
    }
  };

  const handleEditPlein = (p) => {
    setPleinForm({
      id: p.id,
      vehiculeId: p.vehiculeId || p.vehicule?.id || '',
      carteCarburantId: p.carteCarburantId || p.carteCarburant?.id || '',
      quantiteLitres: p.quantiteLitres ? String(p.quantiteLitres) : '',
      prixUnitaire: p.prixUnitaire ? String(p.prixUnitaire) : '12.80',
      montantTTC: p.montantTTC ? String(p.montantTTC) : '',
      kilometrage: p.kilometrage ? String(p.kilometrage) : '',
      typeCarburant: p.typeCarburant || 'DIESEL',
      stationService: p.stationService || 'Station MEF',
      referenceTicket: p.referenceTicket || '',
      referenceFacture: p.referenceFacture || '',
      observation: p.observation || ''
    });
    setShowPleinModal(true);
  };

  const handleEditCarte = (c) => {
    setCarteForm({
      id: c.id,
      numeroCarte: c.numeroCarte || '',
      fournisseur: c.fournisseur || 'TotalEnergies',
      vehiculeId: c.vehiculeId || c.vehicule?.id || '',
      serviceAttribue: c.serviceAttribue || 'Service Logistique',
      plafondMensuel: c.plafondMensuel ? String(c.plafondMensuel) : '3500',
      solde: c.solde ? String(c.solde) : '3500',
      dateActivation: c.dateActivation || '',
      dateExpiration: c.dateExpiration || '',
      statut: c.statut || 'ACTIVE',
      observation: c.observation || ''
    });
    setShowCarteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      if (deleteModal.type === 'plein') {
        await carburantService.deletePlein(deleteModal.item.id);
        toast.success('Enregistrement du plein supprimé avec succès');
      } else if (deleteModal.type === 'carte') {
        await carburantService.deleteCarte(deleteModal.item.id);
        toast.success('Carte carburant supprimée avec succès');
      }
      setDeleteModal({ isOpen: false, item: null, type: 'plein', loading: false });
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredPleins = pleins.filter(p => {
    const matchesSearch = 
      (p.immatriculation && p.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.marqueModele && p.marqueModele.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.stationService && p.stationService.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDir = directionFilter === 'ALL' || p.direction === directionFilter;
    return matchesSearch && matchesDir;
  });

  const filteredCartes = cartes.filter(c => {
    const q = carteSearchTerm.toLowerCase();
    return !carteSearchTerm || 
      (c.numeroCarte && c.numeroCarte.toLowerCase().includes(q)) ||
      (c.fournisseur && c.fournisseur.toLowerCase().includes(q)) ||
      (c.vehiculeImmatriculation && c.vehiculeImmatriculation.toLowerCase().includes(q)) ||
      (c.serviceAttribue && c.serviceAttribue.toLowerCase().includes(q));
  });

  const directionsList = Array.from(new Set(pleins.map(p => p.direction).filter(Boolean)));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Fuel className="w-6 h-6 text-[#C59B27]" />
          <div>
            <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
              Suivi du Carburant & Cartes Dotation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gestion synthétique des consommations (L/100km), cartes Total/Afriquia et détection des surconsommations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCarteModal(true)}
            className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Nouvelle Carte
          </button>
          <button
            onClick={() => setShowPleinModal(true)}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Saisir un Plein
          </button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => setActiveTab('pleins')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pleins' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Historique des Pleins ({pleins.length})
        </button>
        
        <button
          onClick={() => setActiveTab('cartes')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'cartes' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Cartes Carburant ({cartes.length})
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'anomalies' ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Anomalies de Surconsommation ({anomalies.length})
        </button>
      </motion.div>

      {/* Tab 1: Historique des Pleins */}
      {activeTab === 'pleins' && (
        <motion.div 
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Search Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par véhicule, immatriculation, station..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>

            {directionsList.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL">Toutes les Directions</option>
                  {directionsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Compact Enterprise Table */}
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Date & Station</th>
                  <th>Véhicule</th>
                  <th>Litrage & Prix</th>
                  <th>Montant TTC</th>
                  <th>Consommation</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPleins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <Fuel className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucun plein de carburant enregistré.</span>
                    </td>
                  </tr>
                ) : (
                  filteredPleins.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="font-bold text-[#0A1E3F]">
                          {new Date(p.datePlein).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C59B27]" /> {p.stationService || 'Station MEF'}
                        </div>
                      </td>

                      <td>
                        <MoroccanPlate immatriculation={p.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{p.marqueModele}</div>
                      </td>

                      <td>
                        <span className="font-bold text-[#0A1E3F] block">{p.quantiteLitres} L</span>
                        <span className="text-[10px] uppercase font-bold text-[#C59B27]">
                          {FUEL_LABELS[p.typeCarburant] || p.typeCarburant || 'Diesel'}
                        </span>
                      </td>

                      <td className="font-extrabold text-[#0A1E3F]">
                        {p.montantTTC ? p.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                      </td>

                      <td>
                        {p.anomalieSurconsommation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-sm whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            ⚠️ {p.consommationMoyenne} L/100km
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            {p.consommationMoyenne || '7.5'} L/100km
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditPlein(p)}
                            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Modifier les données du plein"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPleinForDetail(p)}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Voir les détails complets du plein"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item: p, type: 'plein', loading: false })}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer cet enregistrement"
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

      {/* Tab 2: Cartes Carburant */}
      {activeTab === 'cartes' && (
        <div className="space-y-4">
          {/* Search Toolbar for Cartes */}
          <motion.div 
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par N° carte, fournisseur, véhicule, service MEF..."
                value={carteSearchTerm}
                onChange={(e) => setCarteSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] font-medium"
              />
              {carteSearchTerm && (
                <button 
                  onClick={() => setCarteSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500">
              Affichage de <span className="text-[#0A1E3F] font-extrabold">{filteredCartes.length}</span> carte(s) sur {cartes.length}
            </div>
          </motion.div>

          {/* Cartes Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {filteredCartes.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200/80">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-500">Aucune carte carburant ne correspond à votre recherche.</span>
              </div>
            ) : (
              filteredCartes.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-[#0A1E3F] text-sm flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F4F6FB] flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-[#C59B27]" />
                    </div>
                    {c.fournisseur}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Card Activation / Deactivation Toggle Switch */}
                    <div 
                      onClick={async () => {
                        try {
                          const newStatus = c.statut === 'ACTIVE' ? 'DESACTIVEE' : 'ACTIVE';
                          await carburantService.enregistrerCarte({
                            ...c,
                            statut: newStatus
                          });
                          toast.success(`Carte ${newStatus === 'ACTIVE' ? 'activée' : 'désactivée'} avec succès !`);
                          fetchData();
                        } catch (err) {
                          toast.error('Erreur lors de la modification du statut');
                        }
                      }}
                      className="flex items-center gap-1.5 cursor-pointer group select-none"
                      title={c.statut === 'ACTIVE' ? 'Cliquer pour désactiver la carte' : 'Cliquer pour activer la carte'}
                    >
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                        c.statut === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {c.statut === 'ACTIVE' ? 'Actif' : 'Désactivé'}
                      </span>

                      {/* Toggle Switch Pill */}
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center flex-shrink-0 ${
                        c.statut === 'ACTIVE' ? 'bg-[#0D7A5F]' : 'bg-slate-300'
                      }`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          c.statut === 'ACTIVE' ? 'translate-x-[16px]' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCarte(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Modifier la carte"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, item: c, type: 'carte', loading: false })}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer la carte"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 font-mono font-extrabold text-lg text-[#0A1E3F] tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#C59B27]" /> {c.numeroCarte}</span>
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-500">Véhicule Attribué</span> 
                    <span className="font-bold text-[#0A1E3F]">{c.vehiculeImmatriculation || 'Non attribué'}</span>
                  </div>
                  <div className="flex justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-500">Service MEF</span> 
                    <span className="font-bold text-[#0A1E3F]">{c.serviceAttribue || 'Non spécifié'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Solde Restant</span>
                  <span className="text-sm font-black text-[#0A1E3F]">{c.solde ? c.solde.toLocaleString() : '0'} MAD</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Plafond Mensuel</span>
                  <span className="text-xs font-bold text-slate-600">{c.plafondMensuel ? c.plafondMensuel.toLocaleString() : '0'} MAD</span>
                </div>
              </div>
            </div>
          ))
        )}
          </motion.div>
        </div>
      )}

      {/* Tab 3: Anomalies */}
      {activeTab === 'anomalies' && (
        <motion.div 
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0A1E3F]">Surconsommations & Irrégularités Détectées</h3>
                <p className="text-xs text-slate-500">Pleins dépassant 12 L/100km ou +20% par rapport à la consommation théorique</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Date</th>
                  <th>Consommation Réelle</th>
                  <th>Litres & Montant</th>
                  <th>Observation</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <span className="text-xs font-bold text-slate-500">Aucune anomalie de surconsommation détectée.</span>
                    </td>
                  </tr>
                ) : (
                  anomalies.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <MoroccanPlate immatriculation={a.immatriculation} />
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{a.marqueModele}</div>
                      </td>
                      <td className="text-slate-600 font-bold">
                        {new Date(a.datePlein).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                          ⚠️ {a.consommationMoyenne} L/100km
                        </span>
                      </td>
                      <td className="font-bold text-[#0A1E3F]">
                        {a.quantiteLitres} L <span className="text-slate-400 font-normal">({a.montantTTC} MAD)</span>
                      </td>
                      <td className="text-slate-500 italic text-xs">
                        {a.observation || 'Anomalie automatique surconsommation'}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedPleinForDetail(a)}
                          className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer ml-auto"
                          title="Voir les détails complets"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Modal - Saisir un Plein */}
      <AnimatePresence>
        {showPleinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h3 className="text-lg font-black font-outfit text-[#0A1E3F] flex items-center gap-2">
                   <div className="w-8 h-8 rounded-xl bg-[#C59B27]/10 flex items-center justify-center text-[#C59B27]">
                    <Fuel className="w-4 h-4" />
                  </div>
                  Saisir un Plein de Carburant
                </h3>
                <button onClick={() => setShowPleinModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              <form onSubmit={handlePleinSubmit} className="p-5 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Véhicule *</label>
                  <select
                    required
                    value={pleinForm.vehiculeId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const selVeh = vehicules.find(v => String(v.id) === String(vId));
                      const autoFuel = selVeh?.typeCarburant || 'DIESEL';
                      const assignedCard = cartes.find(c => c.statut === 'ACTIVE' && String(c.vehiculeId) === String(vId));
                      setPleinForm(prev => ({
                        ...prev,
                        vehiculeId: vId,
                        carteCarburantId: assignedCard ? String(assignedCard.id) : '',
                        typeCarburant: autoFuel,
                        kilometrage: selVeh?.kilometrageActuel ? String(selVeh.kilometrageActuel) : prev.kilometrage
                      }));
                    }}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="">Sélectionner un véhicule...</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele} ({v.typeCarburant ? (FUEL_LABELS[v.typeCarburant] || v.typeCarburant) : 'Diesel'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Quantité (Litres) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="ex: 55.0"
                      value={pleinForm.quantiteLitres}
                      onChange={(e) => setPleinForm({ ...pleinForm, quantiteLitres: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Prix Unitaire (MAD/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pleinForm.prixUnitaire}
                      onChange={(e) => setPleinForm({ ...pleinForm, prixUnitaire: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Kilométrage du Plein *</label>
                    <input
                      type="number"
                      required
                      placeholder="Km au moment du plein"
                      value={pleinForm.kilometrage}
                      onChange={(e) => setPleinForm({ ...pleinForm, kilometrage: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Montant TTC (MAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Calculé automatiquement"
                      value={pleinForm.montantTTC}
                      onChange={(e) => setPleinForm({ ...pleinForm, montantTTC: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Carte Carburant</label>
                  <select
                    value={pleinForm.carteCarburantId}
                    onChange={(e) => setPleinForm({ ...pleinForm, carteCarburantId: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="">Espèces / Bon papier</option>
                    {cartes
                      .filter(c => c.statut === 'ACTIVE')
                      .filter(c => !c.vehiculeId || String(c.vehiculeId) === String(pleinForm.vehiculeId))
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.numeroCarte} - {c.fournisseur} ({c.solde || 0} MAD) {c.vehiculeId ? '📌 Carte Attribuée' : '(Réserve)'}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Station Service</label>
                  <input
                    type="text"
                    value={pleinForm.stationService}
                    onChange={(e) => setPleinForm({ ...pleinForm, stationService: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowPleinModal(false)}
                    className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    Enregistrer le Plein
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Carte Carburant */}
      <AnimatePresence>
        {showCarteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[500px] overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h3 className="text-lg font-black font-outfit text-[#0A1E3F] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C59B27]/10 flex items-center justify-center text-[#C59B27]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  Nouvelle Carte Carburant
                </h3>
                <button onClick={() => setShowCarteModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleCarteSubmit} className="p-5 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Numéro de Carte *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 7001-9988-5555-0001"
                    value={carteForm.numeroCarte}
                    onChange={(e) => setCarteForm({ ...carteForm, numeroCarte: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Fournisseur *</label>
                    <select
                      value={carteForm.fournisseur}
                      onChange={(e) => setCarteForm({ ...carteForm, fournisseur: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    >
                      <option value="TotalEnergies">TotalEnergies</option>
                      <option value="Afriquia">Afriquia</option>
                      <option value="Shell">Shell</option>
                      <option value="Ola Energy">Ola Energy</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Plafond Mensuel (MAD)</label>
                    <input
                      type="number"
                      value={carteForm.plafondMensuel}
                      onChange={(e) => setCarteForm({ ...carteForm, plafondMensuel: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Affectation Véhicule</label>
                  <select
                    value={carteForm.vehiculeId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const selVeh = vehicules.find(v => String(v.id) === String(vId));
                      setCarteForm(prev => ({
                        ...prev,
                        vehiculeId: vId,
                        serviceAttribue: selVeh?.direction || prev.serviceAttribue || 'Service Logistique'
                      }));
                    }}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="">Non attribuée (Carte de Réserve Service)</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Service MEF / Direction Attribuée *</label>
                  <select
                    value={carteForm.serviceAttribue || 'Service Logistique'}
                    onChange={(e) => setCarteForm({ ...carteForm, serviceAttribue: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="Service Logistique">Service Logistique</option>
                    <option value="Service du Parc Automobile">Service du Parc Automobile</option>
                    <option value="Service du Matériel & Approvisionnement">Service du Matériel & Approvisionnement</option>
                    <option value="Service Informatique & Télécoms">Service Informatique & Télécoms</option>
                    <option value="Service de la Comptabilité & Regie">Service de la Comptabilité & Régie</option>
                    <option value="Direction du Budget">Direction du Budget (DB)</option>
                    <option value="Direction Générale des Impôts">Direction Générale des Impôts (DGI)</option>
                    <option value="Administration des Douanes">Administration des Douanes (ADII)</option>
                    <option value="Trésorerie Générale du Royaume">Trésorerie Générale du Royaume (TGR)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button type="button" onClick={() => setShowCarteModal(false)} className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer">Annuler</button>
                  <button type="submit" className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer">Enregistrer la Carte</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RICH DETAIL MODAL - FICHE DU PLEIN */}
      <AnimatePresence>
        {selectedPleinForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[620px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-[#0A1E3F] text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530]">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-outfit font-extrabold text-lg text-white">Fiche du Plein de Carburant #{selectedPleinForDetail.id}</h2>
                    <p className="text-xs text-[#D7B14A]">Ministère de l'Économie et des Finances MEF</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPleinForDetail(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                
                {/* Status Alert Banner */}
                {selectedPleinForDetail.anomalieSurconsommation ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-xs text-amber-900 block">Surconsommation Détectée ({selectedPleinForDetail.consommationMoyenne} L/100km)</span>
                      <span className="text-[11px] text-amber-700 leading-relaxed">
                        Cette consommation dépasse le seuil toléré ou la moyenne théorique du véhicule. Signalé automatiquement dans le rapport mensuel.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs text-emerald-900 block">Consommation Conforme ({selectedPleinForDetail.consommationMoyenne || '7.5'} L/100km)</span>
                      <span className="text-[11px] text-emerald-700">Plein validé sans anomalie de surconsommation.</span>
                    </div>
                  </div>
                )}

                {/* Section 1: Vehicle & Direction */}
                <div className="bg-[#F4F6FB] rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Véhicule & Direction MEF</span>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <MoroccanPlate immatriculation={selectedPleinForDetail.immatriculation} />
                      <span className="text-xs font-bold text-[#0A1E3F] block mt-1.5">{selectedPleinForDetail.marqueModele}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#0A1E3F] bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block shadow-sm">
                        {selectedPleinForDetail.direction || 'Direction du Budget'}
                      </span>
                      {selectedPleinForDetail.conducteurNomPrenom && (
                        <span className="text-[11px] text-slate-500 block mt-1">Conducteur: {selectedPleinForDetail.conducteurNomPrenom}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Refuel & Finance Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Date & Heure</span>
                    <span className="text-xs font-black text-[#0A1E3F] block mt-1">
                      {new Date(selectedPleinForDetail.datePlein).toLocaleDateString('fr-FR')} à {new Date(selectedPleinForDetail.datePlein).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Station Service</span>
                    <span className="text-xs font-black text-[#0A1E3F] block mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                      {selectedPleinForDetail.stationService || 'Station Service MEF'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Volume Litres</span>
                    <span className="text-xs font-black text-[#0A1E3F] block mt-1">
                      {selectedPleinForDetail.quantiteLitres} Litres ({FUEL_LABELS[selectedPleinForDetail.typeCarburant] || selectedPleinForDetail.typeCarburant || 'Diesel'})
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Prix Unitaire</span>
                    <span className="text-xs font-black text-[#0A1E3F] block mt-1">
                      {selectedPleinForDetail.prixUnitaire ? selectedPleinForDetail.prixUnitaire.toFixed(2) : '12.80'} MAD / L
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Montant Total TTC</span>
                    <span className="text-sm font-black text-[#C59B27] block mt-1">
                      {selectedPleinForDetail.montantTTC ? selectedPleinForDetail.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Kilométrage au Plein</span>
                    <span className="text-xs font-mono font-black text-[#0A1E3F] block mt-1">
                      {selectedPleinForDetail.kilometrage ? selectedPleinForDetail.kilometrage.toLocaleString() : '-'} km
                    </span>
                  </div>
                </div>

                {/* Section 3: Carte & Traçabilité */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Traçabilité & Mode de Paiement</span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block">Mode / Carte :</span>
                      <span className="font-bold text-[#0A1E3F]">
                        {selectedPleinForDetail.numeroCarteCarburant ? `Carte 💳 ${selectedPleinForDetail.numeroCarteCarburant}` : 'Espèces / Bon de régie'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Ticket / Facture :</span>
                      <span className="font-mono text-slate-700">
                        {selectedPleinForDetail.referenceTicket ? `Ticket: ${selectedPleinForDetail.referenceTicket}` : 'Réf N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Observation */}
                {selectedPleinForDetail.observation && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-[#0A1E3F] block mb-1">Observation :</span>
                    <p className="text-slate-600 italic">{selectedPleinForDetail.observation}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-2xl">
                <button
                  onClick={() => setSelectedPleinForDetail(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Fermer la Fiche
                </button>
                <button
                  onClick={() => {
                    const itemToEdit = selectedPleinForDetail;
                    setSelectedPleinForDetail(null);
                    handleEditPlein(itemToEdit);
                  }}
                  className="gold-gradient-bg text-[#071530] font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4" /> Modifier ce Plein
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'plein' ? "Suppression du Plein de Carburant" : "Suppression de la Carte Carburant"}
        message={
          deleteModal.type === 'plein'
            ? `Voulez-vous vraiment supprimer ce plein enregistrer pour le véhicule ${deleteModal.item?.immatriculation} (${deleteModal.item?.quantiteLitres}L - ${deleteModal.item?.montantTTC} MAD) ?`
            : `Voulez-vous vraiment supprimer la carte carburant ${deleteModal.item?.numeroCarte} (${deleteModal.item?.fournisseur}) ?`
        }
        badgeText="Action irréversible sur le registre du Parc MEF"
        confirmText="Confirmer la suppression"
        cancelText="Annuler"
        variant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, item: null, type: 'plein', loading: false })}
      />

    </div>
  );
}
