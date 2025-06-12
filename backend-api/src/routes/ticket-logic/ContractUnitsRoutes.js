const express = require('express');
const ContractUnitsController = require('../../controllers/ticket-logic/ContractUnitsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contract Units
 *   description: Managing contract units for various construction work items
 */

/**
 * @swagger
 * /contractunits:
 *   post:
 *     summary: Create a new contract unit
 *     tags: [Contract Units]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemCode
 *               - name
 *               - unit
 *               - CostPerUnit
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               neededMobilization:
 *                 type: integer
 *                 description: The ID of a related mobilization contract unit.
 *                 example: 1
 *               neededContractUnit:
 *                 type: integer
 *                 description: The ID of a related contract unit.
 *                 example: 2
 *               itemCode:
 *                 type: string
 *                 description: The unique item code for the contract unit.
 *                 example: 'CU001'
 *               name:
 *                 type: string
 *                 description: The name of the contract unit.
 *                 example: Concrete Slab
 *               unit:
 *                 type: string
 *                 description: The unit of measurement for the contract unit (e.g., Sq Yard, Linear Foot).
 *                 example: Sq Yard
 *               description:
 *                 type: string
 *                 description: A detailed description of the work included.
 *                 example: Standard concrete slab installation including rebar.
 *               workNotIncluded:
 *                 type: string
 *                 description: Work explicitly not included in this contract unit.
 *                 example: Fine grading, sub-base preparation.
 *               CDOTStandardImg:
 *                 type: string
 *                 description: URL or path to the CDOT standard image for this unit.
 *                 example: /images/cdot_slab.jpg
 *               CostPerUnit:
 *                 type: number
 *                 format: float
 *                 description: The cost per unit.
 *                 example: 50.00
 *               zone:
 *                 type: string
 *                 description: The operational zone for this contract unit.
 *                 example: Zone A
 *               PaymentClause:
 *                 type: string
 *                 description: Details about the payment terms for this contract unit.
 *                 example: Payment upon completion and inspection.
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
 *         description: The contract unit was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractUnitId:
 *                   type: integer
 *                   description: The auto-generated ID of the contract unit.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Concrete Slab
 *       500:
 *         description: Server error
 */
router.post('/', ContractUnitsController.createContractUnit);

/**
 * @swagger
 * /contractunits/{contractUnitId}:
 *   get:
 *     summary: Get a contract unit by ID
 *     tags: [Contract Units]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the contract unit.
 *     responses:
 *       200:
 *         description: Contract unit found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractUnitId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Concrete Slab
 *       404:
 *         description: Contract unit not found
 *       500:
 *         description: Server error
 */
router.get('/:contractUnitId', ContractUnitsController.getContractUnitById);

/**
 * @swagger
 * /contractunits:
 *   get:
 *     summary: Retrieve a list of all contract units
 *     tags: [Contract Units]
 *     responses:
 *       200:
 *         description: A list of contract units.
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
 *                   name:
 *                     type: string
 *                     example: Concrete Slab
 *       500:
 *         description: Server error
 */
router.get('/', ContractUnitsController.getAllContractUnits);

/**
 * @swagger
 * /contractunits/{contractUnitId}:
 *   put:
 *     summary: Update a contract unit by ID
 *     tags: [Contract Units]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the contract unit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               neededMobilization:
 *                 type: integer
 *                 description: The updated ID of a related mobilization contract unit.
 *                 example: 1
 *               neededContractUnit:
 *                 type: integer
 *                 description: The updated ID of a related contract unit.
 *                 example: 2
 *               itemCode:
 *                 type: string
 *                 description: The updated item code for the contract unit.
 *                 example: 'CU001-REV'
 *               name:
 *                 type: string
 *                 description: The updated name of the contract unit.
 *                 example: Reinforced Concrete Slab
 *               unit:
 *                 type: string
 *                 description: The updated unit of measurement.
 *                 example: Sq Meter
 *               description:
 *                 type: string
 *                 description: An updated detailed description.
 *                 example: Reinforced concrete slab installation with improved rebar grid.
 *               workNotIncluded:
 *                 type: string
 *                 description: Updated list of work not included.
 *                 example: Advanced drainage systems.
 *               CDOTStandardImg:
 *                 type: string
 *                 description: Updated URL or path to the CDOT standard image.
 *                 example: /images/cdot_slab_v2.jpg
 *               CostPerUnit:
 *                 type: number
 *                 format: float
 *                 description: The updated cost per unit.
 *                 example: 55.00
 *               zone:
 *                 type: string
 *                 description: The updated operational zone.
 *                 example: Zone B
 *               PaymentClause:
 *                 type: string
 *                 description: Updated payment terms.
 *                 example: Net 15 days upon final approval.
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The contract unit was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractUnitId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Reinforced Concrete Slab
 *       404:
 *         description: Contract unit not found
 *       500:
 *         description: Server error
 */
router.put('/:contractUnitId', ContractUnitsController.updateContractUnit);

/**
 * @swagger
 * /contractunits/{contractUnitId}:
 *   delete:
 *     summary: Delete a contract unit by ID
 *     tags: [Contract Units]
 *     parameters:
 *       - in: path
 *         name: contractUnitId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the contract unit.
 *     responses:
 *       200:
 *         description: The contract unit was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ContractUnit deleted successfully
 *       404:
 *         description: Contract unit not found
 *       500:
 *         description: Server error
 */
router.delete('/:contractUnitId', ContractUnitsController.deleteContractUnit);

module.exports = router; 