const { supabaseAuth, supabase } = require('../config/supabase');
const { readLocalSettings } = require('./settingsController');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate administrator using predefined username and password
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const configuredUsername = (process.env.ADMIN_USERNAME || 'Adminclyde').trim();
    const localSettings = readLocalSettings();
    let configuredEmail = (localSettings?.admin_email || process.env.ADMIN_EMAIL || '').trim();

    // Verify username matches configured administrator username (case-insensitive)
    if (username.trim().toLowerCase() !== configuredUsername.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Smart Resolution: If ADMIN_EMAIL is placeholder or empty, check registered Supabase Auth users
    if (!configuredEmail || configuredEmail.includes('@example.com')) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      if (listData?.users && listData.users.length > 0) {
        configuredEmail = listData.users[0].email;
      }
    }

    if (!configuredEmail) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Authenticate with Supabase Auth using mapped email and supplied password
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: configuredEmail,
      password: password,
    });

    if (error || !data || !data.session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: data.session.access_token,
      expiresAt: data.session.expires_at,
      user: {
        id: data.user.id,
        username: configuredUsername,
        email: data.user.email,
        role: 'Administrator',
      },
    });
  } catch (err) {
    console.error('Login Controller Error:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Verify current session and return admin profile
 * @access  Private (Admin only)
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      username: req.admin.username,
      email: req.admin.email,
      role: 'Administrator',
    },
  });
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Private
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  login,
  getMe,
  logout,
};
