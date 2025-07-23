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

      // Set default addresses if not provided
      const defaultAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const finalOriginAddress = originAddress || defaultAddress;
      const finalDestinationAddress = destinationAddress || defaultAddress;

      // Validate API limits
      if (ticketIds.length > 158) {
        return res.status(400).json({ 
          error: 'Maximum 158 tickets supported for optimization. Consider chunking your route.' 
        });
      }

      const createdBy = req.user?.userId || 1;

      const optimizedRoute = await RouteOptimizationService.optimizeAndSaveRoute(
        ticketIds,
        routeCode,
        type,
        startDate,
        endDate,
        finalOriginAddress,
        finalDestinationAddress,
        createdBy
      );

      res.status(200).json({
        message: 'Route optimized and saved successfully',
        routeId: optimizedRoute.routeId,
        routeCode: optimizedRoute.routeCode,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        optimizedOrder: optimizedRoute.optimizedOrder,
        tickets: optimizedRoute.tickets,
        originAddress: finalOriginAddress,
        destinationAddress: finalDestinationAddress
      });

    } catch (error) {
      console.error('Error optimizing route:', error);
      res.status(500).json({ 
        error: 'Failed to optimize route', 
        details: error.message 
      });
    }
  },

  // Optimize spotting routes
  async optimizeSpottingRoute(req, res) {
    try {
      const { 
        routeCode, 
        startDate, 
        endDate, 
        originAddress, 
        destinationAddress 
      } = req.body;

      // Set default addresses if not provided
      const defaultAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const finalOriginAddress = originAddress || defaultAddress;
      const finalDestinationAddress = destinationAddress || defaultAddress;

      const createdBy = req.user?.userId || 1;

      // Get tickets for spotting routes
      const spottingTickets = await RouteOptimizationService.getSpottingTickets();
      
      if (spottingTickets.length === 0) {
        return res.status(404).json({ 
          message: 'No tickets found for spotting routes',
          criteria: 'comment7d is NULL, empty, or TK - PERMIT EXTENDED, and no endingDate for SPOTTING status'
        });
      }

      const ticketIds = spottingTickets.map(ticket => ticket.ticketid);

      // Validate API limits
      if (ticketIds.length > 158) {
        return res.status(400).json({ 
          error: 'Maximum 158 tickets supported for optimization. Consider chunking your route.' 
        });
      }

      const optimizedRoute = await RouteOptimizationService.optimizeAndSaveRoute(
        ticketIds,
        routeCode || `SPOT-${Date.now()}`,
        'SPOTTER',
        startDate,
        endDate,
        finalOriginAddress,
        finalDestinationAddress,
        createdBy
      );

      res.status(200).json({
        message: 'Spotting route optimized and saved successfully',
        routeId: optimizedRoute.routeId,
        routeCode: optimizedRoute.routeCode,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        optimizedOrder: optimizedRoute.optimizedOrder,
        tickets: optimizedRoute.tickets,
        originAddress: finalOriginAddress,
        destinationAddress: finalDestinationAddress,
        routeType: 'SPOTTER',
        ticketCount: ticketIds.length
      });

    } catch (error) {
      console.error('Error optimizing spotting route:', error);
      res.status(500).json({ 
        error: 'Failed to optimize spotting route', 
        details: error.message 
      });
    }
  },

  // Optimize concrete routes
  async optimizeConcreteRoute(req, res) {
    try {
      const { 
        routeCode, 
        startDate, 
        endDate, 
        originAddress, 
        destinationAddress 
      } = req.body;

      // Set default addresses if not provided
      const defaultAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const finalOriginAddress = originAddress || defaultAddress;
      const finalDestinationAddress = destinationAddress || defaultAddress;

      const createdBy = req.user?.userId || 1;

      // Get tickets for concrete routes
      const concreteTickets = await RouteOptimizationService.getConcreteTickets();
      
      if (concreteTickets.length === 0) {
        return res.status(404).json({ 
          message: 'No tickets found for concrete routes',
          criteria: 'SPOTTING completed (has endingDate) and has SAWCUT status'
        });
      }

      const ticketIds = concreteTickets.map(ticket => ticket.ticketid);

      // Validate API limits
      if (ticketIds.length > 158) {
        return res.status(400).json({ 
          error: 'Maximum 158 tickets supported for optimization. Consider chunking your route.' 
        });
      }

      const optimizedRoute = await RouteOptimizationService.optimizeAndSaveRoute(
        ticketIds,
        routeCode || `CONC-${Date.now()}`,
        'CONCRETE',
        startDate,
        endDate,
        finalOriginAddress,
        finalDestinationAddress,
        createdBy
      );

      res.status(200).json({
        message: 'Concrete route optimized and saved successfully',
        routeId: optimizedRoute.routeid,
        routeCode: optimizedRoute.routecode,
        totalDistance: optimizedRoute.totaldistance,
        totalDuration: optimizedRoute.totalduration,
        optimizedOrder: optimizedRoute.optimizedorder,
        tickets: optimizedRoute.tickets,
        originAddress: finalOriginAddress,
        destinationAddress: finalDestinationAddress,
        routeType: 'CONCRETE',
        ticketCount: ticketIds.length
      });

    } catch (error) {
      console.error('Error optimizing concrete route:', error);
      res.status(500).json({ 
        error: 'Failed to optimize concrete route', 
        details: error.message 
      });
    }
  },

  // Optimize asphalt routes
  async optimizeAsphaltRoute(req, res) {
    try {
      const { 
        routeCode, 
        startDate, 
        endDate, 
        originAddress, 
        destinationAddress 
      } = req.body;

      // Set default addresses if not provided
      const defaultAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const finalOriginAddress = originAddress || defaultAddress;
      const finalDestinationAddress = destinationAddress || defaultAddress;

      const createdBy = req.user?.userId || 1;

      // Get tickets for asphalt routes
      const asphaltTickets = await RouteOptimizationService.getAsphaltTickets();
      
      if (asphaltTickets.length === 0) {
        return res.status(404).json({ 
          message: 'No tickets found for asphalt routes',
          criteria: 'SPOTTING completed and either has GRINDING status (no SAWCUT) or all concrete phases completed (SAWCUT, REMOVAL, FRAMING, POURING)'
        });
      }

      const ticketIds = asphaltTickets.map(ticket => ticket.ticketid);

      // Validate API limits
      if (ticketIds.length > 158) {
        return res.status(400).json({ 
          error: 'Maximum 158 tickets supported for optimization. Consider chunking your route.' 
        });
      }

      const optimizedRoute = await RouteOptimizationService.optimizeAndSaveRoute(
        ticketIds,
        routeCode || `ASP-${Date.now()}`,
        'ASPHALT',
        startDate,
        endDate,
        finalOriginAddress,
        finalDestinationAddress,
        createdBy
      );

      res.status(200).json({
        message: 'Asphalt route optimized and saved successfully',
        routeId: optimizedRoute.routeid,
        routeCode: optimizedRoute.routecode,
        totalDistance: optimizedRoute.totaldistance,
        totalDuration: optimizedRoute.totalduration,
        optimizedOrder: optimizedRoute.optimizedorder,
        tickets: optimizedRoute.tickets,
        originAddress: finalOriginAddress,
        destinationAddress: finalDestinationAddress,
        routeType: 'ASPHALT',
        ticketCount: ticketIds.length
      });

    } catch (error) {
      console.error('Error optimizing asphalt route:', error);
      res.status(500).json({ 
        error: 'Failed to optimize asphalt route', 
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
      console.error('Error getting optimized route:', error);
      res.status(500).json({ error: 'Failed to get optimized route' });
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
  },

  // Get all active routes (regardless of type)
  async getAllActiveRoutes(req, res) {
    try {
      const routes = await Routes.findAll();
      
      res.status(200).json({
        message: 'Active routes retrieved successfully',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting all active routes:', error);
      res.status(500).json({ 
        error: 'Failed to get active routes', 
        details: error.message 
      });
    }
  },

  // Get routes by type
  async getRoutesByType(req, res) {
    try {
      const { type } = req.params;
      
      // Validate route type
      const validTypes = ['SPOTTER', 'CONCRETE', 'ASPHALT', 'default'];
      if (!validTypes.includes(type.toUpperCase())) {
        return res.status(400).json({ 
          error: 'Invalid route type', 
          validTypes: validTypes 
        });
      }

      const routes = await Routes.findByType(type.toUpperCase());
      
      res.status(200).json({
        message: `${type.toUpperCase()} routes retrieved successfully`,
        type: type.toUpperCase(),
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting routes by type:', error);
      res.status(500).json({ 
        error: 'Failed to get routes by type', 
        details: error.message 
      });
    }
  },

  // Get spotting routes
  async getSpottingRoutes(req, res) {
    try {
      const routes = await Routes.findByTypeWithTickets('SPOTTER');
      
      res.status(200).json({
        message: 'Spotting routes retrieved successfully',
        type: 'SPOTTER',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting spotting routes:', error);
      res.status(500).json({ 
        error: 'Failed to get spotting routes', 
        details: error.message 
      });
    }
  },

  // Get concrete routes
  async getConcreteRoutes(req, res) {
    try {
      const routes = await Routes.findByTypeWithTickets('CONCRETE');
      
      res.status(200).json({
        message: 'Concrete routes retrieved successfully',
        type: 'CONCRETE',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting concrete routes:', error);
      res.status(500).json({ 
        error: 'Failed to get concrete routes', 
        details: error.message 
      });
    }
  },

  // Get asphalt routes
  async getAsphaltRoutes(req, res) {
    try {
      const routes = await Routes.findByTypeWithTickets('ASPHALT');
      
      res.status(200).json({
        message: 'Asphalt routes retrieved successfully',
        type: 'ASPHALT',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting asphalt routes:', error);
      res.status(500).json({ 
        error: 'Failed to get asphalt routes', 
        details: error.message 
      });
    }
  },

  // Get completed spotting routes
  async getCompletedSpottingRoutes(req, res) {
    try {
      const routes = await Routes.findCompletedByTypeWithTickets('SPOTTER');
      
      res.status(200).json({
        message: 'Completed spotting routes retrieved successfully',
        type: 'SPOTTER',
        status: 'COMPLETED',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting completed spotting routes:', error);
      res.status(500).json({ 
        error: 'Failed to get completed spotting routes', 
        details: error.message 
      });
    }
  },

  // Get completed concrete routes
  async getCompletedConcreteRoutes(req, res) {
    try {
      const routes = await Routes.findCompletedByTypeWithTickets('CONCRETE');
      
      res.status(200).json({
        message: 'Completed concrete routes retrieved successfully',
        type: 'CONCRETE',
        status: 'COMPLETED',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting completed concrete routes:', error);
      res.status(500).json({ 
        error: 'Failed to get completed concrete routes', 
        details: error.message 
      });
    }
  },

  // Get completed asphalt routes
  async getCompletedAsphaltRoutes(req, res) {
    try {
      const routes = await Routes.findCompletedByTypeWithTickets('ASPHALT');
      
      res.status(200).json({
        message: 'Completed asphalt routes retrieved successfully',
        type: 'ASPHALT',
        status: 'COMPLETED',
        count: routes.length,
        routes: routes
      });
    } catch (error) {
      console.error('Error getting completed asphalt routes:', error);
      res.status(500).json({ 
        error: 'Failed to get completed asphalt routes', 
        details: error.message 
      });
    }
  },

  // Get tickets ready for spotting routes
  async getTicketsReadyForSpotting(req, res) {
    try {
      const tickets = await RouteOptimizationService.getSpottingTickets();
      
      // Get addresses for each ticket
      const ticketsWithAddresses = [];
      for (const ticket of tickets) {
        const address = await RouteOptimizationService.getTicketAddress(ticket);
        ticketsWithAddresses.push({
          ...ticket,
          address: address || 'Address not found'
        });
      }
      
      res.status(200).json({
        message: 'Tickets ready for spotting routes retrieved successfully',
        type: 'SPOTTER',
        count: ticketsWithAddresses.length,
        criteria: 'comment7d is NULL, empty, or TK - PERMIT EXTENDED, and no endingDate for SPOTTING status',
        tickets: ticketsWithAddresses
      });
    } catch (error) {
      console.error('Error getting tickets ready for spotting:', error);
      res.status(500).json({ 
        error: 'Failed to get tickets ready for spotting', 
        details: error.message 
      });
    }
  },

  // Get tickets ready for concrete routes
  async getTicketsReadyForConcrete(req, res) {
    try {
      const tickets = await RouteOptimizationService.getConcreteTickets();
      
      // Get addresses for each ticket
      const ticketsWithAddresses = [];
      for (const ticket of tickets) {
        const address = await RouteOptimizationService.getTicketAddress(ticket);
        ticketsWithAddresses.push({
          ...ticket,
          address: address || 'Address not found'
        });
      }
      
      res.status(200).json({
        message: 'Tickets ready for concrete routes retrieved successfully',
        type: 'CONCRETE',
        count: ticketsWithAddresses.length,
        criteria: 'SPOTTING completed (has endingDate) and has SAWCUT status',
        tickets: ticketsWithAddresses
      });
    } catch (error) {
      console.error('Error getting tickets ready for concrete:', error);
      res.status(500).json({ 
        error: 'Failed to get tickets ready for concrete', 
        details: error.message 
      });
    }
  },

  // Get tickets ready for asphalt routes
  async getTicketsReadyForAsphalt(req, res) {
    try {
      const tickets = await RouteOptimizationService.getAsphaltTickets();
      
      // Get addresses for each ticket
      const ticketsWithAddresses = [];
      for (const ticket of tickets) {
        const address = await RouteOptimizationService.getTicketAddress(ticket);
        ticketsWithAddresses.push({
          ...ticket,
          address: address || 'Address not found'
        });
      }
      
      res.status(200).json({
        message: 'Tickets ready for asphalt routes retrieved successfully',
        type: 'ASPHALT',
        count: ticketsWithAddresses.length,
        criteria: 'SPOTTING completed and either has GRINDING status (no SAWCUT) OR all concrete phases completed',
        tickets: ticketsWithAddresses
      });
    } catch (error) {
      console.error('Error getting tickets ready for asphalt:', error);
      res.status(500).json({ 
        error: 'Failed to get tickets ready for asphalt', 
        details: error.message 
      });
    }
  },

  // Test method to check database connection and Routes table
  async testRoutesTable(req, res) {
    try {
      const db = require('../../config/db');
      
      // Test basic query
      const result = await db.query('SELECT COUNT(*) as count FROM Routes WHERE deletedAt IS NULL');
      
      res.status(200).json({
        message: 'Database connection and Routes table test successful',
        totalRoutes: parseInt(result.rows[0].count),
        status: 'OK'
      });
    } catch (error) {
      console.error('Error testing Routes table:', error);
      res.status(500).json({ 
        error: 'Database test failed', 
        details: error.message 
      });
    }
  }
};

module.exports = RoutesController; 