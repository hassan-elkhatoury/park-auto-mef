import React from 'react';
import { motion } from 'framer-motion';
import { Fuel, Wrench, Gauge, Droplets, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  { icon: Fuel, label: 'Gestion du Carburant', desc: 'Suivi des bons de carburant et consommations', color: 'bg-[#C59B27]' },
  { icon: Droplets, label: 'Consommations', desc: 'Analyse L/100km par véhicule et par direction', color: 'bg-[#0A1E3F]' },
  { icon: Wrench, label: 'Entretien & Réparations', desc: 'Planification des maintenances périodiques', color: 'bg-[#C47D2B]' },
  { icon: Gauge, label: 'Kilométrage', desc: 'Indicateurs de kilométrage de la flotte', color: 'bg-[#1565C0]' },
];

export default function CarburantView() {
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
            <div className="w-11 h-11 rounded-xl bg-[#C47D2B] flex items-center justify-center text-white shadow-sm">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black font-outfit text-[#0A1E3F] leading-tight">
                  Carburant & Maintenance
                </h2>
                <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">الوقود والصيانة</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Entretien / Réparation de la flotte automobile du Ministère
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.label}
                className="bg-white rounded-2xl border border-cardline p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <div className={`w-12 h-12 rounded-full ${mod.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-[#0A1E3F] block">{mod.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">{mod.desc}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="bg-[#0A1E3F] rounded-2xl border border-[#C59B27]/25 p-8 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="zellige-sidebar-art absolute inset-0 opacity-40 pointer-events-none" />
          <div className="relative">
            <AlertTriangle className="w-10 h-10 text-[#D7B14A] mx-auto mb-3" />
            <h3 className="text-xl font-black font-outfit text-white">Module en cours de déploiement</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
              Le suivi détaillé du carburant et de la maintenance sera bientôt disponible dans cette interface.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 mt-5 bg-[#C59B27] hover:bg-[#B8860B] text-[#071530] font-bold text-xs px-6 py-2.5 rounded-full transition-colors"
            >
              Retour au Tableau de Bord
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
