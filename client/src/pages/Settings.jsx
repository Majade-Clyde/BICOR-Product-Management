import React, { useState, useEffect } from 'react';
import { useToast } from '../components/common/Toast';
import { useSettings, CURRENCY_MAP } from '../context/SettingsContext';
import {
  Palette,
  Info,
  User,
  Loader2,
  Save,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export const Settings = () => {
  const toast = useToast();
  const { settings, updateSettings, previewTheme } = useSettings();

  const [saving, setSaving] = useState(false);
  const isFormDirtyRef = React.useRef(false);

  // Form input states
  const [appName, setAppName] = useState(settings?.application_title || 'BICOR-Product-Management');
  const [currency, setCurrency] = useState(settings?.currency || 'USD');
  const [adminName, setAdminName] = useState(settings?.admin_full_name || 'Administrator Clyde');
  const [adminEmail, setAdminEmail] = useState(settings?.admin_email || 'clyde@example.com');
  const [themePreference, setThemePreference] = useState(settings?.dashboard_theme || 'light');

  // Keep form in sync when settings are loaded from server or localStorage, unless user has typed
  useEffect(() => {
    if (settings && !isFormDirtyRef.current) {
      setAppName(settings.application_title || 'BICOR-Product-Management');
      setCurrency(settings.currency || 'USD');
      setAdminName(settings.admin_full_name || 'Administrator Clyde');
      setAdminEmail(settings.admin_email || 'clyde@example.com');
      setThemePreference(settings.dashboard_theme || 'light');
    }
  }, [settings]);

  // Theme selection handler: updates local state and applies live preview
  const handleThemeChange = (newTheme) => {
    isFormDirtyRef.current = true;
    setThemePreference(newTheme);
    previewTheme(newTheme);
  };

  // Form submission: validates and persists to backend/Supabase
  const handleSavePreferences = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (!appName.trim()) {
      toast.error('Application title cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim() || !emailRegex.test(adminEmail.trim())) {
      toast.error('Please enter a valid administrator email address.');
      return;
    }

    if (!adminName.trim()) {
      toast.error('Administrator full name cannot be empty.');
      return;
    }

    // 2. Persist
    try {
      setSaving(true);
      const payload = {
        application_title: appName.trim(),
        currency: currency,
        admin_full_name: adminName.trim(),
        admin_email: adminEmail.trim().toLowerCase(),
        dashboard_theme: themePreference,
      };

      const res = await updateSettings(payload);
      isFormDirtyRef.current = false;
      toast.success(res?.message || 'Dashboard preferences saved successfully.');
      if (res?.persistedToDatabase === false && res?.dbWarning) {
        console.warn('Supabase DB persistence notice:', res.dbWarning);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure application details, administrator profile, currency standard, and dashboard appearance.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Section 1: Application Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Information</h2>
              <p className="text-xs text-slate-500">General software parameters & currency display standard</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Application Title
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => {
                  isFormDirtyRef.current = true;
                  setAppName(e.target.value);
                }}
                placeholder="e.g. BICOR-Product-Management"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Displayed in application headers and browser tab.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Currency Standard
              </label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => {
                    isFormDirtyRef.current = true;
                    setCurrency(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 cursor-pointer"
                >
                  {Object.values(CURRENCY_MAP).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Applied to all inventory valuation totals and product prices.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Admin Profile Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Admin Profile Information</h2>
              <p className="text-xs text-slate-500">Administrator contact details & Supabase Auth credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Admin Full Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => {
                  isFormDirtyRef.current = true;
                  setAdminName(e.target.value);
                }}
                placeholder="e.g. Administrator Clyde"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Official administrator name shown in headers and audits.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Admin Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => {
                  isFormDirtyRef.current = true;
                  setAdminEmail(e.target.value);
                }}
                placeholder="e.g. clyde@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Connected to Supabase Auth login resolution.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Dashboard Appearance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Dashboard Appearance</h2>
              <p className="text-xs text-slate-500">Theme and contrast options (applied application-wide)</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Interface Color Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Clean Light */}
              <div
                onClick={() => handleThemeChange('light')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  themePreference === 'light'
                    ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-2 ring-brand-200/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Clean Light (Default)</span>
                    <input
                      type="radio"
                      name="theme"
                      checked={themePreference === 'light'}
                      onChange={() => handleThemeChange('light')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Professional white & slate</p>
                </div>
              </div>

              {/* Option 2: System Auto */}
              <div
                onClick={() => handleThemeChange('system')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  themePreference === 'system'
                    ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-2 ring-brand-200/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">System Auto</span>
                    <input
                      type="radio"
                      name="theme"
                      checked={themePreference === 'system'}
                      onChange={() => handleThemeChange('system')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Match OS theme preferences</p>
                </div>
              </div>

              {/* Option 3: High Contrast */}
              <div
                onClick={() => handleThemeChange('dark')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  themePreference === 'dark'
                    ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-2 ring-brand-200/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">High Contrast</span>
                    <input
                      type="radio"
                      name="theme"
                      checked={themePreference === 'dark'}
                      onChange={() => handleThemeChange('dark')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Accessible dark contrast</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Save Preferences Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
