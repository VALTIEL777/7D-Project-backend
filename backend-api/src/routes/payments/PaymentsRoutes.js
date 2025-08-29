const express = require('express');
const PaymentsController = require('../../controllers/payments/PaymentsController');
const PaymentsExcelController = require('../../controllers/payments/PaymentsExcelController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Managing payment records
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment record
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentNumber
 *               - datePaid
 *               - amountPaid
 *               - status
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               paymentNumber:
 *                 type: string
 *                 description: The unique number of the payment.
 *                 example: 'PAY001'
 *               datePaid:
 *                 type: string
 *                 format: date
 *                 description: The date the payment was made.
 *                 example: 2023-01-01
 *               amountPaid:
 *                 type: number
 *                 format: float
 *                 description: The amount of the payment.
 *                 example: 1000.00
 *               status:
 *                 type: string
 *                 description: The status of the payment (e.g., Completed, Pending).
 *                 example: Completed
 *               paymentURL:
 *                 type: string
 *                 description: URL to the payment receipt or document (optional).
 *                 example: http://example.com/payment001.pdf
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this entry.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The payment record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkId:
 *                   type: integer
 *                   description: The auto-generated ID of the payment.
 *                   example: 1
 *                 paymentNumber:
 *                   type: string
 *                   example: 'PAY001'
 *       500:
 *         description: Server error
 */
router.post('/', PaymentsController.createPayment);

/**
 * @swagger
 * /payments/{checkId}:
 *   get:
 *     summary: Get a payment record by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: checkId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the payment.
 *     responses:
 *       200:
 *         description: Payment record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkId:
 *                   type: integer
 *                   example: 1
 *                 paymentNumber:
 *                   type: string
 *                   example: 'PAY001'
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:checkId', PaymentsController.getPaymentById);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Retrieve a list of all payment records
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: A list of payment records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   checkId:
 *                     type: integer
 *                     example: 1
 *                   paymentNumber:
 *                     type: string
 *                     example: 'PAY001'
 *       500:
 *         description: Server error
 */
router.get('/', PaymentsController.getAllPayments);

/**
 * @swagger
 * /payments/{checkId}:
 *   put:
 *     summary: Update a payment record by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: checkId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the payment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentNumber:
 *                 type: string
 *                 description: The updated payment number.
 *                 example: 'PAY002'
 *               datePaid:
 *                 type: string
 *                 format: date
 *                 description: The updated date the payment was made.
 *                 example: 2023-01-02
 *               amountPaid:
 *                 type: number
 *                 format: float
 *                 description: The updated amount of the payment.
 *                 example: 1100.00
 *               status:
 *                 type: string
 *                 description: The updated status of the payment.
 *                 example: Processed
 *               paymentURL:
 *                 type: string
 *                 description: Updated URL to the payment receipt or document.
 *                 example: http://example.com/payment002.pdf
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The payment record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkId:
 *                   type: integer
 *                   example: 1
 *                 paymentNumber:
 *                   type: string
 *                   example: 'PAY002'
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.put('/:checkId', PaymentsController.updatePayment);

/**
 * @swagger
 * /payments/{checkId}:
 *   delete:
 *     summary: Delete a payment record by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: checkId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the payment.
 *     responses:
 *       200:
 *         description: The payment record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment deleted successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.delete('/:checkId', PaymentsController.deletePayment);

/**
 * @swagger
 * /payments/info/payment-invoice-ticket:
 *   get:
 *     summary: Get payment, invoice, and ticket information
 *     tags: [Payments]
 *     description: Retrieves a combined view of payment numbers, amounts paid, invoice numbers, amounts requested, ticket amounts to pay, and ticket codes
 *     responses:
 *       200:
 *         description: A list of payment-invoice-ticket information records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   paymentNumber:
 *                     type: string
 *                     description: The payment number from the Payments table
 *                     example: 'PAY001'
 *                   amountPaid:
 *                     type: number
 *                     format: float
 *                     description: The amount paid from the Payments table
 *                     example: 1000.00
 *                   invoiceNumber:
 *                     type: string
 *                     description: The invoice number from the Invoices table
 *                     example: 'INV001'
 *                   amountRequested:
 *                     type: number
 *                     format: float
 *                     description: The amount requested from the Invoices table
 *                     example: 950.00
 *                   amountToPay:
 *                     type: number
 *                     format: float
 *                     description: The amount to pay from the Tickets table
 *                     example: 1000.00
 *                   calculatedCost:
 *                     type: number
 *                     format: float
 *                     description: The calculated cost from the Tickets table
 *                     example: 950.00
 *                   ticketCode:
 *                     type: string
 *                     description: The ticket code from the Tickets table
 *                     example: 'TKT001'
 *       500:
 *         description: Server error
 */
router.get('/info/payment-invoice-ticket', PaymentsController.getPaymentInvoiceTicketInfo);

// Excel analysis and upload endpoints for payments - DEPRECATED: Use /api/unified/excel/ instead
// router.post('/excel/analyze', upload.single('file'), PaymentsExcelController.analyzeExcel);
// router.post('/excel/upload', upload.single('file'), PaymentsExcelController.uploadExcel);

module.exports = router; 