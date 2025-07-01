const express = require('express');
const PeopleController = require('../../controllers/human-resources/PeopleController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: People
 *   description: Managing people (employees) information
 */

/**
 * @swagger
 * /people:
 *   post:
 *     summary: Create a new person (employee)
 *     tags: [People]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - role
 *               - phone
 *               - email
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               UserId:
 *                 type: integer
 *                 description: The ID of the associated user (optional).
 *                 example: 1
 *               firstname:
 *                 type: string
 *                 description: The first name of the person.
 *                 example: John
 *               lastname:
 *                 type: string
 *                 description: The last name of the person.
 *                 example: Doe
 *               role:
 *                 type: string
 *                 description: The role of the person (e.g., 'Supervisor', 'Zone Manager', 'Engineer').
 *                 example: Supervisor
 *               phone:
 *                 type: string
 *                 description: The phone number of the person.
 *                 example: '1234567890'
 *               email:
 *                 type: string
 *                 description: The email address of the person.
 *                 example: john.doe@example.com
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
 *         description: The person was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   description: The auto-generated ID of the employee.
 *                   example: 4
 *                 firstname:
 *                   type: string
 *                   example: John
 *                 lastname:
 *                   type: string
 *                   example: Doe
 *       500:
 *         description: Server error
 */
router.post('/', PeopleController.createPeople);

/**
 * @swagger
 * /people/supervisors:
 *   get:
 *     summary: Get all supervisors (for Quadrant supervisorId relationships)
 *     tags: [People]
 *     responses:
 *       200:
 *         description: A list of all supervisors.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     example: 1
 *                   firstname:
 *                     type: string
 *                     example: Renee
 *                   lastname:
 *                     type: string
 *                     example: Mercado
 *                   role:
 *                     type: string
 *                     example: Supervisor
 *       500:
 *         description: Server error
 */
router.get('/supervisors', PeopleController.getSupervisors);

/**
 * @swagger
 * /people/zone-managers:
 *   get:
 *     summary: Get all zone managers (for Quadrant zoneManagerId relationships)
 *     tags: [People]
 *     responses:
 *       200:
 *         description: A list of all zone managers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     example: 4
 *                   firstname:
 *                     type: string
 *                     example: Barbara
 *                   lastname:
 *                     type: string
 *                     example: Powell
 *                   role:
 *                     type: string
 *                     example: Zone 1 Manager
 *       500:
 *         description: Server error
 */
router.get('/zone-managers', PeopleController.getZoneManagers);

/**
 * @swagger
 * /people/with-quadrants:
 *   get:
 *     summary: Get all people with their assigned quadrants
 *     tags: [People]
 *     responses:
 *       200:
 *         description: A list of all people with their assigned quadrants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     example: 1
 *                   firstname:
 *                     type: string
 *                     example: Renee
 *                   lastname:
 *                     type: string
 *                     example: Mercado
 *                   role:
 *                     type: string
 *                     example: Supervisor
 *                   assignedQuadrants:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         quadrantId:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Northwest
 *                         shop:
 *                           type: string
 *                           example: Shop A
 *                         zone:
 *                           type: string
 *                           example: Zone 1
 *                         relationship:
 *                           type: string
 *                           example: supervisor
 *       500:
 *         description: Server error
 */
router.get('/with-quadrants', PeopleController.getAllPeopleWithQuadrants);

/**
 * @swagger
 * /people/role/{role}/with-quadrants:
 *   get:
 *     summary: Get people by role with their assigned quadrants
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: role
 *         schema:
 *           type: string
 *         required: true
 *         description: The role to filter by (e.g., 'Supervisor', 'Zone Manager').
 *     responses:
 *       200:
 *         description: A list of people with the specified role and their assigned quadrants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     example: 1
 *                   firstname:
 *                     type: string
 *                     example: Renee
 *                   lastname:
 *                     type: string
 *                     example: Mercado
 *                   role:
 *                     type: string
 *                     example: Supervisor
 *                   assignedQuadrants:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         quadrantId:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Northwest
 *                         relationship:
 *                           type: string
 *                           example: supervisor
 *       500:
 *         description: Server error
 */
router.get('/role/:role/with-quadrants', PeopleController.getPeopleByRoleWithQuadrants);

/**
 * @swagger
 * /people/role/{role}:
 *   get:
 *     summary: Get people by specific role
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: role
 *         schema:
 *           type: string
 *         required: true
 *         description: The role to filter by (e.g., 'Supervisor', 'Zone Manager', 'Engineer').
 *     responses:
 *       200:
 *         description: A list of people with the specified role.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     example: 1
 *                   firstname:
 *                     type: string
 *                     example: John
 *                   lastname:
 *                     type: string
 *                     example: Doe
 *                   role:
 *                     type: string
 *                     example: Supervisor
 *       500:
 *         description: Server error
 */
router.get('/role/:role', PeopleController.getPeopleByRole);

/**
 * @swagger
 * /people/{employeeId}/with-quadrants:
 *   get:
 *     summary: Get a person with their assigned quadrants by ID
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *     responses:
 *       200:
 *         description: Person with assigned quadrants found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 firstname:
 *                   type: string
 *                   example: Renee
 *                 lastname:
 *                   type: string
 *                   example: Mercado
 *                 role:
 *                   type: string
 *                   example: Supervisor
 *                 assignedQuadrants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       quadrantId:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Northwest
 *                       relationship:
 *                         type: string
 *                         example: supervisor
 *       404:
 *         description: Person not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/with-quadrants', PeopleController.getPeopleByIdWithQuadrants);

/**
 * @swagger
 * /people/{employeeId}/quadrant-assignments:
 *   put:
 *     summary: Update quadrant assignments for a person
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quadrantAssignments
 *             properties:
 *               quadrantAssignments:
 *                 type: array
 *                 description: Array of quadrant assignments to update
 *                 items:
 *                   type: object
 *                   required:
 *                     - quadrantId
 *                     - relationship
 *                   properties:
 *                     quadrantId:
 *                       type: integer
 *                       description: The ID of the quadrant to assign
 *                       example: 1
 *                     relationship:
 *                       type: string
 *                       description: The type of relationship ('supervisor' or 'zoneManager')
 *                       example: supervisor
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user making the update
 *                 example: 1
 *     responses:
 *       200:
 *         description: Quadrant assignments updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Quadrant assignments updated
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       quadrantId:
 *                         type: integer
 *                         example: 1
 *                       relationship:
 *                         type: string
 *                         example: supervisor
 *                       success:
 *                         type: boolean
 *                         example: true
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.put('/:employeeId/quadrant-assignments', PeopleController.updateQuadrantAssignments);

/**
 * @swagger
 * /people/{employeeId}:
 *   get:
 *     summary: Get a person (employee) by ID
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *     responses:
 *       200:
 *         description: Person (employee) found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 firstname:
 *                   type: string
 *                   example: John
 *                 lastname:
 *                   type: string
 *                   example: Doe
 *       404:
 *         description: Person (employee) not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId', PeopleController.getPeopleById);

/**
 * @swagger
 * /people:
 *   get:
 *     summary: Retrieve a list of all people (employees)
 *     tags: [People]
 *     responses:
 *       200:
 *         description: A list of people (employees).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     example: 1
 *                   firstname:
 *                     type: string
 *                     example: John
 *                   lastname:
 *                     type: string
 *                     example: Doe
 *       500:
 *         description: Server error
 */
router.get('/', PeopleController.getAllPeople);

/**
 * @swagger
 * /people/{employeeId}:
 *   put:
 *     summary: Update a person (employee) by ID
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               UserId:
 *                 type: integer
 *                 description: The updated ID of the associated user.
 *                 example: 2
 *               firstname:
 *                 type: string
 *                 description: The updated first name.
 *                 example: Jane
 *               lastname:
 *                 type: string
 *                 description: The updated last name.
 *                 example: Smith
 *               role:
 *                 type: string
 *                 description: The updated role.
 *                 example: Supervisor
 *               phone:
 *                 type: string
 *                 description: The updated phone number.
 *                 example: '0987654321'
 *               email:
 *                 type: string
 *                 description: The updated email address.
 *                 example: jane.smith@example.com
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The person was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 firstname:
 *                   type: string
 *                   example: Jane
 *                 lastname:
 *                   type: string
 *                   example: Smith
 *       404:
 *         description: Person (employee) not found
 *       500:
 *         description: Server error
 */
router.put('/:employeeId', PeopleController.updatePeople);

/**
 * @swagger
 * /people/{employeeId}:
 *   delete:
 *     summary: Delete a person (employee) by ID
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *     responses:
 *       200:
 *         description: The person was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: People deleted successfully
 *                 deletedPerson:
 *                   type: object
 *                   description: The deleted person data
 *       404:
 *         description: Person (employee) not found
 *       500:
 *         description: Server error
 */
router.delete('/:employeeId', PeopleController.deletePeople);

module.exports = router; 