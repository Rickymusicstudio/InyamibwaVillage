require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// ✅ PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:admin123@db.frcpgfqgsxvadrdjqtdo.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ Multer setup for optional photo
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resident_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ✅ Role check middleware
function authorizeSecurityOrAdmin(req, res, next) {
  const role = req.headers['x-role'];
  if (role === 'admin' || role === 'security') return next();
  return res.status(403).json({ error: 'Access denied' });
}

// ✅ API Test
app.get('/', (req, res) => {
  res.send('📡 Inyamibwa API is live!');
});

// ✅ Register resident
app.post('/residents', upload.single('photo'), async (req, res) => {
  const {
    full_name, phone_number, email, resident_type,
    house, isibo, has_house_worker, national_id
  } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    const exists = await pool.query('SELECT 1 FROM residents WHERE national_id = $1', [national_id]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'National ID already registered' });

    const residentResult = await pool.query(`
      INSERT INTO residents 
      (full_name, phone_number, email, resident_type, house, isibo, has_house_worker, national_id, photo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [full_name, phone_number, email, resident_type, house, isibo, has_house_worker, national_id, photo]);

    const resident = residentResult.rows[0];
    const hashedPassword = await bcrypt.hash('inyamibwa123', 10);

    await pool.query(`
      INSERT INTO users (national_id, password, resident_id, role)
      VALUES ($1, $2, $3, 'resident')`,
      [national_id, hashedPassword, resident.id]);

    res.status(201).json({ message: '✅ Registered', resident });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ✅ Login
app.post('/users/login', async (req, res) => {
  const { national_id, password } = req.body;
  try {
    const result = await pool.query(`
      SELECT u.*, r.full_name FROM users u
      LEFT JOIN residents r ON u.resident_id = r.id
      WHERE u.national_id = $1`,
      [national_id]);

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      id: user.id,
      resident_id: user.resident_id,
      national_id: user.national_id,
      full_name: user.full_name,
      role: user.role
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ✅ Residents CRUD
app.get('/residents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM residents ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ DB error in /residents:', err.message);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

app.put('/residents/:id', async (req, res) => {
  const { id } = req.params;
  const {
    full_name, national_id, phone_number, email,
    resident_type, house, isibo, has_house_worker
  } = req.body;

  try {
    const result = await pool.query(`
      UPDATE residents SET
      full_name=$1, national_id=$2, phone_number=$3, email=$4,
      resident_type=$5, house=$6, isibo=$7, has_house_worker=$8
      WHERE id = $9 RETURNING *`,
      [full_name, national_id, phone_number, email, resident_type, house, isibo, has_house_worker, id]);

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/residents/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM residents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Resident deleted' });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ✅ Irondo, Leaders, Helpers, Thoughts, Stats, Updates (unchanged sections)
// [Retain all your other routes unchanged, just make sure there’s only one app.get('/updates')]

app.get('/updates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cell_updates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch updates:', err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

// ✅ Database test
app.get('/db-test', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.send('✅ Database is connected!');
  } catch (err) {
    console.error('❌ DB test failed:', err.message);
    res.status(500).send('❌ Database connection failed!');
  }
});

// ✅ FINAL FIXED app.listen
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
