import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, PenTool, TrendingUp, Archive, X, History, Car, Loader2,
  Fingerprint, Barcode, Building2, Fuel, Gauge, CalendarDays, UserCheck, HeartPulse, Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import VehiculeFormModal from './VehiculeFormModal';
import { getVehiclePhoto, getStatusStyle, MoroccanPlate, FUEL_LABELS } from '../utils/vehicule';
import ConfirmModal from './ConfirmModal';
import MefSelect from './ui/MefSelect';

// One labelled spec line in the technical sheet
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

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : null);
const formatKm = (km) => (km != null ? `${Number(km).toLocaleString('fr-FR')} km` : null);

export default function VehiculeDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicule, setVehicule] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, loading: false });
  const [statusFormData, setStatusFormData] = useState({
    nouveauStatutAdministratif: 'DISPONIBLE',
    nouveauEtatTechnique: 'BON_ETAT',
    motif: '',
    pieceJustificative: ''
  });

  const fetchVehicule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vehicules/${id}`);
      setVehicule(res.data);
      // History is nice-to-have: tolerate its failure
      try {
        const h = await api.get(`/vehicules/${id}/historique`);
        setHistorique(h.data || []);
      } catch {
        setHistorique([]);
      }
    } catch (err) {
      console.error('Erreur de chargement du véhicule:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicule();
  }, [fetchVehicule]);

  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vehicules/${id}/statut`, statusFormData);
      toast.success('Statut mis à jour avec succès');
      setIsStatusModalOpen(false);
      fetchVehicule();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const requestArchive = () => {
    setArchiveModal({ isOpen: true, loading: false });
  };

  const confirmArchive = async () => {
    try {
      setArchiveModal({ isOpen: true, loading: true });
      await api.delete(`/vehicules/${id}`);
      toast.success('Véhicule archivé avec succès');
      setArchiveModal({ isOpen: false, loading: false });
      navigate('/vehicules');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'archivage');
      setArchiveModal({ isOpen: false, loading: false });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
      </div>
    );
  }

  if (notFound || !vehicule) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Car className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Véhicule introuvable</p>
        <button
          onClick={() => navigate('/vehicules')}
          className="px-5 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
        >
          ← Retour à la Flotte
        </button>
      </div>
    );
  }

  const hasAffectation = vehicule.direction || vehicule.division || vehicule.service || vehicule.responsable;

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">

        {/* Back button */}
        <motion.button
          onClick={() => navigate('/vehicules')}
          className="self-start bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la Flotte</span>
        </motion.button>

        {/* Sheet header: photo + identity */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="md:col-span-2 h-56 md:h-auto bg-slate-200 relative">
              <img
                src={getVehiclePhoto(vehicule.marque, vehicule.modele)}
                alt={`${vehicule.marque} ${vehicule.modele}`}
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase ${getStatusStyle(vehicule.statutAdministratif)}`}>
                  {vehicule.statutAdministratif}
                </span>
              </div>
            </div>

            <div className="md:col-span-3 p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <MoroccanPlate immatriculation={vehicule.immatriculation} className="scale-110 origin-left" />
                  <h2 className="text-2xl font-black font-outfit text-slate-900 mt-3">
                    {vehicule.marque} {vehicule.modele}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {vehicule.organisme || 'Ministère de l\'Économie et des Finances'}
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-[#94700E]" />
                  {vehicule.etatTechnique}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">N° Inventaire MEF</span>
                  <span className="font-extrabold text-slate-900">{vehicule.numeroInventaire}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Direction de rattachement</span>
                  <span className="font-extrabold text-slate-900">{vehicule.direction || '—'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-1 mt-auto">
                <motion.button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold flex items-center gap-2 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <PenTool className="w-3.5 h-3.5" /> Modifier la Fiche
                </motion.button>
                <motion.button
                  onClick={() => {
                    setStatusFormData({
                      nouveauStatutAdministratif: vehicule.statutAdministratif,
                      nouveauEtatTechnique: vehicule.etatTechnique,
                      motif: '',
                      pieceJustificative: ''
                    });
                    setIsStatusModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#C59B27]/15 border border-[#C59B27]/40 text-[#94700E] font-extrabold text-xs rounded-xl hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center gap-2 transition-all cursor-pointer"
                  whileTap={{ scale: 0.97 }}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Changer le Statut
                </motion.button>
                <motion.button
                  onClick={requestArchive}
                  className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 font-extrabold text-xs rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center gap-2 transition-all cursor-pointer"
                  whileTap={{ scale: 0.97 }}
                >
                  <Archive className="w-3.5 h-3.5" /> Archiver
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technical specifications */}
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
            Caractéristiques Techniques
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={Fingerprint} label="N° Inventaire MEF">{vehicule.numeroInventaire}</SpecItem>
            <SpecItem icon={Barcode} label="N° Châssis (VIN)">{vehicule.numeroChassis}</SpecItem>
            <SpecItem icon={Building2} label="Direction MEF">{vehicule.direction}</SpecItem>
            <SpecItem icon={Fuel} label="Carburant & Consommation">
              {FUEL_LABELS[vehicule.typeCarburant] || vehicule.typeCarburant}
              {vehicule.consommationTheorique != null && ` — ${vehicule.consommationTheorique} L/100km`}
            </SpecItem>
            <SpecItem icon={Gauge} label="Kilométrage Initial / Actuel">
              {formatKm(vehicule.kilometrageInitial) || '—'} / {formatKm(vehicule.kilometrageActuel) || '—'}
            </SpecItem>
            <SpecItem icon={CalendarDays} label="Date d'acquisition / Mise en service">
              {formatDate(vehicule.dateAcquisition) || formatDate(vehicule.datePremiereMiseCirculation) || '—'}
            </SpecItem>
          </div>
        </motion.div>

        {/* Assignment */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            Affectation &amp; Rattachement
          </h3>
          {hasAffectation ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SpecItem icon={Building2} label="Direction">{vehicule.direction}</SpecItem>
              <SpecItem icon={Landmark} label="Division / Service">
                {[vehicule.division, vehicule.service].filter(Boolean).join(' / ') || '—'}
              </SpecItem>
              <SpecItem icon={UserCheck} label="Agent Responsable">{vehicule.responsable}</SpecItem>
              <SpecItem icon={Building2} label="Organisme">{vehicule.organisme}</SpecItem>
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-4">
              Aucune structure ou agent n'est actuellement affecté à ce véhicule.
            </p>
          )}
        </motion.div>

        {/* Status history */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#C59B27]/15 flex items-center justify-center">
              <History className="w-4 h-4 text-[#94700E]" />
            </div>
            Historique des Statuts
          </h3>
          {historique.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-4">
              Aucune transition de statut enregistrée pour ce véhicule.
            </p>
          ) : (
            <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-[#C59B27]/40 my-2">
              {historique.map((h, index) => {
                const dotColor = h.nouveauStatutAdministratif === 'DISPONIBLE' ? 'bg-emerald-500' :
                  ['HORS_SERVICE', 'ACCIDENTE', 'REFORME'].includes(h.nouveauStatutAdministratif) ? 'bg-red-500' :
                  ['EN_ENTRETIEN', 'EN_REPARATION'].includes(h.nouveauStatutAdministratif) ? 'bg-amber-500' : 'bg-[#C59B27]';
                return (
                  <motion.div
                    key={h.id}
                    className="relative flex flex-col gap-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${dotColor} border-2 border-white shadow-sm`} />
                    <div className="flex justify-between items-center gap-3 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900">
                        {h.ancienStatutAdministratif || 'INITIAL'} → <span className="text-[#94700E]">{h.nouveauStatutAdministratif}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(h.dateChangement).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong>Motif :</strong> {h.motif || 'Non renseigné'}
                    </p>
                    <span className="text-[10px] text-slate-400">Agent responsable : <strong>{h.utilisateur}</strong></span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>

      {/* Edit modal (shared with the fleet list) */}
      <VehiculeFormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={fetchVehicule}
        vehicule={vehicule}
      />

      {/* Change Status Modal */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <motion.div
            className="fixed inset-0 bg-[#0A1E3F]/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full max-w-[500px] rounded-2xl p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-outfit font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  Changement de Statut — {vehicule.immatriculation}
                </h3>
                <button onClick={() => setIsStatusModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStatusChangeSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nouveau Statut Administratif</label>
                  <MefSelect
                    value={statusFormData.nouveauStatutAdministratif}
                    onChange={(e) => setStatusFormData({ ...statusFormData, nouveauStatutAdministratif: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                  >
                    <option value="DISPONIBLE">DISPONIBLE</option>
                    <option value="AFFECTE">AFFECTE</option>
                    <option value="RESERVE">RESERVE</option>
                    <option value="EN_ENTRETIEN">EN_ENTRETIEN</option>
                    <option value="EN_REPARATION">EN_REPARATION</option>
                    <option value="IMMOBILISE">IMMOBILISE</option>
                    <option value="TRANSFERE">TRANSFERE</option>
                    <option value="REFORME">REFORME</option>
                    <option value="ARCHIVE">ARCHIVE (Soft Delete)</option>
                  </MefSelect>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nouveau État Technique</label>
                  <MefSelect
                    value={statusFormData.nouveauEtatTechnique}
                    onChange={(e) => setStatusFormData({ ...statusFormData, nouveauEtatTechnique: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                  >
                    <option value="NEUF">NEUF</option>
                    <option value="BON_ETAT">BON_ETAT</option>
                    <option value="ETAT_MOYEN">ETAT_MOYEN</option>
                    <option value="ENTRETIEN_NECESSAIRE">ENTRETIEN_NECESSAIRE</option>
                    <option value="ACCIDENTE">ACCIDENTE</option>
                    <option value="EN_REPARATION">EN_REPARATION</option>
                    <option value="HORS_SERVICE">HORS_SERVICE</option>
                  </MefSelect>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Motif du changement *</label>
                  <textarea
                    value={statusFormData.motif}
                    onChange={(e) => setStatusFormData({ ...statusFormData, motif: e.target.value })}
                    placeholder="Ex: Entretien périodique programmé par la Direction"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none resize-none"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setIsStatusModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer transition-colors">Annuler</button>
                  <motion.button
                    type="submit"
                    className="px-6 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(197,160,89,0.5)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Valider le Changement
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Confirm Archive Modal */}
      <ConfirmModal
        isOpen={archiveModal.isOpen}
        title="Archivage de Véhicule"
        message={`Voulez-vous vraiment archiver le véhicule ${vehicule?.marque} ${vehicule?.modele} (${vehicule?.immatriculation}) ?`}
        badgeText="Le statut du véhicule passera à ARCHIVE conformément aux règles du MEF"
        confirmText="Archiver le véhicule"
        cancelText="Annuler"
        variant="danger"
        loading={archiveModal.loading}
        onConfirm={confirmArchive}
        onClose={() => setArchiveModal({ isOpen: false, loading: false })}
      />
    </div>
  );
}
