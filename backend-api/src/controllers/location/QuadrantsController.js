const Quadrants = require('../../models/location/Quadrants');

const QuadrantsController = {
  async createQuadrant(req, res) {
    try {
      const { name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId } = req.body;
      const newQuadrant = await Quadrants.create(name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId);
      res.status(201).json(newQuadrant);
    } catch (error) {
      console.error('Error creating Quadrant:', error);
      res.status(500).json({ message: 'Error creating Quadrant', error: error.message });
    }
  },

  async getQuadrantById(req, res) {
    try {
      const { quadrantId } = req.params;
      const quadrant = await Quadrants.findById(quadrantId);
      if (!quadrant) {
        return res.status(404).json({ message: 'Quadrant not found' });
      }
      res.status(200).json(quadrant);
    } catch (error) {
      console.error('Error fetching Quadrant by ID:', error);
      res.status(500).json({ message: 'Error fetching Quadrant', error: error.message });
    }
  },

  async getAllQuadrants(req, res) {
    try {
      const allQuadrants = await Quadrants.findAll();
      res.status(200).json(allQuadrants);
    } catch (error) {
      console.error('Error fetching all Quadrants:', error);
      res.status(500).json({ message: 'Error fetching Quadrants', error: error.message });
    }
  },

  async updateQuadrant(req, res) {
    try {
      const { quadrantId } = req.params;
      const { name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId } = req.body;
      const updatedQuadrant = await Quadrants.update(quadrantId, name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId);
      if (!updatedQuadrant) {
        return res.status(404).json({ message: 'Quadrant not found' });
      }
      res.status(200).json(updatedQuadrant);
    } catch (error) {
      console.error('Error updating Quadrant:', error);
      res.status(500).json({ message: 'Error updating Quadrant', error: error.message });
    }
  },

  async deleteQuadrant(req, res) {
    try {
      const { quadrantId } = req.params;
      const deletedQuadrant = await Quadrants.delete(quadrantId);
      if (!deletedQuadrant) {
        return res.status(404).json({ message: 'Quadrant not found' });
      }
      res.status(200).json({ message: 'Quadrant deleted successfully' });
    } catch (error) {
      console.error('Error deleting Quadrant:', error);
      res.status(500).json({ message: 'Error deleting Quadrant', error: error.message });
    }
  },
};

module.exports = QuadrantsController; 