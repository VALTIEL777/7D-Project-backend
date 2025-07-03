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
 * /routes:
 *   get:
 *     summary: Get all active routes
 *     tags: [Routes]
 *     description: Retrieves all active routes regardless of their type. Returns routes ordered by creation date (newest first).
 *     responses:
 *       200:
 *         description: Active routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Active routes retrieved successfully"
 *                 count:
 *                   type: integer
 *                   description: Number of routes returned
 *                   example: 15
 *                 routes:
 *                   type: array
 *                   description: Array of route objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: integer
 *                         description: Unique identifier for the route
 *                         example: 1
 *                       routeCode:
 *                         type: string
 *                         description: Route code/name
 *                         example: "SPOTTER-2024-001"
 *                       type:
 *                         type: string
 *                         description: Type of route
 *                         example: "SPOTTER"
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Start date of the route
 *                         example: "2024-06-01"
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: End date of the route
 *                         example: "2024-06-02"
 *                       totalDistance:
 *                         type: number
 *                         description: Total distance in meters
 *                         example: 15420.5
 *                       totalDuration:
 *                         type: number
 *                         description: Total duration in seconds
 *                         example: 1800
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Route creation timestamp
 *                         example: "2024-06-01T10:30:00Z"
 *       500:
 *         description: Server error
 */
router.get('/', RoutesController.getAllActiveRoutes);

/**
 * @swagger
 * /routes/type/{type}:
 *   get:
 *     summary: Get routes by type
 *     tags: [Routes]
 *     description: Retrieves all active routes of a specific type. Valid types are SPOTTER, CONCRETE, ASPHALT, and default.
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SPOTTER, CONCRETE, ASPHALT, default]
 *         description: Type of routes to retrieve
 *         example: "SPOTTER"
 *     responses:
 *       200:
 *         description: Routes of specified type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SPOTTER routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   description: The route type that was requested
 *                   example: "SPOTTER"
 *                 count:
 *                   type: integer
 *                   description: Number of routes returned
 *                   example: 5
 *                 routes:
 *                   type: array
 *                   description: Array of route objects of the specified type
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: integer
 *                         description: Unique identifier for the route
 *                         example: 1
 *                       routeCode:
 *                         type: string
 *                         description: Route code/name
 *                         example: "SPOTTER-2024-001"
 *                       type:
 *                         type: string
 *                         description: Type of route
 *                         example: "SPOTTER"
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Start date of the route
 *                         example: "2024-06-01"
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: End date of the route
 *                         example: "2024-06-02"
 *                       totalDistance:
 *                         type: number
 *                         description: Total distance in meters
 *                         example: 15420.5
 *                       totalDuration:
 *                         type: number
 *                         description: Total duration in seconds
 *                         example: 1800
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Route creation timestamp
 *                         example: "2024-06-01T10:30:00Z"
 *       400:
 *         description: Invalid route type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid route type"
 *                 validTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["SPOTTER", "CONCRETE", "ASPHALT", "default"]
 *       500:
 *         description: Server error
 */
router.get('/type/:type', RoutesController.getRoutesByType);

