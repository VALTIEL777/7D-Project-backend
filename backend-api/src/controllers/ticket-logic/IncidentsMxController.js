const IncidentsMx = require('../../models/ticket-logic/IncidentsMx');

const IncidentsMxController = {
  async createIncidentMx(req, res) {
    try {
      const { name, earliestRptDate, createdBy, updatedBy } = req.body;
      const newIncidentMx = await IncidentsMx.create(name, earliestRptDate, createdBy, updatedBy);
      res.status(201).json(newIncidentMx);
    } catch (error) {
      console.error('Error creating IncidentMx:', error);
      res.status(500).json({ message: 'Error creating IncidentMx', error: error.message });
    }
  },

  async getIncidentMxById(req, res) {
    try {
      const { incidentId } = req.params;
      const incidentMx = await IncidentsMx.findById(incidentId);
      if (!incidentMx) {
        return res.status(404).json({ message: 'IncidentMx not found' });
      }
      res.status(200).json(incidentMx);
    } catch (error) {
      console.error('Error fetching IncidentMx by ID:', error);
      res.status(500).json({ message: 'Error fetching IncidentMx', error: error.message });
    }
  },

  async getAllIncidentsMx(req, res) {
    try {
      const allIncidentsMx = await IncidentsMx.findAll();
      res.status(200).json(allIncidentsMx);
    } catch (error) {
      console.error('Error fetching all IncidentsMx:', error);
      res.status(500).json({ message: 'Error fetching IncidentsMx', error: error.message });
    }
  },

  async updateIncidentMx(req, res) {
    try {
      const { incidentId } = req.params;
      const { name, earliestRptDate, updatedBy } = req.body;
      const updatedIncidentMx = await IncidentsMx.update(incidentId, name, earliestRptDate, updatedBy);
      if (!updatedIncidentMx) {
        return res.status(404).json({ message: 'IncidentMx not found' });
      }
      res.status(200).json(updatedIncidentMx);
    } catch (error) {
      console.error('Error updating IncidentMx:', error);
      res.status(500).json({ message: 'Error updating IncidentMx', error: error.message });
    }
  },

  async deleteIncidentMx(req, res) {
    try {
      const { incidentId } = req.params;
      const deletedIncidentMx = await IncidentsMx.delete(incidentId);
      if (!deletedIncidentMx) {
        return res.status(404).json({ message: 'IncidentMx not found' });
      }
      res.status(200).json({ message: 'IncidentMx deleted successfully' });
    } catch (error) {
      console.error('Error deleting IncidentMx:', error);
      res.status(500).json({ message: 'Error deleting IncidentMx', error: error.message });
    }
  },
};

module.exports = IncidentsMxController; 