const pool = require('../config/db');

// ✅ Get Youth Leaders
exports.getYouthLeaders = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM youth_leaders ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching youth leaders:', err);
    res.status(500).json({ error: 'Failed to fetch youth leaders' });
  }
};

// ✅ Add Youth Leader (with duplicate check)
exports.addYouthLeader = async (req, res) => {
  const { full_name, national_id, phone, email, house, isibo, resident_type } = req.body;

  if (!full_name || !national_id || !phone || !email) {
    return res.status(400).json({ message: 'Full name, National ID, Phone, and Email are required.' });
  }

  try {
    // 🔍 Check if national_id already exists
    const existing = await pool.query('SELECT * FROM youth_leaders WHERE national_id = $1', [national_id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'National ID already exists.' });
    }

    // ✅ Insert new youth leader
    const result = await pool.query(`
      INSERT INTO youth_leaders (full_name, national_id, phone_number, email, house, isibo, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [full_name, national_id, phone, email, house || null, isibo || null, resident_type || null]);

    console.log('✅ Inserted youth leader:', result.rows[0]);
    res.status(201).json({ message: 'Youth leader created successfully', leader: result.rows[0] });
  } catch (err) {
    console.error('❌ Error adding youth leader:', err);
    res.status(500).json({ error: 'Failed to add youth leader' });
  }
};

// ✅ Delete Youth Leader
exports.deleteYouthLeader = async (req, res) => {
  const { national_id } = req.params;

  try {
    const { rowCount } = await pool.query('DELETE FROM youth_leaders WHERE national_id = $1', [national_id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Youth leader not found' });
    }
    res.json({ message: 'Youth leader deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting youth leader:', err);
    res.status(500).json({ error: 'Failed to delete youth leader' });
  }
};
exports.updateYouthLeader = async (req, res) => {
  const { national_id } = req.params;
  const { full_name, phone, email, house, isibo, resident_type } = req.body;

  try {
    // 🔍 Check if the youth leader exists
    const existing = await pool.query('SELECT * FROM youth_leaders WHERE national_id = $1', [national_id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Youth leader not found' });
    }

    // ✅ Update the youth leader details
    const result = await pool.query(
      `
      UPDATE youth_leaders
      SET
        full_name = COALESCE($1, full_name),
        phone_number = COALESCE($2, phone_number),
        email = COALESCE($3, email),
        house = COALESCE($4, house),
        isibo = COALESCE($5, isibo),
        resident_type = COALESCE($6, resident_type)
      WHERE national_id = $7
      RETURNING *
      `,
      [full_name, phone, email, house, isibo, resident_type, national_id]
    );

    console.log('✅ Updated youth leader:', result.rows[0]);
    res.json({ message: 'Youth leader updated successfully', leader: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating youth leader:', err);
    res.status(500).json({ error: 'Failed to update youth leader' });
  }
};