import api from './api';

export const settingsService = {
  /**
   * Fetch current application settings
   */
  getSettings: async () => {
    return await api.get('/settings');
  },

  /**
   * Update and persist application settings
   * @param {Object} settingsData
   */
  updateSettings: async (settingsData) => {
    return await api.put('/settings', settingsData);
  },
};

