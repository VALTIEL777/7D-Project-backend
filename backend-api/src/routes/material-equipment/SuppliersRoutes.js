const express = require('express');
const SuppliersController = require('../../controllers/material-equipment/SuppliersController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Management of material and equipment suppliers
 */

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - email
 *               - address
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the supplier.
 *                 example: Building Materials Inc.
 *               phone:
 *                 type: string
 *                 description: The contact phone number of the supplier.
 *                 example: '555-123-4567'
 *               email:
 *                 type: string
 *                 description: The contact email of the supplier.
 *                 example: contact@materials.com
 *               address:
 *                 type: string
 *                 description: The physical address of the supplier.
 *                 example: 123 Industrial Rd, Anytown
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this supplier entry.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this supplier entry.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The supplier was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplierId:
 *                   type: integer
 *                   description: The auto-generated ID of the supplier.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Building Materials Inc.
 *       500:
 *         description: Server error
 */
router.post('/', SuppliersController.createSupplier);

/**
 * @swagger
 * /suppliers/{supplierId}:
 *   get:
 *     summary: Get a supplier by ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the supplier.
 *     responses:
 *       200:
 *         description: Supplier found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplierId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Building Materials Inc.
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.get('/:supplierId', SuppliersController.getSupplierById);

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Retrieve a list of all suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: A list of suppliers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   supplierId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Building Materials Inc.
 *       500:
 *         description: Server error
 */
router.get('/', SuppliersController.getAllSuppliers);

/**
 * @swagger
 * /suppliers/{supplierId}:
 *   put:
 *     summary: Update a supplier by ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the supplier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the supplier.
 *                 example: Construction Supplies Co.
 *               phone:
 *                 type: string
 *                 description: The updated phone number.
 *                 example: '555-987-6543'
 *               email:
 *                 type: string
 *                 description: The updated email.
 *                 example: sales@constructionsupplies.com
 *               address:
 *                 type: string
 *                 description: The updated address.
 *                 example: 456 Business Park, Townsville
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The supplier was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplierId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Construction Supplies Co.
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.put('/:supplierId', SuppliersController.updateSupplier);

/**
 * @swagger
 * /suppliers/{supplierId}:
 *   delete:
 *     summary: Delete a supplier by ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the supplier.
 *     responses:
 *       200:
 *         description: The supplier was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.delete('/:supplierId', SuppliersController.deleteSupplier);

module.exports = router; 