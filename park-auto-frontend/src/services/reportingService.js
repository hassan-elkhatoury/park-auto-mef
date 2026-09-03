import api from './api';

export const reportingService = {
  // GET /api/reporting/summary — Synthèse exécutive globale
  getSummary: async () => {
    const res = await api.get('/reporting/summary');
    return res?.data?.data || res?.data || null;
  },
  getExecutiveSummary: async () => {
    const res = await api.get('/reporting/summary');
    return res?.data?.data || res?.data || null;
  },

  // GET /api/reporting/tco/vehicules — TCO par véhicule & MAD/km
  getTcoVehicules: async () => {
    const res = await api.get('/reporting/tco/vehicules');
    return res?.data?.data || res?.data || [];
  },
  getTcoByVehicles: async () => {
    const res = await api.get('/reporting/tco/vehicules');
    return res?.data?.data || res?.data || [];
  },

  // GET /api/reporting/tco/directions — TCO par direction MEF
  getTcoByDirections: async () => {
    const res = await api.get('/reporting/tco/directions');
    return res?.data?.data || res?.data || [];
  },

  // GET /api/reporting/tco/motorisations — Consolidation par type de carburant
  getTcoMotorisations: async () => {
    const res = await api.get('/reporting/tco/motorisations');
    return res?.data?.data || res?.data || [];
  },

  // GET /api/reporting/tco/consolidation — Consolidation décisionnelle complète
  getTcoConsolidation: async () => {
    const res = await api.get('/reporting/tco/consolidation');
    return res?.data?.data || res?.data || null;
  },

  // GET /api/reporting/export/excel — Exportation Excel (.xlsx)
  exportExcel: async () => {
    const res = await api.get('/reporting/export/excel', { responseType: 'blob' });
    return (res instanceof Blob) ? res : (res?.data ?? res);
  },

  // GET /api/reporting/export/pdf — Exportation PDF officiel (.pdf)
  exportPdf: async () => {
    const res = await api.get('/reporting/export/pdf', { responseType: 'blob' });
    return (res instanceof Blob) ? res : (res?.data ?? res);
  },

  // GET /api/reporting/export/csv — Exportation CSV normalisée (SID MEF)
  exportCsv: async () => {
    const res = await api.get('/reporting/export/csv', { responseType: 'blob' });
    return (res instanceof Blob) ? res : (res?.data ?? res);
  }
};

export default reportingService;
