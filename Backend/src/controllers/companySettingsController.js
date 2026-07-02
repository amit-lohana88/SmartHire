const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getSettings = async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const result = await pool.query(
      'SELECT * FROM company_settings WHERE company_id = $1',
      [company.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        settings: {
          notification_email: true,
          notification_sms: false,
          auto_shortlist: false,
          privacy_level: 'public',
          application_policy: null
        }
      });
    }

    res.status(200).json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const upsertSettings = async (req, res) => {
  const { notification_email, notification_sms, auto_shortlist, privacy_level, application_policy } = req.body;
  try {
    if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies allowed' });

    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company profile not found' });

    const existing = await pool.query(
      'SELECT id FROM company_settings WHERE company_id = $1',
      [company.rows[0].id]
    );

    let result;
    if (existing.rows.length === 0) {
      const id = uuidv4();
      result = await pool.query(
        `INSERT INTO company_settings
          (id, company_id, notification_email, notification_sms, auto_shortlist, privacy_level, application_policy)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id, company.rows[0].id, notification_email ?? true, notification_sms ?? false,
         auto_shortlist ?? false, privacy_level ?? 'public', application_policy]
      );
    } else {
      result = await pool.query(
        `UPDATE company_settings SET
          notification_email = COALESCE($1, notification_email),
          notification_sms = COALESCE($2, notification_sms),
          auto_shortlist = COALESCE($3, auto_shortlist),
          privacy_level = COALESCE($4, privacy_level),
          application_policy = COALESCE($5, application_policy)
         WHERE company_id = $6 RETURNING *`,
        [notification_email, notification_sms, auto_shortlist,
         privacy_level, application_policy, company.rows[0].id]
      );
    }
    res.status(200).json({ message: 'Settings saved', settings: result.rows[0] });
  } catch (error) {
    console.error('Upsert settings error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getSettings, upsertSettings };