const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createJob, getAllJobs, getJobById, updateJob, deleteJob, getMyJobs } = require('../controllers/jobController');

// ─── Public Routes ─────────────────────────────────────────
router.get('/', getAllJobs);
router.get('/company/myjobs', protect, getMyJobs);
router.get('/:id', getJobById);

// ─── Protected Routes (Company only) ──────────────────────
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;