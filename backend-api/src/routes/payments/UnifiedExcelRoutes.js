const express = require('express');
const UnifiedExcelController = require('../../controllers/payments/UnifiedExcelController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Unified Excel
 *   description: Unified Excel analyzer for both invoice and payment files
 */

/**
 * @swagger
 * /unified/excel/analyze:
 *   post:
 *     summary: Analyze Excel file (invoice or payment)
 *     tags: [Unified Excel]
 *     description: |
 *       Automatically detects if the Excel file contains invoice or payment data and analyzes it accordingly.
 *       Supports both invoice Excel files (with columns like Contract Number, SIP Number, Planned, etc.)
 *       and payment Excel files (with columns like Amount, Payment Reference, LineItem.InvoiceNumber, Date).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file to analyze
 *     responses:
 *       200:
 *         description: Excel file analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 excelType:
 *                   type: string
 *                   enum: [invoice, payment]
 *                   description: Detected type of Excel file
 *                 headerRow:
 *                   type: integer
 *                   description: Row number where headers were found
 *                 headers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Column headers found in the file
 *                 preview:
 *                   type: array
 *                   description: Preview of first 5 data rows
 *                 missing:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Missing required columns
 *                 indexes:
 *                   type: object
 *                   description: Column index mappings
 *                 inconsistencies:
 *                   type: array
 *                   description: Rows with data inconsistencies
 *                 consistentItems:
 *                   type: array
 *                   description: Rows with consistent data
 *                 totalDataRows:
 *                   type: integer
 *                   description: Total number of data rows
 *                 consistentCount:
 *                   type: integer
 *                   description: Number of consistent rows
 *                 inconsistentCount:
 *                   type: integer
 *                   description: Number of inconsistent rows
 *                 summary:
 *                   type: object
 *                   description: Summary statistics
 *       400:
 *         description: Invalid Excel file or unknown type
 *       500:
 *         description: Server error
 */
router.post('/excel/analyze', upload.single('file'), UnifiedExcelController.analyzeExcel);

/**
 * @swagger
 * /unified/excel/upload:
 *   post:
 *     summary: Upload and process Excel file (invoice or payment)
 *     tags: [Unified Excel]
 *     description: |
 *       Automatically detects if the Excel file contains invoice or payment data and processes it accordingly.
 *       For invoice files: Creates/updates invoices and links them to tickets.
 *       For payment files: Creates payments and links them to tickets via invoices.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file to upload and process
 *     responses:
 *       200:
 *         description: Excel file processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 excelType:
 *                   type: string
 *                   enum: [invoice, payment]
 *                   description: Detected type of Excel file
 *                 fileUrl:
 *                   type: string
 *                   description: URL where the file was stored
 *                 results:
 *                   type: array
 *                   description: Processing results for each row
 *                 totalDataRows:
 *                   type: integer
 *                   description: Total number of data rows
 *                 processedRows:
 *                   type: integer
 *                   description: Number of successfully processed rows
 *                 skippedRows:
 *                   type: integer
 *                   description: Number of rows that failed to process
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total rows processed
 *                     successful:
 *                       type: integer
 *                       description: Number of successful rows
 *                     failed:
 *                       type: integer
 *                       description: Number of failed rows
 *                     successRate:
 *                       type: integer
 *                       description: Success rate percentage
 *       400:
 *         description: Invalid Excel file, unknown type, or missing data
 *       500:
 *         description: Server error
 */
router.post('/excel/upload', upload.single('file'), UnifiedExcelController.uploadExcel);

module.exports = router; 