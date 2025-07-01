const Notifications = require('../models/notifications/Notifications');
const UserNotifications = require('../models/notifications/UserNotifications');
const TaskStatus = require('../models/route/TaskStatus');

class NotificationService {
  // Get admin user IDs (you can modify this logic based on your admin identification)
  static async getAdminUserIds() {
    try {
      const db = require('../config/db');
      // Assuming admin users have a specific role or you can identify them somehow
      // For now, I'll return a default admin user ID (you should adjust this based on your user system)
      const result = await db.query(`
        SELECT DISTINCT u.UserId
        FROM Users u
        LEFT JOIN People p ON u.UserId = p.UserId
        WHERE (p.role = 'admin' OR p.role = 'Admin' OR u.UserId = 1) 
          AND u.deletedAt IS NULL
      `);
      
      return result.rows.map(row => row.UserId);
    } catch (error) {
      console.error('Error getting admin user IDs:', error);
      // Fallback to default admin user ID
      return [1];
    }
  }

  // Create notification and assign to users
  static async createAndAssign(notificationData, userIds = null, assignToAll = false) {
    try {
      // Create the notification
      const notification = await Notifications.create(
        notificationData.notificationTypeId,
        notificationData.title,
        notificationData.message,
        notificationData.entityType,
        notificationData.entityId,
        notificationData.priority || 'normal',
        notificationData.expiresAt,
        notificationData.createdBy,
        notificationData.createdBy
      );

      // Get admin user IDs
      const adminUserIds = await this.getAdminUserIds();

      // Prepare final user IDs list
      let finalUserIds = [];
      
      if (assignToAll) {
        // If assigning to all, get all users and ensure admins are included
        const allUsers = await UserNotifications.assignToAllUsers(notification.notificationId);
        finalUserIds = allUsers.map(user => user.userId);
      } else if (userIds && userIds.length > 0) {
        // Combine specific users with admin users, removing duplicates
        const combinedUserIds = [...new Set([...userIds, ...adminUserIds])];
        await UserNotifications.assignToUsers(notification.notificationId, combinedUserIds);
        finalUserIds = combinedUserIds;
      } else {
        // If no specific users, assign only to admins
        await UserNotifications.assignToUsers(notification.notificationId, adminUserIds);
        finalUserIds = adminUserIds;
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Ticket status update notification
  static async notifyTicketStatusUpdate(ticketId, ticketCode, oldStatus, newStatus, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('ticket_status_update');
      if (!notificationType) return null;

      const title = `Ticket Status Updated`;
      const message = `Ticket ${ticketCode} status changed from ${oldStatus} to ${newStatus}`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'ticket',
        entityId: ticketId,
        priority: 'normal',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating ticket status update notification:', error);
    }
  }

  // Ticket completed notification
  static async notifyTicketCompleted(ticketId, ticketCode, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('ticket_completed');
      if (!notificationType) return null;

      const title = `Ticket Completed`;
      const message = `Ticket ${ticketCode} has been marked as completed`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'ticket',
        entityId: ticketId,
        priority: 'high',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating ticket completed notification:', error);
    }
  }

  // New incident notification
  static async notifyNewIncident(incidentId, incidentName, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('new_incident');
      if (!notificationType) return null;

      const title = `New Incident Created`;
      const message = `New incident "${incidentName}" has been created`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'incident',
        entityId: incidentId,
        priority: 'high',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating new incident notification:', error);
    }
  }

  // Permit expiring notification
  static async notifyPermitExpiring(permitId, permitNumber, daysUntilExpiry, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('permit_expiring');
      if (!notificationType) return null;

      const title = `Permit Expiring Soon`;
      const message = `Permit ${permitNumber} expires in ${daysUntilExpiry} days`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'permit',
        entityId: permitId,
        priority: 'urgent',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating permit expiring notification:', error);
    }
  }

  // Photo uploaded notification
  static async notifyPhotoUploaded(ticketId, ticketCode, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('photo_uploaded');
      if (!notificationType) return null;

      const title = `Photo Evidence Uploaded`;
      const message = `New photo evidence uploaded for ticket ${ticketCode}`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'ticket',
        entityId: ticketId,
        priority: 'normal',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating photo uploaded notification:', error);
    }
  }

  // RTR uploaded notification
  static async notifyRTRUploaded(rtrId, fileName, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('rtr_uploaded');
      if (!notificationType) return null;

      const title = `RTR File Uploaded`;
      const message = `New RTR file "${fileName}" has been uploaded and processed`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'rtr',
        entityId: rtrId,
        priority: 'normal',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating RTR uploaded notification:', error);
    }
  }

  // Payment received notification
  static async notifyPaymentReceived(paymentId, paymentNumber, amount, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('payment_received');
      if (!notificationType) return null;

      const title = `Payment Received`;
      const message = `Payment ${paymentNumber} for $${amount} has been received`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'payment',
        entityId: paymentId,
        priority: 'high',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating payment received notification:', error);
    }
  }

  // Crew assigned notification
  static async notifyCrewAssigned(ticketId, ticketCode, crewType, createdBy, userIds = null) {
    try {
      const notificationType = await require('../models/notifications/NotificationTypes').findByName('crew_assigned');
      if (!notificationType) return null;

      const title = `Crew Assigned`;
      const message = `${crewType} crew has been assigned to ticket ${ticketCode}`;

      return await this.createAndAssign({
        notificationTypeId: notificationType.notificationTypeId,
        title,
        message,
        entityType: 'ticket',
        entityId: ticketId,
        priority: 'normal',
        createdBy
      }, userIds);
    } catch (error) {
      console.error('Error creating crew assigned notification:', error);
    }
  }

  // Check for expiring permits and create notifications
  static async checkExpiringPermits() {
    try {
      const db = require('../config/db');
      const result = await db.query(`
        SELECT p.PermitId, p.permitNumber, p.expireDate, 
               (p.expireDate::date - CURRENT_DATE::date) as days_until_expiry
        FROM Permits p
        WHERE p.deletedAt IS NULL 
          AND p.expireDate > CURRENT_DATE 
          AND NOT EXISTS (
            SELECT 1 FROM Notifications n 
            WHERE n.entityType = 'permit' 
              AND n.entityId = p.PermitId 
              AND n.createdAt > CURRENT_DATE - INTERVAL '1 day'
          )
      `);

      for (const permit of result.rows) {
        await this.notifyPermitExpiring(
          permit.PermitId,
          permit.permitNumber,
          permit.days_until_expiry,
          1 // Default admin user
        );
      }
    } catch (error) {
      console.error('Error checking expiring permits:', error);
    }
  }

  // Get users who should be notified for a specific ticket
  static async getTicketNotificationUsers(ticketId) {
    try {
      const db = require('../config/db');
      const result = await db.query(`
        SELECT DISTINCT u.UserId
        FROM Users u
        LEFT JOIN People p ON u.UserId = p.UserId
        LEFT JOIN CrewEmployees ce ON p.employeeId = ce.employeeId
        LEFT JOIN TicketStatus ts ON ce.crewId = ts.crewId
        WHERE ts.ticketId = $1 AND u.deletedAt IS NULL
      `, [ticketId]);

      return result.rows.map(row => row.UserId);
    } catch (error) {
      console.error('Error getting ticket notification users:', error);
      return [];
    }
  }
}

module.exports = NotificationService; 