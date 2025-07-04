const TicketStatus = require('../../models/route/TicketStatus');

const TicketStatusController = {
  async createTicketStatus(req, res) {
    try {
      const { taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy } = req.body;
      const newTicketStatus = await TicketStatus.create(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy);
      res.status(201).json(newTicketStatus);
    } catch (error) {
      console.error('Error creating TicketStatus:', error);
      res.status(500).json({ message: 'Error creating TicketStatus', error: error.message });
    }
  },

  async getTicketStatusById(req, res) {
    try {
      const { taskStatusId, ticketId } = req.params;
      const ticketStatus = await TicketStatus.findById(taskStatusId, ticketId);
      if (!ticketStatus) {
        return res.status(404).json({ message: 'TicketStatus not found' });
      }
      res.status(200).json(ticketStatus);
    } catch (error) {
      console.error('Error fetching TicketStatus by ID:', error);
      res.status(500).json({ message: 'Error fetching TicketStatus', error: error.message });
    }
  },

async getTicketStatusByTicketAndCrew(req, res) {
  try {
    const { ticketId, crewId } = req.params;
    const ticketStatus = await TicketStatus.findByTicketAndCrew(ticketId, crewId);
    if (!ticketStatus) {
      return res.status(200).json(null);
    }
    res.status(200).json(ticketStatus);
  } catch (error) {
    console.error('Error fetching TicketStatus by ticket and crew:', error);
    res.status(500).json({ message: 'Error fetching TicketStatus', error: error.message });
  }
},

  async getAllTicketStatuses(req, res) {
    try {
      const allTicketStatuses = await TicketStatus.findAll();
      res.status(200).json(allTicketStatuses);
    } catch (error) {
      console.error('Error fetching all TicketStatuses:', error);
      res.status(500).json({ message: 'Error fetching TicketStatuses', error: error.message });
    }
  },

  // TicketStatusController.js
async getCompletedTickets(req, res) {
  try {
    const completedTickets = await TicketStatus.findCompletedTickets();
    res.status(200).json(completedTickets);
  } catch (error) {
    console.error('Error fetching completed tickets:', error);
    res.status(500).json({ message: 'Error fetching completed tickets', error: error.message });
  }
},


  async updateTicketStatus(req, res) {
    try {
      const { taskStatusId, ticketId } = req.params;
      const { crewId, startingDate, endingDate, observation, updatedBy } = req.body;
      const updatedTicketStatus = await TicketStatus.update(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, updatedBy);
      if (!updatedTicketStatus) {
        return res.status(404).json({ message: 'TicketStatus not found' });
      }
      res.status(200).json(updatedTicketStatus);
    } catch (error) {
      console.error('Error updating TicketStatus:', error);
      res.status(500).json({ message: 'Error updating TicketStatus', error: error.message });
    }
  },

  async deleteTicketStatus(req, res) {
    try {
      const { taskStatusId, ticketId } = req.params;
      const deletedTicketStatus = await TicketStatus.delete(taskStatusId, ticketId);
      if (!deletedTicketStatus) {
        return res.status(404).json({ message: 'TicketStatus not found' });
      }
      res.status(200).json({ message: 'TicketStatus deleted successfully' });
    } catch (error) {
      console.error('Error deleting TicketStatus:', error);
      res.status(500).json({ message: 'Error deleting TicketStatus', error: error.message });
    }
  },
};

module.exports = TicketStatusController; 