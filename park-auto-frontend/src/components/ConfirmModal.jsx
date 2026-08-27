import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Trash2, X, Check, Lock, AlertCircle, MessageSquare } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = "Confirmation requise",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  badgeText = "Action enregistrée dans le journal d'audit MEF",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger", // 'danger' | 'warning' | 'info' | 'prompt'
  promptLabel = "",
  promptPlaceholder = "",
  onConfirm,
  onClose,
  onCancel,
  loading = false
}) {
  const [promptValue, setPromptValue] = useState('');

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isPrompt = variant === 'prompt';

  const handleDismiss = () => {
    setPromptValue('');
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    if (isPrompt) {
      if (onConfirm) onConfirm(promptValue);
    } else {
      if (onConfirm) onConfirm();
    }
  };

  const iconBg = isDanger
    ? 'bg-rose-50 border-rose-200 text-rose-600'
    : isWarning
    ? 'bg-amber-50 border-amber-200 text-amber-600'
    : isPrompt
    ? 'bg-blue-50 border-blue-200 text-blue-600'
    : 'bg-blue-50 border-blue-200 text-blue-600';

  const accentBar = isDanger
    ? 'from-rose-500 via-[#C59B27] to-[#0A1E3F]'
    : isWarning
    ? 'from-amber-400 via-[#C59B27] to-[#0A1E3F]'
    : 'from-[#0A1E3F] via-blue-600 to-[#C59B27]';

  const confirmBtnClass = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-extrabold'
    : isWarning
    ? 'gold-gradient-bg text-[#0A1E3F] hover:brightness-105 shadow-gold font-extrabold'
    : 'bg-[#0A1E3F] hover:bg-[#122B55] text-white shadow-sm font-extrabold';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl shadow-slate-900/15 relative overflow-hidden"
        >
          {/* Top Accent Gradient Bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${accentBar}`} />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {isDanger ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : isWarning ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : isPrompt ? (
                  <MessageSquare className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base font-black text-[#0A1E3F] tracking-wide leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Prompt Input (if variant === 'prompt') */}
            {isPrompt && (
              <div className="mt-4">
                {promptLabel && (
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {promptLabel}
                  </label>
                )}
                <textarea
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptPlaceholder || "Saisissez votre texte ici..."}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] resize-none transition-all"
                  autoFocus
                />
              </div>
            )}

            {/* Institutional Security Badge */}
            {badgeText && (
              <div className="mt-4 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] font-semibold text-slate-600 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0" />
                <span className="leading-tight">{badgeText}</span>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || (isPrompt && !promptValue.trim())}
              className={`px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtnClass}`}
            >
              {loading ? (
                <span className="inline-block animate-spin font-black">↻</span>
              ) : isDanger ? (
                <Trash2 className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
