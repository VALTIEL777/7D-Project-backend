const Diggers = require('../../models/Permissions/Diggers');

const DiggersController = {
  async createDigger(req, res) {
    try {
      const { permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy } = req.body;
      const newDigger = await Diggers.create(permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy);
      res.status(201).json(newDigger);
    } catch (error) {
      console.error('Error creating Digger:', error);
      res.status(500).json({ message: 'Error creating Digger', error: error.message });
    }
  },

  async getDiggerById(req, res) {
    try {
      const { diggerId } = req.params;
      const digger = await Diggers.findById(diggerId);
      if (!digger) {
        return res.status(404).json({ message: 'Digger not found' });
      }
      res.status(200).json(digger);
    } catch (error) {
      console.error('Error fetching Digger by ID:', error);
      res.status(500).json({ message: 'Error fetching Digger', error: error.message });
    }
  },

  async getAllDiggers(req, res) {
    try {
      const allDiggers = await Diggers.findAll();
      res.status(200).json(allDiggers);
    } catch (error) {
      console.error('Error fetching all Diggers:', error);
      res.status(500).json({ message: 'Error fetching Diggers', error: error.message });
    }
  },

  async updateDigger(req, res) {
    try {
      const { diggerId } = req.params;
      const { permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy } = req.body;
      const updatedDigger = await Diggers.update(diggerId, permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy);
      if (!updatedDigger) {
        return res.status(404).json({ message: 'Digger not found' });
      }
      res.status(200).json(updatedDigger);
    } catch (error) {
      console.error('Error updating Digger:', error);
      res.status(500).json({ message: 'Error updating Digger', error: error.message });
    }
  },

  async deleteDigger(req, res) {
    try {
      const { diggerId } = req.params;
      const deletedDigger = await Diggers.delete(diggerId);
      if (!deletedDigger) {
        return res.status(404).json({ message: 'Digger not found' });
      }
      res.status(200).json({ message: 'Digger deleted successfully' });
    } catch (error) {
      console.error('Error deleting Digger:', error);
      res.status(500).json({ message: 'Error deleting Digger', error: error.message });
    }
  },
};

module.exports = DiggersController; 