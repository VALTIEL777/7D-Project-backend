const Equipment = require('../../models/material-equipment/Equipment');

const EquipmentController = {
  async createEquipment(req, res) {
    try {
      const { supplierId, equipmentName, owner, type, hourlyRate, observation, createdBy, updatedBy } = req.body;
      const newEquipment = await Equipment.create(supplierId, equipmentName, owner, type, hourlyRate, observation, createdBy, updatedBy);
      res.status(201).json(newEquipment);
    } catch (error) {
      console.error('Error creating Equipment:', error);
      res.status(500).json({ message: 'Error creating Equipment', error: error.message });
    }
  },

  async getEquipmentById(req, res) {
    try {
      const { equipmentId } = req.params;
      const equipment = await Equipment.findById(equipmentId);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      res.status(200).json(equipment);
    } catch (error) {
      console.error('Error fetching Equipment by ID:', error);
      res.status(500).json({ message: 'Error fetching Equipment', error: error.message });
    }
  },

  async getAllEquipment(req, res) {
    try {
      const allEquipment = await Equipment.findAll();
      res.status(200).json(allEquipment);
    } catch (error) {
      console.error('Error fetching all Equipment:', error);
      res.status(500).json({ message: 'Error fetching Equipment', error: error.message });
    }
  },

  async updateEquipment(req, res) {
    try {
      const { equipmentId } = req.params;
      const { supplierId, equipmentName, owner, type, hourlyRate, observation, updatedBy } = req.body;
      const updatedEquipment = await Equipment.update(equipmentId, supplierId, equipmentName, owner, type, hourlyRate, observation, updatedBy);
      if (!updatedEquipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      res.status(200).json(updatedEquipment);
    } catch (error) {
      console.error('Error updating Equipment:', error);
      res.status(500).json({ message: 'Error updating Equipment', error: error.message });
    }
  },

  async deleteEquipment(req, res) {
    try {
      const { equipmentId } = req.params;
      const deletedEquipment = await Equipment.delete(equipmentId);
      if (!deletedEquipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
      console.error('Error deleting Equipment:', error);
      res.status(500).json({ message: 'Error deleting Equipment', error: error.message });
    }
  },
};

module.exports = EquipmentController; 