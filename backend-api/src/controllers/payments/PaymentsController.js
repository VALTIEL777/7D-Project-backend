const Payments = require('../../models/payments/Payments');

const PaymentsController = {
  async createPayment(req, res) {
    try {
      const { paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy } = req.body;
      const newPayment = await Payments.create(paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy);
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating Payment:', error);
      res.status(500).json({ message: 'Error creating Payment', error: error.message });
    }
  },

  async getPaymentById(req, res) {
    try {
      const { checkId } = req.params;
      const payment = await Payments.findById(checkId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.status(200).json(payment);
    } catch (error) {
      console.error('Error fetching Payment by ID:', error);
      res.status(500).json({ message: 'Error fetching Payment', error: error.message });
    }
  },

  async getAllPayments(req, res) {
    try {
      const allPayments = await Payments.findAll();
      res.status(200).json(allPayments);
    } catch (error) {
      console.error('Error fetching all Payments:', error);
      res.status(500).json({ message: 'Error fetching Payments', error: error.message });
    }
  },

  async updatePayment(req, res) {
    try {
      const { checkId } = req.params;
      const { paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy } = req.body;
      const updatedPayment = await Payments.update(checkId, paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy);
      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.status(200).json(updatedPayment);
    } catch (error) {
      console.error('Error updating Payment:', error);
      res.status(500).json({ message: 'Error updating Payment', error: error.message });
    }
  },

  async deletePayment(req, res) {
    try {
      const { checkId } = req.params;
      const deletedPayment = await Payments.delete(checkId);
      if (!deletedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting Payment:', error);
      res.status(500).json({ message: 'Error deleting Payment', error: error.message });
    }
  },
};

module.exports = PaymentsController; 