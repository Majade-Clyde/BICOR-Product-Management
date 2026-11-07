const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public login route
router.post('/login', login);

// Protected routes
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

module.exports = router;

