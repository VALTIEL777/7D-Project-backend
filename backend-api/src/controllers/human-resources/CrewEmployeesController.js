const CrewEmployees = require('../../models/human-resources/CrewEmployees');

const CrewEmployeesController = {
  async createCrewEmployees(req, res) {
    try {
      const { crewId, peopleId, crewLeader, createdBy, updatedBy } = req.body;
      const newCrewEmployees = await CrewEmployees.create(crewId, peopleId, crewLeader, createdBy, updatedBy);
      res.status(201).json(newCrewEmployees);
    } catch (error) {
      console.error('Error creating CrewEmployees:', error);
      res.status(500).json({ message: 'Error creating CrewEmployees', error: error.message });
    }
  },

  async getCrewEmployeesById(req, res) {
    try {
      const { crewId, peopleId } = req.params;
      const crewEmployees = await CrewEmployees.findById(crewId, peopleId);
      if (!crewEmployees) {
        return res.status(404).json({ message: 'CrewEmployees not found' });
      }
      res.status(200).json(crewEmployees);
    } catch (error) {
      console.error('Error fetching CrewEmployees by ID:', error);
      res.status(500).json({ message: 'Error fetching CrewEmployees', error: error.message });
    }
  },

  async getAllCrewEmployees(req, res) {
    try {
      const allCrewEmployees = await CrewEmployees.findAll();
      res.status(200).json(allCrewEmployees);
    } catch (error) {
      console.error('Error fetching all CrewEmployees:', error);
      res.status(500).json({ message: 'Error fetching CrewEmployees', error: error.message });
    }
  },

  async updateCrewEmployees(req, res) {
    try {
      const { crewId, peopleId } = req.params;
      const { crewLeader, updatedBy } = req.body;
      const updatedCrewEmployees = await CrewEmployees.update(crewId, peopleId, crewLeader, updatedBy);
      if (!updatedCrewEmployees) {
        return res.status(404).json({ message: 'CrewEmployees not found' });
      }
      res.status(200).json(updatedCrewEmployees);
    } catch (error) {
      console.error('Error updating CrewEmployees:', error);
      res.status(500).json({ message: 'Error updating CrewEmployees', error: error.message });
    }
  },

  async deleteCrewEmployees(req, res) {
    try {
      const { crewId, peopleId } = req.params;
      const deletedCrewEmployees = await CrewEmployees.delete(crewId, peopleId);
      if (!deletedCrewEmployees) {
        return res.status(404).json({ message: 'CrewEmployees not found' });
      }
      res.status(200).json({ message: 'CrewEmployees deleted successfully' });
    } catch (error) {
      console.error('Error deleting CrewEmployees:', error);
      res.status(500).json({ message: 'Error deleting CrewEmployees', error: error.message });
    }
  },
};

module.exports = CrewEmployeesController; 