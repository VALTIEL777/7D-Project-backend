const express = require('express');
const StatisticsController = require('../../controllers/ticket-logic/StatisticsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Dashboard statistics and analytics
 */

/**
 * @swagger
 * /statistics/overview:
 *   get:
 *     summary: Get overall dashboard statistics
 *     tags: [Statistics]
 *     description: Retrieve key metrics for dashboard overview including new tickets, scheduled tickets, and hold off tickets
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dashboard statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     newTickets:
 *                       type: integer
 *                       description: Number of tickets with no comment7d
 *                       example: 45
 *                     ticketsInSchedule:
 *                       type: integer
 *                       description: Number of tickets with "TK - ON SCHEDULE" status
 *                       example: 23
 *                     ticketsHoldOff:
 *                       type: integer
 *                       description: Number of tickets with "TK - ON HOLD OFF" status
 *                       example: 8
 *                     totalActiveTickets:
 *                       type: integer
 *                       description: Total number of active tickets
 *                       example: 156
 *                     completedTickets:
 *                       type: integer
 *                       description: Number of completed tickets
 *                       example: 89
 *       500:
 *         description: Server error
 */
router.get('/overview', StatisticsController.getOverallStatistics);

/**
 * @swagger
 * /statistics/completed-without-invoices:
 *   get:
 *     summary: Get completed tickets without invoices
 *     tags: [Statistics]
 *     description: Count completed tickets (comment7d = 'TK - COMPLETED') that don't have entries in the Invoices table
 *     responses:
 *       200:
 *         description: Completed tickets without invoices statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Completed tickets without invoices statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     completedWithoutInvoices:
 *                       type: integer
 *                       description: Number of completed tickets without invoices
 *                       example: 15
 *                     totalCompleted:
 *                       type: integer
 *                       description: Total number of completed tickets
 *                       example: 89
 *                     percentageWithoutInvoices:
 *                       type: integer
 *                       description: Percentage of completed tickets without invoices
 *                       example: 17
 *       500:
 *         description: Server error
 */
router.get('/completed-without-invoices', StatisticsController.getCompletedTicketsWithoutInvoices);

/**
 * @swagger
 * /statistics/non-expired-permits-no-digger:
 *   get:
 *     summary: Get tickets with non-expired permits but no digger relation
 *     tags: [Statistics]
 *     description: Count tickets that have non-expired permits but don't have a digger relation
 *     responses:
 *       200:
 *         description: Tickets with non-expired permits but no digger relation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tickets with non-expired permits but no digger relation retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     nonExpiredPermitsNoDigger:
 *                       type: integer
 *                       description: Number of tickets with non-expired permits but no digger
 *                       example: 8
 *       500:
 *         description: Server error
 */
router.get('/non-expired-permits-no-digger', StatisticsController.getTicketsWithNonExpiredPermitsNoDigger);

/**
 * @swagger
 * /statistics/carryover:
 *   get:
 *     summary: Get tickets with "Carryover" in comments
 *     tags: [Statistics]
 *     description: Count tickets that have "Carryover" in either comment7d or PartnerComment fields
 *     responses:
 *       200:
 *         description: Tickets with Carryover in comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tickets with Carryover in comments retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketsWithCarryover:
 *                       type: integer
 *                       description: Number of tickets with "Carryover" in comments
 *                       example: 12
 *       500:
 *         description: Server error
 */
router.get('/carryover', StatisticsController.getTicketsWithCarryover);

/**
 * @swagger
 * /statistics/completed/monthly:
 *   get:
 *     summary: Get completed tickets histogram by month
 *     tags: [Statistics]
 *     description: Retrieve completed tickets data for the last year, grouped by months for histogram visualization
 *     responses:
 *       200:
 *         description: Monthly completion statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         format: date
 *                         description: Month start date
 *                         example: "2024-01-01T00:00:00.000Z"
 *                       monthName:
 *                         type: string
 *                         description: Formatted month name
 *                         example: "January 2024"
 *                       completedCount:
 *                         type: integer
 *                         description: Number of tickets completed in this month
 *                         example: 12
 *       500:
 *         description: Server error
 */
router.get('/completed/monthly', StatisticsController.getCompletedTicketsByMonth);

/**
 * @swagger
 * /statistics/completed/weekly:
 *   get:
 *     summary: Get completed tickets histogram by week
 *     tags: [Statistics]
 *     description: Retrieve completed tickets data for the last month, grouped by weeks for histogram visualization
 *     responses:
 *       200:
 *         description: Weekly completion statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       weekStart:
 *                         type: string
 *                         format: date
 *                         description: Week start date
 *                         example: "2024-01-01T00:00:00.000Z"
 *                       weekEnd:
 *                         type: string
 *                         format: date
 *                         description: Week end date
 *                         example: "2024-01-07T00:00:00.000Z"
 *                       weekLabel:
 *                         type: string
 *                         description: Formatted week label
 *                         example: "Jan 1 - Jan 7"
 *                       completedCount:
 *                         type: integer
 *                         description: Number of tickets completed in this week
 *                         example: 3
 *       500:
 *         description: Server error
 */
router.get('/completed/weekly', StatisticsController.getCompletedTicketsByWeek);

/**
 * @swagger
 * /statistics/completed/daily:
 *   get:
 *     summary: Get completed tickets histogram by day
 *     tags: [Statistics]
 *     description: Retrieve completed tickets data for the last week, grouped by days for histogram visualization
 *     responses:
 *       200:
 *         description: Daily completion statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       completionDate:
 *                         type: string
 *                         format: date
 *                         description: Completion date
 *                         example: "2024-01-01"
 *                       dayName:
 *                         type: string
 *                         description: Day of week name
 *                         example: "Mon"
 *                       dayLabel:
 *                         type: string
 *                         description: Formatted day label
 *                         example: "Jan 1"
 *                       completedCount:
 *                         type: integer
 *                         description: Number of tickets completed on this day
 *                         example: 2
 *       500:
 *         description: Server error
 */
router.get('/completed/daily', StatisticsController.getCompletedTicketsByDay);

/**
 * @swagger
 * /statistics/detailed:
 *   get:
 *     summary: Get detailed statistics breakdown
 *     tags: [Statistics]
 *     description: Retrieve comprehensive statistics with additional breakdowns including permit status, progress status, etc.
 *     responses:
 *       200:
 *         description: Detailed statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTickets:
 *                       type: integer
 *                       description: Total number of tickets
 *                       example: 156
 *                     newTickets:
 *                       type: integer
 *                       description: Number of new tickets
 *                       example: 45
 *                     ticketsInSchedule:
 *                       type: integer
 *                       description: Number of tickets in schedule
 *                       example: 23
 *                     ticketsHoldOff:
 *                       type: integer
 *                       description: Number of tickets on hold
 *                       example: 8
 *                     completedTickets:
 *                       type: integer
 *                       description: Number of completed tickets
 *                       example: 89
 *                     needsPermitExtension:
 *                       type: integer
 *                       description: Number of tickets needing permit extension
 *                       example: 15
 *                     willBeScheduledSpring:
 *                       type: integer
 *                       description: Number of tickets scheduled for spring
 *                       example: 12
 *                     diggerApply:
 *                       type: integer
 *                       description: Number of tickets with digger apply status
 *                       example: 5
 *                     onProgress:
 *                       type: integer
 *                       description: Number of tickets in progress
 *                       example: 18
 *                     hmaOnProgress:
 *                       type: integer
 *                       description: Number of HMA tickets in progress
 *                       example: 7
 *                     ticketsWithPermits:
 *                       type: integer
 *                       description: Number of tickets with permits
 *                       example: 120
 *                     expiredPermits:
 *                       type: integer
 *                       description: Number of tickets with expired permits
 *                       example: 25
 *                     ticketsWithAddresses:
 *                       type: integer
 *                       description: Number of tickets with addresses
 *                       example: 145
 *                     ticketsWithTaskStatuses:
 *                       type: integer
 *                       description: Number of tickets with task statuses
 *                       example: 98
 *       500:
 *         description: Server error
 */
router.get('/detailed', StatisticsController.getDetailedStatistics);

/**
 * @swagger
 * /statistics/trends:
 *   get:
 *     summary: Get completion trends
 *     tags: [Statistics]
 *     description: Retrieve completion trends for the last 12 months with additional time-based breakdowns
 *     responses:
 *       200:
 *         description: Completion trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         format: date
 *                         description: Month start date
 *                         example: "2024-01-01T00:00:00.000Z"
 *                       monthName:
 *                         type: string
 *                         description: Formatted month name
 *                         example: "January 2024"
 *                       completedCount:
 *                         type: integer
 *                         description: Total completed tickets for this month
 *                         example: 12
 *                       last30Days:
 *                         type: integer
 *                         description: Completed tickets in last 30 days
 *                         example: 8
 *                       last7Days:
 *                         type: integer
 *                         description: Completed tickets in last 7 days
 *                         example: 3
 *       500:
 *         description: Server error
 */
router.get('/trends', StatisticsController.getCompletionTrends);

/**
 * @swagger
 * /statistics/dashboard:
 *   get:
 *     summary: Get all dashboard statistics
 *     tags: [Statistics]
 *     description: Retrieve all dashboard statistics in a single API call including overview, specific metrics, histograms, detailed breakdowns, and trends
 *     responses:
 *       200:
 *         description: All dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All dashboard statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       description: Key overview metrics
 *                     specific:
 *                       type: object
 *                       description: Specific metrics including completed without invoices, non-expired permits no digger, and carryover tickets
 *                     histograms:
 *                       type: object
 *                       description: Completion histograms (monthly, weekly, daily)
 *                     detailed:
 *                       type: object
 *                       description: Detailed breakdown statistics
 *                     trends:
 *                       type: array
 *                       description: Completion trends over time
 *       500:
 *         description: Server error
 */
router.get('/dashboard', StatisticsController.getAllDashboardStatistics);

module.exports = router; 