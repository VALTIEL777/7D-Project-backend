const Wayfinding = require('../../models/location/Wayfinding');

const WayfindingController = {
  async createWayfinding(req, res) {
    try {
      const { streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy } = req.body;
      const newWayfinding = await Wayfinding.create(streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy);
      res.status(201).json(newWayfinding);
    } catch (error) {
      console.error('Error creating Wayfinding:', error);
      res.status(500).json({ message: 'Error creating Wayfinding', error: error.message });
    }
  },

  async getWayfindingById(req, res) {
    try {
      const { wayfindingId } = req.params;
      const wayfinding = await Wayfinding.findById(wayfindingId);
      if (!wayfinding) {
        return res.status(404).json({ message: 'Wayfinding not found' });
      }
      res.status(200).json(wayfinding);
    } catch (error) {
      console.error('Error fetching Wayfinding by ID:', error);
      res.status(500).json({ message: 'Error fetching Wayfinding', error: error.message });
    }
  },

  async getAllWayfindings(req, res) {
    try {
      const allWayfindings = await Wayfinding.findAll();
      res.status(200).json(allWayfindings);
    } catch (error) {
      console.error('Error fetching all Wayfindings:', error);
      res.status(500).json({ message: 'Error fetching Wayfindings', error: error.message });
    }
  },

  async updateWayfinding(req, res) {
    try {
      const { wayfindingId } = req.params;
      const { streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, updatedBy } = req.body;
      const updatedWayfinding = await Wayfinding.update(wayfindingId, streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, updatedBy);
      if (!updatedWayfinding) {
        return res.status(404).json({ message: 'Wayfinding not found' });
      }
      res.status(200).json(updatedWayfinding);
    } catch (error) {
      console.error('Error updating Wayfinding:', error);
      res.status(500).json({ message: 'Error updating Wayfinding', error: error.message });
    }
  },

  async deleteWayfinding(req, res) {
    try {
      const { wayfindingId } = req.params;
      const deletedWayfinding = await Wayfinding.delete(wayfindingId);
      if (!deletedWayfinding) {
        return res.status(404).json({ message: 'Wayfinding not found' });
      }
      res.status(200).json({ message: 'Wayfinding deleted successfully' });
    } catch (error) {
      console.error('Error deleting Wayfinding:', error);
      res.status(500).json({ message: 'Error deleting Wayfinding', error: error.message });
    }
  },
};

module.exports = WayfindingController; 