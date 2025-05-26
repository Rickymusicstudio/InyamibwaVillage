const pool = require('../config/db');

exports.getIsiboLeaders = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.full_name, r.national_id, r.phone_number, r.email, r.house, r.isibo, r.resident_type
      FROM isibo_leaders l
      JOIN residents r ON r.national_id = l.national_id
      ORDER BY r.full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching isibo leaders:', err);
    res.status(500).json({ error: 'Failed to fetch isibo leaders' });
  }
};

exports.addIsiboLeader = async (req, res) => {
  try {
    const { full_name, national_id, phone, email, house, isibo, resident_type } = req.body;

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
};

exports.updateIsiboLeader = async (req, res) => {
  try {
    const { national_id } = req.params;
    const { full_name, phone, email, house, isibo, resident_type } = req.body;

    const result = await pool.query(`
      UPDATE isibo_leaders
      SET full_name = $1, phone = $2, email = $3, house = $4, isibo = $5, resident_type = $6
      WHERE national_id = $7
      RETURNING *
    `, [full_name, phone, email, house, isibo, resident_type, national_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Isibo leader not found' });
    }

    await pool.query(`
      UPDATE residents
      SET full_name = $1, phone_number = $2, email = $3, house = $4, isibo = $5, resident_type = $6
      WHERE national_id = $7
    `, [full_name, phone, email, house, isibo, resident_type, national_id]);

    res.json({ message: 'Isibo leader updated', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating isibo leader:', err);
    res.status(500).json({ error: 'Failed to update isibo leader' });
  }
};

exports.deleteIsiboLeader = async (req, res) => {
  try {
    const { national_id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM isibo_leaders WHERE national_id = $1', [national_id]);

    if (rowCount === 0) return res.status(404).json({ error: 'Isibo leader not found' });

    res.json({ message: 'Isibo leader deleted' });
  } catch (err) {
    console.error('❌ Error deleting isibo leader:', err);
    res.status(500).json({ error: 'Failed to delete isibo leader' });
  }
};
 
