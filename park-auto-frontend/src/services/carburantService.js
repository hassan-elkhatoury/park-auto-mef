import api from './api';

export const carburantService = {
  getPleins: async () => {
    const res = await api.get('/carburant/pleins');
    return res.data;
  },

  getPleinsByVehicule: async (vehiculeId) => {
    const res = await api.get(`/carburant/pleins/vehicule/${vehiculeId}`);
    return res.data;
  },

  getAnomalies: async () => {
    const res = await api.get('/carburant/pleins/anomalies');
    return res.data;
  },

  enregistrerPlein: async (data) => {
    const res = await api.post('/carburant/pleins', data);
    return res.data;
  },

  deletePlein: async (id) => {
    const res = await api.delete(`/carburant/pleins/${id}`);
    return res.data;
  },

  getCartes: async () => {
    const res = await api.get('/carburant/cartes');
    return res.data;
  },

  enregistrerCarte: async (data) => {
    const res = await api.post('/carburant/cartes', data);
    return res.data;
  },

  deleteCarte: async (id) => {
    const res = await api.delete(`/carburant/cartes/${id}`);
    return res.data;
  }
};

export default carburantService;
