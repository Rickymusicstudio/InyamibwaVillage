const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  addThought,
  getThoughts,
  deleteThought,
  addComment,
  getComments,
  getUpdates // ✅ new route
} = require('../controllers/thoughtsController');

// ➕ Post a new thought or update (admin or leader)
router.post('/', authenticateToken, addThought);

// 📥 Get all general thoughts
router.get('/', authenticateToken, getThoughts);

// 📢 Get only 'update' category posts
router.get('/updates', authenticateToken, getUpdates);

// ❌ Delete a thought (admin only)
router.delete('/:id', authenticateToken, deleteThought);

// 💬 Add a comment
router.post('/:id/comments', authenticateToken, addComment);

// 💬 Get comments for a thought
router.get('/:id/comments', authenticateToken, getComments);

module.exports = router;
