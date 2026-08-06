import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Key, Car, UserCheck, CheckCircle, RotateCcw, Loader2,
  Printer, MapPin, Calendar, Building2, Gauge, Fuel
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

function SpecItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#94700E]" />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{label}</span>
        <span className="text-xs font-extrabold text-slate-900 break-words">{children ?? '—'}</span>
      </div>
    </div>
  );
}

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

export default function AffectationDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [affectation, setAffectation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isRestitutionOpen, setIsRestitutionOpen] = useState(false);
  const [restitutionForm, setRestitutionForm] = useState({
    kilometrageRetour: '',
    niveauCarburantRetour: 'Plein',
    remarquesRestitution: '',
    anomaliesConstatees: '',
  });

  const fetchAffectation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/affectations/${id}`);
      setAffectation(res.data || res);
    } catch (err) {
      console.error('Erreur de chargement de l\'affectation:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAffectation();
  }, [fetchAffectation]);

  const handleOpenRestitution = () => {
    setRestitutionForm({
      kilometrageRetour: affectation.vehiculeKilometrageActuel || affectation.kilometrageDepart || 0,
      niveauCarburantRetour: 'Plein',
      remarquesRestitution: '',
      anomaliesConstatees: '',
    });
    setIsRestitutionOpen(true);
  };

  const handleRestitutionSubmit = async (e) => {
    e.preventDefault();
    const kmRetourNum = parseInt(restitutionForm.kilometrageRetour);
    if (isNaN(kmRetourNum) || kmRetourNum < affectation.kilometrageDepart) {
      toast.error(`Le kilométrage de retour ne peut être inférieur au kilométrage départ (${affectation.kilometrageDepart} km)`);
      return;
    }
    try {
      await api.post(`/affectations/${affectation.id}/restitution`, {
        kilometrageRetour: kmRetourNum,
        niveauCarburantRetour: restitutionForm.niveauCarburantRetour,
        remarquesRestitution: restitutionForm.remarquesRestitution,
        anomaliesConstatees: restitutionForm.anomaliesConstatees,
      });
      toast.success('Restitution enregistrée avec succès ! Le véhicule est réinitialisé au statut DISPONIBLE');
      setIsRestitutionOpen(false);
      fetchAffectation();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la restitution');
    }
  };

  const handleOpenPdfOrdreMission = async () => {
    try {
      const blob = await api.get(`/ordres-de-mission/${affectation.id}/pdf`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ouverture du PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
      </div>
    );
  }

  if (notFound || !affectation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Key className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Affectation introuvable</p>
        <button
          onClick={() => navigate('/affectations')}
          className="px-5 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
        >
          ← Retour aux Affectations
        </button>
      </div>
    );
  }

  const isEnCours = affectation.statut === 'EN_COURS';
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = savedUser?.role?.nom || savedUser?.role || 'CONSULTATION';
  const canManageAffectation = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL'].includes(roleName);

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">

        {/* Back button */}
        <motion.button
          onClick={() => navigate('/affectations')}
          className="self-start bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Affectations</span>
        </motion.button>

        {/* Header */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center shadow-gold flex-shrink-0">
                <Key className="w-6 h-6 text-[#0A1E3F]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-black text-[#C59B27] bg-[#C59B27]/10 px-3 py-1.5 rounded-lg border border-[#C59B27]/20 whitespace-nowrap inline-block">
                    {affectation.reference || `AFF-2026-${String(affectation.id).padStart(4, '0')}`}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 border ${
                    isEnCours
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    {isEnCours ? <CheckCircle className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                    {isEnCours ? 'Mission En Cours' : 'Restituée'}
                  </span>
                </div>
                <h2 className="text-xl font-black font-outfit text-slate-900 mt-3 leading-tight">
                  Affectation {affectation.vehiculeImmatriculation}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Demandée le {fmtDateTime(affectation.createdAt)} — Réf demande {affectation.demandeReference}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={handleOpenPdfOrdreMission}
                className="bg-[#0A1E3F] hover:bg-[#122B55] text-[#D7B14A] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Imprimer / Télécharger l'Ordre de Mission Officiel PDF"
              >
                <Printer className="w-4 h-4" /> Ordre de Mission (PDF)
              </button>
              {isEnCours && canManageAffectation && (
                <button
                  onClick={handleOpenRestitution}
                  className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Enregistrer Restitution
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Véhicule & Conducteur */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center">
              <Car className="w-4 h-4 text-[#0A1E3F]" />
            </div>
            Véhicule &amp; Chauffeur
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={Car} label="Véhicule">{affectation.vehiculeImmatriculation}</SpecItem>
            <SpecItem icon={Building2} label="Marque / Modèle">{affectation.vehiculeMarqueModele}</SpecItem>
            <SpecItem icon={UserCheck} label="Chauffeur">{affectation.conducteurNomComplet}</SpecItem>
            <SpecItem icon={Gauge} label="Permis N°">{affectation.conducteurNumeroPermis}</SpecItem>
            <SpecItem icon={Calendar} label="Date de début">{fmtDateTime(affectation.dateDebut)}</SpecItem>
            <SpecItem icon={Calendar} label="Date de fin prévisionnelle">{fmtDateTime(affectation.dateFinPrevisionnelle)}</SpecItem>
          </div>
        </motion.div>

        {/* Mission & Demande */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            Demande de Déplacement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={Key} label="Référence demande">{affectation.demandeReference}</SpecItem>
            <SpecItem icon={MapPin} label="Destination">{affectation.demandeDestination}</SpecItem>
            <SpecItem icon={Building2} label="Motif">{affectation.demandeMotif}</SpecItem>
          </div>
        </motion.div>

        {/* Kilométrage & Carburant */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#C59B27]/15 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-[#94700E]" />
            </div>
            Kilométrage &amp; Carburant
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={Gauge} label="Kilométrage départ">
              {affectation.kilometrageDepart != null ? `${affectation.kilometrageDepart.toLocaleString('fr-FR')} km` : '—'}
            </SpecItem>
            <SpecItem icon={Gauge} label="Kilométrage retour">
              {affectation.kilometrageRetour != null ? `${affectation.kilometrageRetour.toLocaleString('fr-FR')} km` : '—'}
            </SpecItem>
            <SpecItem icon={Gauge} label="Distance parcourue (ΔKm)">
              {affectation.kilometrageRetour != null
                ? `${(affectation.kilometrageRetour - affectation.kilometrageDepart).toLocaleString('fr-FR')} km`
                : 'En cours'}
            </SpecItem>
            <SpecItem icon={Fuel} label="Niveau carburant (retour)">{affectation.niveauCarburantRetour || '—'}</SpecItem>
            <SpecItem icon={CheckCircle} label="Remarques restitution">{affectation.remarquesRestitution}</SpecItem>
            <SpecItem icon={CheckCircle} label="Anomalies constatées">{affectation.anomaliesConstatees}</SpecItem>
          </div>
        </motion.div>
      </div>

      {/* Modal Restitution */}
      {isRestitutionOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#C59B27]" />
              Restitution du Véhicule &amp; Clôture de Mission
            </h2>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="font-bold">Affectation :</span> {affectation.reference}</p>
              <p><span className="font-bold">Véhicule :</span> {affectation.vehiculeImmatriculation}</p>
              <p><span className="font-bold font-mono text-[#C59B27]">Kilométrage Départ :</span> {affectation.kilometrageDepart} km</p>
            </div>

            <form onSubmit={handleRestitutionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kilométrage Retour (Km) *</label>
                <input
                  type="number"
                  required
                  min={affectation.kilometrageDepart}
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
                  onClick={() => setIsRestitutionOpen(false)}
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
