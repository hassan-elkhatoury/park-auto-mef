import api from './api';

const openPdfBlob = (res, fallbackName) => {
  const file = res instanceof Blob ? res : new Blob([res], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }));
  const opened = window.open(blobUrl, '_blank');
  if (!opened) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

export const reformeService = {
  getAll: async () => {
    const res = await api.get('/reformes');
    return res?.data || res || [];
  },
  getById: async (id) => {
    const res = await api.get(`/reformes/${id}`);
    return res?.data || res;
  },
  create: async (data) => {
    const res = await api.post('/reformes', data);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await api.put(`/reformes/${id}`, data);
    return res?.data || res;
  },
  valider: async (id) => {
    const res = await api.post(`/reformes/${id}/valider`);
    return res?.data || res;
  },
  /** RG07 — transition contrôlée par la machine à états serveur (INITIE → EN_COURS_DE_REFORME → VALIDE → REFORME → VENDU). */
  changerStatut: async (id, statut) => {
    const res = await api.post(`/reformes/${id}/statut/${statut}`);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/reformes/${id}`);
    return res?.data || res;
  },
  openPvCommissionPdf: async (id) => {
    const res = await api.get(`/reformes/${id}/pv-commission`, { responseType: 'blob' });
    openPdfBlob(res, `PV_Commission_Reforme_${id}.pdf`);
  }
};

export default reformeService;
