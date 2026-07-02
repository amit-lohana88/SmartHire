const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { viewCandidate, getViewedCandidates, shortlistCandidate } = require('../controllers/candidateDatabaseController');

router.get('/', protect, getViewedCandidates);
router.get('/:candidateId', protect, viewCandidate);
router.put('/:candidateId', protect, shortlistCandidate);

module.exports = router;