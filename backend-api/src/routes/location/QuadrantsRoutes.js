const express = require('express');
const QuadrantsController = require('../../controllers/location/QuadrantsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quadrants
 *   description: Managing geographic quadrants
 */

/**
 * @swagger
 * /quadrants:
 *   post:
 *     summary: Create a new quadrant
 *     tags: [Quadrants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - shop
 *               - zone
 *               - minLatitude
 *               - maxLatitude
 *               - minLongitude
 *               - maxLongitude
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the quadrant.
 *                 example: Northwest
 *               shop:
 *                 type: string
 *                 description: The shop associated with the quadrant.
 *                 example: Shop A
 *               zone:
 *                 type: string
 *                 description: The zone associated with the quadrant.
 *                 example: Zone 1
 *               minLatitude:
 *                 type: string
 *                 description: Minimum latitude for the quadrant.
 *                 example: '34.000'
 *               maxLatitude:
 *                 type: string
 *                 description: Maximum latitude for the quadrant.
 *                 example: '34.500'
 *               minLongitude:
 *                 type: string
 *                 description: Minimum longitude for the quadrant.
 *                 example: '-118.000'
 *               maxLongitude:
 *                 type: string
 *                 description: Maximum longitude for the quadrant.
 *                 example: '-117.500'
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this quadrant.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this quadrant.
 *                 example: 1
 *               supervisorId:
 *                 type: integer
 *                 description: The ID of the supervisor for this quadrant.
 *                 example: 2
 *               zoneManagerId:
 *                 type: integer
 *                 description: The ID of the zone manager for this quadrant.
 *                 example: 4
 *     responses:
 *       201:
 *         description: The quadrant was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quadrantId:
 *                   type: integer
 *                   description: The auto-generated ID of the quadrant.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Northwest
 *       500:
 *         description: Server error
 */
router.post('/', QuadrantsController.createQuadrant);

/**
 * @swagger
 * /quadrants/supervisor/{supervisorId}:
 *   get:
 *     summary: Get quadrants by supervisor ID
 *     tags: [Quadrants]
 *     parameters:
 *       - in: path
 *         name: supervisorId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the supervisor.
 *     responses:
 *       200:
 *         description: A list of quadrants managed by the supervisor.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   quadrantId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Northwest
 *                   supervisorId:
 *                     type: integer
 *                     example: 2
 *       500:
 *         description: Server error
 */
router.get('/supervisor/:supervisorId', QuadrantsController.getQuadrantsBySupervisor);

/**
 * @swagger
 * /quadrants/zone-manager/{zoneManagerId}:
 *   get:
 *     summary: Get quadrants by zone manager ID
 *     tags: [Quadrants]
 *     parameters:
 *       - in: path
 *         name: zoneManagerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the zone manager.
 *     responses:
 *       200:
 *         description: A list of quadrants managed by the zone manager.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   quadrantId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Northwest
 *                   zoneManagerId:
 *                     type: integer
 *                     example: 4
 *       500:
 *         description: Server error
 */
router.get('/zone-manager/:zoneManagerId', QuadrantsController.getQuadrantsByZoneManager);

/**
 * @swagger
 * /quadrants/{quadrantId}:
 *   get:
 *     summary: Get a quadrant by ID
 *     tags: [Quadrants]
 *     parameters:
 *       - in: path
 *         name: quadrantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the quadrant.
 *     responses:
 *       200:
 *         description: Quadrant found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quadrantId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Northwest
 *       404:
 *         description: Quadrant not found
 *       500:
 *         description: Server error
 */
router.get('/:quadrantId', QuadrantsController.getQuadrantById);

/**
 * @swagger
 * /quadrants:
 *   get:
 *     summary: Retrieve a list of all quadrants
 *     tags: [Quadrants]
 *     responses:
 *       200:
 *         description: A list of quadrants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   quadrantId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Northwest
 *       500:
 *         description: Server error
 */
router.get('/', QuadrantsController.getAllQuadrants);

/**
 * @swagger
 * /quadrants/{quadrantId}:
 *   put:
 *     summary: Update a quadrant by ID
 *     tags: [Quadrants]
 *     parameters:
 *       - in: path
 *         name: quadrantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the quadrant.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the quadrant.
 *                 example: Southwest
 *               shop:
 *                 type: string
 *                 description: The updated shop associated with the quadrant.
 *                 example: Shop D
 *               zone:
 *                 type: string
 *                 description: The updated zone associated with the quadrant.
 *                 example: Zone 2
 *               minLatitude:
 *                 type: string
 *                 description: Updated minimum latitude for the quadrant.
 *                 example: '33.000'
 *               maxLatitude:
 *                 type: string
 *                 description: Updated maximum latitude for the quadrant.
 *                 example: '33.500'
 *               minLongitude:
 *                 type: string
 *                 description: Updated minimum longitude for the quadrant.
 *                 example: '-118.500'
 *               maxLongitude:
 *                 type: string
 *                 description: Updated maximum longitude for the quadrant.
 *                 example: '-118.000'
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this quadrant.
 *                 example: 4
 *               supervisorId:
 *                 type: integer
 *                 description: The updated ID of the supervisor for this quadrant.
 *                 example: 3
 *               zoneManagerId:
 *                 type: integer
 *                 description: The updated ID of the zone manager for this quadrant.
 *                 example: 5
 *     responses:
 *       200:
 *         description: The quadrant was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quadrantId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Southwest
 *       404:
 *         description: Quadrant not found
 *       500:
 *         description: Server error
 */
router.put('/:quadrantId', QuadrantsController.updateQuadrant);

/**
 * @swagger
 * /quadrants/{quadrantId}:
 *   delete:
 *     summary: Delete a quadrant by ID
 *     tags: [Quadrants]
 *     parameters:
 *       - in: path
 *         name: quadrantId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the quadrant.
 *     responses:
 *       200:
 *         description: The quadrant was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Quadrant deleted successfully
 *                 deletedQuadrant:
 *                   type: object
 *                   description: The deleted quadrant data
 *       404:
 *         description: Quadrant not found
 *       500:
 *         description: Server error
 */
router.delete('/:quadrantId', QuadrantsController.deleteQuadrant);

module.exports = router; 