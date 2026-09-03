// ═══════════════════════════════════════════════════════════════════════════
// Dashboard utilities — normalisation des réponses API, formatage, périmètre
// ═══════════════════════════════════════════════════════════════════════════

/** Extrait une liste depuis n'importe quelle forme de réponse (ApiResponse, Page, liste brute). */
export const unwrapList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.content)) return res.content;
  if (res.data && Array.isArray(res.data.content)) return res.data.content;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

/** Extrait un objet (DTO unique) depuis une réponse potentiellement enveloppée. */
export const unwrapObject = (res) => {
  if (!res || typeof res !== 'object') return null;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    // ApiResponse<T> => { success, message, data }
    if ('success' in res || 'message' in res) return res.data;
  }
  return res;
};

export const num = (v) => {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export const fmtMAD = (v, opts = {}) => {
  const n = num(v);
  const { compact = false, decimals = 0 } = opts;
  if (compact && Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M MAD`;
  if (compact && Math.abs(n) >= 10_000) return `${Math.round(n / 1000).toLocaleString('fr-FR')} k MAD`;
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} MAD`;
};

export const fmtNumber = (v, decimals = 0) =>
  num(v).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const fmtPct = (v, decimals = 0) => `${num(v).toFixed(decimals)}%`;

export const fmtDate = (d, withTime = false) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateShort = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export const daysUntil = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86_400_000);
};

export const isSameMonth = (d, ref = new Date()) => {
  if (!d) return false;
  const date = new Date(d);
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
};

export const isWithinDays = (d, days) => {
  const left = daysUntil(d);
  return left != null && left >= 0 && left <= days;
};

export const monthKey = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

/** Construit les N derniers mois (clés triées) pour aligner les séries temporelles. */
export const lastMonths = (n = 6) => {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
};

/** Agrège une liste par mois : { [monthKey]: somme(valueFn) } */
export const sumByMonth = (list, dateField, valueFn) => {
  const map = {};
  list.forEach((item) => {
    const d = item?.[dateField];
    if (!d) return;
    const key = monthKey(d);
    map[key] = (map[key] || 0) + num(typeof valueFn === 'function' ? valueFn(item) : item[valueFn]);
  });
  return map;
};

export const sortByDateDesc = (list, ...fields) =>
  [...list].sort((a, b) => {
    const da = fields.map((f) => a?.[f]).find(Boolean);
    const db = fields.map((f) => b?.[f]).find(Boolean);
    return new Date(db || 0) - new Date(da || 0);
  });

// ═══ Périmètre (direction) ═══
export const SCOPED_ROLES = ['GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE'];

export const scopeByDirection = (list, direction, field = 'direction') => {
  if (!direction) return list;
  return list.filter((item) => item?.[field] === direction);
};

/**
 * Restreint l'ensemble des jeux de données à une direction (gestionnaire local, responsable
 * de service). Les entités sans champ direction sont rattachées via l'identifiant véhicule.
 */
export const applyScope = (data, direction) => {
  if (!direction) return data;
  const vehicules = scopeByDirection(data.vehicules || [], direction);
  const ids = new Set(vehicules.map((v) => v.id));
  const byVehicule = (list = []) => list.filter((x) => (x.direction ? x.direction === direction : ids.has(x.vehiculeId)));
  return {
    ...data,
    vehicules,
    demandes: (data.demandes || []).filter((d) => !d.demandeurDirection || d.demandeurDirection === direction),
    affectations: (data.affectations || []).filter((a) => ids.has(a.vehiculeId)),
    pleins: byVehicule(data.pleins),
    cartes: (data.cartes || []).filter((c) => ids.has(c.vehiculeId)),
    anomalies: byVehicule(data.anomalies),
    interventions: byVehicule(data.interventions),
    alertes: byVehicule(data.alertes),
    assurances: (data.assurances || []).filter((a) => ids.has(a.vehiculeId)),
    sinistres: byVehicule(data.sinistres),
    pannes: byVehicule(data.pannes),
    taxes: (data.taxes || []).filter((t) => ids.has(t.vehiculeId)),
    conducteurs: scopeByDirection(data.conducteurs || [], direction),
    budgetAlertes: scopeByDirection(data.budgetAlertes || [], direction),
    budgetSynthese: data.budgetSynthese
      ? { ...data.budgetSynthese, lignes: scopeByDirection(data.budgetSynthese.lignes || [], direction) }
      : data.budgetSynthese,
    tcoDirections: scopeByDirection(data.tcoDirections || [], direction),
  };
};

