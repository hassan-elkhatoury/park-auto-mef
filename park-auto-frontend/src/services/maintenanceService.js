import api from './api';

export const maintenanceService = {
  getInterventions: async () => {
    const res = await api.get('/maintenance/interventions');
    return res?.data || res || [];
  },

  getInterventionById: async (id) => {
    const res = await api.get(`/maintenance/interventions/${id}`);
    return res?.data || res;
  },

  getInterventionsByVehicule: async (vehiculeId) => {
    const res = await api.get(`/maintenance/interventions/vehicule/${vehiculeId}`);
    return res?.data || res || [];
  },

  enregistrerIntervention: async (data) => {
    const res = await api.post('/maintenance/interventions', data);
    return res?.data || res;
  },

  cloturerIntervention: async (id, data) => {
    const res = await api.put(`/maintenance/interventions/${id}/cloturer`, data);
    return res?.data || res;
  },

  deleteIntervention: async (id) => {
    const res = await api.delete(`/maintenance/interventions/${id}`);
    return res?.data || res;
  },

  getAlertes: async () => {
    const res = await api.get('/maintenance/alertes');
    return res?.data || res || [];
  }
};

export default maintenanceService;
