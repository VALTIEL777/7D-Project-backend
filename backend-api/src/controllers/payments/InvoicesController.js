const Invoices = require('../../models/payments/Invoices');

const InvoicesController = {
  async createInvoice(req, res) {
    try {
      const { ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy } = req.body;
      const newInvoice = await Invoices.create(ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy);
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error('Error creating Invoice:', error);
      res.status(500).json({ message: 'Error creating Invoice', error: error.message });
    }
  },

  async getInvoiceById(req, res) {
    try {
      const { invoiceId } = req.params;
      const invoice = await Invoices.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.status(200).json(invoice);
    } catch (error) {
      console.error('Error fetching Invoice by ID:', error);
      res.status(500).json({ message: 'Error fetching Invoice', error: error.message });
    }
  },

  async getAllInvoices(req, res) {
    try {
      const allInvoices = await Invoices.findAll();
      res.status(200).json(allInvoices);
    } catch (error) {
      console.error('Error fetching all Invoices:', error);
      res.status(500).json({ message: 'Error fetching Invoices', error: error.message });
    }
  },

  async updateInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const { ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, updatedBy } = req.body;
      const updatedInvoice = await Invoices.update(invoiceId, ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, updatedBy);
      if (!updatedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.status(200).json(updatedInvoice);
    } catch (error) {
      console.error('Error updating Invoice:', error);
      res.status(500).json({ message: 'Error updating Invoice', error: error.message });
    }
  },

  async deleteInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const deletedInvoice = await Invoices.delete(invoiceId);
      if (!deletedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      console.error('Error deleting Invoice:', error);
      res.status(500).json({ message: 'Error deleting Invoice', error: error.message });
    }
  },
};

module.exports = InvoicesController; 