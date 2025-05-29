const express = require('express');
const router = express.Router();
const { createYouthLeader, getYouthLeaders } = require('../controllers/youthLeaderController');

router.post('/', createYouthLeader);
router.get('/', getYouthLeaders);

module.exports = router;
