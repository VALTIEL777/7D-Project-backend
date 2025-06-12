const express = require('express');
const TicketsController = require('../../controllers/ticket-logic/TicketsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Managing construction tickets
 */

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incidentId
 *               - cuadranteId
 *               - contractUnitId
 *               - wayfindingId
 *               - paymentId
 *               - mobilizationId
 *               - ticketCode
 *               - quantity
 *               - daysOutstanding
 *               - comment7d
 *               - PeopleGasComment
 *               - contractNumber
 *               - amountToPay
 *               - ticketType
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               incidentId:
 *                 type: integer
 *                 description: The ID of the associated incident.
 *                 example: 1
 *               cuadranteId:
 *                 type: integer
 *                 description: The ID of the associated quadrant.
 *                 example: 1
 *               contractUnitId:
 *                 type: integer
 *                 description: The ID of the associated contract unit.
 *                 example: 1
 *               wayfindingId:
 *                 type: integer
 *                 description: The ID of the associated wayfinding.
 *                 example: 1
 *               paymentId:
 *                 type: integer
 *                 description: The ID of the associated payment.
 *                 example: 1
 *               mobilizationId:
 *                 type: integer
 *                 description: The ID of the associated mobilization.
 *                 example: 1
 *               ticketCode:
 *                 type: string
 *                 description: The unique code for the ticket.
 *                 example: 'TKT001'
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: The quantity associated with the ticket.
 *                 example: 10.5
 *               daysOutstanding:
 *                 type: integer
 *                 description: Number of days the ticket is outstanding.
 *                 example: 5
 *               comment7d:
 *                 type: string
 *                 description: Comments from 7D.
 *                 example: Needs urgent attention.
 *               PeopleGasComment:
 *                 type: string
 *                 description: Comments from People Gas.
 *                 example: Approved for trenching.
 *               contractNumber:
 *                 type: string
 *                 description: The contract number associated with the ticket.
 *                 example: 'CONTR001'
 *               amountToPay:
 *                 type: number
 *                 format: float
 *                 description: The amount to be paid for this ticket.
 *                 example: 1500.00
 *               ticketType:
 *                 type: string
 *                 description: The type of ticket (e.g., 'Repair', 'Installation').
 *                 example: Repair
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
 *         description: The ticket was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: integer
 *                   description: The auto-generated ID of the ticket.
 *                   example: 1
 *                 ticketCode:
 *                   type: string
 *                   example: 'TKT001'
 *       500:
 *         description: Server error
 */
router.post('/', TicketsController.createTicket);

/**
 * @swagger
 * /tickets/{ticketId}:
 *   get:
 *     summary: Get a ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: Ticket found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *                 ticketCode:
 *                   type: string
 *                   example: 'TKT001'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/:ticketId', TicketsController.getTicketById);

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Retrieve a list of all tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: A list of tickets.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticketId:
 *                     type: integer
 *                     example: 1
 *                   ticketCode:
 *                     type: string
 *                     example: 'TKT001'
 *       500:
 *         description: Server error
 */
router.get('/', TicketsController.getAllTickets);

/**
 * @swagger
 * /tickets/{ticketId}:
 *   put:
 *     summary: Update a ticket by ID
 *     tags: [Tickets]
 *     parameters:
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
 *               incidentId:
 *                 type: integer
 *                 description: The updated ID of the associated incident.
 *                 example: 2
 *               cuadranteId:
 *                 type: integer
 *                 description: The updated ID of the associated quadrant.
 *                 example: 2
 *               contractUnitId:
 *                 type: integer
 *                 description: The updated ID of the associated contract unit.
 *                 example: 2
 *               wayfindingId:
 *                 type: integer
 *                 description: The updated ID of the associated wayfinding.
 *                 example: 2
 *               paymentId:
 *                 type: integer
 *                 description: The updated ID of the associated payment.
 *                 example: 2
 *               mobilizationId:
 *                 type: integer
 *                 description: The updated ID of the associated mobilization.
 *                 example: 2
 *               ticketCode:
 *                 type: string
 *                 description: The updated unique code for the ticket.
 *                 example: 'TKT002'
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: The updated quantity.
 *                 example: 12.0
 *               daysOutstanding:
 *                 type: integer
 *                 description: Updated number of days outstanding.
 *                 example: 7
 *               comment7d:
 *                 type: string
 *                 description: Updated comments from 7D.
 *                 example: On hold for material.
 *               PeopleGasComment:
 *                 type: string
 *                 description: Updated comments from People Gas.
 *                 example: Reroute gas line.
 *               contractNumber:
 *                 type: string
 *                 description: The updated contract number.
 *                 example: 'CONTR002'
 *               amountToPay:
 *                 type: number
 *                 format: float
 *                 description: The updated amount to be paid.
 *                 example: 1650.00
 *               ticketType:
 *                 type: string
 *                 description: The updated type of ticket.
 *                 example: Installation
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The ticket was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *                 ticketCode:
 *                   type: string
 *                   example: 'TKT002'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.put('/:ticketId', TicketsController.updateTicket);

/**
 * @swagger
 * /tickets/{ticketId}:
 *   delete:
 *     summary: Delete a ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: The ticket was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ticket deleted successfully
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.delete('/:ticketId', TicketsController.deleteTicket);

module.exports = router; 