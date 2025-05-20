const pool = require('../config/db'); // make sure your db pool is imported

// 🧑‍🍳 Add House Helper (resident – multiple allowed)
exports.addOrUpdateHelper = async (req, res) => {
  const residentId = req.user.id;
  const { full_name, national_id, phone_number } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  try {
    // Get house + employer name from resident
    const { rows } = await pool.query(
      `SELECT house, full_name AS employer_name FROM residents WHERE id = $1`,
      [residentId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const { house, employer_name } = rows[0];

    const insert = await pool.query(
      `INSERT INTO house_helpers (full_name, national_id, phone_number, house, employer_name, resident_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [full_name, national_id, phone_number, house, employer_name, residentId]
    );

    res.status(201).json({ message: 'Helper added', data: insert.rows[0] });
  } catch (err) {
    console.error('❌ addHelper:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 🙋‍♂️ View all helpers for logged-in resident
// 🙋‍♂️ View all helpers for logged-in resident
exports.getMyHelpers = async (req, res) => {
  const allowedRoles = ['resident', 'cell_leader', 'isibo_leader', 'security'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const residentId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, national_id, phone_number, house, employer_name, created_at
       FROM house_helpers
       WHERE resident_id = $1
       ORDER BY created_at DESC`,
      [residentId]
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ getMyHelpers:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// 🛡️ Admin: View all helpers
exports.getAllHelpers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, national_id, phone_number, house, employer_name, resident_id, created_at
       FROM house_helpers
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ getAllHelpers:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 📤 Admin: Export helpers to CSV
exports.exportHelpersCSV = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT full_name, national_id, phone_number, house, employer_name, created_at
       FROM house_helpers
       ORDER BY created_at DESC`
    );

    const header = 'Full Name,National ID,Phone Number,House,Employer Name,Created At\n';
    const csv = rows.map(r =>
      `${r.full_name},${r.national_id},${r.phone_number},${r.house},${r.employer_name},${r.created_at}`
    ).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('helpers.csv');
    res.send(header + csv);
  } catch (err) {
    console.error('❌ exportHelpersCSV:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
