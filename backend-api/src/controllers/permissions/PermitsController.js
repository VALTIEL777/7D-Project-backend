const Permits = require('../../models/Permissions/Permits');

const PermitsController = {
  async createPermit(req, res) {
    try {
      const { permitNumber, status, startDate, expireDate, createdBy, updatedBy } = req.body;
      const newPermit = await Permits.create(permitNumber, status, startDate, expireDate, createdBy, updatedBy);
      res.status(201).json(newPermit);
    } catch (error) {
      console.error('Error creating Permit:', error);
      res.status(500).json({ message: 'Error creating Permit', error: error.message });
    }
  },

  async getPermitById(req, res) {
    try {
      const { PermitId } = req.params;
      const permit = await Permits.findById(PermitId);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      res.status(200).json(permit);
    } catch (error) {
      console.error('Error fetching Permit by ID:', error);
      res.status(500).json({ message: 'Error fetching Permit', error: error.message });
    }
  },

  async getAllPermits(req, res) {
    try {
      const allPermits = await Permits.findAll();
      res.status(200).json(allPermits);
    } catch (error) {
      console.error('Error fetching all Permits:', error);
      res.status(500).json({ message: 'Error fetching Permits', error: error.message });
    }
  },

  async updatePermit(req, res) {
    try {
      const { PermitId } = req.params;
      const { permitNumber, status, startDate, expireDate, updatedBy } = req.body;
      const updatedPermit = await Permits.update(PermitId, permitNumber, status, startDate, expireDate, updatedBy);
      if (!updatedPermit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      res.status(200).json(updatedPermit);
    } catch (error) {
      console.error('Error updating Permit:', error);
      res.status(500).json({ message: 'Error updating Permit', error: error.message });
    }
  },

  async deletePermit(req, res) {
    try {
      const { PermitId } = req.params;
      const deletedPermit = await Permits.delete(PermitId);
      if (!deletedPermit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      res.status(200).json({ message: 'Permit deleted successfully' });
    } catch (error) {
      console.error('Error deleting Permit:', error);
      res.status(500).json({ message: 'Error deleting Permit', error: error.message });
    }
  },
};

module.exports = PermitsController; 