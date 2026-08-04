import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, CreditCard, AlertTriangle, Plus, Search, Filter, RefreshCw, CheckCircle2, TrendingUp, X, MapPin, Gauge } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      setPleins(pData || []);
      setCartes(cData || []);
      setVehicules(vData || []);
      setAnomalies(aData || []);
    } catch (err) {
      console.error('Erreur chargement données carburant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePleinSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
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
      setSuccessMsg('Plein de carburant enregistré avec succès');
      setShowPleinModal(false);
      setPleinForm({ vehiculeId: '', carteCarburantId: '', quantiteLitres: '', prixUnitaire: '12.80', montantTTC: '', kilometrage: '', stationService: 'TotalEnergies Agdal Rabat', referenceTicket: '', referenceFacture: '', observation: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement du plein');
    }
  };

  const handleCarteSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...carteForm,
        vehiculeId: carteForm.vehiculeId ? Number(carteForm.vehiculeId) : null,
        plafondMensuel: parseFloat(carteForm.plafondMensuel),
        solde: parseFloat(carteForm.solde)
      };
      await carburantService.enregistrerCarte(payload);
      setSuccessMsg('Carte carburant enregistrée avec succès');
      setShowCarteModal(false);
      setCarteForm({ numeroCarte: '', fournisseur: 'TotalEnergies', vehiculeId: '', serviceAttribue: '', plafondMensuel: '3500', solde: '3500', dateExpiration: '', observation: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement de la carte');
    }
  };

  // Filtered pleins sorted by date descending
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
    <div className="flex-1 p-7 overflow-y-auto zellige-pattern min-h-screen">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">

        {/* Banner */}
        <motion.div
          className="relative bg-white rounded-2xl border border-cardline shadow-sm px-6 py-5 overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 card-zellij-watermark opacity-60 pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#C47D2B] flex items-center justify-center text-white shadow-md">
                <Fuel className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black font-outfit text-[#0A1E3F] leading-tight">
                    Suivi du Carburant & Cartes Dotation
                  </h2>
                  <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">تتبع الوقود وبطاقات التزويد</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Gestion des consommations (L/100km), cartes Total/Afriquia et alerte de surconsommation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCarteModal(true)}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl transition-colors border border-slate-200"
              >
                <CreditCard className="w-4 h-4 text-[#C59B27]" />
                Nouvelle Carte
              </button>
              <button
                onClick={() => setShowPleinModal(true)}
                className="inline-flex items-center gap-2 gold-gradient-bg text-[#071530] font-black text-xs px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Saisir un Plein
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}</span>
            <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600" /> {errorMsg}</span>
            <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pleins')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'pleins'
                  ? 'bg-[#0A1E3F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Fuel className="w-4 h-4" />
              Historique des Pleins ({pleins.length})
            </button>
            <button
              onClick={() => setActiveTab('cartes')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'cartes'
                  ? 'bg-[#0A1E3F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cartes Carburant ({cartes.length})
            </button>
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'anomalies'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Anomalies de Surconsommation ({anomalies.length})
            </button>
          </div>

          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab 1: Refuels List */}
        {activeTab === 'pleins' && (
          <div className="bg-white rounded-2xl border border-cardline shadow-sm p-6 flex flex-col gap-5">
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap justify-between">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par immatriculation, marque, station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C59B27] outline-none"
                />
              </div>

              {directionsList.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value)}
                    className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="ALL">Toutes les Directions MEF</option>
                    {directionsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-[#0A1E3F] uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Station</th>
                    <th className="py-3 px-4">Véhicule</th>
                    <th className="py-3 px-4">Litrage & Carburant</th>
                    <th className="py-3 px-4">Montant TTC</th>
                    <th className="py-3 px-4">Kilométrage</th>
                    <th className="py-3 px-4">Consommation & Alerte</th>
                    <th className="py-3 px-4">Carte / Réf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPleins.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                        Aucun plein de carburant enregistré.
                      </td>
                    </tr>
                  ) : (
                    filteredPleins.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0A1E3F]">
                            {new Date(p.datePlein).toLocaleDateString('fr-FR')} {new Date(p.datePlein).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#C59B27]" /> {p.stationService}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#0A1E3F] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {p.immatriculation}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1 font-medium">{p.marqueModele}</div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#0A1E3F]">
                          {p.quantiteLitres} L
                          <span className="ml-2 text-[10px] uppercase font-bold text-[#C59B27] bg-[#C59B27]/10 px-1.5 py-0.5 rounded">
                            {p.typeCarburant}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-[#0A1E3F]">
                          {p.montantTTC ? p.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {p.kilometrage ? p.kilometrage.toLocaleString() : '-'} km
                        </td>

                        {/* Pro-Tip 2: Highlight overconsumption rows with an amber/orange warning badge */}
                        <td className="py-3.5 px-4">
                          {p.anomalieSurconsommation ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              ⚠️ Surconsommation ({p.consommationMoyenne} L/100km)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              <Gauge className="w-3 h-3" />
                              {p.consommationMoyenne || '7.5'} L/100km
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
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
          </div>
        )}

        {/* Tab 2: Fuel Cards */}
        {activeTab === 'cartes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cartes.map((c) => (
              <motion.div
                key={c.id}
                className="bg-white rounded-2xl border border-cardline shadow-sm p-5 relative overflow-hidden flex flex-col justify-between"
                whileHover={{ y: -2 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C59B27]/10 to-transparent pointer-events-none rounded-bl-full" />
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-extrabold text-[#0A1E3F] text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#C59B27]" />
                      {c.fournisseur}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      c.statut === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.statut}
                    </span>
                  </div>

                  <div className="mt-4 font-mono font-extrabold text-lg text-[#0A1E3F] tracking-wider">
                    {c.numeroCarte}
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-xs text-slate-600">
                    <div><span className="font-semibold text-slate-400">Véhicule :</span> {c.vehiculeImmatriculation || 'Non attribué'} ({c.vehiculeMarqueModele || '-'})</div>
                    <div><span className="font-semibold text-slate-400">Service :</span> {c.serviceAttribue || 'Non spécifié'}</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Solde Restant</span>
                    <span className="text-sm font-black text-[#0A1E3F]">{c.solde ? c.solde.toLocaleString() : '0'} MAD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Plafond Mensuel</span>
                    <span className="text-xs font-bold text-slate-600">{c.plafondMensuel ? c.plafondMensuel.toLocaleString() : '0'} MAD</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab 3: Anomalies */}
        {activeTab === 'anomalies' && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0A1E3F]">Surconsommations & Irrégularités Détectées</h3>
                <p className="text-xs text-slate-500">Pleins dépassant 12 L/100km ou +20% par rapport à la consommation théorique du véhicule</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-amber-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-50/70 border-b border-amber-200 text-[11px] font-black text-amber-900 uppercase">
                    <th className="py-3 px-4">Véhicule</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Consommation Réelle</th>
                    <th className="py-3 px-4">Litres & Montant</th>
                    <th className="py-3 px-4">Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-xs">
                  {anomalies.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                        Aucune anomalie de surconsommation détectée.
                      </td>
                    </tr>
                  ) : (
                    anomalies.map((a) => (
                      <tr key={a.id} className="bg-amber-50/30 hover:bg-amber-50/60">
                        <td className="py-3.5 px-4 font-bold text-[#0A1E3F]">
                          {a.immatriculation} ({a.marqueModele})
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {new Date(a.datePlein).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm">
                            ⚠️ {a.consommationMoyenne} L/100km
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0A1E3F]">
                          {a.quantiteLitres} L ({a.montantTTC} MAD)
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic">
                          {a.observation || 'Anomalie automatique surconsommation'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal - Saisir un Plein */}
      <AnimatePresence>
        {showPleinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-cardline overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black font-outfit text-[#0A1E3F] flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#C47D2B]" /> Saisir un Plein de Carburant
                </h3>
                <button onClick={() => setShowPleinModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              <form onSubmit={handlePleinSubmit} className="mt-4 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Véhicule *</label>
                  <select
                    required
                    value={pleinForm.vehiculeId}
                    onChange={(e) => setPleinForm({ ...pleinForm, vehiculeId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                  >
                    <option value="">Sélectionner un véhicule...</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele} ({v.kilometrageActuel || 0} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Quantité (Litres) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="ex: 55.0"
                      value={pleinForm.quantiteLitres}
                      onChange={(e) => setPleinForm({ ...pleinForm, quantiteLitres: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Prix Unitaire (MAD/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pleinForm.prixUnitaire}
                      onChange={(e) => setPleinForm({ ...pleinForm, prixUnitaire: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kilométrage du Plein *</label>
                    <input
                      type="number"
                      required
                      placeholder="Km au moment du plein"
                      value={pleinForm.kilometrage}
                      onChange={(e) => setPleinForm({ ...pleinForm, kilometrage: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Montant TTC (MAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Calculé automatiquement"
                      value={pleinForm.montantTTC}
                      onChange={(e) => setPleinForm({ ...pleinForm, montantTTC: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Carte Carburant</label>
                  <select
                    value={pleinForm.carteCarburantId}
                    onChange={(e) => setPleinForm({ ...pleinForm, carteCarburantId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                  >
                    <option value="">Espèces / Bon papier</option>
                    {cartes.map(c => (
                      <option key={c.id} value={c.id}>{c.numeroCarte} - {c.fournisseur} ({c.solde || 0} MAD)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Station Service</label>
                  <input
                    type="text"
                    value={pleinForm.stationService}
                    onChange={(e) => setPleinForm({ ...pleinForm, stationService: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPleinModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl gold-gradient-bg text-[#071530] font-black shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-cardline overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black font-outfit text-[#0A1E3F] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C59B27]" /> Ajouter une Carte Carburant
                </h3>
                <button onClick={() => setShowCarteModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              <form onSubmit={handleCarteSubmit} className="mt-4 flex flex-col gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Numéro de Carte *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 7001-9988-1234-0005"
                    value={carteForm.numeroCarte}
                    onChange={(e) => setCarteForm({ ...carteForm, numeroCarte: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Fournisseur</label>
                    <select
                      value={carteForm.fournisseur}
                      onChange={(e) => setCarteForm({ ...carteForm, fournisseur: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    >
                      <option value="TotalEnergies">TotalEnergies</option>
                      <option value="Afriquia">Afriquia</option>
                      <option value="Winxo">Winxo</option>
                      <option value="Shell">Shell</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Plafond Mensuel (MAD)</label>
                    <input
                      type="number"
                      value={carteForm.plafondMensuel}
                      onChange={(e) => setCarteForm({ ...carteForm, plafondMensuel: e.target.value, solde: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attribué au Véhicule</label>
                  <select
                    value={carteForm.vehiculeId}
                    onChange={(e) => setCarteForm({ ...carteForm, vehiculeId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                  >
                    <option value="">Aucun (Carte de réserve)</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date d'Expiration</label>
                  <input
                    type="date"
                    value={carteForm.dateExpiration}
                    onChange={(e) => setCarteForm({ ...carteForm, dateExpiration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCarteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0A1E3F] text-white font-bold shadow-sm"
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
