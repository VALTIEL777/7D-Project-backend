const ContractUnits = require('../../models/ticket-logic/ContractUnits');

// Helper function to normalize database response to camelCase
const normalizeContractUnit = (dbRecord) => {
  if (!dbRecord) return null;
  
  return {
    contractUnitId: dbRecord.contractunitid,
    neededMobilization: dbRecord.neededmobilization,
    neededContractUnit: dbRecord.neededcontractunit,
    itemCode: dbRecord.itemcode,
    name: dbRecord.name,
    unit: dbRecord.unit,
    description: dbRecord.description,
    workNotIncluded: dbRecord.worknotincluded,
    cdotStandardImg: dbRecord.cdotstandardimg,
    costPerUnit: dbRecord.costperunit,
    zone: dbRecord.zone,
    paymentClause: dbRecord.paymentclause,
    createdAt: dbRecord.createdat,
    updatedAt: dbRecord.updatedat,
    deletedAt: dbRecord.deletedat,
    createdBy: dbRecord.createdby,
    updatedBy: dbRecord.updatedby
  };
};

// Helper function to normalize request body to database format
const normalizeRequest = (reqBody) => {
  return {
    neededMobilization: reqBody.neededMobilization ? Number(reqBody.neededMobilization) : null,
    neededContractUnit: reqBody.neededContractUnit ? Number(reqBody.neededContractUnit) : null,
    itemCode: reqBody.itemCode,
    name: reqBody.name,
    unit: reqBody.unit,
    description: reqBody.description,
    workNotIncluded: reqBody.workNotIncluded,
    CDOTStandardImg: reqBody.cdotStandardImg,
    CostPerUnit: reqBody.costPerUnit ? Number(reqBody.costPerUnit) : null,
    zone: reqBody.zone,
    PaymentClause: reqBody.paymentClause,
    createdBy: reqBody.createdBy ? Number(reqBody.createdBy) : null,
    updatedBy: reqBody.updatedBy ? Number(reqBody.updatedBy) : null
  };
};

const ContractUnitsController = {
  async createContractUnit(req, res) {
    try {
      const normalizedData = normalizeRequest(req.body);
      const newContractUnit = await ContractUnits.create(
        normalizedData.neededMobilization, 
        normalizedData.neededContractUnit, 
        normalizedData.itemCode, 
        normalizedData.name, 
        normalizedData.unit, 
        normalizedData.description, 
        normalizedData.workNotIncluded, 
        normalizedData.CDOTStandardImg, 
        normalizedData.CostPerUnit, 
        normalizedData.zone, 
        normalizedData.PaymentClause, 
        normalizedData.createdBy, 
        normalizedData.updatedBy
      );
      res.status(201).json(normalizeContractUnit(newContractUnit));
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
      res.status(200).json(normalizeContractUnit(contractUnit));
    } catch (error) {
      console.error('Error fetching ContractUnit by ID:', error);
      res.status(500).json({ message: 'Error fetching ContractUnit', error: error.message });
    }
  },

  async getAllContractUnits(req, res) {
    try {
      const allContractUnits = await ContractUnits.findAll();
      const normalizedUnits = allContractUnits.map(unit => normalizeContractUnit(unit));
      res.status(200).json(normalizedUnits);
    } catch (error) {
      console.error('Error fetching all ContractUnits:', error);
      res.status(500).json({ message: 'Error fetching ContractUnits', error: error.message });
    }
  },

  async updateContractUnit(req, res) {
    try {
      const { contractUnitId } = req.params;
      const normalizedData = normalizeRequest(req.body);
      const updatedContractUnit = await ContractUnits.update(
        contractUnitId, 
        normalizedData.neededMobilization, 
        normalizedData.neededContractUnit, 
        normalizedData.itemCode, 
        normalizedData.name, 
        normalizedData.unit, 
        normalizedData.description, 
        normalizedData.workNotIncluded, 
        normalizedData.CDOTStandardImg, 
        normalizedData.CostPerUnit, 
        normalizedData.zone, 
        normalizedData.PaymentClause, 
        normalizedData.updatedBy
      );
      if (!updatedContractUnit) {
        return res.status(404).json({ message: 'ContractUnit not found' });
      }
      res.status(200).json(normalizeContractUnit(updatedContractUnit));
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
      res.status(200).json({
        message: 'ContractUnit deleted successfully',
        deletedContractUnit: normalizeContractUnit(deletedContractUnit)
      });
    } catch (error) {
      console.error('Error deleting ContractUnit:', error);
      res.status(500).json({ message: 'Error deleting ContractUnit', error: error.message });
    }
  },
};

module.exports = ContractUnitsController; 