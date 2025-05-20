const pool = require('../config/db');

// ➕ Add Irondo member
exports.addIrondoMember = async (req, res) => {
  const { full_name, phone, national_id, shift } = req.body;
  const role = req.user.role;
  const userId = req.user.id;

  if (!['admin', 'security'].includes(role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!full_name || !shift) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO irondo_members (full_name, phone, national_id, shift, status, added_by)
       VALUES ($1, $2, $3, $4, 'active', $5) RETURNING *`,
      [full_name, phone || null, national_id || null, shift, userId]
    );

    res.status(201).json({ message: 'Irondo member added', data: result.rows[0] });
  } catch (err) {
    console.error('❌ addIrondoMember error:', err);
    res.status(500).json({ error: 'Server error while adding member' });
  }
};

// 📥 Get all Irondo members
exports.getIrondoMembers = async (req, res) => {
  if (!['admin', 'security'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, phone, national_id, shift, status, created_at
       FROM irondo_members
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ getIrondoMembers error:', err);
    res.status(500).json({ error: 'Failed to fetch Irondo members' });
  }
};

// ✏️ Update shift
exports.updateIrondoShift = async (req, res) => {
  if (!['admin', 'security'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const { shift } = req.body;

  if (!shift) {
    return res.status(400).json({ error: 'Shift is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE irondo_members SET shift = $1 WHERE id = $2 RETURNING id, full_name, shift`,
      [shift, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Irondo member not found' });
    }

    res.json({ message: 'Shift updated', data: result.rows[0] });
  } catch (err) {
    console.error('❌ updateIrondoShift error:', err);
    res.status(500).json({ error: 'Failed to update shift' });
  }
};

// ✏️ Update profile fields
exports.updateIrondoField = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (!['admin', 'security'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const validFields = ['full_name', 'phone', 'national_id'];
  const updates = [];
  const values = [];

  Object.entries(fields).forEach(([key, value], index) => {
    if (validFields.includes(key)) {
      updates.push(`${key} = $${index + 1}`);
      values.push(value);
    }
  });

  if (!updates.length) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }

  try {
    const result = await pool.query(
      `UPDATE irondo_members SET ${updates.join(', ')} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );
    res.json({ message: 'Updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('❌ updateIrondoField error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ❌ Delete member
exports.deleteIrondoMember = async (req, res) => {
  if (!['admin', 'security'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM irondo_members WHERE id = $1`, [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('❌ deleteIrondoMember:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
};

// 🌍 Public view of current shift
exports.getCurrentIrondoShift = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, phone, shift
      FROM irondo_members
      WHERE status = 'active'
    `);

    const day = [], night = [];

    result.rows.forEach(member => {
      if (member.shift === 'day') day.push(member);
      else if (member.shift === 'night') night.push(member);
    });

    res.json({ day, night });
  } catch (err) {
    console.error('❌ getCurrentIrondoShift:', err);
    res.status(500).json({ error: 'Failed to fetch Irondo shifts' });
  }
};
