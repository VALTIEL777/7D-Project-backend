const express = require('express');
const WayfindingController = require('../../controllers/location/WayfindingController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wayfinding
 *   description: Managing wayfinding information for routes and locations
 */

/**
 * @swagger
 * /wayfinding:
 *   post:
 *     summary: Create a new wayfinding entry
 *     tags: [Wayfinding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - streetFrom
 *               - streetTo
 *               - location
 *               - addressCardinal
 *               - addressStreet
 *               - addressSuffix
 *               - width
 *               - length
 *               - surfaceTotal
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               streetFrom:
 *                 type: string
 *                 description: The starting street of the wayfinding.
 *                 example: Main St
 *               streetTo:
 *                 type: string
 *                 description: The ending street of the wayfinding.
 *                 example: Elm St
 *               location:
 *                 type: string
 *                 description: General location description.
 *                 example: Downtown
 *               addressCardinal:
 *                 type: string
 *                 description: Cardinal direction of the address (N, S, E, W).
 *                 example: N
 *               addressStreet:
 *                 type: string
 *                 description: Street name of the address.
 *                 example: Main
 *               addressSuffix:
 *                 type: string
 *                 description: Street suffix of the address (e.g., St, Ave).
 *                 example: Ave
 *               width:
 *                 type: number
 *                 format: float
 *                 description: Width of the wayfinding area.
 *                 example: 10.5
 *               length:
 *                 type: number
 *                 format: float
 *                 description: Length of the wayfinding area.
 *                 example: 100.2
 *               surfaceTotal:
 *                 type: number
 *                 format: float
 *                 description: Total surface area.
 *                 example: 1052.1
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
 *         description: The wayfinding entry was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wayfindingId:
 *                   type: integer
 *                   description: The auto-generated ID of the wayfinding entry.
 *                   example: 1
 *                 streetFrom:
 *                   type: string
 *                   example: Main St
 *       500:
 *         description: Server error
 */
router.post('/', WayfindingController.createWayfinding);

/**
 * @swagger
 * /wayfinding/{wayfindingId}:
 *   get:
 *     summary: Get a wayfinding entry by ID
 *     tags: [Wayfinding]
 *     parameters:
 *       - in: path
 *         name: wayfindingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the wayfinding entry.
 *     responses:
 *       200:
 *         description: Wayfinding entry found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wayfindingId:
 *                   type: integer
 *                   example: 1
 *                 streetFrom:
 *                   type: string
 *                   example: Main St
 *       404:
 *         description: Wayfinding entry not found
 *       500:
 *         description: Server error
 */
router.get('/:wayfindingId', WayfindingController.getWayfindingById);

/**
 * @swagger
 * /wayfinding:
 *   get:
 *     summary: Retrieve a list of all wayfinding entries
 *     tags: [Wayfinding]
 *     responses:
 *       200:
 *         description: A list of wayfinding entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   wayfindingId:
 *                     type: integer
 *                     example: 1
 *                   streetFrom:
 *                     type: string
 *                     example: Main St
 *       500:
 *         description: Server error
 */
router.get('/', WayfindingController.getAllWayfindings);

/**
 * @swagger
 * /wayfinding/{wayfindingId}:
 *   put:
 *     summary: Update a wayfinding entry by ID
 *     tags: [Wayfinding]
 *     parameters:
 *       - in: path
 *         name: wayfindingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the wayfinding entry.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               streetFrom:
 *                 type: string
 *                 description: The updated starting street.
 *                 example: Oak Ave
 *               streetTo:
 *                 type: string
 *                 description: The updated ending street.
 *                 example: Pine Ln
 *               location:
 *                 type: string
 *                 description: Updated general location description.
 *                 example: Suburb
 *               addressCardinal:
 *                 type: string
 *                 description: Updated cardinal direction.
 *                 example: S
 *               addressStreet:
 *                 type: string
 *                 description: Updated street name.
 *                 example: Oak
 *               addressSuffix:
 *                 type: string
 *                 description: Updated street suffix.
 *                 example: St
 *               width:
 *                 type: number
 *                 format: float
 *                 description: Updated width of the wayfinding area.
 *                 example: 8.0
 *               length:
 *                 type: number
 *                 format: float
 *                 description: Updated length of the wayfinding area.
 *                 example: 75.0
 *               surfaceTotal:
 *                 type: number
 *                 format: float
 *                 description: Updated total surface area.
 *                 example: 600.0
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The wayfinding entry was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wayfindingId:
 *                   type: integer
 *                   example: 1
 *                 streetFrom:
 *                   type: string
 *                   example: Oak Ave
 *       404:
 *         description: Wayfinding entry not found
 *       500:
 *         description: Server error
 */
router.put('/:wayfindingId', WayfindingController.updateWayfinding);

/**
 * @swagger
 * /wayfinding/{wayfindingId}:
 *   delete:
 *     summary: Delete a wayfinding entry by ID
 *     tags: [Wayfinding]
 *     parameters:
 *       - in: path
 *         name: wayfindingId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the wayfinding entry.
 *     responses:
 *       200:
 *         description: The wayfinding entry was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wayfinding deleted successfully
 *       404:
 *         description: Wayfinding entry not found
 *       500:
 *         description: Server error
 */
router.delete('/:wayfindingId', WayfindingController.deleteWayfinding);

module.exports = router; 