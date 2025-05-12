const express = require('express');
const router = express.Router();
const updatesController = require('../controllers/updates.controller');

router.post('/', updatesController.postUpdate);
router.get('/', updatesController.getAllUpdates);

module.exports = router;
