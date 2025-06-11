const TicketAddresses = require('../../models/location/TicketAddresses');

const TicketAddressesController = {
  async createTicketAddresses(req, res) {
    try {
      const { ticketId, addressId, ispartner, is7d, createdBy, updatedBy } = req.body;
      const newTicketAddresses = await TicketAddresses.create(ticketId, addressId, ispartner, is7d, createdBy, updatedBy);
      res.status(201).json(newTicketAddresses);
    } catch (error) {
      console.error('Error creating TicketAddresses:', error);
      res.status(500).json({ message: 'Error creating TicketAddresses', error: error.message });
    }
  },

  async getTicketAddressesById(req, res) {
    try {
      const { ticketId, addressId } = req.params;
      const ticketAddresses = await TicketAddresses.findById(ticketId, addressId);
      if (!ticketAddresses) {
        return res.status(404).json({ message: 'TicketAddresses not found' });
      }
      res.status(200).json(ticketAddresses);
    } catch (error) {
      console.error('Error fetching TicketAddresses by ID:', error);
      res.status(500).json({ message: 'Error fetching TicketAddresses', error: error.message });
    }
  },

  async getAllTicketAddresses(req, res) {
    try {
      const allTicketAddresses = await TicketAddresses.findAll();
      res.status(200).json(allTicketAddresses);
    } catch (error) {
      console.error('Error fetching all TicketAddresses:', error);
      res.status(500).json({ message: 'Error fetching TicketAddresses', error: error.message });
    }
  },

  async updateTicketAddresses(req, res) {
    try {
      const { ticketId, addressId } = req.params;
      const { ispartner, is7d, updatedBy } = req.body;
      const updatedTicketAddresses = await TicketAddresses.update(ticketId, addressId, ispartner, is7d, updatedBy);
      if (!updatedTicketAddresses) {
        return res.status(404).json({ message: 'TicketAddresses not found' });
      }
      res.status(200).json(updatedTicketAddresses);
    } catch (error) {
      console.error('Error updating TicketAddresses:', error);
      res.status(500).json({ message: 'Error updating TicketAddresses', error: error.message });
    }
  },

  async deleteTicketAddresses(req, res) {
    try {
      const { ticketId, addressId } = req.params;
      const deletedTicketAddresses = await TicketAddresses.delete(ticketId, addressId);
      if (!deletedTicketAddresses) {
        return res.status(404).json({ message: 'TicketAddresses not found' });
      }
      res.status(200).json({ message: 'TicketAddresses deleted successfully' });
    } catch (error) {
      console.error('Error deleting TicketAddresses:', error);
      res.status(500).json({ message: 'Error deleting TicketAddresses', error: error.message });
    }
  },
};

module.exports = TicketAddressesController; 