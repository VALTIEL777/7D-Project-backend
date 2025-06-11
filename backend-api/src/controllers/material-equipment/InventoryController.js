const Inventory = require('../../models/material-equipment/Inventory');

const InventoryController = {
  async createInventory(req, res) {
    try {
      const { supplierId, name, costPerUnit, unit, createdBy, updatedBy } = req.body;
      const newInventory = await Inventory.create(supplierId, name, costPerUnit, unit, createdBy, updatedBy);
      res.status(201).json(newInventory);
    } catch (error) {
      console.error('Error creating Inventory:', error);
      res.status(500).json({ message: 'Error creating Inventory', error: error.message });
    }
  },

  async getInventoryById(req, res) {
    try {
      const { inventoryId } = req.params;
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        return res.status(404).json({ message: 'Inventory not found' });
      }
      res.status(200).json(inventory);
    } catch (error) {
      console.error('Error fetching Inventory by ID:', error);
      res.status(500).json({ message: 'Error fetching Inventory', error: error.message });
    }
  },

  async getAllInventory(req, res) {
    try {
      const allInventory = await Inventory.findAll();
      res.status(200).json(allInventory);
    } catch (error) {
      console.error('Error fetching all Inventory:', error);
      res.status(500).json({ message: 'Error fetching Inventory', error: error.message });
    }
  },

  async updateInventory(req, res) {
    try {
      const { inventoryId } = req.params;
      const { supplierId, name, costPerUnit, unit, updatedBy } = req.body;
      const updatedInventory = await Inventory.update(inventoryId, supplierId, name, costPerUnit, unit, updatedBy);
      if (!updatedInventory) {
        return res.status(404).json({ message: 'Inventory not found' });
      }
      res.status(200).json(updatedInventory);
    } catch (error) {
      console.error('Error updating Inventory:', error);
      res.status(500).json({ message: 'Error updating Inventory', error: error.message });
    }
  },

  async deleteInventory(req, res) {
    try {
      const { inventoryId } = req.params;
      const deletedInventory = await Inventory.delete(inventoryId);
      if (!deletedInventory) {
        return res.status(404).json({ message: 'Inventory not found' });
      }
      res.status(200).json({ message: 'Inventory deleted successfully' });
    } catch (error) {
      console.error('Error deleting Inventory:', error);
      res.status(500).json({ message: 'Error deleting Inventory', error: error.message });
    }
  },
};

module.exports = InventoryController; 