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
 *               - UserId
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
 *                 description: The ID of the associated user.
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
 *                 description: The role of the person (e.g., 'Engineer', 'Technician').
 *                 example: Engineer
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
 *         description: The person (employee) was successfully updated.
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
 *         description: The person (employee) was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: People deleted successfully
 *       404:
 *         description: Person (employee) not found
 *       500:
 *         description: Server error
 */
router.delete('/:employeeId', PeopleController.deletePeople);

module.exports = router; 