const express = require('express');
const SkillsController = require('../../controllers/human-resources/SkillsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Managing employee skills
 */

/**
 * @swagger
 * /skills:
 *   post:
 *     summary: Create a new skill
 *     tags: [Skills]
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
 *                 description: The name of the skill.
 *                 example: Welding
 *               description:
 *                 type: string
 *                 description: A brief description of the skill.
 *                 example: Proficient in various welding techniques
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this skill.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this skill.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The skill was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skillId:
 *                   type: integer
 *                   description: The auto-generated ID of the skill.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Welding
 *       500:
 *         description: Server error
 */
router.post('/', SkillsController.createSkill);

/**
 * @swagger
 * /skills/{skillId}:
 *   get:
 *     summary: Get a skill by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: skillId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the skill.
 *     responses:
 *       200:
 *         description: Skill found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skillId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Welding
 *       404:
 *         description: Skill not found
 *       500:
 *         description: Server error
 */
router.get('/:skillId', SkillsController.getSkillById);

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: Retrieve a list of all skills
 *     tags: [Skills]
 *     responses:
 *       200:
 *         description: A list of skills.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   skillId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Welding
 *       500:
 *         description: Server error
 */
router.get('/', SkillsController.getAllSkills);

/**
 * @swagger
 * /skills/{skillId}:
 *   put:
 *     summary: Update a skill by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: skillId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the skill.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the skill.
 *                 example: Advanced Welding
 *               description:
 *                 type: string
 *                 description: An updated description of the skill.
 *                 example: Expert in various welding techniques, including TIG and MIG.
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this skill.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The skill was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skillId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Advanced Welding
 *       404:
 *         description: Skill not found
 *       500:
 *         description: Server error
 */
router.put('/:skillId', SkillsController.updateSkill);

/**
 * @swagger
 * /skills/{skillId}:
 *   delete:
 *     summary: Delete a skill by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: skillId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the skill.
 *     responses:
 *       200:
 *         description: The skill was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Skill deleted successfully
 *       404:
 *         description: Skill not found
 *       500:
 *         description: Server error
 */
router.delete('/:skillId', SkillsController.deleteSkill);

module.exports = router; 