const Payments = require('../../models/payments/Payments');

// Helper function to normalize database response to camelCase
const normalizePayment = (dbRecord) => {
  if (!dbRecord) return null;
  
  return {
    checkId: dbRecord.checkid,
    paymentNumber: dbRecord.paymentnumber,
    datePaid: dbRecord.datepaid,
    amountPaid: dbRecord.amountpaid ? Number(dbRecord.amountpaid) : null,
    status: dbRecord.status,
    paymentURL: dbRecord.paymenturl,
    createdBy: dbRecord.createdby ? Number(dbRecord.createdby) : null,
    updatedBy: dbRecord.updatedby ? Number(dbRecord.updatedby) : null,
    createdAt: dbRecord.createdat,
    updatedAt: dbRecord.updatedat,
    deletedAt: dbRecord.deletedat
  };
};

// Helper function to normalize payment-invoice-ticket response
const normalizePaymentInvoiceTicket = (dbRecord) => {
  if (!dbRecord) return null;
  
  return {
    paymentNumber: dbRecord.paymentnumber,
    amountPaid: dbRecord.amountpaid ? Number(dbRecord.amountpaid) : null,
    invoiceNumber: dbRecord.invoicenumber,
    amountRequested: dbRecord.amountrequested ? Number(dbRecord.amountrequested) : null,
    amountToPay: dbRecord.amounttopay ? Number(dbRecord.amounttopay) : null,
    calculatedCost: dbRecord.calculatedcost ? Number(dbRecord.calculatedcost) : null,
    ticketCode: dbRecord.ticketcode
  };
};

const PaymentsController = {
  async createPayment(req, res) {
    try {
      const { paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy } = req.body;
      
      // Convert numeric values to numbers
      const numericAmountPaid = amountPaid ? Number(amountPaid) : null;
      const numericCreatedBy = createdBy ? Number(createdBy) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const newPayment = await Payments.create(paymentNumber, datePaid, numericAmountPaid, status, paymentURL, numericCreatedBy, numericUpdatedBy);
      res.status(201).json(normalizePayment(newPayment));
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
      res.status(200).json(normalizePayment(payment));
    } catch (error) {
      console.error('Error fetching Payment by ID:', error);
      res.status(500).json({ message: 'Error fetching Payment', error: error.message });
    }
  },

  async getAllPayments(req, res) {
    try {
      const allPayments = await Payments.findAll();
      const normalizedPayments = allPayments.map(payment => normalizePayment(payment));
      res.status(200).json(normalizedPayments);
    } catch (error) {
      console.error('Error fetching all Payments:', error);
      res.status(500).json({ message: 'Error fetching Payments', error: error.message });
    }
  },

  async updatePayment(req, res) {
    try {
      const { checkId } = req.params;
      const { paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy } = req.body;
      
      // Convert numeric values to numbers
      const numericAmountPaid = amountPaid ? Number(amountPaid) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const updatedPayment = await Payments.update(checkId, paymentNumber, datePaid, numericAmountPaid, status, paymentURL, numericUpdatedBy);
      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.status(200).json(normalizePayment(updatedPayment));
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
      res.status(200).json({
        message: 'Payment deleted successfully',
        deletedPayment: normalizePayment(deletedPayment)
      });
    } catch (error) {
      console.error('Error deleting Payment:', error);
      res.status(500).json({ message: 'Error deleting Payment', error: error.message });
    }
  },

  async getPaymentInvoiceTicketInfo(req, res) {
    try {
      const paymentInvoiceTicketData = await Payments.getPaymentInvoiceTicketInfo();
      const normalizedData = paymentInvoiceTicketData.map(record => normalizePaymentInvoiceTicket(record));
      res.status(200).json(normalizedData);
    } catch (error) {
      console.error('Error fetching Payment-Invoice-Ticket information:', error);
      res.status(500).json({ message: 'Error fetching Payment-Invoice-Ticket information', error: error.message });
    }
  },
};

module.exports = PaymentsController; 