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

      // First, find the permit associated with this ticket
      const permitResult = await db.query(`
        SELECT pt.permitId, p.permitNumber
        FROM PermitedTickets pt
        JOIN Permits p ON pt.permitId = p.PermitId
        WHERE pt.ticketId = $1 
          AND pt.deletedAt IS NULL 
          AND p.deletedAt IS NULL
        LIMIT 1
      `, [ticketId]);

      if (permitResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No permit found for this ticket'
        });
      }

      const permit = permitResult.rows[0];
      
      console.log(`=== DEBUG: Found permit for ticket ${ticketId}:`, permit);
      
      // Check if there's already a digger record for this ticket (regardless of permitId)
      const existingDiggerResult = await db.query(`
        SELECT d.diggerId, d.permitId, d.watchnProtect
        FROM Diggers d
        JOIN Permits p ON d.permitId = p.PermitId
        JOIN PermitedTickets pt ON p.PermitId = pt.permitId
        WHERE pt.ticketId = $1 
          AND d.deletedAt IS NULL 
          AND p.deletedAt IS NULL 
          AND pt.deletedAt IS NULL
        LIMIT 1
      `, [ticketId]);

      let digger;
      let diggerCreated = false;

      if (existingDiggerResult.rows.length > 0) {
        // Found existing digger - use it
        digger = existingDiggerResult.rows[0];
        
        // If the digger's permitId doesn't match the ticket's permit, update it
        if (digger.permitid !== permit.permitid) {
          await db.query(
            'UPDATE Diggers SET permitId = $1, updatedBy = $2, updatedAt = CURRENT_TIMESTAMP WHERE diggerId = $3',
            [permit.permitid, updatedBy, digger.diggerid]
          );
          console.log(`Updated digger ${digger.diggerid} permitId from ${digger.permitid} to ${permit.permitid}`);
        }
      } else {
        // No existing digger found - create one
        console.log(`=== DEBUG: Creating new digger for permitId: ${permit.permitid} ===`);
        digger = await Diggers.findOrCreateByPermitId(
          permit.permitid, 
          updatedBy, 
          updatedBy
        );
        diggerCreated = true;
      }

      // Update the watchnProtect property
      const updatedDigger = await Diggers.updateWatchnProtect(
        digger.diggerid, 
        watchnProtect, 
        updatedBy
      );

      // Fetch the complete digger record to ensure we have all fields including permitId
      const completeDigger = await Diggers.findById(updatedDigger.diggerid);

      res.status(200).json({
        success: true,
        message: 'Digger watchnProtect updated successfully',
        data: {
          ticketId: parseInt(ticketId),
          diggerId: completeDigger.diggerid,
          permitId: completeDigger.permitid,
          permitNumber: permit.permitnumber,
          watchnProtect: completeDigger.watchnprotect,
          updatedAt: completeDigger.updatedat,
          diggerCreated: diggerCreated
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

      const digger = await Diggers.findByTicketId(ticketId);

      if (!digger) {
        return res.status(404).json({
          success: false,
          message: 'No digger found for this ticket'
        });
      }
      
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
  },

  // Find and fix orphaned digger records
  async findAndFixOrphanedDiggers(req, res) {
    try {
      const { updatedBy = 1 } = req.body;

      // Find orphaned diggers
      const orphanedDiggers = await Diggers.findOrphanedDiggers();
      
      const results = [];
      let fixedCount = 0;

      for (const orphanedDigger of orphanedDiggers) {
        try {
          // Try to find a ticket that might be associated with this digger
          // We'll look for tickets that don't have a digger but have permits
          const ticketResult = await db.query(`
            SELECT 
              t.ticketId,
              t.ticketCode,
              pt.permitId,
              p.permitNumber
            FROM Tickets t
            JOIN PermitedTickets pt ON t.ticketId = pt.ticketId
            JOIN Permits p ON pt.permitId = p.PermitId
            LEFT JOIN Diggers d ON p.PermitId = d.permitId AND d.deletedAt IS NULL
            WHERE t.deletedAt IS NULL 
              AND pt.deletedAt IS NULL 
              AND p.deletedAt IS NULL
              AND d.diggerId IS NULL
            LIMIT 1
          `);

          if (ticketResult.rows.length > 0) {
            const ticket = ticketResult.rows[0];
            
            // Fix the orphaned digger by linking it to this permit
            const fixedDigger = await Diggers.fixOrphanedDigger(
              orphanedDigger.diggerid,
              ticket.permitid,
              updatedBy
            );

            results.push({
              diggerId: orphanedDigger.diggerid,
              diggerNumber: orphanedDigger.diggernumber,
              oldPermitId: orphanedDigger.permitid,
              newPermitId: ticket.permitid,
              ticketId: ticket.ticketid,
              ticketCode: ticket.ticketcode,
              permitNumber: ticket.permitnumber,
              status: 'fixed',
              message: `Linked digger to ticket ${ticket.ticketcode} with permit ${ticket.permitnumber}`
            });

            fixedCount++;
          } else {
            results.push({
              diggerId: orphanedDigger.diggerid,
              diggerNumber: orphanedDigger.diggernumber,
              oldPermitId: orphanedDigger.permitid,
              status: 'unfixable',
              message: 'No suitable ticket found to link this digger'
            });
          }
        } catch (error) {
          results.push({
            diggerId: orphanedDigger.diggerid,
            diggerNumber: orphanedDigger.diggernumber,
            oldPermitId: orphanedDigger.permitid,
            status: 'error',
            message: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Orphaned digger analysis completed',
        data: {
          totalOrphaned: orphanedDiggers.length,
          fixed: fixedCount,
          unfixable: results.filter(r => r.status === 'unfixable').length,
          errors: results.filter(r => r.status === 'error').length,
          results: results
        }
      });

    } catch (error) {
      console.error('Error finding and fixing orphaned diggers:', error);
      res.status(500).json({
        success: false,
        message: 'Error finding and fixing orphaned diggers',
        error: error.message
      });
    }
  },

  // Debug endpoint to test digger creation
  async debugDiggerCreation(req, res) {
    try {
      const { permitId, createdBy = 1, updatedBy = 1 } = req.body;

      if (!permitId) {
        return res.status(400).json({
          success: false,
          message: 'permitId is required'
        });
      }

      console.log(`=== DEBUG: Creating digger for permitId: ${permitId} ===`);
      
      // Test the findOrCreateByPermitId method
      const digger = await Diggers.findOrCreateByPermitId(permitId, createdBy, updatedBy);
      
      console.log(`=== DEBUG: Created/Found digger:`, digger);
      
      // Also fetch the raw database record
      const rawDigger = await db.query(
        'SELECT * FROM Diggers WHERE diggerId = $1',
        [digger.diggerid]
      );

      res.status(200).json({
        success: true,
        message: 'Debug digger creation completed',
        data: {
          permitId: permitId,
          diggerFromMethod: digger,
          rawDatabaseRecord: rawDigger.rows[0],
          allFields: {
            diggerId: digger.diggerid,
            permitId: digger.permitid,
            diggerNumber: digger.diggernumber,
            status: digger.status,
            startDate: digger.startdate,
            expireDate: digger.expiredate,
            watchnProtect: digger.watchnprotect,
            createdAt: digger.createdat,
            updatedAt: digger.updatedat,
            createdBy: digger.createdby,
            updatedBy: digger.updatedby
          }
        }
      });

    } catch (error) {
      console.error('Error in debug digger creation:', error);
      res.status(500).json({
        success: false,
        message: 'Error in debug digger creation',
        error: error.message
      });
    }
  },

  // Ensure digger exists and update watchnProtect by ticket ID
  async ensureDiggerAndUpdateWatchnProtect(req, res) {
    try {
      const { ticketId } = req.params;
      const { watchnProtect, updatedBy = 1 } = req.body;

      if (typeof watchnProtect !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'watchnProtect must be a boolean value'
        });
      }

      // First, find the permit associated with this ticket
      const permitResult = await db.query(`
        SELECT pt.permitId, p.permitNumber
        FROM PermitedTickets pt
        JOIN Permits p ON pt.permitId = p.PermitId
        WHERE pt.ticketId = $1 
          AND pt.deletedAt IS NULL 
          AND p.deletedAt IS NULL
        LIMIT 1
      `, [ticketId]);

      if (permitResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No permit found for this ticket'
        });
      }

      const permit = permitResult.rows[0];
      
      console.log(`=== DEBUG: Found permit for ticket ${ticketId}:`, permit);
      
      // Check if there's already a digger record for this ticket (regardless of permitId)
      const existingDiggerResult = await db.query(`
        SELECT d.diggerId, d.permitId, d.watchnProtect, d.diggerNumber, d.status, d.startDate, d.expireDate
        FROM Diggers d
        JOIN Permits p ON d.permitId = p.PermitId
        JOIN PermitedTickets pt ON p.PermitId = pt.permitId
        WHERE pt.ticketId = $1 
          AND d.deletedAt IS NULL 
          AND p.deletedAt IS NULL 
          AND pt.deletedAt IS NULL
        LIMIT 1
      `, [ticketId]);

      let digger;
      let diggerCreated = false;
      let permitUpdated = false;

      if (existingDiggerResult.rows.length > 0) {
        // Found existing digger - use it
        digger = existingDiggerResult.rows[0];
        
        // If the digger's permitId doesn't match the ticket's permit, update it
        if (digger.permitid !== permit.permitid) {
          await db.query(
            'UPDATE Diggers SET permitId = $1, updatedBy = $2, updatedAt = CURRENT_TIMESTAMP WHERE diggerId = $3',
            [permit.permitid, updatedBy, digger.diggerid]
          );
          permitUpdated = true;
          console.log(`Updated digger ${digger.diggerid} permitId from ${digger.permitid} to ${permit.permitid}`);
        }
      } else {
        // No existing digger found - create one
        console.log(`=== DEBUG: Creating new digger for permitId: ${permit.permitid} ===`);
        digger = await Diggers.findOrCreateByPermitId(
          permit.permitid, 
          updatedBy, 
          updatedBy
        );
        diggerCreated = true;
      }

      // Update the watchnProtect property
      const updatedDigger = await Diggers.updateWatchnProtect(
        digger.diggerid, 
        watchnProtect, 
        updatedBy
      );

      // Fetch the complete digger record to ensure we have all fields including permitId
      const completeDigger = await Diggers.findById(updatedDigger.diggerid);

      res.status(200).json({
        success: true,
        message: 'Digger ensured and watchnProtect updated successfully',
        data: {
          ticketId: parseInt(ticketId),
          diggerId: completeDigger.diggerid,
          diggerNumber: completeDigger.diggernumber,
          status: completeDigger.status,
          startDate: completeDigger.startdate,
          expireDate: completeDigger.expiredate,
          permitId: completeDigger.permitid,
          permitNumber: permit.permitnumber,
          watchnProtect: completeDigger.watchnprotect,
          updatedAt: completeDigger.updatedat,
          diggerCreated: diggerCreated,
          permitUpdated: permitUpdated,
          actions: {
            diggerCreated: diggerCreated,
            permitUpdated: permitUpdated,
            watchnProtectUpdated: true
          }
        }
      });

    } catch (error) {
      console.error('Error ensuring digger and updating watchnProtect:', error);
      res.status(500).json({
        success: false,
        message: 'Error ensuring digger and updating watchnProtect',
        error: error.message
      });
    }
  }
};

module.exports = DiggersController; 