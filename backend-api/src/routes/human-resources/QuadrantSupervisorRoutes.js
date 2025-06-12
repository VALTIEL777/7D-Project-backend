const express = require('express');
const QuadrantSupervisorController = require('../../controllers/human-resources/QuadrantSupervisorController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quadrant Supervisors
 *   description: Managing Quadrant Supervisor assignments
 */

/**
 * @swagger
 * /quadrantsupervisors:
 *   post:
 *     summary: Assign a supervisor to a quadrant
 *     tags: [Quadrant Supervisors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - quadrantId
 *               - supervisor
 *               - revisor
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: The ID of the employee (supervisor).
 *                 example: 1
 *               quadrantId:
 *                 type: integer
 *                 description: The ID of the quadrant.
 *                 example: 1
 *               supervisor:
 *                 type: boolean
 *                 description: Indicates if the employee is a supervisor for this quadrant.
 *                 example: true
 *               revisor:
 *                 type: boolean
 *                 description: Indicates if the employee is a revisor for this quadrant.
 *                 example: false
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
 *         description: The Quadrant Supervisor assignment was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 quadrantId:
 *                   type: integer
 *                   example: 1
 *                 supervisor:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Server error
 */
router.post('/', QuadrantSupervisorController.createQuadrantSupervisor);

/**
 * @swagger
 * /quadrantsupervisors/{employeeId}/{quadrantId}:
 *   get:
 *     summary: Get a quadrant supervisor assignment by employee ID and quadrant ID
 *     tags: [Quadrant Supervisors]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *       - in: path
 *         name: quadrantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the quadrant.
 *     responses:
 *       200:
 *         description: Quadrant Supervisor assignment found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 quadrantId:
 *                   type: integer
 *                   example: 1
 *                 supervisor:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Quadrant Supervisor assignment not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/:quadrantId', QuadrantSupervisorController.getQuadrantSupervisorById);

/**
 * @swagger
 * /quadrantsupervisors:
 *   get:
 *     summary: Retrieve a list of all quadrant supervisor assignments
 *     tags: [Quadrant Supervisors]
 *     responses:
 *       200:
 *         description: A list of quadrant supervisor assignments.
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
 *                   quadrantId:
 *                     type: integer
 *                     example: 1
 *                   supervisor:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Server error
 */
router.get('/', QuadrantSupervisorController.getAllQuadrantSupervisors);

/**
 * @swagger
 * /quadrantsupervisors/{employeeId}/{quadrantId}:
 *   put:
 *     summary: Update a quadrant supervisor assignment by employee ID and quadrant ID
 *     tags: [Quadrant Supervisors]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *       - in: path
 *         name: quadrantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the quadrant.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supervisor:
 *                 type: boolean
 *                 description: Updated supervisor status.
 *                 example: false
 *               revisor:
 *                 type: boolean
 *                 description: Updated revisor status.
 *                 example: true
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The Quadrant Supervisor assignment was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId:
 *                   type: integer
 *                   example: 1
 *                 quadrantId:
 *                   type: integer
 *                   example: 1
 *                 supervisor:
 *                   type: boolean
 *                   example: false
 *       404:
 *         description: Quadrant Supervisor assignment not found
 *       500:
 *         description: Server error
 */
router.put('/:employeeId/:quadrantId', QuadrantSupervisorController.updateQuadrantSupervisor);

/**
 * @swagger
 * /quadrantsupervisors/{employeeId}/{quadrantId}:
 *   delete:
 *     summary: Delete a quadrant supervisor assignment by employee ID and quadrant ID
 *     tags: [Quadrant Supervisors]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the employee.
 *       - in: path
 *         name: quadrantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the quadrant.
 *     responses:
 *       200:
 *         description: The Quadrant Supervisor assignment was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: QuadrantSupervisor deleted successfully
 *       404:
 *         description: Quadrant Supervisor assignment not found
 *       500:
 *         description: Server error
 */
router.delete('/:employeeId/:quadrantId', QuadrantSupervisorController.deleteQuadrantSupervisor);

module.exports = router; 