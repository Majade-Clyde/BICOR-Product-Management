import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('stockflow_token') || sessionStorage.getItem('stockflow_token') || null;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user') || sessionStorage.getItem('stockflow_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate existing session on application boot
  useEffect(() => {
    const verifySession = async () => {
      const activeToken = localStorage.getItem('stockflow_token') || sessionStorage.getItem('stockflow_token');
      if (!activeToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch {
        // Token invalid or expired
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (username, password, rememberMe = true) => {
    const res = await authService.login(username, password);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);

      if (rememberMe) {
        localStorage.setItem('stockflow_token', res.token);
        localStorage.setItem('stockflow_user', JSON.stringify(res.user));
        sessionStorage.removeItem('stockflow_token');
        sessionStorage.removeItem('stockflow_user');
      } else {
        sessionStorage.setItem('stockflow_token', res.token);
        sessionStorage.setItem('stockflow_user', JSON.stringify(res.user));
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
      }
      return res;
    }
    throw new Error(res.message || 'Invalid username or password.');
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('stockflow_token');
      localStorage.removeItem('stockflow_user');
      sessionStorage.removeItem('stockflow_token');
      sessionStorage.removeItem('stockflow_user');
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

