const pool = require('../utils/db');

exports.getStats = async (req, res, next) => {
  try {
    const [residents, helpers, updates, thoughts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM residents'),
      pool.query('SELECT COUNT(*) FROM house_helpers'),
      pool.query('SELECT COUNT(*) FROM updates'),
      pool.query('SELECT COUNT(*) FROM thoughts')
    ]);

    res.status(200).json({
      residents: parseInt(residents.rows[0].count),
      house_helpers: parseInt(helpers.rows[0].count),
      updates: parseInt(updates.rows[0].count),
      thoughts: parseInt(thoughts.rows[0].count)
    });
  } catch (err) {
    next(err);
  }
};
