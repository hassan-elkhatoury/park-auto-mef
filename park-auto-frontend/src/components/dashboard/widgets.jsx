import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, RotateCw, Clock, ClipboardCheck, CheckCircle2, XCircle, FileText,
  AlertTriangle, ShieldAlert, Percent, DollarSign, Wrench, Leaf, Gauge, Inbox, WifiOff, Lock,
  Activity, Send, Key, Fuel as FuelIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  fmtMAD, fmtNumber, fmtPct, fmtDateShort, num, TONE_CLASSES, MEF, ROLE_LABELS, ROLE_DESCRIPTIONS,
  DEMAND_STATUS_META, VEHICLE_GROUP_META, vehicleGroup, sortByDateDesc,
} from './dashboardUtils';

export const TOOLTIP_STYLE = {
  backgroundColor: MEF.navy,
  border: `1px solid ${MEF.navyLight}`,
  borderRadius: '10px',
  fontSize: '12px',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

// ═══════════════════════════════════════════════════════════════════════════
// Animated counter
// ═══════════════════════════════════════════════════════════════════════════
export function AnimatedCounter({ value, duration = 0.9, decimals = 0 }) {
  const target = num(value);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!target) { setDisplay(0); return undefined; }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(target * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return <>{fmtNumber(display, decimals)}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Header
// ═══════════════════════════════════════════════════════════════════════════
function MoroccanStarEmblem() {
  return (
    <svg className="w-10 h-10 text-[#C59B27] flex-shrink-0" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M50 5 L61.8 23.2 L83.2 16.8 L76.8 38.2 L95 50 L76.8 61.8 L83.2 83.2 L61.8 76.8 L50 95 L38.2 76.8 L16.8 83.2 L23.2 61.8 L5 50 L23.2 38.2 L16.8 16.8 L38.2 23.2 Z"
            stroke="currentColor" strokeWidth="3" fill="rgba(197, 155, 39, 0.1)" />
      <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <polygon points="50,34 54,46 66,50 54,54 50,66 46,54 34,50 46,46" fill="currentColor" />
    </svg>
  );
}

export function DashboardHeader({ user, roleName, scopeLabel, readOnly, loading, onRefresh, lastUpdated, failed = [] }) {
  const fullName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div
      className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath fill='%23C59B27' d='M40 0l11.71 11.71H68.29V28.29L80 40l-11.71 11.71v16.57H51.71L40 80l-11.71-11.71H11.71V51.71L0 40l11.71-11.71V11.71h16.57z'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute top-0 left-0 right-0 h-[3px] gold-gradient-bg" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-4">
          <MoroccanStarEmblem />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-black text-[#0A1E3F] tracking-wide uppercase font-outfit">
                {fullName ? `Bienvenue, ${fullName}` : 'Tableau de Bord'}
              </h2>
              <span className="font-amiri text-sm text-[#C59B27] font-bold" dir="rtl">لوحة القيادة والمؤشرات</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="gold-gradient-text font-extrabold uppercase tracking-wider text-[10px]">{ROLE_LABELS[roleName] || roleName}</span>
              <span className="text-slate-300">·</span>
              <span>{ROLE_DESCRIPTIONS[roleName] || 'Vue d\'ensemble de la flotte automobile du Ministère'}</span>
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0A1E3F] text-white border border-[#122B55]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27]" />
                Périmètre : {scopeLabel}
              </span>
              {readOnly && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock className="w-3 h-3" /> Lecture seule
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-medium capitalize">{today}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-[#0A1E3F] hover:bg-[#122B55] disabled:opacity-70 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 text-[#D7B14A] ${loading ? 'animate-spin' : ''}`} />
            Actualiser les Données
          </button>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {lastUpdated && <span>Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
            {failed.length > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold" title={failed.join(', ')}>
                <WifiOff className="w-3 h-3" /> {failed.length} source{failed.length > 1 ? 's' : ''} indisponible{failed.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Layout primitives
// ═══════════════════════════════════════════════════════════════════════════
export function SectionCard({ title, subtitle, icon: Icon, action, children, className = '', delay = 0, tone, badge }) {
  const border = tone === 'danger' ? 'border-red-200' : tone === 'warning' ? 'border-amber-200' : 'border-slate-200/80';
  return (
    <motion.section className={`bg-white rounded-2xl border ${border} p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow ${className}`} {...fadeUp(delay)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-sm shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                {!Icon && <div className="w-1 h-5 rounded-full bg-[#C59B27]" />}
                <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F] truncate">{title}</h3>
                {badge != null && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0A1E3F] text-[#E3C873]">{badge}</span>
                )}
              </div>
              {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && (
            action.to ? (
              <Link to={action.to} className="text-[11px] font-bold text-[#C59B27] hover:text-[#94700E] flex items-center gap-1 transition-colors shrink-0">
                {action.label} <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <button onClick={action.onClick} className="text-[11px] font-bold text-[#C59B27] hover:text-[#94700E] flex items-center gap-1 transition-colors cursor-pointer shrink-0">
                {action.label} <ArrowRight className="w-3 h-3" />
              </button>
            )
          )}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, hint, compact = false }) {
  return (
    <div className={`text-center ${compact ? 'py-6' : 'py-10'} bg-slate-50/60 rounded-xl border border-dashed border-slate-200`}>
      <Icon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
      <p className="text-xs font-bold text-slate-500">{title}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ tone = 'slate', children, icon: Icon, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${TONE_CLASSES[tone] || TONE_CLASSES.slate} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

export function DemandStatusBadge({ statut }) {
  const meta = DEMAND_STATUS_META[statut] || { label: statut || '—', tone: 'slate' };
  const icons = { EN_ATTENTE_VALIDATION: Clock, VALIDEE_SERVICE: ClipboardCheck, APPROUVEE_AFFECTEE: CheckCircle2, EN_COURS: Activity, TERMINEE: FileText, REJETEE: XCircle, ANNULEE: XCircle };
  return <StatusBadge tone={meta.tone} icon={icons[statut]}>{meta.label}</StatusBadge>;
}

export function ProgressBar({ value, max = 100, color, thresholds = true, height = 'h-2' }) {
  const pct = max > 0 ? Math.min(100, (num(value) / max) * 100) : 0;
  const auto = pct >= 95 ? MEF.red : pct >= 80 ? MEF.orange : MEF.emerald;
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color || (thresholds ? auto : MEF.navy) }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI cards
// ═══════════════════════════════════════════════════════════════════════════
const KPI_COLORS = {
  navy: { bg: 'bg-[#0A1E3F]', bar: 'bg-[#0A1E3F]' },
  gold: { bg: 'bg-[#C59B27]', bar: 'bg-[#C59B27]' },
  emerald: { bg: 'bg-[#0D7A5F]', bar: 'bg-[#0D7A5F]' },
  blue: { bg: 'bg-[#1565C0]', bar: 'bg-[#1565C0]' },
  orange: { bg: 'bg-[#C47D2B]', bar: 'bg-[#C47D2B]' },
  red: { bg: 'bg-[#C1272D]', bar: 'bg-[#C1272D]' },
  slate: { bg: 'bg-slate-500', bar: 'bg-slate-500' },
  teal: { bg: 'bg-[#00A896]', bar: 'bg-[#00A896]' },
};

function formatKpi(value, format, decimals) {
  if (format === 'currency') return fmtMAD(value, { compact: true });
  if (format === 'percent') return fmtPct(value, decimals);
  if (format === 'raw') return value ?? '—';
  return null; // number → animated
}

export function KpiCard({ label, value, sub, icon: Icon, color = 'navy', format = 'number', decimals = 0, unit, delta, onClick, delay = 0, highlight }) {
  const c = KPI_COLORS[color] || KPI_COLORS.navy;
  const formatted = formatKpi(value, format, decimals);
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <motion.div {...fadeUp(delay)} className="h-full">
      <Wrapper
        onClick={onClick}
        className={`w-full h-full text-left bg-white rounded-2xl border ${highlight ? 'border-[#E3C873] ring-2 ring-[#C59B27]/15' : 'border-slate-200/80'} p-4 md:p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">{label}</span>
            <span className="text-2xl md:text-[26px] leading-tight font-black font-outfit text-[#0A1E3F] block mt-1.5 tabular-nums">
              {formatted != null ? formatted : (<><AnimatedCounter value={value} decimals={decimals} />{unit ? <span className="text-sm font-bold text-slate-400 ml-1">{unit}</span> : null}</>)}
            </span>
            {sub && <span className="text-[11px] font-medium text-slate-400 block mt-1 truncate">{sub}</span>}
            {delta && (
              <span className={`text-[10px] font-bold inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md ${delta.tone === 'up' ? 'bg-emerald-50 text-emerald-700' : delta.tone === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                {delta.label}
              </span>
            )}
          </div>
          {Icon && (
            <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${c.bar}`} />
      </Wrapper>
    </motion.div>
  );
}

export function KpiGrid({ items = [], cols = 4 }) {
  const colClass = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' }[cols] || 'lg:grid-cols-4';
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${colClass} gap-4`}>
      {items.map((it, idx) => <KpiCard key={it.label} {...it} delay={idx * 0.05} />)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// "À traiter" action strip
// ═══════════════════════════════════════════════════════════════════════════
export function ActionStrip({ title = 'À traiter aujourd\'hui', items = [], navigate }) {
  const visible = items.filter((it) => it.count > 0 || it.alwaysShow);
  if (visible.length === 0) {
    return (
      <motion.div {...fadeUp(0.05)} className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0D7A5F] text-white flex items-center justify-center shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
        <div>
          <p className="text-sm font-extrabold text-[#0A1E3F] font-outfit">Aucune action en attente</p>
          <p className="text-[11px] text-slate-500">Tous les dossiers de votre périmètre sont à jour.</p>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div {...fadeUp(0.05)} className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
        <h3 className="font-outfit font-extrabold text-sm text-[#0A1E3F]">{title}</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{visible.reduce((s, i) => s + i.count, 0)} élément(s)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {visible.map((it) => {
          const Icon = it.icon || AlertTriangle;
          const urgent = it.urgent && it.count > 0;
          return (
            <button
              key={it.label}
              onClick={() => (it.onClick ? it.onClick() : navigate?.(it.to))}
              className={`text-left rounded-xl border p-3 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${urgent ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-slate-50/60 hover:bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${urgent ? 'bg-[#C1272D] text-white' : 'bg-[#0A1E3F] text-[#E3C873]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xl font-black font-outfit tabular-nums ${urgent ? 'text-[#C1272D]' : 'text-[#0A1E3F]'}`}>{it.count}</span>
              </div>
              <p className="text-[11px] font-bold text-[#0A1E3F] mt-2 leading-tight">{it.label}</p>
              {it.sub && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{it.sub}</p>}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Charts
// ═══════════════════════════════════════════════════════════════════════════
export function DonutChart({ data = [], centerValue, centerLabel, height = 220, legend = true, formatter }) {
  const total = data.reduce((s, d) => s + num(d.value), 0);
  const safe = total > 0 ? data.filter((d) => num(d.value) > 0) : [{ name: 'Aucune donnée', value: 1, color: '#E2E8F0' }];
  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={safe} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={height * 0.27} outerRadius={height * 0.4} stroke="#fff" strokeWidth={3} paddingAngle={total > 0 ? 2 : 0}>
              {safe.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            {total > 0 && <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [formatter ? formatter(v) : fmtNumber(v), n]} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="text-2xl font-black font-outfit text-[#0A1E3F] block leading-none tabular-nums">{centerValue ?? fmtNumber(total)}</span>
          {centerLabel && <span className="text-[10px] font-semibold text-slate-400 block mt-1">{centerLabel}</span>}
        </div>
      </div>
      {legend && total > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          {data.filter((d) => num(d.value) > 0).map((d) => (
            <div key={d.name} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 font-semibold text-slate-600"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />{d.name}</span>
              <span className="font-black text-[#0A1E3F] tabular-nums">{formatter ? formatter(d.value) : fmtNumber(d.value)} <span className="text-slate-400 font-semibold">({fmtPct((d.value / total) * 100)})</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrendChart({ data = [], series = [], height = 220, type = 'area', stacked = false, formatter = (v) => fmtNumber(v), yFormatter }) {
  const hasData = data.some((d) => series.some((s) => num(d[s.key]) > 0));
  if (!hasData) {
    return <div style={{ height }} className="flex items-center justify-center"><EmptyState compact title="Données insuffisantes" hint="Aucune écriture sur la période." /></div>;
  }
  const Chart = type === 'bar' ? BarChart : AreaChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={yFormatter || ((v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v))} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [formatter(v), n]} cursor={{ fill: 'rgba(10,30,63,0.04)' }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />}
        {series.map((s) => (
          type === 'bar'
            ? <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? 'a' : undefined} radius={[4, 4, 0, 0]} maxBarSize={34} />
            : <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} fill={`url(#grad-${s.key})`} stackId={stacked ? 'a' : undefined} dot={{ r: 2.5, fill: s.color }} />
        ))}
      </Chart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarList({ items = [], formatter = (v) => fmtNumber(v), emptyText = 'Aucune donnée' }) {
  if (items.length === 0) return <EmptyState compact title={emptyText} />;
  const max = Math.max(...items.map((i) => num(i.max ?? i.value)), 1);
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const pct = (num(it.value) / max) * 100;
        return (
          <div key={it.label}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs font-bold text-[#0A1E3F] truncate" title={it.fullLabel || it.label}>{it.label}</span>
              <span className="text-[11px] font-extrabold text-slate-700 tabular-nums shrink-0">{formatter(it.value)}{it.suffix ? <span className="text-slate-400 font-semibold"> {it.suffix}</span> : null}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: it.color || MEF.navy }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
            </div>
            {it.sub && <p className="text-[10px] text-slate-400 mt-0.5">{it.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tables & lists
// ═══════════════════════════════════════════════════════════════════════════
export function DataTable({ columns = [], rows = [], rowKey = (r, i) => r.id ?? i, onRowClick, emptyText = 'Aucune donnée', compact = true }) {
  if (rows.length === 0) return <EmptyState compact title={emptyText} />;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className={`enterprise-table w-full ${compact ? 'enterprise-table--compact' : ''}`}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.align === 'right' ? '!text-right' : ''}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={onRowClick ? 'cursor-pointer' : ''}>
              {columns.map((c) => (
                <td key={c.key} className={`${c.align === 'right' ? '!text-right' : ''} ${c.className || ''}`}>{c.render ? c.render(r) : (r[c.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListItem({ icon: Icon = Send, title, subtitle, right, onClick, accent = 'bg-[#C59B27]' }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors text-left relative ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${accent}`} />
      <div className="flex items-center gap-3 min-w-0 pl-2">
        <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0A1E3F] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-extrabold text-[#0A1E3F] block leading-tight truncate">{title}</span>
          {subtitle && <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{subtitle}</span>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </Wrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Domain widgets (réutilisés par plusieurs rôles)
// ═══════════════════════════════════════════════════════════════════════════
export function ExecutiveStrip({ summary, fallback = {} }) {
  const s = summary || {};
  const pick = (...keys) => keys.map((k) => s[k]).find((v) => v != null);
  const items = [
    { label: 'Taux d\'utilisation', value: pick('tauxUtilisationParc') ?? fallback.tauxUtilisation, fmt: (v) => fmtPct(v), icon: Percent, color: 'text-[#0D7A5F]', bg: 'bg-emerald-50' },
    { label: 'TCO global', value: pick('tcoGlobal', 'totalTco') ?? fallback.tco, fmt: (v) => fmtMAD(v, { compact: true }), icon: DollarSign, color: 'text-[#C59B27]', bg: 'bg-amber-50' },
    { label: 'Coût moyen / km', value: pick('coutMoyenKilometriqueMadKm', 'coutMoyenKm'), fmt: (v) => `${num(v).toFixed(2)} MAD/km`, icon: Gauge, color: 'text-[#1565C0]', bg: 'bg-blue-50' },
    { label: 'Taux d\'immobilisation', value: pick('tauxImmobilisation') ?? fallback.tauxImmobilisation, fmt: (v) => fmtPct(v), icon: Wrench, color: 'text-[#C47D2B]', bg: 'bg-orange-50' },
    { label: 'Émissions CO₂', value: pick('totalEmissionsCO2Kg'), fmt: (v) => `${fmtNumber(v / 1000, 1)} t`, icon: Leaf, color: 'text-[#0D7A5F]', bg: 'bg-emerald-50' },
  ];
  return (
    <motion.div className="bg-gradient-to-r from-[#0A1E3F] to-[#122B55] rounded-2xl p-5 shadow-lg border border-[#1A3666]" {...fadeUp(0.05)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-[#C59B27]" />
        <h3 className="font-outfit font-extrabold text-sm text-white">Indicateurs Exécutifs</h3>
        <span className="text-[10px] text-[#C59B27] font-bold uppercase tracking-wider ml-1">Reporting consolidé</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}><Icon className={`w-3.5 h-3.5 ${item.color}`} /></div>
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider leading-tight">{item.label}</span>
              </div>
              <span className="text-lg font-black font-outfit text-white block tabular-nums">{item.value != null ? item.fmt(item.value) : '—'}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function FleetStateDonut({ vehicules = [], height = 200 }) {
  const data = useMemo(() => {
    const counts = {};
    vehicules.forEach((v) => { const g = vehicleGroup(v.statutAdministratif); counts[g] = (counts[g] || 0) + 1; });
    return Object.entries(VEHICLE_GROUP_META).map(([k, m]) => ({ name: m.label, value: counts[k] || 0, color: m.color }));
  }, [vehicules]);
  return <DonutChart data={data} height={height} centerLabel="Véhicules" />;
}

export function DemandPipeline({ demandes = [], onSelect }) {
  const steps = [
    { key: 'EN_ATTENTE_VALIDATION', label: 'En attente N1', icon: Clock, color: 'bg-amber-500' },
    { key: 'VALIDEE_SERVICE', label: 'À affecter (N2)', icon: ClipboardCheck, color: 'bg-blue-500' },
    { key: 'APPROUVEE_AFFECTEE', label: 'Affectées', icon: Key, color: 'bg-emerald-500', match: ['APPROUVEE_AFFECTEE', 'EN_COURS'] },
    { key: 'TERMINEE', label: 'Terminées', icon: CheckCircle2, color: 'bg-slate-500' },
    { key: 'REJETEE', label: 'Rejetées / annulées', icon: XCircle, color: 'bg-red-500', match: ['REJETEE', 'ANNULEE'] },
  ];
  const total = demandes.length || 1;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {steps.map((st, idx) => {
        const Icon = st.icon;
        const count = demandes.filter((d) => (st.match || [st.key]).includes(d.statut)).length;
        return (
          <motion.button
            key={st.key}
            onClick={onSelect ? () => onSelect(st.key) : undefined}
            className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow text-left ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            {...fadeUp(idx * 0.04)}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${st.color} shrink-0`}><Icon className="w-5 h-5 text-white" /></div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold leading-tight">{st.label}</p>
              <p className="text-xl font-black text-[#0A1E3F] tabular-nums">{count} <span className="text-[10px] text-slate-400 font-bold">{fmtPct((count / total) * 100)}</span></p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

const SEVERITY_ORDER = { CRITIQUE: 0, ATTENTION: 1, INFO: 2 };
export function sortAlertes(alertes = []) {
  return [...alertes].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.niveauSeverite] ?? 3;
    const sb = SEVERITY_ORDER[b.niveauSeverite] ?? 3;
    if (sa !== sb) return sa - sb;
    return (a.joursRestants ?? 9999) - (b.joursRestants ?? 9999);
  });
}

const ALERT_TYPE_LABEL = { ASSURANCE: 'Assurance', CONTROLE_TECHNIQUE: 'Contrôle technique', VIGNETTE: 'Vignette', MAINTENANCE_PREVENTIVE: 'Entretien', CARTE_CARBURANT: 'Carte carburant' };

export function AlertTable({ alertes = [], navigate, limit = 6, readOnly = false, title = 'Alertes & Échéances' }) {
  const sorted = useMemo(() => sortAlertes(alertes), [alertes]);
  const critiques = alertes.filter((a) => a.niveauSeverite === 'CRITIQUE').length;
  const top = sorted.slice(0, limit);
  return (
    <SectionCard
      title={title}
      subtitle={`${alertes.length} alerte(s) · ${critiques} critique(s)`}
      icon={ShieldAlert}
      tone={critiques > 0 ? 'danger' : undefined}
      action={!readOnly && navigate ? { label: 'Centre d\'alertes', onClick: () => navigate('/maintenance') } : undefined}
    >
      {top.length === 0 ? (
        <EmptyState icon={CheckCircle2} compact title="Toutes les échéances et seuils sont à jour." />
      ) : (
        <DataTable
          rows={top}
          rowKey={(a, i) => a.id || i}
          columns={[
            { key: 'niveauSeverite', label: 'Niveau', render: (a) => <StatusBadge tone={a.niveauSeverite === 'CRITIQUE' ? 'red' : a.niveauSeverite === 'ATTENTION' ? 'amber' : 'blue'} icon={AlertTriangle}>{ALERT_TYPE_LABEL[a.typeAlerte] || a.typeAlerte || 'Alerte'}</StatusBadge> },
            { key: 'immatriculation', label: 'Véhicule', render: (a) => <span className="font-mono font-bold text-[#0A1E3F] text-xs">{a.immatriculation || '—'}</span> },
            { key: 'titre', label: 'Échéance', render: (a) => (<div><div className="font-bold text-[#0A1E3F] text-xs">{a.titre || a.message}</div>{a.titre && a.message && <div className="text-[10px] text-slate-500 line-clamp-1">{a.message}</div>}</div>) },
            { key: 'joursRestants', label: 'Délai', render: (a) => a.joursRestants != null ? <span className={`text-xs font-black ${a.joursRestants < 0 ? 'text-red-600' : a.joursRestants <= 15 ? 'text-amber-600' : 'text-slate-600'}`}>{a.joursRestants < 0 ? `Dépassé de ${Math.abs(a.joursRestants)} j` : `${a.joursRestants} j`}</span> : (a.kilometrageSeuil ? <span className="text-xs font-bold text-slate-600">{fmtNumber(a.kilometrageActuel)} / {fmtNumber(a.kilometrageSeuil)} km</span> : '—') },
            ...(!readOnly ? [{ key: 'action', label: 'Action', align: 'right', render: (a) => <button onClick={(e) => { e.stopPropagation(); navigate?.(a.vehiculeId ? `/vehicules/${a.vehiculeId}` : '/maintenance'); }} className="gold-gradient-bg text-[#0A1E3F] font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm hover:brightness-105 transition-all cursor-pointer">Traiter</button> }] : []),
          ]}
        />
      )}
    </SectionCard>
  );
}

/** Flux d'activité consolidé (demandes, affectations, interventions, sinistres, pleins). */
export function buildActivityFeed({ demandes = [], affectations = [], interventions = [], sinistres = [], pleins = [], pannes = [] }, limit = 8) {
  const events = [];
  demandes.forEach((d) => events.push({
    id: `dem-${d.id}`, date: d.updatedAt || d.createdAt, icon: Send, to: `/demandes/${d.id}`,
    title: `${d.reference || 'Demande'} — ${d.motif || d.destination || ''}`, sub: `${d.demandeurNomComplet || ''}${d.destination ? ` · ${d.destination}` : ''}`,
    badge: <DemandStatusBadge statut={d.statut} />,
  }));
  affectations.forEach((a) => events.push({
    id: `aff-${a.id}`, date: a.updatedAt || a.createdAt || a.dateDebut, icon: Key, to: `/affectations/${a.id}`,
    title: `${a.reference || 'Affectation'} — ${a.vehiculeImmatriculation || ''}`, sub: `${a.conducteurNomComplet || ''}${a.demandeDestination ? ` · ${a.demandeDestination}` : ''}`,
    badge: <StatusBadge tone={a.statut === 'EN_COURS' ? 'indigo' : a.statut === 'RESTITUEE' ? 'emerald' : 'slate'}>{a.statut === 'EN_COURS' ? 'Mission en cours' : a.statut === 'RESTITUEE' ? 'Restituée' : a.statut}</StatusBadge>,
  }));
  interventions.forEach((i) => events.push({
    id: `int-${i.id}`, date: i.dateRealisation || i.datePrevisionnelle, icon: Wrench, to: '/maintenance',
    title: `Maintenance ${i.typeMaintenance ? i.typeMaintenance.toLowerCase() : ''} — ${i.immatriculation || ''}`, sub: `${i.garageNom || i.prestataire || ''}${i.montantTotal ? ` · ${fmtMAD(i.montantTotal)}` : ''}`,
    badge: <StatusBadge tone={i.statut === 'TERMINEE' ? 'emerald' : i.statut === 'EN_COURS' ? 'amber' : 'blue'}>{i.statut || '—'}</StatusBadge>,
  }));
  sinistres.forEach((s) => events.push({
    id: `sin-${s.id}`, date: s.dateCreation || s.dateAccident, icon: ShieldAlert, to: '/sinistres',
    title: `Sinistre — ${s.immatriculation || ''}`, sub: `${s.lieuAccident || ''}${s.montantDommages ? ` · ${fmtMAD(s.montantDommages)}` : ''}`,
    badge: <StatusBadge tone={['CLOTURE', 'CLOS', 'INDEMNISE'].includes(s.statut) ? 'emerald' : 'red'}>{s.statut || '—'}</StatusBadge>,
  }));
  pannes.forEach((p) => events.push({
    id: `pan-${p.id}`, date: p.dateDeclaration || p.dateCreation, icon: AlertTriangle, to: '/pannes',
    title: `Panne — ${p.immatriculation || ''}`, sub: `${p.naturePanne || ''}${p.lieuPanne ? ` · ${p.lieuPanne}` : ''}`,
    badge: <StatusBadge tone={p.statut === 'REPAREE' ? 'emerald' : p.immobilisante ? 'red' : 'amber'}>{p.statut || '—'}</StatusBadge>,
  }));
  pleins.forEach((p) => events.push({
    id: `ple-${p.id}`, date: p.datePlein, icon: FuelIcon, to: '/carburant',
    title: `Plein — ${p.immatriculation || ''}`, sub: `${fmtNumber(p.quantiteLitres, 1)} L · ${fmtMAD(p.montantTTC)}${p.stationService ? ` · ${p.stationService}` : ''}`,
    badge: p.anomalieSurconsommation ? <StatusBadge tone="red">Surconsommation</StatusBadge> : <StatusBadge tone="slate">{fmtNumber(p.consommationMoyenne, 1)} L/100</StatusBadge>,
  }));
  return sortByDateDesc(events, 'date').filter((e) => e.date).slice(0, limit);
}

export function ActivityFeed({ events = [], navigate, title = 'Activité récente', subtitle = 'Derniers mouvements sur votre périmètre' }) {
  return (
    <SectionCard title={title} subtitle={subtitle} icon={Activity} delay={0.1}>
      {events.length === 0 ? <EmptyState compact icon={Activity} title="Aucune activité récente" /> : (
        <div className="flex flex-col gap-1">
          {events.map((e) => (
            <ListItem key={e.id} icon={e.icon} title={e.title} subtitle={`${fmtDateShort(e.date)}${e.sub ? ` · ${e.sub}` : ''}`} right={e.badge} onClick={navigate && e.to ? () => navigate(e.to) : undefined} accent="bg-slate-200" />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function QuickActions({ actions = [], navigate }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((a, idx) => {
        const Icon = a.icon || ArrowRight;
        return (
          <motion.button
            key={a.label}
            onClick={() => (a.onClick ? a.onClick() : navigate?.(a.to))}
            className={`text-left rounded-2xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${a.primary ? 'bg-[#0A1E3F] border-[#122B55] text-white' : 'bg-white border-slate-200/80 text-[#0A1E3F]'}`}
            {...fadeUp(idx * 0.05)}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${a.primary ? 'gold-gradient-bg text-[#071530]' : 'bg-slate-100 text-[#0A1E3F]'}`}><Icon className="w-5 h-5" /></div>
            <p className="text-xs font-extrabold font-outfit">{a.label}</p>
            {a.sub && <p className={`text-[10px] mt-0.5 ${a.primary ? 'text-slate-300' : 'text-slate-400'}`}>{a.sub}</p>}
          </motion.button>
        );
      })}
    </div>
  );
}