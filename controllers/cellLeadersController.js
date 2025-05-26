const pool = require('../config/db');

// ✅ GET Cell Leader
exports.getCellLeader = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.full_name, r.national_id, r.phone_number, r.email, r.house, r.isibo, r.resident_type
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
};

// ✅ ADD Cell Leader
exports.addCellLeader = async (req, res) => {
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
};

// ✅ DELETE Cell Leader (removes associated resident too)
exports.deleteCellLeader = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cell_leader');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No cell leader to delete' });
    }

    const nationalIdToDelete = rows[0].national_id;

    await pool.query('DELETE FROM cell_leader WHERE national_id = $1', [nationalIdToDelete]);
    await pool.query('DELETE FROM residents WHERE national_id = $1', [nationalIdToDelete]);

    res.json({ message: 'Cell leader and associated resident deleted' });
  } catch (err) {
    console.error('❌ Error deleting cell leader:', err);
    res.status(500).json({ error: 'Failed to delete cell leader' });
  }
};
 
