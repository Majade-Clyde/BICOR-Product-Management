const { supabase } = require('../config/supabase');
const { readLocalSettings } = require('../controllers/settingsController');

/**
 * Authentication and Admin Authorization Middleware
 * Protects endpoints and ensures ONLY the configured administrator can access.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing authentication token.',
      });
    }

    // Verify token cryptographically with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid token. Please log in again.',
      });
    }

    // Verify that the user's email matches ADMIN_EMAIL or settings admin email
    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    
    // Read persisted admin email from settings (if updated by admin)
    const localSettings = readLocalSettings();
    const settingsAdminEmail = (localSettings?.admin_email || '').trim().toLowerCase();

    const authorizedEmails = [envAdminEmail, settingsAdminEmail].filter(Boolean);

    // If default placeholder or no email set, check registered admin user
    if (authorizedEmails.length === 0 || authorizedEmails.some(e => e.includes('@example.com'))) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      if (listData?.users && listData.users.length > 0) {
        authorizedEmails.push((listData.users[0].email || '').toLowerCase());
      }
    }

    if (!authorizedEmails.includes(userEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized as an administrator.',
      });
    }

    // Attach authenticated admin to request
    req.user = user;
    req.admin = {
      id: user.id,
      username: process.env.ADMIN_USERNAME || 'Adminclyde',
      email: user.email,
    };

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication server error.',
    });
  }
};

module.exports = {
  requireAuth,
};
