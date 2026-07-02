const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificationController');

const applyToJob = async (req, res) => {
  const { jobId } = req.params;
  const { resume_url } = req.body;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can apply' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Create your candidate profile first' });

    const job = await pool.query(
      'SELECT id FROM job_postings WHERE id = $1 AND status = $2',
      [jobId, 'active']
    );
    if (job.rows.length === 0) return res.status(404).json({ error: 'Job not found or closed' });

    const existing = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
      [jobId, candidate.rows[0].id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'You have already applied to this job' });

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO applications (id, job_id, candidate_id, status, resume_url)
       VALUES ($1,$2,$3,'applied',$4) RETURNING *`,
      [id, jobId, candidate.rows[0].id, resume_url]
    );
    const jobDetails = await pool.query(
    `SELECT jp.title, cp.user_id 
    FROM job_postings jp
    JOIN company_profiles cp ON cp.id = jp.company_id
    WHERE jp.id = $1`,
    [jobId]
    );
    if (jobDetails.rows.length > 0) {
    await createNotification(
        jobDetails.rows[0].user_id,
        'new_application',
        'New Application Received',
        `Someone applied to your job: ${jobDetails.rows[0].title}`,
        'application',
        result.rows[0].id
    );
    }
    res.status(201).json({ message: 'Application submitted successfully', application: result.rows[0] });
  } catch (error) {
    console.error('Apply to job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      `SELECT a.*, jp.title, jp.location, jp.job_type, jp.work_mode,
              cp.company_name, cp.logo_url
       FROM applications a
       JOIN job_postings jp ON jp.id = a.job_id
       JOIN company_profiles cp ON cp.id = jp.company_id
       WHERE a.candidate_id = $1
       ORDER BY a.applied_at DESC`,
      [candidate.rows[0].id]
    );
    res.status(200).json({ applications: result.rows });
  } catch (error) {
    console.error('Get my applications error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getJobApplicants = async (req, res) => {
  const { jobId } = req.params;
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

    const result = await pool.query(
      `SELECT a.*, cp.full_name, cp.headline, cp.location, cp.resume_url,
              cp.total_experience_yrs, u.email
       FROM applications a
       JOIN candidate_profiles cp ON cp.id = a.candidate_id
       JOIN users u ON u.id = cp.user_id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [jobId]
    );
    res.status(200).json({ applicants: result.rows });
  } catch (error) {
    console.error('Get job applicants error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      `UPDATE applications SET status = $1
       WHERE id = $2
       AND job_id IN (SELECT id FROM job_postings WHERE company_id = $3)
       RETURNING *`,
      [status, id, company.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    res.status(200).json({ message: 'Application status updated', application: result.rows[0] });
  } catch (error) {
    console.error('Update application status error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { applyToJob, getMyApplications, getJobApplicants, updateApplicationStatus };