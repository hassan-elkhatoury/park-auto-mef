import api from './api';

export const taxeService = {
  getAll: async () => {
    const res = await api.get('/taxes-automobiles');
    return res?.data || res || [];
  },
  getById: async (id) => {
    const res = await api.get(`/taxes-automobiles/${id}`);
    return res?.data || res;
  },
  create: async (data) => {
    const res = await api.post('/taxes-automobiles', data);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await api.put(`/taxes-automobiles/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/taxes-automobiles/${id}`);
    return res?.data || res;
  }
};

export default taxeService;
