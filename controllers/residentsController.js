const pool = require('../config/db');

// ✅ Get all residents
const getResidents = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM residents ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching residents:', err);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
};

// ✅ Get one resident by ID
const getResidentById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query('SELECT * FROM residents WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Resident not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching resident by ID:', err);
    res.status(500).json({ error: 'Failed to fetch resident' });
  }
};

// ✅ Create new resident
const createResident = async (req, res) => {
  const {
    full_name, national_id, phone_number, email,
    resident_type, house, isibo, has_house_worker
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO residents 
      (full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error creating resident:', err);
    res.status(500).json({ error: 'Failed to add resident' });
  }
};

// ✅ Update resident
const updateResident = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    full_name, phone_number, email, resident_type,
    house, isibo, has_house_worker
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE residents SET 
        full_name=$1, phone_number=$2, email=$3,
        resident_type=$4, house=$5, isibo=$6, has_house_worker=$7
      WHERE id=$8 RETURNING *`,
      [full_name, phone_number, email, resident_type, house, isibo, has_house_worker, id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Resident not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error updating resident:', err);
    res.status(500).json({ error: 'Failed to update resident' });
  }
};

// ✅ Delete resident
const deleteResident = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rowCount } = await pool.query('DELETE FROM residents WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Resident not found' });
    res.json({ message: 'Resident deleted' });
  } catch (err) {
    console.error('❌ Error deleting resident:', err);
    res.status(500).json({ error: 'Failed to delete resident' });
  }
};

// ✅ Get profile of the currently logged-in resident
const getMyResidentInfo = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT r.*
      FROM users u
      JOIN residents r ON u.resident_id = r.id
      WHERE u.id = $1
    `, [userId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Resident profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching resident profile:', err);
    res.status(500).json({ error: 'Failed to fetch resident profile' });
  }
};

// ✅ Overview route
const getResidentOverview = async (req, res) => {
  try {
    const residents = await pool.query(`
      SELECT r.*, u.role 
      FROM residents r
      LEFT JOIN users u ON u.resident_id = r.id
      ORDER BY r.full_name ASC
    `);

    const isiboLeaders = await pool.query('SELECT * FROM isibo_leaders');
    const cellLeader = await pool.query('SELECT * FROM cell_leader LIMIT 1');

    res.json({
      residents: residents.rows,
      isiboLeaders: isiboLeaders.rows,
      cellLeader: cellLeader.rows[0] || null
    });
  } catch (err) {
    console.error('❌ Overview fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
};

module.exports = {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  getResidentOverview,
  getMyResidentInfo
};
