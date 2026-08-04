import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, ShieldAlert, AlertTriangle, Calendar, Plus, RefreshCw, CheckCircle2, Clock, Car, Filter, X, DollarSign } from 'lucide-react';
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
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      setInterventions(iData || []);
      setAlertes(aData || []);
      setVehicules(vData || []);
    } catch (err) {
      console.error('Erreur chargement maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
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
      setSuccessMsg('Intervention de maintenance enregistrée avec succès');
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement de l’intervention');
    }
  };

  // User Pro-Tip 3: Interventions sorted by date descending by default
  const filteredInterventions = interventions.filter(item => {
    const matchType = filterType === 'ALL' || item.typeMaintenance === filterType;
    const matchStatut = filterStatut === 'ALL' || item.statut === filterStatut;
    return matchType && matchStatut;
  });

  return (
    <div className="flex-1 p-7 overflow-y-auto zellige-pattern min-h-screen">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div
          className="relative bg-white rounded-2xl border border-cardline shadow-sm px-6 py-5 overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 card-zellij-watermark opacity-60 pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#0A1E3F] flex items-center justify-center text-[#C59B27] shadow-md">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black font-outfit text-[#0A1E3F] leading-tight">
                    Maintenance du Parc & Alertes Légales
                  </h2>
                  <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">صيانة الأسطول والتنبيهات Legal</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Planification préventive (90% seuil km), pannes curatives et suivi des contrôles/assurances
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 gold-gradient-bg text-[#071530] font-black text-xs px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Programmer une Intervention
              </button>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
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

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'interventions'
                  ? 'bg-[#0A1E3F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Interventions de Maintenance ({interventions.length})
            </button>
            <button
              onClick={() => setActiveTab('alertes')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'alertes'
                  ? 'bg-[#C47D2B] text-white shadow-sm'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Alertes & Échéances Légales ({alertes.length})
            </button>
          </div>

          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab 1: Interventions List */}
        {activeTab === 'interventions' && (
          <div className="bg-white rounded-2xl border border-cardline shadow-sm p-6 flex flex-col gap-5">
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Type :</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                >
                  <option value="ALL">Tous les Types</option>
                  <option value="PREVENTIVE">Maintenance Préventive</option>
                  <option value="CURATIVE">Réparation Curative</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Statut :</span>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                >
                  <option value="ALL">Tous les Statuts</option>
                  <option value="PROGRAMMEE">Programmée</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINEE">Terminée</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-[#0A1E3F] uppercase tracking-wider">
                    <th className="py-3 px-4">Véhicule</th>
                    <th className="py-3 px-4">Type & Opération</th>
                    <th className="py-3 px-4">Date Prévisionnelle</th>
                    <th className="py-3 px-4">Prestataire & Description</th>
                    <th className="py-3 px-4">Coût Total</th>
                    <th className="py-3 px-4">Immobilisation</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                        Aucune intervention de maintenance enregistrée.
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#0A1E3F] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {i.immatriculation}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">{i.marqueModele}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            i.typeMaintenance === 'PREVENTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {i.typeMaintenance}
                          </span>
                          <div className="font-bold text-[#0A1E3F] mt-1">{i.natureOperation}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {i.datePrevisionnelle ? new Date(i.datePrevisionnelle).toLocaleDateString('fr-FR') : '-'}
                          {i.kilometragePrevu && <div className="text-[11px] text-slate-400">{i.kilometragePrevu.toLocaleString()} km</div>}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0A1E3F]">{i.prestataire}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{i.description || i.piecesRemplacees}</div>
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-[#0A1E3F]">
                          {i.montantTotal ? i.montantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </td>

                        <td className="py-3.5 px-4">
                          {i.immobilisation ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              🚫 Immobilisé (EN_MAINTENANCE)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Non</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            i.statut === 'TERMINEE' ? 'bg-emerald-100 text-emerald-800' :
                            i.statut === 'EN_COURS' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            i.statut === 'PROGRAMMEE' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
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
          </div>
        )}

        {/* Tab 2: Alerts Panel */}
        {activeTab === 'alertes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {alertes.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Aucune alerte active</h4>
                <p className="text-xs text-slate-400 mt-1">Tous les véhicules sont en règle et les révisions à jour.</p>
              </div>
            ) : (
              alertes.map((a) => {
                const isCrit = a.niveauSeverite === 'CRITIQUE';
                const isWarn = a.niveauSeverite === 'ATTENTION';

                return (
                  <motion.div
                    key={a.id}
                    className={`rounded-2xl border p-5 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                      isCrit ? 'bg-rose-50/50 border-rose-200' :
                      isWarn ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-3 border-slate-200/60">
                        <span className="font-mono font-black text-[#0A1E3F] text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                          {a.immatriculation}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isCrit ? 'bg-rose-600 text-white shadow-sm' :
                          isWarn ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {a.typeAlerte}
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCrit ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#0A1E3F]">{a.titre}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">{a.message}</p>
                          <div className="text-[11px] text-slate-400 mt-1">Véhicule : {a.marqueModele} ({a.direction || 'Direction MEF'})</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      {a.dateEcheance && (
                        <span className="text-slate-500 font-semibold">
                          📅 Échéance : {new Date(a.dateEcheance).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {a.kilometrageActuel && (
                        <span className="font-mono text-slate-700 font-bold">
                          Gauge : {a.kilometrageActuel} / {a.kilometrageSeuil} km
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setForm({ ...form, vehiculeId: a.vehiculeId || '', kilometragePrevu: a.kilometrageSeuil || '' });
                          setShowModal(true);
                        }}
                        className="bg-[#0A1E3F] hover:bg-[#122B55] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Traiter
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Modal - Programmer Intervention */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-cardline overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black font-outfit text-[#0A1E3F] flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#C59B27]" /> Programmer une Maintenance
                </h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Véhicule *</label>
                  <select
                    required
                    value={form.vehiculeId}
                    onChange={(e) => setForm({ ...form, vehiculeId: e.target.value })}
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
                    <label className="font-bold text-slate-700 block mb-1">Type de Maintenance</label>
                    <select
                      value={form.typeMaintenance}
                      onChange={(e) => setForm({ ...form, typeMaintenance: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    >
                      <option value="PREVENTIVE">Préventive (Révision)</option>
                      <option value="CURATIVE">Curative (Réparation / Panne)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nature de l'Opération</label>
                    <select
                      value={form.natureOperation}
                      onChange={(e) => setForm({ ...form, natureOperation: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Date Prévisionnelle</label>
                    <input
                      type="date"
                      value={form.datePrevisionnelle}
                      onChange={(e) => setForm({ ...form, datePrevisionnelle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Statut</label>
                    <select
                      value={form.statut}
                      onChange={(e) => setForm({ ...form, statut: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none font-bold text-[#0A1E3F]"
                    >
                      <option value="PROGRAMMEE">Programmée</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINEE">Terminée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Prestataire / Garage</label>
                    <input
                      type="text"
                      value={form.prestataire}
                      onChange={(e) => setForm({ ...form, prestataire: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Montant Total Estimé (MAD)</label>
                    <input
                      type="number"
                      value={form.montantTotal}
                      onChange={(e) => setForm({ ...form, montantTotal: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-[#0A1E3F]">Immobilisation du Véhicule</span>
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
                  <label className="font-bold text-slate-700 block mb-1">Description & Pièces à remplacer</label>
                  <textarea
                    rows="2"
                    placeholder="Détail de l'intervention..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C59B27] outline-none"
                  ></textarea>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0A1E3F] text-white font-bold shadow-sm"
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
