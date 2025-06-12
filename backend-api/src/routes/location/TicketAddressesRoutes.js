const express = require('express');
const TicketAddressesController = require('../../controllers/location/TicketAddressesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ticket Addresses
 *   description: Managing addresses associated with tickets
 */

/**
 * @swagger
 * /ticketaddresses:
 *   post:
 *     summary: Create a new ticket address association
 *     tags: [Ticket Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *               - addressId
 *               - ispartner
 *               - is7d
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the ticket.
 *                 example: 1
 *               addressId:
 *                 type: integer
 *                 description: The ID of the address.
 *                 example: 1
 *               ispartner:
 *                 type: boolean
 *                 description: Indicates if the address is for a partner.
 *                 example: true
 *               is7d:
 *                 type: boolean
 *                 description: Indicates if the address is for 7D.
 *                 example: false
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
 *         description: The ticket address association was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', TicketAddressesController.createTicketAddresses);

/**
 * @swagger
 * /ticketaddresses/{ticketId}/{addressId}:
 *   get:
 *     summary: Get a ticket address association by ticket ID and address ID
 *     tags: [Ticket Addresses]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     responses:
 *       200:
 *         description: Ticket address association found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Ticket address association not found
 *       500:
 *         description: Server error
 */
router.get('/:ticketId/:addressId', TicketAddressesController.getTicketAddressesById);

/**
 * @swagger
 * /ticketaddresses:
 *   get:
 *     summary: Retrieve a list of all ticket address associations
 *     tags: [Ticket Addresses]
 *     responses:
 *       200:
 *         description: A list of ticket address associations.
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
 *                   addressId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', TicketAddressesController.getAllTicketAddresses);

/**
 * @swagger
 * /ticketaddresses/{ticketId}/{addressId}:
 *   put:
 *     summary: Update a ticket address association by ticket ID and address ID
 *     tags: [Ticket Addresses]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ispartner:
 *                 type: boolean
 *                 description: Updated partner status.
 *                 example: false
 *               is7d:
 *                 type: boolean
 *                 description: Updated 7D status.
 *                 example: true
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The ticket address association was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Ticket address association not found
 *       500:
 *         description: Server error
 */
router.put('/:ticketId/:addressId', TicketAddressesController.updateTicketAddresses);

/**
 * @swagger
 * /ticketaddresses/{ticketId}/{addressId}:
 *   delete:
 *     summary: Delete a ticket address association by ticket ID and address ID
 *     tags: [Ticket Addresses]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     responses:
 *       200:
 *         description: The ticket address association was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: TicketAddresses deleted successfully
 *       404:
 *         description: Ticket address association not found
 *       500:
 *         description: Server error
 */
router.delete('/:ticketId/:addressId', TicketAddressesController.deleteTicketAddresses);

module.exports = router; 