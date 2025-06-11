const RouteTickets = require('../../models/route/RouteTickets');

const RouteTicketsController = {
  async createRouteTickets(req, res) {
    try {
      const { routeId, ticketId, queue, createdBy, updatedBy } = req.body;
      const newRouteTickets = await RouteTickets.create(routeId, ticketId, queue, createdBy, updatedBy);
      res.status(201).json(newRouteTickets);
    } catch (error) {
      console.error('Error creating RouteTickets:', error);
      res.status(500).json({ message: 'Error creating RouteTickets', error: error.message });
    }
  },

  async getRouteTicketsById(req, res) {
    try {
      const { routeId, ticketId } = req.params;
      const routeTickets = await RouteTickets.findById(routeId, ticketId);
      if (!routeTickets) {
        return res.status(404).json({ message: 'RouteTickets not found' });
      }
      res.status(200).json(routeTickets);
    } catch (error) {
      console.error('Error fetching RouteTickets by ID:', error);
      res.status(500).json({ message: 'Error fetching RouteTickets', error: error.message });
    }
  },

  async getAllRouteTickets(req, res) {
    try {
      const allRouteTickets = await RouteTickets.findAll();
      res.status(200).json(allRouteTickets);
    } catch (error) {
      console.error('Error fetching all RouteTickets:', error);
      res.status(500).json({ message: 'Error fetching RouteTickets', error: error.message });
    }
  },

  async updateRouteTickets(req, res) {
    try {
      const { routeId, ticketId } = req.params;
      const { queue, updatedBy } = req.body;
      const updatedRouteTickets = await RouteTickets.update(routeId, ticketId, queue, updatedBy);
      if (!updatedRouteTickets) {
        return res.status(404).json({ message: 'RouteTickets not found' });
      }
      res.status(200).json(updatedRouteTickets);
    } catch (error) {
      console.error('Error updating RouteTickets:', error);
      res.status(500).json({ message: 'Error updating RouteTickets', error: error.message });
    }
  },

  async deleteRouteTickets(req, res) {
    try {
      const { routeId, ticketId } = req.params;
      const deletedRouteTickets = await RouteTickets.delete(routeId, ticketId);
      if (!deletedRouteTickets) {
        return res.status(404).json({ message: 'RouteTickets not found' });
      }
      res.status(200).json({ message: 'RouteTickets deleted successfully' });
    } catch (error) {
      console.error('Error deleting RouteTickets:', error);
      res.status(500).json({ message: 'Error deleting RouteTickets', error: error.message });
    }
  },
};

module.exports = RouteTicketsController; 