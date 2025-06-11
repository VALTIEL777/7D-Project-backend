const Skills = require('../../models/human-resources/Skills');

const SkillsController = {
  async createSkill(req, res) {
    try {
      const { name, description, createdBy, updatedBy } = req.body;
      const newSkill = await Skills.create(name, description, createdBy, updatedBy);
      res.status(201).json(newSkill);
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({ message: 'Error creating skill', error: error.message });
    }
  },

  async getSkillById(req, res) {
    try {
      const { skillId } = req.params;
      const skill = await Skills.findById(skillId);
      if (!skill) {
        return res.status(404).json({ message: 'Skill not found' });
      }
      res.status(200).json(skill);
    } catch (error) {
      console.error('Error fetching skill by ID:', error);
      res.status(500).json({ message: 'Error fetching skill', error: error.message });
    }
  },

  async getAllSkills(req, res) {
    try {
      const allSkills = await Skills.findAll();
      res.status(200).json(allSkills);
    } catch (error) {
      console.error('Error fetching all skills:', error);
      res.status(500).json({ message: 'Error fetching skills', error: error.message });
    }
  },

  async updateSkill(req, res) {
    try {
      const { skillId } = req.params;
      const { name, description, updatedBy } = req.body;
      const updatedSkill = await Skills.update(skillId, name, description, updatedBy);
      if (!updatedSkill) {
        return res.status(404).json({ message: 'Skill not found' });
      }
      res.status(200).json(updatedSkill);
    } catch (error) {
      console.error('Error updating skill:', error);
      res.status(500).json({ message: 'Error updating skill', error: error.message });
    }
  },

  async deleteSkill(req, res) {
    try {
      const { skillId } = req.params;
      const deletedSkill = await Skills.delete(skillId);
      if (!deletedSkill) {
        return res.status(404).json({ message: 'Skill not found' });
      }
      res.status(200).json({ message: 'Skill deleted successfully' });
    } catch (error) {
      console.error('Error deleting skill:', error);
      res.status(500).json({ message: 'Error deleting skill', error: error.message });
    }
  },
};

module.exports = SkillsController; 