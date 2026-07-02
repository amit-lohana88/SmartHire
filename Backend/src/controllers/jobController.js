const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createJob = async (req, res) => {
  const { title, job_type, location, work_mode, experience_level, salary_min, salary_max, description, benefits } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can post jobs' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Create your company profile first' });

    if (!title || !job_type || !location || !work_mode || !experience_level || !description) {
      return res.status(400).json({ error: 'title, job_type, location, work_mode, experience_level and description are required' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO job_postings
        (id, company_id, title, job_type, location, work_mode, experience_level, salary_min, salary_max, description, benefits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, company.rows[0].id, title, job_type, location, work_mode, experience_level, salary_min, salary_max, description, benefits]
    );
    res.status(201).json({ message: 'Job posted successfully', job: result.rows[0] });
  } catch (error) {
    console.error('Create job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const { location, job_type, work_mode, experience_level } = req.query;

    let query = `
      SELECT jp.*, cp.company_name, cp.logo_url, cp.hq_location
      FROM job_postings jp
      JOIN company_profiles cp ON cp.id = jp.company_id
      WHERE jp.status = 'active'
    `;
    const values = [];
    let count = 1;

    if (location) {
      query += ` AND jp.location ILIKE $${count}`;
      values.push(`%${location}%`);
      count++;
    }
    if (job_type) {
      query += ` AND jp.job_type = $${count}`;
      values.push(job_type);
      count++;
    }
    if (work_mode) {
      query += ` AND jp.work_mode = $${count}`;
      values.push(work_mode);
      count++;
    }
    if (experience_level) {
      query += ` AND jp.experience_level = $${count}`;
      values.push(experience_level);
      count++;
    }

    query += ' ORDER BY jp.posted_at DESC';

    const result = await pool.query(query, values);
    res.status(200).json({ jobs: result.rows });
  } catch (error) {
    console.error('Get all jobs error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getJobById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT jp.*, cp.company_name, cp.logo_url, cp.hq_location, cp.about
       FROM job_postings jp
       JOIN company_profiles cp ON cp.id = jp.company_id
       WHERE jp.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ job: result.rows[0] });
  } catch (error) {
    console.error('Get job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, job_type, location, work_mode, experience_level, salary_min, salary_max, description, benefits, status } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can update jobs' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      `UPDATE job_postings SET
        title = COALESCE($1, title),
        job_type = COALESCE($2, job_type),
        location = COALESCE($3, location),
        work_mode = COALESCE($4, work_mode),
        experience_level = COALESCE($5, experience_level),
        salary_min = COALESCE($6, salary_min),
        salary_max = COALESCE($7, salary_max),
        description = COALESCE($8, description),
        benefits = COALESCE($9, benefits),
        status = COALESCE($10, status)
       WHERE id = $11 AND company_id = $12 RETURNING *`,
      [title, job_type, location, work_mode, experience_level, salary_min, salary_max, description, benefits, status, id, company.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job updated successfully', job: result.rows[0] });
  } catch (error) {
    console.error('Update job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can delete jobs' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      'DELETE FROM job_postings WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, company.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyJobs = async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      'SELECT * FROM job_postings WHERE company_id = $1 ORDER BY posted_at DESC',
      [company.rows[0].id]
    );
    res.status(200).json({ jobs: result.rows });
  } catch (error) {
    console.error('Get my jobs error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createJob, getAllJobs, getJobById, updateJob, deleteJob, getMyJobs };