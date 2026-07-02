const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.status(200).json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (error) {
    console.error('Mark as read error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const createNotification = async (user_id, type, title, message, reference_type = null, reference_id = null) => {
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, user_id, type, title, message, reference_type, reference_id]
    );
  } catch (error) {
    console.error('Create notification error:', error.message);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};