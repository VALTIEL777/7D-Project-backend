const RouteOptimizationService = require('../../services/RouteOptimizationService');
const Tickets = require('../../models/ticket-logic/Tickets');
const Crews = require('../../models/human-resources/Crews');

const RouteOptimizationController = {
  /**
   * Optimize routes for tickets and crews
   * POST /api/route-optimization/optimize
   */
  async optimizeRoutes(req, res) {
    try {
      const { ticketIds, crewIds, startLocation, endLocation } = req.body;

      console.log('Route optimization request:', {
        ticketIds,
        crewIds,
        startLocation,
        endLocation
      });

      // Validate input
      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ 
          message: 'ticketIds is required and must be a non-empty array' 
        });
      }

      if (!crewIds || !Array.isArray(crewIds) || crewIds.length === 0) {
        return res.status(400).json({ 
          message: 'crewIds is required and must be a non-empty array' 
        });
      }

      // Fetch tickets with location data
      const tickets = [];
      for (const ticketId of ticketIds) {
        const ticket = await Tickets.findById(ticketId);
        if (!ticket) {
          return res.status(404).json({ 
            message: `Ticket with ID ${ticketId} not found` 
          });
        }
        
        // Get ticket address for location
        const ticketAddress = await Tickets.getTicketAddress(ticketId);
        if (ticketAddress) {
          ticket.latitude = ticketAddress.latitude;
          ticket.longitude = ticketAddress.longitude;
        }
        
        tickets.push(ticket);
      }

      // Fetch crews
      const crews = [];
      for (const crewId of crewIds) {
        const crew = await Crews.findById(crewId);
        if (!crew) {
          return res.status(404).json({ 
            message: `Crew with ID ${crewId} not found` 
          });
        }
        crews.push(crew);
      }

      // Optimize routes
      const optimizedRoutes = await RouteOptimizationService.optimizeTicketRoutes(tickets, crews);

      res.status(200).json({
        message: 'Routes optimized successfully',
        data: optimizedRoutes
      });

    } catch (error) {
      console.error('Route optimization error:', error);
      res.status(500).json({ 
        message: 'Failed to optimize routes', 
        error: error.message 
      });
    }
  },

  /**
   * Get route optimization status
   * GET /api/route-optimization/status
   */
  async getOptimizationStatus(req, res) {
    try {
      // This endpoint can be used to check the status of long-running optimizations
      res.status(200).json({
        message: 'Route optimization service is available',
        status: 'ready'
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ 
        message: 'Failed to check optimization status', 
        error: error.message 
      });
    }
  },

  /**
   * Test route optimization with sample data
   * POST /api/route-optimization/test
   */
  async testOptimization(req, res) {
    try {
      // Sample data for testing
      const sampleTickets = [
        {
          ticketId: 1,
          latitude: 41.8781,
          longitude: -87.6298,
          ticketCode: 'TEST-001'
        },
        {
          ticketId: 2,
          latitude: 41.9000,
          longitude: -87.6500,
          ticketCode: 'TEST-002'
        },
        {
          ticketId: 3,
          latitude: 41.8500,
          longitude: -87.6000,
          ticketCode: 'TEST-003'
        }
      ];

      const sampleCrews = [
        {
          crewId: 1,
          type: 'Concrete',
          workedHours: 8
        },
        {
          crewId: 2,
          type: 'Asphalt',
          workedHours: 8
        }
      ];

      const optimizedRoutes = await RouteOptimizationService.optimizeTicketRoutes(sampleTickets, sampleCrews);

      res.status(200).json({
        message: 'Test optimization completed successfully',
        data: optimizedRoutes
      });

    } catch (error) {
      console.error('Test optimization error:', error);
      res.status(500).json({ 
        message: 'Failed to test route optimization', 
        error: error.message 
      });
    }
  },

  /**
   * Optimize a route using addresses (geocoding intermediates)
   * POST /api/route-optimization/geocode-optimize
   */
  async geocodeOptimize(req, res) {
    try {
      console.log('[geocodeOptimize] Received request:', JSON.stringify(req.body, null, 2));
      const { originAddress, destinationAddress, intermediateAddresses } = req.body;
      if (!originAddress || !destinationAddress || !Array.isArray(intermediateAddresses) || intermediateAddresses.length === 0) {
        return res.status(400).json({
          message: 'originAddress, destinationAddress, and non-empty intermediateAddresses array are required.'
        });
      }
      // 1. Optimize the route
      const result = await RouteOptimizationService.optimizeRoute(originAddress, destinationAddress, intermediateAddresses);
      // 2. Save the optimized route to the database
      const savedRoute = await RouteOptimizationService.saveOptimizedRoute({
        routeCode: `AUTO-${Date.now()}`,
        type: 'auto',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        encodedPolyline: result.encodedPolyline,
        totalDistance: result.totalDistance,
        totalDuration: result.totalDuration,
        optimizedOrder: result.optimizedOrder,
        optimizationMetadata: result.apiResponse,
        tickets: intermediateAddresses.map((address, i) => ({ address, queue: i + 1 }))
      }, 1);
      res.status(200).json({
        message: 'Route optimized and saved successfully (geocoding addresses)',
        data: savedRoute
      });
    } catch (error) {
      console.error('Geocode-based route optimization error:', error);
      res.status(500).json({
        message: 'Failed to optimize route with geocoding',
        error: error.message
      });
    }
  }
};

module.exports = RouteOptimizationController; 