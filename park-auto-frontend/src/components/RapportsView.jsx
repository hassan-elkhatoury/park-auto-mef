import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieIcon, TrendingUp, Table2, FileBarChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const reportTypes = [
  { icon: Table2, label: 'État de la Flotte', desc: 'Liste exhaustive des véhicules et statuts', color: 'bg-[#0A1E3F]' },
  { icon: PieIcon, label: 'Répartition par Direction', desc: 'Analyse par direction MEF', color: 'bg-[#C59B27]' },
  { icon: TrendingUp, label: 'Consommation', desc: 'Tendances de carburant L/100km', color: 'bg-[#0D7A5F]' },
  { icon: BarChart3, label: 'Disponibilité', desc: 'Taux d\'utilisation de la flotte', color: 'bg-[#1565C0]' },
];

export default function RapportsView() {
  return (
    <div className="flex-1 p-7 overflow-y-auto zellige-pattern">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">

        <motion.div
          className="relative bg-white rounded-2xl border border-cardline shadow-sm px-6 py-5 overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 card-zellij-watermark opacity-60 pointer-events-none" />
          <div className="relative flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black font-outfit text-[#0A1E3F] leading-tight">
                  Rapports & Indicateurs
                </h2>
                <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">التقارير والمؤشرات</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Analyses & Statistiques de la flotte automobile du Ministère
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.button
                key={r.label}
                className="bg-white rounded-2xl border border-cardline p-5 shadow-sm hover:shadow-md transition-all text-left group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <div className={`w-12 h-12 rounded-full ${r.color} flex items-center justify-center text-white shadow-sm mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-extrabold text-[#0A1E3F] block">{r.label}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">{r.desc}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C59B27] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Générer le rapport <ArrowRight className="w-3 h-3" />
                </span>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          className="bg-white rounded-2xl border border-cardline p-8 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="absolute inset-0 card-zellij-watermark opacity-50 pointer-events-none" />
          <div className="relative">
            <BarChart3 className="w-10 h-10 text-[#C59B27] mx-auto mb-3" />
            <h3 className="text-lg font-black font-outfit text-[#0A1E3F]">Génération de rapports détaillés</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
              Les rapports détaillés et exports PDF/Excel seront prochainement disponibles.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 mt-5 bg-[#0A1E3F] hover:bg-[#122B55] text-white font-bold text-xs px-6 py-2.5 rounded-full transition-colors"
            >
              Retour au Tableau de Bord
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
