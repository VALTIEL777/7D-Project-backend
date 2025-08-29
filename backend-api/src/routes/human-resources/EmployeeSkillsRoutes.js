const express = require('express');
const EmployeeSkillsController = require('../../controllers/human-resources/EmployeeSkillsController ');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EmployeeSkills
 *   description: Managing employee skills and proficiency levels
 */

/**
 * @swagger
 * /employee-skills:
 *   post:
 *     summary: Assign a skill to an employee
 *     tags: [EmployeeSkills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - skillId
 *               - proficiencyLevel
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               employeeId:
 *                 type: integer
 *                 description: The ID of the employee.
 *                 example: 1
 *               skillId:
 *                 type: integer
 *                 description: The ID of the skill.
 *                 example: 3
 *               proficiencyLevel:
 *                 type: integer
 *                 description: The proficiency level (1-5).
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this record.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this record.
 *                 example: 1
 *     responses:
 *       201:
 *         description: Employee skill successfully assigned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSkill'
 *       500:
 *         description: Server error
 */
router.post('/', EmployeeSkillsController.createEmployeeSkill);


/**
 * @swagger
 * /employee-skills/employee/{employeeId}:
 *   get:
 *     summary: Retrieve all skills assigned to a specific employee
 *     tags: [EmployeeSkills]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee.
 *     responses:
 *       200:
 *         description: List of skills assigned to the employee.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EmployeeSkill'
 *       500:
 *         description: Server error
 */
router.get('/employee/:employeeId', EmployeeSkillsController.getEmployeeSkillsByEmployee);

/**
 * @swagger
 * /employee-skills/{employeeId}/{skillId}:
 *   get:
 *     summary: Get a specific skill of an employee
 *     tags: [EmployeeSkills]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee.
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the skill.
 *     responses:
 *       200:
 *         description: Employee skill found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSkill'
 *       404:
 *         description: Employee skill not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/:skillId', EmployeeSkillsController.getEmployeeSkillById);

/**
 * @swagger
 * /employee-skills:
 *   get:
 *     summary: Retrieve a list of all employee skills
 *     tags: [EmployeeSkills]
 *     responses:
 *       200:
 *         description: A list of employee skills.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EmployeeSkill'
 *       500:
 *         description: Server error
 */
router.get('/', EmployeeSkillsController.getAllEmployeeSkills);

/**
 * @swagger
 * /employee-skills/{employeeId}/{skillId}:
 *   put:
 *     summary: Update the proficiency level of an employee's skill
 *     tags: [EmployeeSkills]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee.
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the skill.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proficiencyLevel:
 *                 type: integer
 *                 description: The new proficiency level (1-5).
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user updating this record.
 *                 example: 2
 *     responses:
 *       200:
 *         description: Employee skill updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSkill'
 *       404:
 *         description: Employee skill not found
 *       500:
 *         description: Server error
 */
router.put('/:employeeId/:skillId', EmployeeSkillsController.updateEmployeeSkill);

/**
 * @swagger
 * /employee-skills/{employeeId}/{skillId}:
 *   delete:
 *     summary: Delete an employee skill (soft delete)
 *     tags: [EmployeeSkills]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee.
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the skill.
 *     responses:
 *       200:
 *         description: Employee skill deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee skill deleted successfully
 *       404:
 *         description: Employee skill not found
 *       500:
 *         description: Server error
 */
router.delete('/:employeeId/:skillId', EmployeeSkillsController.deleteEmployeeSkill);

module.exports = router;
