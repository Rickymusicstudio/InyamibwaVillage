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

// ✅ Register resident (photo optional)
app.post('/residents', upload.single('photo'), async (req, res) => {
  const {
    full_name, phone_number, email, resident_type,
    house, isibo, has_house_worker, national_id
  } = req.body;

  const photo = req.file ? req.file.filename : null;

  try {
    const exists = await pool.query('SELECT 1 FROM residents WHERE national_id = $1', [national_id]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'National ID already registered' });
    }

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

// ✅ Get all residents
app.get('/residents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM residents ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
  console.error('❌ DB error in /residents:', err.message);
  res.status(500).json({ error: 'Failed to fetch residents' });
}
});

// ✅ Update resident
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

// ✅ Delete resident
app.delete('/residents/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM residents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Resident deleted' });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ✅ Dashboard Stats
app.get('/stats', async (req, res) => {
  try {
    const [residents, helpers, updates, thoughts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM residents'),
      pool.query('SELECT COUNT(*) FROM house_helpers'),
      pool.query('SELECT COUNT(*) FROM cell_updates'),
      pool.query('SELECT COUNT(*) FROM thoughts')
    ]);

    res.json({
      residentCount: Number(residents.rows[0].count),
      helperCount: Number(helpers.rows[0].count),
      updateCount: Number(updates.rows[0].count),
      thoughtCount: Number(thoughts.rows[0].count)
    });
  } catch {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ✅ Umukuru w’Umutekano (Security Leader)
app.post('/security_leader', async (req, res) => {
  const { full_name, phone, email } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO security_leader (full_name, phone, email)
      VALUES ($1, $2, $3) RETURNING *`,
      [full_name, phone, email]);
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to save leader' });
  }
});

app.get('/security_leader', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM security_leader ORDER BY created_at DESC LIMIT 1`);
    res.json(result.rows[0] || {});
  } catch {
    res.status(500).json({ error: 'Failed to load leader' });
  }
});

// ✅ Irondo Team (Permanent)
app.post('/irondo_team', async (req, res) => {
  const { full_name, phone, shift_type } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO irondo_team (full_name, phone, shift_type)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [full_name, phone, shift_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to add Irondo member:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.get('/irondo_team', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM irondo_team ORDER BY shift_type, full_name');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch Irondo team:', err);
    res.status(500).json({ error: 'Failed to fetch Irondo team' });
  }
});

