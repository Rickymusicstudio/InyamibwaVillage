const pool = require('../utils/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res, next) => {
  try {
    const { national_id, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM residents WHERE national_id = $1',
      [national_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Optionally add token here (e.g., JWT) if needed in future
    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    next(err);
  }
};
