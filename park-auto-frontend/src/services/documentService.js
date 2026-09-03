import api from './api';

/**
 * Service GED (Gestion Électronique des Documents).
 * Entités acceptées côté serveur (liste blanche) : vehicule, conducteur, mission, sinistre,
 * assurance, maintenance, panne, reforme, infraction, carburant, taxe, visite_technique,
 * engagement, budget.
 */
export const documentService = {
  upload: async (file, entite, entiteId, typeDocument = 'DOCUMENT') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entite', String(entite).toLowerCase());
    formData.append('entiteId', entiteId);
    formData.append('typeDocument', typeDocument);

    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data || res;
  },
  getByEntite: async (entite, entiteId) => {
    const res = await api.get(`/documents/entite/${String(entite).toLowerCase()}/${entiteId}`);
    return res?.data || res || [];
  },
  download: async (id) => {
    const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res?.data || res;
  },
};

export default documentService;
