const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cp.*, u.email FROM candidate_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json({ profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createProfile = async (req, res) => {
  const { full_name, headline, location, phone, profile_photo_url, resume_url, linkedin_url, portfolio_url, about_me, total_experience_yrs } = req.body;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });
    const existing = await pool.query('SELECT id FROM candidate_profiles WHERE user_id = $1', [req.user.id]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Profile already exists' });
    if (!full_name) return res.status(400).json({ error: 'full_name is required' });
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO candidate_profiles (id,user_id,full_name,headline,location,phone,profile_photo_url,resume_url,linkedin_url,portfolio_url,about_me,total_experience_yrs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [id, req.user.id, full_name, headline, location, phone, profile_photo_url, resume_url, linkedin_url, portfolio_url, about_me, total_experience_yrs]
    );
    res.status(201).json({ message: 'Profile created', profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { full_name, headline, location, phone, profile_photo_url, resume_url, linkedin_url, portfolio_url, about_me, total_experience_yrs } = req.body;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });
    const existing = await pool.query('SELECT id FROM candidate_profiles WHERE user_id = $1', [req.user.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    const result = await pool.query(
      'UPDATE candidate_profiles SET full_name=COALESCE($1,full_name),headline=COALESCE($2,headline),location=COALESCE($3,location),phone=COALESCE($4,phone),profile_photo_url=COALESCE($5,profile_photo_url),resume_url=COALESCE($6,resume_url),linkedin_url=COALESCE($7,linkedin_url),portfolio_url=COALESCE($8,portfolio_url),about_me=COALESCE($9,about_me),total_experience_yrs=COALESCE($10,total_experience_yrs) WHERE user_id=$11 RETURNING *',
      [full_name, headline, location, phone, profile_photo_url, resume_url, linkedin_url, portfolio_url, about_me, total_experience_yrs, req.user.id]
    );
    res.status(200).json({ message: 'Profile updated', profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


const addExperience = async (req, res) => {
  const { job_title, company_name, employment_type, start_date, end_date, is_current, description } = req.body;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });
    
    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Create your profile first' });
    if (!job_title || !company_name || !start_date) return res.status(400).json({ error: 'job_title, company_name and start_date are required' });

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO candidate_experiences 
        (id, candidate_id, job_title, company_name, employment_type, start_date, end_date, is_current, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, candidate.rows[0].id, job_title, company_name, employment_type, start_date, end_date, is_current, description]
    );
    res.status(201).json({ message: 'Experience added', experience: result.rows[0] });
  } catch (error) {
    console.error('Add experience error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateExperience = async (req, res) => {
  const { id } = req.params;
  const { job_title, company_name, employment_type, start_date, end_date, is_current, description } = req.body;
  try {
    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      `UPDATE candidate_experiences SET
        job_title = COALESCE($1, job_title),
        company_name = COALESCE($2, company_name),
        employment_type = COALESCE($3, employment_type),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date),
        is_current = COALESCE($6, is_current),
        description = COALESCE($7, description)
       WHERE id = $8 AND candidate_id = $9 RETURNING *`,
      [job_title, company_name, employment_type, start_date, end_date, is_current, description, id, candidate.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Experience not found' });
    res.status(200).json({ message: 'Experience updated', experience: result.rows[0] });
  } catch (error) {
    console.error('Update experience error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteExperience = async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      'DELETE FROM candidate_experiences WHERE id = $1 AND candidate_id = $2 RETURNING id',
      [id, candidate.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Experience not found' });
    res.status(200).json({ message: 'Experience deleted' });
  } catch (error) {
    console.error('Delete experience error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const addEducation = async (req, res) => {
  const { institution, degree, field_of_study, cgpa, start_year, end_year } = req.body;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Create your profile first' });
    if (!institution || !degree || !field_of_study || !start_year) return res.status(400).json({ error: 'institution, degree, field_of_study and start_year are required' });

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO candidate_education
        (id, candidate_id, institution, degree, field_of_study, cgpa, start_year, end_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, candidate.rows[0].id, institution, degree, field_of_study, cgpa, start_year, end_year]
    );
    res.status(201).json({ message: 'Education added', education: result.rows[0] });
  } catch (error) {
    console.error('Add education error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateEducation = async (req, res) => {
  const { id } = req.params;
  const { institution, degree, field_of_study, cgpa, start_year, end_year } = req.body;
  try {
    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      `UPDATE candidate_education SET
        institution = COALESCE($1, institution),
        degree = COALESCE($2, degree),
        field_of_study = COALESCE($3, field_of_study),
        cgpa = COALESCE($4, cgpa),
        start_year = COALESCE($5, start_year),
        end_year = COALESCE($6, end_year)
       WHERE id = $7 AND candidate_id = $8 RETURNING *`,
      [institution, degree, field_of_study, cgpa, start_year, end_year, id, candidate.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Education not found' });
    res.status(200).json({ message: 'Education updated', education: result.rows[0] });
  } catch (error) {
    console.error('Update education error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteEducation = async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      'DELETE FROM candidate_education WHERE id = $1 AND candidate_id = $2 RETURNING id',
      [id, candidate.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Education not found' });
    res.status(200).json({ message: 'Education deleted' });
  } catch (error) {
    console.error('Delete education error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { 
  getProfile, 
  createProfile, 
  updateProfile, 
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation };