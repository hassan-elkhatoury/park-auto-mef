import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Send, MapPin, Calendar, Users, UserCheck, Building2,
  CheckCircle, XCircle, Clock, Loader2, ClipboardCheck, Ban, X
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

const STATUS_STYLES = {
  EN_ATTENTE_VALIDATION: { badge: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock, label: 'En Attente N1' },
  VALIDEE_SERVICE: { badge: 'bg-blue-100 text-blue-800 border-blue-300', icon: ClipboardCheck, label: 'Validée Service' },
  APPROUVEE_AFFECTEE: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle, label: 'Affectée' },
  REJETEE: { badge: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Rejetée' },
  TERMINEE: { badge: 'bg-slate-100 text-slate-700 border-slate-300', icon: CheckCircle, label: 'Terminée' },
  ANNULEE: { badge: 'bg-gray-100 text-gray-700 border-gray-300', icon: Ban, label: 'Annulée' },
};

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

export default function DemandeDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [valAction, setValAction] = useState('APPROUVER');
  const [motifRejet, setMotifRejet] = useState('');

  const fetchDemande = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/demandes/${id}`);
      setDemande(res.data || res);
    } catch (err) {
      console.error('Erreur de chargement de la demande:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDemande();
  }, [fetchDemande]);

  const handleValidationSubmit = async (e) => {
    e.preventDefault();
    if (!demande) return;
    const isApprouve = valAction === 'APPROUVER';
    if (!isApprouve && (!motifRejet || !motifRejet.trim())) {
      toast.error('Le motif de rejet est obligatoire');
      return;
    }
    try {
      await api.patch(`/demandes/${demande.id}/validation-service`, {
        approuve: isApprouve,
        motifRejet: isApprouve ? null : motifRejet.trim(),
      });
      toast.success(isApprouve ? 'Demande validée (Niveau 1)' : 'Demande rejetée');
      setIsValidationOpen(false);
      fetchDemande();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
      </div>
    );
  }

  if (notFound || !demande) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Send className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Demande introuvable</p>
        <button
          onClick={() => navigate('/demandes')}
          className="px-5 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
        >
          ← Retour aux Demandes
        </button>
      </div>
    );
  }

  const s = STATUS_STYLES[demande.statut] || STATUS_STYLES.TERMINEE;
  const StatusIcon = s.icon;
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = savedUser?.role?.nom || savedUser?.role || 'CONSULTATION';
  const canValidateN1 = ['ADMIN', 'RESPONSABLE_SERVICE', 'GESTIONNAIRE_CENTRAL'].includes(roleName);

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">

        {/* Back button */}
        <motion.button
          onClick={() => navigate('/demandes')}
          className="self-start bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Demandes</span>
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
                <Send className="w-6 h-6 text-[#0A1E3F]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-black text-[#C59B27] bg-[#C59B27]/10 px-3 py-1.5 rounded-lg border border-[#C59B27]/20">
                    {demande.reference}
                  </span>
                  <span className={`${s.badge} text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 border`}>
                    <StatusIcon className="w-3 h-3" /> {s.label}
                  </span>
                </div>
                <h2 className="text-xl font-black font-outfit text-slate-900 mt-3 leading-tight">{demande.motif}</h2>
                <p className="text-xs text-slate-500 mt-1">Créée le {fmtDateTime(demande.createdAt)}</p>
              </div>
            </div>

            {demande.statut === 'EN_ATTENTE_VALIDATION' && canValidateN1 && (
              <button
                onClick={() => { setValAction('APPROUVER'); setMotifRejet(''); setIsValidationOpen(true); }}
                className="bg-[#0A1E3F] hover:bg-[#122B55] text-[#D7B14A] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <CheckCircle className="w-4 h-4" /> Décision N1
              </button>
            )}
          </div>
        </motion.div>

        {/* Mission details */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#0A1E3F]" />
            </div>
            Détails de la Mission
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={MapPin} label="Destination">{demande.destination}</SpecItem>
            <SpecItem icon={Calendar} label="Départ">{
              demande.dateHeureDepart ? fmtDateTime(demande.dateHeureDepart) : '—'
            }</SpecItem>
            <SpecItem icon={Calendar} label="Retour estimé">{
              demande.dateHeureRetourEstimee ? fmtDateTime(demande.dateHeureRetourEstimee) : '—'
            }</SpecItem>
            <SpecItem icon={Users} label="Nombre de passagers">{demande.nombrePassagers}</SpecItem>
            <SpecItem icon={Users} label="Accompagnateurs">
              {demande.listePassagers || '—'}
            </SpecItem>
          </div>
        </motion.div>

        {/* Demandeur */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            Demandeur
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={UserCheck} label="Agent">{
              demande.demandeurNomComplet || 'Agent MEF'
            }</SpecItem>
            <SpecItem icon={Building2} label="Direction">{demande.demandeurDirection}</SpecItem>
            <SpecItem icon={Building2} label="Service">{demande.demandeurService}</SpecItem>
          </div>
        </motion.div>

        {/* Validation trail */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            Circuit de Validation
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              demande.statut === 'EN_ATTENTE_VALIDATION'
                ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
                : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-[#94700E]" />
              </div>
              <div className="flex-1">
                <span className="font-bold block">Niveau 1 — Validation du Service</span>
                {demande.statut === 'EN_ATTENTE_VALIDATION' ? (
                  <span>En attente de décision N1</span>
                ) : demande.statut === 'REJETEE' ? (
                  <span className="flex items-center gap-1 text-red-700"><XCircle className="w-3 h-3" /> Rejetée par {demande.valideurServiceNomComplet}</span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600"><CheckCircle className="w-3 h-3" /> Validée par {demande.valideurServiceNomComplet}</span>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              demande.statut === 'APPROUVEE_AFFECTEE'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-[#94700E]" />
              </div>
              <div className="flex-1">
                <span className="font-bold block">Niveau 2 — Approbation & Affectation (Parc)</span>
                {demande.statut === 'APPROUVEE_AFFECTEE' ? (
                  <span>
                    Approuvée par {demande.approbateurParcNomComplet}
                    {demande.affectationReference && ` — ${demande.affectationReference}`}
                  </span>
                ) : (
                  <span>En attente d'approbation et d'affectation d'un véhicule</span>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              demande.statut === 'TERMINEE'
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-[#94700E]" />
              </div>
              <div className="flex-1">
                <span className="font-bold block">Clôture — Restitution & Fin de Mission</span>
                {demande.statut === 'TERMINEE' ? 'Mission terminée' : 'La mission sera clôturée après restitution du véhicule'}
              </div>
            </div>
          </div>

          {demande.statut === 'REJETEE' && demande.motifRejet && (
            <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-red-800">
              <span className="font-bold block text-[11px] mb-1">Motif du rejet :</span>
              {demande.motifRejet}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Validation N1 */}
      {isValidationOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#C59B27]" />
                Décision N1 (Service)
              </h2>
              <button onClick={() => setIsValidationOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="font-bold text-slate-700">Réf :</span> {demande.reference}</p>
              <p><span className="font-bold text-slate-700">Motif :</span> {demande.motif}</p>
              <p><span className="font-bold text-slate-700">Destination :</span> {demande.destination}</p>
              <p><span className="font-bold text-slate-700">Agent :</span> {demande.demandeurNomComplet}</p>
            </div>
            <form onSubmit={handleValidationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Décision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setValAction('APPROUVER')}
                    className={`p-3 rounded-xl font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      valAction === 'APPROUVER' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}>
                    <CheckCircle className="w-4 h-4" /> Approuver
                  </button>
                  <button type="button" onClick={() => setValAction('REJETER')}
                    className={`p-3 rounded-xl font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      valAction === 'REJETER' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}>
                    <XCircle className="w-4 h-4" /> Rejeter
                  </button>
                </div>
              </div>
              {valAction === 'REJETER' && (
                <div>
                  <label className="block font-bold text-red-700 mb-1.5">Motif du rejet *</label>
                  <textarea required rows={3} placeholder="Raison détaillée du rejet..." value={motifRejet}
                    onChange={e => setMotifRejet(e.target.value)}
                    className="w-full p-2.5 bg-red-50/50 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 font-medium" />
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsValidationOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-all cursor-pointer">Annuler</button>
                <button type="submit"
                  className={`px-4 py-2.5 rounded-xl font-extrabold text-white shadow-md transition-all cursor-pointer ${
                    valAction === 'APPROUVER' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}>Valider la décision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
