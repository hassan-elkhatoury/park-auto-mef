import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Building2, MapPin, Briefcase, Shield, Hash, 
  Calendar, Lock, Loader2, CheckCircle2, Landmark, Sparkles, ArrowRight,
  Camera, Upload, Image as ImageIcon, Trash2, X, Check, RefreshCw, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getApiErrorMessage } from '../services/api';
import { 
  getUserAvatar, saveUserAvatar, persistUserAvatar,
  processImageFile, PRESET_AVATARS, DEFAULT_AVATAR
} from '../services/avatarService';

// Moroccan 8-pointed star badge icon (inline SVG)
function StarBadge({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 100 100" fill="none">
      <path 
        d="M50 5 L61.8 23.2 L83.2 16.8 L76.8 38.2 L95 50 L76.8 61.8 L83.2 83.2 L61.8 76.8 L50 95 L38.2 76.8 L16.8 83.2 L23.2 61.8 L5 50 L23.2 38.2 L16.8 16.8 L38.2 23.2 Z"
        stroke="currentColor" 
        strokeWidth="4" 
        fill="currentColor" 
        fillOpacity="0.15" 
      />
    </svg>
  );
}

const ROLE_LABELS = {
  ADMIN: 'Administrateur Système',
  GESTIONNAIRE_CENTRAL: 'Gestionnaire Central du Parc',
  GESTIONNAIRE_LOCAL: 'Gestionnaire Local du Parc',
  RESPONSABLE_FINANCIER: 'Responsable Financier',
  RESPONSABLE_SERVICE: 'Responsable de Service',
  CONDUCTEUR: 'Conducteur de Véhicule',
  CONSULTATION: 'Accès Consultation',
};

function InfoRow({ icon: Icon, label, value, iconColor = 'text-[#C59B27]' }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]/70 px-3 rounded-xl transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <span className="text-xs font-bold text-[#0A1E3F] text-right truncate max-w-[55%]">
        {value}
      </span>
    </div>
  );
}

