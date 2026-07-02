const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getProfile, createProfile, updateProfile } = require('../controllers/companyController');

router.get('/profile', protect, getProfile);
router.post('/profile', protect, createProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;