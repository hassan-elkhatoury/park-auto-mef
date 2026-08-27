import api from './api';

export const assuranceService = {
  getAll: async () => {
    const res = await api.get('/assurances');
    return res?.data || res || [];
  },
  getById: async (id) => {
    const res = await api.get(`/assurances/${id}`);
    return res?.data || res;
  },
  getByVehicule: async (vehiculeId) => {
    const res = await api.get(`/assurances/vehicule/${vehiculeId}`);
    return res?.data || res || [];
  },
  getExpirantBientot: async (jours = 30) => {
    const res = await api.get(`/assurances/expirant-bientot?jours=${jours}`);
    return res?.data || res || [];
  },
  create: async (data) => {
    const res = await api.post('/assurances', data);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await api.put(`/assurances/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/assurances/${id}`);
    return res?.data || res;
  }
};

export default assuranceService;
