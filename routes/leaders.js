const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ✅ Removed broken: getCellStats + /cell-stats route

// ✅ GET Isibo Leaders
router.get('/isibo', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.full_name,
        r.national_id,
        r.phone_number,
        r.email,
        r.house,
        r.isibo,
        r.resident_type
      FROM isibo_leaders l
      JOIN residents r ON r.national_id = l.national_id
      ORDER BY r.full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching isibo leaders:', err);
    res.status(500).json({ error: 'Failed to fetch isibo leaders' });
  }
});

// ✅ POST Isibo Leader
router.post('/isibo', authenticateToken, async (req, res) => {
  try {
    const {
      full_name, national_id, phone, email,
      house, isibo, resident_type
    } = req.body;

    await pool.query(`
      INSERT INTO isibo_leaders (full_name, national_id, phone, email, house, isibo, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [full_name, national_id, phone, email, house, isibo, resident_type]);

    await pool.query(`
      INSERT INTO residents (full_name, national_id, phone_number, email, house, isibo, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (national_id) DO NOTHING
    `, [full_name, national_id, phone, email, house, isibo, resident_type]);

    res.status(201).json({ message: 'Isibo leader created' });
  } catch (err) {
    console.error('❌ Error adding isibo leader:', err);
    res.status(500).json({ error: 'Failed to add isibo leader' });
  }
});

// ✅ GET Cell Leader
router.get('/cell', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.full_name,
        r.national_id,
        r.phone_number,
        r.email,
        r.house,
        r.isibo,
        r.resident_type
      FROM cell_leader l
      JOIN residents r ON r.national_id = l.national_id
      ORDER BY r.id DESC
      LIMIT 1
    `);
    if (!rows.length) return res.status(404).json({ error: 'Cell leader not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching cell leader:', err);
    res.status(500).json({ error: 'Failed to fetch cell leader' });
  }
});

// ✅ POST Cell Leader
router.post('/cell', authenticateToken, async (req, res) => {
  try {
    const { full_name, national_id, phone_number, email, house, isibo, resident_type } = req.body;

    const existing = await pool.query('SELECT * FROM cell_leader WHERE national_id = $1', [national_id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Cell leader already exists' });
    }

    await pool.query(`
      INSERT INTO cell_leader (full_name, national_id, phone_number, email)
      VALUES ($1, $2, $3, $4)
    `, [full_name, national_id, phone_number, email]);

    await pool.query(`
      INSERT INTO residents (full_name, national_id, phone_number, email, house, isibo, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (national_id) DO NOTHING
    `, [full_name, national_id, phone_number, email, house, isibo, resident_type]);

    res.status(201).json({ message: 'Cell leader created' });
  } catch (err) {
    console.error('❌ Error adding cell leader:', err);
    res.status(500).json({ error: 'Failed to add cell leader' });
  }
});

// ✅ GET Security Leader
router.get('/security', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.full_name,
        r.national_id,
        r.phone_number,
        r.email,
        r.house,
        r.isibo,
        r.resident_type
      FROM security_leader l
      JOIN residents r ON r.national_id = l.national_id
      ORDER BY r.id DESC
      LIMIT 1
    `);
    if (!rows.length) return res.status(404).json({ error: 'Security leader not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching security leader:', err);
    res.status(500).json({ error: 'Failed to fetch security leader' });
  }
});

// ✅ POST Security Leader
router.post('/security', authenticateToken, async (req, res) => {
  try {
    const {
      full_name, national_id, phone, email,
      house, isibo, resident_type
    } = req.body;

    const existing = await pool.query('SELECT * FROM security_leader WHERE national_id = $1', [national_id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Security leader already exists' });
    }

    await pool.query(`
      INSERT INTO security_leader (full_name, national_id, phone, email)
      VALUES ($1, $2, $3, $4)
    `, [full_name, national_id, phone, email]);

    await pool.query(`
      INSERT INTO residents (full_name, national_id, phone_number, email, house, isibo, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (national_id) DO NOTHING
    `, [full_name, national_id, phone, email, house, isibo, resident_type]);

    res.status(201).json({ message: 'Security leader created' });
  } catch (err) {
    console.error('❌ Error adding security leader:', err);
    res.status(500).json({ error: 'Failed to add security leader' });
  }
});

// ✅ GET All Leaders (aggregated)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT full_name, national_id, phone_number, email, 'cell_leader' AS role
      FROM cell_leader
      UNION
      SELECT full_name, national_id, phone AS phone_number, email, 'isibo_leader' AS role
      FROM isibo_leaders
      UNION
      SELECT full_name, national_id, phone AS phone_number, email, 'security_leader' AS role
      FROM security_leader
      ORDER BY full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching all leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch all leaders' });
  }
});

// ✅ Test route
router.get('/test', (req, res) => {
  res.send('Leaders route is working ✅');
});

router.delete('/isibo/:national_id', authenticateToken, async (req, res) => {
  try {
    const { national_id } = req.params;

    // Optional: Check if leader exists
    const existing = await pool.query('SELECT * FROM isibo_leaders WHERE national_id = $1', [national_id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Isibo leader not found' });
    }

    await pool.query('DELETE FROM isibo_leaders WHERE national_id = $1', [national_id]);

    res.json({ message: 'Isibo leader deleted' });
  } catch (err) {
    console.error('❌ Error deleting isibo leader:', err);
    res.status(500).json({ error: 'Failed to delete isibo leader' });
  }
});

module.exports = router;
