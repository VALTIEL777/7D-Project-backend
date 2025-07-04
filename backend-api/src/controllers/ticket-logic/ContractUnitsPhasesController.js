const ContractUnitsPhases = require('../../models/ticket-logic/ContractUnitsPhases');

const ContractUnitsPhasesController = {
  async createContractUnitsPhases(req, res) {
    try {
      const { contractUnitId, necessaryPhaseId, createdBy, updatedBy } = req.body;
      const newContractUnitsPhases = await ContractUnitsPhases.create(contractUnitId, necessaryPhaseId, createdBy, updatedBy);
      res.status(201).json(newContractUnitsPhases);
    } catch (error) {
      console.error('Error creating ContractUnitsPhases:', error);
      res.status(500).json({ message: 'Error creating ContractUnitsPhases', error: error.message });
    }
  },

  async getContractUnitsPhasesById(req, res) {
    try {
      const { contractUnitId, necessaryPhaseId } = req.params;
      const contractUnitsPhases = await ContractUnitsPhases.findById(contractUnitId, necessaryPhaseId);
      if (!contractUnitsPhases) {
        return res.status(404).json({ message: 'ContractUnitsPhases not found' });
      }
      res.status(200).json(contractUnitsPhases);
    } catch (error) {
      console.error('Error fetching ContractUnitsPhases by ID:', error);
      res.status(500).json({ message: 'Error fetching ContractUnitsPhases', error: error.message });
    }
  },

  async getPhasesByContractUnitId(req, res) {
  try {
    const { contractUnitId } = req.params;
    const phases = await ContractUnitsPhases.findByContractUnitId(contractUnitId); // Debes crear esto en el modelo
    if (!phases || phases.length === 0) {
      return res.status(404).json({ message: 'No phases found for this contract unit' });
    }
    res.status(200).json(phases);
  } catch (error) {
    console.error('Error retrieving phases by contractUnitId:', error);
    res.status(500).json({ message: 'Error retrieving phases', error: error.message });
  }
},


  async getAllContractUnitsPhases(req, res) {
    try {
      const allContractUnitsPhases = await ContractUnitsPhases.findAll();
      res.status(200).json(allContractUnitsPhases);
    } catch (error) {
      console.error('Error fetching all ContractUnitsPhases:', error);
      res.status(500).json({ message: 'Error fetching ContractUnitsPhases', error: error.message });
    }
  },

  async updateContractUnitsPhases(req, res) {
    try {
      const { contractUnitId, necessaryPhaseId } = req.params;
      const { updatedBy } = req.body;
      const updatedContractUnitsPhases = await ContractUnitsPhases.update(contractUnitId, necessaryPhaseId, updatedBy);
      if (!updatedContractUnitsPhases) {
        return res.status(404).json({ message: 'ContractUnitsPhases not found' });
      }
      res.status(200).json(updatedContractUnitsPhases);
    } catch (error) {
      console.error('Error updating ContractUnitsPhases:', error);
      res.status(500).json({ message: 'Error updating ContractUnitsPhases', error: error.message });
    }
  },

  async deleteContractUnitsPhases(req, res) {
    try {
      const { contractUnitId, necessaryPhaseId } = req.params;
      const deletedContractUnitsPhases = await ContractUnitsPhases.delete(contractUnitId, necessaryPhaseId);
      if (!deletedContractUnitsPhases) {
        return res.status(404).json({ message: 'ContractUnitsPhases not found' });
      }
      res.status(200).json({ message: 'ContractUnitsPhases deleted successfully' });
    } catch (error) {
      console.error('Error deleting ContractUnitsPhases:', error);
      res.status(500).json({ message: 'Error deleting ContractUnitsPhases', error: error.message });
    }
  },
};

module.exports = ContractUnitsPhasesController; 