const express = require('express');
const router = express.Router();
const helperController = require('../controllers/helpers.controller');

router.post('/', helperController.createHelper);
router.get('/', helperController.getAllHelpers);
router.put('/:id', helperController.updateHelper);
router.delete('/:id', helperController.deleteHelper);

module.exports = router;