// ═══ Statuts véhicules ═══
export const VEHICLE_STATUS_GROUPS = {
  DISPONIBLE: ['DISPONIBLE'],
  EN_MISSION: ['AFFECTE', 'RESERVE', 'EN_MISSION'],
  MAINTENANCE: ['EN_ENTRETIEN', 'EN_REPARATION', 'IMMOBILISE', 'EN_MAINTENANCE', 'ACCIDENTE'],
  REFORME: ['EN_COURS_REFORME', 'EN_COURS_DE_REFORME', 'REFORME', 'VENDU', 'RESTITUE', 'ARCHIVE', 'TRANSFERE'],
};

export const vehicleGroup = (statut) => {
  for (const [group, list] of Object.entries(VEHICLE_STATUS_GROUPS)) {
    if (list.includes(statut)) return group;
  }
  return 'AUTRE';
};

export const VEHICLE_GROUP_META = {
  DISPONIBLE: { label: 'Disponibles', color: '#0D7A5F' },
  EN_MISSION: { label: 'En mission / affectés', color: '#1565C0' },
  MAINTENANCE: { label: 'Maintenance / immobilisés', color: '#C47D2B' },
  REFORME: { label: 'Réformés / sortis', color: '#64748B' },
  AUTRE: { label: 'Autres', color: '#94A3B8' },
};

// ═══ Statuts demandes ═══
export const DEMAND_STATUS_META = {
  EN_ATTENTE_VALIDATION: { label: 'En attente N1', tone: 'amber' },
  VALIDEE_SERVICE: { label: 'Validée · attente N2', tone: 'blue' },
  APPROUVEE_AFFECTEE: { label: 'Affectée', tone: 'emerald' },
  EN_COURS: { label: 'En cours', tone: 'indigo' },
  TERMINEE: { label: 'Terminée', tone: 'slate' },
  REJETEE: { label: 'Rejetée', tone: 'red' },
  ANNULEE: { label: 'Annulée', tone: 'slate' },
};

export const MAINTENANCE_STATUS_META = {
  PROGRAMMEE: { label: 'Programmée', tone: 'blue' },
  EN_COURS: { label: 'En cours', tone: 'amber' },
  TERMINEE: { label: 'Terminée', tone: 'emerald' },
  ANNULEE: { label: 'Annulée', tone: 'slate' },
};

export const SINISTRE_OPEN = ['DECLARE', 'TRANSMIS', 'EN_COURS_D_EXPERTISE', 'EN_EXPERTISE', 'ACCEPTE'];
export const PANNE_OPEN = ['DECLAREE', 'EN_DIAGNOSTIC', 'EN_REPARATION'];

export const TONE_CLASSES = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  red: 'bg-red-50 text-red-800 border-red-200',
  gold: 'bg-[#FBF5E4] text-[#94700E] border-[#E3C873]',
  navy: 'bg-[#0A1E3F] text-white border-[#122B55]',
};

// ═══ Palette MEF ═══
export const MEF = {
  navy: '#0A1E3F',
  navyLight: '#122B55',
  gold: '#C59B27',
  goldLight: '#E3C873',
  emerald: '#0D7A5F',
  blue: '#1565C0',
  orange: '#C47D2B',
  red: '#C1272D',
  slate: '#64748B',
  teal: '#00A896',
};

export const FUEL_COLORS = { DIESEL: MEF.navy, ESSENCE: MEF.gold, HYBRIDE: MEF.emerald, ELECTRIQUE: MEF.blue };

export const NATURE_DEPENSE_LABELS = {
  CARBURANT: 'Carburant',
  LUBRIFIANTS: 'Lubrifiants',
  ASSURANCE: 'Assurance',
  ENTRETIEN: 'Entretien',
  REPARATION: 'Réparation',
  PIECES_RECHANGE: 'Pièces de rechange',
  PNEUS: 'Pneumatiques',
  VISITE_TECHNIQUE: 'Visite technique',
  VISITES: 'Visites',
  TAXES: 'Taxes',
  LOCATION: 'Location',
  AUTRES: 'Autres',
};

