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

  const allowedRoles = ['resident', 'isibo_leader', 'cell_leader', 'security'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role selected' });
  }

  console.log('📌 Registering user with role:', role);

  try {
    const existing = await pool.query(
      'SELECT * FROM users WHERE national_id = $1',
      [national_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const residentResult = await pool.query(
      `INSERT INTO residents (full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker]
    );
    const residentId = residentResult.rows[0].id;

    const userResult = await pool.query(
      `INSERT INTO users (national_id, password, role, resident_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role`,
      [national_id, hashedPassword, role, residentId]
    );

    const user = userResult.rows[0];

    // ➤ INSERT INTO LEADER TABLES BASED ON ROLE
    if (role === 'isibo_leader') {
      await pool.query(
        `INSERT INTO isibo_leaders (
          full_name, national_id, phone, email, house, isibo, resident_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [full_name, national_id, phone_number, email, house, isibo, resident_type]
      );
      console.log('✅ Inserted into isibo_leaders');
    } else if (role === 'cell_leader') {
      await pool.query(
        `INSERT INTO cell_leader (
          full_name, national_id, phone_number, email
        ) VALUES ($1, $2, $3, $4)`,
        [full_name, national_id, phone_number, email]
      );
      console.log('✅ Inserted into cell_leader');
    } else if (role === 'security') {
      await pool.query(
        `INSERT INTO security_leader (
          full_name, national_id, phone, email
        ) VALUES ($1, $2, $3, $4)`,
        [full_name, national_id, phone_number, email]
      );
      console.log('✅ Inserted into security_leader');
    }

    const token = jwt.sign(
      {
        id: user.id,
        resident_id: residentId, // ✅ now included
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
    // 🔐 1. Try logging in from users table (for residents)
    const result = await pool.query(
      `SELECT u.*, r.email, r.phone_number
       FROM users u
       JOIN residents r ON u.resident_id = r.id
       WHERE u.national_id = $1`,
      [national_id]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          resident_id: user.resident_id, // ✅ now included
          national_id: user.national_id,
          role: user.role,
          email: user.email,
          phone_number: user.phone_number
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(200).json({ token });
    }

    // 🔍 2. Check cell_leader
    const cell = await pool.query('SELECT * FROM cell_leader WHERE national_id = $1', [national_id]);
    if (cell.rows.length > 0) {
      const leader = cell.rows[0];
      const token = jwt.sign(
        {
          id: leader.national_id,
          role: 'cell_leader',
          email: leader.email,
          phone_number: leader.phone_number
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.status(200).json({ token });
    }

    // 🔍 3. Check security_leader
    const sec = await pool.query('SELECT * FROM security_leader WHERE national_id = $1', [national_id]);
    if (sec.rows.length > 0) {
      const leader = sec.rows[0];
      const token = jwt.sign(
        {
          id: leader.national_id,
          role: 'security_leader',
          email: leader.email,
          phone_number: leader.phone
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.status(200).json({ token });
    }

    // 🔍 4. Check isibo_leaders
    const isibo = await pool.query('SELECT * FROM isibo_leaders WHERE national_id = $1', [national_id]);
    if (isibo.rows.length > 0) {
      const leader = isibo.rows[0];
      const token = jwt.sign(
        {
          id: leader.national_id,
          role: 'isibo_leader',
          email: leader.email,
          phone_number: leader.phone
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.status(200).json({ token });
    }

    // ❌ Not found anywhere
    return res.status(400).json({ error: 'User not found in system' });

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