/**
 * @swagger
 * /routes/spotting:
 *   get:
 *     summary: Get all spotting routes
 *     tags: [Routes]
 *     description: Retrieves all active spotting routes. This is a convenience endpoint equivalent to /routes/type/SPOTTER.
 *     responses:
 *       200:
 *         description: Spotting routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Spotting routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   example: "SPOTTER"
 *                 count:
 *                   type: integer
 *                   description: Number of spotting routes returned
 *                   example: 5
 *                 routes:
 *                   type: array
 *                   description: Array of spotting route objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: integer
 *                         description: Unique identifier for the route
 *                         example: 1
 *                       routeCode:
 *                         type: string
 *                         description: Route code/name
 *                         example: "SPOTTER-2024-001"
 *                       type:
 *                         type: string
 *                         description: Type of route
 *                         example: "SPOTTER"
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Start date of the route
 *                         example: "2024-06-01"
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: End date of the route
 *                         example: "2024-06-02"
 *                       totalDistance:
 *                         type: number
 *                         description: Total distance in meters
 *                         example: 15420.5
 *                       totalDuration:
 *                         type: number
 *                         description: Total duration in seconds
 *                         example: 1800
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Route creation timestamp
 *                         example: "2024-06-01T10:30:00Z"
 *                       tickets:
 *                         type: array
 *                         description: Array of tickets associated with this route
 *                         items:
 *                           type: object
 *                           properties:
 *                             ticketId:
 *                               type: integer
 *                               description: Unique identifier for the ticket
 *                               example: 101
 *                             ticketCode:
 *                               type: string
 *                               description: Ticket code/name
 *                               example: "TICKET-001"
 *                             address:
 *                               type: string
 *                               description: Full address of the ticket location
 *                               example: "123 Main St, Chicago, IL"
 *                             queue:
 *                               type: integer
 *                               description: Position in the optimized route order
 *                               example: 0
 *                             quantity:
 *                               type: integer
 *                               description: Quantity for this ticket
 *                               example: 1
 *                             amountToPay:
 *                               type: number
 *                               description: Amount to pay for this ticket
 *                               example: 150.00
 *       500:
 *         description: Server error
 */
router.get('/spotting', RoutesController.getSpottingRoutes);

/**
 * @swagger
 * /routes/concrete:
 *   get:
 *     summary: Get all concrete routes
 *     tags: [Routes]
 *     description: Retrieves all active concrete routes. This is a convenience endpoint equivalent to /routes/type/CONCRETE.
 *     responses:
 *       200:
 *         description: Concrete routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Concrete routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   example: "CONCRETE"
 *                 count:
 *                   type: integer
 *                   description: Number of concrete routes returned
 *                   example: 3
 *                 routes:
 *                   type: array
 *                   description: Array of concrete route objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: integer
 *                         description: Unique identifier for the route
 *                         example: 2
 *                       routeCode:
 *                         type: string
 *                         description: Route code/name
 *                         example: "CONCRETE-2024-001"
 *                       type:
 *                         type: string
 *                         description: Type of route
 *                         example: "CONCRETE"
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Start date of the route
 *                         example: "2024-06-01"
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: End date of the route
 *                         example: "2024-06-02"
 *                       totalDistance:
 *                         type: number
 *                         description: Total distance in meters
 *                         example: 12450.3
 *                       totalDuration:
 *                         type: number
 *                         description: Total duration in seconds
 *                         example: 1500
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Route creation timestamp
 *                         example: "2024-06-01T11:30:00Z"
 *                       tickets:
 *                         type: array
 *                         description: Array of tickets associated with this route
 *                         items:
 *                           type: object
 *                           properties:
 *                             ticketId:
 *                               type: integer
 *                               description: Unique identifier for the ticket
 *                               example: 101
 *                             ticketCode:
 *                               type: string
 *                               description: Ticket code/name
 *                               example: "TICKET-001"
 *                             address:
 *                               type: string
 *                               description: Full address of the ticket location
 *                               example: "123 Main St, Chicago, IL"
 *                             queue:
 *                               type: integer
 *                               description: Position in the optimized route order
 *                               example: 0
 *                             quantity:
 *                               type: integer
 *                               description: Quantity for this ticket
 *                               example: 1
 *                             amountToPay:
 *                               type: number
 *                               description: Amount to pay for this ticket
 *                               example: 150.00
 *       500:
 *         description: Server error
 */
router.get('/concrete', RoutesController.getConcreteRoutes);

