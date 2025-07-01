const express = require('express');
const AddressesController = require('../../controllers/location/AddressesController');
const router = express.Router();

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressNumber
 *               - addressStreet
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               addressNumber:
 *                 type: string
 *                 description: The house or building number.
 *                 example: '123'
 *               addressCardinal:
 *                 type: string
 *                 description: The cardinal direction.
 *                 example: N
 *               addressStreet:
 *                 type: string
 *                 description: The street name.
 *                 example: Maple
 *               addressSuffix:
 *                 type: string
 *                 description: The street suffix.
 *                 example: St
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this address.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this address.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The address was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addressId:
 *                   type: integer
 *                   description: The auto-generated ID of the address.
 *                   example: 1
 *                 addressStreet:
 *                   type: string
 *                   example: Maple
 *       500:
 *         description: Server error
 */
router.post('/', AddressesController.createAddress);

/**
 * @swagger
 * /addresses/tickets-without-comment7d:
 *   get:
 *     summary: Get addresses linked to tickets where comment7d is null
 *     tags: [Addresses]
 *     responses:
 *       200:
 *         description: A list of addresses for tickets with null comment7d.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 */
router.get('/tickets-without-comment7d', AddressesController.getAddressesForTicketsWithNullComment7d);

/**
 * @swagger
 * /addresses/new-route-generation:
 *   get:
 *     summary: Get addresses for new route generation with permit and ticket status information
 *     description: Retrieves addresses linked to tickets where comment7d is null, including permit expiration dates and all ticket statuses with their details (starting date, ending date, crew comment, and task status name).
 *     tags: [Addresses]
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully for new route generation
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
 *                   example: "Addresses retrieved successfully for new route generation"
 *                 count:
 *                   type: integer
 *                   description: Number of addresses returned
 *                   example: 15
 *                 data:
 *                   type: array
 *                   description: Array of addresses with ticket and permit information
 *                   items:
 *                     type: object
 *                     properties:
 *                       addressId:
 *                         type: integer
 *                         description: Address ID
 *                         example: 1
 *                       addressNumber:
 *                         type: string
 *                         description: House or building number
 *                         example: "123"
 *                       addressCardinal:
 *                         type: string
 *                         description: Cardinal direction
 *                         example: "N"
 *                       addressStreet:
 *                         type: string
 *                         description: Street name
 *                         example: "Main"
 *                       addressSuffix:
 *                         type: string
 *                         description: Street suffix
 *                         example: "St"
 *                       ticketId:
 *                         type: integer
 *                         description: Associated ticket ID
 *                         example: 5
 *                       ticketCode:
 *                         type: string
 *                         description: Ticket code
 *                         example: "TK6514243"
 *                       comment7d:
 *                         type: string
 *                         description: 7D comments (will be null for this query)
 *                         example: null
 *                       quantity:
 *                         type: integer
 *                         description: Ticket quantity
 *                         example: 1
 *                       amountToPay:
 *                         type: number
 *                         description: Amount to pay for the ticket
 *                         example: 1500.00
 *                       ticketType:
 *                         type: string
 *                         description: Type of ticket
 *                         example: "regular"
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
 *                       ticketStatuses:
 *                         type: array
 *                         description: Array of ticket statuses with their details
 *                         items:
 *                           type: object
 *                           properties:
 *                             taskStatusId:
 *                               type: integer
 *                               description: Task status ID
 *                               example: 1
 *                             taskStatusName:
 *                               type: string
 *                               description: Name of the task status
 *                               example: "Sawcut"
 *                             taskStatusDescription:
 *                               type: string
 *                               description: Description of the task status
 *                               example: "Cutting the damaged pavement section with a saw"
 *                             startingDate:
 *                               type: string
 *                               format: date
 *                               description: Date when this task status started
 *                               example: "2024-01-15"
 *                               nullable: true
 *                             endingDate:
 *                               type: string
 *                               format: date
 *                               description: Date when this task status ended
 *                               example: "2024-01-16"
 *                               nullable: true
 *                             observation:
 *                               type: string
 *                               description: Crew comment or observation for this task status
 *                               example: "Completed sawcutting phase successfully"
 *                               nullable: true
 *                             crewId:
 *                               type: integer
 *                               description: ID of the crew assigned to this task status
 *                               example: 3
 *                               nullable: true
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
 *                   example: "Error fetching addresses for new route generation"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/new-route-generation', AddressesController.getAddressesForNewRouteGeneration);

/**
 * @swagger
 * /addresses/available:
 *   get:
 *     summary: Get available addresses for route generation
 *     description: Retrieves addresses linked to tickets where comment7d is null or "TK - PERMIT EXTENDED", including permit expiration dates and all ticket statuses with their details.
 *     tags: [Addresses]
 *     responses:
 *       200:
 *         description: Available addresses retrieved successfully
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
 *                   example: "Available addresses retrieved successfully"
 *                 count:
 *                   type: integer
 *                   description: Number of addresses returned
 *                   example: 25
 *                 data:
 *                   type: array
 *                   description: Array of addresses with ticket and permit information
 *                   items:
 *                     type: object
 *                     properties:
 *                       addressId:
 *                         type: integer
 *                         description: Address ID
 *                         example: 1
 *                       addressNumber:
 *                         type: string
 *                         description: House or building number
 *                         example: "123"
 *                       addressCardinal:
 *                         type: string
 *                         description: Cardinal direction
 *                         example: "N"
 *                       addressStreet:
 *                         type: string
 *                         description: Street name
 *                         example: "Main"
 *                       addressSuffix:
 *                         type: string
 *                         description: Street suffix
 *                         example: "St"
 *                       ticketId:
 *                         type: integer
 *                         description: Associated ticket ID
 *                         example: 5
 *                       ticketCode:
 *                         type: string
 *                         description: Ticket code
 *                         example: "TK6514243"
 *                       comment7d:
 *                         type: string
 *                         description: 7D comments (null or "TK - PERMIT EXTENDED")
 *                         example: null
 *                         nullable: true
 *                       quantity:
 *                         type: integer
 *                         description: Ticket quantity
 *                         example: 1
 *                       amountToPay:
 *                         type: number
 *                         description: Amount to pay for the ticket
 *                         example: 1500.00
 *                       ticketType:
 *                         type: string
 *                         description: Type of ticket
 *                         example: "regular"
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
 *                       ticketStatuses:
 *                         type: array
 *                         description: Array of ticket statuses with their details
 *                         items:
 *                           type: object
 *                           properties:
 *                             taskStatusId:
 *                               type: integer
 *                               description: Task status ID
 *                               example: 1
 *                             taskStatusName:
 *                               type: string
 *                               description: Name of the task status
 *                               example: "Sawcut"
 *                             taskStatusDescription:
 *                               type: string
 *                               description: Description of the task status
 *                               example: "Cutting the damaged pavement section with a saw"
 *                             startingDate:
 *                               type: string
 *                               format: date
 *                               description: Date when this task status started
 *                               example: "2024-01-15"
 *                               nullable: true
 *                             endingDate:
 *                               type: string
 *                               format: date
 *                               description: Date when this task status ended
 *                               example: "2024-01-16"
 *                               nullable: true
 *                             observation:
 *                               type: string
 *                               description: Crew comment or observation for this task status
 *                               example: "Completed sawcutting phase successfully"
 *                               nullable: true
 *                             crewId:
 *                               type: integer
 *                               description: ID of the crew assigned to this task status
 *                               example: 3
 *                               nullable: true
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
 *                   example: "Error fetching available addresses"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/available', AddressesController.getAvailableAddresses);

/**
 * @swagger
 * /addresses/{addressId}:
 *   get:
 *     summary: Get an address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     responses:
 *       200:
 *         description: Address found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *                 addressStreet:
 *                   type: string
 *                   example: Maple
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.get('/:addressId', AddressesController.getAddressById);

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Retrieve a list of all addresses
 *     tags: [Addresses]
 *     responses:
 *       200:
 *         description: A list of addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   addressId:
 *                     type: integer
 *                     example: 1
 *                   addressStreet:
 *                     type: string
 *                     example: Maple
 *       500:
 *         description: Server error
 */
router.get('/', AddressesController.getAllAddresses);

/**
 * @swagger
 * /addresses/{addressId}:
 *   put:
 *     summary: Update an address by ID
 *     tags: [Addresses]
 *     parameters:
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
 *               addressNumber:
 *                 type: string
 *                 description: The updated house or building number.
 *                 example: '456'
 *               addressCardinal:
 *                 type: string
 *                 description: The updated cardinal direction.
 *                 example: S
 *               addressStreet:
 *                 type: string
 *                 description: The updated street name.
 *                 example: Oak
 *               addressSuffix:
 *                 type: string
 *                 description: The updated street suffix.
 *                 example: Ave
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this address.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The address was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *                 addressStreet:
 *                   type: string
 *                   example: Oak
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.put('/:addressId', AddressesController.updateAddress);

/**
 * @swagger
 * /addresses/{addressId}:
 *   delete:
 *     summary: Delete an address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     responses:
 *       200:
 *         description: The address was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Address deleted successfully
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete('/:addressId', AddressesController.deleteAddress);

module.exports = router; 