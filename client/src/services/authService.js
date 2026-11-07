import api from './api';

export const authService = {
  // Login with predefined username and password
  login: async (username, password) => {
    return await api.post('/auth/login', { username, password });
  },

  // Verify current user session
  getMe: async () => {
    return await api.get('/auth/me');
  },

  // Logout session
  logout: async () => {
    try {
      return await api.post('/auth/logout');
    } catch {
      return { success: true };
    }
  },
};

