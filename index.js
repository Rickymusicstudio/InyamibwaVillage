const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const pool = require('./config/db');

dotenv.config();

const app = express();

// ============================
// 🌍 Middleware Setup
// ============================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================
// 🛣 Route Imports
// ============================
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messageRoutes');
const residentsRoutes = require('./routes/residents');
const houseHelpersRoutes = require('./routes/houseHelpers');
const irondoRoutes = require('./routes/irondo');
const leadersRoutes = require('./routes/leaders');
const thoughtsRoutes = require('./routes/thoughtsRoutes');
const cellUpdatesRoutes = require('./routes/cellUpdates'); // Optional
const statsRoutes = require('./routes/statsRoutes');
 // ✅ Correct placement

// ============================
// 🔗 Register Routes
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/house-helpers', houseHelpersRoutes);
app.use('/api/irondo', irondoRoutes);
app.use('/api/leaders', leadersRoutes);
app.use('/api/thoughts', thoughtsRoutes);
app.use('/api/stats', statsRoutes); // ✅ exposes /api/stats/cell
// ============================
// 🧪 Health Check Route
// ============================
app.get('/test-db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json({ db_time: rows[0] });
  } catch (err) {
    console.error('❌ DB CONNECTION ERROR:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ============================
// 🧯 Global Error Handler
// ============================
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ============================
// 🚀 Start Server
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
