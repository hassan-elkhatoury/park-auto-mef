import React, { useMemo } from 'react';
import {
  Car, CheckCircle2, Calendar, Wrench, Fuel, Send, ClipboardCheck,
  AlertTriangle, ShieldAlert, CreditCard, DollarSign, Users, FileText,
  PlusCircle, UserPlus, ScrollText, Gauge, TrendingUp, Key,
  Landmark, PieChart as PieChartIcon, Shield, Activity,
} from 'lucide-react';
import { DIRECTIONS_MEF, FUEL_LABELS, MoroccanPlate, getVehiclePhoto } from '../../utils/vehicule';
import {
  fmtMAD, fmtNumber, fmtPct, fmtDate, fmtDateShort, num, MEF, FUEL_COLORS,
  NATURE_DEPENSE_LABELS, VEHICLE_GROUP_META, SINISTRE_OPEN, PANNE_OPEN,
  fleetCounts, monthlySeries, sortByDateDesc,
} from './dashboardUtils';
import {
  KpiGrid, ActionStrip, SectionCard, EmptyState, ExecutiveStrip, FleetStateDonut,
  DemandPipeline, AlertTable, ActivityFeed, buildActivityFeed, QuickActions,
  DonutChart, TrendChart, HorizontalBarList, DataTable, ListItem, DemandStatusBadge,
  StatusBadge, ProgressBar,
} from './widgets';

const dirShort = (name) => DIRECTIONS_MEF.find((d) => d.value === name)?.short || name || '—';

const fuelMix = (vehicules = []) =>
  Object.entries(FUEL_LABELS)
    .map(([key, name]) => ({
      name,
      value: vehicules.filter((v) => v.typeCarburant === key).length,
      color: FUEL_COLORS[key],
    }))
    .filter((f) => f.value > 0);

const directionBars = (vehicules = []) =>
  DIRECTIONS_MEF.map((d) => ({
    label: d.short,
    fullLabel: d.value,
    value: vehicules.filter((v) => v.direction === d.value).length,
    color: MEF.navy,
  })).filter((d) => d.value > 0);

const utilisation = (counts) =>
  counts.total > 0 ? Math.round((counts.EN_MISSION / Math.max(1, counts.total - counts.REFORME)) * 100) : 0;

function FleetKpis({ counts, navigate, prefix = '' }) {
  return (
    <KpiGrid
      items={[
        { label: `${prefix}Flotte`, value: counts.total, sub: 'Véhicules du périmètre', icon: Car, color: 'navy', onClick: () => navigate('/vehicules') },
        { label: 'Disponibles', value: counts.DISPONIBLE, sub: 'Prêts à affecter', icon: CheckCircle2, color: 'emerald', onClick: () => navigate('/vehicules') },
        { label: 'En mission', value: counts.EN_MISSION, sub: 'Affectés / réservés', icon: Calendar, color: 'blue', onClick: () => navigate('/affectations') },
        { label: 'Immobilisés', value: counts.MAINTENANCE, sub: 'Entretien / panne', icon: Wrench, color: 'orange', onClick: () => navigate('/maintenance') },
      ]}
    />
  );
}

function CostTrend({ pleins = [], interventions = [] }) {
  const fuel = monthlySeries(pleins, 'datePlein', (p) => p.montantTTC);
  const maint = monthlySeries(interventions, 'dateRealisation', (i) => i.montantTotal);
  const data = fuel.map((f, i) => ({ name: f.name, carburant: f.value, maintenance: maint[i]?.value || 0 }));
  return (
    <SectionCard title="Dépenses d'exploitation" subtitle="Carburant et maintenance — 6 derniers mois" icon={TrendingUp} action={{ label: 'Rapports', to: '/rapports' }}>
      <TrendChart
        data={data}
        type="area"
        formatter={(v) => fmtMAD(v, { compact: true })}
        series={[
          { key: 'carburant', label: 'Carburant', color: MEF.gold },
          { key: 'maintenance', label: 'Maintenance', color: MEF.navy },
        ]}
      />
    </SectionCard>
  );
}

function TcoByDirection({ rows = [] }) {
  const items = [...rows]
    .sort((a, b) => num(b.tcoTotal) - num(a.tcoTotal))
    .slice(0, 8)
    .map((r) => ({
      label: dirShort(r.direction),
      fullLabel: r.direction,
      value: num(r.tcoTotal),
      sub: `${r.nombreVehicules || 0} véh. · ${fmtMAD(r.tcoMoyenParVehicule, { compact: true })} / véh.`,
      color: MEF.gold,
    }));
  return (
    <SectionCard title="TCO par direction" subtitle="Coût global de possession consolidé" icon={Landmark} action={{ label: 'Budget', to: '/budget' }}>
      <HorizontalBarList items={items} formatter={(v) => fmtMAD(v, { compact: true })} emptyText="Aucun TCO consolidé pour l'exercice." />
    </SectionCard>
  );
}

