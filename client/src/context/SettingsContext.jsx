import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settingsService';
import { useAuth } from './AuthContext';

export const CURRENCY_MAP = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', label: '$ - United States Dollar (USD)' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', label: '₱ - Philippine Peso (PHP)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', label: '€ - Euro (EUR)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', label: '£ - British Pound (GBP)' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', label: '¥ - Japanese Yen (JPY)' },
};

const DEFAULT_SETTINGS = {
  application_title: 'BICOR-Product-Management',
  currency: 'USD',
  admin_full_name: 'Administrator Clyde',
  admin_email: 'clyde@example.com',
  dashboard_theme: 'light',
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bicor_settings') || localStorage.getItem('managementflow_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [loading, setLoading] = useState(false);

  // Helper to apply theme to document root
  const applyTheme = useCallback((themeChoice) => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const setClasses = (isDark) => {
      if (isDark) {
        root.classList.add('theme-high-contrast', 'dark');
        root.setAttribute('data-theme', 'high-contrast');
      } else {
        root.classList.remove('theme-high-contrast', 'dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    if (themeChoice === 'dark') {
      setClasses(true);
    } else if (themeChoice === 'system') {
      setClasses(mediaQuery.matches);
    } else {
      setClasses(false);
    }
  }, []);

  // Sync theme and document title whenever settings change
  useEffect(() => {
    applyTheme(settings.dashboard_theme);
    const title = settings.application_title || 'BICOR-Product-Management';
    document.title = `${title} - Product Inventory Management System`;
  }, [settings.dashboard_theme, settings.application_title, applyTheme]);

  // Listen to OS theme changes if in 'system' mode
  useEffect(() => {
    if (settings.dashboard_theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (settings.dashboard_theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.dashboard_theme, applyTheme]);

  // Fetch settings from server on boot/login
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await settingsService.getSettings();
      if (res?.success && res?.settings) {
        setSettings((prev) => {
          // Compare timestamps to keep the newest version
          const prevTime = new Date(prev?.updated_at || 0).getTime();
          const serverTime = new Date(res.settings?.updated_at || 0).getTime();
          const newer = serverTime >= prevTime ? res.settings : prev;
          localStorage.setItem('bicor_settings', JSON.stringify(newer));
          localStorage.setItem('managementflow_settings', JSON.stringify(newer));
          return newer;
        });
      }
    } catch (err) {
      console.warn('[SettingsContext] Could not fetch server settings, using cached values:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update and persist settings
  const updateSettings = async (newSettings) => {
    setLoading(true);
    try {
      // Optimistically update local state & storage first
      const optimistic = {
        ...settings,
        ...newSettings,
        updated_at: new Date().toISOString(),
      };
      setSettings(optimistic);
      localStorage.setItem('bicor_settings', JSON.stringify(optimistic));
      localStorage.setItem('managementflow_settings', JSON.stringify(optimistic));
      applyTheme(optimistic.dashboard_theme);

      const res = await settingsService.updateSettings(newSettings);
      if (res?.success && res?.settings) {
        setSettings(res.settings);
        localStorage.setItem('bicor_settings', JSON.stringify(res.settings));
        localStorage.setItem('managementflow_settings', JSON.stringify(res.settings));
        applyTheme(res.settings.dashboard_theme);
        return res;
      }
      throw new Error(res?.message || 'Failed to save settings.');
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Immediate preview of theme before saving
  const previewTheme = (theme) => {
    applyTheme(theme);
  };

  // Get active currency info
  const activeCurrency = CURRENCY_MAP[settings.currency] || CURRENCY_MAP.USD;
  const currencySymbol = activeCurrency.symbol;
  const currencyCode = activeCurrency.code;

  /**
   * Format a numeric amount using the active currency symbol
   * @param {number|string} amount
   * @param {boolean} showDecimals
   */
  const formatPrice = (amount, showDecimals = true) => {
    const num = parseFloat(amount) || 0;
    const formatted = num.toLocaleString(undefined, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
    return `${currencySymbol}${formatted}`;
  };

  const value = {
    settings,
    loading,
    currencySymbol,
    currencyCode,
    activeCurrency,
    formatPrice,
    updateSettings,
    refreshSettings: fetchSettings,
    previewTheme,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

