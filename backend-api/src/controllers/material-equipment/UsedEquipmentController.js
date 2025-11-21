const UsedEquipment = require('../../models/material-equipment/UsedEquipment');

const UsedEquipmentController = {
  async createUsedEquipment(req, res) {
    try {
      const { CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy, ticketId, retrievalCrewId } = req.body;
      const newUsedEquipment = await UsedEquipment.create(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy, ticketId, retrievalCrewId);
      res.status(201).json(newUsedEquipment);
    } catch (error) {
      console.error('Error creating UsedEquipment:', error);
      res.status(500).json({ message: 'Error creating UsedEquipment', error: error.message });
    }
  },

  async getUsedEquipmentById(req, res) {
    try {
      const { CrewId, equipmentId } = req.params;
      const usedEquipment = await UsedEquipment.findById(CrewId, equipmentId);
      if (!usedEquipment) {
        return res.status(404).json({ message: 'UsedEquipment not found' });
      }
      res.status(200).json(usedEquipment);
    } catch (error) {
      console.error('Error fetching UsedEquipment by ID:', error);
      res.status(500).json({ message: 'Error fetching UsedEquipment', error: error.message });
    }
  },

  async getAllUsedEquipment(req, res) {
    try {
      const allUsedEquipment = await UsedEquipment.findAll();
      res.status(200).json(allUsedEquipment);
    } catch (error) {
      console.error('Error fetching all UsedEquipment:', error);
      res.status(500).json({ message: 'Error fetching UsedEquipment', error: error.message });
    }
  },

  async updateUsedEquipment(req, res) {
    try {
      const { CrewId, equipmentId } = req.params;
      const { startDate, endDate, hoursLent, quantity, equipmentCost, observation, updatedBy, ticketId, retrievalCrewId } = req.body;
      const updatedUsedEquipment = await UsedEquipment.update(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, updatedBy, ticketId, retrievalCrewId);
      if (!updatedUsedEquipment) {
        return res.status(404).json({ message: 'UsedEquipment not found' });
      }
      res.status(200).json(updatedUsedEquipment);
    } catch (error) {
      console.error('Error updating UsedEquipment:', error);
      res.status(500).json({ message: 'Error updating UsedEquipment', error: error.message });
    }
  },

  async getUsedEquipmentByTicketId(req, res) {
    try {
      const { ticketId } = req.params;
      const usedEquipment = await UsedEquipment.findByTicketId(ticketId);
      res.status(200).json(usedEquipment);
    } catch (error) {
      console.error('Error fetching UsedEquipment by Ticket ID:', error);
      res.status(500).json({ message: 'Error fetching UsedEquipment', error: error.message });
    }
  },

  async deleteUsedEquipment(req, res) {
    try {
      const { CrewId, equipmentId } = req.params;
      const deletedUsedEquipment = await UsedEquipment.delete(CrewId, equipmentId);
      if (!deletedUsedEquipment) {
        return res.status(404).json({ message: 'UsedEquipment not found' });
      }
      res.status(200).json({ message: 'UsedEquipment deleted successfully' });
    } catch (error) {
      console.error('Error deleting UsedEquipment:', error);
      res.status(500).json({ message: 'Error deleting UsedEquipment', error: error.message });
    }
  },
};

module.exports = UsedEquipmentController; 