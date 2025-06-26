const TicketStatus = require('../../models/route/TicketStatus');
const NotificationService = require('../../services/NotificationService');
const TaskStatus = require('../../models/route/TaskStatus');
const Tickets = require('../../models/ticket-logic/Tickets');

const TicketStatusController = {
  async createTicketStatus(req, res) {
    try {
      const { taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy } = req.body;
      const newTicketStatus = await TicketStatus.create(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy);
      
      // Get task status name for notification
      const taskStatus = await TaskStatus.findById(taskStatusId);
      const ticket = await Tickets.findById(ticketId);
      
      if (taskStatus && ticket) {
        // Get users to notify
        const userIds = await NotificationService.getTicketNotificationUsers(ticketId);
        
        // Create notification for status update
        await NotificationService.notifyTicketStatusUpdate(
          ticketId,
          ticket.ticketCode,
          'New',
          taskStatus.name,
          createdBy,
          userIds
        );
        
        // Check if ticket is completed
        if (taskStatus.name.toLowerCase().includes('completed') || taskStatus.name.toLowerCase().includes('finished')) {
          await NotificationService.notifyTicketCompleted(
            ticketId,
            ticket.ticketCode,
            createdBy,
            userIds
          );
        }
      }
      
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

  async getAllTicketStatuses(req, res) {
    try {
      const allTicketStatuses = await TicketStatus.findAll();
      res.status(200).json(allTicketStatuses);
    } catch (error) {
      console.error('Error fetching all TicketStatuses:', error);
      res.status(500).json({ message: 'Error fetching TicketStatuses', error: error.message });
    }
  },

  async updateTicketStatus(req, res) {
    try {
      const { taskStatusId, ticketId } = req.params;
      const { crewId, startingDate, endingDate, observation, updatedBy } = req.body;
      
      // Get current status before update
      const currentStatus = await TicketStatus.findById(taskStatusId, ticketId);
      const currentTaskStatus = currentStatus ? await TaskStatus.findById(taskStatusId) : null;
      
      const updatedTicketStatus = await TicketStatus.update(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, updatedBy);
      if (!updatedTicketStatus) {
        return res.status(404).json({ message: 'TicketStatus not found' });
      }
      
      // Get new task status and ticket info
      const newTaskStatus = await TaskStatus.findById(taskStatusId);
      const ticket = await Tickets.findById(ticketId);
      
      if (currentTaskStatus && newTaskStatus && ticket) {
        // Get users to notify
        const userIds = await NotificationService.getTicketNotificationUsers(ticketId);
        
        // Create notification for status update
        await NotificationService.notifyTicketStatusUpdate(
          ticketId,
          ticket.ticketCode,
          currentTaskStatus.name,
          newTaskStatus.name,
          updatedBy,
          userIds
        );
        
        // Check if ticket is completed
        if (newTaskStatus.name.toLowerCase().includes('completed') || newTaskStatus.name.toLowerCase().includes('finished')) {
          await NotificationService.notifyTicketCompleted(
            ticketId,
            ticket.ticketCode,
            updatedBy,
            userIds
          );
        }
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