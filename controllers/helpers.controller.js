const pool = require('../utils/db');

exports.createHelper = async (req, res, next) => {
  try {
    const { names, phone, assigned_resident_id } = req.body;
    const result = await pool.query(
      'INSERT INTO house_helpers (names, phone, assigned_resident_id) VALUES ($1, $2, $3) RETURNING *',
      [names, phone, assigned_resident_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getAllHelpers = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM house_helpers');
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.updateHelper = async (req, res, next) => {
  try {
    const { names, phone } = req.body;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE house_helpers SET names=$1, phone=$2 WHERE id=$3 RETURNING *',
      [names, phone, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteHelper = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM house_helpers WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
