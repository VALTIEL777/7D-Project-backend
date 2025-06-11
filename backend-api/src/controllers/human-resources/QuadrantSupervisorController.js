const QuadrantSupervisor = require('../../models/human-resources/QuadrantSupervisor');

const QuadrantSupervisorController = {
  async createQuadrantSupervisor(req, res) {
    try {
      const { employeeId, quadrantId, supervisor, revisor, createdBy, updatedBy } = req.body;
      const newQuadrantSupervisor = await QuadrantSupervisor.create(employeeId, quadrantId, supervisor, revisor, createdBy, updatedBy);
      res.status(201).json(newQuadrantSupervisor);
    } catch (error) {
      console.error('Error creating QuadrantSupervisor:', error);
      res.status(500).json({ message: 'Error creating QuadrantSupervisor', error: error.message });
    }
  },

  async getQuadrantSupervisorById(req, res) {
    try {
      const { employeeId, quadrantId } = req.params;
      const quadrantSupervisor = await QuadrantSupervisor.findById(employeeId, quadrantId);
      if (!quadrantSupervisor) {
        return res.status(404).json({ message: 'QuadrantSupervisor not found' });
      }
      res.status(200).json(quadrantSupervisor);
    } catch (error) {
      console.error('Error fetching QuadrantSupervisor by ID:', error);
      res.status(500).json({ message: 'Error fetching QuadrantSupervisor', error: error.message });
    }
  },

  async getAllQuadrantSupervisors(req, res) {
    try {
      const allQuadrantSupervisors = await QuadrantSupervisor.findAll();
      res.status(200).json(allQuadrantSupervisors);
    } catch (error) {
      console.error('Error fetching all QuadrantSupervisors:', error);
      res.status(500).json({ message: 'Error fetching QuadrantSupervisors', error: error.message });
    }
  },

  async updateQuadrantSupervisor(req, res) {
    try {
      const { employeeId, quadrantId } = req.params;
      const { supervisor, revisor, updatedBy } = req.body;
      const updatedQuadrantSupervisor = await QuadrantSupervisor.update(employeeId, quadrantId, supervisor, revisor, updatedBy);
      if (!updatedQuadrantSupervisor) {
        return res.status(404).json({ message: 'QuadrantSupervisor not found' });
      }
      res.status(200).json(updatedQuadrantSupervisor);
    } catch (error) {
      console.error('Error updating QuadrantSupervisor:', error);
      res.status(500).json({ message: 'Error updating QuadrantSupervisor', error: error.message });
    }
  },

  async deleteQuadrantSupervisor(req, res) {
    try {
      const { employeeId, quadrantId } = req.params;
      const deletedQuadrantSupervisor = await QuadrantSupervisor.delete(employeeId, quadrantId);
      if (!deletedQuadrantSupervisor) {
        return res.status(404).json({ message: 'QuadrantSupervisor not found' });
      }
      res.status(200).json({ message: 'QuadrantSupervisor deleted successfully' });
    } catch (error) {
      console.error('Error deleting QuadrantSupervisor:', error);
      res.status(500).json({ message: 'Error deleting QuadrantSupervisor', error: error.message });
    }
  },
};

module.exports = QuadrantSupervisorController; 