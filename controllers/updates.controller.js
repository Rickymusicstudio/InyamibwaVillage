const pool = require('../utils/db');

exports.postUpdate = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const result = await pool.query(
      'INSERT INTO updates (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getAllUpdates = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM updates ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};
