const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { scheduleInterview, getInterviews, updateInterview, deleteInterview } = require('../controllers/interviewController');

router.post('/', protect, scheduleInterview);
router.get('/:applicationId', protect, getInterviews);
router.put('/:id', protect, updateInterview);
router.delete('/:id', protect, deleteInterview);

module.exports = router;