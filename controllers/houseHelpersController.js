const pool = require('../config/db');

// Resident: Get helpers
exports.getMyHelpers = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM house_helpers WHERE resident_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting helpers:', err);
    res.status(500).json({ error: 'Failed to get helpers' });
  }
};

// Resident: Add helper
exports.addOrUpdateHelper = async (req, res) => {
  const userId = req.user.id;
  const { full_name, national_id, phone_number, house, employer_name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO house_helpers 
        (resident_id, full_name, national_id, phone_number, house, employer_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        full_name,
        national_id || null,
        phone_number || null,
        house,
        employer_name
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding helper:', err);
    res.status(500).json({ error: 'Failed to add helper' });
  }
};

// Resident: Delete helper
exports.deleteMyHelper = async (req, res) => {
  const userId = req.user.id;
  const helperId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM house_helpers WHERE id = $1 AND resident_id = $2 RETURNING *',
      [helperId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Helper not found or unauthorized' });
    }

    res.json({ message: 'Helper deleted successfully' });
  } catch (err) {
    console.error('Error deleting helper:', err);
    res.status(500).json({ error: 'Failed to delete helper' });
  }
};

// Admin: Get all helpers
exports.getAllHelpers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, r.full_name AS resident_name, r.isibo, r.resident_type
       FROM house_helpers h
       LEFT JOIN residents r ON h.resident_id = r.id
       ORDER BY h.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all helpers:', err);
    res.status(500).json({ error: 'Failed to fetch all helpers' });
  }
};

// Admin: Export helpers as CSV (placeholder)
exports.exportHelpersCSV = async (req, res) => {
  res.send('CSV export not implemented yet');
};