export const ROLE_LABELS = {
  ADMIN: 'Administrateur Système',
  GESTIONNAIRE_CENTRAL: 'Gestionnaire Central du Parc',
  GESTIONNAIRE_LOCAL: 'Gestionnaire Local du Parc',
  RESPONSABLE_FINANCIER: 'Responsable Financier',
  RESPONSABLE_SERVICE: 'Responsable de Service',
  CONDUCTEUR: 'Conducteur / Chauffeur',
  CONSULTATION: 'Consultation / Audit',
};

export const ROLE_DESCRIPTIONS = {
  ADMIN: 'Pilotage global de la flotte, supervision système et sécurité',
  GESTIONNAIRE_CENTRAL: 'Gestion centralisée du parc automobile du Ministère',
  GESTIONNAIRE_LOCAL: 'Gestion opérationnelle du parc de votre direction',
  RESPONSABLE_FINANCIER: 'Exécution budgétaire, TCO et maîtrise des coûts',
  RESPONSABLE_SERVICE: 'Validation des demandes et suivi des missions de votre service',
  CONDUCTEUR: 'Vos missions, votre véhicule et vos demandes de déplacement',
  CONSULTATION: 'Vue de synthèse en lecture seule',
};

export const resolveRole = (user) => {
  if (!user) return 'CONSULTATION';
  const raw = typeof user.role === 'string' ? user.role : (user.role?.nom || user.role?.name || 'CONSULTATION');
  if (raw === 'CHAUFFEUR') return 'CONDUCTEUR';
  if (['ADMIN_CENTRAL', 'RESPONSABLE_PARC', 'CHEF_PARC_REGIONAL'].includes(raw)) return 'GESTIONNAIRE_CENTRAL';
  if (raw === 'CHEF_SERVICE') return 'RESPONSABLE_SERVICE';
  return raw;
};

export const userDirection = (user) => user?.direction || user?.directionAffectation || user?.structure || '';

export const userDisplayName = (user) => {
  if (!user) return '';
  return `${user.prenom || ''} ${user.nom || ''}`.trim();
};

/** Restreint les jeux de données au conducteur connecté (ses missions, son véhicule). */
export const filterDriverData = (data, user) => {
  const userId = user?.id;
  const email = (user?.email || '').toLowerCase();
  const me = (data.conducteurs || []).find((c) =>
    c.utilisateurId === userId || (c.email && String(c.email).toLowerCase() === email)
  );
  const conducteurId = me?.id;
  const demandes = (data.demandes || []).filter((d) => d.demandeurId === userId);
  const affectations = (data.affectations || []).filter((a) =>
    a.conducteurId === conducteurId || a.conducteurId === userId
  );
  const vehicleIds = new Set(affectations.map((a) => a.vehiculeId).filter(Boolean));
  const vehicules = (data.vehicules || []).filter((v) => vehicleIds.has(v.id));
  const pleins = (data.pleins || []).filter((p) =>
    p.conducteurId === conducteurId || vehicleIds.has(p.vehiculeId)
  );
  const pannes = (data.pannes || []).filter((p) =>
    p.conducteurId === conducteurId || vehicleIds.has(p.vehiculeId)
  );
  return { ...data, demandes, affectations, vehicules, pleins, pannes, conducteur: me };
};

export const fleetCounts = (vehicules = []) => {
  const counts = { total: vehicules.length, DISPONIBLE: 0, EN_MISSION: 0, MAINTENANCE: 0, REFORME: 0, AUTRE: 0 };
  vehicules.forEach((v) => { counts[vehicleGroup(v.statutAdministratif)] += 1; });
  return counts;
};

export const monthlySeries = (list, dateField, valueFn, months = 6) => {
  const keys = lastMonths(months);
  const sums = sumByMonth(list, dateField, valueFn);
  return keys.map((key) => ({ key, name: monthLabel(key), value: sums[key] || 0 }));
};
