import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2, Landmark, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { saveUserAvatar } from '../services/avatarService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const utilisateur = res.data.utilisateur;
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(utilisateur));
        if (utilisateur?.photoUrl) {
          saveUserAvatar(utilisateur, utilisateur.photoUrl);
        }
        toast.success('Connexion réussie — Bienvenue !');
        onLoginSuccess(utilisateur);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Email ou mot de passe incorrect. Veuillez vérifier votre saisie.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#091B36]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center brightness-[0.35] contrast-[1.15]" 
        style={{ backgroundImage: `url('/assets/bg_mef.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#091B36]/95 via-[#0A1E3F]/85 to-[#091B36]/95" />
      <div className="absolute inset-0 moroccan-bg-overlay opacity-40 pointer-events-none" />

      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-[1320px] px-8 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-16 items-center">
        
        {/* Left Side: Presentation */}
        <motion.div 
          className="hidden lg:flex flex-col gap-8 text-white"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="space-y-6">
            {/* Side-by-Side Official Logos: Royal Coat of Arms & MEF Gold State Seal */}
            <motion.div 
              className="flex items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="/assets/logo.png" 
                alt="Ministère de l'Économie et des Finances" 
                className="max-w-[280px] h-auto drop-shadow-2xl object-contain" 
              />
              <div className="h-20 w-[1px] bg-[#C59B27]/40" />
              <img 
                src="/assets/royaume_logo.png" 
                alt="Royaume du Maroc" 
                className="h-44 w-auto object-contain drop-shadow-2xl" 
              />
            </motion.div>

            <div>
              <h1 className="text-4xl font-extrabold font-outfit text-white leading-tight">
                Système de Gestion du <br />
                <span className="gold-gradient-text">Parc Automobile</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-[500px] mt-3 leading-relaxed font-normal">
                Plateforme informatique gouvernementale de suivi, de contrôle et de gestion du parc automobile du Ministère de l'Économie et des Finances du Royaume du Maroc.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-[#D7B14A]">Royaume du Maroc — MEF</span>
            <span>Accès Réservé aux Agents Habilités</span>
          </div>
        </motion.div>

        {/* Right Side: Glassmorphism Card */}
        <div className="flex justify-center">
          <motion.div 
            className="w-full max-w-[450px] glass-panel rounded-3xl p-9 text-white shadow-2xl hover:border-[#C59B27]/40 transition-all duration-500"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <motion.div 
              className="flex flex-col items-center text-center mb-7"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="w-20 h-20 rounded-2xl overflow-hidden bg-white p-1.5 border-2 border-[#C59B27] shadow-[0_0_30px_rgba(197,160,89,0.35)] mb-3 flex items-center justify-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src="/assets/park_auto_logo.jpg" 
                  alt="Logo PARK AUTO MEF" 
                  className="w-full h-full object-contain" 
                />
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-2xl font-extrabold font-outfit text-white">
                Espace Connexion
              </motion.h2>
              <motion.p variants={itemVariants} className="text-xs text-slate-400 mt-1">
                Identifiez-vous pour accéder à votre session
              </motion.p>
              <motion.div variants={itemVariants} className="w-11 h-1 gold-gradient-bg rounded-full mt-3" />
            </motion.div>

            {error && (
              <motion.div
                className="bg-[#C8102E] border border-red-400/50 text-white text-xs font-bold p-3 rounded-xl mb-4 flex items-center gap-2.5 shadow-[0_4px_20px_rgba(200,16,46,0.4)]"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                role="alert"
              >
                <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center font-black text-sm flex-shrink-0">!</span>
                <span>{error}</span>
              </motion.div>
            )}

            <motion.form 
              onSubmit={handleSubmit} 
              className="flex flex-col gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D7B14A]" /> Email Professionnel
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#091B36]/80 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-[#D7B14A] focus:ring-2 focus:ring-[#C59B27]/30 transition-all placeholder:text-slate-500"
                  placeholder="prenom.nom@mef.gov.ma"
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#D7B14A]" /> Mot de Passe
                </label>
                <div className="relative flex items-center">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#091B36]/80 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-[#D7B14A] focus:ring-2 focus:ring-[#C59B27]/30 transition-all pr-10 placeholder:text-slate-500"
                    placeholder="••••••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 gold-gradient-bg text-[#091B36] font-extrabold text-sm rounded-xl gold-glow flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                variants={itemVariants}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 8px 32px rgba(197,160,89,0.5)' }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se Connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <motion.div variants={itemVariants} className="flex items-center text-center text-slate-400 text-[11px] font-bold tracking-wider my-1">
                <div className="flex-1 border-b border-white/15" />
                <span className="px-3">OU</span>
                <div className="flex-1 border-b border-white/15" />
              </motion.div>

              <motion.button 
                type="button"
                className="w-full py-3 bg-white/5 border border-[#C59B27]/35 text-white font-semibold text-xs rounded-xl hover:bg-[#C59B27]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <Landmark className="w-4 h-4 text-[#D7B14A]" />
                <span>Authentification SSO MEF</span>
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
