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

    const companyId = company.rows[0].id;

    const overview = await pool.query(
      `SELECT
        COUNT(DISTINCT jp.id) AS total_jobs_posted,
        COUNT(DISTINCT a.id) AS total_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) AS shortlisted_count,
        COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END) AS hired_count,
        COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) AS rejected_count,
        COUNT(DISTINCT CASE WHEN a.status = 'interview_scheduled' THEN a.id END) AS interview_count,
        COUNT(DISTINCT CASE WHEN jp.status = 'active' THEN jp.id END) AS active_jobs
       FROM company_profiles cp
       LEFT JOIN job_postings jp ON jp.company_id = cp.id
       LEFT JOIN applications a ON a.job_id = jp.id
       WHERE cp.id = $1`,
      [companyId]
    );

    const applicationsPerJob = await pool.query(
      `SELECT jp.title, jp.status, COUNT(a.id) AS application_count
       FROM job_postings jp
       LEFT JOIN applications a ON a.job_id = jp.id
       WHERE jp.company_id = $1
       GROUP BY jp.id, jp.title, jp.status
       ORDER BY application_count DESC`,
      [companyId]
    );

    const statusBreakdown = await pool.query(
      `SELECT a.status, COUNT(*) AS count
       FROM applications a
       JOIN job_postings jp ON jp.id = a.job_id
       WHERE jp.company_id = $1
       GROUP BY a.status`,
      [companyId]
    );

    const recentApplications = await pool.query(
      `SELECT a.status, a.applied_at, cp.full_name, jp.title
       FROM applications a
       JOIN candidate_profiles cp ON cp.id = a.candidate_id
       JOIN job_postings jp ON jp.id = a.job_id
       WHERE jp.company_id = $1
       ORDER BY a.applied_at DESC
       LIMIT 5`,
      [companyId]
    );

    res.status(200).json({
      analytics: {
        overview: overview.rows[0],
        applications_per_job: applicationsPerJob.rows,
        status_breakdown: statusBreakdown.rows,
        recent_applications: recentApplications.rows
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAnalytics };