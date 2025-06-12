const express = require('express');
const FinesController = require('../../controllers/payments/FinesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fines
 *   description: Managing fines associated with tickets
 */

/**
 * @swagger
 * /fines:
 *   post:
 *     summary: Create a new fine record
 *     tags: [Fines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *               - fineNumber
 *               - fineDate
 *               - amount
 *               - status
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the associated ticket.
 *                 example: 1
 *               fineNumber:
 *                 type: string
 *                 description: The unique number of the fine.
 *                 example: 'FINE001'
 *               fineDate:
 *                 type: string
 *                 format: date
 *                 description: The date the fine was issued.
 *                 example: 2023-01-01
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: The date the fine was paid (optional).
 *                 example: 2023-01-10
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The amount of the fine.
 *                 example: 50.00
 *               status:
 *                 type: string
 *                 description: The payment status of the fine (e.g., Paid, Outstanding).
 *                 example: Outstanding
 *               fineURL:
 *                 type: string
 *                 description: URL to the fine document (optional).
 *                 example: http://example.com/fine001.pdf
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
 *         description: The fine record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fineId:
 *                   type: integer
 *                   description: The auto-generated ID of the fine.
 *                   example: 1
 *                 fineNumber:
 *                   type: string
 *                   example: 'FINE001'
 *       500:
 *         description: Server error
 */
router.post('/', FinesController.createFine);

/**
 * @swagger
 * /fines/{fineId}:
 *   get:
 *     summary: Get a fine record by ID
 *     tags: [Fines]
 *     parameters:
 *       - in: path
 *         name: fineId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the fine.
 *     responses:
 *       200:
 *         description: Fine record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fineId:
 *                   type: integer
 *                   example: 1
 *                 fineNumber:
 *                   type: string
 *                   example: 'FINE001'
 *       404:
 *         description: Fine not found
 *       500:
 *         description: Server error
 */
router.get('/:fineId', FinesController.getFineById);

/**
 * @swagger
 * /fines:
 *   get:
 *     summary: Retrieve a list of all fine records
 *     tags: [Fines]
 *     responses:
 *       200:
 *         description: A list of fine records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fineId:
 *                     type: integer
 *                     example: 1
 *                   fineNumber:
 *                     type: string
 *                     example: 'FINE001'
 *       500:
 *         description: Server error
 */
router.get('/', FinesController.getAllFines);

/**
 * @swagger
 * /fines/{fineId}:
 *   put:
 *     summary: Update a fine record by ID
 *     tags: [Fines]
 *     parameters:
 *       - in: path
 *         name: fineId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the fine.
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
 *               fineNumber:
 *                 type: string
 *                 description: The updated fine number.
 *                 example: 'FINE002'
 *               fineDate:
 *                 type: string
 *                 format: date
 *                 description: The updated fine date.
 *                 example: 2023-01-05
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: The updated payment date.
 *                 example: 2023-01-15
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The updated amount.
 *                 example: 75.00
 *               status:
 *                 type: string
 *                 description: The updated payment status.
 *                 example: Paid
 *               fineURL:
 *                 type: string
 *                 description: Updated URL to the fine document.
 *                 example: http://example.com/fine002.pdf
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The fine record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fineId:
 *                   type: integer
 *                   example: 1
 *                 fineNumber:
 *                   type: string
 *                   example: 'FINE002'
 *       404:
 *         description: Fine not found
 *       500:
 *         description: Server error
 */
router.put('/:fineId', FinesController.updateFine);

/**
 * @swagger
 * /fines/{fineId}:
 *   delete:
 *     summary: Delete a fine record by ID
 *     tags: [Fines]
 *     parameters:
 *       - in: path
 *         name: fineId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the fine.
 *     responses:
 *       200:
 *         description: The fine record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fine deleted successfully
 *       404:
 *         description: Fine not found
 *       500:
 *         description: Server error
 */
router.delete('/:fineId', FinesController.deleteFine);

module.exports = router; 