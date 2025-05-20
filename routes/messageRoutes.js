const express = require('express');
const router = express.Router();
const { uploadMessage } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');

const {
  addMessage,
  getMessagesForLeader,
  getMyMessages,
  replyToMessage
} = require('../controllers/messageController');

// ✅ Post a new message
router.post('/', authenticateToken, uploadMessage.single('attachment'), addMessage);

// ✅ Get messages for leaders (dashboard)
router.get('/for-leader', authenticateToken, getMessagesForLeader);

// ✅ Get messages sent by current resident
router.get('/my', authenticateToken, getMyMessages);

// ✅ Post a reply (leaders only)
router.post('/reply/:messageId', authenticateToken, replyToMessage);

// ✅ Delete a message (allowed for leaders)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (!['cell_leader', 'isibo_leader', 'security_leader'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Message not found' });

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('❌ Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
