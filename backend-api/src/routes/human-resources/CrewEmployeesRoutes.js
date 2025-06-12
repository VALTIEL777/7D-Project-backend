const express = require('express');
const CrewEmployeesController = require('../../controllers/human-resources/CrewEmployeesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Crew Employees
 *   description: Managing relationships between crews and employees
 */

/**
 * @swagger
 * /crewemployees:
 *   post:
 *     summary: Create a new crew employee entry
 *     tags: [Crew Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crewId
 *               - peopleId
 *               - crewLeader
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               crewId:
 *                 type: integer
 *                 description: The ID of the crew.
 *                 example: 1
 *               peopleId:
 *                 type: integer
 *                 description: The ID of the person (employee).
 *                 example: 1
 *               crewLeader:
 *                 type: boolean
 *                 description: Indicates if the employee is a crew leader.
 *                 example: true
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
 *         description: The crew employee entry was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crewId:
 *                   type: integer
 *                   example: 1
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 crewLeader:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Server error
 */
router.post('/', CrewEmployeesController.createCrewEmployees);

/**
 * @swagger
 * /crewemployees/{crewId}/{peopleId}:
 *   get:
 *     summary: Get a crew employee entry by crew ID and people ID
 *     tags: [Crew Employees]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: peopleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the person (employee).
 *     responses:
 *       200:
 *         description: Crew employee entry found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crewId:
 *                   type: integer
 *                   example: 1
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 crewLeader:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Crew employee entry not found
 *       500:
 *         description: Server error
 */
router.get('/:crewId/:peopleId', CrewEmployeesController.getCrewEmployeesById);

/**
 * @swagger
 * /crewemployees:
 *   get:
 *     summary: Retrieve a list of all crew employee entries
 *     tags: [Crew Employees]
 *     responses:
 *       200:
 *         description: A list of crew employee entries.
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
 *                   employeeId:
 *                     type: integer
 *                     example: 1
 *                   crewLeader:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Server error
 */
router.get('/', CrewEmployeesController.getAllCrewEmployees);

/**
 * @swagger
 * /crewemployees/{crewId}/{peopleId}:
 *   put:
 *     summary: Update a crew employee entry by crew ID and people ID
 *     tags: [Crew Employees]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: peopleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the person (employee).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               crewLeader:
 *                 type: boolean
 *                 description: Updated crew leader status.
 *                 example: false
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The crew employee entry was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crewId:
 *                   type: integer
 *                   example: 1
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 crewLeader:
 *                   type: boolean
 *                   example: false
 *       404:
 *         description: Crew employee entry not found
 *       500:
 *         description: Server error
 */
router.put('/:crewId/:peopleId', CrewEmployeesController.updateCrewEmployees);

/**
 * @swagger
 * /crewemployees/{crewId}/{peopleId}:
 *   delete:
 *     summary: Delete a crew employee entry by crew ID and people ID
 *     tags: [Crew Employees]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: peopleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the person (employee).
 *     responses:
 *       200:
 *         description: The crew employee entry was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: CrewEmployees deleted successfully
 *       404:
 *         description: Crew employee entry not found
 *       500:
 *         description: Server error
 */
router.delete('/:crewId/:peopleId', CrewEmployeesController.deleteCrewEmployees);

module.exports = router; 