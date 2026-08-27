import api from './api';

export const garageService = {
  getAll: async () => {
    const res = await api.get('/garages');
    return res?.data || res || [];
  },

  getActifs: async () => {
    const res = await api.get('/garages/actifs');
    return res?.data || res || [];
  },

  getById: async (id) => {
    const res = await api.get(`/garages/${id}`);
    return res?.data || res;
  },

  save: async (data) => {
    const res = await api.post('/garages', data);
    return res?.data || res;
  },

  delete: async (id) => {
    const res = await api.delete(`/garages/${id}`);
    return res?.data || res;
  },

  getAllPieces: async () => {
    const res = await api.get('/garages/pieces');
    return res?.data || res || [];
  },

  getPiecesByGarage: async (garageId) => {
    const res = await api.get(`/garages/${garageId}/pieces`);
    return res?.data || res || [];
  },

  savePiece: async (data) => {
    const res = await api.post('/garages/pieces', data);
    return res?.data || res;
  }
};

export default garageService;
