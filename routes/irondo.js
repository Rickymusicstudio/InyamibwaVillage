const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const {
  addIrondoMember,
  getIrondoMembers,
  updateIrondoShift,
  getCurrentIrondoShift,
  updateIrondoField,
  deleteIrondoMember
} = require('../controllers/irondoController');

// 🔐 Create
router.post('/', authenticateToken, addIrondoMember);

// 🔐 Read all
router.get('/', authenticateToken, getIrondoMembers);

// 🔐 Update shift
router.put('/:id/shift', authenticateToken, updateIrondoShift);

// 🔐 Update other profile fields
router.put('/:id', authenticateToken, updateIrondoField);

// 🔐 Delete member
router.delete('/:id', authenticateToken, deleteIrondoMember);

// 🌍 Public: current shift
router.get('/current-shift', getCurrentIrondoShift);

module.exports = router;