app.delete('/irondo_team/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM irondo_team WHERE id = $1', [id]);
    res.status(200).json({ message: '✅ Member removed' });
  } catch (err) {
    console.error('❌ Failed to delete member:', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

app.put('/irondo_team/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, shift_type } = req.body;

  try {
    const result = await pool.query(`
      UPDATE irondo_team SET
        full_name = $1,
        phone = $2,
        shift_type = $3
      WHERE id = $4
      RETURNING *`,
      [full_name, phone, shift_type, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to update member:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});


// [same setup as before: express, multer, bcrypt, cors, pool setup, etc.]

// ✅ Middleware for role-based routes
function authorizeSecurityOrAdmin(req, res, next) {
  const role = req.headers['x-role'];
  if (role === 'admin' || role === 'security') return next();
  return res.status(403).json({ error: 'Access denied' });
}

// ✅ Dashboard Stats
app.get('/stats', async (req, res) => {
  try {
    const residentCount = await pool.query('SELECT COUNT(*) FROM residents');
    const helperCount = await pool.query('SELECT COUNT(*) FROM house_helpers');
    const updateCount = await pool.query('SELECT COUNT(*) FROM cell_updates');
    const thoughtCount = await pool.query('SELECT COUNT(*) FROM thoughts');
    res.json({
      residentCount: Number(residentCount.rows[0].count),
      helperCount: Number(helperCount.rows[0].count),
      updateCount: Number(updateCount.rows[0].count),
      thoughtCount: Number(thoughtCount.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});


// ✅ Umukuru w’Umudugudu (Cell Leader)
app.post('/leader', async (req, res) => {
  const { full_name, phone_number, email } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cell_leader (full_name, phone_number, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [full_name, phone_number, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save leader' });
  }
});

app.get('/leader', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM cell_leader
      ORDER BY created_at DESC
      LIMIT 1
    `);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leader' });
  }
});


// ✅ Isibo Leaders
app.post('/isibo_leaders', async (req, res) => {
  const { full_name, isibo, phone, email } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO isibo_leaders (full_name, isibo, phone, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [full_name, isibo, phone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save isibo leader' });
  }
});

app.get('/isibo_leaders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM isibo_leaders ORDER BY isibo ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch isibo leaders' });
  }
});


// ✅ Thoughts
app.post('/thoughts', async (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO thoughts (user_id, message)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save thought' });
  }
});

app.get('/thoughts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, r.full_name
      FROM thoughts t
      JOIN users u ON t.user_id = u.id
      JOIN residents r ON u.resident_id = r.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch thoughts' });
  }
});

// 🔸 Post new cell update
app.post('/updates', async (req, res) => {
  const { message } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cell_updates (message) VALUES ($1) RETURNING *`,
      [message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to save update:', err);
    res.status(500).json({ error: 'Failed to save update' });
  }
});

// 🔸 Get all updates (for dashboard view)
app.get('/updates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM cell_updates ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch updates:', err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});
app.get('/updates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cell_updates ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch updates:', err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

app.get('/irondo_team/day', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM irondo_team WHERE shift_type = $1 ORDER BY full_name',
      ['day']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to load day shift:', err);
    res.status(500).json({ error: 'Failed to load day shift' });
  }
});

app.get('/irondo_team/night', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM irondo_team WHERE shift_type = $1 ORDER BY full_name',
      ['night']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to load night shift:', err);
    res.status(500).json({ error: 'Failed to load night shift' });
  }
});

// ✅ Add a house helper
app.post('/helpers', async (req, res) => {
  const { full_name, national_id, phone_number, works_for_house, isibo } = req.body;

  if (!full_name || !works_for_house || !isibo) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO house_helpers (full_name, national_id, phone_number, works_for_house, isibo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [full_name, national_id, phone_number, works_for_house, isibo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to save helper:', err.message);
    res.status(500).json({ error: 'Failed to save helper' });
  }
});

app.get('/helpers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM house_helpers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to load helpers:', err);
    res.status(500).json({ error: 'Failed to load helpers' });
  }
});

// ✅ Get all house helpers
app.get('/helpers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM house_helpers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to load helpers:', err.message);
    res.status(500).json({ error: 'Failed to load helpers' });
  }
});
app.delete('/helpers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM house_helpers WHERE id = $1', [id]);
    res.json({ message: 'Helper deleted' });
  } catch (err) {
    console.error('❌ Failed to delete helper:', err);
    res.status(500).json({ error: 'Failed to delete helper' });
  }
});

app.put('/helpers/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, national_id, phone_number, works_for_house, isibo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE house_helpers
       SET full_name = $1, national_id = $2, phone_number = $3, works_for_house = $4, isibo = $5
       WHERE id = $6
       RETURNING *`,
      [full_name, national_id, phone_number, works_for_house, isibo, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to update helper:', err);
    res.status(500).json({ error: 'Failed to update helper' });
  }
});

app.delete('/leader/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cell_leader WHERE id = $1', [req.params.id]);
    res.json({ message: 'Leader deleted' });
  } catch (err) {
    console.error('❌ Delete leader error:', err);
    res.status(500).json({ error: 'Failed to delete leader' });
  }
});

// PUT /isibo_leaders/:id
app.put('/isibo_leaders/:id', async (req, res) => {
  const { full_name, isibo, phone, email } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(`
      UPDATE isibo_leaders
      SET full_name=$1, isibo=$2, phone=$3, email=$4
      WHERE id=$5 RETURNING *`,
      [full_name, isibo, phone, email, id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update isibo leader' });
  }
});

// DELETE /isibo_leaders/:id
app.delete('/isibo_leaders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM isibo_leaders WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete leader' });
  }
});