/**
 * @swagger
 * /routes/asphalt:
 *   get:
 *     summary: Get all asphalt routes
 *     tags: [Routes]
 *     description: Retrieves all active asphalt routes. This is a convenience endpoint equivalent to /routes/type/ASPHALT.
 *     responses:
 *       200:
 *         description: Asphalt routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asphalt routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   example: "ASPHALT"
 *                 count:
 *                   type: integer
 *                   description: Number of asphalt routes returned
 *                   example: 7
 *                 routes:
 *                   type: array
 *                   description: Array of asphalt route objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: integer
 *                         description: Unique identifier for the route
 *                         example: 3
 *                       routeCode:
 *                         type: string
 *                         description: Route code/name
 *                         example: "ASPHALT-2024-001"
 *                       type:
 *                         type: string
 *                         description: Type of route
 *                         example: "ASPHALT"
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         description: Start date of the route
 *                         example: "2024-06-01"
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         description: End date of the route
 *                         example: "2024-06-02"
 *                       totalDistance:
 *                         type: number
 *                         description: Total distance in meters
 *                         example: 18250.7
 *                       totalDuration:
 *                         type: number
 *                         description: Total duration in seconds
 *                         example: 2100
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Route creation timestamp
 *                         example: "2024-06-01T12:30:00Z"
 *                       tickets:
 *                         type: array
 *                         description: Array of tickets associated with this route
 *                         items:
 *                           type: object
 *                           properties:
 *                             ticketId:
 *                               type: integer
 *                               description: Unique identifier for the ticket
 *                               example: 101
 *                             ticketCode:
 *                               type: string
 *                               description: Ticket code/name
 *                               example: "TICKET-001"
 *                             address:
 *                               type: string
 *                               description: Full address of the ticket location
 *                               example: "123 Main St, Chicago, IL"
 *                             queue:
 *                               type: integer
 *                               description: Position in the optimized route order
 *                               example: 0
 *                             quantity:
 *                               type: integer
 *                               description: Quantity for this ticket
 *                               example: 1
 *                             amountToPay:
 *                               type: number
 *                               description: Amount to pay for this ticket
 *                               example: 150.00
 *       500:
 *         description: Server error
 */
router.get('/asphalt', RoutesController.getAsphaltRoutes);

/**
 * @swagger
 * /routes/tickets-ready/spotting:
 *   get:
 *     summary: Get tickets ready for spotting routes
 *     tags: [Routes]
 *     description: Retrieves all tickets that are ready for spotting route optimization, including their addresses. These tickets meet the criteria: comment7d is NULL, empty, or TK - PERMIT EXTENDED, and no endingDate for SPOTTING status.
 *     responses:
 *       200:
 *         description: Tickets ready for spotting routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tickets ready for spotting routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   example: "SPOTTER"
 *                 count:
 *                   type: integer
 *                   description: Number of tickets ready for spotting
 *                   example: 15
 *                 criteria:
 *                   type: string
 *                   description: Selection criteria used
 *                   example: "comment7d is NULL, empty, or TK - PERMIT EXTENDED, and no endingDate for SPOTTING status"
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets ready for spotting routes
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         description: Unique identifier for the ticket
 *                         example: 101
 *                       ticketCode:
 *                         type: string
 *                         description: Ticket code/name
 *                         example: "TICKET-001"
 *                       contractNumber:
 *                         type: string
 *                         description: Contract number
 *                         example: "CONTRACT-2024-001"
 *                       amountToPay:
 *                         type: number
 *                         description: Amount to pay for this ticket
 *                         example: 150.00
 *                       ticketType:
 *                         type: string
 *                         description: Type of ticket
 *                         example: "regular"
 *                       daysOutstanding:
 *                         type: integer
 *                         description: Days outstanding
 *                         example: 5
 *                       comment7d:
 *                         type: string
 *                         description: 7-day comment
 *                         example: "TK - PERMIT EXTENDED"
 *                       quantity:
 *                         type: integer
 *                         description: Quantity for this ticket
 *                         example: 1
 *                       address:
 *                         type: string
 *                         description: Full address of the ticket location
 *                         example: "123 Main St, Chicago, IL"
 *                       contractUnitName:
 *                         type: string
 *                         description: Name of the contract unit
 *                         example: "Pavement Repair"
 *                       incidentName:
 *                         type: string
 *                         description: Name of the incident
 *                         example: "Pothole Repair"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Ticket creation timestamp
 *                         example: "2024-06-01T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Ticket last update timestamp
 *                         example: "2024-06-01T10:30:00Z"
 *       500:
 *         description: Server error
 */
