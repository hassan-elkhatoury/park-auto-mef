import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Trash2, X, Check, Lock, AlertCircle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = "Confirmation requise",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  badgeText = "Action enregistrée dans le journal d'audit MEF",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger", // 'danger' | 'warning' | 'info'
  onConfirm,
  onClose,
  loading = false
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#070D1B]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl p-6 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white relative overflow-hidden"
        >
          {/* Top Gold/Red Gradient Accent Bar */}
          <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${
            isDanger 
              ? 'from-red-600 via-rose-500 to-[#C5A059]' 
              : isWarning 
              ? 'from-amber-500 via-[#C5A059] to-amber-600' 
              : 'from-blue-600 via-sky-500 to-[#C5A059]'
          }`} />

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Header */}
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              isDanger 
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 shadow-red-500/10' 
                : isWarning 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-amber-500/10' 
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-blue-500/10'
            }`}>
              {isDanger ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-lg font-black font-['Outfit'] tracking-wide text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                {message}
              </p>

              {/* Institutional Badge */}
              {badgeText && (
                <div className="mt-3.5 px-3 py-2 bg-[#070D1B] border border-[#C5A059]/30 rounded-xl text-[11px] font-semibold text-[#E5C17C] flex items-center gap-2 shadow-inner">
                  <Lock className="w-3.5 h-3.5 text-[#E5C17C] flex-shrink-0" />
                  <span className="leading-tight">{badgeText}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
                isDanger
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/30'
                  : isWarning
                  ? 'gold-gradient-bg text-[#070D1B] hover:brightness-110 shadow-[#C5A059]/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
              }`}
            >
              {loading ? (
                <span className="inline-block animate-spin font-black">↻</span>
              ) : isDanger ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
