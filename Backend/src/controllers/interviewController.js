const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const scheduleInterview = async (req, res) => {
  const { application_id, scheduled_at, duration_mins, interview_type, meeting_link } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    if (!application_id || !scheduled_at || !duration_mins || !interview_type) {
      return res.status(400).json({ error: 'application_id, scheduled_at, duration_mins and interview_type are required' });
    }

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const application = await pool.query(
      `SELECT a.id FROM applications a
       JOIN job_postings jp ON jp.id = a.job_id
       WHERE a.id = $1 AND jp.company_id = $2`,
      [application_id, company.rows[0].id]
    );
    if (application.rows.length === 0) return res.status(404).json({ error: 'Application not found' });

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO interviews
        (id, application_id, scheduled_at, duration_mins, interview_type, meeting_link, status)
       VALUES ($1,$2,$3,$4,$5,$6,'scheduled') RETURNING *`,
      [id, application_id, scheduled_at, duration_mins, interview_type, meeting_link]
    );
    res.status(201).json({ message: 'Interview scheduled', interview: result.rows[0] });
  } catch (error) {
    console.error('Schedule interview error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getInterviews = async (req, res) => {
  const { applicationId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM interviews WHERE application_id = $1 ORDER BY scheduled_at ASC',
      [applicationId]
    );
    res.status(200).json({ interviews: result.rows });
  } catch (error) {
    console.error('Get interviews error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateInterview = async (req, res) => {
  const { id } = req.params;
  const { scheduled_at, duration_mins, interview_type, meeting_link, status, feedback } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const result = await pool.query(
      `UPDATE interviews SET
        scheduled_at = COALESCE($1, scheduled_at),
        duration_mins = COALESCE($2, duration_mins),
        interview_type = COALESCE($3, interview_type),
        meeting_link = COALESCE($4, meeting_link),
        status = COALESCE($5, status),
        feedback = COALESCE($6, feedback)
       WHERE id = $7 RETURNING *`,
      [scheduled_at, duration_mins, interview_type, meeting_link, status, feedback, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
    res.status(200).json({ message: 'Interview updated', interview: result.rows[0] });
  } catch (error) {
    console.error('Update interview error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteInterview = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const result = await pool.query(
      'DELETE FROM interviews WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
    res.status(200).json({ message: 'Interview deleted' });
  } catch (error) {
    console.error('Delete interview error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { scheduleInterview, getInterviews, updateInterview, deleteInterview };