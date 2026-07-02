const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const viewCandidate = async (req, res) => {
  const { candidateId } = req.params;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const candidate = await pool.query(
      `SELECT cp.*, u.email FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.id = $1`,
      [candidateId]
    );
    if (candidate.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

    const existing = await pool.query(
      'SELECT id FROM candidate_database_access WHERE company_id = $1 AND candidate_id = $2',
      [company.rows[0].id, candidateId]
    );

    if (existing.rows.length === 0) {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO candidate_database_access (id, company_id, candidate_id) VALUES ($1,$2,$3)',
        [id, company.rows[0].id, candidateId]
      );
    } else {
      await pool.query(
        'UPDATE candidate_database_access SET viewed_at = CURRENT_TIMESTAMP WHERE company_id = $1 AND candidate_id = $2',
        [company.rows[0].id, candidateId]
      );
    }

    res.status(200).json({ candidate: candidate.rows[0] });
  } catch (error) {
    console.error('View candidate error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getViewedCandidates = async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      `SELECT cda.viewed_at, cda.is_shortlisted, cda.notes,
              cp.id, cp.full_name, cp.headline, cp.location,
              cp.total_experience_yrs, cp.resume_url, u.email
       FROM candidate_database_access cda
       JOIN candidate_profiles cp ON cp.id = cda.candidate_id
       JOIN users u ON u.id = cp.user_id
       WHERE cda.company_id = $1
       ORDER BY cda.viewed_at DESC`,
      [company.rows[0].id]
    );
    res.status(200).json({ candidates: result.rows });
  } catch (error) {
    console.error('Get viewed candidates error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const shortlistCandidate = async (req, res) => {
  const { candidateId } = req.params;
  const { is_shortlisted, notes } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      `UPDATE candidate_database_access SET
        is_shortlisted = COALESCE($1, is_shortlisted),
        notes = COALESCE($2, notes)
       WHERE company_id = $3 AND candidate_id = $4 RETURNING *`,
      [is_shortlisted, notes, company.rows[0].id, candidateId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found in your database' });
    res.status(200).json({ message: 'Candidate updated', record: result.rows[0] });
  } catch (error) {
    console.error('Shortlist candidate error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { viewCandidate, getViewedCandidates, shortlistCandidate };