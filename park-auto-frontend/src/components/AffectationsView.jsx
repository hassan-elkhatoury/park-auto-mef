import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Car, UserCheck, CheckCircle, RotateCcw, Printer, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function AffectationsView({ selectedDemandeForAffectation, onCloseDemandeSelection }) {
  const navigate = useNavigate();
  const [affectations, setAffectations] = useState([]);
  const [demandesValidees, setDemandesValidees] = useState([]);
  const [vehiculesDisponibles, setVehiculesDisponibles] = useState([]);
  const [conducteursDisponibles, setConducteursDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Affectation Modal
  const [isAffectationModalOpen, setIsAffectationModalOpen] = useState(false);
  const [affectationForm, setAffectationForm] = useState({
    demandeDeplacementId: '',
    vehiculeId: '',
    conducteurId: '',
    dateDebut: '',
    dateFinPrevisionnelle: '',
  });

  // Restitution Modal
  const [isRestitutionModalOpen, setIsRestitutionModalOpen] = useState(false);
  const [selectedAffectation, setSelectedAffectation] = useState(null);
  const [restitutionForm, setRestitutionForm] = useState({
    kilometrageRetour: '',
    niveauCarburantRetour: 'Plein',
    remarquesRestitution: '',
    anomaliesConstatees: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDemandeForAffectation) {
      handleOpenAffectationModal(selectedDemandeForAffectation);
    }
  }, [selectedDemandeForAffectation]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch each resource independently so one failure doesn't block others
      const [affResult, demResult, vehResult, condResult] = await Promise.allSettled([
        api.get('/affectations'),
        api.get('/demandes?statut=VALIDEE_SERVICE'),
        api.get('/vehicules?size=200'),
        api.get('/conducteurs/disponibles'),
      ]);

      // Affectations
      if (affResult.status === 'fulfilled') {
        const aff = affResult.value;
        const list = Array.isArray(aff) ? aff : (aff?.data || aff?.content || []);
        setAffectations(Array.isArray(list) ? list : []);
      } else {
        console.warn('Affectations fetch failed:', affResult.reason);
        setAffectations([]);
      }

      // Demandes validées
      if (demResult.status === 'fulfilled') {
        const dem = demResult.value;
        const list = Array.isArray(dem) ? dem : (dem?.data || dem?.content || []);
        setDemandesValidees(Array.isArray(list) ? list : []);
      } else {
        console.warn('Demandes fetch failed:', demResult.reason);
        setDemandesValidees([]);
      }

      // Véhicules disponibles
      if (vehResult.status === 'fulfilled') {
        const veh = vehResult.value;
        const all = Array.isArray(veh) ? veh : (veh?.data?.content || veh?.content || veh?.data || []);
        setVehiculesDisponibles(
          (Array.isArray(all) ? all : []).filter((v) => v.statutAdministratif === 'DISPONIBLE')
        );
      } else {
        console.warn('Véhicules fetch failed:', vehResult.reason);
        setVehiculesDisponibles([]);
      }

      // Conducteurs disponibles
      if (condResult.status === 'fulfilled') {
        const cond = condResult.value;
        const list = Array.isArray(cond) ? cond : (cond?.data || cond?.content || []);
        setConducteursDisponibles(Array.isArray(list) ? list : []);
      } else {
        console.warn('Conducteurs fetch failed:', condResult.reason);
        setConducteursDisponibles([]);
      }

    } catch (err) {
      console.error('fetchData unexpected error:', err);
      toast.error('Erreur lors de la récupération des données d\'affectation');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAffectationModal = (demande = null) => {
    const demId = demande ? demande.id : (demandesValidees[0]?.id || '');
    const selectedDem = demande || demandesValidees.find((d) => d.id === parseInt(demId));

    setAffectationForm({
      demandeDeplacementId: demId,
      vehiculeId: vehiculesDisponibles[0]?.id || '',
      conducteurId: conducteursDisponibles[0]?.id || '',
      dateDebut: selectedDem?.dateHeureDepart || '',
      dateFinPrevisionnelle: selectedDem?.dateHeureRetourEstimee || '',
    });
    setIsAffectationModalOpen(true);
  };

  const handleAffectationSubmit = async (e) => {
    e.preventDefault();
    if (!affectationForm.demandeDeplacementId || !affectationForm.vehiculeId || !affectationForm.conducteurId) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      await api.post('/affectations', affectationForm);
      toast.success('Affectation réussie ! Le véhicule est maintenant en statut AFFECTÉ');
      setIsAffectationModalOpen(false);
      if (onCloseDemandeSelection) onCloseDemandeSelection();
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création de l\'affectation');
    }
  };

  const handleOpenRestitutionModal = (affectation) => {
    setSelectedAffectation(affectation);
    setRestitutionForm({
      kilometrageRetour: affectation.vehiculeKilometrageActuel || affectation.kilometrageDepart || 0,
      niveauCarburantRetour: 'Plein',
      remarquesRestitution: '',
      anomaliesConstatees: '',
    });
    setIsRestitutionModalOpen(true);
  };

  const handleRestitutionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAffectation) return;

    const kmRetourNum = parseInt(restitutionForm.kilometrageRetour);
    if (isNaN(kmRetourNum) || kmRetourNum < selectedAffectation.kilometrageDepart) {
      toast.error(`Le kilométrage de retour ne peut être inférieur au kilométrage départ (${selectedAffectation.kilometrageDepart} km)`);
      return;
    }

    try {
      await api.post(`/affectations/${selectedAffectation.id}/restitution`, {
        kilometrageRetour: kmRetourNum,
        niveauCarburantRetour: restitutionForm.niveauCarburantRetour,
        remarquesRestitution: restitutionForm.remarquesRestitution,
        anomaliesConstatees: restitutionForm.anomaliesConstatees,
      });

      toast.success('Restitution enregistrée avec succès ! Le véhicule est réinitialisé au statut DISPONIBLE');
      setIsRestitutionModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la restitution');
    }
  };

  const handleOpenPdfOrdreMission = async (affectationId) => {
    try {
      const blob = await api.get(`/ordres-de-mission/${affectationId}/pdf`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ouverture du PDF');
    }
  };

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = savedUser?.role?.nom || savedUser?.role || 'CONSULTATION';
  const canManageAffectation = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL'].includes(roleName);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <Key className="w-6 h-6 text-[#C59B27]" />
            Affectations & Restitutions de Véhicules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Attribution des véhicules disponibles aux demandes validées et clôture des missions (Km & Carburant).
          </p>
        </div>

        {canManageAffectation && (
          <button
            onClick={() => handleOpenAffectationModal()}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
          >
            <Car className="w-4 h-4" /> Nouvelle Affectation (N2)
          </button>
        )}
      </div>

      {/* List of Affectations */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Chargement des affectations...</div>
      ) : affectations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Aucune affectation trouvée.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-outfit font-extrabold text-sm text-slate-900">Registre des Affectations</h3>
            <span className="text-[11px] font-bold text-slate-400">
              {affectations.length} affectation{affectations.length !== 1 ? 's' : ''} affichée{affectations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Véhicule</th>
                  <th>Chauffeur</th>
                  <th>Mission</th>
                  <th>Kilométrage</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affectations.map((aff) => {
                  const isEnCours = aff.statut === 'EN_COURS';
                  return (
                    <tr key={aff.id} className="cursor-pointer" onClick={() => navigate(`/affectations/${aff.id}`)}>
                      <td>
                        <span className="font-mono text-xs font-black text-[#C59B27] bg-[#C59B27]/10 px-2.5 py-1 rounded-lg border border-[#C59B27]/20">
                          {aff.reference}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                          <Car className="w-3.5 h-3.5 text-[#94700E]" /> {aff.vehiculeImmatriculation}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{aff.vehiculeMarqueModele}</span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                          <UserCheck className="w-3.5 h-3.5 text-[#94700E]" /> {aff.conducteurNomComplet}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Permis N° {aff.conducteurNumeroPermis}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600 block max-w-[200px] truncate">{aff.demandeMotif || aff.demandeReference}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Réf {aff.demandeReference}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Départ: {aff.kilometrageDepart} km</span>
                        {!isEnCours && (
                          <span className="text-[10px] text-slate-400 block">
                            Retour: {aff.kilometrageRetour} km (Δ {aff.kilometrageRetour - aff.kilometrageDepart} km)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 border ${
                          isEnCours
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {isEnCours ? <CheckCircle className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                          {isEnCours ? 'En Cours' : 'Restituée'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/affectations/${aff.id}`); }}
                            className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 text-[#0A1E3F] hover:bg-[#0A1E3F] hover:text-[#D7B14A] flex items-center justify-center transition-all cursor-pointer"
                            title="Consulter la fiche affectation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenPdfOrdreMission(aff.id); }}
                            className="w-8 h-8 rounded-lg bg-[#0A1E3F] hover:bg-[#122B55] text-[#D7B14A] flex items-center justify-center transition-all cursor-pointer"
                            title="Ordre de Mission (PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {isEnCours && canManageAffectation && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenRestitutionModal(aff); }}
                              className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                              title="Enregistrer Restitution"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Level 2 Affectation (Gestionnaire du Parc) */}
      {isAffectationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
              <Key className="w-5 h-5 text-[#C59B27]" />
              Approbation & Affectation Niveau 2 (Gestionnaire du Parc)
            </h2>

            <form onSubmit={handleAffectationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Demande de Déplacement Validée *</label>
                {demandesValidees.length === 0 && !affectationForm.demandeDeplacementId ? (
                  <p className="text-red-500 font-bold p-2 bg-red-50 rounded">
                    Aucune demande en attente d'affectation (Validée par le service).
                  </p>
                ) : (
                  <select
                    value={affectationForm.demandeDeplacementId}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const selDem = demandesValidees.find((d) => d.id === parseInt(dId));
                      setAffectationForm({
                        ...affectationForm,
                        demandeDeplacementId: dId,
                        dateDebut: selDem?.dateHeureDepart || affectationForm.dateDebut,
                        dateFinPrevisionnelle: selDem?.dateHeureRetourEstimee || affectationForm.dateFinPrevisionnelle,
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {demandesValidees.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.reference} — {d.motif} ({d.destination})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Véhicule au statut DISPONIBLE *</label>
                {vehiculesDisponibles.length === 0 ? (
                  <p className="text-red-500 font-bold p-2 bg-red-50 rounded">
                    Aucun véhicule au statut DISPONIBLE actuellement.
                  </p>
                ) : (
                  <select
                    value={affectationForm.vehiculeId}
                    onChange={(e) => setAffectationForm({ ...affectationForm, vehiculeId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {vehiculesDisponibles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} — {v.marque} {v.modele} ({v.typeCarburant}) [Km: {v.kilometrageActuel} km]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Conducteur / Chauffeur Habilité (Permis Valide) *</label>
                {conducteursDisponibles.length === 0 ? (
                  <p className="text-red-500 font-bold p-2 bg-red-50 rounded">
                    Aucun conducteur disponible avec permis valide.
                  </p>
                ) : (
                  <select
                    value={affectationForm.conducteurId}
                    onChange={(e) => setAffectationForm({ ...affectationForm, conducteurId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {conducteursDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} {c.prenom} (Permis: {c.numeroPermis} - Cat. {c.categoriePermis})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAffectationModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={vehiculesDisponibles.length === 0 || conducteursDisponibles.length === 0}
                  className="px-4 py-2 rounded-lg gold-gradient-bg text-[#0A1E3F] font-extrabold shadow-md hover:brightness-105 disabled:opacity-50"
                >
                  Confirmer l'affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restitution */}
      {isRestitutionModalOpen && selectedAffectation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#C59B27]" />
              Restitution du Véhicule & Clôture de Mission
            </h2>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="font-bold">Affectation :</span> {selectedAffectation.reference}</p>
              <p><span className="font-bold">Véhicule :</span> {selectedAffectation.vehiculeImmatriculation}</p>
              <p><span className="font-bold font-mono text-[#C59B27]">Kilométrage Départ :</span> {selectedAffectation.kilometrageDepart} km</p>
            </div>

            <form onSubmit={handleRestitutionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kilométrage Retour (Km) *</label>
                <input
                  type="number"
                  required
                  min={selectedAffectation.kilometrageDepart}
                  value={restitutionForm.kilometrageRetour}
                  onChange={(e) => setRestitutionForm({ ...restitutionForm, kilometrageRetour: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Niveau Carburant au Retour</label>
                <select
                  value={restitutionForm.niveauCarburantRetour}
                  onChange={(e) => setRestitutionForm({ ...restitutionForm, niveauCarburantRetour: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="Plein">Plein (100%)</option>
                  <option value="3/4">3/4 Réservoir</option>
                  <option value="1/2">1/2 Réservoir</option>
                  <option value="1/4">1/4 Réservoir</option>
                  <option value="Réserve">Réserve</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarques / Observation</label>
                <textarea
                  rows={2}
                  placeholder="État du véhicule, propreté, etc."
                  value={restitutionForm.remarquesRestitution}
                  onChange={(e) => setRestitutionForm({ ...restitutionForm, remarquesRestitution: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anomalies constatées (le cas échéant)</label>
                <textarea
                  rows={2}
                  placeholder="Rayures, bruits anormaux, voyants..."
                  value={restitutionForm.anomaliesConstatees}
                  onChange={(e) => setRestitutionForm({ ...restitutionForm, anomaliesConstatees: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRestitutionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg gold-gradient-bg text-[#0A1E3F] font-extrabold shadow-md hover:brightness-105"
                >
                  Valider la restitution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
