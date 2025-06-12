const express = require('express');
const IncidentsMxController = require('../../controllers/ticket-logic/IncidentsMxController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Incidents Mx
 *   description: Managing incidents and their related information
 */

/**
 * @swagger
 * /incidentsmx:
 *   post:
 *     summary: Create a new incident record
 *     tags: [Incidents Mx]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - earliestRptDate
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name or description of the incident.
 *                 example: Water Leak
 *               earliestRptDate:
 *                 type: string
 *                 format: date
 *                 description: The earliest reported date of the incident.
 *                 example: 2023-01-01
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
 *         description: The incident record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidentId:
 *                   type: integer
 *                   description: The auto-generated ID of the incident.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Water Leak
 *       500:
 *         description: Server error
 */
router.post('/', IncidentsMxController.createIncidentMx);

/**
 * @swagger
 * /incidentsmx/{incidentId}:
 *   get:
 *     summary: Get an incident record by ID
 *     tags: [Incidents Mx]
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the incident.
 *     responses:
 *       200:
 *         description: Incident record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidentId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Water Leak
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Server error
 */
router.get('/:incidentId', IncidentsMxController.getIncidentMxById);

/**
 * @swagger
 * /incidentsmx:
 *   get:
 *     summary: Retrieve a list of all incident records
 *     tags: [Incidents Mx]
 *     responses:
 *       200:
 *         description: A list of incident records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   incidentId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Water Leak
 *       500:
 *         description: Server error
 */
router.get('/', IncidentsMxController.getAllIncidentsMx);

/**
 * @swagger
 * /incidentsmx/{incidentId}:
 *   put:
 *     summary: Update an incident record by ID
 *     tags: [Incidents Mx]
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the incident.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name or description of the incident.
 *                 example: Gas Leak
 *               earliestRptDate:
 *                 type: string
 *                 format: date
 *                 description: The updated earliest reported date.
 *                 example: 2023-01-05
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The incident record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidentId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Gas Leak
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Server error
 */
router.put('/:incidentId', IncidentsMxController.updateIncidentMx);

/**
 * @swagger
 * /incidentsmx/{incidentId}:
 *   delete:
 *     summary: Delete an incident record by ID
 *     tags: [Incidents Mx]
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the incident.
 *     responses:
 *       200:
 *         description: The incident record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: IncidentMx deleted successfully
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Server error
 */
router.delete('/:incidentId', IncidentsMxController.deleteIncidentMx);

module.exports = router; 