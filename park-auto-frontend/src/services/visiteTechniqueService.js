import api from './api';

export const visiteTechniqueService = {
  getAll: async () => {
    const res = await api.get('/visites-techniques');
    return res?.data || res || [];
  },
  getById: async (id) => {
    const res = await api.get(`/visites-techniques/${id}`);
    return res?.data || res;
  },
  getByVehicule: async (vehiculeId) => {
    const res = await api.get(`/visites-techniques/vehicule/${vehiculeId}`);
    return res?.data || res || [];
  },
  create: async (data) => {
    const res = await api.post('/visites-techniques', data);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await api.put(`/visites-techniques/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/visites-techniques/${id}`);
    return res?.data || res;
  }
};

export default visiteTechniqueService;
