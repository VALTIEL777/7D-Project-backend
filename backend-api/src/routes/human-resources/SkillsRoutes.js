const express = require('express');
const SkillsController = require('../../controllers/human-resources/SkillsController');

const router = express.Router();

router.post('/', SkillsController.createSkill);
router.get('/:skillId', SkillsController.getSkillById);
router.get('/', SkillsController.getAllSkills);
router.put('/:skillId', SkillsController.updateSkill);
router.delete('/:skillId', SkillsController.deleteSkill);

module.exports = router; 