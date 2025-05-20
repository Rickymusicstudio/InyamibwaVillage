const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST: Create a cell update
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { message } = req.body;

  try {
    const { rows } = await pool.query(
      'INSERT INTO cell_updates (message) VALUES ($1) RETURNING *',
      [message]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ CELL UPDATE POST ERROR:', err);
    res.status(500).json({ error: 'Failed to post cell update' });
  }
});

// GET: Fetch all cell updates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cell_updates ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET CELL UPDATES ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch cell updates' });
  }
});

module.exports = router;
