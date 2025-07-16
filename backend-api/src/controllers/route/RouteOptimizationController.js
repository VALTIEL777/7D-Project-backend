const RouteOptimizationService = require('../../services/RouteOptimizationService');
const Tickets = require('../../models/ticket-logic/Tickets');
const Crews = require('../../models/human-resources/Crews');
const RouteTickets = require('../../models/route/RouteTickets');

const RouteOptimizationController = {
  /**
   * Get route optimization status
   * GET /api/route-optimization/status
   */
  async getOptimizationStatus(req, res) {
    try {
      // This endpoint can be used to check the status of long-running optimizations
      res.status(200).json({
        success: true,
        message: 'Route optimization service is available',
        data: {
          status: 'ready',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to check optimization status', 
        details: error.message 
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
          success: false,
          error: 'intermediateAddresses array is required and must not be empty.'
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
        success: true,
        message: 'Route optimized and saved successfully (geocoding addresses)',
        data: savedRoute,
        originAddress: finalOriginAddress,
        destinationAddress: finalDestinationAddress
      });
    } catch (error) {
      console.error('Geocode-based route optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize route with geocoding',
        details: error.message
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
        startDate,
        endDate,
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

      // Use the new consolidated optimization method
      const result = await RouteOptimizationService.optimizeRouteWithTickets(
        ticketIds,
        routeCode,
        type,
        originAddress,
        destinationAddress,
        startDate,
        endDate,
        createdBy,
        options
      );

      // Check if the result indicates success or failure
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }

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
   * Optimize routes using clustering for large numbers of locations
   * @route POST /api/route-optimization/optimize-clustered
   * @desc Optimize routes by clustering locations into groups of max 25 locations each
   * @access Private
   */
  async optimizeClustered(req, res) {
    try {
      const {
        ticketIds,
        routeCode,
        type,
        originAddress,
        destinationAddress,
        startDate,
        endDate,
        options = {}
      } = req.body;

      const createdBy = req.user?.id || 1;

      // Add detailed logging
      console.log('=== CLUSTERED OPTIMIZATION REQUEST ===');
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

      console.log(`Starting clustered optimization for ${ticketIds.length} tickets`);

      // Use the clustered optimization method
      const result = await RouteOptimizationService.optimizeRouteWithClustering(
        ticketIds,
        routeCode,
        type,
        originAddress,
        destinationAddress,
        startDate,
        endDate,
        createdBy,
        options
      );

      // Check if the result indicates success or failure
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }

    } catch (error) {
      console.error('Clustered route optimization failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize routes with clustering',
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
  },

  /**
   * Complete a route by setting endingDate to current timestamp for all related ticket statuses
   * @route POST /api/route-optimization/route/{routeId}/complete
   * @desc Complete a route by setting endingDate to current timestamp for all ticket statuses for tickets in the route
   * @access Private
   */
  async completeRoute(req, res) {
    try {
      const { routeId } = req.params;
      const updatedBy = req.user?.id || 1;

      console.log(`Completing route ${routeId}`);

      // Get all tickets in the route
      const routeTickets = await RouteTickets.findByRouteId(parseInt(routeId));
      
      if (routeTickets.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No tickets found for route ${routeId}`
        });
      }

      const ticketIds = routeTickets.map(rt => rt.ticketid);
      console.log(`Found ${ticketIds.length} tickets in route ${routeId}`);

      // Update all ticket statuses to set endingDate to current timestamp
      const result = await RouteOptimizationService.completeRoute(parseInt(routeId), ticketIds, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Route completed successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to complete route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete route',
        details: error.message
      });
    }
  },

  /**
   * Get detailed information about tickets in a route for debugging
   * @route GET /api/route-optimization/route/{routeId}/details
   * @desc Get detailed information about tickets in a route including their status
   * @access Private
   */
  async getRouteDetails(req, res) {
    try {
      const { routeId } = req.params;

      console.log(`Getting detailed information for route ${routeId}`);

      const result = await RouteOptimizationService.getRouteTicketDetails(parseInt(routeId));

      res.status(200).json({
        success: true,
        message: 'Route details retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to get route details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get route details',
        details: error.message
      });
    }
  },

  /**
   * Cancel a route by removing the endingDate from all related ticket statuses
   * @route POST /api/route-optimization/route/{routeId}/cancel
   * @desc Cancel a route by removing endingDate from all ticket statuses for tickets in the route
   * @access Private
   */
  async cancelRoute(req, res) {
    try {
      const { routeId } = req.params;
      const updatedBy = req.user?.id || 1;

      console.log(`Canceling route ${routeId}`);

      // Get all tickets in the route
      const routeTickets = await RouteTickets.findByRouteId(parseInt(routeId));
      
      if (routeTickets.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No tickets found for route ${routeId}`
        });
      }

      const ticketIds = routeTickets.map(rt => rt.ticketid);
      console.log(`Found ${ticketIds.length} tickets in route ${routeId}`);

      // Update all ticket statuses to remove endingDate (set to NULL)
      const result = await RouteOptimizationService.cancelRoute(parseInt(routeId), ticketIds, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Route canceled successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to cancel route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel route',
        details: error.message
      });
    }
  },

  /**
   * Cancel a spotting route - soft delete route and reset SPOTTING status
   * @route POST /api/route-optimization/route/{routeId}/cancel-spotting
   * @desc Cancel a spotting route by soft deleting it and resetting SPOTTING statuses
   * @access Private
   */
  async cancelSpottingRoute(req, res) {
    try {
      const { routeId } = req.params;
      const updatedBy = req.user?.id || 1;

      console.log(`Canceling spotting route ${routeId}`);

      // Get all tickets in the route
      const routeTickets = await RouteTickets.findByRouteId(parseInt(routeId));
      
      if (routeTickets.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No tickets found for route ${routeId}`
        });
      }

      const ticketIds = routeTickets.map(rt => rt.ticketid);
      console.log(`Found ${ticketIds.length} tickets in spotting route ${routeId}`);

      // Cancel the spotting route
      const result = await RouteOptimizationService.cancelSpottingRoute(parseInt(routeId), ticketIds, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Spotting route canceled successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to cancel spotting route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel spotting route',
        details: error.message
      });
    }
  },

  /**
   * Cancel a concrete route - soft delete route and reset SAWCUT status
   * @route POST /api/route-optimization/route/{routeId}/cancel-concrete
   * @desc Cancel a concrete route by soft deleting it and resetting SAWCUT statuses
   * @access Private
   */
  async cancelConcreteRoute(req, res) {
    try {
      const { routeId } = req.params;
      const updatedBy = req.user?.id || 1;

      console.log(`Canceling concrete route ${routeId}`);

      // Get all tickets in the route
      const routeTickets = await RouteTickets.findByRouteId(parseInt(routeId));
      
      if (routeTickets.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No tickets found for route ${routeId}`
        });
      }

      const ticketIds = routeTickets.map(rt => rt.ticketid);
      console.log(`Found ${ticketIds.length} tickets in concrete route ${routeId}`);

      // Cancel the concrete route
      const result = await RouteOptimizationService.cancelConcreteRoute(parseInt(routeId), ticketIds, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Concrete route canceled successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to cancel concrete route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel concrete route',
        details: error.message
      });
    }
  },

  /**
   * Cancel an asphalt route - soft delete route and reset FRAMING status
   * @route POST /api/route-optimization/route/{routeId}/cancel-asphalt
   * @desc Cancel an asphalt route by soft deleting it and resetting FRAMING statuses
   * @access Private
   */
  async cancelAsphaltRoute(req, res) {
    try {
      const { routeId } = req.params;
      const updatedBy = req.user?.id || 1;

      console.log(`Canceling asphalt route ${routeId}`);

      // Get all tickets in the route
      const routeTickets = await RouteTickets.findByRouteId(parseInt(routeId));
      
      if (routeTickets.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No tickets found for route ${routeId}`
        });
      }

      const ticketIds = routeTickets.map(rt => rt.ticketid);
      console.log(`Found ${ticketIds.length} tickets in asphalt route ${routeId}`);

      // Cancel the asphalt route
      const result = await RouteOptimizationService.cancelAsphaltRoute(parseInt(routeId), ticketIds, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Asphalt route canceled successfully',
        data: result
      });

    } catch (error) {
      console.error('Failed to cancel asphalt route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel asphalt route',
        details: error.message
      });
    }
  }
};

module.exports = RouteOptimizationController; 