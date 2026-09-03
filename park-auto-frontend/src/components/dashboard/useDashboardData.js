import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import { unwrapList, unwrapObject } from './dashboardUtils';

// ═══════════════════════════════════════════════════════════════════════════
// Catalogue des jeux de données — chaque entrée sait se charger et se normaliser
// ═══════════════════════════════════════════════════════════════════════════
const currentYear = new Date().getFullYear();

const DATASETS = {
  vehicules: { load: (ctx) => api.get(`/vehicules?size=500${ctx.direction ? `&direction=${encodeURIComponent(ctx.direction)}` : ''}`), parse: unwrapList, empty: [] },
  demandes: { load: () => api.get('/demandes'), parse: unwrapList, empty: [] },
  affectations: { load: () => api.get('/affectations'), parse: unwrapList, empty: [] },
  pleins: { load: () => api.get('/carburant/pleins'), parse: unwrapList, empty: [] },
  cartes: { load: () => api.get('/carburant/cartes'), parse: unwrapList, empty: [] },
  anomalies: { load: () => api.get('/carburant/pleins/anomalies'), parse: unwrapList, empty: [] },
  interventions: { load: () => api.get('/maintenance/interventions'), parse: unwrapList, empty: [] },
  alertes: { load: () => api.get('/maintenance/alertes'), parse: unwrapList, empty: [] },
  assurances: { load: () => api.get('/assurances'), parse: unwrapList, empty: [] },
  sinistres: { load: () => api.get('/sinistres'), parse: unwrapList, empty: [] },
  pannes: { load: () => api.get('/pannes'), parse: unwrapList, empty: [] },
  taxes: { load: () => api.get('/taxes-automobiles'), parse: unwrapList, empty: [] },
  conducteurs: { load: () => api.get('/conducteurs'), parse: unwrapList, empty: [] },
  utilisateurs: { load: () => api.get('/utilisateurs'), parse: unwrapList, empty: [] },
  auditLogs: { load: () => api.get('/audit-logs?page=0&size=8'), parse: unwrapList, empty: [] },
  summary: { load: () => api.get('/reporting/summary'), parse: unwrapObject, empty: null },
  tcoDirections: { load: () => api.get('/reporting/tco/directions'), parse: unwrapList, empty: [] },
  tcoMotorisations: { load: () => api.get('/reporting/tco/motorisations'), parse: unwrapList, empty: [] },
  budgetSynthese: { load: () => api.get(`/budgets/synthese?annee=${currentYear}`), parse: unwrapObject, empty: null },
  budgetAlertes: { load: () => api.get(`/budgets/alertes?annee=${currentYear}`), parse: unwrapList, empty: [] },
  engagements: { load: () => api.get(`/budgets/engagements?annee=${currentYear}`), parse: unwrapList, empty: [] },
};

// ═══ Jeux de données requis par rôle (aligné sur les @PreAuthorize du backend) ═══
const FLEET_CORE = ['vehicules', 'demandes', 'affectations', 'pleins', 'cartes', 'anomalies', 'interventions', 'alertes', 'assurances', 'sinistres', 'pannes'];

const ROLE_DATASETS = {
  ADMIN: [...FLEET_CORE, 'taxes', 'summary', 'tcoDirections', 'budgetSynthese', 'budgetAlertes', 'utilisateurs', 'auditLogs'],
  GESTIONNAIRE_CENTRAL: [...FLEET_CORE, 'taxes', 'summary', 'tcoDirections', 'budgetSynthese', 'budgetAlertes', 'utilisateurs', 'auditLogs'],
  GESTIONNAIRE_LOCAL: [...FLEET_CORE, 'summary', 'tcoDirections', 'budgetSynthese', 'budgetAlertes'],
  RESPONSABLE_FINANCIER: ['vehicules', 'pleins', 'anomalies', 'interventions', 'assurances', 'sinistres', 'taxes', 'summary', 'tcoDirections', 'tcoMotorisations', 'budgetSynthese', 'budgetAlertes', 'engagements'],
  RESPONSABLE_SERVICE: ['vehicules', 'demandes', 'affectations', 'pleins', 'alertes', 'conducteurs', 'pannes'],
  CONDUCTEUR: ['vehicules', 'demandes', 'affectations', 'pleins', 'conducteurs', 'pannes'],
  CONSULTATION: ['vehicules', 'demandes', 'affectations', 'pleins', 'interventions', 'alertes', 'assurances', 'sinistres', 'summary', 'tcoDirections'],
};

ROLE_DATASETS.CHAUFFEUR = ROLE_DATASETS.CONDUCTEUR;

const emptyStateFor = (keys) =>
  keys.reduce((acc, key) => {
    acc[key] = DATASETS[key].empty;
    return acc;
  }, {});

/**
 * Charge en parallèle l'ensemble des jeux de données nécessaires au tableau de bord
 * d'un rôle donné. Chaque appel est indépendant : un échec partiel (403, 500) n'empêche
 * pas l'affichage des autres indicateurs.
 */
export function useDashboardData(roleName, { direction } = {}) {
  const keys = useMemo(() => ROLE_DATASETS[roleName] || ROLE_DATASETS.CONSULTATION, [roleName]);
  const ctx = useMemo(() => ({ direction, roleName }), [direction, roleName]);
  const [data, setData] = useState(() => emptyStateFor(keys));
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    const results = await Promise.allSettled(keys.map((k) => DATASETS[k].load(ctx)));
    if (id !== requestId.current) return; // réponse obsolète

    const next = {};
    const failures = [];
    results.forEach((r, i) => {
      const key = keys[i];
      if (r.status === 'fulfilled') {
        next[key] = DATASETS[key].parse(r.value);
      } else {
        next[key] = DATASETS[key].empty;
        failures.push(key);
      }
    });
    setData(next);
    setFailed(failures);
    setLastUpdated(new Date());
    setLoading(false);
  }, [keys, ctx]);

  useEffect(() => {
    refresh();
    const onGlobalRefresh = () => refresh();
    window.addEventListener('parkauto:refresh', onGlobalRefresh);
    return () => window.removeEventListener('parkauto:refresh', onGlobalRefresh);
  }, [refresh]);

  return { data, loading, failed, lastUpdated, refresh };
}

export default useDashboardData;
