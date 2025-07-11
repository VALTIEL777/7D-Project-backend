const express = require('express');
const ContractUnitsPhasesController = require('../../controllers/ticket-logic/ContractUnitsPhasesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contract Units Phases
 *   description: Managing associations between contract units and task statuses
 */

/**
 * @swagger
 * /contractunitsphases:
 *   post:
 *     summary: Create a new contract unit-task status association
 *     tags: [Contract Units Phases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractUnitId
 *               - taskStatusId
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               contractUnitId:
 *                 type: integer
 *                 description: The ID of the contract unit.
 *                 example: 1
 *               taskStatusId:
 *                 type: integer
 *                 description: The ID of the task status.
 *                 example: 1
 *               createdBy:
 *                 type: integer
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 example: 1
 */
router.post('/', ContractUnitsPhasesController.createContractUnitsPhases);

/**
 * @swagger
 * /contractunitsphases/byContractUnit/{contractUnitId}:
 *   get:
 *     summary: Get all task statuses for a given contract unit
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: A list of task statuses.
 *       404:
 *         description: No task statuses found.
 */
router.get('/byContractUnit/:contractUnitId', ContractUnitsPhasesController.getPhasesByContractUnitId);

/**
 * @swagger
 * /contractunitsphases/{contractUnitId}/{taskStatusId}:
 *   get:
 *     summary: Get a contract unit-task status association
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskStatusId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Found.
 *       404:
 *         description: Not found.
 */
router.get('/:contractUnitId/:taskStatusId', ContractUnitsPhasesController.getContractUnitsPhasesById);

/**
 * @swagger
 * /contractunitsphases:
 *   get:
 *     summary: Get all contract unit-task status associations
 *     tags: [Contract Units Phases]
 *     responses:
 *       200:
 *         description: List retrieved.
 */
router.get('/', ContractUnitsPhasesController.getAllContractUnitsPhases);

/**
 * @swagger
 * /contractunitsphases/{contractUnitId}/{taskStatusId}:
 *   put:
 *     summary: Update a contract unit-task status association
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskStatusId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedBy:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Updated successfully.
 *       404:
 *         description: Not found.
 */
router.put('/:contractUnitId/:taskStatusId', ContractUnitsPhasesController.updateContractUnitsPhases);

/**
 * @swagger
 * /contractunitsphases/{contractUnitId}/{taskStatusId}:
 *   delete:
 *     summary: Delete a contract unit-task status association
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskStatusId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted successfully.
 *       404:
 *         description: Not found.
 */
router.delete('/:contractUnitId/:taskStatusId', ContractUnitsPhasesController.deleteContractUnitsPhases);

module.exports = router;
