const express = require('express');
const DiggersController = require('../../controllers/permissions/DiggersController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Diggers
 *   description: Managing Digger permits
 */

/**
 * @swagger
 * /diggers:
 *   post:
 *     summary: Create a new digger permit record
 *     tags: [Diggers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permitId
 *               - diggerNumber
 *               - status
 *               - startDate
 *               - expireDate
 *               - watchnProtect
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               permitId:
 *                 type: integer
 *                 description: The ID of the associated permit.
 *                 example: 1
 *               diggerNumber:
 *                 type: string
 *                 description: The unique number of the digger permit.
 *                 example: 'DGR001'
 *               status:
 *                 type: boolean
 *                 description: The status of the digger permit (true for active, false for inactive).
 *                 example: true
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the digger permit.
 *                 example: 2023-01-01
 *               expireDate:
 *                 type: string
 *                 format: date
 *                 description: The expiration date of the digger permit.
 *                 example: 2024-01-01
 *               watchnProtect:
 *                 type: boolean
 *                 description: Indicates if 'watch and protect' is required.
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
 *         description: The digger permit record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diggerId:
 *                   type: integer
 *                   description: The auto-generated ID of the digger permit.
 *                   example: 1
 *                 diggerNumber:
 *                   type: string
 *                   example: 'DGR001'
 *       500:
 *         description: Server error
 */
router.post('/', DiggersController.createDigger);

/**
 * @swagger
 * /diggers/{diggerId}:
 *   get:
 *     summary: Get a digger permit record by ID
 *     tags: [Diggers]
 *     parameters:
 *       - in: path
 *         name: diggerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the digger permit.
 *     responses:
 *       200:
 *         description: Digger permit record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diggerId:
 *                   type: integer
 *                   example: 1
 *                 diggerNumber:
 *                   type: string
 *                   example: 'DGR001'
 *       404:
 *         description: Digger permit not found
 *       500:
 *         description: Server error
 */
router.get('/:diggerId', DiggersController.getDiggerById);

/**
 * @swagger
 * /diggers:
 *   get:
 *     summary: Retrieve a list of all digger permit records
 *     tags: [Diggers]
 *     responses:
 *       200:
 *         description: A list of digger permit records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   diggerId:
 *                     type: integer
 *                     example: 1
 *                   diggerNumber:
 *                     type: string
 *                     example: 'DGR001'
 *       500:
 *         description: Server error
 */
router.get('/', DiggersController.getAllDiggers);

/**
 * @swagger
 * /diggers/{diggerId}:
 *   put:
 *     summary: Update a digger permit record by ID
 *     tags: [Diggers]
 *     parameters:
 *       - in: path
 *         name: diggerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the digger permit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permitId:
 *                 type: integer
 *                 description: The updated ID of the associated permit.
 *                 example: 2
 *               diggerNumber:
 *                 type: string
 *                 description: The updated digger permit number.
 *                 example: 'DGR002'
 *               status:
 *                 type: boolean
 *                 description: The updated status of the digger permit.
 *                 example: false
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The updated start date.
 *                 example: 2023-01-05
 *               expireDate:
 *                 type: string
 *                 format: date
 *                 description: The updated expiration date.
 *                 example: 2024-01-05
 *               watchnProtect:
 *                 type: boolean
 *                 description: Updated 'watch and protect' status.
 *                 example: true
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The digger permit record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diggerId:
 *                   type: integer
 *                   example: 1
 *                 diggerNumber:
 *                   type: string
 *                   example: 'DGR002'
 *       404:
 *         description: Digger permit not found
 *       500:
 *         description: Server error
 */
router.put('/:diggerId', DiggersController.updateDigger);

/**
 * @swagger
 * /diggers/{diggerId}:
 *   delete:
 *     summary: Delete a digger permit record by ID
 *     tags: [Diggers]
 *     parameters:
 *       - in: path
 *         name: diggerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the digger permit.
 *     responses:
 *       200:
 *         description: The digger permit record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Digger deleted successfully
 *       404:
 *         description: Digger permit not found
 *       500:
 *         description: Server error
 */
router.delete('/:diggerId', DiggersController.deleteDigger);

module.exports = router; 