router.get('/tickets-ready/spotting', RoutesController.getTicketsReadyForSpotting);

/**
 * @swagger
 * /routes/tickets-ready/concrete:
 *   get:
 *     summary: Get tickets ready for concrete routes
 *     tags: [Routes]
 *     description: Retrieves all tickets that are ready for concrete route optimization, including their addresses. These tickets meet the criteria: SPOTTING completed (has endingDate) and has SAWCUT status.
 *     responses:
 *       200:
 *         description: Tickets ready for concrete routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tickets ready for concrete routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   example: "CONCRETE"
 *                 count:
 *                   type: integer
 *                   description: Number of tickets ready for concrete
 *                   example: 8
 *                 criteria:
 *                   type: string
 *                   description: Selection criteria used
 *                   example: "SPOTTING completed (has endingDate) and has SAWCUT status"
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets ready for concrete routes
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         description: Unique identifier for the ticket
 *                         example: 201
 *                       ticketCode:
 *                         type: string
 *                         description: Ticket code/name
 *                         example: "TICKET-201"
 *                       contractNumber:
 *                         type: string
 *                         description: Contract number
 *                         example: "CONTRACT-2024-201"
 *                       amountToPay:
 *                         type: number
 *                         description: Amount to pay for this ticket
 *                         example: 450.00
 *                       ticketType:
 *                         type: string
 *                         description: Type of ticket
 *                         example: "regular"
 *                       daysOutstanding:
 *                         type: integer
 *                         description: Days outstanding
 *                         example: 2
 *                       comment7d:
 *                         type: string
 *                         description: 7-day comment
 *                         example: null
 *                       quantity:
 *                         type: integer
 *                         description: Quantity for this ticket
 *                         example: 3
 *                       address:
 *                         type: string
 *                         description: Full address of the ticket location
 *                         example: "789 Pine St, Chicago, IL"
 *                       contractUnitName:
 *                         type: string
 *                         description: Name of the contract unit
 *                         example: "Concrete Repair"
 *                       incidentName:
 *                         type: string
 *                         description: Name of the incident
 *                         example: "Sidewalk Repair"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Ticket creation timestamp
 *                         example: "2024-06-01T12:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Ticket last update timestamp
 *                         example: "2024-06-01T12:30:00Z"
 *       500:
 *         description: Server error
 */
router.get('/tickets-ready/concrete', RoutesController.getTicketsReadyForConcrete);

/**
 * @swagger
 * /routes/tickets-ready/asphalt:
 *   get:
 *     summary: Get tickets ready for asphalt routes
 *     tags: [Routes]
 *     description: Retrieves all tickets that are ready for asphalt route optimization, including their addresses. These tickets meet the criteria: SPOTTING completed and either has GRINDING status (no SAWCUT) or all concrete phases completed.
 *     responses:
 *       200:
 *         description: Tickets ready for asphalt routes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tickets ready for asphalt routes retrieved successfully"
 *                 type:
 *                   type: string
 *                   example: "ASPHALT"
 *                 count:
 *                   type: integer
 *                   description: Number of tickets ready for asphalt
 *                   example: 12
 *                 criteria:
 *                   type: string
 *                   description: Selection criteria used
 *                   example: "SPOTTING completed and either has GRINDING status (no SAWCUT) OR all concrete phases completed"
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets ready for asphalt routes
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         description: Unique identifier for the ticket
 *                         example: 301
 *                       ticketCode:
 *                         type: string
 *                         description: Ticket code/name
 *                         example: "TICKET-301"
 *                       contractNumber:
 *                         type: string
 *                         description: Contract number
 *                         example: "CONTRACT-2024-301"
 *                       amountToPay:
 *                         type: number
 *                         description: Amount to pay for this ticket
 *                         example: 750.00
 *                       ticketType:
 *                         type: string
 *                         description: Type of ticket
 *                         example: "regular"
 *                       daysOutstanding:
 *                         type: integer
 *                         description: Days outstanding
 *                         example: 0
 *                       comment7d:
 *                         type: string
 *                         description: 7-day comment
 *                         example: null
 *                       quantity:
 *                         type: integer
 *                         description: Quantity for this ticket
 *                         example: 5
 *                       address:
 *                         type: string
 *                         description: Full address of the ticket location
 *                         example: "654 Maple Ave, Chicago, IL"
 *                       contractUnitName:
 *                         type: string
 *                         description: Name of the contract unit
 *                         example: "Asphalt Paving"
 *                       incidentName:
 *                         type: string
 *                         description: Name of the incident
 *                         example: "Road Resurfacing"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Ticket creation timestamp
 *                         example: "2024-06-01T14:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Ticket last update timestamp
 *                         example: "2024-06-01T14:30:00Z"
 *       500:
 *         description: Server error
 */
