const ContractUnits = require('../../models/ticket-logic/ContractUnits');

const ContractUnitsController = {
  async createContractUnit(req, res) {
    try {
      const { neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy } = req.body;
      const newContractUnit = await ContractUnits.create(neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy);
      res.status(201).json(newContractUnit);
    } catch (error) {
      console.error('Error creating ContractUnit:', error);
      res.status(500).json({ message: 'Error creating ContractUnit', error: error.message });
    }
  },

  async getContractUnitById(req, res) {
    try {
      const { contractUnitId } = req.params;
      const contractUnit = await ContractUnits.findById(contractUnitId);
      if (!contractUnit) {
        return res.status(404).json({ message: 'ContractUnit not found' });
      }
      res.status(200).json(contractUnit);
    } catch (error) {
      console.error('Error fetching ContractUnit by ID:', error);
      res.status(500).json({ message: 'Error fetching ContractUnit', error: error.message });
    }
  },

  async getAllContractUnits(req, res) {
    try {
      const allContractUnits = await ContractUnits.findAll();
      res.status(200).json(allContractUnits);
    } catch (error) {
      console.error('Error fetching all ContractUnits:', error);
      res.status(500).json({ message: 'Error fetching ContractUnits', error: error.message });
    }
  },

  async updateContractUnit(req, res) {
    try {
      const { contractUnitId } = req.params;
      const { neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, updatedBy } = req.body;
      const updatedContractUnit = await ContractUnits.update(contractUnitId, neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, updatedBy);
      if (!updatedContractUnit) {
        return res.status(404).json({ message: 'ContractUnit not found' });
      }
      res.status(200).json(updatedContractUnit);
    } catch (error) {
      console.error('Error updating ContractUnit:', error);
      res.status(500).json({ message: 'Error updating ContractUnit', error: error.message });
    }
  },

  async deleteContractUnit(req, res) {
    try {
      const { contractUnitId } = req.params;
      const deletedContractUnit = await ContractUnits.delete(contractUnitId);
      if (!deletedContractUnit) {
        return res.status(404).json({ message: 'ContractUnit not found' });
      }
      res.status(200).json({ message: 'ContractUnit deleted successfully' });
    } catch (error) {
      console.error('Error deleting ContractUnit:', error);
      res.status(500).json({ message: 'Error deleting ContractUnit', error: error.message });
    }
  },
};

module.exports = ContractUnitsController; 