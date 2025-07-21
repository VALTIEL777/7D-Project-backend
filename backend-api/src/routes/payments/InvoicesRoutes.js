const express = require('express');
const InvoicesController = require('../../controllers/payments/InvoicesController');
const InvoicesExcelController = require('../../controllers/payments/InvoicesExcelController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Managing invoices associated with tickets and payments
 */

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice record
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *               - invoiceNumber
 *               - invoiceDateRequested
 *               - amountRequested
 *               - status
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the associated ticket.
 *                 example: 1
 *               invoiceNumber:
 *                 type: string
 *                 description: The unique number of the invoice.
 *                 example: 'INV001'
 *               invoiceDateRequested:
 *                 type: string
 *                 format: date
 *                 description: The date the invoice was requested.
 *                 example: 2023-01-01
 *               amountRequested:
 *                 type: number
 *                 format: float
 *                 description: The amount requested in the invoice.
 *                 example: 1500.00
 *               status:
 *                 type: string
 *                 description: The status of the invoice (e.g., Pending, Paid, Overdue).
 *                 example: Pending
 *               invoiceURL:
 *                 type: string
 *                 description: URL to the invoice document (optional).
 *                 example: http://example.com/invoice001.pdf
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
 *         description: The invoice record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: integer
 *                   description: The auto-generated ID of the invoice.
 *                   example: 1
 *                 invoiceNumber:
 *                   type: string
 *                   example: 'INV001'
 *       500:
 *         description: Server error
 */
router.post('/', InvoicesController.createInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     summary: Get an invoice record by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the invoice.
 *     responses:
 *       200:
 *         description: Invoice record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: integer
 *                   example: 1
 *                 invoiceNumber:
 *                   type: string
 *                   example: 'INV001'
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.get('/:invoiceId', InvoicesController.getInvoiceById);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Retrieve a list of all invoice records
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: A list of invoice records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   invoiceId:
 *                     type: integer
 *                     example: 1
 *                   invoiceNumber:
 *                     type: string
 *                     example: 'INV001'
 *       500:
 *         description: Server error
 */
router.get('/', InvoicesController.getAllInvoices);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   put:
 *     summary: Update an invoice record by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the invoice.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 description: The updated ID of the associated ticket.
 *                 example: 2
 *               invoiceNumber:
 *                 type: string
 *                 description: The updated invoice number.
 *                 example: 'INV002'
 *               invoiceDateRequested:
 *                 type: string
 *                 format: date
 *                 description: The updated date the invoice was requested.
 *                 example: 2023-01-05
 *               amountRequested:
 *                 type: number
 *                 format: float
 *                 description: The updated amount requested.
 *                 example: 1600.00
 *               status:
 *                 type: string
 *                 description: The updated status of the invoice.
 *                 example: Paid
 *               invoiceURL:
 *                 type: string
 *                 description: Updated URL to the invoice document.
 *                 example: http://example.com/invoice002.pdf
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The invoice record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: integer
 *                   example: 1
 *                 invoiceNumber:
 *                   type: string
 *                   example: 'INV002'
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.put('/:invoiceId', InvoicesController.updateInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   delete:
 *     summary: Delete an invoice record by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the invoice.
 *     responses:
 *       200:
 *         description: The invoice record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.delete('/:invoiceId', InvoicesController.deleteInvoice);

// Excel analysis and upload endpoints
router.post('/excel/analyze', upload.single('file'), InvoicesExcelController.analyzeExcel);
router.post('/excel/upload', upload.single('file'), InvoicesExcelController.uploadExcel);

/**
 * @swagger
 * /invoices/excel/item-codes:
 *   get:
 *     summary: Get all available payline item codes
 *     tags: [Invoices]
 *     description: Retrieve all available payline item codes from ContractUnits for reference
 *     responses:
 *       200:
 *         description: List of available item codes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 itemCodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemCode:
 *                         type: string
 *                         example: "123456"
 *                       name:
 *                         type: string
 *                         example: "Concrete Repair"
 *                 count:
 *                   type: integer
 *                   example: 150
 *       500:
 *         description: Server error
 */
router.get('/excel/item-codes', InvoicesExcelController.getAvailableItemCodes);

module.exports = router; 