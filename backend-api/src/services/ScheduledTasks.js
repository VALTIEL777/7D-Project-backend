// const NotificationService = require('./NotificationService');

// class ScheduledTasks {
//   // Check expiring permits daily
//   static async checkExpiringPermits() {
//     try {
//       console.log('Checking for expiring permits...');
//       await NotificationService.checkExpiringPermits();
//       console.log('Expiring permits check completed');
//     } catch (error) {
//       console.error('Error checking expiring permits:', error);
//     }
//   }

//   // Run all scheduled tasks
//   static async runAllTasks() {
//     try {
//       console.log('Running scheduled tasks...');
      
//       // Check expiring permits
//       await this.checkExpiringPermits();
      
//       // Add more scheduled tasks here as needed
//       // await this.checkOverdueTickets();
//       // await this.checkLowInventory();
//       // etc.
      
//       console.log('All scheduled tasks completed');
//     } catch (error) {
//       console.error('Error running scheduled tasks:', error);
//     }
//   }

//   // Start the scheduler
//   static startScheduler() {
//     // Run tasks every hour
//     setInterval(async () => {
//       await this.runAllTasks();
//     }, 60 * 60 * 1000); // 1 hour

//     // Also run immediately on startup
//     this.runAllTasks();
    
//     console.log('Scheduler started - tasks will run every hour');
//   }
// }

// module.exports = ScheduledTasks; 