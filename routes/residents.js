const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getResidents,
  getResidentOverview,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  getMyResidentInfo // ✅ Importing new controller
} = require('../controllers/residentsController');

// ✅ List all residents (used by frontend table)
router.get('/', authenticateToken, getResidents);

// ✅ Get profile of the currently logged-in resident
router.get('/me', authenticateToken, getMyResidentInfo); // ✅ MUST come before ":id"

// ✅ Get one resident by ID
router.get('/:id', authenticateToken, getResidentById);

// ✅ Create new resident
router.post('/', authenticateToken, createResident);

// ✅ Update resident
router.put('/:id', authenticateToken, updateResident);

// ✅ Delete resident
router.delete('/:id', authenticateToken, deleteResident);

// ✅ Overview route (optional, used in dashboards)
router.get('/overview', authenticateToken, getResidentOverview);

module.exports = router;