function TcoByMotorisation({ rows = [] }) {
  const data = rows.map((r) => ({
    name: FUEL_LABELS[r.typeCarburant] || r.typeCarburant,
    value: num(r.tcoTotal),
    color: FUEL_COLORS[r.typeCarburant] || MEF.slate,
  })).filter((d) => d.value > 0);
  return (
    <SectionCard title="TCO par motorisation" subtitle="Répartition du coût de possession" icon={PieChartIcon}>
      <DonutChart data={data} centerLabel="TCO" formatter={(v) => fmtMAD(v, { compact: true })} />
    </SectionCard>
  );
}

function BudgetSnapshot({ synthese, alertes = [], navigate }) {
  const s = synthese || {};
  const alloue = num(s.totalAlloue);
  const engage = num(s.totalEngage);
  const realise = num(s.totalRealise);
  const restant = num(s.totalRestant);
  const taux = s.tauxEngagementGlobal ?? (alloue ? ((engage + realise) / alloue) * 100 : 0);
  const critiques = alertes.filter((a) => a.niveauAlerte === 'CRITIQUE_95').length;
  const lignes = (s.lignes || []).slice().sort((a, b) => num(b.tauxConsommation) - num(a.tauxConsommation)).slice(0, 6);

  return (
    <SectionCard
      title={`Exécution budgétaire ${s.annee || new Date().getFullYear()}`}
      subtitle={`${fmtPct(taux)} d'engagement · ${critiques} alerte(s) à 95 %`}
      icon={DollarSign}
      action={{ label: 'Ouvrir le budget', to: '/budget' }}
      tone={taux >= 95 ? 'danger' : taux >= 80 ? 'warning' : undefined}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Alloué', value: alloue },
          { label: 'Engagé', value: engage },
          { label: 'Réalisé', value: realise },
          { label: 'Disponible', value: restant },
        ].map((it) => (
          <div key={it.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{it.label}</p>
            <p className="text-sm font-black font-outfit text-[#0A1E3F] mt-1 tabular-nums">{fmtMAD(it.value, { compact: true })}</p>
          </div>
        ))}
      </div>
      <ProgressBar value={taux} />
      <p className="text-[10px] text-slate-400 mt-1.5 mb-4">Seuils CdC : vigilance à 80 % · blocage à 95 %</p>
      <HorizontalBarList
        items={lignes.map((l) => ({
          label: `${dirShort(l.direction)} · ${NATURE_DEPENSE_LABELS[l.natureDepense] || l.natureDepense || 'Enveloppe'}`,
          value: num(l.tauxConsommation),
          max: 100,
          suffix: fmtMAD(l.montantRealise || l.montantEngage, { compact: true }),
          color: num(l.tauxConsommation) >= 95 ? MEF.red : num(l.tauxConsommation) >= 80 ? MEF.orange : MEF.emerald,
        }))}
        formatter={(v) => fmtPct(v)}
        emptyText="Aucune enveloppe ouverte sur l'exercice."
      />
    </SectionCard>
  );
}

