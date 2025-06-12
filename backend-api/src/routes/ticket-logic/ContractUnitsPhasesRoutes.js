const express = require('express');
const ContractUnitsPhasesController = require('../../controllers/ticket-logic/ContractUnitsPhasesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contract Units Phases
 *   description: Managing associations between contract units and necessary phases
 */

/**
 * @swagger
 * /contractunitsphases:
 *   post:
 *     summary: Create a new contract unit phase association
 *     tags: [Contract Units Phases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractUnitId
 *               - necessaryPhaseId
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               contractUnitId:
 *                 type: integer
 *                 description: The ID of the contract unit.
 *                 example: 1
 *               necessaryPhaseId:
 *                 type: integer
 *                 description: The ID of the necessary phase.
 *                 example: 1
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
 *         description: The contract unit phase association was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractUnitId:
 *                   type: integer
 *                   example: 1
 *                 necessaryPhaseId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Server error
 */
router.post('/', ContractUnitsPhasesController.createContractUnitsPhases);

/**
 * @swagger
 * /contractunitsphases/{contractUnitId}/{necessaryPhaseId}:
 *   get:
 *     summary: Get a contract unit phase association by contract unit ID and necessary phase ID
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the contract unit.
 *       - in: path
 *         name: necessaryPhaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the necessary phase.
 *     responses:
 *       200:
 *         description: Contract unit phase association found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractUnitId:
 *                   type: integer
 *                   example: 1
 *                 necessaryPhaseId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Contract unit phase association not found
 *       500:
 *         description: Server error
 */
router.get('/:contractUnitId/:necessaryPhaseId', ContractUnitsPhasesController.getContractUnitsPhasesById);

/**
 * @swagger
 * /contractunitsphases:
 *   get:
 *     summary: Retrieve a list of all contract unit phase associations
 *     tags: [Contract Units Phases]
 *     responses:
 *       200:
 *         description: A list of contract unit phase associations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   contractUnitId:
 *                     type: integer
 *                     example: 1
 *                   necessaryPhaseId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get('/', ContractUnitsPhasesController.getAllContractUnitsPhases);

/**
 * @swagger
 * /contractunitsphases/{contractUnitId}/{necessaryPhaseId}:
 *   put:
 *     summary: Update a contract unit phase association by contract unit ID and necessary phase ID
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the contract unit.
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
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The contract unit phase association was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractUnitId:
 *                   type: integer
 *                   example: 1
 *                 necessaryPhaseId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Contract unit phase association not found
 *       500:
 *         description: Server error
 */
router.put('/:contractUnitId/:necessaryPhaseId', ContractUnitsPhasesController.updateContractUnitsPhases);

/**
 * @swagger
 * /contractunitsphases/{contractUnitId}/{necessaryPhaseId}:
 *   delete:
 *     summary: Delete a contract unit phase association by contract unit ID and necessary phase ID
 *     tags: [Contract Units Phases]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the contract unit.
 *       - in: path
 *         name: necessaryPhaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the necessary phase.
 *     responses:
 *       200:
 *         description: The contract unit phase association was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ContractUnitsPhases deleted successfully
 *       404:
 *         description: Contract unit phase association not found
 *       500:
 *         description: Server error
 */
router.delete('/:contractUnitId/:necessaryPhaseId', ContractUnitsPhasesController.deleteContractUnitsPhases);

module.exports = router; 