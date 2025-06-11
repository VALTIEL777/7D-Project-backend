const NecessaryPhases = require('../../models/ticket-logic/NecessaryPhases');

const NecessaryPhasesController = {
  async createNecessaryPhases(req, res) {
    try {
      const { name, description, createdBy, updatedBy } = req.body;
      const newNecessaryPhases = await NecessaryPhases.create(name, description, createdBy, updatedBy);
      res.status(201).json(newNecessaryPhases);
    } catch (error) {
      console.error('Error creating NecessaryPhases:', error);
      res.status(500).json({ message: 'Error creating NecessaryPhases', error: error.message });
    }
  },

  async getNecessaryPhasesById(req, res) {
    try {
      const { necessaryPhaseId } = req.params;
      const necessaryPhase = await NecessaryPhases.findById(necessaryPhaseId);
      if (!necessaryPhase) {
        return res.status(404).json({ message: 'NecessaryPhase not found' });
      }
      res.status(200).json(necessaryPhase);
    } catch (error) {
      console.error('Error fetching NecessaryPhase by ID:', error);
      res.status(500).json({ message: 'Error fetching NecessaryPhase', error: error.message });
    }
  },

  async getAllNecessaryPhases(req, res) {
    try {
      const allNecessaryPhases = await NecessaryPhases.findAll();
      res.status(200).json(allNecessaryPhases);
    } catch (error) {
      console.error('Error fetching all NecessaryPhases:', error);
      res.status(500).json({ message: 'Error fetching NecessaryPhases', error: error.message });
    }
  },

  async updateNecessaryPhases(req, res) {
    try {
      const { necessaryPhaseId } = req.params;
      const { name, description, updatedBy } = req.body;
      const updatedNecessaryPhase = await NecessaryPhases.update(necessaryPhaseId, name, description, updatedBy);
      if (!updatedNecessaryPhase) {
        return res.status(404).json({ message: 'NecessaryPhase not found' });
      }
      res.status(200).json(updatedNecessaryPhase);
    } catch (error) {
      console.error('Error updating NecessaryPhase:', error);
      res.status(500).json({ message: 'Error updating NecessaryPhase', error: error.message });
    }
  },

  async deleteNecessaryPhases(req, res) {
    try {
      const { necessaryPhaseId } = req.params;
      const deletedNecessaryPhase = await NecessaryPhases.delete(necessaryPhaseId);
      if (!deletedNecessaryPhase) {
        return res.status(404).json({ message: 'NecessaryPhase not found' });
      }
      res.status(200).json({ message: 'NecessaryPhase deleted successfully' });
    } catch (error) {
      console.error('Error deleting NecessaryPhase:', error);
      res.status(500).json({ message: 'Error deleting NecessaryPhase', error: error.message });
    }
  },
};

module.exports = NecessaryPhasesController; 