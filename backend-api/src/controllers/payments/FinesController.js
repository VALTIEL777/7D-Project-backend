const Fines = require('../../models/payments/Fines');

const FinesController = {
  async createFine(req, res) {
    try {
      const { ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy } = req.body;
      const newFine = await Fines.create(ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy);
      res.status(201).json(newFine);
    } catch (error) {
      console.error('Error creating Fine:', error);
      res.status(500).json({ message: 'Error creating Fine', error: error.message });
    }
  },

  async getFineById(req, res) {
    try {
      const { fineId } = req.params;
      const fine = await Fines.findById(fineId);
      if (!fine) {
        return res.status(404).json({ message: 'Fine not found' });
      }
      res.status(200).json(fine);
    } catch (error) {
      console.error('Error fetching Fine by ID:', error);
      res.status(500).json({ message: 'Error fetching Fine', error: error.message });
    }
  },

  async getAllFines(req, res) {
    try {
      const allFines = await Fines.findAll();
      res.status(200).json(allFines);
    } catch (error) {
      console.error('Error fetching all Fines:', error);
      res.status(500).json({ message: 'Error fetching Fines', error: error.message });
    }
  },

  async updateFine(req, res) {
    try {
      const { fineId } = req.params;
      const { ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, updatedBy } = req.body;
      const updatedFine = await Fines.update(fineId, ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, updatedBy);
      if (!updatedFine) {
        return res.status(404).json({ message: 'Fine not found' });
      }
      res.status(200).json(updatedFine);
    } catch (error) {
      console.error('Error updating Fine:', error);
      res.status(500).json({ message: 'Error updating Fine', error: error.message });
    }
  },

  async deleteFine(req, res) {
    try {
      const { fineId } = req.params;
      const deletedFine = await Fines.delete(fineId);
      if (!deletedFine) {
        return res.status(404).json({ message: 'Fine not found' });
      }
      res.status(200).json({ message: 'Fine deleted successfully' });
    } catch (error) {
      console.error('Error deleting Fine:', error);
      res.status(500).json({ message: 'Error deleting Fine', error: error.message });
    }
  },
};

module.exports = FinesController; 