const pool = require('../utils/db');

exports.createMember = async (req, res, next) => {
  try {
    const { name, shift } = req.body;
    const result = await pool.query(
      'INSERT INTO irondo_team (name, shift) VALUES ($1, $2) RETURNING *',
      [name, shift]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.getAllMembers = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM irondo_team');
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.updateMember = async (req, res, next) => {
  try {
    const { name, shift } = req.body;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE irondo_team SET name=$1, shift=$2 WHERE id=$3 RETURNING *',
      [name, shift, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteMember = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM irondo_team WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.getDayShift = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM irondo_team WHERE shift = 'day'");
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getNightShift = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM irondo_team WHERE shift = 'night'");
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};
