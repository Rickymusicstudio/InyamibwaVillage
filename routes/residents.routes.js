const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // multer setup
const residentController = require('../controllers/residents.controller');

router.post('/', upload.single('photo'), residentController.createResident);
router.get('/', residentController.getAllResidents);
router.put('/:id', residentController.updateResident);
router.delete('/:id', residentController.deleteResident);

module.exports = router;
