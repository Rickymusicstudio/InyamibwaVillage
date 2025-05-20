const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  addOrUpdateHelper,   // still used to add
  getAllHelpers,
  exportHelpersCSV,
  getMyHelpers          // ✅ renamed
} = require('../controllers/houseHelpersController');

// Resident adds a helper
router.post('/', authenticateToken, addOrUpdateHelper);

// Resident gets all their helpers
router.get('/me', authenticateToken, getMyHelpers);

// Admin views all
router.get('/', authenticateToken, getAllHelpers);

// Admin exports CSV
router.get('/export', authenticateToken, exportHelpersCSV);

module.exports = router;
