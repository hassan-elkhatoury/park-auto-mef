import api from './api';

export const budgetService = {
  // --- ENVELOPPES BUDGÉTAIRES PAR DIRECTION ---
  getAllBudgets: async (annee) => {
    const url = annee ? `/budgets?annee=${annee}` : '/budgets';
    const res = await api.get(url);
    return res?.data || res || [];
  },
  getBudgetsByAnnee: async (annee) => {
    const res = await api.get(`/budgets/annee/${annee}`);
    return res?.data || res || [];
  },
  getSynthese: async (annee) => {
    const res = await api.get(`/budgets/synthese?annee=${annee}`);
    return res?.data || res;
  },
  createBudget: async (data) => {
    const res = await api.post('/budgets', data);
    return res?.data || res;
  },
  updateBudget: async (id, data) => {
    const res = await api.put(`/budgets/${id}`, data);
    return res?.data || res;
  },
  deleteBudget: async (id) => {
    const res = await api.delete(`/budgets/${id}`);
    return res?.data || res;
  },

  // --- EXERCICES BUDGÉTAIRES ---
  getAllExercices: async () => {
    const res = await api.get('/budgets/exercices');
    return res?.data?.data || res?.data || [];
  },
  getExerciceByAnnee: async (annee) => {
    const res = await api.get(`/budgets/exercices/${annee}`);
    return res?.data?.data || res?.data;
  },
  createExercice: async (data) => {
    const res = await api.post('/budgets/exercices', data);
    return res?.data?.data || res?.data;
  },
  cloturerExercice: async (annee, data) => {
    const res = await api.post(`/budgets/exercices/${annee}/cloturer`, data || {});
    return res?.data?.data || res?.data;
  },
  rouvrirExercice: async (annee) => {
    const res = await api.post(`/budgets/exercices/${annee}/rouvrir`);
    return res?.data?.data || res?.data;
  },

  // --- ENGAGEMENTS FINANCIERS ---
  getAllEngagements: async (annee, direction) => {
    const params = new URLSearchParams();
    if (annee) params.append('annee', annee);
    if (direction) params.append('direction', direction);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/budgets/engagements${qs}`);
    return res?.data?.data || res?.data || [];
  },
  createEngagement: async (data) => {
    const res = await api.post('/budgets/engagements', data);
    return res?.data?.data || res?.data;
  },
  liquiderEngagement: async (id, data) => {
    const res = await api.put(`/budgets/engagements/${id}/liquider`, data || {});
    return res?.data?.data || res?.data;
  },
  annulerEngagement: async (id, motif) => {
    const qs = motif ? `?motif=${encodeURIComponent(motif)}` : '';
    const res = await api.put(`/budgets/engagements/${id}/annuler${qs}`);
    return res?.data?.data || res?.data;
  },

  // --- ALERTES BUDGÉTAIRES ACTIVES ---
  getAlertesActives: async (annee) => {
    const qs = annee ? `?annee=${annee}` : '';
    const res = await api.get(`/budgets/alertes${qs}`);
    return res?.data?.data || res?.data || [];
  },

  // --- PRÉVISIONS CARBURANT ---
  getAllPrevisions: async () => {
    const res = await api.get('/budgets/previsions');
    return res?.data || res || [];
  },
  getPrevisionsByDirection: async (direction, annee) => {
    const res = await api.get(`/budgets/previsions/direction/${encodeURIComponent(direction)}?annee=${annee}`);
    return res?.data || res || [];
  },
  createPrevision: async (data) => {
    const res = await api.post('/budgets/previsions', data);
    return res?.data || res;
  },
  updatePrevision: async (id, data) => {
    const res = await api.put(`/budgets/previsions/${id}`, data);
    return res?.data || res;
  },
  deletePrevision: async (id) => {
    const res = await api.delete(`/budgets/previsions/${id}`);
    return res?.data || res;
  }
};

export default budgetService;
