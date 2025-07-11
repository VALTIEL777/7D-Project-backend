const Quadrants = require('../../models/location/Quadrants');

// Helper function to normalize database response to camelCase
const normalizeQuadrant = (dbRecord) => {
  if (!dbRecord) return null;
  
  return {
    quadrantId: dbRecord.quadrantid,
    name: dbRecord.name,
    shop: dbRecord.shop,
    zone: dbRecord.zone,
    minLatitude: dbRecord.minlatitude,
    maxLatitude: dbRecord.maxlatitude,
    minLongitude: dbRecord.minlongitude,
    maxLongitude: dbRecord.maxlongitude,
    supervisorId: dbRecord.supervisorid ? Number(dbRecord.supervisorid) : null,
    zoneManagerId: dbRecord.zonemanagerid ? Number(dbRecord.zonemanagerid) : null,
    createdBy: dbRecord.createdby ? Number(dbRecord.createdby) : null,
    updatedBy: dbRecord.updatedby ? Number(dbRecord.updatedby) : null,
    createdAt: dbRecord.createdat,
    updatedAt: dbRecord.updatedat,
    deletedAt: dbRecord.deletedat
  };
};

const QuadrantsController = {
  async createQuadrant(req, res) {
    try {
      const { name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId, zoneManagerId } = req.body;
      
      // Convert numeric values to numbers
      const numericSupervisorId = supervisorId ? Number(supervisorId) : null;
      const numericZoneManagerId = zoneManagerId ? Number(zoneManagerId) : null;
      const numericCreatedBy = createdBy ? Number(createdBy) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const newQuadrant = await Quadrants.create(name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, numericCreatedBy, numericUpdatedBy, numericSupervisorId, numericZoneManagerId);
      res.status(201).json(normalizeQuadrant(newQuadrant));
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
      res.status(200).json(normalizeQuadrant(quadrant));
    } catch (error) {
      console.error('Error fetching Quadrant by ID:', error);
      res.status(500).json({ message: 'Error fetching Quadrant', error: error.message });
    }
  },

  async getAllQuadrants(req, res) {
    try {
      const allQuadrants = await Quadrants.findAll();
      const normalizedQuadrants = allQuadrants.map(quadrant => normalizeQuadrant(quadrant));
      res.status(200).json(normalizedQuadrants);
    } catch (error) {
      console.error('Error fetching all Quadrants:', error);
      res.status(500).json({ message: 'Error fetching Quadrants', error: error.message });
    }
  },

  async updateQuadrant(req, res) {
    try {
      const { quadrantId } = req.params;
      const { name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId, zoneManagerId } = req.body;
      
      // Convert numeric values to numbers
      const numericSupervisorId = supervisorId ? Number(supervisorId) : null;
      const numericZoneManagerId = zoneManagerId ? Number(zoneManagerId) : null;
      const numericUpdatedBy = updatedBy ? Number(updatedBy) : null;
      
      const updatedQuadrant = await Quadrants.update(quadrantId, name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, numericUpdatedBy, numericSupervisorId, numericZoneManagerId);
      if (!updatedQuadrant) {
        return res.status(404).json({ message: 'Quadrant not found' });
      }
      res.status(200).json(normalizeQuadrant(updatedQuadrant));
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
      res.status(200).json({
        message: 'Quadrant deleted successfully',
        deletedQuadrant: normalizeQuadrant(deletedQuadrant)
      });
    } catch (error) {
      console.error('Error deleting Quadrant:', error);
      res.status(500).json({ message: 'Error deleting Quadrant', error: error.message });
    }
  },

  // New endpoint: Get Quadrants by Supervisor ID
  async getQuadrantsBySupervisor(req, res) {
    try {
      const { supervisorId } = req.params;
      const quadrants = await Quadrants.findBySupervisor(supervisorId);
      const normalizedQuadrants = quadrants.map(quadrant => normalizeQuadrant(quadrant));
      res.status(200).json(normalizedQuadrants);
    } catch (error) {
      console.error('Error fetching quadrants by supervisor:', error);
      res.status(500).json({ message: 'Error fetching quadrants by supervisor', error: error.message });
    }
  },

  // New endpoint: Get Quadrants by Zone Manager ID
  async getQuadrantsByZoneManager(req, res) {
    try {
      const { zoneManagerId } = req.params;
      const quadrants = await Quadrants.findByZoneManager(zoneManagerId);
      const normalizedQuadrants = quadrants.map(quadrant => normalizeQuadrant(quadrant));
      res.status(200).json(normalizedQuadrants);
    } catch (error) {
      console.error('Error fetching quadrants by zone manager:', error);
      res.status(500).json({ message: 'Error fetching quadrants by zone manager', error: error.message });
    }
  },
};

module.exports = QuadrantsController; 