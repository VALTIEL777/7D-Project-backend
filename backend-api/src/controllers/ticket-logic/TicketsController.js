const Tickets = require('../../models/ticket-logic/Tickets');
const db = require('../../config/db');

// Helper function to normalize database column names to camelCase
function normalizeTicketData(ticket) {
  if (!ticket) return ticket;
  
  return {
    ticketId: ticket.ticketid,
    incidentId: ticket.incidentid,
    incidentName: ticket.incidentname,
    quadrantId: ticket.cuadranteid, // Convert cuadranteid to quadrantId
    contractUnitId: ticket.contractunitid,
    contractUnitName: ticket.contractunitname,
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
      const expiredTickets = await Tickets.findExpired();
      
      // Normalize the data and add additional fields
      const normalizedTickets = expiredTickets.map(ticket => ({
        ticketId: ticket.ticketid,
        ticketCode: ticket.ticketcode,
        contractNumber: ticket.contractnumber,
        amountToPay: ticket.amounttopay,
        ticketType: ticket.tickettype,
        daysOutstanding: ticket.daysoutstanding,
        comment7d: ticket.comment7d,
        expireDate: ticket.expiredate,
        daysExpired: ticket.days_expired,
        addresses: ticket.addresses,
        taskStatusNames: ticket.taskstatusnames
      }));
      
      res.status(200).json(normalizedTickets);
    } catch (error) {
      console.error('Error fetching expired tickets:', error);
      res.status(500).json({ message: 'Error fetching expired tickets', error: error.message });
    }
  },

  async getByTicketCode(req, res) {
    try {
      const { ticketCode } = req.params;
      const ticket = await Tickets.findByTicketCode(ticketCode);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.status(200).json(normalizeTicketData(ticket));
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

  // Search tickets with comment7d as null or "TK - PERMIT EXTENDED" and build addresses
  async searchTicketsForRouteGeneration(req, res) {
    try {
      const { comment7d = null, includeAddresses = true, limit = 100 } = req.query;
      
      console.log('Searching tickets for route generation with criteria:', {
        comment7d: comment7d || 'null or "TK - PERMIT EXTENDED"',
        includeAddresses,
        limit
      });

      // Build the query based on the comment7d parameter
      let commentCondition;
      if (comment7d === 'null') {
        commentCondition = 't.comment7d IS NULL';
      } else if (comment7d === 'permit_extended') {
        commentCondition = "t.comment7d = 'TK - PERMIT EXTENDED'";
      } else {
        // Default: search for both null and "TK - PERMIT EXTENDED"
        commentCondition = "(t.comment7d IS NULL OR t.comment7d = 'TK - PERMIT EXTENDED')";
      }

      const query = `
        SELECT DISTINCT 
          t.ticketId,
          t.ticketCode,
          t.contractNumber,
          t.amountToPay,
          t.ticketType,
          t.daysOutstanding,
          t.comment7d,
          t.quantity,
          t.createdAt as ticketCreatedAt,
          -- Contract Unit information
          cu.name as contractUnitName,
          -- Incident information
          i.name as incidentName,
          -- Address information
          a.addressId,
          a.addressNumber,
          a.addressCardinal,
          a.addressStreet,
          a.addressSuffix,
          a.latitude,
          a.longitude,
          a.placeid,
          -- Permit information
          p.permitNumber,
          p.expireDate as permitExpireDate,
          p.status as permitStatus,
          -- Build full address string
          CASE 
            WHEN a.addressNumber IS NOT NULL AND a.addressStreet IS NOT NULL THEN
              CONCAT(
                COALESCE(a.addressNumber, ''),
                ' ',
                COALESCE(a.addressCardinal, ''),
                ' ',
                COALESCE(a.addressStreet, ''),
                ' ',
                COALESCE(a.addressSuffix, '')
              )
            ELSE NULL
          END as fullAddress,
          -- Count addresses for this ticket
          COUNT(a.addressId) OVER (PARTITION BY t.ticketId) as addressCount
        FROM Tickets t
        LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
        LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
        LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
        LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
        LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
        LEFT JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
        WHERE t.deletedAt IS NULL
        AND ${commentCondition}
        ORDER BY t.ticketId, a.addressId
        LIMIT $1;
      `;

      const result = await db.query(query, [limit]);
      
      // Group results by ticket
      const ticketsMap = new Map();
      
      result.rows.forEach(row => {
        const ticketId = row.ticketid;
        
        if (!ticketsMap.has(ticketId)) {
          // Create ticket object
          const ticket = {
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            contractNumber: row.contractnumber,
            contractUnitName: row.contractunitname,
            amountToPay: row.amounttopay,
            ticketType: row.tickettype,
            daysOutstanding: row.daysoutstanding,
            comment7d: row.comment7d,
            quantity: row.quantity,
            ticketCreatedAt: row.ticketcreatedat,
            incidentName: row.incidentname,
            permitNumber: row.permitnumber,
            permitExpireDate: row.permitexpiredate,
            permitStatus: row.permitstatus,
            addresses: [],
            addressCount: row.addresscount
          };
          
          ticketsMap.set(ticketId, ticket);
        }
        
        // Add address if it exists and includeAddresses is true
        if (includeAddresses === 'true' && row.addressid) {
          const address = {
            addressId: row.addressid,
            addressNumber: row.addressnumber,
            addressCardinal: row.addresscardinal,
            addressStreet: row.addressstreet,
            addressSuffix: row.addresssuffix,
            latitude: row.latitude,
            longitude: row.longitude,
            placeid: row.placeid,
            fullAddress: row.fulladdress
          };
          
          ticketsMap.get(ticketId).addresses.push(address);
        }
      });

      const tickets = Array.from(ticketsMap.values());
      
      // Add summary statistics
      const summary = {
        totalTickets: tickets.length,
        ticketsWithNullComment: tickets.filter(t => t.comment7d === null).length,
        ticketsWithPermitExtended: tickets.filter(t => t.comment7d === 'TK - PERMIT EXTENDED').length,
        ticketsWithAddresses: tickets.filter(t => t.addresses.length > 0).length,
        ticketsWithoutAddresses: tickets.filter(t => t.addresses.length === 0).length,
        totalAddresses: tickets.reduce((sum, t) => sum + t.addresses.length, 0),
        averageAddressesPerTicket: tickets.length > 0 ? 
          (tickets.reduce((sum, t) => sum + t.addresses.length, 0) / tickets.length).toFixed(2) : 0
      };

      res.status(200).json({
        success: true,
        message: 'Tickets found for route generation',
        summary,
        data: tickets
      });

    } catch (error) {
      console.error('Error searching tickets for route generation:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error searching tickets for route generation', 
        error: error.message 
      });
    }
  },

  // Get tickets with issues (specific comment7d values) and their crew comments
  async getTicketsWithIssues(req, res) {
    try {
      // Step 1: Get tickets with issues
      const tickets = await Tickets.findTicketsWithIssuesSimple();
      const ticketIds = tickets.map(t => t.ticketid);

      // Step 2: Get addresses and task statuses for these tickets
      const [addresses, taskStatuses] = await Promise.all([
        Tickets.getAddressesForTickets(ticketIds),
        Tickets.getTaskStatusesForTickets(ticketIds)
      ]);

      // Step 3: Assemble the data
      const addressesByTicket = {};
      addresses.forEach(addr => {
        if (!addressesByTicket[addr.ticketid]) addressesByTicket[addr.ticketid] = [];
        addressesByTicket[addr.ticketid].push(addr);
      });

      const statusesByTicket = {};
      taskStatuses.forEach(status => {
        if (!statusesByTicket[status.ticketid]) statusesByTicket[status.ticketid] = [];
        statusesByTicket[status.ticketid].push({
          taskStatusId: status.taskstatusid,
          name: status.name,
          description: status.description,
          startingDate: status.startingdate,
          endingDate: status.endingdate,
          crewComment: status.crewcomment,
          crewId: status.crewid
        });
      });

      // Step 4: Normalize and build the response
      const normalizedTickets = tickets.map(ticket => ({
        ticketId: ticket.ticketid,
        ticketCode: ticket.ticketcode,
        contractNumber: ticket.contractnumber,
        contractUnitName: ticket.contractunitname,
        amountToPay: ticket.amounttopay,
        ticketType: ticket.tickettype,
        daysOutstanding: ticket.daysoutstanding,
        comment7d: ticket.comment7d,
        quantity: ticket.quantity,
        createdAt: ticket.createdat,
        updatedAt: ticket.updatedat,
        incidentName: ticket.incidentname,
        addresses: (addressesByTicket[ticket.ticketid] || []).map(a => a.fulladdress).join(', '),
        addressDetails: addressesByTicket[ticket.ticketid] || [],
        taskStatuses: statusesByTicket[ticket.ticketid] || [],
        taskStatusCount: (statusesByTicket[ticket.ticketid] || []).length
      }));

      res.status(200).json({
        success: true,
        message: 'Tickets with issues retrieved successfully',
        summary: {
          totalTickets: normalizedTickets.length,
          ticketsOnHoldOff: normalizedTickets.filter(t => t.comment7d === 'TK - ON HOLD OFF').length,
          ticketsWillBeScheduled: normalizedTickets.filter(t => t.comment7d === 'TK - WILL BE SCHEDULE').length,
          ticketsNeedsPermitExtension: normalizedTickets.filter(t => t.comment7d === 'TK - NEEDS PERMIT EXTENSION').length,
          ticketsWithCrewComments: normalizedTickets.filter(t => t.taskStatuses.length > 0).length,
          totalCrewComments: normalizedTickets.reduce((sum, t) => sum + t.taskStatuses.length, 0)
        },
        data: normalizedTickets
      });
    } catch (error) {
      console.error('Error fetching tickets with issues:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching tickets with issues', 
        error: error.message 
      });
    }
  }
};

module.exports = TicketsController; 