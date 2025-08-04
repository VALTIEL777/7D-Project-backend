const express = require('express');
const CrewsController = require('../../controllers/human-resources/CrewsController');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Crews
 *   description: Crew management and retrieval
 */

/**
 * @swagger
 * /crews/employees:
 *   get:
 *     summary: Get all crews with their employees
 *     tags: [Crews]
 *     responses:
 *       200:
 *         description: List of crews and their employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   crewId:
 *                     type: integer
 *                     example: 1
 *                   type:
 *                     type: string
 *                     example: Maintenance
 *                   workedHours:
 *                     type: number
 *                     format: float
 *                     example: 120.0
 *                   employees:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         employeeId:
 *                           type: integer
 *                           example: 101
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *                         crewLeader:
 *                           type: boolean
 *                           example: true
 *       500:
 *         description: Server error
 */
router.get('/employees', CrewsController.getfindAllWithEmployees);



/**
 * @swagger
 * /crews:
 *   post:
 *     summary: Create a new crew
 *     tags: [Crews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - workedHours
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               type:
 *                 type: string
 *                 description: The type of the crew (e.g., 'Repair', 'Paving').
 *                 example: Repair Crew
 *               photo:
 *                 type: string
 *                 description: URL or path to the crew's photo.
 *                 example: crew_photo.jpg
 *               workedHours:
 *                 type: number
 *                 format: float
 *                 description: Total worked hours for the crew.
 *                 example: 160.5
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this crew.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this crew.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The crew was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crewId:
 *                   type: integer
 *                   description: The auto-generated ID of the crew.
 *                   example: 1
 *                 type:
 *                   type: string
 *                   example: Repair Crew
 *       500:
 *         description: Server error
 */
router.post('/', CrewsController.createCrews);

/**
 * @swagger
 * /crews/{crewId}:
 *   get:
 *     summary: Get a crew by ID
 *     tags: [Crews]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *     responses:
 *       200:
 *         description: Crew found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crewId:
 *                   type: integer
 *                   example: 1
 *                 type:
 *                   type: string
 *                   example: Repair Crew
 *                 workedHours:
 *                   type: number
 *                   format: float
 *                   example: 160.5
 *       404:
 *         description: Crew not found
 *       500:
 *         description: Server error
 */
router.get('/:crewId', CrewsController.getCrewsById);

/**
 * @swagger
 * /crews:
 *   get:
 *     summary: Retrieve a list of all crews
 *     tags: [Crews]
 *     responses:
 *       200:
 *         description: A list of crews.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   crewId:
 *                     type: integer
 *                     example: 1
 *                   type:
 *                     type: string
 *                     example: Repair Crew
 *                   workedHours:
 *                     type: number
 *                     format: float
 *                     example: 160.5
 *       500:
 *         description: Server error
 */
router.get('/', CrewsController.getAllCrews);

/**
 * @swagger
 * /crews/{crewId}:
 *   put:
 *     summary: Update a crew by ID
 *     tags: [Crews]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: The updated type of the crew.
 *                 example: Paving Crew
 *               photo:
 *                 type: string
 *                 description: Updated URL or path to the crew's photo.
 *                 example: updated_crew_photo.jpg
 *               workedHours:
 *                 type: number
 *                 format: float
 *                 description: Updated total worked hours for the crew.
 *                 example: 180.0
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this crew.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The crew was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crewId:
 *                   type: integer
 *                   example: 1
 *                 type:
 *                   type: string
 *                   example: Paving Crew
 *       404:
 *         description: Crew not found
 *       500:
 *         description: Server error
 */
router.put('/:crewId', CrewsController.updateCrews);

/**
 * @swagger
 * /crews/{crewId}:
 *   delete:
 *     summary: Delete a crew by ID
 *     tags: [Crews]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *     responses:
 *       200:
 *         description: The crew was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Crews deleted successfully
 *       404:
 *         description: Crew not found
 *       500:
 *         description: Server error
 */
router.delete('/:crewId', CrewsController.deleteCrews);

/**
 * @swagger
 * /crews/details/{crewId}:
 *   get:
 *     summary: Get detailed crew information
 *     tags: [Crews]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the crew to retrieve details for
 *     responses:
 *       200:
 *         description: Detailed crew information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   routeid:
 *                     type: integer
 *                   routecode:
 *                     type: string
 *                   ticketid:
 *                     type: integer
 *                   ticketcode:
 *                     type: string
 *                     nullable: true
 *                   taskstatusid:
 *                     type: integer
 *                     nullable: true
 *                   taskstatusname:
 *                     type: string
 *                     nullable: true
 *                   addressnumber:
 *                     type: string
 *                     nullable: true
 *                   addresscardinal:
 *                     type: string
 *                     nullable: true
 *                   addressstreet:
 *                     type: string
 *                     nullable: true
 *                   addresssuffix:
 *                     type: string
 *                     nullable: true
 *                   contractunitid:
 *                     type: integer
 *                     nullable: true
 *                   itemcode:
 *                     type: string
 *                     nullable: true
 *                   contractunit_name:
 *                     type: string
 *                     nullable: true
 *                   unit:
 *                     type: string
 *                     nullable: true
 *                   contractunit_description:
 *                     type: string
 *                     nullable: true
 *                   costperunit:
 *                     type: number
 *                     format: float
 *                     nullable: true
 *                   zone:
 *                     type: string
 *                     nullable: true
 *                   paymentclause:
 *                     type: string
 *                     nullable: true
 *                   necessaryphaseid:
 *                     type: integer
 *                     nullable: true
 *                   phase_name:
 *                     type: string
 *                     nullable: true
 *                   phase_description:
 *                     type: string
 *                     nullable: true
 *       404:
 *         description: Crew not found
 *       500:
 *         description: Server error
 */
router.get('/details/:crewId', CrewsController.getCrewDetails);


module.exports = router; 