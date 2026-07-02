const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { 
  getProfile, 
  createProfile,
  updateProfile, 
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation
} = require('../controllers/candidateController');

router.get('/profile', protect, getProfile);
router.post('/profile', protect, createProfile);
router.put('/profile', protect, updateProfile);

router.post('/experience', protect, addExperience);
router.put('/experience/:id', protect, updateExperience);
router.delete('/experience/:id', protect, deleteExperience);

router.post('/education', protect, addEducation);
router.put('/education/:id', protect, updateEducation);
router.delete('/education/:id', protect, deleteEducation);

module.exports = router;