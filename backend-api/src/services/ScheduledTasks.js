const NotificationService = require('./NotificationService');
const RouteOptimizationService = require('./RouteOptimizationService');

class ScheduledTasks {
  // Check expiring permits daily
  static async checkExpiringPermits() {
    try {
      console.log('Checking for expiring permits...');
      await NotificationService.checkExpiringPermits();
      console.log('Expiring permits check completed');
    } catch (error) {
      console.error('Error checking expiring permits:', error);
    }
  }

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

  // Run all scheduled tasks
  static async runAllTasks() {
    try {
      console.log('Running scheduled tasks...');
      
      // Check expiring permits
      await this.checkExpiringPermits();
      
      // Check route validation status (monitoring only)
      await this.checkRouteValidationStatus();
      
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

  // Start the scheduler
  static startScheduler() {
    // Run monitoring tasks every hour
    setInterval(async () => {
      await this.runAllTasks();
    }, 60 * 60 * 1000); // 1 hour

    // Run route re-optimization every 5 minutes (for testing - normally 6 hours)
    setInterval(async () => {
      await this.runRouteReoptimizationTask();
    }, 5 * 60 * 1000); // 5 minutes

    // Also run immediately on startup
    this.runAllTasks();
    
    console.log('Scheduler started:');
    console.log('- Monitoring tasks will run every hour');
    console.log('- Route re-optimization will run every 5 minutes (TESTING MODE)');
  }
}

module.exports = ScheduledTasks; 