import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, ShieldAlert, AlertTriangle, Calendar, Plus, RefreshCw, CheckCircle2, Clock, Car, Filter, X, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { maintenanceService } from '../services/maintenanceService';
import { vehiculeService } from '../services/vehiculeService';

export default function MaintenanceView() {
  const [activeTab, setActiveTab] = useState('interventions'); // 'interventions', 'alertes'
  const [interventions, setInterventions] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, PREVENTIVE, CURATIVE
  const [filterStatut, setFilterStatut] = useState('ALL');

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    vehiculeId: '',
    typeMaintenance: 'PREVENTIVE',
    natureOperation: 'VIDANGE',
    datePrevisionnelle: new Date().toISOString().split('T')[0],
    kilometragePrevu: '',
    prestataire: 'Garage Agréé MEF',
    coutMainOeuvre: '350',
    coutPieces: '850',
    montantTotal: '1200',
    piecesRemplacees: '',
    statut: 'PROGRAMMEE',
    immobilisation: false,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iData, aData, vData] = await Promise.all([
        maintenanceService.getInterventions().catch(() => []),
        maintenanceService.getAlertes().catch(() => []),
        vehiculeService.getVehicules().catch(() => [])
      ]);
      setInterventions(Array.isArray(iData) ? iData : (iData?.data || iData?.content || []));
      setAlertes(Array.isArray(aData) ? aData : (aData?.data || aData?.content || []));
      const vList = Array.isArray(vData) ? vData : (vData?.content || vData?.data || []);
      setVehicules(Array.isArray(vList) ? vList : []);
    } catch (err) {
      console.error('Erreur chargement maintenance:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
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

  const filteredInterventions = interventions.filter(item => {
    const matchType = filterType === 'ALL' || item.typeMaintenance === filterType;
    const matchStatut = filterStatut === 'ALL' || item.statut === filterStatut;
    return matchType && matchStatut;
  });

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
            Maintenance du Parc & Alertes Légales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Planification préventive (90% seuil km), pannes curatives et suivi des contrôles/assurances
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Programmer
        </button>
      </motion.div>

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
            Alertes & Échéances ({alertes.length})
          </button>
        </div>

        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab 1: Interventions List */}
      {activeTab === 'interventions' && (
        <div className="space-y-4">
          {/* Filters */}
          <motion.div 
            className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Filtrer:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Tous les Types</option>
              <option value="PREVENTIVE">Maintenance Préventive</option>
              <option value="CURATIVE">Réparation Curative</option>
            </select>

            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="PROGRAMMEE">Programmée</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </motion.div>

          {/* Table */}
          <motion.div 
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#0A1E3F] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#C59B27]" /> Liste des Interventions
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Type & Opération</th>
                    <th>Date Prévisionnelle</th>
                    <th>Prestataire & Description</th>
                    <th>Coût Total</th>
                    <th>Immobilisation</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Wrench className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-xs font-bold text-slate-500">Aucune intervention de maintenance trouvée.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="font-mono font-bold text-[#0A1E3F] bg-[#F4F6FB] px-2 py-1 rounded inline-block border border-slate-200/60">
                            {i.immatriculation}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 font-medium">{i.marqueModele}</div>
                        </td>

                        <td>
                          <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            i.typeMaintenance === 'PREVENTIVE' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {i.typeMaintenance}
                          </span>
                          <div className="font-bold text-[#0A1E3F] mt-1">{i.natureOperation}</div>
                        </td>

                        <td className="text-slate-600 font-medium">
                          {i.datePrevisionnelle ? new Date(i.datePrevisionnelle).toLocaleDateString('fr-FR') : '-'}
                          {i.kilometragePrevu && <div className="text-[11px] text-slate-400 mt-0.5">{i.kilometragePrevu.toLocaleString()} km</div>}
                        </td>

                        <td>
                          <div className="font-bold text-[#0A1E3F]">{i.prestataire}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{i.description || i.piecesRemplacees}</div>
                        </td>

                        <td className="font-extrabold text-[#0A1E3F]">
                          {i.montantTotal ? i.montantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </td>

                        <td>
                          {i.immobilisation ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                              Immobilisé
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">Non</span>
                          )}
                        </td>

                        <td>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            i.statut === 'TERMINEE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            i.statut === 'EN_COURS' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                            i.statut === 'PROGRAMMEE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {i.statut}
                          </span>
                        </td>
                      </tr>
                    ))
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          {alertes.length === 0 ? (
            <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-[#0A1E3F] text-sm">Aucune alerte active</h4>
              <p className="text-xs text-slate-500 mt-1">Tous les véhicules sont en règle et les révisions à jour.</p>
            </div>
          ) : (
            alertes.map((a) => {
              const isCrit = a.niveauSeverite === 'CRITIQUE';
              const isWarn = a.niveauSeverite === 'ATTENTION';

              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between ${
                    isCrit ? 'border-l-4 border-l-rose-500' :
                    isWarn ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-blue-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                      <span className="font-mono font-bold text-[#0A1E3F] text-xs bg-[#F4F6FB] px-2.5 py-1 rounded-lg border border-slate-200">
                        {a.immatriculation}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        isCrit ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        isWarn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {a.typeAlerte}
                      </span>
                    </div>

                    <div className="mt-4 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCrit ? 'bg-rose-50 text-rose-600' : isWarn ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#0A1E3F] leading-tight">{a.titre}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{a.message}</p>
                        <div className="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                          <Car className="w-3 h-3" /> {a.marqueModele} ({a.direction || 'Direction MEF'})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col gap-1 text-[11px]">
                      {a.dateEcheance && (
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Échéance : {new Date(a.dateEcheance).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {a.kilometrageActuel && (
                        <span className="font-mono text-slate-600 font-bold flex items-center gap-1">
                          Gauge : {a.kilometrageActuel} / {a.kilometrageSeuil} km
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setForm({ ...form, vehiculeId: a.vehiculeId || '', kilometragePrevu: a.kilometrageSeuil || '' });
                        setShowModal(true);
                      }}
                      className="border border-[#E2E8F0] hover:bg-[#F4F6FB] text-[#0A1E3F] font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Traiter
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Modal - Programmer Intervention */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F4F6FB] rounded-xl flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-[#C59B27]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0A1E3F]">Programmer une Maintenance</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Véhicule *</label>
                  <select
                    required
                    value={form.vehiculeId}
                    onChange={(e) => setForm({ ...form, vehiculeId: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                  >
                    <option value="">Sélectionner un véhicule...</option>
                    {(Array.isArray(vehicules) ? vehicules : []).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele} ({v.kilometrageActuel || 0} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Type de Maintenance</label>
                    <select
                      value={form.typeMaintenance}
                      onChange={(e) => setForm({ ...form, typeMaintenance: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                    >
                      <option value="PREVENTIVE">Préventive (Révision)</option>
                      <option value="CURATIVE">Curative (Réparation / Panne)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Nature de l'Opération</label>
                    <select
                      value={form.natureOperation}
                      onChange={(e) => setForm({ ...form, natureOperation: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                    >
                      <option value="VIDANGE">Vidange Moteur</option>
                      <option value="FILTRES">Filtres (Air, Huile, Habitacle)</option>
                      <option value="PNEUMATIQUES">Changement Pneumatiques</option>
                      <option value="FREINS">Freins (Plaquettes/Disques)</option>
                      <option value="BATTERIE">Batterie</option>
                      <option value="CLIMATISATION">Climatisation</option>
                      <option value="REVISION_PERIODIQUE">Révision Périodique</option>
                      <option value="REPARATION_PANNE">Réparation Panne</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Date Prévisionnelle</label>
                    <input
                      type="date"
                      value={form.datePrevisionnelle}
                      onChange={(e) => setForm({ ...form, datePrevisionnelle: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Statut</label>
                    <select
                      value={form.statut}
                      onChange={(e) => setForm({ ...form, statut: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer"
                    >
                      <option value="PROGRAMMEE">Programmée</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINEE">Terminée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Prestataire / Garage</label>
                    <input
                      type="text"
                      value={form.prestataire}
                      onChange={(e) => setForm({ ...form, prestataire: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Montant Total Estimé (MAD)</label>
                    <input
                      type="number"
                      value={form.montantTotal}
                      onChange={(e) => setForm({ ...form, montantTotal: e.target.value })}
                      className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center">
                      <Car className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0A1E3F] block">Immobilisation du Véhicule</span>
                      <span className="text-[10px] text-slate-500">Le véhicule sera indisponible</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.immobilisation}
                      onChange={(e) => setForm({ ...form, immobilisation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C59B27]"></div>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0A1E3F] block mb-1.5">Description & Pièces à remplacer</label>
                  <textarea
                    rows="3"
                    placeholder="Détail de l'intervention..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27] resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                  >
                    Enregistrer l'Intervention
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
