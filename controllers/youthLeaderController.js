const pool = require('../config/db');

// ✅ Get Youth Leaders
exports.getYouthLeaders = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM youth_leaders ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching youth leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch youth leaders' });
  }
};

// ✅ Add Youth Leader
exports.addYouthLeader = async (req, res) => {
  const { full_name, national_id, phone, email, house, isibo, resident_type } = req.body;

  if (!full_name || !national_id || !phone || !email) {
    return res.status(400).json({ message: 'Full name, National ID, Phone, and Email are required.' });
  }

  try {
    await pool.query(`
      INSERT INTO youth_leaders (full_name, national_id, phone, email, house, isibo, resident_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [full_name, national_id, phone, email, house || null, isibo || null, resident_type || null]);

    res.status(201).json({ message: 'Youth leader created successfully' });
  } catch (err) {
    console.error('❌ Error adding youth leader:', err.message);
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
    console.error('❌ Error deleting youth leader:', err.message);
    res.status(500).json({ error: 'Failed to delete youth leader' });
  }
};
