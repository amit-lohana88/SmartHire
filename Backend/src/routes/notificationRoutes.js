const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;