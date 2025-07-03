const Statistics = require('../../models/ticket-logic/Statistics');

const StatisticsController = {
  // Get overall dashboard statistics
  async getOverallStatistics(req, res) {
    try {
      const stats = await Statistics.getOverallStatistics();
      
      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          newTickets: parseInt(stats.newtickets) || 0,
          ticketsInSchedule: parseInt(stats.ticketsinschedule) || 0,
          ticketsHoldOff: parseInt(stats.ticketsholdoff) || 0,
          totalActiveTickets: parseInt(stats.totalactivetickets) || 0,
          completedTickets: parseInt(stats.completedtickets) || 0
        }
      });
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching dashboard statistics', 
        error: error.message 
      });
    }
  },

  // Get completed tickets without invoices
  async getCompletedTicketsWithoutInvoices(req, res) {
    try {
      const stats = await Statistics.getCompletedTicketsWithoutInvoices();
      
      res.status(200).json({
        success: true,
        message: 'Completed tickets without invoices statistics retrieved successfully',
        data: {
          completedWithoutInvoices: parseInt(stats.completedwithoutinvoices) || 0,
          totalCompleted: parseInt(stats.totalcompleted) || 0,
          percentageWithoutInvoices: stats.totalcompleted > 0 ? 
            Math.round((parseInt(stats.completedwithoutinvoices) / parseInt(stats.totalcompleted)) * 100) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching completed tickets without invoices:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching completed tickets without invoices', 
        error: error.message 
      });
    }
  },

  // Get tickets with non-expired permits but no digger relation
  async getTicketsWithNonExpiredPermitsNoDigger(req, res) {
    try {
      const stats = await Statistics.getTicketsWithNonExpiredPermitsNoDigger();
      
      res.status(200).json({
        success: true,
        message: 'Tickets with non-expired permits but no digger relation retrieved successfully',
        data: {
          nonExpiredPermitsNoDigger: parseInt(stats.nonexpiredpermitsnodigger) || 0
        }
      });
    } catch (error) {
      console.error('Error fetching tickets with non-expired permits no digger:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching tickets with non-expired permits no digger', 
        error: error.message 
      });
    }
  },

  // Get tickets with "Carryover" in comments
  async getTicketsWithCarryover(req, res) {
    try {
      const stats = await Statistics.getTicketsWithCarryover();
      
      res.status(200).json({
        success: true,
        message: 'Tickets with Carryover in comments retrieved successfully',
        data: {
          ticketsWithCarryover: parseInt(stats.ticketswithcarryover) || 0
        }
      });
    } catch (error) {
      console.error('Error fetching tickets with Carryover:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching tickets with Carryover', 
        error: error.message 
      });
    }
  },

  // Get completed tickets histogram for the last year (by months)
  async getCompletedTicketsByMonth(req, res) {
    try {
      const monthlyData = await Statistics.getCompletedTicketsByMonth();
      
      // Format the data for frontend consumption
      const formattedData = monthlyData.map(item => ({
        month: item.month,
        monthName: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        completedCount: parseInt(item.completed_count) || 0
      }));

      res.status(200).json({
        success: true,
        message: 'Monthly completion statistics retrieved successfully',
        data: formattedData
      });
    } catch (error) {
      console.error('Error fetching monthly completion statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching monthly completion statistics', 
        error: error.message 
      });
    }
  },

  // Get completed tickets for the last month (by weeks)
  async getCompletedTicketsByWeek(req, res) {
    try {
      const weeklyData = await Statistics.getCompletedTicketsByWeek();
      
      // Format the data for frontend consumption
      const formattedData = weeklyData.map(item => ({
        weekStart: item.week_start,
        weekEnd: item.week_end,
        weekLabel: `${new Date(item.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        completedCount: parseInt(item.completed_count) || 0
      }));

      res.status(200).json({
        success: true,
        message: 'Weekly completion statistics retrieved successfully',
        data: formattedData
      });
    } catch (error) {
      console.error('Error fetching weekly completion statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching weekly completion statistics', 
        error: error.message 
      });
    }
  },

  // Get completed tickets for the last week (by days)
  async getCompletedTicketsByDay(req, res) {
    try {
      const dailyData = await Statistics.getCompletedTicketsByDay();
      
      // Format the data for frontend consumption
      const formattedData = dailyData.map(item => ({
        completionDate: item.completion_date,
        dayName: new Date(item.completion_date).toLocaleDateString('en-US', { weekday: 'short' }),
        dayLabel: new Date(item.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completedCount: parseInt(item.completed_count) || 0
      }));

      res.status(200).json({
        success: true,
        message: 'Daily completion statistics retrieved successfully',
        data: formattedData
      });
    } catch (error) {
      console.error('Error fetching daily completion statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching daily completion statistics', 
        error: error.message 
      });
    }
  },

  // Get detailed statistics with additional breakdowns
  async getDetailedStatistics(req, res) {
    try {
      const detailedStats = await Statistics.getDetailedStatistics();
      
      res.status(200).json({
        success: true,
        message: 'Detailed statistics retrieved successfully',
        data: {
          totalTickets: parseInt(detailedStats.totaltickets) || 0,
          newTickets: parseInt(detailedStats.newtickets) || 0,
          ticketsInSchedule: parseInt(detailedStats.ticketsinschedule) || 0,
          ticketsHoldOff: parseInt(detailedStats.ticketsholdoff) || 0,
          completedTickets: parseInt(detailedStats.completedtickets) || 0,
          needsPermitExtension: parseInt(detailedStats.needspermitextension) || 0,
          willBeScheduledSpring: parseInt(detailedStats.willbescheduledsprint) || 0,
          diggerApply: parseInt(detailedStats.diggerapply) || 0,
          onProgress: parseInt(detailedStats.onprogress) || 0,
          hmaOnProgress: parseInt(detailedStats.hmaonprogress) || 0,
          ticketsWithPermits: parseInt(detailedStats.ticketswithpermits) || 0,
          expiredPermits: parseInt(detailedStats.expiredpermits) || 0,
          ticketsWithAddresses: parseInt(detailedStats.ticketswithaddresses) || 0,
          ticketsWithTaskStatuses: parseInt(detailedStats.ticketswithtaskstatuses) || 0
        }
      });
    } catch (error) {
      console.error('Error fetching detailed statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching detailed statistics', 
        error: error.message 
      });
    }
  },

  // Get completion trends
  async getCompletionTrends(req, res) {
    try {
      const trends = await Statistics.getCompletionTrends();
      
      // Format the data for frontend consumption
      const formattedData = trends.map(item => ({
        month: item.month,
        monthName: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        completedCount: parseInt(item.completed_count) || 0,
        last30Days: parseInt(item.last_30_days) || 0,
        last7Days: parseInt(item.last_7_days) || 0
      }));

      res.status(200).json({
        success: true,
        message: 'Completion trends retrieved successfully',
        data: formattedData
      });
    } catch (error) {
      console.error('Error fetching completion trends:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching completion trends', 
        error: error.message 
      });
    }
  },

  // Get all dashboard statistics in one call
  async getAllDashboardStatistics(req, res) {
    try {
      const [
        overallStats,
        completedWithoutInvoices,
        nonExpiredPermitsNoDigger,
        ticketsWithCarryover,
        monthlyData,
        weeklyData,
        dailyData,
        detailedStats,
        trends
      ] = await Promise.all([
        Statistics.getOverallStatistics(),
        Statistics.getCompletedTicketsWithoutInvoices(),
        Statistics.getTicketsWithNonExpiredPermitsNoDigger(),
        Statistics.getTicketsWithCarryover(),
        Statistics.getCompletedTicketsByMonth(),
        Statistics.getCompletedTicketsByWeek(),
        Statistics.getCompletedTicketsByDay(),
        Statistics.getDetailedStatistics(),
        Statistics.getCompletionTrends()
      ]);

      // Format all data
      const formattedMonthlyData = monthlyData.map(item => ({
        month: item.month,
        monthName: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        completedCount: parseInt(item.completed_count) || 0
      }));

      const formattedWeeklyData = weeklyData.map(item => ({
        weekStart: item.week_start,
        weekEnd: item.week_end,
        weekLabel: `${new Date(item.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        completedCount: parseInt(item.completed_count) || 0
      }));

      const formattedDailyData = dailyData.map(item => ({
        completionDate: item.completion_date,
        dayName: new Date(item.completion_date).toLocaleDateString('en-US', { weekday: 'short' }),
        dayLabel: new Date(item.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completedCount: parseInt(item.completed_count) || 0
      }));

      const formattedTrends = trends.map(item => ({
        month: item.month,
        monthName: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        completedCount: parseInt(item.completed_count) || 0,
        last30Days: parseInt(item.last_30_days) || 0,
        last7Days: parseInt(item.last_7_days) || 0
      }));

      res.status(200).json({
        success: true,
        message: 'All dashboard statistics retrieved successfully',
        data: {
          overview: {
            newTickets: parseInt(overallStats.newtickets) || 0,
            ticketsInSchedule: parseInt(overallStats.ticketsinschedule) || 0,
            ticketsHoldOff: parseInt(overallStats.ticketsholdoff) || 0,
            totalActiveTickets: parseInt(overallStats.totalactivetickets) || 0,
            completedTickets: parseInt(overallStats.completedtickets) || 0
          },
          specific: {
            completedWithoutInvoices: parseInt(completedWithoutInvoices.completedwithoutinvoices) || 0,
            totalCompleted: parseInt(completedWithoutInvoices.totalcompleted) || 0,
            percentageWithoutInvoices: completedWithoutInvoices.totalcompleted > 0 ? 
              Math.round((parseInt(completedWithoutInvoices.completedwithoutinvoices) / parseInt(completedWithoutInvoices.totalcompleted)) * 100) : 0,
            nonExpiredPermitsNoDigger: parseInt(nonExpiredPermitsNoDigger.nonexpiredpermitsnodigger) || 0,
            ticketsWithCarryover: parseInt(ticketsWithCarryover.ticketswithcarryover) || 0
          },
          histograms: {
            monthly: formattedMonthlyData,
            weekly: formattedWeeklyData,
            daily: formattedDailyData
          },
          detailed: {
            totalTickets: parseInt(detailedStats.totaltickets) || 0,
            newTickets: parseInt(detailedStats.newtickets) || 0,
            ticketsInSchedule: parseInt(detailedStats.ticketsinschedule) || 0,
            ticketsHoldOff: parseInt(detailedStats.ticketsholdoff) || 0,
            completedTickets: parseInt(detailedStats.completedtickets) || 0,
            needsPermitExtension: parseInt(detailedStats.needspermitextension) || 0,
            willBeScheduledSpring: parseInt(detailedStats.willbescheduledsprint) || 0,
            diggerApply: parseInt(detailedStats.diggerapply) || 0,
            onProgress: parseInt(detailedStats.onprogress) || 0,
            hmaOnProgress: parseInt(detailedStats.hmaonprogress) || 0,
            ticketsWithPermits: parseInt(detailedStats.ticketswithpermits) || 0,
            expiredPermits: parseInt(detailedStats.expiredpermits) || 0,
            ticketsWithAddresses: parseInt(detailedStats.ticketswithaddresses) || 0,
            ticketsWithTaskStatuses: parseInt(detailedStats.ticketswithtaskstatuses) || 0
          },
          trends: formattedTrends
        }
      });
    } catch (error) {
      console.error('Error fetching all dashboard statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching dashboard statistics', 
        error: error.message 
      });
    }
  }
};

module.exports = StatisticsController; 