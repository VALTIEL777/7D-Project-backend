const express = require('express');
const RouteTicketsController = require('../../controllers/route/RouteTicketsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Route Tickets
 *   description: Managing tickets associated with routes
 */

/**
 * @swagger
 * /routetickets:
 *   post:
 *     summary: Create a new route ticket association
 *     tags: [Route Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeId
 *               - ticketId
 *               - queue
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               routeId:
 *                 type: integer
 *                 description: The ID of the route.
 *                 example: 1
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the ticket.
 *                 example: 1
 *               queue:
 *                 type: integer
 *                 description: The order of the ticket in the route queue.
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
 *         description: The route ticket association was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', RouteTicketsController.createRouteTickets);

/**
 * @swagger
 * /routetickets/{routeId}/{ticketId}:
 *   get:
 *     summary: Get a route ticket association by route ID and ticket ID
 *     tags: [Route Tickets]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: Route ticket association found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Route ticket association not found
 *       500:
 *         description: Server error
 */
router.get('/:routeId/:ticketId', RouteTicketsController.getRouteTicketsById);

/**
 * @swagger
 * /routetickets:
 *   get:
 *     summary: Retrieve a list of all route ticket associations
 *     tags: [Route Tickets]
 *     responses:
 *       200:
 *         description: A list of route ticket associations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   routeId:
 *                     type: integer
 *                     example: 1
 *                   ticketId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', RouteTicketsController.getAllRouteTickets);

/**
 * @swagger
 * /routetickets/{routeId}/{ticketId}:
 *   put:
 *     summary: Update a route ticket association by route ID and ticket ID
 *     tags: [Route Tickets]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route.
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
 *               queue:
 *                 type: integer
 *                 description: The updated order of the ticket in the route queue.
 *                 example: 2
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The route ticket association was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 1
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Route ticket association not found
 *       500:
 *         description: Server error
 */
router.put('/:routeId/:ticketId', RouteTicketsController.updateRouteTickets);

/**
 * @swagger
 * /routetickets/{routeId}/{ticketId}:
 *   delete:
 *     summary: Delete a route ticket association by route ID and ticket ID
 *     tags: [Route Tickets]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route.
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket.
 *     responses:
 *       200:
 *         description: The route ticket association was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: RouteTickets deleted successfully
 *       404:
 *         description: Route ticket association not found
 *       500:
 *         description: Server error
 */
router.delete('/:routeId/:ticketId', RouteTicketsController.deleteRouteTickets);

module.exports = router; 