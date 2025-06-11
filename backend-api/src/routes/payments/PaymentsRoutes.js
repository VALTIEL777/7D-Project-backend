const express = require('express');
const PaymentsController = require('../../controllers/payments/PaymentsController');

const router = express.Router();

router.post('/', PaymentsController.createPayment);
router.get('/:checkId', PaymentsController.getPaymentById);
router.get('/', PaymentsController.getAllPayments);
router.put('/:checkId', PaymentsController.updatePayment);
router.delete('/:checkId', PaymentsController.deletePayment);

module.exports = router; 