const Diggers = require('../../models/Permissions/Diggers');
const db = require('../../config/db');

const DiggersController = {
  async createDigger(req, res) {
    try {
      const { permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy } = req.body;
      const newDigger = await Diggers.create(permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy);
      res.status(201).json(newDigger);
    } catch (error) {
      console.error('Error creating Digger:', error);
      res.status(500).json({ message: 'Error creating Digger', error: error.message });
    }
  },

  async getDiggerById(req, res) {
    try {
      const { diggerId } = req.params;
      const digger = await Diggers.findById(diggerId);
      if (!digger) {
        return res.status(404).json({ message: 'Digger not found' });
      }
      res.status(200).json(digger);
    } catch (error) {
      console.error('Error fetching Digger by ID:', error);
      res.status(500).json({ message: 'Error fetching Digger', error: error.message });
    }
  },

  async getAllDiggers(req, res) {
    try {
      const allDiggers = await Diggers.findAll();
      res.status(200).json(allDiggers);
    } catch (error) {
      console.error('Error fetching all Diggers:', error);
      res.status(500).json({ message: 'Error fetching Diggers', error: error.message });
    }
  },

  async updateDigger(req, res) {
    try {
      const { diggerId } = req.params;
      const { permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy } = req.body;
      const updatedDigger = await Diggers.update(diggerId, permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy);
      if (!updatedDigger) {
        return res.status(404).json({ message: 'Digger not found' });
      }
      res.status(200).json(updatedDigger);
    } catch (error) {
      console.error('Error updating Digger:', error);
      res.status(500).json({ message: 'Error updating Digger', error: error.message });
    }
  },

  async deleteDigger(req, res) {
    try {
      const { diggerId } = req.params;
      const deletedDigger = await Diggers.delete(diggerId);
      if (!deletedDigger) {
        return res.status(404).json({ message: 'Digger not found' });
      }
      res.status(200).json({ message: 'Digger deleted successfully' });
    } catch (error) {
      console.error('Error deleting Digger:', error);
      res.status(500).json({ message: 'Error deleting Digger', error: error.message });
    }
  },

  // Update watchnProtect property for a digger by ticket ID
  async updateWatchnProtectByTicketId(req, res) {
    try {
      const { ticketId } = req.params;
      const { watchnProtect, updatedBy = 1 } = req.body;

      if (typeof watchnProtect !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'watchnProtect must be a boolean value'
        });
      }

      // Find the digger associated with this ticket through the permit chain
      const result = await db.query(`
        SELECT d.diggerId, d.watchnProtect, d.permitId
        FROM Diggers d
        JOIN PermitedTickets pt ON d.permitId = pt.permitId
        WHERE pt.ticketId = $1 
          AND d.deletedAt IS NULL 
          AND pt.deletedAt IS NULL
        LIMIT 1
      `, [ticketId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No digger found for this ticket'
        });
      }

      const digger = result.rows[0];
      
      // Update the watchnProtect property
      const updatedDigger = await Diggers.updateWatchnProtect(
        digger.diggerId, 
        watchnProtect, 
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Digger watchnProtect updated successfully',
        data: {
          ticketId: parseInt(ticketId),
          diggerId: updatedDigger.diggerid,
          permitId: updatedDigger.permitid,
          watchnProtect: updatedDigger.watchnprotect,
          updatedAt: updatedDigger.updatedat
        }
      });

    } catch (error) {
      console.error('Error updating digger watchnProtect:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating digger watchnProtect',
        error: error.message
      });
    }
  },

  // Get digger information by ticket ID
  async getDiggerByTicketId(req, res) {
    try {
      const { ticketId } = req.params;

      const result = await db.query(`
        SELECT 
          d.diggerId,
          d.diggerNumber,
          d.status,
          d.startDate,
          d.expireDate,
          d.watchnProtect,
          d.permitId,
          p.permitNumber,
          p.status as permitStatus
        FROM Diggers d
        JOIN Permits p ON d.permitId = p.PermitId
        JOIN PermitedTickets pt ON p.PermitId = pt.permitId
        WHERE pt.ticketId = $1 
          AND d.deletedAt IS NULL 
          AND p.deletedAt IS NULL 
          AND pt.deletedAt IS NULL
        LIMIT 1
      `, [ticketId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No digger found for this ticket'
        });
      }

      const digger = result.rows[0];
      
      res.status(200).json({
        success: true,
        data: {
          ticketId: parseInt(ticketId),
          diggerId: digger.diggerid,
          diggerNumber: digger.diggernumber,
          status: digger.status,
          startDate: digger.startdate,
          expireDate: digger.expiredate,
          watchnProtect: digger.watchnprotect,
          permitId: digger.permitid,
          permitNumber: digger.permitnumber,
          permitStatus: digger.permitstatus
        }
      });

    } catch (error) {
      console.error('Error fetching digger by ticket ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching digger information',
        error: error.message
      });
    }
  }
};

module.exports = DiggersController; 