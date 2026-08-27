import api from './api';

export const documentService = {
  upload: async (file, entiteType, entiteId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entiteType', entiteType);
    formData.append('entiteId', entiteId);

    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res?.data || res;
  },
  getByEntite: async (entiteType, entiteId) => {
    const res = await api.get(`/documents?entiteType=${entiteType}&entiteId=${entiteId}`);
    return res?.data || res || [];
  },
  download: async (id) => {
    const res = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res?.data || res;
  }
};

export default documentService;
