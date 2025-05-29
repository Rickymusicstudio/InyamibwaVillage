const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// ✅ Import modular controllers
const isiboLeaders = require('../controllers/isiboLeadersController');
const securityLeaders = require('../controllers/securityLeadersController');
const cellLeaders = require('../controllers/cellLeadersController');
const youthLeaderController = require('../controllers/youthLeaderController'); // ✅ youth leader

// ✅ Isibo Leaders
router.get('/isibo', authenticateToken, isiboLeaders.getIsiboLeaders);
router.post('/isibo', authenticateToken, isiboLeaders.addIsiboLeader);
router.put('/isibo/:national_id', authenticateToken, isiboLeaders.updateIsiboLeader);
router.delete('/isibo/:national_id', authenticateToken, isiboLeaders.deleteIsiboLeader);

// ✅ Cell Leader
router.get('/cell', authenticateToken, cellLeaders.getCellLeader);
router.post('/cell', authenticateToken, cellLeaders.addCellLeader);
router.delete('/cell/:national_id', authenticateToken, cellLeaders.deleteCellLeader);

// ✅ Security Leader
router.get('/security', authenticateToken, securityLeaders.getSecurityLeader);
router.post('/security', authenticateToken, securityLeaders.addSecurityLeader);
router.put('/security/:national_id', authenticateToken, securityLeaders.updateSecurityLeader);
router.delete('/security/:national_id', authenticateToken, securityLeaders.deleteSecurityLeader);

// ✅ Youth Leader
//router.get('/youth', authenticateToken, youthLeaderController.getYouthLeaders);
router.post('/youth', authenticateToken, youthLeaderController.addYouthLeader);
router.delete('/youth/:national_id', authenticateToken, youthLeaderController.deleteYouthLeader);
// router.get('/youth', authenticateToken, youthLeaderController.getYouthLeaders);
router.get('/youth', youthLeaderController.getYouthLeaders);
router.put('/youth/:national_id', authenticateToken, youthLeaderController.updateYouthLeader);



// ✅ GET all leaders
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { rows } = await require('../config/db').query(`
      SELECT full_name, national_id, phone_number, email, 'cell_leader' AS role FROM cell_leader
      UNION
      SELECT full_name, national_id, phone AS phone_number, email, 'isibo_leader' AS role FROM isibo_leaders
      UNION
      SELECT full_name, national_id, phone AS phone_number, email, 'security_leader' AS role FROM security_leader
      UNION
      SELECT full_name, national_id, phone, email, 'youth_leader' AS role FROM youth_leaders
      ORDER BY full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching all leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch all leaders' });
  }
});

// ✅ Test route
router.get('/test', (req, res) => {
  res.send('Leaders route is working ✅');
});

module.exports = router;
