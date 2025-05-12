const express = require('express');
const router = express.Router();
const thoughtsController = require('../controllers/thoughts.controller');

router.post('/', thoughtsController.postThought);
router.get('/', thoughtsController.getThoughtsWithResidentNames);

module.exports = router;
