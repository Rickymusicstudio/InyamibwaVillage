const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Add new Irondo team member
router.post('/', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  const { full_name, phone, shift_type } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO irondo_team (full_name, phone, shift_type)
       VALUES ($1, $2, $3) RETURNING *`,
      [full_name, phone, shift_type]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ ADD IRONDO TEAM ERROR:', err);
    res.status(500).json({ error: 'Failed to add Irondo member' });
  }
});

// Get all Irondo team members
router.get('/', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM irondo_team ORDER BY joined_date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET IRONDO TEAM ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

module.exports = router;
