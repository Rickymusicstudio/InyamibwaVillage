const pool = require('../utils/db');

exports.postThought = async (req, res, next) => {
  try {
    const { resident_id, content } = req.body;
    const result = await pool.query(
      'INSERT INTO thoughts (resident_id, content) VALUES ($1, $2) RETURNING *',
      [resident_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getThoughtsWithResidentNames = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.content, t.created_at, r.names AS resident_name
      FROM thoughts t
      JOIN residents r ON t.resident_id = r.id
      ORDER BY t.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};
