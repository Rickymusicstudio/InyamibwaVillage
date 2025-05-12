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

// Add getAllResidents, updateResident, deleteResident here...
