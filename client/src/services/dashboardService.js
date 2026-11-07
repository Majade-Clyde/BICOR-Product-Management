import api from './api';

export const dashboardService = {
  // Get all dynamic dashboard stats, recent products, and low-stock items
  getStats: async () => {
    return await api.get('/dashboard/stats');
  },

  // Get server health & database connection status
  getHealth: async () => {
    return await api.get('/health');
  },
};