router.get('/tickets-ready/asphalt', RoutesController.getTicketsReadyForAsphalt);

/**
 * @swagger
 * /routes/test:
 *   get:
 *     summary: Test database connection and Routes table
 *     tags: [Routes]
 *     description: Simple test endpoint to verify database connection and Routes table accessibility
 *     responses:
 *       200:
 *         description: Database test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database connection and Routes table test successful"
 *                 totalRoutes:
 *                   type: integer
 *                   description: Total number of routes in the database
 *                   example: 5
 *                 status:
 *                   type: string
 *                   example: "OK"
 *       500:
 *         description: Database test failed
 */
router.get('/test', RoutesController.testRoutesTable);

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

/**
 * @swagger
 * /routes/optimize:
 *   post:
 *     summary: Optimize and create a new route with tickets
 *     tags: [Routes]
 *     description: Creates a new optimized route using Google Maps Routes API v2 with automatic waypoint optimization. The route will include all specified tickets in an optimized order for efficient travel. If originAddress and destinationAddress are not provided, they will default to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos".
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketIds
 *               - routeCode
 *               - type
 *               - startDate
 *               - endDate
 *             properties:
 *               ticketIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of ticket IDs to include in the route optimization
 *                 example: [1, 2, 3, 4]
 *                 minItems: 1
 *                 maxItems: 158
 *               routeCode:
 *                 type: string
 *                 description: Unique identifier for the route
 *                 example: "ROUTE-2024-001"
 *               type:
 *                 type: string
 *                 description: Type of route work (e.g., concrete, asphalt)
 *                 example: "concrete"
 *                 enum: [concrete, asphalt, mixed]
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the route
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for the route
 *                 example: "2024-06-02"
 *               originAddress:
 *                 type: string
 *                 description: Starting address (depot or first location). If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *               destinationAddress:
 *                 type: string
 *                 description: Ending address (can be same as origin for round trips). If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *     responses:
 *       200:
 *         description: Route optimized and created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Route optimized and saved successfully"
 *                 routeId:
 *                   type: integer
 *                   description: ID of the created route
 *                   example: 123
 *                 routeCode:
 *                   type: string
 *                   description: Route code
 *                   example: "ROUTE-2024-001"
 *                 totalDistance:
 *                   type: number
 *                   description: Total distance in meters
 *                   example: 15420.5
 *                 totalDuration:
 *                   type: number
 *                   description: Total duration in seconds
 *                   example: 1800
 *                 optimizedOrder:
 *                   type: array
 *                   description: Optimized order of waypoints (0 = origin, 1+ = ticket addresses)
 *                   items:
 *                     type: integer
 *                   example: [0, 2, 1, 3, 4]
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets in optimized order
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         example: 1
 *                       ticketCode:
 *                         type: string
 *                         example: "TK6514243"
 *                       address:
 *                         type: string
 *                         example: "123 N Main St, Chicago, IL"
 *                       queue:
 *                         type: integer
 *                         description: Position in the route
 *                         example: 1
 *                 originAddress:
 *                   type: string
 *                   description: The origin address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 destinationAddress:
 *                   type: string
 *                   description: The destination address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "At least one ticket ID is required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to optimize route"
 *                 details:
 *                   type: string
 *                   example: "Google Maps API error"
 */
