const express = require('express');
const EquipmentController = require('../../controllers/material-equipment/EquipmentController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Equipment
 *   description: Managing construction equipment
 */

/**
 * @swagger
 * /equipment:
 *   post:
 *     summary: Create a new equipment entry
 *     tags: [Equipment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - equipmentName
 *               - owner
 *               - type
 *               - hourlyRate
 *               - observation
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               supplierId:
 *                 type: integer
 *                 description: The ID of the supplier for this equipment.
 *                 example: 1
 *               equipmentName:
 *                 type: string
 *                 description: The name of the equipment.
 *                 example: Excavator
 *               owner:
 *                 type: string
 *                 description: The owner of the equipment.
 *                 example: XYZ Equipment
 *               type:
 *                 type: string
 *                 description: The type of equipment (e.g., vehicle, tool, machine).
 *                 example: machine
 *               hourlyRate:
 *                 type: number
 *                 format: float
 *                 description: The hourly rate for the equipment.
 *                 example: 100.00
 *               observation:
 *                 type: string
 *                 description: Any observations or notes about the equipment.
 *                 example: Heavy duty excavator
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
 *         description: The equipment entry was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipmentId:
 *                   type: integer
 *                   description: The auto-generated ID of the equipment.
 *                   example: 1
 *                 equipmentName:
 *                   type: string
 *                   example: Excavator
 *       500:
 *         description: Server error
 */
router.post('/', EquipmentController.createEquipment);

/**
 * @swagger
 * /equipment/{equipmentId}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the equipment.
 *     responses:
 *       200:
 *         description: Equipment found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipmentId:
 *                   type: integer
 *                   example: 1
 *                 equipmentName:
 *                   type: string
 *                   example: Excavator
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Server error
 */
router.get('/:equipmentId', EquipmentController.getEquipmentById);

/**
 * @swagger
 * /equipment:
 *   get:
 *     summary: Retrieve a list of all equipment
 *     tags: [Equipment]
 *     responses:
 *       200:
 *         description: A list of equipment.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   equipmentId:
 *                     type: integer
 *                     example: 1
 *                   equipmentName:
 *                     type: string
 *                     example: Excavator
 *       500:
 *         description: Server error
 */
router.get('/', EquipmentController.getAllEquipment);

/**
 * @swagger
 * /equipment/{equipmentId}:
 *   put:
 *     summary: Update equipment by ID
 *     tags: [Equipment]
 *     parameters:
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
 *               supplierId:
 *                 type: integer
 *                 description: The updated ID of the supplier.
 *                 example: 2
 *               equipmentName:
 *                 type: string
 *                 description: The updated name of the equipment.
 *                 example: Heavy Excavator
 *               owner:
 *                 type: string
 *                 description: The updated owner of the equipment.
 *                 example: ABC Company
 *               type:
 *                 type: string
 *                 description: The updated type of equipment.
 *                 example: machine
 *               hourlyRate:
 *                 type: number
 *                 format: float
 *                 description: The updated hourly rate.
 *                 example: 120.00
 *               observation:
 *                 type: string
 *                 description: Updated observations.
 *                 example: Larger and more powerful excavator
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The equipment was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipmentId:
 *                   type: integer
 *                   example: 1
 *                 equipmentName:
 *                   type: string
 *                   example: Heavy Excavator
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Server error
 */
router.put('/:equipmentId', EquipmentController.updateEquipment);

/**
 * @swagger
 * /equipment/{equipmentId}:
 *   delete:
 *     summary: Delete equipment by ID
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the equipment.
 *     responses:
 *       200:
 *         description: The equipment was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Equipment deleted successfully
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Server error
 */
router.delete('/:equipmentId', EquipmentController.deleteEquipment);

module.exports = router; 