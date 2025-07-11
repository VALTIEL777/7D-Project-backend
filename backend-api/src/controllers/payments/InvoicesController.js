const Invoices = require('../../models/payments/Invoices');

// Helper function to normalize database response to camelCase
const normalizeInvoice = (dbRecord) => {
  if (!dbRecord) return null;
  
  return {
    invoiceId: dbRecord.invoiceid,
    ticketId: dbRecord.ticketid ? Number(dbRecord.ticketid) : null,
    invoiceNumber: dbRecord.invoicenumber,
    invoiceDateRequested: dbRecord.invoicedaterequested,
    amountRequested: dbRecord.amountrequested ? Number(dbRecord.amountrequested) : null,
    status: dbRecord.status,
    invoiceURL: dbRecord.invoiceurl,
    createdBy: dbRecord.createdby ? Number(dbRecord.createdby) : null,
    updatedBy: dbRecord.updatedby ? Number(dbRecord.updatedby) : null,
    createdAt: dbRecord.createdat,
    updatedAt: dbRecord.updatedat,
    deletedAt: dbRecord.deletedat
  };
};

const InvoicesController = {
  async createInvoice(req, res) {
    try {
      const { ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy } = req.body;
      
      // Convert numeric values to numbers
      const numericTicketId = ticketId ? Number(ticketId) : null;
      const numericAmountRequested = amountRequested ? Number(amountRequested) : null;
      const numericCreatedBy = createdBy ? Number(createdBy) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const newInvoice = await Invoices.create(numericTicketId, invoiceNumber, invoiceDateRequested, numericAmountRequested, status, invoiceURL, numericCreatedBy, numericUpdatedBy);
      res.status(201).json(normalizeInvoice(newInvoice));
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
      res.status(200).json(normalizeInvoice(invoice));
    } catch (error) {
      console.error('Error fetching Invoice by ID:', error);
      res.status(500).json({ message: 'Error fetching Invoice', error: error.message });
    }
  },

  async getAllInvoices(req, res) {
    try {
      const allInvoices = await Invoices.findAll();
      const normalizedInvoices = allInvoices.map(invoice => normalizeInvoice(invoice));
      res.status(200).json(normalizedInvoices);
    } catch (error) {
      console.error('Error fetching all Invoices:', error);
      res.status(500).json({ message: 'Error fetching Invoices', error: error.message });
    }
  },

  async updateInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const { ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, updatedBy } = req.body;
      
      // Convert numeric values to numbers
      const numericTicketId = ticketId ? Number(ticketId) : null;
      const numericAmountRequested = amountRequested ? Number(amountRequested) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const updatedInvoice = await Invoices.update(invoiceId, numericTicketId, invoiceNumber, invoiceDateRequested, numericAmountRequested, status, invoiceURL, numericUpdatedBy);
      if (!updatedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.status(200).json(normalizeInvoice(updatedInvoice));
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
      res.status(200).json({
        message: 'Invoice deleted successfully',
        deletedInvoice: normalizeInvoice(deletedInvoice)
      });
    } catch (error) {
      console.error('Error deleting Invoice:', error);
      res.status(500).json({ message: 'Error deleting Invoice', error: error.message });
    }
  },
};

module.exports = InvoicesController; 