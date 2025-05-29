const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// REGISTER USER
const registerUser = async (req, res) => {
  const {
    full_name,
    national_id,
    email,
    phone_number,
    house,
    isibo,
    resident_type,
    has_house_worker,
    password,
    role
  } = req.body;

  // ✅ Add youth_leader to allowed roles
  const allowedRoles = ['resident', 'isibo_leader', 'cell_leader', 'security', 'youth_leader'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role selected' });
  }

  console.log('📌 Registering user with role:', role);

  try {
    // ✅ Check if user already exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE national_id = $1',
      [national_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert resident details
    const residentResult = await pool.query(
      `INSERT INTO residents (full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker]
    );
    const residentId = residentResult.rows[0].id;

    // ✅ Insert user credentials
    const userResult = await pool.query(
      `INSERT INTO users (national_id, password, role, resident_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role`,
      [national_id, hashedPassword, role, residentId]
    );

    const user = userResult.rows[0];

    // ✅ Insert into respective leader table if applicable
    if (role === 'isibo_leader') {
      await pool.query(
        `INSERT INTO isibo_leaders (full_name, national_id, phone, email, house, isibo, resident_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [full_name, national_id, phone_number, email, house, isibo, resident_type]
      );
      console.log('✅ Inserted into isibo_leaders');
    } else if (role === 'cell_leader') {
      await pool.query(
        `INSERT INTO cell_leader (full_name, national_id, phone_number, email)
         VALUES ($1, $2, $3, $4)`,
        [full_name, national_id, phone_number, email]
      );
      console.log('✅ Inserted into cell_leader');
    } else if (role === 'security') {
      await pool.query(
        `INSERT INTO security_leader (full_name, national_id, phone, email)
         VALUES ($1, $2, $3, $4)`,
        [full_name, national_id, phone_number, email]
      );
      console.log('✅ Inserted into security_leader');
    } else if (role === 'youth_leader') {
      await pool.query(
        `INSERT INTO youth_leaders (full_name, national_id, phone_number, email, house, isibo, resident_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [full_name, national_id, phone_number, email, house, isibo, resident_type]
      );
      console.log('✅ Inserted into youth_leaders');
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        resident_id: residentId,
        national_id,
        role: user.role,
        email,
        phone_number
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ message: 'Registration successful', token });
  } catch (err) {
    console.error('❌ Registration error:', err.stack);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  const { national_id, password } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT u.*, r.email, r.phone_number
       FROM users u
       LEFT JOIN residents r ON u.resident_id = r.id
       WHERE u.national_id = $1`,
      [national_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const payload = {
      id: user.id,
      resident_id: user.resident_id,
      national_id: user.national_id,
      role: user.role,
      email: user.email,
      phone_number: user.phone_number
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, user: payload });
  } catch (err) {
    console.error('❌ Login error:', err.stack);
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET LOGGED-IN USER
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      'SELECT id, national_id, role FROM users WHERE id = $1',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ getMe error:', err.stack);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
