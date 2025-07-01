const Routes = require('../../models/route/Routes');
const RouteTickets = require('../../models/route/RouteTickets');
const RouteOptimizationService = require('../../services/RouteOptimizationService');

const RoutesController = {
  async createRoute(req, res) {
    try {
      const { routeCode, type, startDate, endDate, createdBy, updatedBy } = req.body;
      const newRoute = await Routes.create(routeCode, type, startDate, endDate, null, null, null, null, null, createdBy, updatedBy);
      res.status(201).json(newRoute);
    } catch (error) {
      console.error('Error creating Route:', error);
      res.status(500).json({ message: 'Error creating Route', error: error.message });
    }
  },

  async getRouteById(req, res) {
    try {
      const { routeId } = req.params;
      const route = await Routes.findById(routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      res.status(200).json(route);
    } catch (error) {
      console.error('Error fetching Route by ID:', error);
      res.status(500).json({ message: 'Error fetching Route', error: error.message });
    }
  },

  async getAllRoutes(req, res) {
    try {
      const allRoutes = await Routes.findAll();
      res.status(200).json(allRoutes);
    } catch (error) {
      console.error('Error fetching all Routes:', error);
      res.status(500).json({ message: 'Error fetching Routes', error: error.message });
    }
  },

  async updateRoute(req, res) {
    try {
      const { routeId } = req.params;
      const { routeCode, type, startDate, endDate, updatedBy } = req.body;
      const updatedRoute = await Routes.update(routeId, routeCode, type, startDate, endDate, null, null, null, null, null, updatedBy);
      if (!updatedRoute) {
        return res.status(404).json({ message: 'Route not found' });
      }
      res.status(200).json(updatedRoute);
    } catch (error) {
      console.error('Error updating Route:', error);
      res.status(500).json({ message: 'Error updating Route', error: error.message });
    }
  },

  async deleteRoute(req, res) {
    try {
      const { routeId } = req.params;
      const deletedRoute = await Routes.delete(routeId);
      if (!deletedRoute) {
        return res.status(404).json({ message: 'Route not found' });
      }
      res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
      console.error('Error deleting Route:', error);
      res.status(500).json({ message: 'Error deleting Route', error: error.message });
    }
  },

  // New optimization endpoints
  async optimizeRoute(req, res) {
    try {
      const { 
        ticketIds, 
        routeCode, 
        type, 
        startDate, 
        endDate, 
        originAddress, 
        destinationAddress 
      } = req.body;

      if (!ticketIds || ticketIds.length === 0) {
        return res.status(400).json({ error: 'At least one ticket ID is required' });
      }

      if (!originAddress || !destinationAddress) {
        return res.status(400).json({ error: 'Origin and destination addresses are required' });
      }

      // Validate API limits
      if (ticketIds.length > 25) {
        return res.status(400).json({ 
          error: 'Maximum 25 tickets supported for optimization. Consider chunking your route.' 
        });
      }

      const createdBy = req.user?.userId || 1;

      const optimizedRoute = await RouteOptimizationService.optimizeAndSaveRoute(
        ticketIds,
        routeCode,
        type,
        startDate,
        endDate,
        originAddress,
        destinationAddress,
        createdBy
      );

      res.status(200).json({
        message: 'Route optimized and saved successfully',
        routeId: optimizedRoute.routeId,
        routeCode: optimizedRoute.routeCode,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        optimizedOrder: optimizedRoute.optimizedOrder,
        tickets: optimizedRoute.tickets
      });

    } catch (error) {
      console.error('Error optimizing route:', error);
      res.status(500).json({ 
        error: 'Failed to optimize route', 
        details: error.message 
      });
    }
  },

  async getOptimizedRoute(req, res) {
    try {
      const { routeId } = req.params;
      const route = await RouteOptimizationService.getOptimizedRoute(routeId);
      
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      res.status(200).json(route);
    } catch (error) {
      console.error('Error fetching optimized route:', error);
      res.status(500).json({ 
        error: 'Failed to fetch optimized route', 
        details: error.message 
      });
    }
  },

  async getRouteTickets(req, res) {
    try {
      const { routeId } = req.params;
      const tickets = await RouteTickets.findByRouteId(routeId);
      res.status(200).json(tickets);
    } catch (error) {
      console.error('Error fetching route tickets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch route tickets', 
        details: error.message 
      });
    }
  },

  async updateTicketQueue(req, res) {
    try {
      const { routeId, ticketId } = req.params;
      const { queue } = req.body;
      const updatedBy = req.user?.userId || 1;

      const updatedTicket = await RouteTickets.updateQueue(routeId, ticketId, queue, updatedBy);
      
      if (!updatedTicket) {
        return res.status(404).json({ error: 'Route ticket not found' });
      }

      res.status(200).json(updatedTicket);
    } catch (error) {
      console.error('Error updating ticket queue:', error);
      res.status(500).json({ 
        error: 'Failed to update ticket queue', 
        details: error.message 
      });
    }
  }
};

module.exports = RoutesController; 