const express = require('express');
const UsedEquipmentController = require('../../controllers/material-equipment/UsedEquipmentController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Used Equipment
 *   description: Managing records of equipment used in crews
 */

/**
 * @swagger
 * /usedequipment:
 *   post:
 *     summary: Create a new used equipment record
 *     tags: [Used Equipment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - CrewId
 *               - equipmentId
 *               - startDate
 *               - endDate
 *               - hoursLent
 *               - quantity
 *               - equipmentCost
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               CrewId:
 *                 type: integer
 *                 description: The ID of the crew that used the equipment.
 *                 example: 1
 *               equipmentId:
 *                 type: integer
 *                 description: The ID of the equipment used.
 *                 example: 1
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date and time of equipment usage.
 *                 example: 2023-01-01T08:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: The end date and time of equipment usage.
 *                 example: 2023-01-01T17:00:00Z
 *               hoursLent:
 *                 type: number
 *                 format: float
 *                 description: The number of hours the equipment was lent.
 *                 example: 9.0
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the equipment used.
 *                 example: 1
 *               equipmentCost:
 *                 type: number
 *                 format: float
 *                 description: The cost incurred for using the equipment.
 *                 example: 900.00
 *               observation:
 *                 type: string
 *                 description: Any observations about the equipment usage.
 *                 example: Equipment performed well.
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
 *         description: The used equipment record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CrewId:
 *                   type: integer
 *                   example: 1
 *                 equipmentId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', UsedEquipmentController.createUsedEquipment);

/**
 * @swagger
 * /usedequipment/{CrewId}/{equipmentId}:
 *   get:
 *     summary: Get a used equipment record by Crew ID and Equipment ID
 *     tags: [Used Equipment]
 *     parameters:
 *       - in: path
 *         name: CrewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: equipmentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the equipment.
 *     responses:
 *       200:
 *         description: Used equipment record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CrewId:
 *                   type: integer
 *                   example: 1
 *                 equipmentId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Used equipment record not found
 *       500:
 *         description: Server error
 */
router.get('/:CrewId/:equipmentId', UsedEquipmentController.getUsedEquipmentById);

/**
 * @swagger
 * /usedequipment:
 *   get:
 *     summary: Retrieve a list of all used equipment records
 *     tags: [Used Equipment]
 *     responses:
 *       200:
 *         description: A list of used equipment records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   CrewId:
 *                     type: integer
 *                     example: 1
 *                   equipmentId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', UsedEquipmentController.getAllUsedEquipment);

/**
 * @swagger
 * /usedequipment/{CrewId}/{equipmentId}:
 *   put:
 *     summary: Update a used equipment record by Crew ID and Equipment ID
 *     tags: [Used Equipment]
 *     parameters:
 *       - in: path
 *         name: CrewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: equipmentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the equipment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The updated start date and time of equipment usage.
 *                 example: 2023-01-02T09:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: The updated end date and time of equipment usage.
 *                 example: 2023-01-02T18:00:00Z
 *               hoursLent:
 *                 type: number
 *                 format: float
 *                 description: The updated number of hours the equipment was lent.
 *                 example: 8.5
 *               quantity:
 *                 type: integer
 *                 description: The updated quantity of equipment used.
 *                 example: 1
 *               equipmentCost:
 *                 type: number
 *                 format: float
 *                 description: The updated cost incurred.
 *                 example: 850.00
 *               observation:
 *                 type: string
 *                 description: Updated observations about equipment usage.
 *                 example: Equipment worked perfectly.
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The used equipment record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CrewId:
 *                   type: integer
 *                   example: 1
 *                 equipmentId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Used equipment record not found
 *       500:
 *         description: Server error
 */
router.put('/:CrewId/:equipmentId', UsedEquipmentController.updateUsedEquipment);

/**
 * @swagger
 * /usedequipment/{CrewId}/{equipmentId}:
 *   delete:
 *     summary: Delete a used equipment record by Crew ID and Equipment ID
 *     tags: [Used Equipment]
 *     parameters:
 *       - in: path
 *         name: CrewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: equipmentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the equipment.
 *     responses:
 *       200:
 *         description: The used equipment record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: UsedEquipment deleted successfully
 *       404:
 *         description: Used equipment record not found
 *       500:
 *         description: Server error
 */
router.delete('/:CrewId/:equipmentId', UsedEquipmentController.deleteUsedEquipment);

module.exports = router; 