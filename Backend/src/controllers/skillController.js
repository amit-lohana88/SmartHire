const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getAllSkills = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM skills ORDER BY category, name'
    );
    res.status(200).json({ skills: result.rows });
  } catch (error) {
    console.error('Get skills error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const addSkill = async (req, res) => {
  const { name, category } = req.body;
  try {
    if (!name) return res.status(400).json({ error: 'Skill name is required' });

    const existing = await pool.query(
      'SELECT id FROM skills WHERE name ILIKE $1',
      [name]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Skill already exists' });

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO skills (id, name, category) VALUES ($1, $2, $3) RETURNING *',
      [id, name, category]
    );
    res.status(201).json({ message: 'Skill added', skill: result.rows[0] });
  } catch (error) {
    console.error('Add skill error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const addCandidateSkill = async (req, res) => {
  const { skill_id, proficiency_level } = req.body;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Create your profile first' });

    if (!skill_id || !proficiency_level) return res.status(400).json({ error: 'skill_id and proficiency_level are required' });

    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validLevels.includes(proficiency_level)) return res.status(400).json({ error: 'Invalid proficiency level' });

    const skill = await pool.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skill.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });

    const existing = await pool.query(
      'SELECT * FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2',
      [candidate.rows[0].id, skill_id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Skill already added to your profile' });

    const result = await pool.query(
      'INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level) VALUES ($1, $2, $3) RETURNING *',
      [candidate.rows[0].id, skill_id, proficiency_level]
    );
    res.status(201).json({ message: 'Skill added to profile', candidate_skill: result.rows[0] });
  } catch (error) {
    console.error('Add candidate skill error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getCandidateSkills = async (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      `SELECT cs.proficiency_level, s.id, s.name, s.category
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = $1
       ORDER BY s.category, s.name`,
      [candidate.rows[0].id]
    );
    res.status(200).json({ skills: result.rows });
  } catch (error) {
    console.error('Get candidate skills error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeCandidateSkill = async (req, res) => {
  const { skillId } = req.params;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      'DELETE FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2 RETURNING *',
      [candidate.rows[0].id, skillId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Skill not found in your profile' });
    res.status(200).json({ message: 'Skill removed from profile' });
  } catch (error) {
    console.error('Remove candidate skill error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const addJobSkill = async (req, res) => {
  const { jobId } = req.params;
  const { skill_id, is_mandatory } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const job = await pool.query(
      'SELECT id FROM job_postings WHERE id = $1 AND company_id = $2',
      [jobId, company.rows[0].id]
    );
    if (job.rows.length === 0) return res.status(404).json({ error: 'Job not found' });

    if (!skill_id) return res.status(400).json({ error: 'skill_id is required' });

    const skill = await pool.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skill.rows.length === 0) return res.status(404).json({ error: 'Skill not found' });

    const existing = await pool.query(
      'SELECT * FROM job_required_skills WHERE job_id = $1 AND skill_id = $2',
      [jobId, skill_id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Skill already added to this job' });

    const result = await pool.query(
      'INSERT INTO job_required_skills (job_id, skill_id, is_mandatory) VALUES ($1, $2, $3) RETURNING *',
      [jobId, skill_id, is_mandatory ?? true]
    );
    res.status(201).json({ message: 'Skill added to job', job_skill: result.rows[0] });
  } catch (error) {
    console.error('Add job skill error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getJobSkills = async (req, res) => {
  const { jobId } = req.params;
  try {
    const result = await pool.query(
      `SELECT jrs.is_mandatory, s.id, s.name, s.category
       FROM job_required_skills jrs
       JOIN skills s ON s.id = jrs.skill_id
       WHERE jrs.job_id = $1`,
      [jobId]
    );
    res.status(200).json({ skills: result.rows });
  } catch (error) {
    console.error('Get job skills error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeJobSkill = async (req, res) => {
  const { jobId, skillId } = req.params;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      `DELETE FROM job_required_skills 
       WHERE job_id = $1 AND skill_id = $2
       AND job_id IN (SELECT id FROM job_postings WHERE company_id = $3)
       RETURNING *`,
      [jobId, skillId, company.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Skill not found for this job' });
    res.status(200).json({ message: 'Skill removed from job' });
  } catch (error) {
    console.error('Remove job skill error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllSkills,
  addSkill,
  addCandidateSkill,
  getCandidateSkills,
  removeCandidateSkill,
  addJobSkill,
  getJobSkills,
  removeJobSkill
};