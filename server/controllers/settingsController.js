const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

// Local fallback cache file path to ensure 100% reliability
const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  id: 1,
  application_title: 'BICOR-Product-Management',
  currency: 'USD',
  admin_full_name: 'Administrator Clyde',
  admin_email: process.env.ADMIN_EMAIL || 'clyde@example.com',
  dashboard_theme: 'light',
  updated_at: new Date().toISOString(),
};

// Helper: Read local fallback settings
const readLocalSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    }
  } catch (err) {
    console.error('[Settings] Error reading local settings file:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
};

// Helper: Save local fallback settings
const writeLocalSettings = (settings) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Settings] Error writing local settings file:', err.message);
  }
};

/**
 * Normalizes currency string to standard code ('USD', 'PHP', 'EUR', 'GBP', 'JPY')
 */
const normalizeCurrency = (currency) => {
  if (!currency) return 'USD';
  const upper = String(currency).toUpperCase();
  if (upper.includes('PHP') || upper.includes('₱')) return 'PHP';
  if (upper.includes('EUR') || upper.includes('€')) return 'EUR';
  if (upper.includes('GBP') || upper.includes('£')) return 'GBP';
  if (upper.includes('JPY') || upper.includes('¥')) return 'JPY';
  return 'USD';
};

/**
 * @route   GET /api/settings
 * @desc    Retrieve persistent application settings
 * @access  Private (Admin only)
 */
const getSettings = async (req, res) => {
  try {
    const local = readLocalSettings();
    let settings = local;

    // 1. Attempt to fetch from Supabase PostgreSQL
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        const localTime = new Date(local?.updated_at || 0).getTime();
        const dbTime = new Date(data?.updated_at || 0).getTime();

        // Only overwrite local cache if Supabase is newer or equal
        if (dbTime >= localTime) {
          settings = data;
          writeLocalSettings(data);
        } else {
          // Local settings are newer than DB, sync to DB
          settings = local;
          try {
            await supabase.from('application_settings').upsert(local, { onConflict: 'id' });
          } catch (_) {}
        }
      }
    } catch (dbErr) {
      console.warn('[Settings] Supabase fetch failed, checking local storage:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      settings: {
        id: 1,
        application_title: settings.application_title || 'BICOR-Product-Management',
        currency: normalizeCurrency(settings.currency),
        admin_full_name: settings.admin_full_name || 'Administrator Clyde',
        admin_email: settings.admin_email || process.env.ADMIN_EMAIL || 'clyde@example.com',
        dashboard_theme: settings.dashboard_theme || 'light',
        updated_at: settings.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve application settings.',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/settings
 * @desc    Update and persist application settings
 * @access  Private (Admin only)
 */
const updateSettings = async (req, res) => {
  try {
    const {
      application_title,
      currency,
      admin_full_name,
      admin_email,
      dashboard_theme,
    } = req.body;

    // 1. Validation
    if (!application_title || typeof application_title !== 'string' || !application_title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Application title is required and cannot be empty.',
      });
    }

    const normalizedCurrency = normalizeCurrency(currency);
    const validCurrencies = ['USD', 'PHP', 'EUR', 'GBP', 'JPY'];
    if (!validCurrencies.includes(normalizedCurrency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Must be one of: USD, PHP, EUR, GBP, JPY.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!admin_email || !emailRegex.test(admin_email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid administrator email address is required.',
      });
    }

    const validThemes = ['light', 'system', 'dark'];
    const normalizedTheme = validThemes.includes(dashboard_theme) ? dashboard_theme : 'light';

    const cleanTitle = application_title.trim().slice(0, 100);
    const cleanFullName = (admin_full_name || 'Administrator Clyde').trim().slice(0, 100);
    const cleanEmail = admin_email.trim().toLowerCase();

    const payload = {
      id: 1,
      application_title: cleanTitle,
      currency: normalizedCurrency,
      admin_full_name: cleanFullName,
      admin_email: cleanEmail,
      dashboard_theme: normalizedTheme,
      updated_at: new Date().toISOString(),
    };

    // 2. Handle Supabase Auth Admin user update if email/name changed
    if (req.user && req.user.id) {
      try {
        const updateAuthPayload = {};
        if (cleanEmail !== (req.user.email || '').toLowerCase()) {
          updateAuthPayload.email = cleanEmail;
        }
        updateAuthPayload.user_metadata = {
          full_name: cleanFullName,
          username: process.env.ADMIN_USERNAME || 'Adminclyde',
        };

        if (Object.keys(updateAuthPayload).length > 0) {
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            req.user.id,
            updateAuthPayload
          );
          if (authUpdateError) {
            console.warn('[Settings] Supabase Auth update warning:', authUpdateError.message);
          }
        }

        // Also update admin_profiles table if it exists
        try {
          await supabase
            .from('admin_profiles')
            .update({
              email: cleanEmail,
              full_name: cleanFullName,
            })
            .eq('id', req.user.id);
        } catch (profileErr) {
          // Non-blocking if table is not used
        }
      } catch (authErr) {
        console.warn('[Settings] Supabase admin user update warning:', authErr.message);
      }
    }

    // 3. Persist to Supabase application_settings table
    let dbSuccess = false;
    let dbErrorMessage = null;
    try {
      // First try update row 1
      const { data: updateData, error: updateError } = await supabase
        .from('application_settings')
        .update(payload)
        .eq('id', 1)
        .select();

      if (!updateError && updateData && updateData.length > 0) {
        dbSuccess = true;
        payload.updated_at = updateData[0].updated_at || payload.updated_at;
      } else {
        // If row didn't exist to update, try upsert
        const { data: upsertData, error: upsertError } = await supabase
          .from('application_settings')
          .upsert(payload, { onConflict: 'id' })
          .select();

        if (!upsertError && upsertData && upsertData.length > 0) {
          dbSuccess = true;
          payload.updated_at = upsertData[0].updated_at || payload.updated_at;
        } else if (upsertError) {
          dbErrorMessage = upsertError.message;
          console.warn('[Settings] Supabase upsert error:', upsertError.message);
        }
      }
    } catch (dbErr) {
      dbErrorMessage = dbErr.message;
      console.warn('[Settings] Supabase upsert exception:', dbErr.message);
    }

    // 4. Always persist to local cache for 100% resilience
    writeLocalSettings(payload);

    return res.status(200).json({
      success: true,
      message: 'Preferences saved successfully.',
      persistedToDatabase: dbSuccess,
      dbWarning: dbErrorMessage,
      settings: payload,
    });
  } catch (error) {
    console.error('Settings PUT Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save application settings.',
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  readLocalSettings,
};

