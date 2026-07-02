const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { saveJob, getSavedJobs, unsaveJob } = require('../controllers/savedJobsController');

router.post('/:jobId', protect, saveJob);
router.get('/', protect, getSavedJobs);
router.delete('/:jobId', protect, unsaveJob);

module.exports = router;