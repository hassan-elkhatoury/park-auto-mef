import api from './api';

export const sinistreService = {
  getAll: async () => {
    const res = await api.get('/sinistres');
    return res?.data || res || [];
  },
  getById: async (id) => {
    const res = await api.get(`/sinistres/${id}`);
    return res?.data || res;
  },
  getByVehicule: async (vehiculeId) => {
    const res = await api.get(`/sinistres/vehicule/${vehiculeId}`);
    return res?.data || res || [];
  },
  declarer: async (data) => {
    const res = await api.post('/sinistres/declarer', data);
    return res?.data || res;
  },
  modifier: async (id, data) => {
    const res = await api.put(`/sinistres/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/sinistres/${id}`);
    return res?.data || res;
  }
};

export default sinistreService;
