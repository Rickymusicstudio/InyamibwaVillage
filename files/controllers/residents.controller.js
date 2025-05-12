const pool = require('../utils/db');
const bcrypt = require('bcryptjs');

exports.createResident = async (req, res, next) => {
  try {
    const { names, national_id, phone, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const photo = req.file?.filename || null;

    const result = await pool.query(
      'INSERT INTO residents (names, national_id, phone, password, photo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [names, national_id, phone, hashed, photo]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getAllResidents = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM residents ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.updateResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { names, national_id, phone } = req.body;

    const result = await pool.query(
      'UPDATE residents SET names = $1, national_id = $2, phone = $3 WHERE id = $4 RETURNING *',
      [names, national_id, phone, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Resident not found' });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteResident = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM residents WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Resident not found' });

    res.json({ message: 'Resident deleted' });
  } catch (err) {
    next(err);
  }
};
