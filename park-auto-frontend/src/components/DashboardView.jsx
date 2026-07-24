import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, CheckCircle2, Route, Wrench, RotateCw, Activity, ArrowRight, BarChart3, Fuel, HeartPulse } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';
import { getVehiclePhoto, getStatusStyle, DIRECTIONS_MEF, FUEL_LABELS } from '../utils/vehicule';

// Animated counter component
function AnimatedCounter({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration * 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
}

const metricCards = [
  { key: 'total', label: 'Total Flotte', sub: 'Véhicules enregistrés', icon: Car, color: 'border-t-[#C5A059]', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { key: 'disponibles', label: 'Disponibles', sub: 'Prêts à être affectés', icon: CheckCircle2, color: 'border-t-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', subColor: 'text-emerald-600' },
  { key: 'enMission', label: 'En Mission', sub: 'Affectés / Réservés', icon: Route, color: 'border-t-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', subColor: 'text-blue-600' },
  { key: 'maintenance', label: 'En Maintenance', sub: 'Entretien / Réparation', icon: Wrench, color: 'border-t-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', subColor: 'text-amber-600' },
];

const FUEL_COLORS = { DIESEL: '#0F1D32', ESSENCE: '#C5A059', HYBRIDE: '#10B981', ELECTRIQUE: '#3B82F6' };

const TOOLTIP_STYLE = {
  backgroundColor: '#0F1D32',
  border: '1px solid #1B3050',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
};

const isMaintenance = (v) => ['EN_ENTRETIEN', 'EN_REPARATION', 'IMMOBILISE'].includes(v.statutAdministratif);
const isHorsService = (v) => ['HORS_SERVICE', 'ACCIDENTE', 'REFORME'].includes(v.statutAdministratif) || v.etatTechnique === 'HORS_SERVICE';

export default function DashboardView() {
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicules?size=100');
      if (res && res.data) {
        setVehicules(res.data.content || []);
      }
    } catch (err) {
      console.error('Erreur de chargement des véhicules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicules();
  }, []);

  const metrics = {
    total: vehicules.length,
    disponibles: vehicules.filter((v) => v.statutAdministratif === 'DISPONIBLE').length,
    enMission: vehicules.filter((v) => ['AFFECTE', 'RESERVE'].includes(v.statutAdministratif)).length,
    maintenance: vehicules.filter(isMaintenance).length,
  };

  // Fleet count per official MEF direction (acronyms on the axis)
  const directionData = useMemo(() =>
    DIRECTIONS_MEF.map((d) => ({
      name: d.short,
      fullName: d.value,
      véhicules: vehicules.filter((v) => v.direction === d.value).length,
    })),
  [vehicules]);

  // Fuel mix for the pie chart
  const fuelData = useMemo(() =>
    Object.keys(FUEL_LABELS)
      .map((key) => ({
        name: FUEL_LABELS[key],
        value: vehicules.filter((v) => v.typeCarburant === key).length,
        color: FUEL_COLORS[key],
      }))
      .filter((f) => f.value > 0),
  [vehicules]);

  // Availability & condition donut
  const statusData = useMemo(() => [
    { name: 'Disponibles', value: metrics.disponibles, color: '#10B981' },
    { name: 'En Mission', value: metrics.enMission, color: '#3B82F6' },
    { name: 'En Maintenance', value: metrics.maintenance, color: '#D97706' },
    { name: 'Hors Service', value: vehicules.filter(isHorsService).length, color: '#DC2626' },
    { name: 'Archivés', value: vehicules.filter((v) => v.statutAdministratif === 'ARCHIVE').length, color: '#64748B' },
  ].filter((s) => s.value > 0), [vehicules, metrics.disponibles, metrics.enMission, metrics.maintenance]);

  // Latest fleet movements (most recently modified vehicles first)
  const recentMovements = useMemo(() =>
    [...vehicules]
      .sort((a, b) => new Date(b.dateModification || b.dateCreation || 0) - new Date(a.dateModification || a.dateCreation || 0))
      .slice(0, 6),
  [vehicules]);

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">

        {/* Top Meta Bar */}
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center shadow-gold">
              <BarChart3 className="w-6 h-6 text-[#070D1B]" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-outfit text-slate-900">Analytics &amp; Indicateurs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Vue analytique en temps réel de la flotte automobile du Ministère</p>
            </div>
          </div>
          <button
            onClick={fetchVehicules}
            className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser les Données</span>
          </button>
        </motion.div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.key}
                className={`bg-white border border-slate-200 border-t-4 ${card.color} rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow-card-hover transition-shadow`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -2 }}
              >
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center text-xl flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">{card.label}</span>
                  <span className="text-2xl font-black font-outfit text-slate-900">
                    <AnimatedCounter value={metrics[card.key]} />
                  </span>
                  <span className={`text-[10px] font-bold ${card.subColor || 'text-slate-400'} block`}>{card.sub}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row: Directions bar + Fuel pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#070D1B]" />
              </div>
              <div>
                <h3 className="font-outfit font-extrabold text-sm text-slate-900">Répartition par Direction MEF</h3>
                <p className="text-[10px] text-slate-400">Nombre de véhicules rattachés à chaque direction</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={directionData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'rgba(197,160,89,0.08)' }}
                  labelFormatter={(label) => directionData.find((d) => d.name === label)?.fullName || label}
                />
                <Bar dataKey="véhicules" fill="#C5A059" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Fuel className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-outfit font-extrabold text-sm text-slate-900">Répartition par Carburant</h3>
                <p className="text-[10px] text-slate-400">Motorisation de la flotte</p>
              </div>
            </div>
            {fuelData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={fuelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    outerRadius={88}
                    stroke="#fff"
                    strokeWidth={2}
                    label={({ value }) => value}
                  >
                    {fuelData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Second Row: Status donut + Recent movements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-outfit font-extrabold text-sm text-slate-900">Disponibilité &amp; État du Parc</h3>
                <p className="text-[10px] text-slate-400">Statuts administratifs actuels</p>
              </div>
            </div>
            {statusData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    innerRadius={52}
                    outerRadius={88}
                    stroke="#fff"
                    strokeWidth={2}
                    label={({ value }) => value}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div
            className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#9B783E]" />
                </div>
                <div>
                  <h3 className="font-outfit font-extrabold text-sm text-slate-900">Derniers Mouvements de la Flotte</h3>
                  <p className="text-[10px] text-slate-400">Dernières fiches véhicules créées ou modifiées</p>
                </div>
              </div>
              <Link
                to="/vehicules"
                className="text-[11px] font-bold text-[#9B783E] hover:text-[#070D1B] flex items-center gap-1 transition-colors"
              >
                Toute la flotte <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentMovements.length === 0 ? (
              <div className="py-14 text-center">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-400">{loading ? 'Chargement des données...' : 'Aucun véhicule enregistré pour le moment.'}</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {recentMovements.map((v) => (
                  <Link
                    key={v.id}
                    to={`/vehicules/${v.id}`}
                    className="flex items-center gap-3.5 py-2.5 px-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <img
                      src={getVehiclePhoto(v.marque, v.modele)}
                      alt={`${v.marque} ${v.modele}`}
                      className="w-14 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-extrabold text-slate-900 truncate">{v.marque} {v.modele}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{v.immatriculation}</span>
                    </div>
                    <span className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${getStatusStyle(v.statutAdministratif)}`}>
                      {v.statutAdministratif}
                    </span>
                    <span className="text-[10px] text-slate-400 w-[74px] text-right flex-shrink-0">
                      {new Date(v.dateModification || v.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
