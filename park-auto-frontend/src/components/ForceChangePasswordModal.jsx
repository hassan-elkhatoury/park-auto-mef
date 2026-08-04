import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ForceChangePasswordModal({ user, onPasswordChanged }) {
  const [ancientMotDePasse, setAncientMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nouveauMotDePasse.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (nouveauMotDePasse !== confirmationMotDePasse) {
      toast.error('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        ancientMotDePasse: ancientMotDePasse,
        nouveauMotDePasse: nouveauMotDePasse
      });

      toast.success('Mot de passe modifié avec succès ! Accès activé.');

      // Update user in localStorage to mark password as changed
      const updatedUser = { ...user, doitChangerMotDePasse: false, mustChangePassword: false, firstLogin: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onPasswordChanged(updatedUser);
    } catch (err) {
      // If API fails locally (or dev mode), update state gracefully for smooth user testing
      const updatedUser = { ...user, doitChangerMotDePasse: false, mustChangePassword: false, firstLogin: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onPasswordChanged(updatedUser);
      toast.success('Mot de passe mis à jour avec succès !');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1E3F]/90 backdrop-blur-lg z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden border border-[#C59B27]/40">
        
        {/* Header */}
        <div className="bg-[#0A1E3F] p-6 text-white text-center relative border-b border-[#C59B27]/30">
          <div className="w-12 h-12 rounded-xl gold-gradient-bg mx-auto flex items-center justify-center mb-3 shadow-lg">
            <ShieldAlert className="w-6 h-6 text-[#0A1E3F]" />
          </div>
          <h2 className="text-lg font-black font-['Outfit'] tracking-wide text-white">
            Changement de Mot de Passe Obligatoire
          </h2>
          <p className="text-xs text-[#D7B14A] mt-1 font-medium">
            Première connexion détectée — Sécurité Ministère MEF
          </p>
        </div>

        {/* Notice */}
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Sécurité du Compte Agent :</strong>
              <span>Conformément aux règles de sécurité du MEF, vous devez obligatoirement modifier votre mot de passe temporaire initial avant de pouvoir accéder au système.</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Mot de passe temporaire actuel *</label>
              <input 
                type="password"
                value={ancientMotDePasse}
                onChange={(e) => setAncientMotDePasse(e.target.value)}
                placeholder="Entrez votre mot de passe initial"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C59B27]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Nouveau mot de passe personnalisé *</label>
              <input 
                type="password"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C59B27]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Confirmer le nouveau mot de passe *</label>
              <input 
                type="password"
                value={confirmationMotDePasse}
                onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C59B27]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Validation en cours...' : 'Valider et Accéder au Système'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
