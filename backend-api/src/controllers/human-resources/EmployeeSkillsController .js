const EmployeeSkills = require('../../models/human-resources/EmployeeSkills');

const EmployeeSkillsController = {
  async createEmployeeSkill(req, res) {
    try {
      const { employeeId, skillId, proficiencyLevel, createdBy, updatedBy } = req.body;
      const newEmployeeSkill = await EmployeeSkills.create(
        employeeId,
        skillId,
        proficiencyLevel,
        createdBy,
        updatedBy
      );
      res.status(201).json(newEmployeeSkill);
    } catch (error) {
      console.error('Error creating employee skill:', error);
      res.status(500).json({ message: 'Error creating employee skill', error: error.message });
    }
  },

  async getEmployeeSkillById(req, res) {
    try {
      const { employeeId, skillId } = req.params;
      const employeeSkill = await EmployeeSkills.findById(employeeId, skillId);
      if (!employeeSkill) {
        return res.status(404).json({ message: 'Employee skill not found' });
      }
      res.status(200).json(employeeSkill);
    } catch (error) {
      console.error('Error fetching employee skill by ID:', error);
      res.status(500).json({ message: 'Error fetching employee skill', error: error.message });
    }
  },

  async getEmployeeSkillsByEmployee(req, res) {
    try {
      const { employeeId } = req.params;
      const employeeSkills = await EmployeeSkills.findByEmployee(employeeId);
      res.status(200).json(employeeSkills);
    } catch (error) {
      console.error('Error fetching employee skills by employee:', error);
      res.status(500).json({ message: 'Error fetching employee skills', error: error.message });
    }
  },

  async getAllEmployeeSkills(req, res) {
    try {
      const allEmployeeSkills = await EmployeeSkills.findAll();
      res.status(200).json(allEmployeeSkills);
    } catch (error) {
      console.error('Error fetching all employee skills:', error);
      res.status(500).json({ message: 'Error fetching employee skills', error: error.message });
    }
  },

  async updateEmployeeSkill(req, res) {
    try {
      const { employeeId, skillId } = req.params;
      const { proficiencyLevel, updatedBy } = req.body;
      const updatedEmployeeSkill = await EmployeeSkills.update(
        employeeId,
        skillId,
        proficiencyLevel,
        updatedBy
      );
      if (!updatedEmployeeSkill) {
        return res.status(404).json({ message: 'Employee skill not found' });
      }
      res.status(200).json(updatedEmployeeSkill);
    } catch (error) {
      console.error('Error updating employee skill:', error);
      res.status(500).json({ message: 'Error updating employee skill', error: error.message });
    }
  },

  async deleteEmployeeSkill(req, res) {
    try {
      const { employeeId, skillId } = req.params;
      const deletedEmployeeSkill = await EmployeeSkills.delete(employeeId, skillId);
      if (!deletedEmployeeSkill) {
        return res.status(404).json({ message: 'Employee skill not found' });
      }
      res.status(200).json({ message: 'Employee skill deleted successfully' });
    } catch (error) {
      console.error('Error deleting employee skill:', error);
      res.status(500).json({ message: 'Error deleting employee skill', error: error.message });
    }
  },
};

module.exports = EmployeeSkillsController;
