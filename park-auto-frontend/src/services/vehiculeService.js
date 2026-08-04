import api from './api';

export const vehiculeService = {
  getVehicules: async () => {
    const res = await api.get('/vehicules?size=200');
    const d = res?.data || res;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.content)) return d.content;
    if (Array.isArray(res)) return res;
    return [];
  },

  getVehiculeById: async (id) => {
    const res = await api.get(`/vehicules/${id}`);
    return res?.data || res;
  }
};

export default vehiculeService;
