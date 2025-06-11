const express = require('express');
const FinesController = require('../../controllers/payments/FinesController');

const router = express.Router();

router.post('/', FinesController.createFine);
router.get('/:fineId', FinesController.getFineById);
router.get('/', FinesController.getAllFines);
router.put('/:fineId', FinesController.updateFine);
router.delete('/:fineId', FinesController.deleteFine);

module.exports = router; 