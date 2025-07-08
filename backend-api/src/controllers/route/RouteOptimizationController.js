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

      // Set default locations if not provided
      const defaultLocation = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const finalStartLocation = startLocation || defaultLocation;
      const finalEndLocation = endLocation || defaultLocation;

      console.log('Route optimization request:', {
        ticketIds,
        crewIds,
        startLocation: finalStartLocation,
        endLocation: finalEndLocation
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
        data: optimizedRoutes,
        startLocation: finalStartLocation,
        endLocation: finalEndLocation
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
      
      // Set default addresses if not provided
      const defaultAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const finalOriginAddress = originAddress || defaultAddress;
      const finalDestinationAddress = destinationAddress || defaultAddress;
      
      if (!Array.isArray(intermediateAddresses) || intermediateAddresses.length === 0) {
        return res.status(400).json({
          message: 'intermediateAddresses array is required and must not be empty.'
        });
      }
      
      // 1. Optimize the route
      const result = await RouteOptimizationService.optimizeRoute(finalOriginAddress, finalDestinationAddress, intermediateAddresses);
      // 2. Save the optimized route to the database
      const savedRoute = await RouteOptimizationService.saveOptimizedRoute({
        routeCode: `AUTO-${Date.now()}`,
        type: 'auto',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        encodedPolyline: result.encodedPolyline,
        totalDistance: result.totalDistance,
        totalDuration: result.totalDuration,
        optimizedOrder: Array.isArray(result.optimizedOrder) ? result.optimizedOrder : [],
        optimizationMetadata: {
          optimizationDate: new Date().toISOString(),
          totalWaypoints: intermediateAddresses.length,
          originAddress: finalOriginAddress,
          destinationAddress: finalDestinationAddress,
          apiStatus: 'success',
          routeCount: result.apiResponse?.routes?.length || 0
        },
        tickets: [] // Skip RouteTickets creation for this test endpoint
      }, 1);
      res.status(200).json({
        message: 'Route optimized and saved successfully (geocoding addresses)',
        data: savedRoute,
        originAddress: finalOriginAddress,
        destinationAddress: finalDestinationAddress
      });
    } catch (error) {
      console.error('Geocode-based route optimization error:', error);
      res.status(500).json({
        message: 'Failed to optimize route with geocoding',
        error: error.message
      });
    }
  },

  /**
   * Single route optimization with minimal API calls
   * @route POST /api/route-optimization/optimize-single
   * @desc Optimize routes for multiple tickets in a single request to minimize API calls
   * @access Private
   */
  async optimizeSingle(req, res) {
    try {
      const {
        ticketIds,
        routeCode,
        type,
        originAddress,
        destinationAddress,
        options = {}
      } = req.body;

      const createdBy = req.user?.id || 1;

      // Add detailed logging
      console.log('=== OPTIMIZE SINGLE REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Ticket IDs:', ticketIds);
      console.log('Type:', type);
      console.log('Origin Address:', originAddress);
      console.log('Destination Address:', destinationAddress);
      console.log('Options:', options);

      // Validate required fields
      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ticketIds array is required and must not be empty'
        });
      }

      if (!originAddress || !destinationAddress) {
        return res.status(400).json({
          success: false,
          error: 'originAddress and destinationAddress are required'
        });
      }

      console.log(`Starting single optimization for ${ticketIds.length} tickets`);

      // Use the new single optimization method with options
      const result = await RouteOptimizationService.optimizeRouteSingle(
        ticketIds,
        routeCode,
        type,
        originAddress,
        destinationAddress,
        createdBy,
        options
      );

      res.status(200).json({
        success: true,
        message: result.message || 'Single route optimization completed successfully',
        data: result
      });

    } catch (error) {
      console.error('Single route optimization failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize routes',
        details: error.message
      });
    }
  },

  /**
   * Add tickets to an existing route
   * @route POST /api/route-optimization/route/{routeId}/add-tickets
   * @desc Add tickets to an existing route without re-optimizing
   * @access Private
   */
  async addTicketsToRoute(req, res) {
    try {
      const { routeId } = req.params;
      const { ticketIds } = req.body;
      const updatedBy = req.user?.id || 1;

      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ticketIds array is required and must not be empty'
        });
      }

      const result = await RouteOptimizationService.addTicketsToRoute(
        parseInt(routeId),
        ticketIds,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Tickets added to route successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to add tickets to route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add tickets to route',
        details: error.message
      });
    }
  },

  /**
   * Remove tickets from an existing route
   * @route DELETE /api/route-optimization/route/{routeId}/remove-tickets
   * @desc Remove tickets from an existing route
   * @access Private
   */
  async removeTicketsFromRoute(req, res) {
    try {
      const { routeId } = req.params;
      const { ticketIds } = req.body;
      const updatedBy = req.user?.id || 1;

      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ticketIds array is required and must not be empty'
        });
      }

      const result = await RouteOptimizationService.removeTicketsFromRoute(
        parseInt(routeId),
        ticketIds,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Tickets removed from route successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to remove tickets from route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove tickets from route',
        details: error.message
      });
    }
  },

  /**
   * Re-optimize an existing route
   * @route POST /api/route-optimization/route/{routeId}/reoptimize
   * @desc Re-optimize an existing route with current tickets
   * @access Private
   */
  async reoptimizeRoute(req, res) {
    try {
      const { routeId } = req.params;
      const { originAddress, destinationAddress } = req.body;
      const updatedBy = req.user?.id || 1;

      if (!originAddress || !destinationAddress) {
        return res.status(400).json({
          success: false,
          error: 'originAddress and destinationAddress are required'
        });
      }

      const result = await RouteOptimizationService.reoptimizeRoute(
        parseInt(routeId),
        originAddress,
        destinationAddress,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Route re-optimized successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to re-optimize route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to re-optimize route',
        details: error.message
      });
    }
  },

  /**
   * Suggest addresses for a ticket without a valid address
   * @route POST /api/route-optimization/suggest-addresses
   * @desc Find similar or nearby addresses for tickets missing valid addresses
   * @access Private
   */
  async suggestAddresses(req, res) {
    try {
      const { ticketId, partialAddress, options = {} } = req.body;

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          error: 'ticketId is required'
        });
      }

      console.log(`Address suggestion request for ticket ${ticketId}`);

      const result = await RouteOptimizationService.suggestAddressesForTicket(
        parseInt(ticketId),
        partialAddress,
        options
      );

      res.status(200).json({
        success: true,
        message: 'Address suggestions generated successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to suggest addresses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to suggest addresses',
        details: error.message
      });
    }
  },

  /**
   * Find similar addresses for multiple tickets
   * @route POST /api/route-optimization/suggest-addresses-batch
   * @desc Find similar addresses for multiple tickets at once
   * @access Private
   */
  async suggestAddressesBatch(req, res) {
    try {
      const { tickets, options = {} } = req.body;

      if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'tickets array is required and must not be empty'
        });
      }

      console.log(`Batch address suggestion request for ${tickets.length} tickets`);

      const results = [];
      for (const ticket of tickets) {
        const { ticketId, partialAddress } = ticket;
        
        if (!ticketId) {
          results.push({
            ticketId: null,
            error: 'ticketId is required'
          });
          continue;
        }

        try {
          const result = await RouteOptimizationService.suggestAddressesForTicket(
            parseInt(ticketId),
            partialAddress,
            options
          );
          results.push(result);
        } catch (error) {
          results.push({
            ticketId: parseInt(ticketId),
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Batch address suggestions completed',
        data: {
          totalTickets: tickets.length,
          successfulSuggestions: results.filter(r => !r.error).length,
          failedSuggestions: results.filter(r => r.error).length,
          results: results
        }
      });

    } catch (error) {
      console.error('Failed to suggest addresses in batch:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to suggest addresses in batch',
        details: error.message
      });
    }
  }
};

module.exports = RouteOptimizationController; 