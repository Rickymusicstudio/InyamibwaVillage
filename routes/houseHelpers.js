const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  addOrUpdateHelper,
  getAllHelpers,
  exportHelpersCSV,
  getMyHelpers,
  deleteMyHelper
} = require('../controllers/houseHelpersController');

// ✅ Resident adds a helper
router.post('/', authenticateToken, addOrUpdateHelper);

// ✅ Resident gets their helpers
router.get('/me', authenticateToken, getMyHelpers);

// ✅ Resident deletes their helper
router.delete('/me/:id', authenticateToken, deleteMyHelper);

// ✅ Admin views all helpers
router.get('/', authenticateToken, authorizeRoles('admin'), getAllHelpers);

// ✅ Admin exports all helpers to CSV
router.get('/export', authenticateToken, authorizeRoles('admin'), exportHelpersCSV);

module.exports = router;
