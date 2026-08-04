import api from './api';

export const maintenanceService = {
  getInterventions: async () => {
    const res = await api.get('/maintenance/interventions');
    return res.data;
  },

  getInterventionsByVehicule: async (vehiculeId) => {
    const res = await api.get(`/maintenance/interventions/vehicule/${vehiculeId}`);
    return res.data;
  },

  enregistrerIntervention: async (data) => {
    const res = await api.post('/maintenance/interventions', data);
    return res.data;
  },

  deleteIntervention: async (id) => {
    const res = await api.delete(`/maintenance/interventions/${id}`);
    return res.data;
  },

  getAlertes: async () => {
    const res = await api.get('/maintenance/alertes');
    return res.data;
  }
};

export default maintenanceService;
