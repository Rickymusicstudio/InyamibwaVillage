const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import modular controllers
const isiboLeaders = require('../controllers/isiboLeadersController');
const securityLeaders = require('../controllers/securityLeadersController');
const cellLeaders = require('../controllers/cellLeadersController');

// ✅ Isibo Leaders
router.get('/isibo', authenticateToken, isiboLeaders.getIsiboLeaders);
router.post('/isibo', authenticateToken, isiboLeaders.addIsiboLeader);
router.put('/isibo/:national_id', authenticateToken, isiboLeaders.updateIsiboLeader);
router.delete('/isibo/:national_id', authenticateToken, isiboLeaders.deleteIsiboLeader);

// ✅ Cell Leader
router.get('/cell', authenticateToken, cellLeaders.getCellLeader);
router.post('/cell', authenticateToken, cellLeaders.addCellLeader);
router.delete('/cell', authenticateToken, cellLeaders.deleteCellLeader);

// ✅ Security Leader
router.get('/security', authenticateToken, securityLeaders.getSecurityLeader);
router.post('/security', authenticateToken, securityLeaders.addSecurityLeader);
router.put('/security/:national_id', authenticateToken, securityLeaders.updateSecurityLeader);
router.delete('/security/:national_id', authenticateToken, securityLeaders.deleteSecurityLeader);

// ✅ Test route
router.get('/test', (req, res) => {
  res.send('Leaders route is working ✅');
});

// ✅ GET all leaders (aggregated view for admin)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { rows } = await require('../config/db').query(`
      SELECT full_name, national_id, phone_number, email, 'cell_leader' AS role FROM cell_leader
      UNION
      SELECT full_name, national_id, phone AS phone_number, email, 'isibo_leader' AS role FROM isibo_leaders
      UNION
      SELECT full_name, national_id, phone AS phone_number, email, 'security_leader' AS role FROM security_leader
      ORDER BY full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching all leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch all leaders' });
  }
});

module.exports = router;
