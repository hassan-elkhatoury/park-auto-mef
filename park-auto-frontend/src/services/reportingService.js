import api from './api';

export const reportingService = {
  getSummary: async () => {
    const res = await api.get('/reporting/summary');
    return res.data;
  },

  getTcoVehicules: async () => {
    const res = await api.get('/reporting/tco/vehicules');
    return res.data;
  },

  getTcoDirections: async () => {
    const res = await api.get('/reporting/tco/directions');
    return res.data;
  },

  exportExcel: async () => {
    const response = await api.get('/reporting/export/excel', {
      responseType: 'blob'
    });
    return response;
  },

  exportPdf: async () => {
    const response = await api.get('/reporting/export/pdf', {
      responseType: 'blob'
    });
    return response;
  }
};

export default reportingService;
