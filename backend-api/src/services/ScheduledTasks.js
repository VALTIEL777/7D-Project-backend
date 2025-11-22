const RouteOptimizationService = require('./RouteOptimizationService');

class ScheduledTasks {
  // Re-optimize all non-completed routes
  static async reoptimizeAllActiveRoutes() {
    try {
      console.log('=== Starting scheduled re-optimization of all active routes ===');
      
      const Routes = require('../models/route/Routes');
      const db = require('../config/db');
      
      // Get all active routes (non-completed)
      const activeRoutes = await Routes.findAll();
      
      if (activeRoutes.length === 0) {
        console.log('✓ No active routes found for re-optimization');
        return;
      }
      
      console.log(`Found ${activeRoutes.length} active routes to re-optimize`);
      
      const results = {
        totalRoutes: activeRoutes.length,
        successful: 0,
        failed: 0,
        errors: [],
        summary: {
          totalTicketsRemoved: 0,
          totalDistanceOptimized: 0,
          totalDurationOptimized: 0
        }
      };
      
      // Default addresses for re-optimization
      const defaultOriginAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const defaultDestinationAddress = '2000 W 43rd St, Chicago, IL 60609, Estados Unidos';
      const systemUserId = 1;
      
      for (const route of activeRoutes) {
        try {
          console.log(`Re-optimizing route ${route.routeid} (${route.routecode})...`);
          
          const reoptimizeResult = await RouteOptimizationService.reoptimizeRoute(
            route.routeid,
            defaultOriginAddress,
            defaultDestinationAddress,
            systemUserId
          );
          
          results.successful++;
          results.summary.totalTicketsRemoved += reoptimizeResult.ticketsRemoved || 0;
          results.summary.totalDistanceOptimized += reoptimizeResult.totalDistance || 0;
          results.summary.totalDurationOptimized += reoptimizeResult.totalDuration || 0;
          
          console.log(`✓ Route ${route.routeid} re-optimized successfully:`);
          console.log(`  - Tickets removed: ${reoptimizeResult.ticketsRemoved || 0}`);
          console.log(`  - Total distance: ${reoptimizeResult.totalDistance || 0}m`);
          console.log(`  - Total duration: ${reoptimizeResult.totalDuration || 0}s`);
          
          if (reoptimizeResult.removedTickets && reoptimizeResult.removedTickets.length > 0) {
            console.log(`  - Removed tickets: ${reoptimizeResult.removedTickets.map(t => t.ticketCode).join(', ')}`);
          }
          
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to re-optimize route ${route.routeid}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`✗ ${errorMsg}`);
        }
      }
      
      // Log final summary
      console.log('=== Scheduled re-optimization completed ===');
      console.log(`✓ Successfully re-optimized: ${results.successful}/${results.totalRoutes} routes`);
      console.log(`✗ Failed re-optimizations: ${results.failed} routes`);
      console.log(`📊 Summary:`);
      console.log(`  - Total tickets removed: ${results.summary.totalTicketsRemoved}`);
      console.log(`  - Total distance optimized: ${results.summary.totalDistanceOptimized}m`);
      console.log(`  - Total duration optimized: ${results.summary.totalDurationOptimized}s`);
      
      if (results.errors.length > 0) {
        console.log(`⚠️  Errors encountered:`);
        results.errors.forEach(error => console.log(`  - ${error}`));
      }
      
    } catch (error) {
      console.error('Error during scheduled route re-optimization:', error);
    }
  }

  // Check route validation status (for monitoring)
  static async checkRouteValidationStatus() {
    try {
      console.log('Checking route validation status...');
      
      const result = await RouteOptimizationService.checkTicketsForRouteRemoval();
      
      if (result.success) {
        if (result.ticketsToRemove.length > 0) {
          console.log(`⚠️  Route validation alert: ${result.ticketsToRemove.length} invalid tickets found in ${result.summary.totalRoutesAffected} routes`);
          console.log(`   Reasons: ${result.summary.reasons.join(', ')}`);
        } else {
          console.log('✓ Route validation status: All routes are valid');
        }
      } else {
        console.error('✗ Failed to check route validation status:', result.error);
      }
    } catch (error) {
      console.error('Error checking route validation status:', error);
    }
  }

  // Update permit statuses based on expiration dates
  static async updatePermitStatuses() {
    try {
      console.log('=== Starting permit status update ===');
      
      const RTR = require('../models/RTR/rtr');
      const systemUserId = 1; // System user for automated updates
      
      // Update all permit statuses based on expiration dates
      const results = await RTR.updateAllPermitStatuses(systemUserId);
      
      console.log(`✓ Updated ${results.length} permit statuses`);
      
      // Log summary of changes
      const updatedPermits = results.filter(r => r.updated);
      if (updatedPermits.length > 0) {
        console.log(`📊 Permit status changes:`);
        updatedPermits.forEach(permit => {
          console.log(`  - Permit ${permit.permitId}: ${permit.oldStatus} → ${permit.newStatus}`);
        });
      } else {
        console.log(`✓ No permit status changes needed`);
      }
      
      return {
        success: true,
        totalPermits: results.length,
        updatedPermits: updatedPermits.length,
        results: results
      };
      
    } catch (error) {
      console.error('Error updating permit statuses:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check tickets for permit expiration and update comment7d
  static async checkPermitExpiration() {
    try {
      const db = require('../config/db');
      
      // Find tickets with TK - LAYOUT, TK - LAY OUT, TK - ON PROGRESS in comment7d
      const ticketsQuery = `
        SELECT DISTINCT
          t.ticketId,
          t.ticketCode,
          t.comment7d,
          lp.PermitId,
          lp.permitNumber,
          lp.expireDate,
          lp.status as permitStatus,
          (lp.expireDate::date - CURRENT_DATE::date) AS days_until_expire
        FROM Tickets t
        JOIN LATERAL (
          SELECT p.PermitId, p.permitNumber, p.expireDate, p.status
          FROM PermitedTickets pt
          JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
          WHERE pt.ticketId = t.ticketId
            AND pt.deletedAt IS NULL
            AND p.status = 'ACTIVE'
          ORDER BY p.expireDate DESC NULLS LAST
          LIMIT 1
        ) lp ON TRUE
        WHERE t.deletedAt IS NULL
          AND (
            t.comment7d ILIKE '%TK - LAYOUT%' OR
            t.comment7d ILIKE '%TK - LAY OUT%' OR
            t.comment7d ILIKE '%TK - ON PROGRESS%' OR
            t.comment7d ILIKE '%TK- LAYOUT%' OR
            t.comment7d ILIKE '%TK- LAY OUT%' OR
            t.comment7d ILIKE '%TK- ON PROGRESS%'
          )
          AND lp.expireDate IS NOT NULL
        ORDER BY t.ticketId;
      `;
      
      const ticketsResult = await db.query(ticketsQuery);
      const tickets = ticketsResult.rows;
      
      if (tickets.length === 0) {
        return;
      }
      
      const results = {
        totalTickets: tickets.length,
        updatedTickets: 0,
        skippedTickets: 0,
        errors: [],
        updatedTicketCodes: []
      };
      
      // Check each ticket's permit expiration
      for (const ticket of tickets) {
        try {
          // Use SQL-calculated days_until_expire to avoid JS date parsing issues
          const daysUntilExpiration = Number(ticket.days_until_expire);
          
          // If permit expires in 4 days or less, update comment7d
          if (daysUntilExpiration <= 4) {
            // Check if ticket already has "NEEDS PERMIT EXTENSION" to avoid duplicate updates
            const needsExtensionQuery = `
              SELECT comment7d 
              FROM Tickets 
              WHERE ticketId = $1 AND deletedAt IS NULL
            `;
            
            const currentCommentResult = await db.query(needsExtensionQuery, [ticket.ticketid]);
            
            if (currentCommentResult.rows.length > 0) {
              const currentComment = currentCommentResult.rows[0].comment7d;
              
              // Only update if it doesn't already contain "NEEDS PERMIT EXTENSION"
              if (!currentComment || !currentComment.includes('TK - NEEDS PERMIT EXTENSION')) {
                const updateQuery = `
                  UPDATE Tickets 
                  SET comment7d = REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              COALESCE(comment7d, ''),
                              'TK - LAYOUT', ''
                            ),
                            'TK - LAY OUT', ''
                          ),
                          'TK - ON PROGRESS', ''
                        ),
                        'TK- LAYOUT', ''
                      ),
                      'TK- LAY OUT', ''
                    ),
                    'TK- ON PROGRESS', ''
                  ) || 'TK - NEEDS PERMIT EXTENSION',
                      updatedAt = CURRENT_TIMESTAMP,
                      updatedBy = 1
                  WHERE ticketId = $1 AND deletedAt IS NULL
                  RETURNING ticketCode, comment7d;
                `;
                
                const updateResult = await db.query(updateQuery, [ticket.ticketid]);
                
                if (updateResult.rows.length > 0) {
                  results.updatedTickets++;
                  results.updatedTicketCodes.push(ticket.ticketcode);
                } else {
                  results.skippedTickets++;
                }
              } else {
                results.skippedTickets++;
              }
            } else {
              results.skippedTickets++;
            }
          } else {
            results.skippedTickets++;
          }
          
        } catch (error) {
          results.errors.push(`Failed to process ticket ${ticket.ticketcode}: ${error.message}`);
          console.error(`Error processing ticket ${ticket.ticketcode}:`, error.message);
        }
      }
      
      // ROLLBACK LOGIC: Check tickets currently marked as "NEEDS PERMIT EXTENSION" 
      // and revert them back to "TK - LAYOUT" if their permits have been extended
      const rollbackQuery = `
        SELECT DISTINCT
          t.ticketId,
          t.ticketCode,
          t.comment7d,
          lp.PermitId,
          lp.permitNumber,
          lp.expireDate,
          lp.status as permitStatus,
          (lp.expireDate::date - CURRENT_DATE::date) AS days_until_expire
        FROM Tickets t
        JOIN LATERAL (
          SELECT p.PermitId, p.permitNumber, p.expireDate, p.status
          FROM PermitedTickets pt
          JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
          WHERE pt.ticketId = t.ticketId
            AND pt.deletedAt IS NULL
            AND p.status = 'ACTIVE'
          ORDER BY p.expireDate DESC NULLS LAST
          LIMIT 1
        ) lp ON TRUE
        WHERE t.deletedAt IS NULL
          AND t.comment7d ILIKE '%TK - NEEDS PERMIT EXTENSION%'
          AND lp.expireDate IS NOT NULL
        ORDER BY t.ticketId;
      `;
      
      const rollbackResult = await db.query(rollbackQuery);
      const rollbackTickets = rollbackResult.rows;
      
      if (rollbackTickets.length > 0) {
        const rollbackResults = {
          totalChecked: rollbackTickets.length,
          rolledBack: 0,
          keptAsIs: 0,
          errors: [],
          rolledBackTicketCodes: []
        };
        
        // Check each ticket for rollback
        for (const ticket of rollbackTickets) {
          try {
            // Use SQL-calculated days_until_expire to avoid JS date parsing issues
            const daysUntilExpiration = Number(ticket.days_until_expire);
            
            // If permit now expires in more than 4 days, rollback to TK - LAYOUT
            if (daysUntilExpiration > 4) {
              const rollbackUpdateQuery = `
                UPDATE Tickets 
                SET comment7d = REPLACE(comment7d, 'TK - NEEDS PERMIT EXTENSION', 'TK - LAYOUT'),
                    updatedAt = CURRENT_TIMESTAMP,
                    updatedBy = 1
                WHERE ticketId = $1 AND deletedAt IS NULL
                RETURNING ticketCode, comment7d;
              `;
              
              const rollbackUpdateResult = await db.query(rollbackUpdateQuery, [ticket.ticketid]);
              
              if (rollbackUpdateResult.rows.length > 0) {
                rollbackResults.rolledBack++;
                rollbackResults.rolledBackTicketCodes.push(ticket.ticketcode);
              } else {
                rollbackResults.keptAsIs++;
              }
            } else {
              rollbackResults.keptAsIs++;
            }
            
          } catch (error) {
            rollbackResults.errors.push(`Failed to process rollback for ticket ${ticket.ticketcode}: ${error.message}`);
            console.error(`Error processing rollback for ticket ${ticket.ticketcode}:`, error.message);
          }
        }
        
        // Update main results with rollback data
        results.updatedTickets += rollbackResults.rolledBack;
        results.updatedTicketCodes.push(...rollbackResults.rolledBackTicketCodes);
        results.errors.push(...rollbackResults.errors);
      }
      
    } catch (error) {
      console.error('Error during permit expiration check:', error);
    }
  }

  // Run all scheduled tasks
  static async runAllTasks() {
    try {
      console.log('Running scheduled tasks...');
      
      // Check route validation status (monitoring only)
      await this.checkRouteValidationStatus();
      
      // Update permit statuses based on expiration dates
      await this.updatePermitStatuses();
      
      // Check permit expiration and update tickets
      await this.checkPermitExpiration();
      
      // Add more scheduled tasks here as needed
      // await this.checkOverdueTickets();
      // await this.checkLowInventory();
      // etc.
      
      console.log('All scheduled tasks completed');
    } catch (error) {
      console.error('Error running scheduled tasks:', error);
    }
  }

  // Run route re-optimization task (separate from monitoring)
  static async runRouteReoptimizationTask() {
    try {
      console.log('Running route re-optimization task...');
      await this.reoptimizeAllActiveRoutes();
      console.log('Route re-optimization task completed');
    } catch (error) {
      console.error('Error running route re-optimization task:', error);
    }
  }

  // Run permit status update task (separate from monitoring)
  static async runPermitStatusUpdateTask() {
    try {
      console.log('Running permit status update task...');
      await this.updatePermitStatuses();
      console.log('Permit status update task completed');
    } catch (error) {
      console.error('Error running permit status update task:', error);
    }
  }

  // Run permit expiration check task (separate from monitoring)
  static async runPermitExpirationTask() {
    try {
      console.log('Running permit expiration check task...');
      await this.checkPermitExpiration();
      console.log('Permit expiration check task completed');
    } catch (error) {
      console.error('Error running permit expiration check task:', error);
    }
  }

  // Run mobilization completion check task (separate from monitoring)
  static async runMobilizationCompletionTask() {
    try {
      console.log('Running mobilization completion check task...');
      await this.checkMobilizationCompletion();
      console.log('Mobilization completion check task completed');
    } catch (error) {
      console.error('Error running mobilization completion check task:', error);
    }
  }

  // Check mobilization tickets and mark as completed if all non-mobilization tickets in same incident are completed
  static async checkMobilizationCompletion() {
    try {
      console.log('=== Starting mobilization completion check ===');
      
      const db = require('../config/db');
      
      // Find all mobilization tickets that are not yet completed
      const mobilizationTicketsQuery = `
        SELECT DISTINCT
          t.ticketId,
          t.ticketCode,
          t.comment7d,
          t.incidentId,
          t.PartnerComment,
          cu.name as contractUnitName,
          cu.itemCode as contractUnitItemCode
        FROM Tickets t
        LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
        WHERE t.deletedAt IS NULL
          AND (
            -- Check if ticket is mobilization based on ContractUnit name
            (cu.name ILIKE '%mobilization%' OR cu.name ILIKE '%mob%')
          )
          AND t.comment7d NOT ILIKE '%tk - completed%'
          AND t.comment7d NOT ILIKE '%tk - cancelled%'
        ORDER BY t.incidentId, t.ticketId;
      `;
      
      const mobilizationResult = await db.query(mobilizationTicketsQuery);
      const mobilizationTickets = mobilizationResult.rows;
      
      if (mobilizationTickets.length === 0) {
        console.log('✓ No mobilization tickets found that need completion check');
        return;
      }
      
      console.log(`Found ${mobilizationTickets.length} mobilization tickets to check`);
      
      const results = {
        totalMobilizationTickets: mobilizationTickets.length,
        completedMobilizationTickets: 0,
        skippedMobilizationTickets: 0,
        errors: [],
        completedTicketCodes: []
      };
      
      // Group mobilization tickets by incidentId
      const mobilizationByIncident = {};
      mobilizationTickets.forEach(ticket => {
        if (!mobilizationByIncident[ticket.incidentid]) {
          mobilizationByIncident[ticket.incidentid] = [];
        }
        mobilizationByIncident[ticket.incidentid].push(ticket);
      });
      
      console.log(`Checking ${Object.keys(mobilizationByIncident).length} incidents with mobilization tickets`);
      
      // Check each incident
      for (const [incidentId, mobilizationTicketsInIncident] of Object.entries(mobilizationByIncident)) {
        try {
          console.log(`\nChecking incident ${incidentId} with ${mobilizationTicketsInIncident.length} mobilization tickets`);
          
          // Get all non-mobilization tickets for this incident
          const nonMobilizationQuery = `
            SELECT 
              t.ticketId,
              t.ticketCode,
              t.comment7d,
              cu.name as contractUnitName,
              cu.itemCode as contractUnitItemCode
            FROM Tickets t
            LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
            WHERE t.deletedAt IS NULL
              AND t.incidentId = $1
              AND NOT (
                -- Exclude mobilization tickets
                (cu.name ILIKE '%mobilization%' OR cu.name ILIKE '%mob%')
              )
            ORDER BY t.ticketId;
          `;
          
          const nonMobilizationResult = await db.query(nonMobilizationQuery, [incidentId]);
          const nonMobilizationTickets = nonMobilizationResult.rows;
          
          console.log(`  Found ${nonMobilizationTickets.length} non-mobilization tickets in incident ${incidentId}`);
          
          if (nonMobilizationTickets.length === 0) {
            console.log(`  ⚠️  No non-mobilization tickets found in incident ${incidentId} - skipping mobilization completion check`);
            results.skippedMobilizationTickets += mobilizationTicketsInIncident.length;
            continue;
          }
          
          // Check if all non-mobilization tickets are completed
          const completedNonMobilizationTickets = nonMobilizationTickets.filter(ticket => 
            ticket.comment7d && ticket.comment7d.toLowerCase().includes('tk - completed')
          );
          
          console.log(`  Non-mobilization tickets: ${nonMobilizationTickets.length} total, ${completedNonMobilizationTickets.length} completed`);
          
          // Show details of non-completed tickets
          const nonCompletedTickets = nonMobilizationTickets.filter(ticket => 
            !ticket.comment7d || !ticket.comment7d.toLowerCase().includes('tk - completed')
          );
          
          if (nonCompletedTickets.length > 0) {
            console.log(`  Non-completed tickets: ${nonCompletedTickets.map(t => `${t.ticketcode} (${t.comment7d || 'NULL'})`).join(', ')}`);
          }
          
          // If all non-mobilization tickets are completed, mark mobilization tickets as completed
          if (completedNonMobilizationTickets.length === nonMobilizationTickets.length) {
            console.log(`  ✅ All non-mobilization tickets completed - marking mobilization tickets as completed`);
            
            for (const mobilizationTicket of mobilizationTicketsInIncident) {
              try {
                const updateQuery = `
                  UPDATE Tickets 
                  SET comment7d = 'TK - COMPLETED',
                      updatedAt = CURRENT_TIMESTAMP,
                      updatedBy = 1
                  WHERE ticketId = $1 AND deletedAt IS NULL
                  RETURNING ticketCode, comment7d;
                `;
                
                const updateResult = await db.query(updateQuery, [mobilizationTicket.ticketid]);
                
                if (updateResult.rows.length > 0) {
                  results.completedMobilizationTickets++;
                  results.completedTicketCodes.push(mobilizationTicket.ticketcode);
                  console.log(`    ✓ Marked mobilization ticket ${mobilizationTicket.ticketcode} as completed`);
                  console.log(`      New comment7d: "${updateResult.rows[0].comment7d}"`);
                } else {
                  console.log(`    ⚠️  Could not update mobilization ticket ${mobilizationTicket.ticketcode} - may have been deleted`);
                }
              } catch (error) {
                results.errors.push(`Failed to update mobilization ticket ${mobilizationTicket.ticketcode}: ${error.message}`);
                console.error(`    ✗ Error updating mobilization ticket ${mobilizationTicket.ticketcode}:`, error.message);
              }
            }
          } else {
            console.log(`  ⏳ Not all non-mobilization tickets completed yet - skipping mobilization completion`);
            results.skippedMobilizationTickets += mobilizationTicketsInIncident.length;
          }
          
        } catch (error) {
          results.errors.push(`Failed to process incident ${incidentId}: ${error.message}`);
          console.error(`✗ Error processing incident ${incidentId}:`, error.message);
        }
      }
      
      // Log final summary
      console.log('\n=== Mobilization completion check completed ===');
      console.log(`✓ Total mobilization tickets checked: ${results.totalMobilizationTickets}`);
      console.log(`✓ Mobilization tickets marked as completed: ${results.completedMobilizationTickets}`);
      console.log(`✓ Mobilization tickets skipped: ${results.skippedMobilizationTickets}`);
      
      if (results.completedTicketCodes.length > 0) {
        console.log(`📋 Completed mobilization ticket codes: ${results.completedTicketCodes.join(', ')}`);
      }
      
      if (results.errors.length > 0) {
        console.log(`⚠️  Errors encountered:`);
        results.errors.forEach(error => console.log(`  - ${error}`));
      }
      
    } catch (error) {
      console.error('Error during mobilization completion check:', error);
    }
  }

  // Start the scheduler
  static startScheduler() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Run monitoring tasks every hour
    setInterval(async () => {
      await this.runAllTasks();
    }, 60 * 60 * 1000); // 1 hour

    // Route re-optimization frequency - same for both environments
    setInterval(async () => {
      await this.runRouteReoptimizationTask();
    }, 60 * 60 * 1000); // 1 hour for both development and production

    // Permit status update frequency - same for both environments
    setInterval(async () => {
      await this.runPermitStatusUpdateTask();
    }, 2 * 60 * 60 * 1000); // 2 hours for both development and production

    // Permit expiration check frequency - same for both environments
    setInterval(async () => {
      await this.runPermitExpirationTask();
    }, 2 * 60 * 60 * 1000); // 2 hours for both development and production

    // Mobilization completion check frequency - same for both environments
    setInterval(async () => {
      await this.runMobilizationCompletionTask();
    }, 2 * 60 * 60 * 1000); // 2 hours for both development and production

    // Also run immediately on startup
    this.runAllTasks();
    
    console.log('Scheduler started:');
    console.log(`- Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log('- Monitoring tasks will run every hour');
    console.log('- Route re-optimization will run every 1 hour');
    console.log('- Permit status update will run every 2 hours');
    console.log('- Permit expiration check will run every 2 hours');
    console.log('- Mobilization completion check will run every 2 hours');
  }
}

module.exports = ScheduledTasks; 