const express = require('express');
const TicketStatusController = require('../../controllers/route/TicketStatusController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ticket Status
 *   description: Managing the status of tickets with associated crews and dates
 */

/**
 * @swagger
 * /ticketstatus:
 *   post:
 *     summary: Create a new ticket status entry
 *     tags: [Ticket Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskStatusId
 *               - ticketId
 *               - crewId
 *               - startingDate
 *               - endingDate
 *               - observation
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               taskStatusId:
 *                 type: integer
 *                 description: The ID of the associated task status.
 *                 example: 1
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the associated ticket.
 *                 example: 1
 *               crewId:
 *                 type: integer
 *                 description: The ID of the crew assigned to this ticket status.
 *                 example: 1
 *               startingDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the ticket status.
 *                 example: 2023-01-01
 *               endingDate:
 *                 type: string
 *                 format: date
 *                 description: The end date of the ticket status.
 *                 example: 2023-01-05
 *               observation:
 *                 type: string
 *                 description: Any observations regarding the ticket status.
 *                 example: Work started on time.
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
 *         description: The ticket status entry was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStatusId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', TicketStatusController.createTicketStatus);

/**
 * @swagger
 * /ticketstatus/{taskStatusId}/{ticketId}:
 *   get:
 *     summary: Get a ticket status entry by task status ID and ticket ID
 *     tags: [Ticket Status]
 *     parameters:
 *       - in: path
 *         name: taskStatusId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the task status.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: Ticket status entry found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStatusId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Ticket status entry not found
 *       500:
 *         description: Server error
 */
router.get('/:taskStatusId/:ticketId', TicketStatusController.getTicketStatusById);

/**
 * @swagger
 * /ticketstatus:
 *   get:
 *     summary: Retrieve a list of all ticket status entries
 *     tags: [Ticket Status]
 *     responses:
 *       200:
 *         description: A list of ticket status entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   taskStatusId:
 *                     type: integer
 *                     example: 1
 *                   ticketId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', TicketStatusController.getAllTicketStatuses);

/**
 * @swagger
 * /ticketstatus/{taskStatusId}/{ticketId}:
 *   put:
 *     summary: Update a ticket status entry by task status ID and ticket ID
 *     tags: [Ticket Status]
 *     parameters:
 *       - in: path
 *         name: taskStatusId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the task status.
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
 *               crewId:
 *                 type: integer
 *                 description: The updated ID of the crew.
 *                 example: 2
 *               startingDate:
 *                 type: string
 *                 format: date
 *                 description: The updated start date.
 *                 example: 2023-01-02
 *               endingDate:
 *                 type: string
 *                 format: date
 *                 description: The updated end date.
 *                 example: 2023-01-06
 *               observation:
 *                 type: string
 *                 description: Updated observations.
 *                 example: Work completed ahead of schedule.
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The ticket status entry was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStatusId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Ticket status entry not found
 *       500:
 *         description: Server error
 */
router.put('/:taskStatusId/:ticketId', TicketStatusController.updateTicketStatus);

/**
 * @swagger
 * /ticketstatus/{taskStatusId}/{ticketId}:
 *   delete:
 *     summary: Delete a ticket status entry by task status ID and ticket ID
 *     tags: [Ticket Status]
 *     parameters:
 *       - in: path
 *         name: taskStatusId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the task status.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: The ticket status entry was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: TicketStatus deleted successfully
 *       404:
 *         description: Ticket status entry not found
 *       500:
 *         description: Server error
 */
router.delete('/:taskStatusId/:ticketId', TicketStatusController.deleteTicketStatus);

module.exports = router; 