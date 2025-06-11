const PermitedTickets = require('../../models/Permissions/PermitedTickets');

const PermitedTicketsController = {
  async createPermitedTickets(req, res) {
    try {
      const { permitId, ticketId, createdBy, updatedBy } = req.body;
      const newPermitedTickets = await PermitedTickets.create(permitId, ticketId, createdBy, updatedBy);
      res.status(201).json(newPermitedTickets);
    } catch (error) {
      console.error('Error creating PermitedTickets:', error);
      res.status(500).json({ message: 'Error creating PermitedTickets', error: error.message });
    }
  },

  async getPermitedTicketsById(req, res) {
    try {
      const { permitId, ticketId } = req.params;
      const permitedTickets = await PermitedTickets.findById(permitId, ticketId);
      if (!permitedTickets) {
        return res.status(404).json({ message: 'PermitedTickets not found' });
      }
      res.status(200).json(permitedTickets);
    } catch (error) {
      console.error('Error fetching PermitedTickets by ID:', error);
      res.status(500).json({ message: 'Error fetching PermitedTickets', error: error.message });
    }
  },

  async getAllPermitedTickets(req, res) {
    try {
      const allPermitedTickets = await PermitedTickets.findAll();
      res.status(200).json(allPermitedTickets);
    } catch (error) {
      console.error('Error fetching all PermitedTickets:', error);
      res.status(500).json({ message: 'Error fetching PermitedTickets', error: error.message });
    }
  },

  async updatePermitedTickets(req, res) {
    try {
      const { permitId, ticketId } = req.params;
      const { updatedBy } = req.body;
      const updatedPermitedTickets = await PermitedTickets.update(permitId, ticketId, updatedBy);
      if (!updatedPermitedTickets) {
        return res.status(404).json({ message: 'PermitedTickets not found' });
      }
      res.status(200).json(updatedPermitedTickets);
    } catch (error) {
      console.error('Error updating PermitedTickets:', error);
      res.status(500).json({ message: 'Error updating PermitedTickets', error: error.message });
    }
  },

  async deletePermitedTickets(req, res) {
    try {
      const { permitId, ticketId } = req.params;
      const deletedPermitedTickets = await PermitedTickets.delete(permitId, ticketId);
      if (!deletedPermitedTickets) {
        return res.status(404).json({ message: 'PermitedTickets not found' });
      }
      res.status(200).json({ message: 'PermitedTickets deleted successfully' });
    } catch (error) {
      console.error('Error deleting PermitedTickets:', error);
      res.status(500).json({ message: 'Error deleting PermitedTickets', error: error.message });
    }
  },
};

module.exports = PermitedTicketsController; 