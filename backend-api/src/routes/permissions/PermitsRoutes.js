const express = require('express');
const PermitsController = require('../../controllers/permissions/PermitsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permits
 *   description: Managing construction permits
 */

/**
 * @swagger
 * /permits:
 *   post:
 *     summary: Create a new permit record
 *     tags: [Permits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permitNumber
 *               - status
 *               - startDate
 *               - expireDate
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               permitNumber:
 *                 type: string
 *                 description: The unique number of the permit.
 *                 example: 'PRMT001'
 *               status:
 *                 type: boolean
 *                 description: The status of the permit (true for active, false for inactive).
 *                 example: true
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the permit.
 *                 example: 2023-01-01
 *               expireDate:
 *                 type: string
 *                 format: date
 *                 description: The expiration date of the permit.
 *                 example: 2024-01-01
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
 *         description: The permit record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 PermitId:
 *                   type: integer
 *                   description: The auto-generated ID of the permit.
 *                   example: 1
 *                 permitNumber:
 *                   type: string
 *                   example: 'PRMT001'
 *       500:
 *         description: Server error
 */
router.post('/', PermitsController.createPermit);

/**
 * @swagger
 * /permits/{PermitId}:
 *   get:
 *     summary: Get a permit record by ID
 *     tags: [Permits]
 *     parameters:
 *       - in: path
 *         name: PermitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the permit.
 *     responses:
 *       200:
 *         description: Permit record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 PermitId:
 *                   type: integer
 *                   example: 1
 *                 permitNumber:
 *                   type: string
 *                   example: 'PRMT001'
 *       404:
 *         description: Permit not found
 *       500:
 *         description: Server error
 */
router.get('/:PermitId', PermitsController.getPermitById);

/**
 * @swagger
 * /permits:
 *   get:
 *     summary: Retrieve a list of all permit records
 *     tags: [Permits]
 *     responses:
 *       200:
 *         description: A list of permit records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   PermitId:
 *                     type: integer
 *                     example: 1
 *                   permitNumber:
 *                     type: string
 *                     example: 'PRMT001'
 *       500:
 *         description: Server error
 */
router.get('/', PermitsController.getAllPermits);

/**
 * @swagger
 * /permits/{PermitId}:
 *   put:
 *     summary: Update a permit record by ID
 *     tags: [Permits]
 *     parameters:
 *       - in: path
 *         name: PermitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the permit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permitNumber:
 *                 type: string
 *                 description: The updated permit number.
 *                 example: 'PRMT002'
 *               status:
 *                 type: boolean
 *                 description: The updated status of the permit.
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
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The permit record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 PermitId:
 *                   type: integer
 *                   example: 1
 *                 permitNumber:
 *                   type: string
 *                   example: 'PRMT002'
 *       404:
 *         description: Permit not found
 *       500:
 *         description: Server error
 */
router.put('/:PermitId', PermitsController.updatePermit);

/**
 * @swagger
 * /permits/{PermitId}:
 *   delete:
 *     summary: Delete a permit record by ID
 *     tags: [Permits]
 *     parameters:
 *       - in: path
 *         name: PermitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the permit.
 *     responses:
 *       200:
 *         description: The permit record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Permit deleted successfully
 *       404:
 *         description: Permit not found
 *       500:
 *         description: Server error
 */
router.delete('/:PermitId', PermitsController.deletePermit);

module.exports = router; 