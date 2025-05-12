const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const residentRoutes = require('./routes/residents.routes');
const helperRoutes = require('./routes/helpers.routes');
const irondoRoutes = require('./routes/irondo.routes');
const thoughtsRoutes = require('./routes/thoughts.routes');
const updatesRoutes = require('./routes/updates.routes');
const authRoutes = require('./routes/auth.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/stats', statsRoutes);
app.use('/residents', residentRoutes);
app.use('/helpers', helperRoutes);
app.use('/irondo_team', irondoRoutes);
app.use('/thoughts', thoughtsRoutes);
app.use('/updates', updatesRoutes);

// Utilities
app.get('/db-test', require('./utils/dbTest'));

// Global Error Handler
app.use(errorHandler);

module.exports = app;
