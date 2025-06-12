const express = require('express');
const PermitedTicketsController = require('../../controllers/permissions/PermitedTicketsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permitted Tickets
 *   description: Managing associations between permits and tickets
 */

/**
 * @swagger
 * /permitedtickets:
 *   post:
 *     summary: Create a new permitted ticket association
 *     tags: [Permitted Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permitId
 *               - ticketId
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               permitId:
 *                 type: integer
 *                 description: The ID of the permit.
 *                 example: 1
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the ticket.
 *                 example: 1
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
 *         description: The permitted ticket association was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permitId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', PermitedTicketsController.createPermitedTickets);

/**
 * @swagger
 * /permitedtickets/{permitId}/{ticketId}:
 *   get:
 *     summary: Get a permitted ticket association by permit ID and ticket ID
 *     tags: [Permitted Tickets]
 *     parameters:
 *       - in: path
 *         name: permitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the permit.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: Permitted ticket association found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permitId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Permitted ticket association not found
 *       500:
 *         description: Server error
 */
router.get('/:permitId/:ticketId', PermitedTicketsController.getPermitedTicketsById);

/**
 * @swagger
 * /permitedtickets:
 *   get:
 *     summary: Retrieve a list of all permitted ticket associations
 *     tags: [Permitted Tickets]
 *     responses:
 *       200:S
 *         description: A list of permitted ticket associations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   permitId:
 *                     type: integer
 *                     example: 1
 *                   ticketId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', PermitedTicketsController.getAllPermitedTickets);

/**
 * @swagger
 * /permitedtickets/{permitId}/{ticketId}:
 *   put:
 *     summary: Update a permitted ticket association by permit ID and ticket ID
 *     tags: [Permitted Tickets]
 *     parameters:
 *       - in: path
 *         name: permitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the permit.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The permitted ticket association was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permitId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Permitted ticket association not found
 *       500:
 *         description: Server error
 */
router.put('/:permitId/:ticketId', PermitedTicketsController.updatePermitedTickets);

/**
 * @swagger
 * /permitedtickets/{permitId}/{ticketId}:
 *   delete:
 *     summary: Delete a permitted ticket association by permit ID and ticket ID
 *     tags: [Permitted Tickets]
 *     parameters:
 *       - in: path
 *         name: permitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the permit.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: The permitted ticket association was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PermitedTickets deleted successfully
 *       404:
 *         description: Permitted ticket association not found
 *       500:
 *         description: Server error
 */
router.delete('/:permitId/:ticketId', PermitedTicketsController.deletePermitedTickets);

module.exports = router; 