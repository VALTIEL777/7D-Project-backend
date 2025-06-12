const express = require('express');
const NecessaryPhasesController = require('../../controllers/ticket-logic/NecessaryPhasesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Necessary Phases
 *   description: Managing necessary phases for ticket logic
 */

/**
 * @swagger
 * /necessaryphases:
 *   post:
 *     summary: Create a new necessary phase
 *     tags: [Necessary Phases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the necessary phase.
 *                 example: Excavation
 *               description:
 *                 type: string
 *                 description: A detailed description of the phase.
 *                 example: Initial excavation work for the project.
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
 *         description: The necessary phase was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 necessaryPhaseId:
 *                   type: integer
 *                   description: The auto-generated ID of the necessary phase.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Excavation
 *       500:
 *         description: Server error
 */
router.post('/', NecessaryPhasesController.createNecessaryPhases);

/**
 * @swagger
 * /necessaryphases/{necessaryPhaseId}:
 *   get:
 *     summary: Get a necessary phase by ID
 *     tags: [Necessary Phases]
 *     parameters:
 *       - in: path
 *         name: necessaryPhaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the necessary phase.
 *     responses:
 *       200:
 *         description: Necessary phase found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 necessaryPhaseId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Excavation
 *       404:
 *         description: Necessary phase not found
 *       500: 
 *         description: Server error
 */
router.get('/:necessaryPhaseId', NecessaryPhasesController.getNecessaryPhasesById);

/**
 * @swagger
 * /necessaryphases:
 *   get:
 *     summary: Retrieve a list of all necessary phases
 *     tags: [Necessary Phases]
 *     responses:
 *       200:
 *         description: A list of necessary phases.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   necessaryPhaseId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Excavation
 *       500:
 *         description: Server error
 */
router.get('/', NecessaryPhasesController.getAllNecessaryPhases);

/**
 * @swagger
 * /necessaryphases/{necessaryPhaseId}:
 *   put:
 *     summary: Update a necessary phase by ID
 *     tags: [Necessary Phases]
 *     parameters:
 *       - in: path
 *         name: necessaryPhaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the necessary phase.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the necessary phase.
 *                 example: Final Inspection
 *               description:
 *                 type: string
 *                 description: An updated detailed description of the phase.
 *                 example: Final inspection and quality check before project closure.
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The necessary phase was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 necessaryPhaseId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Final Inspection
 *       404:
 *         description: Necessary phase not found
 *       500:
 *         description: Server error
 */
router.put('/:necessaryPhaseId', NecessaryPhasesController.updateNecessaryPhases);

/**
 * @swagger
 * /necessaryphases/{necessaryPhaseId}:
 *   delete:
 *     summary: Delete a necessary phase by ID
 *     tags: [Necessary Phases]
 *     parameters:
 *       - in: path
 *         name: necessaryPhaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the necessary phase.
 *     responses:
 *       200:
 *         description: The necessary phase was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NecessaryPhase deleted successfully
 *       404:
 *         description: Necessary phase not found
 *       500:
 *         description: Server error
 */
router.delete('/:necessaryPhaseId', NecessaryPhasesController.deleteNecessaryPhases);

module.exports = router; 