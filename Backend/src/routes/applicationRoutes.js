const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus
} = require('../controllers/applicationController');

// Candidate routes
router.post('/:jobId', protect, applyToJob);
router.get('/my', protect, getMyApplications);

// Company routes
router.get('/job/:jobId', protect, getJobApplicants);
router.put('/:id/status', protect, updateApplicationStatus);

module.exports = router;