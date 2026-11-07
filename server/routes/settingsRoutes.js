const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

// GET /api/settings - Retrieve saved settings
router.get('/', getSettings);

// PUT /api/settings - Update and persist settings
router.put('/', updateSettings);

module.exports = router;

