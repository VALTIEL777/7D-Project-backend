const db = require('../../config/db');

class Statistics {
  // Get overall ticket statistics
  static async getOverallStatistics() {
    const result = await db.query(`
      SELECT 
        -- New Tickets (no comment7d)
        COUNT(CASE WHEN t.comment7d IS NULL THEN 1 END) as newTickets,
        
        -- Tickets in Schedule
        COUNT(CASE WHEN t.comment7d = 'TK - ON SCHEDULE' THEN 1 END) as ticketsInSchedule,
        
        -- Tickets Hold OFF
        COUNT(CASE WHEN t.comment7d = 'TK - ON HOLD OFF' THEN 1 END) as ticketsHoldOff,
        
        -- Total active tickets (not deleted)
        COUNT(*) as totalActiveTickets,
        
        -- Completed tickets
        COUNT(CASE WHEN t.comment7d = 'TK - COMPLETED' THEN 1 END) as completedTickets
      FROM Tickets t
      WHERE t.deletedAt IS NULL
    `);
    
    return result.rows[0];
  }

  // Get completed tickets without invoices
  static async getCompletedTicketsWithoutInvoices() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as completedWithoutInvoices,
        COUNT(CASE WHEN t.comment7d = 'TK - COMPLETED' THEN 1 END) as totalCompleted
      FROM Tickets t
      LEFT JOIN Invoices i ON t.ticketId = i.ticketId AND i.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND t.comment7d = 'TK - COMPLETED'
        AND i.invoiceId IS NULL
    `);
    
    return result.rows[0];
  }

  // Get tickets with non-expired permits but no digger relation
  static async getTicketsWithNonExpiredPermitsNoDigger() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as nonExpiredPermitsNoDigger
      FROM Tickets t
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
      LEFT JOIN Permits p ON pt.permitId = p.permitId AND p.deletedAt IS NULL
      LEFT JOIN Diggers d ON p.permitId = d.permitId AND d.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND p.expireDate IS NOT NULL
        AND p.expireDate > CURRENT_DATE
        AND d.diggerId IS NULL
    `);
    
    return result.rows[0];
  }

  // Get tickets with "Carryover" in comments
  static async getTicketsWithCarryover() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as ticketsWithCarryover
      FROM Tickets t
      WHERE t.deletedAt IS NULL 
        AND (
          LOWER(t.comment7d) LIKE '%carryover%' 
          OR LOWER(t.PartnerComment) LIKE '%carryover%'
        )
    `);
    
    return result.rows[0];
  }

  // Get completed tickets histogram for the last year (by months)
  static async getCompletedTicketsByMonth() {
    const result = await db.query(`
      SELECT 
        DATE_TRUNC('month', latest_ending_date) as month,
        COUNT(*) as completed_count
      FROM (
        SELECT 
          t.ticketId,
          t.ticketCode,
          MAX(tks.endingDate) as latest_ending_date
        FROM Tickets t
        LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
        WHERE t.deletedAt IS NULL 
          AND t.comment7d = 'TK - COMPLETED'
          AND tks.endingDate IS NOT NULL
          AND tks.endingDate >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY t.ticketId, t.ticketCode
      ) completed_tickets
      GROUP BY DATE_TRUNC('month', latest_ending_date)
      ORDER BY month ASC
    `);
    
    return result.rows;
  }

  // Get completed tickets for the last month (by weeks)
  static async getCompletedTicketsByWeek() {
    const result = await db.query(`
      SELECT 
        DATE_TRUNC('week', latest_ending_date) as week_start,
        DATE_TRUNC('week', latest_ending_date) + INTERVAL '6 days' as week_end,
        COUNT(*) as completed_count
      FROM (
        SELECT 
          t.ticketId,
          t.ticketCode,
          MAX(tks.endingDate) as latest_ending_date
        FROM Tickets t
        LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
        WHERE t.deletedAt IS NULL 
          AND t.comment7d = 'TK - COMPLETED'
          AND tks.endingDate IS NOT NULL
          AND tks.endingDate >= CURRENT_DATE - INTERVAL '1 month'
        GROUP BY t.ticketId, t.ticketCode
      ) completed_tickets
      GROUP BY DATE_TRUNC('week', latest_ending_date)
      ORDER BY week_start ASC
    `);
    
    return result.rows;
  }

  // Get completed tickets for the last week (by days)
  static async getCompletedTicketsByDay() {
    const result = await db.query(`
      SELECT 
        DATE(latest_ending_date) as completion_date,
        COUNT(*) as completed_count
      FROM (
        SELECT 
          t.ticketId,
          t.ticketCode,
          MAX(tks.endingDate) as latest_ending_date
        FROM Tickets t
        LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
        WHERE t.deletedAt IS NULL 
          AND t.comment7d = 'TK - COMPLETED'
          AND tks.endingDate IS NOT NULL
          AND tks.endingDate >= CURRENT_DATE - INTERVAL '1 week'
        GROUP BY t.ticketId, t.ticketCode
      ) completed_tickets
      GROUP BY DATE(latest_ending_date)
      ORDER BY completion_date ASC
    `);
    
    return result.rows;
  }

  // Get detailed statistics with additional breakdowns
  static async getDetailedStatistics() {
    const result = await db.query(`
      SELECT 
        -- Overall counts
        COUNT(*) as totalTickets,
        COUNT(CASE WHEN t.comment7d IS NULL THEN 1 END) as newTickets,
        COUNT(CASE WHEN t.comment7d = 'TK - ON SCHEDULE' THEN 1 END) as ticketsInSchedule,
        COUNT(CASE WHEN t.comment7d = 'TK - ON HOLD OFF' THEN 1 END) as ticketsHoldOff,
        COUNT(CASE WHEN t.comment7d = 'TK - COMPLETED' THEN 1 END) as completedTickets,
        
        -- Additional status breakdowns
        COUNT(CASE WHEN t.comment7d = 'TK - NEEDS PERMIT EXTENSION' THEN 1 END) as needsPermitExtension,
        COUNT(CASE WHEN t.comment7d = 'TK - WILL BE ON SCHEDULE SPRING 2025' THEN 1 END) as willBeScheduledSpring,
        COUNT(CASE WHEN t.comment7d = 'TK - DIGGER APPLAY' THEN 1 END) as diggerApply,
        COUNT(CASE WHEN t.comment7d = 'TK - ON PROGRESS' THEN 1 END) as onProgress,
        COUNT(CASE WHEN t.comment7d = 'TK - HMA - ON PROGRESS' THEN 1 END) as hmaOnProgress,
        
        -- Tickets with permits
        COUNT(CASE WHEN p.permitId IS NOT NULL THEN 1 END) as ticketsWithPermits,
        
        -- Expired permits
        COUNT(CASE WHEN p.expireDate < CURRENT_DATE THEN 1 END) as expiredPermits,
        
        -- Tickets with addresses
        COUNT(CASE WHEN ta.ticketId IS NOT NULL THEN 1 END) as ticketsWithAddresses,
        
        -- Tickets with task statuses
        COUNT(CASE WHEN tks.ticketId IS NOT NULL THEN 1 END) as ticketsWithTaskStatuses
      FROM Tickets t
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
      LEFT JOIN Permits p ON pt.permitId = p.permitId AND p.deletedAt IS NULL
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
      WHERE t.deletedAt IS NULL
    `);
    
    return result.rows[0];
  }

  // Get completion trends (last 12 months)
  static async getCompletionTrends() {
    const result = await db.query(`
      SELECT 
        DATE_TRUNC('month', latest_ending_date) as month,
        COUNT(*) as completed_count,
        COUNT(CASE WHEN latest_ending_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
        COUNT(CASE WHEN latest_ending_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days
      FROM (
        SELECT 
          t.ticketId,
          t.ticketCode,
          MAX(tks.endingDate) as latest_ending_date
        FROM Tickets t
        LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
        WHERE t.deletedAt IS NULL 
          AND t.comment7d = 'TK - COMPLETED'
          AND tks.endingDate IS NOT NULL
          AND tks.endingDate >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY t.ticketId, t.ticketCode
      ) completed_tickets
      GROUP BY DATE_TRUNC('month', latest_ending_date)
      ORDER BY month ASC
    `);
    
    return result.rows;
  }
}

module.exports = Statistics; 