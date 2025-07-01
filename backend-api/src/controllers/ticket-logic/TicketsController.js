const Tickets = require('../../models/ticket-logic/Tickets');

// Helper function to normalize database column names to camelCase
function normalizeTicketData(ticket) {
  if (!ticket) return ticket;
  
  return {
    ticketId: ticket.ticketid,
    incidentId: ticket.incidentid,
    quadrantId: ticket.cuadranteid, // Convert cuadranteid to quadrantId
    contractUnitId: ticket.contractunitid,
    wayfindingId: ticket.wayfindingid,
    paymentId: ticket.paymentid,
    mobilizationId: ticket.mobilizationid,
    ticketCode: ticket.ticketcode,
    quantity: ticket.quantity,
    daysOutstanding: ticket.daysoutstanding,
    comment7d: ticket.comment7d,
    partnerComment: ticket.partnercomment,
    partnerSupervisorComment: ticket.partnersupervisorcomment,
    contractNumber: ticket.contractnumber,
    amountToPay: ticket.amounttopay,
    ticketType: ticket.tickettype,
    createdAt: ticket.createdat,
    updatedAt: ticket.updatedat,
    deletedAt: ticket.deletedat,
    createdBy: ticket.createdby,
    updatedBy: ticket.updatedby
  };
}

// Helper function to normalize array of tickets
function normalizeTicketsData(tickets) {
  if (!Array.isArray(tickets)) return tickets;
  return tickets.map(normalizeTicketData);
}

const TicketsController = {
  async createTicket(req, res) {
    try {
      const { incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy } = req.body;
      const newTicket = await Tickets.create(incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy);
      res.status(201).json(normalizeTicketData(newTicket));
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
      res.status(200).json(normalizeTicketData(ticket));
    } catch (error) {
      console.error('Error fetching Ticket by ID:', error);
      res.status(500).json({ message: 'Error fetching Ticket', error: error.message });
    }
  },

  async getAllTickets(req, res) {
    try {
      const allTickets = await Tickets.findAll();
      res.status(200).json(normalizeTicketsData(allTickets));
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
      res.status(200).json(normalizeTicketData(updatedTicket));
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

  // Get tickets expiring in 7 days
  async getTicketsExpiringIn7Days(req, res) {
    try {
      const tickets = await Tickets.findExpiringInDays(7);
      res.status(200).json(normalizeTicketsData(tickets));
    } catch (error) {
      console.error('Error fetching tickets expiring in 7 days:', error);
      res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
  },

  // Get tickets expiring in 15 days
  async getTicketsExpiringIn15Days(req, res) {
    try {
      const tickets = await Tickets.findExpiringInDays(15);
      res.status(200).json(normalizeTicketsData(tickets));
    } catch (error) {
      console.error('Error fetching tickets expiring in 15 days:', error);
      res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
  },

  // Get tickets expiring in more than 15 days
  async getTicketsExpiringAfter15Days(req, res) {
    try {
      const tickets = await Tickets.findExpiringAfterDays(15);
      res.status(200).json(normalizeTicketsData(tickets));
    } catch (error) {
      console.error('Error fetching tickets expiring after 15 days:', error);
      res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
  },

  // Get expired tickets
  async getExpiredTickets(req, res) {
    try {
      const tickets = await Tickets.findExpired();
      res.status(200).json(normalizeTicketsData(tickets));
    } catch (error) {
      console.error('Error fetching expired tickets:', error);
      res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
  },

  async getByTicketCode(req, res) {
    try {
      const { ticketCode } = req.params;
      const ticket = await Tickets.findByTicketCode(ticketCode);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.status(200).json(ticket);
    } catch (error) {
      console.error('Error fetching ticket by ticket code:', error);
      res.status(500).json({ message: 'Error fetching ticket', error: error.message });
    }
  },

  async getTicketWithAddressAndStatuses(req, res) {
    try {
      const { ticketCode } = req.params;
      const ticket = await Tickets.getTicketWithAddressAndStatuses(ticketCode);
      
      if (!ticket) {
        return res.status(404).json({ 
          success: false,
          message: 'Ticket not found',
          ticketCode: ticketCode 
        });
      }

      res.status(200).json({
        success: true,
        data: {
          ticketId: ticket.ticketid,
          ticketCode: ticket.ticketcode,
          quantity: ticket.quantity,
          daysOutstanding: ticket.daysoutstanding,
          comment7d: ticket.comment7d,
          partnerComment: ticket.partnercomment,
          partnerSupervisorComment: ticket.partnersupervisorcomment,
          contractNumber: ticket.contractnumber,
          amountToPay: ticket.amounttopay,
          ticketType: ticket.tickettype,
          createdAt: ticket.createdat,
          updatedAt: ticket.updatedat,
          address: {
            fullAddress: ticket.fulladdress?.trim() || null,
            addressNumber: ticket.addressnumber,
            addressCardinal: ticket.addresscardinal,
            addressStreet: ticket.addressstreet,
            addressSuffix: ticket.addressesuffix
          },
          taskStatuses: ticket.taskstatuses || []
        }
      });
    } catch (error) {
      console.error('Error fetching ticket with address and statuses:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching ticket information', 
        error: error.message 
      });
    }
  },
};

module.exports = TicketsController; 