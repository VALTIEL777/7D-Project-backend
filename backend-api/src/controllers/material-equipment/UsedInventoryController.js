const UsedInventory = require('../../models/material-equipment/UsedInventory');

const UsedInventoryController = {
  async createUsedInventory(req, res) {
    try {
      const { CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy } = req.body;
      const newUsedInventory = await UsedInventory.create(CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy);
      res.status(201).json(newUsedInventory);
    } catch (error) {
      console.error('Error creating UsedInventory:', error);
      res.status(500).json({ message: 'Error creating UsedInventory', error: error.message });
    }
  },

  async getUsedInventoryById(req, res) {
    try {
      const { CrewId, inventoryId } = req.params;
      const usedInventory = await UsedInventory.findById(CrewId, inventoryId);
      if (!usedInventory) {
        return res.status(404).json({ message: 'UsedInventory not found' });
      }
      res.status(200).json(usedInventory);
    } catch (error) {
      console.error('Error fetching UsedInventory by ID:', error);
      res.status(500).json({ message: 'Error fetching UsedInventory', error: error.message });
    }
  },

  async getAllUsedInventory(req, res) {
    try {
      const allUsedInventory = await UsedInventory.findAll();
      res.status(200).json(allUsedInventory);
    } catch (error) {
      console.error('Error fetching all UsedInventory:', error);
      res.status(500).json({ message: 'Error fetching UsedInventory', error: error.message });
    }
  },

  async updateUsedInventory(req, res) {
    try {
      const { CrewId, inventoryId } = req.params;
      const { quantity, MaterialCost, updatedBy } = req.body;
      const updatedUsedInventory = await UsedInventory.update(CrewId, inventoryId, quantity, MaterialCost, updatedBy);
      if (!updatedUsedInventory) {
        return res.status(404).json({ message: 'UsedInventory not found' });
      }
      res.status(200).json(updatedUsedInventory);
    } catch (error) {
      console.error('Error updating UsedInventory:', error);
      res.status(500).json({ message: 'Error updating UsedInventory', error: error.message });
    }
  },

  async deleteUsedInventory(req, res) {
    try {
      const { CrewId, inventoryId } = req.params;
      const deletedUsedInventory = await UsedInventory.delete(CrewId, inventoryId);
      if (!deletedUsedInventory) {
        return res.status(404).json({ message: 'UsedInventory not found' });
      }
      res.status(200).json({ message: 'UsedInventory deleted successfully' });
    } catch (error) {
      console.error('Error deleting UsedInventory:', error);
      res.status(500).json({ message: 'Error deleting UsedInventory', error: error.message });
    }
  },
};

module.exports = UsedInventoryController; 