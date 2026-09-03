import api from './api';

const ACCEPT_TYPES = '.pdf,.png,.jpg,.jpeg,.xlsx,.xls';

/**
 * Service GED (Gestion Électronique des Documents).
 * Entités acceptées côté serveur (liste blanche) : vehicule, conducteur, mission, sinistre,
 * assurance, maintenance, panne, reforme, infraction, carburant, taxe, visite_technique,
 * engagement, budget.
 */
export const documentService = {
  acceptTypes: ACCEPT_TYPES,

  upload: async (file, entite, entiteId, typeDocument = 'DOCUMENT') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entite', String(entite).toLowerCase());
    formData.append('entiteId', entiteId);
    formData.append('typeDocument', typeDocument);

    const res = await api.post('/documents/upload', formData);
    return res?.data || res;
  },

  uploadMany: async (files, entite, entiteId, typeDocument = 'DOCUMENT') => {
    if (!files?.length || !entiteId) return [];
    const uploaded = [];
    for (const file of files) {
      uploaded.push(await documentService.upload(file, entite, entiteId, typeDocument));
    }
    return uploaded;
  },

  getByEntite: async (entite, entiteId) => {
    const res = await api.get(`/documents/entite/${String(entite).toLowerCase()}/${entiteId}`);
    const list = res?.data || res || [];
    return Array.isArray(list) ? list : [];
  },

  download: async (id) => {
    const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return res instanceof Blob ? res : (res?.data || res);
  },

  downloadAndSave: async (doc) => {
    const blob = await documentService.download(doc.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nomFichier || `document-${doc.id}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  delete: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res?.data || res;
  },
};

export default documentService;
