const express = require('express');
const InventoryController = require('../../controllers/material-equipment/InventoryController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Managing inventory items
 */

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - name
 *               - costPerUnit
 *               - unit
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               supplierId:
 *                 type: integer
 *                 description: The ID of the supplier for this inventory item.
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: The name of the inventory item.
 *                 example: Concrete Mix
 *               costPerUnit:
 *                 type: number
 *                 format: float
 *                 description: The cost per unit of the inventory item.
 *                 example: 10.00
 *               unit:
 *                 type: string
 *                 description: The unit of measurement for the inventory item (e.g., Bag, Foot).
 *                 example: Bag
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
 *         description: The inventory item was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventoryId:
 *                   type: integer
 *                   description: The auto-generated ID of the inventory item.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Concrete Mix
 *       500:
 *         description: Server error
 */
router.post('/', InventoryController.createInventory);

/**
 * @swagger
 * /inventory/{inventoryId}:
 *   get:
 *     summary: Get an inventory item by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the inventory item.
 *     responses:
 *       200:
 *         description: Inventory item found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventoryId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Concrete Mix
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.get('/:inventoryId', InventoryController.getInventoryById);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Retrieve a list of all inventory items
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: A list of inventory items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   inventoryId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Concrete Mix
 *       500:
 *         description: Server error
 */
router.get('/', InventoryController.getAllInventory);

/**
 * @swagger
 * /inventory/{inventoryId}:
 *   put:
 *     summary: Update an inventory item by ID
 *     tags: [Inventory]
 *     parameters:
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
 *               supplierId:
 *                 type: integer
 *                 description: The updated ID of the supplier.
 *                 example: 2
 *               name:
 *                 type: string
 *                 description: The updated name of the inventory item.
 *                 example: Rebar
 *               costPerUnit:
 *                 type: number
 *                 format: float
 *                 description: The updated cost per unit.
 *                 example: 5.00
 *               unit:
 *                 type: string
 *                 description: The updated unit of measurement.
 *                 example: Foot
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The inventory item was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventoryId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Rebar
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.put('/:inventoryId', InventoryController.updateInventory);

/**
 * @swagger
 * /inventory/{inventoryId}:
 *   delete:
 *     summary: Delete an inventory item by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the inventory item.
 *     responses:
 *       200:
 *         description: The inventory item was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Inventory deleted successfully
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.delete('/:inventoryId', InventoryController.deleteInventory);

module.exports = router; 