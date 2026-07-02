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

module.exports = { getProfile, createProfile, updateProfile };