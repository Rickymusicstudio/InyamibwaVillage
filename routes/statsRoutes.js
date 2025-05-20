const express = require('express');
const router = express.Router();

const { getCellStats } = require('../controllers/statsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Only admin and cell_leader are allowed
router.get('/cell', authenticateToken, authorizeRoles('admin', 'cell_leader'), getCellStats);

module.exports = router;
