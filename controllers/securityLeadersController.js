const pool = require('../config/db');

// ✅ GET Security Leader
exports.getSecurityLeader = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.full_name, r.national_id, r.phone_number, r.email, r.house, r.isibo, r.resident_type
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
};

// ✅ ADD Security Leader
exports.addSecurityLeader = async (req, res) => {
  try {
    const { full_name, national_id, phone, email, house, isibo, resident_type } = req.body;

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
};

// ✅ UPDATE Security Leader
exports.updateSecurityLeader = async (req, res) => {
  try {
    const { national_id } = req.params;
    const { full_name, phone, email, house, isibo, resident_type } = req.body;

    const result = await pool.query(`
      UPDATE security_leader
      SET full_name = $1, phone = $2, email = $3
      WHERE national_id = $4
      RETURNING *
    `, [full_name, phone, email, national_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Security leader not found' });
    }

    await pool.query(`
      UPDATE residents
      SET full_name = $1, phone_number = $2, email = $3, house = $4, isibo = $5, resident_type = $6
      WHERE national_id = $7
    `, [full_name, phone, email, house, isibo, resident_type, national_id]);

    res.json({ message: 'Security leader updated', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating security leader:', err);
    res.status(500).json({ error: 'Failed to update security leader' });
  }
};

// ✅ DELETE Security Leader
exports.deleteSecurityLeader = async (req, res) => {
  try {
    const { national_id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM security_leader WHERE national_id = $1', [national_id]);

    if (rowCount === 0) return res.status(404).json({ error: 'Security leader not found' });

    res.json({ message: 'Security leader deleted' });
  } catch (err) {
    console.error('❌ Error deleting security leader:', err);
    res.status(500).json({ error: 'Failed to delete security leader' });
  }
};
 
