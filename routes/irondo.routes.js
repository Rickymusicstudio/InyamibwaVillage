const express = require('express');
const router = express.Router();
const irondoController = require('../controllers/irondo.controller');

router.post('/', irondoController.createMember);
router.get('/', irondoController.getAllMembers);
router.put('/:id', irondoController.updateMember);
router.delete('/:id', irondoController.deleteMember);

router.get('/day', irondoController.getDayShift);
router.get('/night', irondoController.getNightShift);

module.exports = router;
