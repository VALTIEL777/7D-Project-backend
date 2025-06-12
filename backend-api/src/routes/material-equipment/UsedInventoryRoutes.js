const express = require('express');
const UsedInventoryController = require('../../controllers/material-equipment/UsedInventoryController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Used Inventory
 *   description: Managing records of inventory used in crews
 */

/**
 * @swagger
 * /usedinventory:
 *   post:
 *     summary: Create a new used inventory record
 *     tags: [Used Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - CrewId
 *               - inventoryId
 *               - quantity
 *               - MaterialCost
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               CrewId:
 *                 type: integer
 *                 description: The ID of the crew that used the inventory.
 *                 example: 1
 *               inventoryId:
 *                 type: integer
 *                 description: The ID of the inventory item used.
 *                 example: 1
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: The quantity of the inventory item used.
 *                 example: 50.0
 *               MaterialCost:
 *                 type: number
 *                 format: float
 *                 description: The cost incurred for using the material.
 *                 example: 500.00
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
 *         description: The used inventory record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CrewId:
 *                   type: integer
 *                   example: 1
 *                 inventoryId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', UsedInventoryController.createUsedInventory);

/**
 * @swagger
 * /usedinventory/{CrewId}/{inventoryId}:
 *   get:
 *     summary: Get a used inventory record by Crew ID and Inventory ID
 *     tags: [Used Inventory]
 *     parameters:
 *       - in: path
 *         name: CrewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: inventoryId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the inventory item.
 *     responses:
 *       200:
 *         description: Used inventory record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CrewId:
 *                   type: integer
 *                   example: 1
 *                 inventoryId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Used inventory record not found
 *       500:
 *         description: Server error
 */
router.get('/:CrewId/:inventoryId', UsedInventoryController.getUsedInventoryById);

/**
 * @swagger
 * /usedinventory:
 *   get:
 *     summary: Retrieve a list of all used inventory records
 *     tags: [Used Inventory]
 *     responses:
 *       200:
 *         description: A list of used inventory records.
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
 *                   inventoryId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', UsedInventoryController.getAllUsedInventory);

/**
 * @swagger
 * /usedinventory/{CrewId}/{inventoryId}:
 *   put:
 *     summary: Update a used inventory record by Crew ID and Inventory ID
 *     tags: [Used Inventory]
 *     parameters:
 *       - in: path
 *         name: CrewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: inventoryId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the inventory item.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: The updated quantity of the inventory item used.
 *                 example: 45.0
 *               MaterialCost:
 *                 type: number
 *                 format: float
 *                 description: The updated cost incurred.
 *                 example: 450.00
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The used inventory record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CrewId:
 *                   type: integer
 *                   example: 1
 *                 inventoryId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Used inventory record not found
 *       500:
 *         description: Server error
 */
router.put('/:CrewId/:inventoryId', UsedInventoryController.updateUsedInventory);

/**
 * @swagger
 * /usedinventory/{CrewId}/{inventoryId}:
 *   delete:
 *     summary: Delete a used inventory record by Crew ID and Inventory ID
 *     tags: [Used Inventory]
 *     parameters:
 *       - in: path
 *         name: CrewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the crew.
 *       - in: path
 *         name: inventoryId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the inventory item.
 *     responses:
 *       200:
 *         description: The used inventory record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: UsedInventory deleted successfully
 *       404:
 *         description: Used inventory record not found
 *       500:
 *         description: Server error
 */
router.delete('/:CrewId/:inventoryId', UsedInventoryController.deleteUsedInventory);

module.exports = router; 