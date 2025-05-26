const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  addOrUpdateHelper,
  getAllHelpers,
  exportHelpersCSV,
  getMyHelpers,
  deleteMyHelper,
  deleteHelperAsAdmin
} = require('../controllers/houseHelpersController');

// Resident routes
router.post('/', authenticateToken, addOrUpdateHelper);
router.get('/me', authenticateToken, getMyHelpers);
router.delete('/me/:id', authenticateToken, deleteMyHelper);

// Admin routes
router.get('/', authenticateToken, authorizeRoles('admin'), getAllHelpers);
router.get('/export', authenticateToken, authorizeRoles('admin'), exportHelpersCSV);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteHelperAsAdmin);

module.exports = router;
