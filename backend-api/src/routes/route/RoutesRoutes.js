const express = require('express');
const RoutesController = require('../../controllers/route/RoutesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Managing routes for ticket deliveries
 */

/**
 * @swagger
 * /routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeCode
 *               - type
 *               - startDate
 *               - endDate
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               routeCode:
 *                 type: string
 *                 description: The unique code for the route.
 *                 example: 'ROUTE001'
 *               type:
 *                 type: string
 *                 description: The type of route (e.g., concrete, asphalt).
 *                 example: concrete
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the route.
 *                 example: 2023-01-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: The end date of the route.
 *                 example: 2023-01-05
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
 *         description: The route record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   description: The auto-generated ID of the route.
 *                   example: 1
 *                 routeCode:
 *                   type: string
 *                   example: 'ROUTE001'
 *       500:
 *         description: Server error
 */
router.post('/', RoutesController.createRoute);

/**
 * @swagger
 * /routes/{routeId}:
 *   get:
 *     summary: Get a route record by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route.
 *     responses:
 *       200:
 *         description: Route record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 1
 *                 routeCode:
 *                   type: string
 *                   example: 'ROUTE001'
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.get('/:routeId', RoutesController.getRouteById);

/**
 * @swagger
 * /routes:
 *   get:
 *     summary: Retrieve a list of all route records
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: A list of route records.
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
 *                   routeCode:
 *                     type: string
 *                     example: 'ROUTE001'
 *       500:
 *         description: Server error
 */
router.get('/', RoutesController.getAllRoutes);

/**
 * @swagger
 * /routes/{routeId}:
 *   put:
 *     summary: Update a route record by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routeCode:
 *                 type: string
 *                 description: The updated route code.
 *                 example: 'ROUTE002'
 *               type:
 *                 type: string
 *                 description: The updated type of route.
 *                 example: asphalt
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The updated start date.
 *                 example: 2023-01-06
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: The updated end date.
 *                 example: 2023-01-10
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The route record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 1
 *                 routeCode:
 *                   type: string
 *                   example: 'ROUTE002'
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.put('/:routeId', RoutesController.updateRoute);

/**
 * @swagger
 * /routes/{routeId}:
 *   delete:
 *     summary: Delete a route record by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route.
 *     responses:
 *       200:
 *         description: The route record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Route deleted successfully
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.delete('/:routeId', RoutesController.deleteRoute);

// Route optimization endpoints
router.post('/optimize', RoutesController.optimizeRoute);
router.get('/:routeId/optimized', RoutesController.getOptimizedRoute);
router.get('/:routeId/tickets', RoutesController.getRouteTickets);
router.put('/:routeId/tickets/:ticketId/queue', RoutesController.updateTicketQueue);

module.exports = router; 