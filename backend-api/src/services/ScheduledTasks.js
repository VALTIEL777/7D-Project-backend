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

  // Check tickets for permit expiration and update comment7d
  static async checkPermitExpiration() {
    try {
      console.log('=== Starting permit expiration check ===');
      
      const db = require('../config/db');
      
      // First, let's debug what tickets exist with these statuses
      const debugQuery = `
        SELECT DISTINCT
          t.ticketId,
          t.ticketCode,
          t.comment7d,
          p.PermitId,
          p.permitNumber,
          p.expireDate,
          p.status as permitStatus
        FROM Tickets t
        LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
        LEFT JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
        WHERE t.deletedAt IS NULL
          AND (
            t.comment7d ILIKE '%TK - LAYOUT%' OR
            t.comment7d ILIKE '%TK - LAY OUT%' OR
            t.comment7d ILIKE '%TK - ON PROGRESS%' OR
            t.comment7d ILIKE '%TK- LAYOUT%' OR
            t.comment7d ILIKE '%TK- LAY OUT%' OR
            t.comment7d ILIKE '%TK- ON PROGRESS%'
          )
        ORDER BY t.ticketId
        LIMIT 10;
      `;
      
      const debugResult = await db.query(debugQuery);
      console.log(`Found ${debugResult.rows.length} tickets with layout/progress status (showing first 10):`);
      debugResult.rows.forEach(ticket => {
        console.log(`  - ${ticket.ticketcode || 'NULL'}: "${ticket.comment7d}" (Permit: ${ticket.permitnumber || 'None'}, Expires: ${ticket.expiredate || 'N/A'})`);
      });
      
      // Also check how many tickets have permits
      const permitCountQuery = `
        SELECT COUNT(*) as total_with_permits
        FROM Tickets t
        JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
        JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
        WHERE t.deletedAt IS NULL
          AND (
            t.comment7d ILIKE '%TK - LAYOUT%' OR
            t.comment7d ILIKE '%TK - LAY OUT%' OR
            t.comment7d ILIKE '%TK - ON PROGRESS%' OR
            t.comment7d ILIKE '%TK- LAYOUT%' OR
            t.comment7d ILIKE '%TK- LAY OUT%' OR
            t.comment7d ILIKE '%TK- ON PROGRESS%'
          )
          AND p.expireDate IS NOT NULL;
      `;
      
      const permitCountResult = await db.query(permitCountQuery);
      console.log(`Tickets with permits and expiration dates: ${permitCountResult.rows[0].total_with_permits}`);
      
      // Check if there are ANY tickets with permits at all
      const anyPermitsQuery = `
        SELECT COUNT(*) as total_permits
        FROM Permits p
        WHERE p.deletedAt IS NULL AND p.expireDate IS NOT NULL;
      `;
      
      const anyPermitsResult = await db.query(anyPermitsQuery);
      console.log(`Total permits in database: ${anyPermitsResult.rows[0].total_permits}`);
      
      // Check if there are ANY PermitedTickets relationships
      const anyPermitTicketsQuery = `
        SELECT COUNT(*) as total_permit_tickets
        FROM PermitedTickets pt
        WHERE pt.deletedAt IS NULL;
      `;
      
      const anyPermitTicketsResult = await db.query(anyPermitTicketsQuery);
      console.log(`Total ticket-permit relationships: ${anyPermitTicketsResult.rows[0].total_permit_tickets}`);
      
      // Find tickets with TK - LAYOUT, TK - LAY OUT, TK - ON PROGRESS in comment7d
      const ticketsQuery = `
        SELECT DISTINCT
          t.ticketId,
          t.ticketCode,
          t.comment7d,
          p.PermitId,
          p.permitNumber,
          p.expireDate,
          p.status as permitStatus
        FROM Tickets t
        JOIN PermitedTickets pt ON t.ticketId = pt.ticketId
        JOIN Permits p ON pt.permitId = p.PermitId
        WHERE t.deletedAt IS NULL
          AND pt.deletedAt IS NULL
          AND p.deletedAt IS NULL
          AND (
            t.comment7d ILIKE '%TK - LAYOUT%' OR
            t.comment7d ILIKE '%TK - LAY OUT%' OR
            t.comment7d ILIKE '%TK - ON PROGRESS%' OR
            t.comment7d ILIKE '%TK- LAYOUT%' OR
            t.comment7d ILIKE '%TK- LAY OUT%' OR
            t.comment7d ILIKE '%TK- ON PROGRESS%'
          )
          AND p.expireDate IS NOT NULL
        ORDER BY t.ticketId;
      `;
      
      const ticketsResult = await db.query(ticketsQuery);
      const tickets = ticketsResult.rows;
      
      if (tickets.length === 0) {
        console.log('✓ No tickets found with TK - LAYOUT, TK - LAY OUT, or TK - ON PROGRESS status that have permits');
        return;
      }
      
      console.log(`Found ${tickets.length} tickets with layout/progress status to check`);
      
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
          const expireDate = new Date(ticket.expiredate);
          const today = new Date();
          const daysUntilExpiration = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
          
          console.log(`Checking ticket ${ticket.ticketcode} (Permit: ${ticket.permitnumber}, Expires: ${ticket.expiredate})`);
          console.log(`  Days until expiration: ${daysUntilExpiration}`);
          
          // If permit expires in 2 days or less, update comment7d
          if (daysUntilExpiration <= 2) {
            const updateQuery = `
              UPDATE Tickets 
              SET comment7d = 'TK - NEEDS PERMIT EXTENSION',
                  updatedAt = CURRENT_TIMESTAMP,
                  updatedBy = 1
              WHERE ticketId = $1 AND deletedAt IS NULL
              RETURNING ticketCode, comment7d;
            `;
            
            const updateResult = await db.query(updateQuery, [ticket.ticketid]);
            
            if (updateResult.rows.length > 0) {
              results.updatedTickets++;
              results.updatedTicketCodes.push(ticket.ticketcode);
              console.log(`✓ Updated ticket ${ticket.ticketcode} - Permit expires in ${daysUntilExpiration} days`);
            } else {
              results.skippedTickets++;
              console.log(`⚠️  Could not update ticket ${ticket.ticketcode} - may have been deleted`);
            }
          } else {
            results.skippedTickets++;
            console.log(`✓ Ticket ${ticket.ticketcode} - Permit expires in ${daysUntilExpiration} days (no action needed)`);
          }
          
        } catch (error) {
          results.errors.push(`Failed to process ticket ${ticket.ticketcode}: ${error.message}`);
          console.error(`✗ Error processing ticket ${ticket.ticketcode}:`, error.message);
        }
      }
      
      // Log final summary
      console.log('=== Permit expiration check completed ===');
      console.log(`✓ Total tickets checked: ${results.totalTickets}`);
      console.log(`✓ Tickets updated: ${results.updatedTickets}`);
      console.log(`✓ Tickets skipped: ${results.skippedTickets}`);
      
      if (results.updatedTicketCodes.length > 0) {
        console.log(`📋 Updated ticket codes: ${results.updatedTicketCodes.join(', ')}`);
      }
      
      if (results.errors.length > 0) {
        console.log(`⚠️  Errors encountered:`);
        results.errors.forEach(error => console.log(`  - ${error}`));
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

  // Start the scheduler
  static startScheduler() {
    // Run monitoring tasks every hour
    setInterval(async () => {
      await this.runAllTasks();
    }, 60 * 60 * 1000); // 1 hour

    // Run route re-optimization every 30 minutes (for testing - normally 6 hours)
    setInterval(async () => {
      await this.runRouteReoptimizationTask();
    }, 30 * 60 * 1000); // 30 minutes

    // Run permit expiration check every 30 minutes (same frequency as route re-optimization)
    setInterval(async () => {
      await this.runPermitExpirationTask();
    }, 30 * 60 * 1000); // 30 minutes

    // Also run immediately on startup
    this.runAllTasks();
    
    console.log('Scheduler started:');
    console.log('- Monitoring tasks will run every hour');
    console.log('- Route re-optimization will run every 30 minutes (TESTING MODE)');
    console.log('- Permit expiration check will run every 30 minutes');
  }
}

module.exports = ScheduledTasks; 