router.post('/optimize', RoutesController.optimizeRoute);

/**
 * @swagger
 * /routes/optimize/spotting:
 *   post:
 *     summary: Optimize and create a spotting route
 *     tags: [Routes]
 *     description: Creates an optimized route for spotter teams. Automatically selects tickets where comment7d is NULL, empty, or TK - PERMIT EXTENDED, and the ticket has no endingDate for its SPOTTING status. If originAddress and destinationAddress are not provided, they will default to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos".
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *             properties:
 *               routeCode:
 *                 type: string
 *                 description: Unique identifier for the route (optional, will auto-generate if not provided)
 *                 example: "SPOTTER-2024-001"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the route
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for the route (optional, will default to current date if not provided)
 *                 example: "2024-06-02"
 *               originAddress:
 *                 type: string
 *                 description: Starting address (depot). If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *               destinationAddress:
 *                 type: string
 *                 description: Ending address. If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *     responses:
 *       200:
 *         description: Spotting route optimized and created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Spotting route optimized and saved successfully"
 *                 routeId:
 *                   type: integer
 *                   description: ID of the created route
 *                   example: 123
 *                 routeCode:
 *                   type: string
 *                   description: Route code
 *                   example: "SPOTTER-2024-001"
 *                 totalDistance:
 *                   type: number
 *                   description: Total distance in meters
 *                   example: 15420.5
 *                 totalDuration:
 *                   type: number
 *                   description: Total duration in seconds
 *                   example: 1800
 *                 optimizedOrder:
 *                   type: array
 *                   description: Optimized order of waypoints
 *                   items:
 *                     type: integer
 *                   example: [0, 2, 1, 3, 4]
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets in optimized order
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         example: 1
 *                       ticketCode:
 *                         type: string
 *                         example: "TK6514243"
 *                       address:
 *                         type: string
 *                         example: "123 N Main St, Chicago, IL"
 *                       queue:
 *                         type: integer
 *                         description: Position in the route
 *                         example: 1
 *                 originAddress:
 *                   type: string
 *                   description: The origin address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 destinationAddress:
 *                   type: string
 *                   description: The destination address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 routeType:
 *                   type: string
 *                   description: Type of route
 *                   example: "SPOTTER"
 *                 ticketCount:
 *                   type: integer
 *                   description: Number of tickets in the route
 *                   example: 15
 *       404:
 *         description: No tickets found for spotting routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No tickets found for spotting routes"
 *                 criteria:
 *                   type: string
 *                   example: "comment7d is NULL, empty, or TK - PERMIT EXTENDED, and no endingDate for SPOTTING status"
 *       500:
 *         description: Server error
 */
router.post('/optimize/spotting', RoutesController.optimizeSpottingRoute);

