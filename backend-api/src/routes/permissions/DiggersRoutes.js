const express = require('express');
const router = express.Router();
const DiggersController = require('../../controllers/permissions/DiggersController');

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

// Update watchnProtect by ticket ID
router.patch('/ticket/:ticketId/watchn-protect', DiggersController.updateWatchnProtectByTicketId);

// Ensure digger exists and update watchnProtect by ticket ID
router.patch('/ticket/:ticketId/ensure-digger-watchn-protect', DiggersController.ensureDiggerAndUpdateWatchnProtect);

/**
 * @swagger
 * /diggers/fix-orphaned:
 *   post:
 *     summary: Find and fix orphaned digger records
 *     description: Identifies digger records that are not properly associated with permits and attempts to link them to appropriate tickets. This helps resolve issues where diggers exist but are not connected to the correct permit.
 *     tags: [Diggers]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedBy:
 *                 type: integer
 *                 description: User ID who is performing the fix operation
 *                 example: 1
 *     responses:
 *       200:
 *         description: Orphaned digger analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Orphaned digger analysis completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrphaned:
 *                       type: integer
 *                       description: Total number of orphaned diggers found
 *                       example: 5
 *                     fixed:
 *                       type: integer
 *                       description: Number of diggers successfully fixed
 *                       example: 3
 *                     unfixable:
 *                       type: integer
 *                       description: Number of diggers that could not be fixed
 *                       example: 1
 *                     errors:
 *                       type: integer
 *                       description: Number of diggers that encountered errors during fixing
 *                       example: 1
 *                     results:
 *                       type: array
 *                       description: Detailed results for each orphaned digger
 *                       items:
 *                         type: object
 *                         properties:
 *                           diggerId:
 *                             type: integer
 *                             description: Digger ID
 *                             example: 30
 *                           diggerNumber:
 *                             type: string
 *                             description: Digger number
 *                             example: "DGR-123"
 *                           oldPermitId:
 *                             type: integer
 *                             description: Previous permit ID (may be null)
 *                             example: null
 *                           newPermitId:
 *                             type: integer
 *                             description: New permit ID after fixing (only for fixed status)
 *                             example: 45
 *                           ticketId:
 *                             type: integer
 *                             description: Ticket ID the digger was linked to (only for fixed status)
 *                             example: 197
 *                           ticketCode:
 *                             type: string
 *                             description: Ticket code (only for fixed status)
 *                             example: "TK6514243"
 *                           permitNumber:
 *                             type: string
 *                             description: Permit number (only for fixed status)
 *                             example: "DOT2091119"
 *                           status:
 *                             type: string
 *                             enum: [fixed, unfixable, error]
 *                             description: Status of the fix operation
 *                             example: "fixed"
 *                           message:
 *                             type: string
 *                             description: Description of what happened
 *                             example: "Linked digger to ticket TK6514243 with permit DOT2091119"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error finding and fixing orphaned diggers"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post('/fix-orphaned', DiggersController.findAndFixOrphanedDiggers);

// Debug endpoint to test digger creation
router.post('/debug-create', DiggersController.debugDiggerCreation);

/**
 * @swagger
 * /diggers/ticket/{ticketId}/ensure-digger-watchn-protect:
 *   patch:
 *     summary: Ensure digger record exists for a ticket and update watchnProtect property
 *     description: This endpoint ensures that a digger record exists for the ticket's permit. If no digger record exists, it creates one with default values. Then it updates the watchnProtect property to the specified boolean value.
 *     tags: [Diggers]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the ticket
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watchnProtect
 *             properties:
 *               watchnProtect:
 *                 type: boolean
 *                 description: The boolean value to set for the watchnProtect property
 *                 example: true
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user performing the update (optional, defaults to 1)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Digger record ensured and watchnProtect updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Digger record created and watchnProtect updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                       description: The ticket ID
 *                       example: 123
 *                     diggerId:
 *                       type: integer
 *                       description: The digger record ID
 *                       example: 456
 *                     permitId:
 *                       type: integer
 *                       description: The permit ID
 *                       example: 789
 *                     permitNumber:
 *                       type: string
 *                       description: The permit number
 *                       example: "PERM-2024-001"
 *                     permitStatus:
 *                       type: string
 *                       description: The permit status
 *                       example: "ACTIVE"
 *                     watchnProtect:
 *                       type: boolean
 *                       description: The updated watchnProtect value
 *                       example: true
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the record was last updated
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     diggerCreated:
 *                       type: boolean
 *                       description: Whether a new digger record was created
 *                       example: true
 *                     action:
 *                       type: string
 *                       description: The action performed
 *                       example: "created_and_updated"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "watchnProtect must be a boolean value"
 *       404:
 *         description: No permit found for the ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No permit found for this ticket"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error ensuring digger and updating watchnProtect"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */

// Get digger information by ticket ID
router.get('/ticket/:ticketId', DiggersController.getDiggerByTicketId);

module.exports = router; 