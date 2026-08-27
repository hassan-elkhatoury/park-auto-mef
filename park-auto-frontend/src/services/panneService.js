import api from './api';

export const panneService = {
  getAll: async () => {
    const res = await api.get('/pannes');
    return res?.data || res || [];
  },

  getById: async (id) => {
    const res = await api.get(`/pannes/${id}`);
    return res?.data || res;
  },

  getByVehicule: async (vehiculeId) => {
    const res = await api.get(`/pannes/vehicule/${vehiculeId}`);
    return res?.data || res || [];
  },

  declarer: async (data) => {
    const res = await api.post('/pannes', data);
    return res?.data || res;
  },

  modifier: async (id, data) => {
    const res = await api.put(`/pannes/${id}`, data);
    return res?.data || res;
  },

  cloturer: async (id, data) => {
    const res = await api.put(`/pannes/${id}/cloturer`, data);
    return res?.data || res;
  },

  delete: async (id) => {
    const res = await api.delete(`/pannes/${id}`);
    return res?.data || res;
  }
};

export default panneService;
