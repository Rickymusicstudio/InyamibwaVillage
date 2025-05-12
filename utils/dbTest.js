const pool = require('./db');

module.exports = async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'Connected to DB' });
  } catch (err) {
    res.status(500).json({ status: 'DB connection failed', error: err.message });
  }
};