/**
 * @swagger
 * /routes/optimize/concrete:
 *   post:
 *     summary: Optimize and create a concrete route
 *     tags: [Routes]
 *     description: Creates an optimized route for concrete operations. Automatically selects tickets where SPOTTING is completed (has endingDate) and the ticket has a SAWCUT status. If originAddress and destinationAddress are not provided, they will default to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos".
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *             properties:
 *               routeCode:
 *                 type: string
 *                 description: Unique identifier for the route (optional, will auto-generate if not provided)
 *                 example: "CONCRETE-2024-001"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the route
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for the route (optional, will default to current date if not provided)
 *                 example: "2024-06-02"
 *               originAddress:
 *                 type: string
 *                 description: Starting address (depot). If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *               destinationAddress:
 *                 type: string
 *                 description: Ending address. If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *     responses:
 *       200:
 *         description: Concrete route optimized and created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Concrete route optimized and saved successfully"
 *                 routeId:
 *                   type: integer
 *                   description: ID of the created route
 *                   example: 123
 *                 routeCode:
 *                   type: string
 *                   description: Route code
 *                   example: "CONCRETE-2024-001"
 *                 totalDistance:
 *                   type: number
 *                   description: Total distance in meters
 *                   example: 15420.5
 *                 totalDuration:
 *                   type: number
 *                   description: Total duration in seconds
 *                   example: 1800
 *                 optimizedOrder:
 *                   type: array
 *                   description: Optimized order of waypoints
 *                   items:
 *                     type: integer
 *                   example: [0, 2, 1, 3, 4]
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets in optimized order
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         example: 1
 *                       ticketCode:
 *                         type: string
 *                         example: "TK6514243"
 *                       address:
 *                         type: string
 *                         example: "123 N Main St, Chicago, IL"
 *                       queue:
 *                         type: integer
 *                         description: Position in the route
 *                         example: 1
 *                 originAddress:
 *                   type: string
 *                   description: The origin address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 destinationAddress:
 *                   type: string
 *                   description: The destination address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 routeType:
 *                   type: string
 *                   description: Type of route
 *                   example: "CONCRETE"
 *                 ticketCount:
 *                   type: integer
 *                   description: Number of tickets in the route
 *                   example: 15
 *       404:
 *         description: No tickets found for concrete routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No tickets found for concrete routes"
 *                 criteria:
 *                   type: string
 *                   example: "SPOTTING completed (has endingDate) and has SAWCUT status"
 *       500:
 *         description: Server error
 */
router.post('/optimize/concrete', RoutesController.optimizeConcreteRoute);

/**
 * @swagger
 * /routes/optimize/asphalt:
 *   post:
 *     summary: Optimize and create an asphalt route
 *     tags: [Routes]
 *     description: Creates an optimized route for asphalt operations. Automatically selects tickets where SPOTTING is completed and either: 1) Has GRINDING status but no SAWCUT, or 2) All concrete phases completed (SAWCUT, REMOVAL, FRAMING, POURING). If originAddress and destinationAddress are not provided, they will default to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos".
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *             properties:
 *               routeCode:
 *                 type: string
 *                 description: Unique identifier for the route (optional, will auto-generate if not provided)
 *                 example: "ASPHALT-2024-001"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the route
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for the route (optional, will default to current date if not provided)
 *                 example: "2024-06-02"
 *               originAddress:
 *                 type: string
 *                 description: Starting address (depot). If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *               destinationAddress:
 *                 type: string
 *                 description: Ending address. If not provided, defaults to "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *     responses:
 *       200:
 *         description: Asphalt route optimized and created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asphalt route optimized and saved successfully"
 *                 routeId:
 *                   type: integer
 *                   description: ID of the created route
 *                   example: 123
 *                 routeCode:
 *                   type: string
 *                   description: Route code
 *                   example: "ASPHALT-2024-001"
 *                 totalDistance:
 *                   type: number
 *                   description: Total distance in meters
 *                   example: 15420.5
 *                 totalDuration:
 *                   type: number
 *                   description: Total duration in seconds
 *                   example: 1800
 *                 optimizedOrder:
 *                   type: array
 *                   description: Optimized order of waypoints
 *                   items:
 *                     type: integer
 *                   example: [0, 2, 1, 3, 4]
 *                 tickets:
 *                   type: array
 *                   description: Array of tickets in optimized order
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         example: 1
 *                       ticketCode:
 *                         type: string
 *                         example: "TK6514243"
 *                       address:
 *                         type: string
 *                         example: "123 N Main St, Chicago, IL"
 *                       queue:
 *                         type: integer
 *                         description: Position in the route
 *                         example: 1
 *                 originAddress:
 *                   type: string
 *                   description: The origin address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 destinationAddress:
 *                   type: string
 *                   description: The destination address used for optimization
 *                   example: "2000 W 43rd St, Chicago, IL 60609, Estados Unidos"
 *                 routeType:
 *                   type: string
 *                   description: Type of route
 *                   example: "ASPHALT"
 *                 ticketCount:
 *                   type: integer
 *                   description: Number of tickets in the route
 *                   example: 15
 *       404:
 *         description: No tickets found for asphalt routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No tickets found for asphalt routes"
 *                 criteria:
 *                   type: string
 *                   example: "SPOTTING completed and either has GRINDING status (no SAWCUT) or all concrete phases completed (SAWCUT, REMOVAL, FRAMING, POURING)"
 *       500:
 *         description: Server error
 */
