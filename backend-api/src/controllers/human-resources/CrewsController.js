const Crews = require('../../models/human-resources/Crews');

const CrewsController = {
  async createCrews(req, res) {
    try {
      const { type, photo, workedHours, createdBy, updatedBy } = req.body;
      const newCrews = await Crews.create(type, photo, workedHours, createdBy, updatedBy);
      res.status(201).json(newCrews);
    } catch (error) {
      console.error('Error creating Crews:', error);
      res.status(500).json({ message: 'Error creating Crews', error: error.message });
    }
  },

  async getCrewsById(req, res) {
    try {
      const { crewId } = req.params;
      const crews = await Crews.findById(crewId);
      if (!crews) {
        return res.status(404).json({ message: 'Crews not found' });
      }
      res.status(200).json(crews);
    } catch (error) {
      console.error('Error fetching Crews by ID:', error);
      res.status(500).json({ message: 'Error fetching Crews', error: error.message });
    }
  },

  async getAllCrews(req, res) {
    try {
      const allCrews = await Crews.findAll();
      res.status(200).json(allCrews);
    } catch (error) {
      console.error('Error fetching all Crews:', error);
      res.status(500).json({ message: 'Error fetching Crews', error: error.message });
    }
  },

  async updateCrews(req, res) {
    try {
      const { crewId } = req.params;
      const { type, photo, workedHours, updatedBy } = req.body;
      const updatedCrews = await Crews.update(crewId, type, photo, workedHours, updatedBy);
      if (!updatedCrews) {
        return res.status(404).json({ message: 'Crews not found' });
      }
      res.status(200).json(updatedCrews);
    } catch (error) {
      console.error('Error updating Crews:', error);
      res.status(500).json({ message: 'Error updating Crews', error: error.message });
    }
  },

  async deleteCrews(req, res) {
    try {
      const { crewId } = req.params;
      const deletedCrews = await Crews.delete(crewId);
      if (!deletedCrews) {
        return res.status(404).json({ message: 'Crews not found' });
      }
      res.status(200).json({ message: 'Crews deleted successfully' });
    } catch (error) {
      console.error('Error deleting Crews:', error);
      res.status(500).json({ message: 'Error deleting Crews', error: error.message });
    }
  },
};

module.exports = CrewsController; 