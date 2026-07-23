import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, Crown, CheckCircle2, Landmark } from 'lucide-react';
import api from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@mef.gov.ma');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, motDePasse: password });
      if (res && res.data) {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.data.utilisateur));
        onLoginSuccess(res.data.utilisateur);
      }
    } catch (err) {
      setError(err.message || 'Adresse email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#070D1B]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.35] contrast-[1.15] z-1" 
        style={{ backgroundImage: `url('/assets/bg_mef.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#070D1B]/95 via-[#0F172A]/85 to-[#070D1B]/95 z-2" />
      <div className="absolute inset-0 moroccan-bg-overlay opacity-40 z-3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1320px] px-8 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-16 items-center">
        
        {/* Left Side: Presentation */}
        <div className="hidden lg:flex flex-col gap-7 text-white">
          <div>
            <img src="/assets/logo.png" alt="Royaume du Maroc - MEF" className="max-w-[360px] h-auto drop-shadow-xl mb-4" />
            <div className="inline-flex items-center gap-2 bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C17C] px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
              <Crown className="w-3.5 h-3.5" /> ROYAUME DU MAROC
            </div>
            <h1 className="text-4xl font-black font-['Outfit'] tracking-wide text-white leading-tight">
              PARK AUTO <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5C17C] via-[#C5A059] to-[#9B783E]">MEF</span>
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-[540px] leading-relaxed">
              Système centralisé de gestion et de suivi du parc automobile du Ministère de l'Économie et des Finances
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-start gap-3.5 bg-[#0F172A]/65 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:border-[#C5A059]/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C17C] flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Gestion en temps réel</h4>
                <p className="text-[11px] text-slate-400">Suivi complet des véhicules du parc</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-[#0F172A]/65 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:border-[#C5A059]/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Sécurité & Conformité</h4>
                <p className="text-[11px] text-slate-400">Contrôle des droits et habilitations</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-[#C5A059]/10 border border-[#C5A059]/30 p-3.5 rounded-xl">
            <Lock className="w-5 h-5 text-[#E5C17C]" />
            <div className="text-xs">
              <strong className="text-amber-200 block">Accès Sécurisé — Direction du Budget</strong>
              <span className="text-slate-300">Portail officiel réservé aux agents habilités du MEF</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">© 2026 Ministère de l'Économie et des Finances — Royaume du Maroc</p>
        </div>

        {/* Right Side: Glassmorphism Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-[450px] glass-panel rounded-3xl p-9 text-white shadow-2xl">
            <div className="flex flex-col items-center text-center mb-7">
              <div className="w-14 h-14 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C17C] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(197,160,89,0.25)]">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold font-['Outfit'] text-white">Espace Connexion</h2>
              <p className="text-xs text-slate-400 mt-1">Identifiez-vous pour accéder à votre session</p>
              <div className="w-11 h-1 gold-gradient-bg rounded-full mt-3" />
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#E5C17C]" /> Email Professionnel
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#070D1B]/80 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-[#E5C17C] focus:ring-2 focus:ring-[#C5A059]/30 transition-all"
                  placeholder="admin@mef.gov.ma"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#E5C17C]" /> Mot de Passe
                </label>
                <div className="relative flex items-center">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#070D1B]/80 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-[#E5C17C] focus:ring-2 focus:ring-[#C5A059]/30 transition-all pr-10"
                    placeholder="••••••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 gold-gradient-bg text-[#070D1B] font-extrabold text-sm rounded-xl gold-glow hover:brightness-110 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
              >
                <span>{loading ? "Connexion..." : "Se Connecter"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center text-center text-slate-400 text-[11px] font-bold tracking-wider my-1">
                <div className="flex-1 border-b border-white/15" />
                <span className="px-3">OU</span>
                <div className="flex-1 border-b border-white/15" />
              </div>

              <button 
                type="button"
                className="w-full py-3 bg-white/5 border border-[#C5A059]/35 text-white font-semibold text-xs rounded-xl hover:bg-[#C5A059]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-[#E5C17C]" />
                <span>Authentification SSO MEF</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Session chiffrée SSL / TLS — Connexion surveillée</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
