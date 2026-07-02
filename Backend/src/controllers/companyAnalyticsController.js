const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const analytics = await pool.query(
      `SELECT
        COUNT(DISTINCT jp.id) AS total_jobs_posted,
        COUNT(DISTINCT a.id) AS total_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) AS shortlisted_count,
        COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END) AS hired_count
       FROM company_profiles cp
       LEFT JOIN job_postings jp ON jp.company_id = cp.id
       LEFT JOIN applications a ON a.job_id = jp.id
       WHERE cp.id = $1`,
      [company.rows[0].id]
    );

    res.status(200).json({ analytics: analytics.rows[0] });
  } catch (error) {
    console.error('Get analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAnalytics };