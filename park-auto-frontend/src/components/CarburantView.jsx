import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, CreditCard, AlertTriangle, Plus, Search, Filter, RefreshCw, MapPin, Gauge, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { carburantService } from '../services/carburantService';
import { vehiculeService } from '../services/vehiculeService';

export default function CarburantView() {
  const [activeTab, setActiveTab] = useState('pleins'); // 'pleins', 'cartes', 'anomalies'
  const [pleins, setPleins] = useState([]);
  const [cartes, setCartes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  // Modals state
  const [showPleinModal, setShowPleinModal] = useState(false);
  const [showCarteModal, setShowCarteModal] = useState(false);

  // Form State - Refuel
  const [pleinForm, setPleinForm] = useState({
    vehiculeId: '',
    carteCarburantId: '',
    quantiteLitres: '',
    prixUnitaire: '12.80',
    montantTTC: '',
    kilometrage: '',
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
      setPleinForm({ vehiculeId: '', carteCarburantId: '', quantiteLitres: '', prixUnitaire: '12.80', montantTTC: '', kilometrage: '', stationService: 'TotalEnergies Agdal Rabat', referenceTicket: '', referenceFacture: '', observation: '' });
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
        plafondMensuel: parseFloat(carteForm.plafondMensuel),
        solde: parseFloat(carteForm.solde)
      };
      await carburantService.enregistrerCarte(payload);
      toast.success('Carte carburant enregistrée avec succès');
      setShowCarteModal(false);
      setCarteForm({ numeroCarte: '', fournisseur: 'TotalEnergies', vehiculeId: '', serviceAttribue: '', plafondMensuel: '3500', solde: '3500', dateExpiration: '', observation: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l’enregistrement de la carte');
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

  const directionsList = Array.from(new Set(pleins.map(p => p.direction).filter(Boolean)));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
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
              Gestion des consommations (L/100km), cartes Total/Afriquia et alerte de surconsommation
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
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Saisir un Plein
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
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

        <button 
          onClick={fetchData} 
          className="ml-auto p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Tab 1: Refuels List */}
      {activeTab === 'pleins' && (
        <motion.div 
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par immatriculation, marque, station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#C59B27] transition-colors"
              />
            </div>

            {directionsList.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer focus:border-[#C59B27] transition-colors"
                >
                  <option value="ALL">Toutes les Directions</option>
                  {directionsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Date & Station</th>
                  <th>Véhicule</th>
                  <th>Litrage & Carburant</th>
                  <th>Montant TTC</th>
                  <th>Kilométrage</th>
                  <th>Consommation & Alerte</th>
                  <th>Carte / Réf</th>
                </tr>
              </thead>
              <tbody>
                {filteredPleins.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12">
                      <div className="flex flex-col items-center justify-center text-center gap-3">
                        <Info className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-bold text-slate-500">Aucun plein de carburant enregistré.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPleins.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="font-bold text-[#0A1E3F]">
                          {new Date(p.datePlein).toLocaleDateString('fr-FR')} {new Date(p.datePlein).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C59B27]" /> {p.stationService}
                        </div>
                      </td>

                      <td>
                        <span className="font-mono font-bold text-[#0A1E3F] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {p.immatriculation}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{p.marqueModele}</div>
                      </td>

                      <td className="font-bold text-[#0A1E3F]">
                        {p.quantiteLitres} L
                        <span className="ml-2 text-[10px] uppercase font-bold text-[#C59B27] bg-[#C59B27]/10 px-1.5 py-0.5 rounded">
                          {p.typeCarburant}
                        </span>
                      </td>

                      <td className="font-extrabold text-[#0A1E3F]">
                        {p.montantTTC ? p.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                      </td>

                      <td className="font-mono text-slate-700">
                        {p.kilometrage ? p.kilometrage.toLocaleString() : '-'} km
                      </td>

                      <td>
                        {p.anomalieSurconsommation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            ⚠️ Surconsommation ({p.consommationMoyenne} L/100km)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[11px]">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            {p.consommationMoyenne || '7.5'} L/100km
                          </span>
                        )}
                      </td>

                      <td className="text-slate-500 text-[11px]">
                        {p.numeroCarteCarburant ? (
                          <div className="font-mono text-[#0A1E3F] font-bold">💳 {p.numeroCarteCarburant}</div>
                        ) : (
                          <div>Espèces / Bon</div>
                        )}
                        {p.referenceTicket && <div className="text-slate-400">Réf: {p.referenceTicket}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Fuel Cards */}
      {activeTab === 'cartes' && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {cartes.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-[#0A1E3F] text-sm flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F4F6FB] flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-[#C59B27]" />
                    </div>
                    {c.fournisseur}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    c.statut === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {c.statut}
                  </span>
                </div>

                <div className="mt-4 font-mono font-extrabold text-lg text-[#0A1E3F] tracking-wider">
                  {c.numeroCarte}
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-500">Véhicule</span> 
                    <span className="font-bold text-[#0A1E3F]">{c.vehiculeImmatriculation || 'Non attribué'}</span>
                  </div>
                  <div className="flex justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-500">Service</span> 
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
          ))}
          {cartes.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
              <CreditCard className="w-8 h-8 text-slate-300" />
              <span className="text-xs font-bold text-slate-500">Aucune carte carburant enregistrée.</span>
            </div>
          )}
        </motion.div>
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
                </tr>
              </thead>
              <tbody>
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12">
                      <div className="flex flex-col items-center justify-center text-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-bold text-slate-500">Aucune anomalie de surconsommation détectée.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  anomalies.map((a) => (
                    <tr key={a.id}>
                      <td className="font-bold text-[#0A1E3F]">
                        {a.immatriculation} <span className="text-slate-500 font-normal">({a.marqueModele})</span>
                      </td>
                      <td className="text-slate-600">
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
                      <td className="text-slate-500 italic">
                        {a.observation || 'Anomalie automatique surconsommation'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
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
                <button onClick={() => setShowPleinModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              <form onSubmit={handlePleinSubmit} className="p-5 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Véhicule *</label>
                  <select
                    required
                    value={pleinForm.vehiculeId}
                    onChange={(e) => setPleinForm({ ...pleinForm, vehiculeId: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="">Sélectionner un véhicule...</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele} ({v.kilometrageActuel || 0} km)
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
                    {cartes.map(c => (
                      <option key={c.id} value={c.id}>{c.numeroCarte} - {c.fournisseur} ({c.solde || 0} MAD)</option>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h3 className="text-lg font-black font-outfit text-[#0A1E3F] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C59B27]/10 flex items-center justify-center text-[#C59B27]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  Ajouter une Carte Carburant
                </h3>
                <button onClick={() => setShowCarteModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              <form onSubmit={handleCarteSubmit} className="p-5 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Numéro de Carte *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 7001-9988-1234-0005"
                    value={carteForm.numeroCarte}
                    onChange={(e) => setCarteForm({ ...carteForm, numeroCarte: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Fournisseur</label>
                    <select
                      value={carteForm.fournisseur}
                      onChange={(e) => setCarteForm({ ...carteForm, fournisseur: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    >
                      <option value="TotalEnergies">TotalEnergies</option>
                      <option value="Afriquia">Afriquia</option>
                      <option value="Winxo">Winxo</option>
                      <option value="Shell">Shell</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#0A1E3F] block mb-1.5">Plafond Mensuel (MAD)</label>
                    <input
                      type="number"
                      value={carteForm.plafondMensuel}
                      onChange={(e) => setCarteForm({ ...carteForm, plafondMensuel: e.target.value, solde: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Attribué au Véhicule</label>
                  <select
                    value={carteForm.vehiculeId}
                    onChange={(e) => setCarteForm({ ...carteForm, vehiculeId: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  >
                    <option value="">Aucun (Carte de réserve)</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0A1E3F] block mb-1.5">Date d'Expiration</label>
                  <input
                    type="date"
                    value={carteForm.dateExpiration}
                    onChange={(e) => setCarteForm({ ...carteForm, dateExpiration: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowCarteModal(false)}
                    className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    Créer la Carte
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
