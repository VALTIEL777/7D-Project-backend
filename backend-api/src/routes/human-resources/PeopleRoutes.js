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
 * /people/with-user:
 *   post:
 *     summary: Create a new person with a new user account simultaneously
 *     tags: [People]
 *     description: Creates both a new user account and a person record in a single atomic operation, establishing the relationship between them.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - firstname
 *               - lastname
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username for the new user account.
 *                 example: john.doe
 *               password:
 *                 type: string
 *                 description: The password for the new user account.
 *                 example: securepassword123
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
 *                 description: The phone number of the person (optional).
 *                 example: '1234567890'
 *               email:
 *                 type: string
 *                 description: The email address of the person (optional).
 *                 example: john.doe@example.com
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this entry (optional).
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry (optional).
 *                 example: 1
 *     responses:
 *       201:
 *         description: Both user and person were successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Person and user created successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       description: The auto-generated ID of the user.
 *                       example: 5
 *                     username:
 *                       type: string
 *                       example: john.doe
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T10:30:00Z"
 *                 person:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: integer
 *                       description: The auto-generated ID of the employee.
 *                       example: 10
 *                     userId:
 *                       type: integer
 *                       description: The ID of the associated user.
 *                       example: 5
 *                     firstname:
 *                       type: string
 *                       example: John
 *                     lastname:
 *                       type: string
 *                       example: Doe
 *                     role:
 *                       type: string
 *                       example: Supervisor
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: username, password, firstname, lastname, role are required"
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username already exists"
 *                 error:
 *                   type: string
 *                   example: "USERNAME_EXISTS"
 *       500:
 *         description: Server error
 */
router.post('/with-user', PeopleController.createPersonWithUser);

/**
 * @swagger
 * /people/{employeeId}/with-user:
 *   put:
 *     summary: Update both person and user simultaneously
 *     tags: [People]
 *     description: Updates both the person record and their associated user account in a single atomic operation.
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee to update
 *         example: 1
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
 *             properties:
 *               username:
 *                 type: string
 *                 description: The updated username for the user account (optional).
 *                 example: john.doe.updated
 *               password:
 *                 type: string
 *                 description: The updated password for the user account (optional).
 *                 example: newsecurepassword123
 *               firstname:
 *                 type: string
 *                 description: The updated first name of the person.
 *                 example: John
 *               lastname:
 *                 type: string
 *                 description: The updated last name of the person.
 *                 example: Doe
 *               role:
 *                 type: string
 *                 description: The updated role of the person.
 *                 example: Supervisor
 *               phone:
 *                 type: string
 *                 description: The updated phone number of the person (optional).
 *                 example: '1234567890'
 *               email:
 *                 type: string
 *                 description: The updated email address of the person (optional).
 *                 example: john.doe@example.com
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user making the update (optional).
 *                 example: 1
 *     responses:
 *       200:
 *         description: Both person and user were successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Person and user updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       description: The ID of the user.
 *                       example: 5
 *                     username:
 *                       type: string
 *                       example: john.doe.updated
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T10:30:00Z"
 *                 person:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: integer
 *                       description: The ID of the employee.
 *                       example: 10
 *                     userId:
 *                       type: integer
 *                       description: The ID of the associated user.
 *                       example: 5
 *                     firstname:
 *                       type: string
 *                       example: John
 *                     lastname:
 *                       type: string
 *                       example: Doe
 *                     role:
 *                       type: string
 *                       example: Supervisor
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: firstname, lastname, role are required"
 *       404:
 *         description: Person not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Person not found"
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username already exists"
 *                 error:
 *                   type: string
 *                   example: "USERNAME_EXISTS"
 *       500:
 *         description: Server error
 */
router.put('/:employeeId/with-user', PeopleController.updatePersonWithUser);

/**
 * @swagger
 * /people/{employeeId}/soft-delete:
 *   delete:
 *     summary: Soft delete person and optionally their user account
 *     tags: [People]
 *     description: Performs a soft delete on the person record and optionally on their associated user account. The records are marked as deleted but not physically removed from the database.
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee to soft delete
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deleteUser:
 *                 type: boolean
 *                 description: "Whether to also soft delete the associated user account (default: false)."
 *                 example: true
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user performing the soft delete (optional).
 *                 example: 1
 *     responses:
 *       200:
 *         description: Person and optionally user were successfully soft deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Person and user soft deleted successfully"
 *                 person:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: integer
 *                       description: The ID of the employee.
 *                       example: 10
 *                     userId:
 *                       type: integer
 *                       description: The ID of the associated user.
 *                       example: 5
 *                     firstname:
 *                       type: string
 *                       example: John
 *                     lastname:
 *                       type: string
 *                       example: Doe
 *                     role:
 *                       type: string
 *                       example: Supervisor
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T10:30:00Z"
 *                 user:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       description: The ID of the user (only if deleteUser was true).
 *                       example: 5
 *                     username:
 *                       type: string
 *                       example: john.doe
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T10:30:00Z"
 *                 deleteUser:
 *                   type: boolean
 *                   description: Whether the user was also soft deleted.
 *                   example: true
 *       404:
 *         description: Person not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Person not found"
 *       500:
 *         description: Server error
 */
router.delete('/:employeeId/soft-delete', PeopleController.softDeletePersonWithUser);

/**
 * @swagger
 * /people/with-users:
 *   get:
 *     summary: Get all people with their associated user information
 *     tags: [People]
 *     description: Retrieves all people with their associated user account information, showing the user-person relationship.
 *     responses:
 *       200:
 *         description: A list of all people with their associated user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employeeId:
 *                     type: integer
 *                     description: The ID of the employee.
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
 *                   phone:
 *                     type: string
 *                     example: '1234567890'
 *                   email:
 *                     type: string
 *                     example: john.doe@example.com
 *                   user:
 *                     type: object
 *                     nullable: true
 *                     description: Associated user account information (null if no user account)
 *                     properties:
 *                       userId:
 *                         type: integer
 *                         description: The ID of the user account.
 *                         example: 5
 *                       username:
 *                         type: string
 *                         example: john.doe
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-06-01T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-06-01T10:30:00Z"
 *                       deletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *       500:
 *         description: Server error
 */
router.get('/with-users', PeopleController.getAllPeopleWithUsers);

/**
 * @swagger
 * /people/{employeeId}/with-user:
 *   get:
 *     summary: Get a person with their associated user information by ID
 *     tags: [People]
 *     description: Retrieves a specific person with their associated user account information, showing the user-person relationship.
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *         example: 1
 *     responses:
 *       200:
 *         description: Person with associated user information found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   description: The ID of the employee.
 *                   example: 1
 *                 firstname:
 *                   type: string
 *                   example: John
 *                 lastname:
 *                   type: string
 *                   example: Doe
 *                 role:
 *                   type: string
 *                   example: Supervisor
 *                 phone:
 *                   type: string
 *                   example: '1234567890'
 *                 email:
 *                   type: string
 *                   example: john.doe@example.com
 *                 user:
 *                   type: object
 *                   nullable: true
 *                   description: Associated user account information (null if no user account)
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       description: The ID of the user account.
 *                       example: 5
 *                     username:
 *                       type: string
 *                       example: john.doe
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T10:30:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T10:30:00Z"
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       404:
 *         description: Person not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/with-user', PeopleController.getPeopleByIdWithUser);

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
// Specific routes must come before parameterized routes
router.get('/with-users', PeopleController.getAllPeopleWithUsers);
router.get('/with-quadrants', PeopleController.getAllPeopleWithQuadrants);

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