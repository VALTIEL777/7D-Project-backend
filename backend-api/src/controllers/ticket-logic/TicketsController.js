const Tickets = require('../../models/ticket-logic/Tickets');

const TicketsController = {
  async createTicket(req, res) {
    try {
      const { incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy } = req.body;
      const newTicket = await Tickets.create(incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy);
      res.status(201).json(newTicket);
    } catch (error) {
      console.error('Error creating Ticket:', error);
      res.status(500).json({ message: 'Error creating Ticket', error: error.message });
    }
  },

  async getTicketById(req, res) {
    try {
      const { ticketId } = req.params;
      const ticket = await Tickets.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.status(200).json(ticket);
    } catch (error) {
      console.error('Error fetching Ticket by ID:', error);
      res.status(500).json({ message: 'Error fetching Ticket', error: error.message });
    }
  },

  async getAllTickets(req, res) {
    try {
      const allTickets = await Tickets.findAll();
      res.status(200).json(allTickets);
    } catch (error) {
      console.error('Error fetching all Tickets:', error);
      res.status(500).json({ message: 'Error fetching Tickets', error: error.message });
    }
  },

  async updateTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const { incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, updatedBy } = req.body;
      const updatedTicket = await Tickets.update(ticketId, incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, updatedBy);
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.status(200).json(updatedTicket);
    } catch (error) {
      console.error('Error updating Ticket:', error);
      res.status(500).json({ message: 'Error updating Ticket', error: error.message });
    }
  },

  async deleteTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const deletedTicket = await Tickets.delete(ticketId);
      if (!deletedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Error deleting Ticket:', error);
      res.status(500).json({ message: 'Error deleting Ticket', error: error.message });
    }
  },
};

module.exports = TicketsController; 