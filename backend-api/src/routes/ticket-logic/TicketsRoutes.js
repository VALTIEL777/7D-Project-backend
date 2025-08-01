const express = require('express');
const TicketsController = require('../../controllers/ticket-logic/TicketsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Managing tickets for construction work
 */

/**
 * @swagger
 * /tickets/with-issues:
 *   get:
 *     summary: Get tickets with issues
 *     tags: [Tickets]
 *     description: Retrieve all tickets with comment7d values of "TK - ON HOLD OFF", "TK - WILL BE SCHEDULE", or "TK - NEEDS PERMIT EXTENSION" along with their crew comments from task statuses
 *     responses:
 *       200:
 *         description: Tickets with issues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tickets with issues retrieved successfully"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalTickets:
 *                       type: integer
 *                       description: Total number of tickets with issues
 *                       example: 15
 *                     ticketsOnHoldOff:
 *                       type: integer
 *                       description: Number of tickets with "TK - ON HOLD OFF" status
 *                       example: 5
 *                     ticketsWillBeScheduled:
 *                       type: integer
 *                       description: Number of tickets with "TK - WILL BE SCHEDULE" status
 *                       example: 7
 *                     ticketsNeedsPermitExtension:
 *                       type: integer
 *                       description: Number of tickets with "TK - NEEDS PERMIT EXTENSION" status
 *                       example: 3
 *                     ticketsWithCrewComments:
 *                       type: integer
 *                       description: Number of tickets that have crew comments
 *                       example: 12
 *                     totalCrewComments:
 *                       type: integer
 *                       description: Total number of crew comments across all tickets
 *                       example: 25
 *                 data:
 *                   type: array
 *                   description: Array of tickets with issues and their crew comments
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         description: The ticket ID
 *                         example: 123
 *                       ticketCode:
 *                         type: string
 *                         description: The ticket code
 *                         example: "TK6514243"
 *                       contractNumber:
 *                         type: string
 *                         description: The contract number
 *                         example: "CONTRACT-2024-001"
 *                       contractUnitName:
 *                         type: string
 *                         description: The contract unit name
 *                         example: "Concrete Repair"
 *                       amountToPay:
 *                         type: number
 *                         description: The amount to pay
 *                         example: 1500.00
 *                       ticketType:
 *                         type: string
 *                         description: The type of ticket
 *                         example: "regular"
 *                       daysOutstanding:
 *                         type: integer
 *                         description: The number of days outstanding
 *                         example: 5
 *                       comment7d:
 *                         type: string
 *                         description: The 7D comment indicating the issue
 *                         example: "TK - ON HOLD OFF"
 *                       quantity:
 *                         type: integer
 *                         description: The ticket quantity
 *                         example: 1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the ticket was created
 *                         example: "2024-01-15T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the ticket was last updated
 *                         example: "2024-01-20T14:45:00Z"
 *                       incidentName:
 *                         type: string
 *                         description: The incident name
 *                         example: "Pothole Repair"
 *                       addresses:
 *                         type: string
 *                         description: Comma-separated list of addresses for this ticket
 *                         example: "123 N Main St, 456 W Oak Ave"
 *                       taskStatuses:
 *                         type: array
 *                         description: Array of task statuses with crew comments
 *                         items:
 *                           type: object
 *                           properties:
 *                             taskStatusId:
 *                               type: integer
 *                               description: Task status ID
 *                               example: 1
 *                             name:
 *                               type: string
 *                               description: Task status name
 *                               example: "Sawcut"
 *                             description:
 *                               type: string
 *                               description: Task status description
 *                               example: "Cutting the damaged pavement section with a saw"
 *                             startingDate:
 *                               type: string
 *                               format: date
 *                               description: Start date of this status
 *                               example: "2024-01-15"
 *                             endingDate:
 *                               type: string
 *                               format: date
 *                               description: End date of this status
 *                               example: "2024-01-16"
 *                             crewComment:
 *                               type: string
 *                               description: Crew comment/observation for this task status
 *                               example: "Weather conditions prevented completion"
 *                             crewId:
 *                               type: integer
 *                               description: Associated crew ID
 *                               example: 1
 *                       taskStatusCount:
 *                         type: integer
 *                         description: Number of task statuses for this ticket
 *                         example: 3
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching tickets with issues"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/with-issues', TicketsController.getTicketsWithIssues);

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
 *               - ticketCode
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               incidentId:
 *                 type: integer
 *                 description: The ID of the incident
 *               cuadranteId:
 *                 type: integer
 *                 description: The ID of the quadrant
 *               contractUnitId:
 *                 type: integer
 *                 description: The ID of the contract unit
 *               wayfindingId:
 *                 type: integer
 *                 description: The ID of the wayfinding
 *               paymentId:
 *                 type: integer
 *                 description: The ID of the payment
 *               mobilizationId:
 *                 type: integer
 *                 description: The ID of the mobilization
 *               ticketCode:
 *                 type: string
 *                 description: The unique ticket code
 *               quantity:
 *                 type: integer
 *                 description: The quantity
 *               daysOutstanding:
 *                 type: integer
 *                 description: The number of days outstanding
 *               comment7d:
 *                 type: string
 *                 description: The 7D comment
 *               PartnerComment:
 *                 type: string
 *                 description: The partner comment
 *               PartnerSupervisorComment:
 *                 type: string
 *                 description: The partner supervisor comment
 *               contractNumber:
 *                 type: string
 *                 description: The contract number
 *               amountToPay:
 *                 type: number
 *                 description: The amount to pay
 *               ticketType:
 *                 type: string
 *                 description: The type of ticket
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this ticket
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this ticket
 *     responses:
 *       201:
 *         description: The ticket was successfully created
 *       500:
 *         description: Server error
 */
router.post('/', TicketsController.createTicket);

/**
 * @swagger
 * /tickets/expired:
 *   get:
 *     summary: Get expired tickets
 *     tags: [Tickets]
 *     description: Retrieve all tickets where expire date has passed or daysOutstanding is 0
 *     responses:
 *       200:
 *         description: A list of expired tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticketId:
 *                     type: integer
 *                     description: The ticket ID
 *                   ticketCode:
 *                     type: string
 *                     description: The ticket code
 *                   contractNumber:
 *                     type: string
 *                     description: The contract number
 *                   amountToPay:
 *                     type: number
 *                     description: The amount to pay
 *                   ticketType:
 *                     type: string
 *                     description: The type of ticket
 *                   daysOutstanding:
 *                     type: integer
 *                     description: The number of days outstanding
 *                   comment7d:
 *                     type: string
 *                     description: The 7D comment
 *                   expireDate:
 *                     type: string
 *                     format: date
 *                     description: The permit expiration date
 *                     nullable: true
 *                   daysExpired:
 *                     type: integer
 *                     description: Number of days since the permit expired
 *                     nullable: true
 *                   addresses:
 *                     type: string
 *                     description: Comma-separated list of addresses for this ticket
 *                   taskStatusNames:
 *                     type: string
 *                     description: Comma-separated list of task status names for this ticket
 *       500:
 *         description: Server error
 */
router.get('/expired', TicketsController.getExpiredTickets);

/**
 * @swagger
 * /tickets/payment-invoice-info:
 *   get:
 *     summary: Get ticket information with related payment and invoice data
 *     tags: [Tickets]
 *     description: Retrieve ticket codes, amounts, and related payment and invoice information
 *     responses:
 *       200:
 *         description: Ticket payment and invoice information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket payment and invoice information retrieved successfully"
 *                 count:
 *                   type: integer
 *                   description: Total number of tickets returned
 *                   example: 150
 *                 data:
 *                   type: array
 *                   description: Array of tickets with payment and invoice information
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketCode:
 *                         type: string
 *                         description: The ticket code
 *                         example: "TK6514243"
 *                       amountToPay:
 *                         type: number
 *                         description: The amount to pay for the ticket
 *                         example: 1500.00
 *                         nullable: true
 *                       calculatedCost:
 *                         type: number
 *                         description: The calculated cost for the ticket
 *                         example: 1200.00
 *                         nullable: true
 *                       invoiceNumber:
 *                         type: string
 *                         description: The invoice number associated with the ticket
 *                         example: "INV-2024-001"
 *                         nullable: true
 *                       amountRequested:
 *                         type: number
 *                         description: The amount requested in the invoice
 *                         example: 1500.00
 *                         nullable: true
 *                       amountPaid:
 *                         type: number
 *                         description: The amount paid for the ticket
 *                         example: 1500.00
 *                         nullable: true
 *                       statusPaid:
 *                         type: string
 *                         description: The payment status
 *                         example: "PAID"
 *                         nullable: true
 *                       shop:
 *                         type: string
 *                         description: The shop from the associated quadrant
 *                         example: "Shop A"
 *                         nullable: true
 */


/**
 * @swagger
 * /tickets/gallery:
 *   get:
 *     summary: Get all tickets gallery grouped by incident name
 *     tags: [Tickets]
 *     description: Retrieve all tickets with their addresses, task statuses, and photo evidence, grouped by incident name from IncidentsMx table
 *     responses:
 *       200:
 *         description: All tickets gallery retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All tickets gallery retrieved successfully"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalIncidents:
 *                       type: integer
 *                       description: Total number of incidents
 *                       example: 25
 *                     totalTickets:
 *                       type: integer
 *                       description: Total number of tickets across all incidents
 *                       example: 150
 *                     totalPhotos:
 *                       type: integer
 *                       description: Total number of photos across all tickets
 *                       example: 500
 *                     totalAddresses:
 *                       type: integer
 *                       description: Total number of addresses across all tickets
 *                       example: 300
 *                     incidentsWithPhotos:
 *                       type: integer
 *                       description: Number of incidents that have photos
 *                       example: 20
 *                     incidentsWithAddresses:
 *                       type: integer
 *                       description: Number of incidents that have addresses
 *                       example: 22
 *                 data:
 *                   type: array
 *                   description: Array of incidents with their tickets and gallery data
 *                   items:
 *                     type: object
 *                     properties:
 *                       incidentId:
 *                         type: integer
 *                         description: The incident ID
 *                         example: 1
 *                       incidentName:
 *                         type: string
 *                         description: The incident name
 *                         example: "Pothole Repair"
 *                       earliestRptDate:
 *                         type: string
 *                         format: date
 *                         description: The earliest report date for this incident
 *                         example: "2024-01-15"
 *                       totalTickets:
 *                         type: integer
 *                         description: Total number of tickets for this incident
 *                         example: 5
 *                       totalPhotos:
 *                         type: integer
 *                         description: Total number of photos for this incident
 *                         example: 15
 *                       totalAddresses:
 *                         type: integer
 *                         description: Total number of addresses for this incident
 *                         example: 8
 *                       tickets:
 *                         type: array
 *                         description: Array of tickets for this incident
 *                         items:
 *                           type: object
 *                           properties:
 *                             ticketId:
 *                               type: integer
 *                               description: The ticket ID
 *                               example: 123
 *                             ticketCode:
 *                               type: string
 *                               description: The ticket code
 *                               example: "TK6514243"
 *                             contractNumber:
 *                               type: string
 *                               description: The contract number
 *                               example: "CONTRACT-2024-001"
 *                             amountToPay:
 *                               type: number
 *                               description: The amount to pay for the ticket
 *                               example: 1500.00
 *                             ticketType:
 *                               type: string
 *                               description: The type of ticket
 *                               example: "regular"
 *                             quantity:
 *                               type: integer
 *                               description: The ticket quantity
 *                               example: 1
 *                             daysOutstanding:
 *                               type: integer
 *                               description: Number of days outstanding
 *                               example: 5
 *                             comment7d:
 *                               type: string
 *                               description: 7D comment
 *                               example: "TK - COMPLETED"
 *                             addresses:
 *                               type: array
 *                               description: Array of addresses for this ticket
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   addressId:
 *                                     type: integer
 *                                     description: Address ID
 *                                     example: 456
 *                                   addressNumber:
 *                                     type: string
 *                                     description: House or building number
 *                                     example: "123"
 *                                   addressCardinal:
 *                                     type: string
 *                                     description: Cardinal direction
 *                                     example: "N"
 *                                   addressStreet:
 *                                     type: string
 *                                     description: Street name
 *                                     example: "Main"
 *                                   addressSuffix:
 *                                     type: string
 *                                     description: Street suffix
 *                                     example: "St"
 *                                   fullAddress:
 *                                     type: string
 *                                     description: Complete formatted address
 *                                     example: "123 N Main St"
 *                             taskStatuses:
 *                               type: array
 *                               description: Array of task statuses with photo evidence
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   taskStatusId:
 *                                     type: integer
 *                                     description: Task status ID
 *                                     example: 1
 *                                   name:
 *                                     type: string
 *                                     description: Task status name
 *                                     example: "Sawcut"
 *                                   description:
 *                                     type: string
 *                                     description: Task status description
 *                                     example: "Cutting the damaged pavement section with a saw"
 *                                   startingDate:
 *                                     type: string
 *                                     format: date
 *                                     description: Start date of this status
 *                                     example: "2024-01-15"
 *                                   endingDate:
 *                                     type: string
 *                                     format: date
 *                                     description: End date of this status
 *                                     example: "2024-01-16"
 *                                   observation:
 *                                     type: string
 *                                     description: Additional observations
 *                                     example: "Completed successfully"
 *                                   crewId:
 *                                     type: integer
 *                                     description: Associated crew ID
 *                                     example: 1
 *                                   photoEvidence:
 *                                     type: array
 *                                     description: Array of photo evidence for this task status
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         photoId:
 *                                           type: integer
 *                                           description: Photo evidence ID
 *                                           example: 789
 *                                         name:
 *                                           type: string
 *                                           description: Photo name/title
 *                                           example: "Before Sawcut"
 *                                         latitude:
 *                                           type: number
 *                                           description: Photo latitude coordinate
 *                                           example: 41.8781
 *                                           nullable: true
 *                                         longitude:
 *                                           type: number
 *                                           description: Photo longitude coordinate
 *                                           example: -87.6298
 *                                           nullable: true
 *                                         photo:
 *                                           type: string
 *                                           description: Base64 encoded photo or photo data
 *                                           example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
 *                                           nullable: true
 *                                         date:
 *                                           type: string
 *                                           format: date-time
 *                                           description: Photo date and time
 *                                           example: "2024-01-15T10:30:00Z"
 *                                           nullable: true
 *                                         comment:
 *                                           type: string
 *                                           description: Photo comment/description
 *                                           example: "Damage assessment before repair"
 *                                           nullable: true
 *                                         photoURL:
 *                                           type: string
 *                                           description: URL to the hosted photo
 *                                           example: "http://localhost:9000/minio/uploads/photo-evidence/1705312200000-photo.jpg"
 *                                           nullable: true
 *                                         createdAt:
 *                                           type: string
 *                                           format: date-time
 *                                           description: When the photo was created
 *                                           example: "2024-01-15T10:30:00Z"
 *       404:
 *         description: No tickets found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No tickets found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching all tickets gallery"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/gallery', TicketsController.getAllTicketsGallery);

/**
 * @swagger
 * /tickets/gallery/{ticketCode}:
 *   get:
 *     summary: Get ticket gallery with addresses and photo evidence
 *     tags: [Tickets]
 *     description: Retrieve complete ticket information including addresses, task statuses, and photo evidence for building a gallery
 *     parameters:
 *       - in: path
 *         name: ticketCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket code to retrieve gallery data for
 *         example: "TK6514243"
 *     responses:
 *       200:
 *         description: Ticket gallery retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket gallery retrieved successfully"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPhotos:
 *                       type: integer
 *                       description: Total number of photos across all task statuses
 *                       example: 15
 *                     totalTaskStatuses:
 *                       type: integer
 *                       description: Total number of task statuses
 *                       example: 5
 *                     totalAddresses:
 *                       type: integer
 *                       description: Total number of addresses
 *                       example: 2
 *                     hasPhotos:
 *                       type: boolean
 *                       description: Whether the ticket has any photos
 *                       example: true
 *                     hasAddresses:
 *                       type: boolean
 *                       description: Whether the ticket has any addresses
 *                       example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                       description: The ticket ID
 *                       example: 123
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *                       example: "TK6514243"
 *                     contractNumber:
 *                       type: string
 *                       description: The contract number
 *                       example: "CONTRACT-2024-001"
 *                     amountToPay:
 *                       type: number
 *                       description: The amount to pay for the ticket
 *                       example: 1500.00
 *                     ticketType:
 *                       type: string
 *                       description: The type of ticket
 *                       example: "regular"
 *                     quantity:
 *                       type: integer
 *                       description: The ticket quantity
 *                       example: 1
 *                     daysOutstanding:
 *                       type: integer
 *                       description: Number of days outstanding
 *                       example: 5
 *                     comment7d:
 *                       type: string
 *                       description: 7D comment
 *                       example: "TK - COMPLETED"
 *                     addresses:
 *                       type: array
 *                       description: Array of addresses for this ticket
 *                       items:
 *                         type: object
 *                         properties:
 *                           addressId:
 *                             type: integer
 *                             description: Address ID
 *                             example: 456
 *                           addressNumber:
 *                             type: string
 *                             description: House or building number
 *                             example: "123"
 *                           addressCardinal:
 *                             type: string
 *                             description: Cardinal direction
 *                             example: "N"
 *                           addressStreet:
 *                             type: string
 *                             description: Street name
 *                             example: "Main"
 *                           addressSuffix:
 *                             type: string
 *                             description: Street suffix
 *                             example: "St"
 *                           fullAddress:
 *                             type: string
 *                             description: Complete formatted address
 *                             example: "123 N Main St"
 *                     taskStatuses:
 *                       type: array
 *                       description: Array of task statuses with photo evidence
 *                       items:
 *                         type: object
 *                         properties:
 *                           taskStatusId:
 *                             type: integer
 *                             description: Task status ID
 *                             example: 1
 *                           name:
 *                             type: string
 *                             description: Task status name
 *                             example: "Sawcut"
 *                           description:
 *                             type: string
 *                             description: Task status description
 *                             example: "Cutting the damaged pavement section with a saw"
 *                           startingDate:
 *                             type: string
 *                             format: date
 *                             description: Start date of this status
 *                             example: "2024-01-15"
 *                           endingDate:
 *                             type: string
 *                             format: date
 *                             description: End date of this status
 *                             example: "2024-01-16"
 *                           observation:
 *                             type: string
 *                             description: Additional observations
 *                             example: "Completed successfully"
 *                           crewId:
 *                             type: integer
 *                             description: Associated crew ID
 *                             example: 1
 *                           photoEvidence:
 *                             type: array
 *                             description: Array of photo evidence for this task status
 *                             items:
 *                               type: object
 *                               properties:
 *                                 photoId:
 *                                   type: integer
 *                                   description: Photo evidence ID
 *                                   example: 789
 *                                 name:
 *                                   type: string
 *                                   description: Photo name/title
 *                                   example: "Before Sawcut"
 *                                 latitude:
 *                                   type: number
 *                                   description: Photo latitude coordinate
 *                                   example: 41.8781
 *                                   nullable: true
 *                                 longitude:
 *                                   type: number
 *                                   description: Photo longitude coordinate
 *                                   example: -87.6298
 *                                   nullable: true
 *                                 photo:
 *                                   type: string
 *                                   description: Base64 encoded photo or photo data
 *                                   example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
 *                                   nullable: true
 *                                 date:
 *                                   type: string
 *                                   format: date-time
 *                                   description: Photo date and time
 *                                   example: "2024-01-15T10:30:00Z"
 *                                   nullable: true
 *                                 comment:
 *                                   type: string
 *                                   description: Photo comment/description
 *                                   example: "Damage assessment before repair"
 *                                   nullable: true
 *                                 photoURL:
 *                                   type: string
 *                                   description: URL to the hosted photo
 *                                   example: "http://localhost:9000/minio/uploads/photo-evidence/1705312200000-photo.jpg"
 *                                   nullable: true
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                                   description: When the photo was created
 *                                   example: "2024-01-15T10:30:00Z"
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ticket not found"
 *                 ticketCode:
 *                   type: string
 *                   example: "TK6514243"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching ticket gallery"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/gallery/:ticketCode', TicketsController.getTicketGallery);

/**
 * @swagger
 * /tickets/coordinates/{ticketCode}:
 *   get:
 *     summary: Get ticket coordinates by ticket code
 *     tags: [Tickets]
 *     description: Retrieve latitude and longitude coordinates for all addresses associated with a specific ticket
 *     parameters:
 *       - in: path
 *         name: ticketCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket code to search for coordinates
 *         example: "TK6514243"
 *     responses:
 *       200:
 *         description: Ticket coordinates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket coordinates retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                       description: The ticket ID
 *                       example: 123
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *                       example: "TK6514243"
 *                     contractNumber:
 *                       type: string
 *                       description: The contract number
 *                       example: "CONTRACT-2024-001"
 *                     amountToPay:
 *                       type: number
 *                       description: The amount to pay for the ticket
 *                       example: 1500.00
 *                     ticketType:
 *                       type: string
 *                       description: The type of ticket
 *                       example: "regular"
 *                     addresses:
 *                       type: array
 *                       description: Array of addresses with coordinates for this ticket
 *                       items:
 *                         type: object
 *                         properties:
 *                           addressId:
 *                             type: integer
 *                             description: Address ID
 *                             example: 456
 *                           addressNumber:
 *                             type: string
 *                             description: House or building number
 *                             example: "123"
 *                           addressCardinal:
 *                             type: string
 *                             description: Cardinal direction
 *                             example: "N"
 *                           addressStreet:
 *                             type: string
 *                             description: Street name
 *                             example: "Main"
 *                           addressSuffix:
 *                             type: string
 *                             description: Street suffix
 *                             example: "St"
 *                           latitude:
 *                             type: number
 *                             description: Latitude coordinate
 *                             example: 41.8781
 *                             nullable: true
 *                           longitude:
 *                             type: number
 *                             description: Longitude coordinate
 *                             example: -87.6298
 *                             nullable: true
 *                           placeid:
 *                             type: string
 *                             description: Google Places ID
 *                             example: "ChIJ7U0fzrosDogRFQ-eGiz8E3A"
 *                             nullable: true
 *                           fullAddress:
 *                             type: string
 *                             description: Complete formatted address
 *                             example: "123 N Main St"
 *       404:
 *         description: Ticket not found or no coordinates available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ticket not found or no coordinates available"
 *                 ticketCode:
 *                   type: string
 *                   example: "TK6514243"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching ticket coordinates"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/coordinates/:ticketCode', TicketsController.getTicketCoordinates);

/**
 * @swagger
 * /tickets/payment-invoice-info:
 *   get:
 *     summary: Get ticket information with related payment and invoice data (tickets with payments only)
 *     tags: [Tickets]
 *     description: Retrieve ticket codes, amounts, and related payment and invoice information for tickets that have associated payments
 *     responses:
 *       200:
 *         description: Ticket payment and invoice information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket payment and invoice information retrieved successfully (tickets with payments only)"
 *                 count:
 *                   type: integer
 *                   description: Total number of tickets returned
 *                   example: 3
 *                 data:
 *                   type: array
 *                   description: Array of tickets with payment and invoice information
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketCode:
 *                         type: string
 *                         description: The ticket code
 *                         example: "TK6514243"
 *                       amountToPay:
 *                         type: number
 *                         description: The amount to pay for the ticket
 *                         example: 1500.00
 *                         nullable: true
 *                       calculatedCost:
 *                         type: number
 *                         description: The calculated cost for the ticket
 *                         example: 1200.00
 *                         nullable: true
 *                       invoiceNumber:
 *                         type: string
 *                         description: The invoice number associated with the ticket
 *                         example: "INV-2024-001"
 *                         nullable: true
 *                       amountRequested:
 *                         type: number
 *                         description: The amount requested in the invoice
 *                         example: 1500.00
 *                         nullable: true
 *                       paymentNumber:
 *                         type: string
 *                         description: The payment number associated with the ticket
 *                         example: "PAY-2024-001"
 *                         nullable: true
 *                       amountPaid:
 *                         type: number
 *                         description: The amount paid for the ticket
 *                         example: 1500.00
 *                         nullable: true
 *                       statusPaid:
 *                         type: string
 *                         description: The payment status
 *                         example: "PAID"
 *                         nullable: true
 *                       shop:
 *                         type: string
 *                         description: The shop from the associated quadrant
 *                         example: "Shop A"
 *                         nullable: true
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching ticket payment and invoice information"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/payment-invoice-info', TicketsController.getTicketPaymentInvoiceInfo);

/**
 * @swagger
 * /tickets/all-payment-invoice-info:
 *   get:
 *     summary: Get all ticket information with related payment and invoice data
 *     tags: [Tickets]
 *     description: Retrieve all ticket codes, amounts, and related payment and invoice information (including tickets without payments)
 *     responses:
 *       200:
 *         description: All ticket payment and invoice information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All ticket payment and invoice information retrieved successfully"
 *                 count:
 *                   type: integer
 *                   description: Total number of tickets returned
 *                   example: 1797
 *                 ticketsWithPayments:
 *                   type: integer
 *                   description: Number of tickets that have associated payments
 *                   example: 3
 *                 ticketsWithoutPayments:
 *                   type: integer
 *                   description: Number of tickets that don't have associated payments
 *                   example: 1794
 *                 data:
 *                   type: array
 *                   description: Array of tickets with payment and invoice information
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketCode:
 *                         type: string
 *                         description: The ticket code
 *                         example: "TK6514243"
 *                       amountToPay:
 *                         type: number
 *                         description: The amount to pay for the ticket
 *                         example: 1500.00
 *                         nullable: true
 *                       calculatedCost:
 *                         type: number
 *                         description: The calculated cost for the ticket
 *                         example: 1200.00
 *                         nullable: true
 *                       invoiceNumber:
 *                         type: string
 *                         description: The invoice number associated with the ticket
 *                         example: "INV-2024-001"
 *                         nullable: true
 *                       amountRequested:
 *                         type: number
 *                         description: The amount requested in the invoice
 *                         example: 1500.00
 *                         nullable: true
 *                       paymentNumber:
 *                         type: string
 *                         description: The payment number associated with the ticket
 *                         example: "PAY-2024-001"
 *                         nullable: true
 *                       amountPaid:
 *                         type: number
 *                         description: The amount paid for the ticket
 *                         example: 1500.00
 *                         nullable: true
 *                       statusPaid:
 *                         type: string
 *                         description: The payment status
 *                         example: "PAID"
 *                         nullable: true
 *                       shop:
 *                         type: string
 *                         description: The shop from the associated quadrant
 *                         example: "Shop A"
 *                         nullable: true
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching all ticket payment and invoice information"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/all-payment-invoice-info', TicketsController.getAllTicketPaymentInvoiceInfo);

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
 *         description: The ID of the ticket
 *     responses:
 *       200:
 *         description: Ticket found
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/:ticketId', TicketsController.getTicketById);

/**
 * @swagger
 * /tickets/code/{ticketCode}:
 *   get:
 *     summary: Get a ticket by ticket code
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket code
 *     responses:
 *       200:
 *         description: Ticket found
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/code/:ticketCode', TicketsController.getByTicketCode);

/**
 * @swagger
 * /tickets/info/{ticketCode}:
 *   get:
 *     summary: Get ticket information with full address and task statuses
 *     tags: [Tickets]
 *     description: Retrieve complete ticket information including full address construction and all associated task statuses
 *     parameters:
 *       - in: path
 *         name: ticketCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket code to search for
 *     responses:
 *       200:
 *         description: Ticket information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                       description: The ticket ID
 *                       example: 1
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *                       example: "TK6514243"
 *                     quantity:
 *                       type: integer
 *                       description: The quantity
 *                       example: 1
 *                     daysOutstanding:
 *                       type: integer
 *                       description: Days outstanding
 *                       example: 5
 *                     comment7d:
 *                       type: string
 *                       description: 7D comments
 *                       example: "TK - COMPLETED"
 *                     partnerComment:
 *                       type: string
 *                       description: Partner comments
 *                       example: "Work completed"
 *                     partnerSupervisorComment:
 *                       type: string
 *                       description: Partner supervisor comments
 *                       example: "Approved"
 *                     contractNumber:
 *                       type: string
 *                       description: Contract number
 *                       example: "CONTRACT-2024-001"
 *                     amountToPay:
 *                       type: number
 *                       description: Amount to pay
 *                       example: 1500.00
 *                     ticketType:
 *                       type: string
 *                       description: Ticket type
 *                       example: "regular"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Creation date
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Last update date
 *                     address:
 *                       type: object
 *                       description: Address information
 *                       properties:
 *                         fullAddress:
 *                           type: string
 *                           description: Complete formatted address
 *                           example: "2821 W WILCOX ST"
 *                         addressNumber:
 *                           type: string
 *                           description: Address number
 *                           example: "2821"
 *                         addressCardinal:
 *                           type: string
 *                           description: Cardinal direction
 *                           example: "W"
 *                         addressStreet:
 *                           type: string
 *                           description: Street name
 *                           example: "WILCOX"
 *                         addressSuffix:
 *                           type: string
 *                           description: Street suffix
 *                           example: "ST"
 *                     taskStatuses:
 *                       type: array
 *                       description: Array of task statuses associated with this ticket
 *                       items:
 *                         type: object
 *                         properties:
 *                           taskStatusId:
 *                             type: integer
 *                             description: Task status ID
 *                             example: 1
 *                           name:
 *                             type: string
 *                             description: Task status name
 *                             example: "Sawcut"
 *                           description:
 *                             type: string
 *                             description: Task status description
 *                             example: "Cutting the damaged pavement section with a saw"
 *                           startingDate:
 *                             type: string
 *                             format: date
 *                             description: Start date of this status
 *                             example: "2024-01-15"
 *                           endingDate:
 *                             type: string
 *                             format: date
 *                             description: End date of this status
 *                             example: "2024-01-16"
 *                           observation:
 *                             type: string
 *                             description: Additional observations
 *                             example: "Completed successfully"
 *                           crewId:
 *                             type: integer
 *                             description: Associated crew ID
 *                             example: 1
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ticket not found"
 *                 ticketCode:
 *                   type: string
 *                   example: "TK6514243"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching ticket information"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/info/:ticketCode', TicketsController.getTicketWithAddressAndStatuses);

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Retrieve a list of all tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: A list of tickets
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
 *         description: The ID of the ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               incidentId:
 *                 type: integer
 *               cuadranteId:
 *                 type: integer
 *               contractUnitId:
 *                 type: integer
 *               wayfindingId:
 *                 type: integer
 *               paymentId:
 *                 type: integer
 *               mobilizationId:
 *                 type: integer
 *               ticketCode:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               daysOutstanding:
 *                 type: integer
 *               comment7d:
 *                 type: string
 *               PartnerComment:
 *                 type: string
 *               PartnerSupervisorComment:
 *                 type: string
 *               contractNumber:
 *                 type: string
 *               amountToPay:
 *                 type: number
 *               ticketType:
 *                 type: string
 *               updatedBy:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The ticket was successfully updated
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
 *         description: The ID of the ticket
 *     responses:
 *       200:
 *         description: The ticket was successfully deleted
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.delete('/:ticketId', TicketsController.deleteTicket);

/**
 * @swagger
 * /tickets/expiring/7days:
 *   get:
 *     summary: Get tickets expiring in 7 days
 *     tags: [Tickets]
 *     description: Retrieve all tickets that have permits expiring within 7 days, including ticket numbers, addresses, and expiration dates
 *     responses:
 *       200:
 *         description: A list of tickets expiring in 7 days
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticketId:
 *                     type: integer
 *                   ticketCode:
 *                     type: string
 *                   contractNumber:
 *                     type: string
 *                   amountToPay:
 *                     type: number
 *                   ticketType:
 *                     type: string
 *                   daysOutstanding:
 *                     type: integer
 *                   comment7d:
 *                     type: string
 *                   expireDate:
 *                     type: string
 *                     format: date
 *                   days_until_expiry:
 *                     type: integer
 *                   addresses:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/expiring/7days', TicketsController.getTicketsExpiringIn7Days);

/**
 * @swagger
 * /tickets/expiring/15days:
 *   get:
 *     summary: Get tickets expiring in 15 days
 *     tags: [Tickets]
 *     description: Retrieve all tickets that have permits expiring within 15 days, including ticket numbers, addresses, and expiration dates
 *     responses:
 *       200:
 *         description: A list of tickets expiring in 15 days
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticketId:
 *                     type: integer
 *                   ticketCode:
 *                     type: string
 *                   contractNumber:
 *                     type: string
 *                   amountToPay:
 *                     type: number
 *                   ticketType:
 *                     type: string
 *                   daysOutstanding:
 *                     type: integer
 *                   comment7d:
 *                     type: string
 *                   expireDate:
 *                     type: string
 *                     format: date
 *                   days_until_expiry:
 *                     type: integer
 *                   addresses:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/expiring/15days', TicketsController.getTicketsExpiringIn15Days);

/**
 * @swagger
 * /tickets/expiring/after15days:
 *   get:
 *     summary: Get tickets expiring after 15 days
 *     tags: [Tickets]
 *     description: Retrieve all tickets that have permits expiring after 15 days, including ticket numbers, addresses, and expiration dates
 *     responses:
 *       200:
 *         description: A list of tickets expiring after 15 days
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticketId:
 *                     type: integer
 *                   ticketCode:
 *                     type: string
 *                   contractNumber:
 *                     type: string
 *                   amountToPay:
 *                     type: number
 *                   ticketType:
 *                     type: string
 *                   daysOutstanding:
 *                     type: integer
 *                   comment7d:
 *                     type: string
 *                   expireDate:
 *                     type: string
 *                     format: date
 *                   days_until_expiry:
 *                     type: integer
 *                   addresses:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/expiring/after15days', TicketsController.getTicketsExpiringAfter15Days);

/**
 * @swagger
 * /tickets/search/route-generation:
 *   get:
 *     summary: Search tickets for route generation
 *     tags: [Tickets]
 *     description: Search for tickets with comment7d as null or "TK - PERMIT EXTENDED" and build addresses from their properties
 *     parameters:
 *       - in: query
 *         name: comment7d
 *         schema:
 *           type: string
 *           enum: [null, permit_extended, both]
 *         description: Filter by comment7d status. 'null' for null comments, 'permit_extended' for "TK - PERMIT EXTENDED", 'both' for both (default)
 *         example: both
 *       - in: query
 *         name: includeAddresses
 *         schema:
 *           type: boolean
 *         description: Whether to include address details in the response
 *         example: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of tickets to return
 *         example: 100
 *     responses:
 *       200:
 *         description: Tickets found for route generation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tickets found for route generation"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalTickets:
 *                       type: integer
 *                       description: Total number of tickets found
 *                       example: 25
 *                     ticketsWithNullComment:
 *                       type: integer
 *                       description: Number of tickets with null comment7d
 *                       example: 15
 *                     ticketsWithPermitExtended:
 *                       type: integer
 *                       description: Number of tickets with "TK - PERMIT EXTENDED" comment
 *                       example: 10
 *                     ticketsWithAddresses:
 *                       type: integer
 *                       description: Number of tickets that have addresses
 *                       example: 20
 *                     ticketsWithoutAddresses:
 *                       type: integer
 *                       description: Number of tickets without addresses
 *                       example: 5
 *                     totalAddresses:
 *                       type: integer
 *                       description: Total number of addresses across all tickets
 *                       example: 30
 *                     averageAddressesPerTicket:
 *                       type: string
 *                       description: Average number of addresses per ticket
 *                       example: "1.20"
 *                 data:
 *                   type: array
 *                   description: Array of tickets with their addresses
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: integer
 *                         description: Ticket ID
 *                         example: 123
 *                       ticketCode:
 *                         type: string
 *                         description: Ticket code
 *                         example: "TK6514243"
 *                       contractNumber:
 *                         type: string
 *                         description: Contract number
 *                         example: "CONTRACT-2024-001"
 *                       amountToPay:
 *                         type: number
 *                         description: Amount to pay for the ticket
 *                         example: 1500.00
 *                       ticketType:
 *                         type: string
 *                         description: Type of ticket
 *                         example: "regular"
 *                       daysOutstanding:
 *                         type: integer
 *                         description: Number of days outstanding
 *                         example: 5
 *                       comment7d:
 *                         type: string
 *                         description: 7D comment (null or "TK - PERMIT EXTENDED")
 *                         example: null
 *                         nullable: true
 *                       quantity:
 *                         type: integer
 *                         description: Ticket quantity
 *                         example: 1
 *                       ticketCreatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the ticket was created
 *                         example: "2024-01-15T10:30:00Z"
 *                       permitNumber:
 *                         type: string
 *                         description: Associated permit number
 *                         example: "PERM-2024-001"
 *                         nullable: true
 *                       permitExpireDate:
 *                         type: string
 *                         format: date
 *                         description: Permit expiration date
 *                         example: "2024-12-31"
 *                         nullable: true
 *                       permitStatus:
 *                         type: string
 *                         description: Current permit status
 *                         example: "ACTIVE"
 *                         nullable: true
 *                       addresses:
 *                         type: array
 *                         description: Array of addresses for this ticket
 *                         items:
 *                           type: object
 *                           properties:
 *                             addressId:
 *                               type: integer
 *                               description: Address ID
 *                               example: 456
 *                             addressNumber:
 *                               type: string
 *                               description: House or building number
 *                               example: "123"
 *                             addressCardinal:
 *                               type: string
 *                               description: Cardinal direction
 *                               example: "N"
 *                             addressStreet:
 *                               type: string
 *                               description: Street name
 *                               example: "Main"
 *                             addressSuffix:
 *                               type: string
 *                               description: Street suffix
 *                               example: "St"
 *                             latitude:
 *                               type: number
 *                               description: Latitude coordinate
 *                               example: 41.8781
 *                               nullable: true
 *                             longitude:
 *                               type: number
 *                               description: Longitude coordinate
 *                               example: -87.6298
 *                               nullable: true
 *                             placeid:
 *                               type: string
 *                               description: Google Places ID
 *                               example: "ChIJ7U0fzrosDogRFQ-eGiz8E3A"
 *                               nullable: true
 *                             fullAddress:
 *                               type: string
 *                               description: Complete formatted address
 *                               example: "123 N Main St"
 *                       addressCount:
 *                         type: integer
 *                         description: Number of addresses for this ticket
 *                         example: 2
 *       400:
 *         description: Bad request - invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/search/route-generation', TicketsController.searchTicketsForRouteGeneration);

/**
 * @swagger
 * /tickets/coordinates/{ticketCode}:
 *   get:
 *     summary: Get ticket coordinates by ticket code
 *     tags: [Tickets]
 *     description: Retrieve latitude and longitude coordinates for all addresses associated with a specific ticket
 *     parameters:
 *       - in: path
 *         name: ticketCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket code to search for coordinates
 *         example: "TK6514243"
 *     responses:
 *       200:
 *         description: Ticket coordinates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket coordinates retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                       description: The ticket ID
 *                       example: 123
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *                       example: "TK6514243"
 *                     contractNumber:
 *                       type: string
 *                       description: The contract number
 *                       example: "CONTRACT-2024-001"
 *                     amountToPay:
 *                       type: number
 *                       description: The amount to pay for the ticket
 *                       example: 1500.00
 *                     ticketType:
 *                       type: string
 *                       description: The type of ticket
 *                       example: "regular"
 *                     addresses:
 *                       type: array
 *                       description: Array of addresses with coordinates for this ticket
 *                       items:
 *                         type: object
 *                         properties:
 *                           addressId:
 *                             type: integer
 *                             description: Address ID
 *                             example: 456
 *                           addressNumber:
 *                             type: string
 *                             description: House or building number
 *                             example: "123"
 *                           addressCardinal:
 *                             type: string
 *                             description: Cardinal direction
 *                             example: "N"
 *                           addressStreet:
 *                             type: string
 *                             description: Street name
 *                             example: "Main"
 *                           addressSuffix:
 *                             type: string
 *                             description: Street suffix
 *                             example: "St"
 *                           latitude:
 *                             type: number
 *                             description: Latitude coordinate
 *                             example: 41.8781
 *                             nullable: true
 *                           longitude:
 *                             type: number
 *                             description: Longitude coordinate
 *                             example: -87.6298
 *                             nullable: true
 *                           placeid:
 *                             type: string
 *                             description: Google Places ID
 *                             example: "ChIJ7U0fzrosDogRFQ-eGiz8E3A"
 *                             nullable: true
 *                           fullAddress:
 *                             type: string
 *                             description: Complete formatted address
 *                             example: "123 N Main St"
 *       404:
 *         description: Ticket not found or no coordinates available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ticket not found or no coordinates available"
 *                 ticketCode:
 *                   type: string
 *                   example: "TK6514243"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching ticket coordinates"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/coordinates/:ticketCode', TicketsController.getTicketCoordinates);

module.exports = router; 