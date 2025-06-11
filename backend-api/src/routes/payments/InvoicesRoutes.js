const express = require('express');
const InvoicesController = require('../../controllers/payments/InvoicesController');

const router = express.Router();

router.post('/', InvoicesController.createInvoice);
router.get('/:invoiceId', InvoicesController.getInvoiceById);
router.get('/', InvoicesController.getAllInvoices);
router.put('/:invoiceId', InvoicesController.updateInvoice);
router.delete('/:invoiceId', InvoicesController.deleteInvoice);

module.exports = router; 