function DemandList({ demandes = [], navigate, title = 'Demandes récentes', limit = 6 }) {
  const rows = sortByDateDesc(demandes, 'updatedAt', 'createdAt', 'dateCreation').slice(0, limit);
  return (
    <SectionCard title={title} subtitle={`${demandes.length} au total`} icon={Send} action={{ label: 'Toutes les demandes', to: '/demandes' }}>
      {rows.length === 0 ? <EmptyState compact title="Aucune demande sur ce périmètre." /> : (
        <div className="flex flex-col gap-1">
          {rows.map((d) => (
            <ListItem
              key={d.id}
              icon={Send}
              title={`${d.reference || 'Demande'} — ${d.motif || d.destination || ''}`}
              subtitle={`${d.destination || ''}${d.dateHeureDepart ? ` · ${fmtDateShort(d.dateHeureDepart)}` : ''}${d.demandeurNomComplet ? ` · ${d.demandeurNomComplet}` : ''}`}
              right={<DemandStatusBadge statut={d.statut} />}
              onClick={() => navigate(`/demandes/${d.id}`)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* =========================================================================
   ADMIN — Pilotage global
   ========================================================================= */
export function AdminDashboard({ data, navigate }) {
  const counts = fleetCounts(data.vehicules);
  const n1 = data.demandes.filter((d) => d.statut === 'EN_ATTENTE_VALIDATION').length;
  const n2 = data.demandes.filter((d) => d.statut === 'VALIDEE_SERVICE').length;
  const critiques = data.alertes.filter((a) => a.niveauSeverite === 'CRITIQUE').length;
  const sinistresOuverts = data.sinistres.filter((s) => SINISTRE_OPEN.includes(s.statut)).length;
  const pannesOuvertes = data.pannes.filter((p) => PANNE_OPEN.includes(p.statut)).length;
  const budget95 = (data.budgetAlertes || []).filter((a) => a.niveauAlerte === 'CRITIQUE_95').length;
  const events = buildActivityFeed(data, 7);
  const users = data.utilisateurs || [];
  const locked = users.filter((u) => u.compteVerrouille || u.locked).length;

  return (
    <div className="space-y-6">
      <ActionStrip
        navigate={navigate}
        items={[
          { label: 'Validations N1', count: n1, sub: 'Demandes à arbitrer', icon: ClipboardCheck, to: '/demandes', urgent: n1 > 5 },
          { label: 'Affectations N2', count: n2, sub: 'Véhicule + conducteur', icon: Key, to: '/affectations', urgent: n2 > 3 },
          { label: 'Alertes critiques', count: critiques, sub: 'Échéances dépassées', icon: ShieldAlert, to: '/maintenance', urgent: critiques > 0 },
          { label: 'Sinistres ouverts', count: sinistresOuverts, sub: 'Dossiers en cours', icon: AlertTriangle, to: '/sinistres', urgent: sinistresOuverts > 0 },
          { label: 'Pannes ouvertes', count: pannesOuvertes, sub: 'À diagnostiquer', icon: Wrench, to: '/pannes' },
          { label: 'Budgets à 95 %', count: budget95, sub: 'Seuil de blocage', icon: DollarSign, to: '/budget', urgent: budget95 > 0 },
        ]}
      />
      <ExecutiveStrip summary={data.summary} fallback={{ tauxUtilisation: utilisation(counts) }} />
      <FleetKpis counts={counts} navigate={navigate} />
      <KpiGrid
        items={[
          { label: 'Carburant', value: num(data.summary?.coutTotalCarburant) || data.pleins.reduce((s, p) => s + num(p.montantTTC), 0), format: 'currency', icon: Fuel, color: 'gold', onClick: () => navigate('/carburant') },
          { label: 'Maintenance', value: num(data.summary?.coutTotalMaintenance) || data.interventions.reduce((s, i) => s + num(i.montantTotal), 0), format: 'currency', icon: Wrench, color: 'emerald', onClick: () => navigate('/maintenance') },
          { label: 'Cartes actives', value: data.cartes.filter((c) => c.statut === 'ACTIVE').length, icon: CreditCard, color: 'blue', onClick: () => navigate('/carburant') },
          { label: 'Comptes', value: users.length, sub: locked ? `${locked} verrouillé(s)` : 'Utilisateurs actifs', icon: Users, color: locked ? 'red' : 'navy', onClick: () => navigate('/utilisateurs') },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="État du parc" subtitle="Machine à statuts CdC" icon={Car}>
          <FleetStateDonut vehicules={data.vehicules} />
        </SectionCard>
        <SectionCard title="Motorisation" subtitle="Répartition énergétique" icon={Fuel}>
          <DonutChart data={fuelMix(data.vehicules)} centerLabel="Véhicules" />
        </SectionCard>
        <SectionCard title="Parc par direction" subtitle="Effectifs rattachés" icon={Landmark}>
          <HorizontalBarList items={directionBars(data.vehicules)} />
        </SectionCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TcoByDirection rows={data.tcoDirections} />
        <CostTrend pleins={data.pleins} interventions={data.interventions} />
      </div>
      <AlertTable alertes={data.alertes} navigate={navigate} />
      <DemandPipeline demandes={data.demandes} onSelect={() => navigate('/demandes')} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ActivityFeed events={events} navigate={navigate} />
        </div>
        <SectionCard title="Journal d'audit" subtitle="Dernières écritures" icon={ScrollText} action={{ label: 'Journal complet', to: '/audit' }}>
          {(data.auditLogs || []).length === 0 ? <EmptyState compact title="Aucun événement d'audit." /> : (
            <div className="flex flex-col gap-1">
              {(data.auditLogs || []).slice(0, 6).map((l, i) => (
                <ListItem
                  key={l.id || i}
                  icon={Activity}
                  title={l.action || l.typeAction || 'Action'}
                  subtitle={`${fmtDate(l.horodatage || l.createdAt, true)}${l.utilisateurNom ? ` · ${l.utilisateurNom}` : ''}`}
                  right={<StatusBadge tone="navy">{l.entite || l.module || '—'}</StatusBadge>}
                  accent="bg-[#0A1E3F]"
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
      <QuickActions
        navigate={navigate}
        actions={[
          { label: 'Nouveau véhicule', sub: 'Ajouter au référentiel', icon: PlusCircle, to: '/vehicules', primary: true },
          { label: 'Nouvelle demande', sub: 'Circuit N1 / N2', icon: Send, to: '/demandes' },
          { label: 'Créer un compte', sub: 'Habilitations RBAC', icon: UserPlus, to: '/utilisateurs' },
          { label: 'Rapports & exports', sub: 'PDF / Excel / CSV', icon: FileText, to: '/rapports' },
        ]}
      />
    </div>
  );
}

/* =========================================================================
   GESTIONNAIRE CENTRAL — Exploitation nationale
   ========================================================================= */
export function CentralManagerDashboard({ data, navigate }) {
  const counts = fleetCounts(data.vehicules);
  const n2 = data.demandes.filter((d) => d.statut === 'VALIDEE_SERVICE').length;
  const critiques = data.alertes.filter((a) => a.niveauSeverite === 'CRITIQUE').length;
  const anomalies = data.anomalies.length;
  const pannesOuvertes = data.pannes.filter((p) => PANNE_OPEN.includes(p.statut)).length;
  const missions = data.affectations.filter((a) => a.statut === 'EN_COURS').length;

  return (
    <div className="space-y-6">
      <ActionStrip
        navigate={navigate}
        title="File opérationnelle"
        items={[
          { label: 'À affecter (N2)', count: n2, sub: 'Demandes validées service', icon: Key, to: '/affectations', urgent: n2 > 0 },
          { label: 'Missions en cours', count: missions, sub: 'À suivre / restituer', icon: Calendar, to: '/affectations' },
          { label: 'Alertes critiques', count: critiques, sub: 'CT, assurance, entretien', icon: ShieldAlert, to: '/maintenance', urgent: critiques > 0 },
          { label: 'Surconsommations', count: anomalies, sub: 'Écart > +25 %', icon: Fuel, to: '/carburant', urgent: anomalies > 0 },
          { label: 'Pannes ouvertes', count: pannesOuvertes, sub: 'Garage agréé requis', icon: Wrench, to: '/pannes' },
          { label: 'Sinistres ouverts', count: data.sinistres.filter((s) => SINISTRE_OPEN.includes(s.statut)).length, icon: AlertTriangle, to: '/sinistres' },
        ]}
      />
      <ExecutiveStrip summary={data.summary} fallback={{ tauxUtilisation: utilisation(counts) }} />
      <FleetKpis counts={counts} navigate={navigate} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="État du parc" icon={Car}><FleetStateDonut vehicules={data.vehicules} /></SectionCard>
        <SectionCard title="Motorisation" icon={Fuel}><DonutChart data={fuelMix(data.vehicules)} centerLabel="Véhicules" /></SectionCard>
        <SectionCard title="Parc par direction" icon={Landmark}><HorizontalBarList items={directionBars(data.vehicules)} /></SectionCard>
      </div>
      <AlertTable alertes={data.alertes} navigate={navigate} />
      <DemandPipeline demandes={data.demandes} onSelect={() => navigate('/demandes')} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CostTrend pleins={data.pleins} interventions={data.interventions} />
        <TcoByDirection rows={data.tcoDirections} />
      </div>
      <ActivityFeed events={buildActivityFeed(data, 8)} navigate={navigate} />
      <QuickActions
        navigate={navigate}
        actions={[
          { label: 'Affecter un véhicule', sub: 'Circuit N2', icon: Key, to: '/affectations', primary: true },
          { label: 'Saisir un plein', sub: 'Contrôle RG05', icon: Fuel, to: '/carburant' },
          { label: 'Planifier un entretien', sub: 'Garage agréé MEF', icon: Wrench, to: '/maintenance' },
          { label: 'Déclarer un sinistre', sub: 'GED + police', icon: ShieldAlert, to: '/sinistres' },
        ]}
      />
    </div>
  );
}

/* =========================================================================
   GESTIONNAIRE LOCAL — Périmètre direction
   ========================================================================= */
export function LocalManagerDashboard({ data, navigate, scopeLabel }) {
  const counts = fleetCounts(data.vehicules);
  const n2 = data.demandes.filter((d) => d.statut === 'VALIDEE_SERVICE').length;
  const critiques = data.alertes.filter((a) => a.niveauSeverite === 'CRITIQUE').length;
  const avgConso = (() => {
    const xs = data.pleins.filter((p) => num(p.consommationMoyenne) > 0);
    return xs.length ? xs.reduce((s, p) => s + p.consommationMoyenne, 0) / xs.length : null;
  })();

  return (
    <div className="space-y-6">
      <ActionStrip
        title={`À traiter — ${scopeLabel}`}
        navigate={navigate}
        items={[
          { label: 'À affecter (N2)', count: n2, icon: Key, to: '/affectations', urgent: n2 > 0 },
          { label: 'Missions en cours', count: data.affectations.filter((a) => a.statut === 'EN_COURS').length, icon: Calendar, to: '/affectations' },
          { label: 'Alertes du parc', count: critiques, icon: ShieldAlert, to: '/maintenance', urgent: critiques > 0 },
          { label: 'Pannes ouvertes', count: data.pannes.filter((p) => PANNE_OPEN.includes(p.statut)).length, icon: Wrench, to: '/pannes' },
          { label: 'Surconsommations', count: data.anomalies.length, icon: Fuel, to: '/carburant', urgent: data.anomalies.length > 0 },
        ]}
      />
      <FleetKpis counts={counts} navigate={navigate} prefix="Mon parc · " />
      <KpiGrid
        cols={3}
        items={[
          { label: 'Consommation moyenne', value: avgConso, decimals: 1, unit: 'L/100 km', icon: Gauge, color: 'teal' },
          { label: 'Carburant du mois', value: monthlySeries(data.pleins, 'datePlein', (p) => p.montantTTC).at(-1)?.value || 0, format: 'currency', icon: Fuel, color: 'gold' },
          { label: 'Alertes ouvertes', value: data.alertes.length, icon: ShieldAlert, color: data.alertes.length ? 'orange' : 'emerald' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="État de mon parc" icon={Car}><FleetStateDonut vehicules={data.vehicules} /></SectionCard>
        <SectionCard title="Motorisation locale" icon={Fuel}><DonutChart data={fuelMix(data.vehicules)} centerLabel="Véhicules" /></SectionCard>
        <TcoByDirection rows={data.tcoDirections} />
      </div>
      <AlertTable alertes={data.alertes} navigate={navigate} title="Alertes de la direction" />
      <DemandPipeline demandes={data.demandes} onSelect={() => navigate('/demandes')} />
      <DemandList demandes={data.demandes} navigate={navigate} title="Demandes de la direction" />
      <QuickActions
        navigate={navigate}
        actions={[
          { label: 'Affecter (N2)', sub: 'Véhicule + chauffeur', icon: Key, to: '/affectations', primary: true },
          { label: 'Saisir un plein', icon: Fuel, to: '/carburant' },
          { label: 'Déclarer une panne', icon: Wrench, to: '/pannes' },
          { label: 'Conducteurs', icon: Users, to: '/conducteurs' },
        ]}
      />
    </div>
  );
}

/* =========================================================================
   RESPONSABLE FINANCIER — TCO & budget
   ========================================================================= */
export function FinancialDashboard({ data, navigate }) {
  const s = data.summary || {};
  const budget = data.budgetSynthese || {};
  const engagements = data.engagements || [];
  const aLiquider = engagements.filter((e) => e.statut === 'ENGAGE' || e.statut === 'PARTIELLEMENT_LIQUIDE').length;
  const anomalies = data.anomalies || [];
  const tcoMoto = data.tcoMotorisations || [];
  const fuelSpend = data.pleins.reduce((acc, p) => acc + num(p.montantTTC), 0);
  const maintSpend = data.interventions.reduce((acc, i) => acc + num(i.montantTotal), 0);

  return (
    <div className="space-y-6">
      <ActionStrip
        title="Pilotage financier"
        navigate={navigate}
        items={[
          { label: 'Enveloppes à 95 %', count: (data.budgetAlertes || []).filter((a) => a.niveauAlerte === 'CRITIQUE_95').length, icon: DollarSign, to: '/budget', urgent: true },
          { label: 'Vigilance 80 %', count: (data.budgetAlertes || []).filter((a) => a.niveauAlerte === 'VIGILANCE_80').length, icon: TrendingUp, to: '/budget' },
          { label: 'Engagements à liquider', count: aLiquider, icon: FileText, to: '/budget' },
          { label: 'Surconsommations RG05', count: anomalies.length, icon: Fuel, to: '/carburant', urgent: anomalies.length > 0 },
          { label: 'Sinistres ouverts', count: data.sinistres.filter((x) => SINISTRE_OPEN.includes(x.statut)).length, icon: ShieldAlert, to: '/sinistres' },
        ]}
      />
      <ExecutiveStrip summary={s} />
      <KpiGrid
        items={[
          { label: 'TCO consolidé', value: num(s.tcoGlobal ?? s.totalTco), format: 'currency', icon: Landmark, color: 'gold', onClick: () => navigate('/rapports') },
          { label: 'Carburant', value: num(s.coutTotalCarburant) || fuelSpend, format: 'currency', icon: Fuel, color: 'navy', onClick: () => navigate('/carburant') },
          { label: 'Maintenance', value: num(s.coutTotalMaintenance) || maintSpend, format: 'currency', icon: Wrench, color: 'emerald', onClick: () => navigate('/maintenance') },
          { label: 'Assurances + taxes', value: num(s.coutTotalAssurance) + num(s.coutTotalTaxes), format: 'currency', icon: Shield, color: 'blue', onClick: () => navigate('/assurances') },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BudgetSnapshot synthese={budget} alertes={data.budgetAlertes} navigate={navigate} />
        <TcoByMotorisation rows={tcoMoto} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TcoByDirection rows={data.tcoDirections} />
        <CostTrend pleins={data.pleins} interventions={data.interventions} />
      </div>
      <SectionCard
        title="Anomalies de surconsommation"
        subtitle="Écart supérieur à +25 % vs moyenne historique du véhicule (RG05)"
        icon={AlertTriangle}
        tone={anomalies.length ? 'danger' : undefined}
        action={{ label: 'Module carburant', to: '/carburant' }}
      >
        <DataTable
          emptyText="Aucune surconsommation détectée."
          rows={anomalies.slice(0, 6)}
          columns={[
            { key: 'immatriculation', label: 'Véhicule', render: (a) => <span className="font-mono font-bold text-xs">{a.immatriculation || a.vehicule?.immatriculation || '—'}</span> },
            { key: 'datePlein', label: 'Date', render: (a) => fmtDateShort(a.datePlein) },
            { key: 'consommationMoyenne', label: 'L/100 km', render: (a) => <span className="font-black text-red-600">{num(a.consommationMoyenne).toFixed(1)}</span> },
            { key: 'stationService', label: 'Station' },
            { key: 'montantTTC', label: 'Montant', align: 'right', render: (a) => fmtMAD(a.montantTTC) },
          ]}
        />
      </SectionCard>
      {(data.budgetAlertes || []).length > 0 && (
        <SectionCard title="Alertes d'enveloppes" subtitle="Seuils 80 % / 95 % du CdC §19" icon={DollarSign} tone="warning" action={{ label: 'Budget', to: '/budget' }}>
          <DataTable
            rows={data.budgetAlertes.slice(0, 6)}
            columns={[
              { key: 'niveauAlerte', label: 'Niveau', render: (a) => <StatusBadge tone={a.niveauAlerte === 'CRITIQUE_95' ? 'red' : 'amber'}>{a.niveauAlerte === 'CRITIQUE_95' ? '95 %' : '80 %'}</StatusBadge> },
              { key: 'direction', label: 'Direction', render: (a) => dirShort(a.direction) },
              { key: 'natureDepense', label: 'Nature', render: (a) => NATURE_DEPENSE_LABELS[a.natureDepense] || a.natureDepense },
              { key: 'tauxConsommation', label: 'Taux', render: (a) => <span className="font-black">{fmtPct(a.tauxConsommation)}</span> },
              { key: 'montantDisponible', label: 'Disponible', align: 'right', render: (a) => fmtMAD(a.montantDisponible, { compact: true }) },
            ]}
          />
        </SectionCard>
      )}
      <QuickActions
        navigate={navigate}
        actions={[
          { label: 'Nouvel engagement', sub: 'Chaîne de la dépense', icon: PlusCircle, to: '/budget', primary: true },
          { label: 'Synthèse TCO', sub: 'Par direction / énergie', icon: Landmark, to: '/rapports' },
          { label: 'Assurances', sub: 'Primes et échéances', icon: Shield, to: '/assurances' },
          { label: 'Taxes & réforme', sub: 'Vignettes, PV', icon: FileText, to: '/visites-reforme' },
        ]}
      />
    </div>
  );
}

/* =========================================================================
   RESPONSABLE SERVICE — Validation N1
   ========================================================================= */
export function ServiceHeadDashboard({ data, navigate, scopeLabel }) {
  const pending = data.demandes.filter((d) => d.statut === 'EN_ATTENTE_VALIDATION');
  const counts = fleetCounts(data.vehicules);
  const missions = data.affectations.filter((a) => a.statut === 'EN_COURS').length;
  const conducteurs = data.conducteurs || [];
  const permisSoon = conducteurs.filter((c) => {
    if (!c.dateExpirationPermis && !c.permisDateExpiration) return false;
    const d = new Date(c.dateExpirationPermis || c.permisDateExpiration);
    const days = Math.round((d - new Date()) / 86_400_000);
    return days >= 0 && days <= 60;
  }).length;

  return (
    <div className="space-y-6">
      <ActionStrip
        title={`Validations — ${scopeLabel}`}
        navigate={navigate}
        items={[
          { label: 'À valider (N1)', count: pending.length, sub: 'Opportunité du déplacement', icon: ClipboardCheck, to: '/demandes', urgent: pending.length > 0, alwaysShow: true },
          { label: 'Validées, attente N2', count: data.demandes.filter((d) => d.statut === 'VALIDEE_SERVICE').length, icon: Key, to: '/demandes' },
          { label: 'Missions en cours', count: missions, icon: Calendar, to: '/demandes' },
          { label: 'Permis à échéance', count: permisSoon, sub: 'Moins de 60 jours', icon: Shield, to: '/conducteurs', urgent: permisSoon > 0 },
          { label: 'Pannes signalées', count: data.pannes.filter((p) => PANNE_OPEN.includes(p.statut)).length, icon: Wrench, to: '/pannes' },
        ]}
      />
      <KpiGrid
        items={[
          { label: 'Véhicules du service', value: counts.total, icon: Car, color: 'navy', onClick: () => navigate('/vehicules') },
          { label: 'Disponibles', value: counts.DISPONIBLE, icon: CheckCircle2, color: 'emerald' },
          { label: 'En mission', value: counts.EN_MISSION, icon: Calendar, color: 'blue' },
          { label: 'Demandes ouvertes', value: pending.length + data.demandes.filter((d) => ['VALIDEE_SERVICE', 'APPROUVEE_AFFECTEE', 'EN_COURS'].includes(d.statut)).length, icon: Send, color: 'orange', onClick: () => navigate('/demandes'), highlight: pending.length > 0 },
        ]}
      />
      <DemandPipeline demandes={data.demandes} onSelect={() => navigate('/demandes')} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DemandList demandes={pending.length ? pending : data.demandes} navigate={navigate} title={pending.length ? 'File de validation N1' : 'Demandes du service'} />
        </div>
        <SectionCard title="Conducteurs rattachés" subtitle={`${conducteurs.length} profil(s)`} icon={Users} action={{ label: 'Annuaire', to: '/conducteurs' }}>
          {conducteurs.length === 0 ? <EmptyState compact title="Aucun conducteur sur ce périmètre." /> : (
            <div className="flex flex-col gap-1">
              {conducteurs.slice(0, 6).map((c) => (
                <ListItem
                  key={c.id}
                  icon={Users}
                  title={`${c.prenom || ''} ${c.nom || ''}`.trim() || c.nomComplet}
                  subtitle={c.numeroPermis ? `Permis ${c.numeroPermis}` : (c.categoriePermis || 'Conducteur')}
                  onClick={() => navigate(`/conducteurs/${c.id}`)}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
      <QuickActions
        navigate={navigate}
        actions={[
          { label: 'Valider les demandes', sub: 'Niveau 1 — opportunité', icon: ClipboardCheck, to: '/demandes', primary: true },
          { label: 'Nouvelle demande', icon: Send, to: '/demandes' },
          { label: 'Parc du service', icon: Car, to: '/vehicules' },
          { label: 'Signaler une panne', icon: Wrench, to: '/pannes' },
        ]}
      />
    </div>
  );
}

/* =========================================================================
   CONDUCTEUR — Cockpit personnel
   ========================================================================= */
export function DriverDashboard({ data, user, navigate }) {
  const current = useMemo(
    () => (data.affectations || []).find((a) => a.statut === 'EN_COURS')
      || (data.affectations || []).find((a) => a.statut === 'APPROUVEE_AFFECTEE'),
    [data.affectations]
  );
  const assigned = useMemo(
    () => (data.vehicules || []).find((v) => v.id === current?.vehiculeId) || data.vehicules[0],
    [data.vehicules, current]
  );
  const myStats = {
    total: data.demandes.length,
    attente: data.demandes.filter((d) => d.statut === 'EN_ATTENTE_VALIDATION').length,
    cours: data.demandes.filter((d) => ['APPROUVEE_AFFECTEE', 'EN_COURS'].includes(d.statut)).length,
    terminees: data.demandes.filter((d) => d.statut === 'TERMINEE').length,
  };
  const kmParcourus = (data.affectations || []).reduce((s, a) => {
    if (a.kilometrageDepart != null && a.kilometrageRetour != null) return s + (a.kilometrageRetour - a.kilometrageDepart);
    return s;
  }, 0);
  const litres = data.pleins.reduce((s, p) => s + num(p.quantiteLitres), 0);
  const photo = assigned ? getVehiclePhoto(assigned.marque, assigned.modele) : null;

  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: 'Mes demandes', value: myStats.total, sub: `${myStats.attente} en attente`, icon: Send, color: 'navy', onClick: () => navigate('/demandes') },
          { label: 'Missions ouvertes', value: myStats.cours, sub: 'En cours / affectées', icon: Calendar, color: 'blue', highlight: myStats.cours > 0 },
          { label: 'Missions closes', value: myStats.terminees, icon: CheckCircle2, color: 'emerald' },
          { label: 'Kilomètres parcourus', value: kmParcourus, sub: `${fmtNumber(litres, 0)} L saisis`, icon: Gauge, color: 'gold' },
        ]}
      />

      {assigned ? (
        <SectionCard title="Véhicule qui m'est confié" subtitle={current?.reference ? `Mission ${current.reference}` : 'Affectation en cours'} icon={Car} action={assigned.id ? { label: 'Fiche véhicule', to: `/vehicules/${assigned.id}` } : undefined}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-[#0A1E3F] shrink-0">
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center text-[#E3C873]"><Car className="w-10 h-10" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black font-outfit text-[#0A1E3F]">{assigned.marque} {assigned.modele}</p>
              <div className="mt-1"><MoroccanPlate immatriculation={assigned.immatriculation} /></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { k: 'Énergie', v: FUEL_LABELS[assigned.typeCarburant] || assigned.typeCarburant || '—' },
                  { k: 'Compteur', v: assigned.kilometrageActuel != null ? `${fmtNumber(assigned.kilometrageActuel)} km` : '—' },
                  { k: 'Destination', v: current?.demandeDestination || '—' },
                  { k: 'Retour prévu', v: fmtDateShort(current?.dateFinPrevisionnelle) },
                ].map((it) => (
                  <div key={it.k}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{it.k}</p>
                    <p className="text-xs font-extrabold text-[#0A1E3F] mt-0.5 truncate">{it.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Aucun véhicule affecté" icon={Car}>
          <EmptyState title="Pas de mission en cours." hint="Déposez une demande de déplacement pour obtenir un véhicule." />
        </SectionCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DemandList demandes={data.demandes} navigate={navigate} title="Mes demandes de déplacement" />
        <SectionCard title="Mes derniers pleins" subtitle="Saisies rattachées à vos missions" icon={Fuel} action={{ label: 'Carburant', to: '/carburant' }}>
          {data.pleins.length === 0 ? <EmptyState compact title="Aucun plein à votre nom." /> : (
            <DataTable
              rows={sortByDateDesc(data.pleins, 'datePlein').slice(0, 5)}
              columns={[
                { key: 'datePlein', label: 'Date', render: (p) => fmtDateShort(p.datePlein) },
                { key: 'immatriculation', label: 'Véhicule', render: (p) => <span className="font-mono text-xs font-bold">{p.immatriculation}</span> },
                { key: 'quantiteLitres', label: 'Litres', render: (p) => fmtNumber(p.quantiteLitres, 1) },
                { key: 'montantTTC', label: 'Montant', align: 'right', render: (p) => fmtMAD(p.montantTTC) },
              ]}
            />
          )}
        </SectionCard>
      </div>

      {data.pannes.filter((p) => PANNE_OPEN.includes(p.statut)).length > 0 && (
        <SectionCard title="Pannes que j'ai signalées" icon={AlertTriangle} tone="warning" action={{ label: 'Suivi', to: '/pannes' }}>
          <DataTable
            rows={data.pannes.filter((p) => PANNE_OPEN.includes(p.statut)).slice(0, 4)}
            columns={[
              { key: 'immatriculation', label: 'Véhicule' },
              { key: 'naturePanne', label: 'Nature' },
              { key: 'statut', label: 'Statut', render: (p) => <StatusBadge tone="amber">{p.statut}</StatusBadge> },
            ]}
          />
        </SectionCard>
      )}

      <QuickActions
        navigate={navigate}
        actions={[
          { label: 'Nouvelle demande', sub: 'Déplacement professionnel', icon: Send, to: '/demandes', primary: true },
          { label: 'Signaler une panne', sub: 'Avarie en mission', icon: AlertTriangle, to: '/pannes' },
          { label: 'Saisir un plein', sub: 'Reçu station', icon: Fuel, to: '/carburant' },
          { label: 'Mes missions', sub: 'Historique', icon: Calendar, to: '/demandes' },
        ]}
      />
    </div>
  );
}

/* =========================================================================
   CONSULTATION — Lecture seule
   ========================================================================= */
export function ConsultationDashboard({ data, navigate }) {
  const counts = fleetCounts(data.vehicules);
  return (
    <div className="space-y-6">
      <ExecutiveStrip summary={data.summary} fallback={{ tauxUtilisation: utilisation(counts) }} />
      <FleetKpis counts={counts} navigate={navigate} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="État du parc" icon={Car}><FleetStateDonut vehicules={data.vehicules} /></SectionCard>
        <SectionCard title="Motorisation" icon={Fuel}><DonutChart data={fuelMix(data.vehicules)} centerLabel="Véhicules" /></SectionCard>
        <SectionCard title="Parc par direction" icon={Landmark}><HorizontalBarList items={directionBars(data.vehicules)} /></SectionCard>
      </div>
      <TcoByDirection rows={data.tcoDirections} />
      <DemandPipeline demandes={data.demandes} />
      <AlertTable alertes={data.alertes} navigate={navigate} readOnly title="Échéances (consultation)" />
      <ActivityFeed events={buildActivityFeed(data, 8)} navigate={navigate} title="Journal de consultation" subtitle="Aucun acte d'écriture n'est autorisé depuis ce profil" />
    </div>
  );
}
