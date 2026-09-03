import React, { useState } from 'react';
import { 
  Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowLeft, 
  AlertCircle, Check, X, Landmark, KeyRound, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

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

const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Une lettre majuscule', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Une lettre minuscule', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Un chiffre (0-9)', test: (v) => /\d/.test(v) },
  { id: 'special', label: 'Un caractère spécial (@$!%*?&)', test: (v) => /[@$!%*?&]/.test(v) },
];

export default function ChangePasswordView({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const rulesPassedCount = PASSWORD_RULES.filter(r => r.test(nouveauMotDePasse)).length;
  const strengthPercent = Math.round((rulesPassedCount / PASSWORD_RULES.length) * 100);

  const allRulesPass = rulesPassedCount === PASSWORD_RULES.length;
  const passwordsMatch = Boolean(nouveauMotDePasse && confirmationMotDePasse && nouveauMotDePasse === confirmationMotDePasse);
  const isDifferent = Boolean(nouveauMotDePasse && ancienMotDePasse && nouveauMotDePasse !== ancienMotDePasse);
  const canSubmit = allRulesPass && passwordsMatch && isDifferent && Boolean(ancienMotDePasse);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        ancienMotDePasse,
        nouveauMotDePasse,
      });

      setSuccess(true);
      toast.success('Mot de passe mis à jour avec succès !');

      if (user) {
        const updatedUser = { 
          ...user, 
          doitChangerMotDePasse: false, 
          mustChangePassword: false, 
          firstLogin: false 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUserUpdate) onUserUpdate(updatedUser);
      }

      setTimeout(() => navigate('/profil'), 1800);
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || "Échec de la modification. Vérifiez votre mot de passe actuel.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-[#E2E8F0] animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-2xl gold-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C59B27]/20">
            <CheckCircle2 className="w-10 h-10 text-[#071530]" />
          </div>
          <h2 className="text-2xl font-black text-[#0A1E3F] font-['Outfit']">Mot de Passe Mis à Jour !</h2>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Votre compte est désormais sécurisé selon les directives MEF. Redirection vers votre profil en cours…
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Back to Profile Button */}
      <button
        onClick={() => navigate('/profil')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0A1E3F] hover:bg-[#C59B27]/10 hover:border-[#C59B27]/40 shadow-xs transition-all cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 text-[#C59B27] group-hover:-translate-x-0.5 transition-transform" />
        <span>Retourner au profil</span>
      </button>

      {/* Main Luxury Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-[#E2E8F0] overflow-hidden">

        {/* Institutional Royal Header Banner */}
        <div className="bg-gradient-to-r from-[#06152B] via-[#0A1E3F] to-[#122B55] px-6 py-8 text-center relative overflow-hidden">
          
          {/* Moroccan Star Watermark Background */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pwd-mef-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M25 0 L31 12 L44 7 L39 19 L50 25 L39 31 L44 44 L31 39 L25 50 L19 39 L7 44 L12 31 L0 25 L12 19 L7 7 L19 12 Z" 
                        fill="none" stroke="#C59B27" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pwd-mef-pattern)" />
            </svg>
          </div>

          {/* Golden Shield Emblem */}
          <div className="relative z-10 w-16 h-16 rounded-2xl gold-gradient-bg mx-auto flex items-center justify-center mb-4 shadow-xl border-2 border-white/20">
            <ShieldCheck className="w-8 h-8 text-[#071530]" />
          </div>

          {/* Title with Explicit High-Contrast White Color */}
          <h1 className="relative z-10 text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight !text-white drop-shadow-sm">
            Changer le Mot de Passe
          </h1>

          {/* Subtitle */}
          <p className="relative z-10 text-xs text-[#D7B14A] mt-2 font-semibold tracking-wide flex items-center justify-center gap-1.5">
            <StarBadge className="w-3.5 h-3.5 text-[#D7B14A]" />
            <span>Sécurité du Compte — Ministère de l'Économie et des Finances</span>
          </p>

          {/* Bottom Gold Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] gold-gradient-bg shadow-md" />
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {/* DGSSI Security Banner */}
          <div className="bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#0A1E3F] flex items-center justify-center flex-shrink-0 text-[#D7B14A] shadow-xs mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-black text-[#0A1E3F] uppercase tracking-wide">
                Directives de Sécurité DGSSI
              </strong>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Le mot de passe doit comporter au moins 8 caractères avec majuscule, minuscule, chiffre et symbole (@$!%*?&). Il ne doit pas être identique au mot de passe actuel.
              </p>
            </div>
          </div>

          {/* Field 1: Current password */}
          <div>
            <label className="text-xs font-black text-[#0A1E3F] uppercase tracking-wider block mb-2">
              Mot de passe actuel <span className="text-[#C1272D]">*</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={ancienMotDePasse}
                onChange={(e) => setAncienMotDePasse(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                className="w-full h-12 px-4 pr-12 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0A1E3F] outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 transition-all shadow-2xs"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowOld(!showOld)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0A1E3F] p-1 cursor-pointer transition-colors"
                title={showOld ? "Masquer" : "Afficher"}
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 2: New password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-[#0A1E3F] uppercase tracking-wider block">
                Nouveau mot de passe <span className="text-[#C1272D]">*</span>
              </label>
              {nouveauMotDePasse && (
                <span className={`text-[11px] font-bold ${
                  strengthPercent === 100 ? 'text-emerald-600' :
                  strengthPercent >= 60 ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  Robustesse : {strengthPercent}%
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                placeholder="Créez un nouveau mot de passe fort"
                className="w-full h-12 px-4 pr-12 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0A1E3F] outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 transition-all shadow-2xs"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0A1E3F] p-1 cursor-pointer transition-colors"
                title={showNew ? "Masquer" : "Afficher"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Visual Password Strength Meter */}
            {nouveauMotDePasse && (
              <div className="mt-2.5">
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      strengthPercent === 100 ? 'bg-emerald-500' :
                      strengthPercent >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${strengthPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checklist of security rules */}
            {nouveauMotDePasse && (
              <div className="mt-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PASSWORD_RULES.map(rule => {
                  const passed = rule.test(nouveauMotDePasse);
                  return (
                    <div key={rule.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        passed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {passed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5" />}
                      </div>
                      <span className={`text-[11px] font-semibold ${passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}

                {/* Same as old warning */}
                {ancienMotDePasse && nouveauMotDePasse === ancienMotDePasse && (
                  <div className="col-span-full flex items-center gap-2 pt-1 text-amber-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[11px] font-bold">Le nouveau mot de passe doit être différent du mot de passe actuel</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field 3: Confirmation */}
          <div>
            <label className="text-xs font-black text-[#0A1E3F] uppercase tracking-wider block mb-2">
              Confirmer le nouveau mot de passe <span className="text-[#C1272D]">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmationMotDePasse}
                onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                className={`w-full h-12 px-4 pr-12 bg-white border rounded-xl text-sm font-medium text-[#0A1E3F] outline-none focus:ring-2 transition-all shadow-2xs ${
                  confirmationMotDePasse && !passwordsMatch
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                    : confirmationMotDePasse && passwordsMatch
                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100'
                    : 'border-[#E2E8F0] focus:border-[#C59B27] focus:ring-[#C59B27]/15'
                }`}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0A1E3F] p-1 cursor-pointer transition-colors"
                title={showConfirm ? "Masquer" : "Afficher"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Matching Feedback */}
            {confirmationMotDePasse && !passwordsMatch && (
              <p className="text-[11px] text-rose-500 font-bold mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Les mots de passe ne correspondent pas
              </p>
            )}
            {confirmationMotDePasse && passwordsMatch && (
              <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Les mots de passe correspondent parfaitement
              </p>
            )}
          </div>

          {/* Submit Button & Status Hint */}
          <div className="space-y-2 pt-3">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className={`w-full min-h-[56px] py-4 px-6 font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden ${
                canSubmit
                  ? 'gold-gradient-bg text-[#071530] hover:shadow-xl hover:shadow-[#C59B27]/30 hover:brightness-105 active:scale-[0.99] cursor-pointer border border-[#D7B14A]'
                  : 'bg-[#0A1E3F] text-white border border-[#0A1E3F] opacity-95 cursor-not-allowed shadow-md'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mise à jour sécurisée en cours…</span>
                </>
              ) : canSubmit ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-[#071530]" />
                  <span className="tracking-wide">Valider le Nouveau Mot de Passe</span>
                  <Sparkles className="w-5 h-5 text-[#071530] opacity-90" />
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-[#D7B14A]" />
                  <span className="text-white font-extrabold tracking-wide">Valider le Nouveau Mot de Passe</span>
                </>
              )}
            </button>

            {!canSubmit && (
              <p className="text-[11px] text-center text-slate-400 font-medium pt-1">
                Remplissez les champs ci-dessus conformément aux critères DGSSI pour déverrouiller la validation.
              </p>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}
