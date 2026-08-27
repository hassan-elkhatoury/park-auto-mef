import api from './api';

export const infractionService = {
  getAll: async () => {
    const res = await api.get('/infractions');
    return res?.data || res || [];
  },
  getById: async (id) => {
    const res = await api.get(`/infractions/${id}`);
    return res?.data || res;
  },
  create: async (data) => {
    const res = await api.post('/infractions', data);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await api.put(`/infractions/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/infractions/${id}`);
    return res?.data || res;
  }
};

export default infractionService;
