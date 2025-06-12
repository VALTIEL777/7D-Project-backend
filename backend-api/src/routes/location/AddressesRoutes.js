const express = require('express');
const AddressesController = require('../../controllers/location/AddressesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Managing addresses for tickets and locations
 */

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressNumber
 *               - addressCardinal
 *               - addressStreet
 *               - addressSuffix
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               addressNumber:
 *                 type: string
 *                 description: The house or building number.
 *                 example: '123'
 *               addressCardinal:
 *                 type: string
 *                 description: The cardinal direction (e.g., 'N', 'S', 'E', 'W').
 *                 example: N
 *               addressStreet:
 *                 type: string
 *                 description: The name of the street.
 *                 example: Maple
 *               addressSuffix:
 *                 type: string
 *                 description: The street suffix (e.g., 'St', 'Ave', 'Ln').
 *                 example: St
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this address.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this address.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The address was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addressId:
 *                   type: integer
 *                   description: The auto-generated ID of the address.
 *                   example: 1
 *                 addressStreet:
 *                   type: string
 *                   example: Maple
 *       500:
 *         description: Server error
 */
router.post('/', AddressesController.createAddress);

/**
 * @swagger
 * /addresses/{addressId}:
 *   get:
 *     summary: Get an address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     responses:
 *       200:
 *         description: Address found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *                 addressStreet:
 *                   type: string
 *                   example: Maple
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.get('/:addressId', AddressesController.getAddressById);

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Retrieve a list of all addresses
 *     tags: [Addresses]
 *     responses:
 *       200:
 *         description: A list of addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   addressId:
 *                     type: integer
 *                     example: 1
 *                   addressStreet:
 *                     type: string
 *                     example: Maple
 *       500:
 *         description: Server error
 */
router.get('/', AddressesController.getAllAddresses);

/**
 * @swagger
 * /addresses/{addressId}:
 *   put:
 *     summary: Update an address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressNumber:
 *                 type: string
 *                 description: The updated house or building number.
 *                 example: '456'
 *               addressCardinal:
 *                 type: string
 *                 description: The updated cardinal direction.
 *                 example: S
 *               addressStreet:
 *                 type: string
 *                 description: The updated street name.
 *                 example: Oak
 *               addressSuffix:
 *                 type: string
 *                 description: The updated street suffix.
 *                 example: Ave
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this address.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The address was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addressId:
 *                   type: integer
 *                   example: 1
 *                 addressStreet:
 *                   type: string
 *                   example: Oak
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.put('/:addressId', AddressesController.updateAddress);

/**
 * @swagger
 * /addresses/{addressId}:
 *   delete:
 *     summary: Delete an address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the address.
 *     responses:
 *       200:
 *         description: The address was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Address deleted successfully
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete('/:addressId', AddressesController.deleteAddress);

module.exports = router; 