router.post('/optimize/asphalt', RoutesController.optimizeAsphaltRoute);

/**
 * @swagger
 * /routes/{routeId}/optimized:
 *   get:
 *     summary: Get optimized route details
 *     tags: [Routes]
 *     description: Retrieves a route with its optimized ticket order and details
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route to retrieve
 *         example: 123
 *     responses:
 *       200:
 *         description: Optimized route details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 123
 *                 routeCode:
 *                   type: string
 *                   example: "ROUTE-2024-001"
 *                 type:
 *                   type: string
 *                   example: "concrete"
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   example: "2024-06-01"
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   example: "2024-06-02"
 *                 encodedPolyline:
 *                   type: string
 *                   description: Google Maps encoded polyline for the route
 *                   example: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
 *                 totalDistance:
 *                   type: number
 *                   description: Total distance in meters
 *                   example: 15420.5
 *                 totalDuration:
 *                   type: number
 *                   description: Total duration in seconds
 *                   example: 1800
 *                 optimizedOrder:
 *                   type: array
 *                   description: Optimized order of waypoints
 *                   items:
 *                     type: integer
 *                   example: [0, 2, 1, 3, 4]
 *                 optimizationMetadata:
 *                   type: object
 *                   description: Additional optimization metadata
 *                   example: {"algorithm": "Google Maps Routes API v2", "optimizationType": "waypoint"}
 *                 tickets:
 *                   type: array
 *                   description: Tickets in optimized order
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         example: 1
 *                       ticketCode:
 *                         type: string
 *                         example: "TK6514243"
 *                       address:
 *                         type: string
 *                         example: "123 N Main St, Chicago, IL"
 *                       queue:
 *                         type: integer
 *                         example: 1
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *                       amountToPay:
 *                         type: number
 *                         example: 1500.00
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Route not found"
 *       500:
 *         description: Server error
 */
router.get('/:routeId/optimized', RoutesController.getOptimizedRoute);

/**
 * @swagger
 * /routes/{routeId}/tickets:
 *   get:
 *     summary: Get tickets for a specific route
 *     tags: [Routes]
 *     description: Retrieves all tickets associated with a specific route
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route
 *         example: 123
 *     responses:
 *       200:
 *         description: Route tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   routeId:
 *                     type: integer
 *                     example: 123
 *                   ticketId:
 *                     type: integer
 *                     example: 1
 *                   address:
 *                     type: string
 *                     example: "123 N Main St, Chicago, IL"
 *                   queue:
 *                     type: integer
 *                     description: Position in the route
 *                     example: 1
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-06-01T10:00:00Z"
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.get('/:routeId/tickets', RoutesController.getRouteTickets);

/**
 * @swagger
 * /routes/{routeId}/tickets/{ticketId}/queue:
 *   put:
 *     summary: Update ticket position in route queue
 *     tags: [Routes]
 *     description: Updates the position (queue order) of a specific ticket within a route
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the route
 *         example: 123
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queue
 *             properties:
 *               queue:
 *                 type: integer
 *                 description: New position in the route (1-based)
 *                 example: 3
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Ticket queue position updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 routeId:
 *                   type: integer
 *                   example: 123
 *                 ticketId:
 *                   type: integer
 *                   example: 1
 *                 queue:
 *                   type: integer
 *                   example: 3
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-06-01T10:00:00Z"
 *       404:
 *         description: Route ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Route ticket not found"
 *       500:
 *         description: Server error
 */
router.put('/:routeId/tickets/:ticketId/queue', RoutesController.updateTicketQueue);

module.exports = router; 