const RouteTickets = require('../../models/route/RouteTickets');
const db = require('../../config/db');
const RouteOptimizationService = require('../../services/RouteOptimizationService');
const Routes = require('../../models/route/Routes');

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

  async updateBatchQueue(req, res) {
    try {
      const { routeId } = req.params;
      const { updates, updatedBy } = req.body;
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: 'Updates array is required' });
      }
      const client = await db.pool.connect();
      let updatedCount = 0;
      try {
        await client.query('BEGIN');
        for (const { ticketId, queue } of updates) {
          const res = await client.query(
            'UPDATE RouteTickets SET queue = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE routeId = $3 AND ticketId = $4 AND deletedAt IS NULL RETURNING *;',
            [queue, updatedBy || 1, routeId, ticketId]
          );
          if (res.rows.length > 0) updatedCount++;
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      // After updating queues, update the route polyline
      try {
        const route = await Routes.findById(routeId);
        if (route) {
          const tickets = await RouteTickets.findByRouteId(routeId);
          const addresses = tickets.map(t => t.address);
          // Use stored origin/destination if available, else fallback
          const originAddress = route.originaddress || addresses[0];
          const destinationAddress = route.destinationaddress || addresses[addresses.length - 1];
          console.log('--- Updating route polyline after queue update ---');
          console.log('Route:', route);
          console.log('Tickets:', tickets);
          console.log('Addresses:', addresses);
          console.log('Origin:', originAddress, 'Destination:', destinationAddress);
          const polylineResult = await RouteOptimizationService.getRouteForFixedOrder(originAddress, destinationAddress, addresses);
          console.log('Polyline result:', polylineResult);
          const updateResult = await Routes.updateOptimization(
            routeId,
            polylineResult.encodedPolyline,
            polylineResult.totalDistance,
            polylineResult.totalDuration,
            tickets.map((_, i) => i),
            updatedBy || 1
          );
          console.log('Route update result:', updateResult);
        }
      } catch (err) {
        console.error('Error updating route polyline after queue update:', err);
      }
      res.status(200).json({ updated: updatedCount });
    } catch (error) {
      console.error('Error batch updating ticket queues:', error);
      res.status(500).json({ message: 'Error batch updating ticket queues', error: error.message });
    }
  },
};

module.exports = RouteTicketsController; 