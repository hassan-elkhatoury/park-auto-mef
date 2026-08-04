import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, UserCheck, AlertTriangle, ShieldCheck, Phone, Mail,
  Award, Building2, Calendar, Fingerprint, IdCard, Loader2, Edit, Trash2
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

export default function ConducteurDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conducteur, setConducteur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    cin: '',
    direction: '',
    service: '',
    telephone: '',
    email: '',
    numeroPermis: '',
    categoriePermis: 'B',
    dateDelivrancePermis: '',
    dateExpirationPermis: '',
    statut: 'ACTIF',
    habilitationsSpeciales: '',
  });

  const fetchConducteur = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/conducteurs/${id}`);
      const c = res.data || res;
      setConducteur(c);
      setFormData({
        matricule: c.matricule || '',
        nom: c.nom || '',
        prenom: c.prenom || '',
        cin: c.cin || '',
        direction: c.direction || '',
        service: c.service || '',
        telephone: c.telephone || '',
        email: c.email || '',
        numeroPermis: c.numeroPermis || '',
        categoriePermis: c.categoriePermis || 'B',
        dateDelivrancePermis: c.dateDelivrancePermis || '',
        dateExpirationPermis: c.dateExpirationPermis || '',
        statut: c.statut || 'ACTIF',
        habilitationsSpeciales: c.habilitationsSpeciales || '',
      });
    } catch (err) {
      console.error('Erreur de chargement du conducteur:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConducteur();
  }, [fetchConducteur]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/conducteurs/${conducteur.id}`, formData);
      toast.success('Conducteur mis à jour avec succès');
      setIsEditOpen(false);
      fetchConducteur();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour du conducteur');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce conducteur ?')) return;
    try {
      await api.delete(`/conducteurs/${conducteur.id}`);
      toast.success('Conducteur supprimé');
      navigate('/conducteurs');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
      </div>
    );
  }

  if (notFound || !conducteur) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <UserCheck className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Conducteur introuvable</p>
        <button
          onClick={() => navigate('/conducteurs')}
          className="px-5 py-2.5 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
        >
          ← Retour aux Conducteurs
        </button>
      </div>
    );
  }

  const expired = conducteur.dateExpirationPermis && new Date(conducteur.dateExpirationPermis) < new Date();
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = savedUser?.role?.nom || savedUser?.role || 'CONSULTATION';
  const canManageConducteur = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL'].includes(roleName);

  const inputCls = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30";

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">

        {/* Back button */}
        <motion.button
          onClick={() => navigate('/conducteurs')}
          className="self-start bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Conducteurs</span>
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
              <div className="w-14 h-14 rounded-2xl gold-gradient-bg flex items-center justify-center shadow-gold flex-shrink-0">
                <UserCheck className="w-7 h-7 text-[#0A1E3F]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {conducteur.matricule} • CIN: {conducteur.cin}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 border ${
                    conducteur.statut === 'ACTIF'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : conducteur.statut === 'SUSPENDU'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    <ShieldCheck className="w-3 h-3" /> {conducteur.statut}
                  </span>
                </div>
                <h2 className="text-2xl font-black font-outfit text-slate-900 mt-2">
                  {conducteur.nom} {conducteur.prenom}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {conducteur.direction} {conducteur.service ? `(${conducteur.service})` : ''}
                </p>
              </div>
            </div>

            {canManageConducteur && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-50 border border-red-200 text-red-600 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Identité */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center">
              <IdCard className="w-4 h-4 text-[#0A1E3F]" />
            </div>
            Identité
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={Fingerprint} label="Matricule">{conducteur.matricule}</SpecItem>
            <SpecItem icon={IdCard} label="N° CIN">{conducteur.cin}</SpecItem>
            <SpecItem icon={Building2} label="Direction">{conducteur.direction}</SpecItem>
            <SpecItem icon={Building2} label="Service">{conducteur.service}</SpecItem>
            <SpecItem icon={Phone} label="Téléphone">{conducteur.telephone}</SpecItem>
            <SpecItem icon={Mail} label="Email">{conducteur.email}</SpecItem>
          </div>
        </motion.div>

        {/* Permis de conduire */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h3 className="font-outfit font-extrabold text-sm text-slate-900 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            Permis de Conduire
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SpecItem icon={IdCard} label="N° Permis">{conducteur.numeroPermis}</SpecItem>
            <SpecItem icon={Award} label="Catégorie(s)">Cat. {conducteur.categoriePermis}</SpecItem>
            <SpecItem icon={Calendar} label="Date de délivrance">{conducteur.dateDelivrancePermis || '—'}</SpecItem>
            <SpecItem icon={Calendar} label="Date d'expiration">
              <span className={expired ? 'text-red-600 font-extrabold flex items-center gap-1' : ''}>
                {expired && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                {conducteur.dateExpirationPermis || '—'}
              </span>
            </SpecItem>
            <SpecItem icon={AlertTriangle} label="Statut du permis">
              {expired ? 'Expiré' : 'Valide'}
            </SpecItem>
          </div>
          {conducteur.habilitationsSpeciales && (
            <div className="mt-4 bg-[#C59B27]/10 border border-[#C59B27]/30 rounded-xl px-4 py-3 text-xs text-[#0A1E3F] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#94700E]" />
              <span className="font-extrabold">Habilitations spéciales :</span>
              <span>{conducteur.habilitationsSpeciales}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Edit */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#C59B27]" />
              Modifier le Conducteur
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Matricule *</label>
                  <input type="text" required value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    className={`${inputCls} font-mono font-bold`} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° CIN *</label>
                  <input type="text" required value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                  <input type="text" required value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                  <input type="text" required value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Permis de conduire *</label>
                  <input type="text" required value={formData.numeroPermis}
                    onChange={(e) => setFormData({ ...formData, numeroPermis: e.target.value })}
                    className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie(s) du Permis *</label>
                  <select value={formData.categoriePermis}
                    onChange={(e) => setFormData({ ...formData, categoriePermis: e.target.value })}
                    className={`${inputCls} font-bold`}>
                    <option value="B">Catégorie B (Tourisme)</option>
                    <option value="B, C">Catégories B, C (Poids Lourd)</option>
                    <option value="B, C, D">Catégories B, C, D (Transport Personnel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date délivrance permis</label>
                  <input type="date" value={formData.dateDelivrancePermis}
                    onChange={(e) => setFormData({ ...formData, dateDelivrancePermis: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'expiration permis *</label>
                  <input type="date" required value={formData.dateExpirationPermis}
                    onChange={(e) => setFormData({ ...formData, dateExpirationPermis: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Direction</label>
                  <input type="text" value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service</label>
                  <input type="text" value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                  <input type="text" value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Habilitations spéciales</label>
                <input type="text" placeholder="ex: Conduite 4x4, Escorte Officielle, VIP..."
                  value={formData.habilitationsSpeciales}
                  onChange={(e) => setFormData({ ...formData, habilitationsSpeciales: e.target.value })}
                  className={inputCls} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
                  Annuler
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-lg gold-gradient-bg text-[#0A1E3F] font-extrabold shadow-md hover:brightness-105">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
