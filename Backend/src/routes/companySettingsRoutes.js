const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getSettings, upsertSettings } = require('../controllers/companySettingsController');

router.get('/', protect, getSettings);
router.post('/', protect, upsertSettings);

module.exports = router;