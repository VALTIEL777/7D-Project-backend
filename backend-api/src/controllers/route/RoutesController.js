const Routes = require('../../models/route/Routes');

const RoutesController = {
  async createRoute(req, res) {
    try {
      const { routeCode, type, startDate, endDate, createdBy, updatedBy } = req.body;
      const newRoute = await Routes.create(routeCode, type, startDate, endDate, createdBy, updatedBy);
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
      const updatedRoute = await Routes.update(routeId, routeCode, type, startDate, endDate, updatedBy);
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
};

module.exports = RoutesController; 