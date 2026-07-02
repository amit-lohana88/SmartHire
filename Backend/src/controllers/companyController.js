const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');


const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cp.*, u.email 
       FROM company_profiles cp 
       JOIN users u ON u.id = cp.user_id 
       WHERE cp.user_id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });
    res.status(200).json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Get company profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};


const createProfile = async (req, res) => {
  const { company_name, logo_url, website, industry, size_range, founded_year, hq_location, about, culture_description, company_email, company_phone } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const existing = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Profile already exists. Use PUT to update.' });

    if (!company_name) return res.status(400).json({ error: 'company_name is required' });

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO company_profiles 
        (id, user_id, company_name, logo_url, website, industry, size_range, founded_year, hq_location, about, culture_description, company_email, company_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, req.user.id, company_name, logo_url, website, industry, size_range, founded_year, hq_location, about, culture_description, company_email, company_phone]
    );
    res.status(201).json({ message: 'Company profile created', profile: result.rows[0] });
  } catch (error) {
    console.error('Create company profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};


const updateProfile = async (req, res) => {
  const { company_name, logo_url, website, industry, size_range, founded_year, hq_location, about, culture_description, company_email, company_phone } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const existing = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Profile not found. Create one first.' });

    const result = await pool.query(
      `UPDATE company_profiles SET
        company_name = COALESCE($1, company_name),
        logo_url = COALESCE($2, logo_url),
        website = COALESCE($3, website),
        industry = COALESCE($4, industry),
        size_range = COALESCE($5, size_range),
        founded_year = COALESCE($6, founded_year),
        hq_location = COALESCE($7, hq_location),
        about = COALESCE($8, about),
        culture_description = COALESCE($9, culture_description),
        company_email = COALESCE($10, company_email),
        company_phone = COALESCE($11, company_phone)
       WHERE user_id = $12 RETURNING *`,
      [company_name, logo_url, website, industry, size_range, founded_year, hq_location, about, culture_description, company_email, company_phone, req.user.id]
    );
    res.status(200).json({ message: 'Company profile updated', profile: result.rows[0] });
  } catch (error) {
    console.error('Update company profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProfile, createProfile, updateProfile };