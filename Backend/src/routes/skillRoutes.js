const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getAllSkills,
  addSkill,
  addCandidateSkill,
  getCandidateSkills,
  removeCandidateSkill,
  addJobSkill,
  getJobSkills,
  removeJobSkill
} = require('../controllers/skillController');

router.get('/', getAllSkills);
router.post('/', protect, addSkill);

router.get('/candidate', protect, getCandidateSkills);
router.post('/candidate', protect, addCandidateSkill);
router.delete('/candidate/:skillId', protect, removeCandidateSkill);

router.get('/job/:jobId', getJobSkills);
router.post('/job/:jobId', protect, addJobSkill);
router.delete('/job/:jobId/:skillId', protect, removeJobSkill);

module.exports = router;