// ── Modal de modification d'avatar ──
function AvatarModal({ user, currentAvatar, onClose, onAvatarSaved, onUserUpdate }) {
  const fileInputRef = useRef(null);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const dataUrl = await processImageFile(file, 280, 0.9);
      setSelectedAvatar(dataUrl);
      toast.success('Image prête à être appliquée !');
    } catch (err) {
      toast.error(err.message || "Erreur lors du traitement de l'image");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyPersistedUser = (userData, fallbackUrl) => {
    if (!userData?.email && userData?.id == null) {
      throw new Error("Le serveur n'a pas enregistré la photo de profil.");
    }
    const storedPhoto = String(userData.photoUrl || fallbackUrl || DEFAULT_AVATAR).split('?')[0];
    const nextUser = { ...userData, photoUrl: storedPhoto };
    localStorage.setItem('user', JSON.stringify(nextUser));
    if (onUserUpdate) onUserUpdate(nextUser);
    const displayUrl = getUserAvatar(nextUser);
    saveUserAvatar(nextUser, displayUrl);
    onAvatarSaved(displayUrl);
  };

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const userData = await persistUserAvatar(selectedAvatar);
      applyPersistedUser(userData, selectedAvatar);
      toast.success('Photo de profil mise à jour avec succès !');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible d'enregistrer la photo de profil."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const userData = await persistUserAvatar(DEFAULT_AVATAR);
      setSelectedAvatar(DEFAULT_AVATAR);
      applyPersistedUser(userData, DEFAULT_AVATAR);
      toast.success('Photo réinitialisée au portrait par défaut.');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de réinitialiser la photo.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1E3F]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#C59B27]/40 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#06152B] via-[#0A1E3F] to-[#122B55] p-5 text-white flex items-center justify-between relative border-b border-[#C59B27]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-['Outfit'] tracking-tight !text-white">
                Modifier la Photo de Profil
              </h3>
              <p className="text-[11px] text-[#D7B14A] font-medium">
                Personnalisation de votre compte officiel MEF
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Current Preview in Center */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-white relative shadow-xl ring-[3px] ring-[#0A1E3F] ring-offset-2 ring-offset-[#C59B27]">
              <img 
                src={selectedAvatar} 
                alt="Aperçu avatar" 
                className="w-full h-full object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-[#0A1E3F]/70 flex items-center justify-center text-white text-xs font-bold gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#D7B14A]" />
                  <span>Traitement…</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Aperçu en temps réel</p>
          </div>

          {/* Action 1: Upload from computer */}
          <div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full h-11 px-4 rounded-xl border border-dashed border-[#C59B27] bg-[#C59B27]/5 hover:bg-[#C59B27]/10 text-[#0A1E3F] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all group"
            >
              <Upload className="w-4 h-4 text-[#C59B27] group-hover:scale-110 transition-transform" />
              <span>Importer une photo depuis votre appareil</span>
              <span className="text-[10px] text-slate-400 font-normal">(PNG, JPG, WEBP)</span>
            </button>
          </div>

          {/* Action 2: Choose from Official Presets */}
          <div>
            <p className="text-xs font-black text-[#0A1E3F] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Ou choisir un portrait officiel MEF :</span>
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {PRESET_AVATARS.map((p) => {
                const isSelected = selectedAvatar === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedAvatar(p.url)}
                    className={`relative rounded-full overflow-hidden aspect-square transition-all cursor-pointer ${
                      isSelected 
                        ? 'ring-[3px] ring-[#0A1E3F] ring-offset-2 ring-offset-[#C59B27] scale-105 shadow-md' 
                        : 'ring-2 ring-slate-200 hover:ring-[#C59B27]/70'
                    }`}
                    title={p.label}
                  >
                    <img 
                      src={p.url} 
                      alt={p.label} 
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#0A1E3F]/40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full gold-gradient-bg flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-[#071530] stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 hover:text-[#C1272D] flex items-center gap-1.5 cursor-pointer px-2 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl gold-gradient-bg text-[#071530] text-xs font-black shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Appliquer la photo</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function ProfileView({ user: propUser, onUserUpdate }) {
  const [user, setUser] = useState(propUser);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(() => getUserAvatar(propUser));
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '' });
  const [editBaseline, setEditBaseline] = useState(null);
  const navigate = useNavigate();

  const startEdit = () => {
    const next = {
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      telephone: user?.telephone || '',
    };
    setForm(next);
    setEditBaseline(next);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({ prenom: '', nom: '', telephone: '' });
    setEditBaseline(null);
  };

  const isProfileDirty = !!(editBaseline && (
    form.prenom.trim() !== (editBaseline.prenom || '').trim()
    || form.nom.trim() !== (editBaseline.nom || '').trim()
    || form.telephone.trim() !== (editBaseline.telephone || '').trim()
  ));

  const saveProfile = async (e) => {
    e?.preventDefault?.();
    if (!isProfileDirty || saving) return;
    const prenom = form.prenom.trim();
    const nom = form.nom.trim();
    if (prenom.length < 2 || nom.length < 2) {
      toast.error('Le prénom et le nom doivent contenir au moins 2 caractères.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/auth/me', {
        prenom,
        nom,
        telephone: form.telephone.trim(),
      });
      const userData = res?.data || res?.utilisateur || res;
      if (userData && userData.email) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (onUserUpdate) onUserUpdate(userData);
      }
      toast.success('Informations personnelles mises à jour.');
      setEditing(false);
      setEditBaseline(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible d’enregistrer le profil.'));
    } finally {
      setSaving(false);
    }
  };

  // Écouter les mises à jour dynamiques d'avatar partout dans l'app
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e?.detail?.avatarUrl) {
        setAvatarUrl(e.detail.avatarUrl);
      }
    };
    window.addEventListener('parkauto:avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('parkauto:avatar-updated', handleAvatarUpdate);
  }, []);

  // Fetch fresh user data from /auth/me
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res?.data || res?.utilisateur || res;
        if (userData && userData.email) {
          setUser(userData);
          setAvatarUrl(getUserAvatar(userData));
          localStorage.setItem('user', JSON.stringify(userData));
          if (onUserUpdate) onUserUpdate(userData);
        }
      } catch (e) {
        // Fallback to prop user
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'ADMIN');
  const roleLabel = ROLE_LABELS[roleName] || roleName;
  const initials = ((user?.prenom?.[0] || 'S') + (user?.nom?.[0] || 'A')).toUpperCase();
  const createdAt = user?.dateCreation 
    ? new Date(user.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#C59B27]" />
          <p className="text-sm font-medium">Chargement du profil sécurisé…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Modal d'édition d'avatar */}
      {showAvatarModal && (
        <AvatarModal 
          user={user}
          currentAvatar={avatarUrl}
          onClose={() => setShowAvatarModal(false)}
          onAvatarSaved={(newUrl) => setAvatarUrl(newUrl)}
          onUserUpdate={(updated) => {
            setUser(updated);
            if (onUserUpdate) onUserUpdate(updated);
          }}
        />
      )}

      {/* ══════════════════════════════════════════════
          HERO PROFILE CARD (Institutional MEF Luxury)
      ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-[#E2E8F0] overflow-hidden">
        
        {/* Top Royal Banner */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-[#06152B] via-[#0A1E3F] to-[#122B55] relative overflow-hidden">
          
          {/* Subtle Moroccan Geometric Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mef-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M30 0 L37 14 L52 8 L46 23 L60 30 L46 37 L52 52 L37 46 L30 60 L23 46 L8 52 L14 37 L0 30 L14 23 L8 8 L23 14 Z" 
                        fill="none" stroke="#C59B27" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mef-pattern)" />
            </svg>
          </div>

          {/* Golden radial ambient light */}
          <div className="absolute -top-20 right-1/4 w-80 h-80 bg-[#C59B27]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Institutional Ribbon inside banner */}
          <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-[#D7B14A] shadow-inner">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-black tracking-widest text-[#D7B14A] uppercase font-['Outfit']">
                  Royaume du Maroc
                </span>
                <span className="text-[10px] text-slate-300 font-medium hidden sm:inline-block">
                  Ministère de l'Économie et des Finances
                </span>
              </div>
            </div>

            {/* Official Badge Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D7B14A] text-[11px] font-bold shadow-sm">
              <StarBadge className="w-3.5 h-3.5 text-[#D7B14A]" />
              <span className="text-white">Portail MEF</span>
            </div>
          </div>

          {/* Institutional Gold Accent Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] gold-gradient-bg shadow-md" />
        </div>

        {/* Profile Details Container (Strictly below the banner line) */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative">
          
          {/* Top Row: Avatar Overlap + Header Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
            
            {/* Avatar Container with Interactive Edit Trigger */}
            <div 
              onClick={() => setShowAvatarModal(true)}
              className="relative inline-block flex-shrink-0 cursor-pointer group"
              title="Cliquer pour modifier votre photo de profil"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white relative shadow-2xl ring-[3px] ring-[#0A1E3F] ring-offset-2 ring-offset-[#C59B27] transition-transform group-hover:scale-[1.02]">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full gold-gradient-bg text-[#071530] text-3xl font-black flex items-center justify-center rounded-full">${initials}</div>`;
                  }}
                />

                {/* Hover overlay with Camera */}
                <div className="absolute inset-0 rounded-full bg-[#0A1E3F]/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-2 text-center">
                  <Camera className="w-6 h-6 text-[#D7B14A]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D7B14A]">Modifier</span>
                </div>
              </div>

              {/* Verified Emblem / Camera action badge */}
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0A1E3F] border-2 border-white flex items-center justify-center text-[#D7B14A] shadow-lg group-hover:bg-[#C59B27] group-hover:text-[#071530] transition-colors"
                title="Modifier la photo"
              >
                <Camera className="w-4 h-4" />
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-0 self-start sm:self-end">
              <button
                onClick={() => setShowAvatarModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#C59B27] hover:bg-[#C59B27]/5 text-[#0A1E3F] text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
              >
                <Camera className="w-3.5 h-3.5 text-[#C59B27] group-hover:scale-110 transition-transform" />
                <span>Changer la photo</span>
              </button>

              <button
                onClick={() => navigate('/profil/mot-de-passe')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0A1E3F] to-[#122B55] hover:from-[#122B55] hover:to-[#0A1E3F] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-[#C59B27]/30 group"
              >
                <Lock className="w-3.5 h-3.5 text-[#D7B14A] group-hover:scale-110 transition-transform" />
                <span>Modifier le mot de passe</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D7B14A] opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* User Identity & Badges Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A1E3F] font-['Outfit'] tracking-tight">
                {user?.prenom} {user?.nom}
              </h1>

              {/* Status Badge with Pulsing Emerald Glow */}
              {user?.statut && (
                <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${
                  user.statut === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${user.statut === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {user.statut === 'ACTIVE' ? 'Compte Actif' : user.statut}
                </span>
              )}
            </div>

            {/* Metas / Chips Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-extrabold text-[#071530] px-3.5 py-1.5 rounded-xl gold-gradient-bg shadow-sm tracking-wide uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#071530]" />
                {roleLabel}
              </span>

              {user?.matricule && (
                <span className="text-xs font-medium text-slate-600 bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Hash className="w-3 h-3 text-[#C59B27]" />
                  Matricule : <strong className="text-[#0A1E3F] font-bold">{user.matricule}</strong>
                </span>
              )}

              {user?.direction && (
                <span className="text-xs font-medium text-slate-600 bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Landmark className="w-3 h-3 text-[#0A1E3F]" />
                  {user.direction}
                </span>
              )}

              {user?.email && (
                <span className="text-xs font-medium text-slate-500 bg-[#F4F6FB] border border-[#E2E8F0] px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {user.email}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TWO-COLUMN INFO GRID
      ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Informations Personnelles */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between gap-3 pb-4 mb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0A1E3F] flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-[#D7B14A]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#0A1E3F] font-['Outfit'] uppercase tracking-wide">
                  Informations Personnelles
                </h2>
                <p className="text-[11px] text-slate-400">Coordonnées et identification agent</p>
              </div>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0A1E3F] hover:border-[#C59B27]/50 shrink-0"
              >
                <Pencil className="w-3.5 h-3.5 text-[#C59B27]" />
                Modifier
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={saveProfile} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prénom</span>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0A1E3F] outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20"
                    autoComplete="given-name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nom</span>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0A1E3F] outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20"
                    autoComplete="family-name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Téléphone professionnel</span>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  placeholder="06 12 34 56 78"
                  className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0A1E3F] outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20"
                  autoComplete="tel"
                  maxLength={20}
                />
              </label>
              <p className="text-[11px] text-slate-400">
                L’email, le matricule et l’habilitation sont gérés par l’administration.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !isProfileDirty}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient-bg text-[#071530] text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-0.5">
              <InfoRow icon={User} label="Nom complet" value={`${user?.prenom || ''} ${user?.nom || ''}`} />
              <InfoRow icon={Mail} label="Adresse email" value={user?.email} />
              <InfoRow icon={Phone} label="Téléphone professionnel" value={user?.telephone || 'Non renseigné'} />
              <InfoRow icon={Hash} label="Numéro de matricule" value={user?.matricule} />
              {createdAt && <InfoRow icon={Calendar} label="Date d'enregistrement" value={createdAt} />}
            </div>
          )}
        </div>

        {/* 2. Structure Organisationnelle */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-3 pb-4 mb-2 border-b border-[#F1F5F9]">
            <div className="w-9 h-9 rounded-xl bg-[#0A1E3F] flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4 text-[#D7B14A]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0A1E3F] font-['Outfit'] uppercase tracking-wide">
                Structure Organisationnelle
              </h2>
              <p className="text-[11px] text-slate-400">Affectation administrative MEF</p>
            </div>
          </div>

          <div className="space-y-0.5">
            <InfoRow icon={Landmark} label="Direction MEF" value={user?.direction || 'Direction Centrale'} iconColor="text-blue-500" />
            <InfoRow icon={Briefcase} label="Service / Division" value={user?.service || 'Service Logistique & Parc'} iconColor="text-emerald-500" />
            <InfoRow icon={MapPin} label="Région / Siège" value={user?.region || 'Rabat-Salé-Kénitra (Siège Central)'} iconColor="text-violet-500" />
            <InfoRow icon={Shield} label="Habilitation système" value={roleLabel} iconColor="text-[#C59B27]" />
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          ACCOUNT SECURITY CARD
      ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A1E3F] flex items-center justify-center shadow-sm">
              <Lock className="w-4 h-4 text-[#D7B14A]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0A1E3F] font-['Outfit'] uppercase tracking-wide">
                Sécurité du Compte & Conformité
              </h2>
              <p className="text-[11px] text-slate-400">Politique de sécurité et protection des accès</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/profil/mot-de-passe')}
            className="text-xs font-bold text-[#C59B27] hover:text-[#A07B1E] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto group"
          >
            <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Changer le mot de passe</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Statut du mot de passe</p>
              <p className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
                user?.doitChangerMotDePasse ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {user?.doitChangerMotDePasse ? '⚠ Changement requis' : '✓ Conforme à la politique DGSSI'}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              user?.doitChangerMotDePasse ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Niveau d'habilitation</p>
              <p className="text-sm font-bold text-[#0A1E3F] mt-1">{roleLabel}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 text-[#C59B27] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
