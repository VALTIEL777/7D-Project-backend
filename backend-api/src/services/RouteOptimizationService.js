const axios = require('axios');
const {RouteOptimizationClient} = require('@googlemaps/routeoptimization').v1;
const Routes = require('../models/route/Routes');
const RouteTickets = require('../models/route/RouteTickets');
const Tickets = require('../models/ticket-logic/Tickets');
const db = require('../config/db');

class RouteOptimizationService {
  constructor() {
    // Use Google Cloud Route Optimization API
    this.routeOptimizationClient = new RouteOptimizationClient();
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'burguer-menu-fbb80';
    
    // Get the access token from Application Default Credentials
    this.accessToken = null;
  }

  /**
   * Get access token from Application Default Credentials
   */
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      // Use gcloud CLI to get access token from mounted credentials
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Set the gcloud config path to the mounted credentials
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/root/.config/gcloud/application_default_credentials.json';
      
      const { stdout } = await execAsync('gcloud auth print-access-token');
      this.accessToken = stdout.trim();
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Authentication failed. Please ensure gcloud credentials are mounted in the container.');
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address) {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: address,
            key: this.apiKey
          }
        }
      );

      if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        return {
          address,
          latitude: location.lat,
          longitude: location.lng,
          placeId: response.data.results[0].place_id
        };
      } else {
        throw new Error(`Geocoding failed for address: ${address} - Status: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw error;
    }
  }

  /**
   * Generate encoded polyline for optimized route using Google Maps Directions API
   */
  async generateEncodedPolyline(originCoords, destinationCoords, intermediateCoords, optimizedOrder) {
    try {
      // Reorder intermediate coordinates based on optimized order
      const orderedCoords = optimizedOrder.map(index => intermediateCoords[index]);
      
      // Build waypoints string for Directions API
      const waypoints = orderedCoords.map(coord => `${coord.latitude},${coord.longitude}`).join('|');
      
      // Call Google Maps Directions API
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: `${originCoords.latitude},${originCoords.longitude}`,
            destination: `${destinationCoords.latitude},${destinationCoords.longitude}`,
            waypoints: waypoints,
            optimize: false, // We already optimized the order
            key: this.apiKey
          }
        }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        return response.data.routes[0].overview_polyline.points;
      } else {
        console.warn('Failed to generate polyline, using null:', response.data.status);
        return null;
      }
    } catch (error) {
      console.error('Error generating encoded polyline:', error.message);
      return null;
    }
  }

  /**
   * Optimize routes using Google Cloud Route Optimization API
   */
  async optimizeRoute(originAddress, destinationAddress, intermediateAddresses) {
    try {
      console.log('Route Optimization Request:', JSON.stringify({
        origin: originAddress,
        destination: destinationAddress,
        intermediates: intermediateAddresses.length
      }, null, 2));
      
      // Validate API limits
      if (intermediateAddresses.length > 100) {
        throw new Error('Google Cloud Route Optimization API supports maximum 100 locations.');
      }

      // --- STEP 1: Geocode all addresses ---
      console.log('Geocoding addresses...');
      const originCoords = await this.geocodeAddress(originAddress);
      const destinationCoords = await this.geocodeAddress(destinationAddress);
      
      const intermediateCoords = [];
      for (const address of intermediateAddresses) {
        try {
          const coords = await this.geocodeAddress(address);
          intermediateCoords.push(coords);
        } catch (error) {
          console.error(`Skipping route optimization due to geocoding error: ${error.message}`);
          throw error;
        }
      }

      // --- STEP 2: Build the Route Optimization API request ---
      const shipments = intermediateCoords.map((coords, index) => ({
        pickups: [{
          arrivalLocation: {
            latitude: coords.latitude,
            longitude: coords.longitude
          }
        }],
        deliveries: [{
          arrivalLocation: {
            latitude: coords.latitude,
            longitude: coords.longitude
          }
        }]
      }));

      const vehicles = [{
        startLocation: {
          latitude: originCoords.latitude,
          longitude: originCoords.longitude
        },
        endLocation: {
          latitude: destinationCoords.latitude,
          longitude: destinationCoords.longitude
        },
        costPerKilometer: 1.0
      }];

      const globalStartTime = {
        seconds: Math.floor(Date.now() / 1000)
      };
      const globalEndTime = {
        seconds: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000) // 24 hours from now
      };

      const requestBody = {
        parent: `projects/${this.projectId}`,
        model: {
          shipments: shipments,
          vehicles: vehicles,
          globalStartTime: globalStartTime,
          globalEndTime: globalEndTime
        }
      };

      console.log('Route Optimization API Request:', JSON.stringify(requestBody, null, 2));

      // --- STEP 3: Call the Route Optimization API ---
      const response = await this.routeOptimizationClient.optimizeTours(requestBody);
      
      console.log('Route Optimization Response:', JSON.stringify(response, null, 2));
      
      if (!response || !response[0] || !response[0].routes) {
        throw new Error('No routes found in optimization response');
      }

      const route = response[0];
      
      // Extract route information
      let totalDurationSeconds = 0;
      const durationStr = route.routes?.[0]?.metrics?.totalDuration || '0s';
      const match = durationStr.match(/^(\d+(?:\.\d+)?)s$/);
      if (match) {
        totalDurationSeconds = parseFloat(match[1]);
      }

      // Extract optimized order
      const optimizedOrder = route.routes?.[0]?.visits?.map(visit => visit.shipmentIndex) || [];
      
      // Generate encoded polyline using the optimized order
      const encodedPolyline = await this.generateEncodedPolyline(
        originCoords, 
        destinationCoords, 
        intermediateCoords, 
        optimizedOrder
      );

      const optimizedRoute = {
        encodedPolyline: encodedPolyline,
        optimizedOrder: optimizedOrder,
        totalDistance: route.routes?.[0]?.metrics?.totalDistanceMeters || 0,
        totalDuration: totalDurationSeconds,
        apiResponse: response[0]
      };

      return optimizedRoute;

    } catch (error) {
      console.error('Route Optimization Error:', error.response?.data || error.message);
      throw new Error(`Route optimization failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Save optimized route to database
   */
  async saveOptimizedRoute(routeData, createdBy = 1) {
    try {
      // 1. Create the route
      const route = await Routes.create(
        routeData.routeCode,
        routeData.type,
        routeData.startDate,
        routeData.endDate,
        routeData.encodedPolyline,
        routeData.totalDistance,
        routeData.totalDuration,
        routeData.optimizedOrder,
        routeData.optimizationMetadata,
        createdBy,
        createdBy
      );

      // 2. Create route tickets with optimized order
      if (routeData.tickets && routeData.tickets.length > 0) {
        const routeTickets = routeData.tickets.map((ticket, index) => ({
          routeId: route.routeId,
          ticketId: ticket.ticketId,
          address: ticket.address,
          queue: index, // Position in optimized route
          createdBy: createdBy,
          updatedBy: createdBy
        }));

        await RouteTickets.createBatch(routeTickets);
      }

      return route;
    } catch (error) {
      console.error('Failed to save optimized route:', error);
      throw error;
    }
  }

  /**
   * Optimize and save route for tickets
   */
  async optimizeAndSaveRoute(ticketIds, routeCode, type, startDate, endDate, originAddress, destinationAddress, createdBy = 1) {
    try {
      // 1. Get tickets with addresses
      const tickets = await Promise.all(
        ticketIds.map(async (ticketId) => {
          const ticket = await Tickets.findById(ticketId);
          if (!ticket) {
            throw new Error(`Ticket not found: ${ticketId}`);
          }
          
          // Get ticket address (you might need to adjust this based on your data structure)
          const ticketAddress = await this.getTicketAddress(ticket);
          
          return {
            ticketId: ticket.ticketId,
            ticketCode: ticket.ticketCode,
            address: ticketAddress,
            quantity: ticket.quantity,
            amountToPay: ticket.amountToPay
          };
        })
      );

      // 2. Extract addresses for optimization
      const addresses = tickets.map(ticket => ticket.address).filter(Boolean);
      
      if (addresses.length === 0) {
        throw new Error('No valid addresses found for optimization');
      }

      // 3. Optimize route
      const optimizedRoute = await this.optimizeRoute(
        originAddress,
        destinationAddress,
        addresses
      );

      // 4. Reorder tickets based on optimized order
      const optimizedTickets = optimizedRoute.optimizedOrder.map((index, queue) => ({
        ...tickets[index],
        queue: queue
      }));

      // 5. Prepare route data for database
      const routeData = {
        routeCode: routeCode || `ROUTE-${Date.now()}`,
        type: type || 'default',
        startDate: startDate || new Date(),
        endDate: endDate || new Date(),
        encodedPolyline: optimizedRoute.encodedPolyline,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        optimizedOrder: optimizedRoute.optimizedOrder,
        optimizationMetadata: {
          apiResponse: optimizedRoute.apiResponse,
          optimizationDate: new Date().toISOString(),
          totalWaypoints: addresses.length,
          originAddress,
          destinationAddress
        },
        tickets: optimizedTickets
      };

      // 6. Save to database
      const savedRoute = await this.saveOptimizedRoute(routeData, createdBy);

      return {
        routeId: savedRoute.routeId,
        routeCode: savedRoute.routeCode,
        totalDistance: savedRoute.totalDistance,
        totalDuration: savedRoute.totalDuration,
        optimizedOrder: savedRoute.optimizedOrder,
        tickets: optimizedTickets
      };
    } catch (error) {
      console.error('Failed to optimize and save route:', error);
      throw error;
    }
  }

  /**
   * Get ticket address (you'll need to implement this based on your data structure)
   */
  async getTicketAddress(ticket) {
    // This is a placeholder - you'll need to implement this based on how addresses are stored
    // You might need to join with Addresses table or get from TicketAddresses
    try {
      // Example implementation - adjust based on your schema
      const addressQuery = await db.query(`
        SELECT a.addressNumber, a.addressCardinal, a.addressStreet, a.addressSuffix
        FROM TicketAddresses ta
        JOIN Addresses a ON ta.addressId = a.addressId
        WHERE ta.ticketId = $1 AND ta.deletedAt IS NULL
        LIMIT 1
      `, [ticket.ticketId]);

      if (addressQuery.rows.length > 0) {
        const addr = addressQuery.rows[0];
        return `${addr.addressNumber} ${addr.addressCardinal} ${addr.addressStreet} ${addr.addressSuffix}`.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting ticket address:', error);
      return null;
    }
  }

  /**
   * Get optimized route with tickets
   */
  async getOptimizedRoute(routeId) {
    try {
      const route = await Routes.findByIdWithOptimizedTickets(routeId);
      if (!route) {
        throw new Error('Route not found');
      }
      return route;
    } catch (error) {
      console.error('Failed to get optimized route:', error);
      throw error;
    }
  }
}

module.exports = new RouteOptimizationService(); 