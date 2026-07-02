const pool = require('../config/db');

const saveJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can save jobs' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Create your candidate profile first' });

    const job = await pool.query(
      'SELECT id FROM job_postings WHERE id = $1',
      [jobId]
    );
    if (job.rows.length === 0) return res.status(404).json({ error: 'Job not found' });

    const existing = await pool.query(
      'SELECT * FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2',
      [candidate.rows[0].id, jobId]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Job already saved' });

    await pool.query(
      'INSERT INTO saved_jobs (candidate_id, job_id) VALUES ($1, $2)',
      [candidate.rows[0].id, jobId]
    );
    res.status(201).json({ message: 'Job saved successfully' });
  } catch (error) {
    console.error('Save job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      `SELECT jp.*, cp.company_name, cp.logo_url, sj.saved_at
       FROM saved_jobs sj
       JOIN job_postings jp ON jp.id = sj.job_id
       JOIN company_profiles cp ON cp.id = jp.company_id
       WHERE sj.candidate_id = $1
       ORDER BY sj.saved_at DESC`,
      [candidate.rows[0].id]
    );
    res.status(200).json({ saved_jobs: result.rows });
  } catch (error) {
    console.error('Get saved jobs error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const unsaveJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    if (req.user.role !== 'candidate') return res.status(403).json({ error: 'Only candidates allowed' });

    const candidate = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const result = await pool.query(
      'DELETE FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2 RETURNING *',
      [candidate.rows[0].id, jobId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Saved job not found' });
    res.status(200).json({ message: 'Job removed from saved list' });
  } catch (error) {
    console.error('Unsave job error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { saveJob, getSavedJobs, unsaveJob };