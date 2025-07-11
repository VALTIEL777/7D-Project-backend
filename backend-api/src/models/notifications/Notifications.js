const db = require('../../config/db');
const NotificationTypes = require('./NotificationTypes');

class Notifications {
  static async create(notificationTypeId, title, message, entityType, entityId, priority, expiresAt, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Notifications(notificationTypeId, title, message, entityType, entityId, priority, expiresAt, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;',
      [notificationTypeId, title, message, entityType, entityId, priority, expiresAt, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(notificationId) {
    const res = await db.query(`
      SELECT n.*, nt.name as typeName, nt.icon, nt.color 
      FROM Notifications n 
      JOIN NotificationTypes nt ON n.notificationTypeId = nt.notificationTypeId 
      WHERE n.notificationId = $1 AND n.deletedAt IS NULL;
    `, [notificationId]);
    return res.rows[0];
  }

  static async findAll(limit = 50, offset = 0) {
    const res = await db.query(`
      SELECT n.*, nt.name as typeName, nt.icon, nt.color 
      FROM Notifications n 
      JOIN NotificationTypes nt ON n.notificationTypeId = nt.notificationTypeId 
      WHERE n.deletedAt IS NULL 
      ORDER BY n.createdAt DESC 
      LIMIT $1 OFFSET $2;
    `, [limit, offset]);
    return res.rows;
  }

  static async findByEntity(entityType, entityId) {
    const res = await db.query(`
      SELECT n.*, nt.name as typeName, nt.icon, nt.color 
      FROM Notifications n 
      JOIN NotificationTypes nt ON n.notificationTypeId = nt.notificationTypeId 
      WHERE n.entityType = $1 AND n.entityId = $2 AND n.deletedAt IS NULL 
      ORDER BY n.createdAt DESC;
    `, [entityType, entityId]);
    return res.rows;
  }

  static async update(notificationId, title, message, priority, expiresAt, updatedBy) {
    const res = await db.query(
      'UPDATE Notifications SET title = $1, message = $2, priority = $3, expiresAt = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE notificationId = $6 RETURNING *;',
      [title, message, priority, expiresAt, updatedBy, notificationId]
    );
    return res.rows[0];
  }

  static async delete(notificationId) {
    const res = await db.query('UPDATE Notifications SET deletedAt = CURRENT_TIMESTAMP WHERE notificationId = $1 RETURNING *;', [notificationId]);
    return res.rows[0];
  }

  // Helper methods for creating specific types of notifications
  static async createTicketStatusUpdate(ticketId, ticketCode, oldStatus, newStatus, createdBy) {
    const notificationType = await NotificationTypes.findByName('ticket_status_update');
    if (!notificationType) return null;

    const title = `Ticket Status Updated`;
    const message = `Ticket ${ticketCode} status changed from ${oldStatus} to ${newStatus}`;
    
    return await this.create(
      notificationType.notificationTypeId,
      title,
      message,
      'ticket',
      ticketId,
      'normal',
      null,
      createdBy,
      createdBy
    );
  }

  static async createTicketCompleted(ticketId, ticketCode, createdBy) {
    const notificationType = await NotificationTypes.findByName('ticket_completed');
    if (!notificationType) return null;

    const title = `Ticket Completed`;
    const message = `Ticket ${ticketCode} has been marked as completed`;
    
    return await this.create(
      notificationType.notificationTypeId,
      title,
      message,
      'ticket',
      ticketId,
      'high',
      null,
      createdBy,
      createdBy
    );
  }

  static async createNewIncident(incidentId, incidentName, createdBy) {
    const notificationType = await NotificationTypes.findByName('new_incident');
    if (!notificationType) return null;

    const title = `New Incident Created`;
    const message = `New incident "${incidentName}" has been created`;
    
    return await this.create(
      notificationType.notificationTypeId,
      title,
      message,
      'incident',
      incidentId,
      'high',
      null,
      createdBy,
      createdBy
    );
  }

  static async createPermitExpiring(permitId, permitNumber, daysUntilExpiry, createdBy) {
    const notificationType = await NotificationTypes.findByName('permit_expiring');
    if (!notificationType) return null;

    const title = `Permit Expiring Soon`;
    const message = `Permit ${permitNumber} expires in ${daysUntilExpiry} days`;
    
    return await this.create(
      notificationType.notificationTypeId,
      title,
      message,
      'permit',
      permitId,
      'urgent',
      null,
      createdBy,
      createdBy
    );
  }

  static async createPhotoUploaded(ticketId, ticketCode, createdBy) {
    const notificationType = await NotificationTypes.findByName('photo_uploaded');
    if (!notificationType) return null;

    const title = `Photo Evidence Uploaded`;
    const message = `New photo evidence uploaded for ticket ${ticketCode}`;
    
    return await this.create(
      notificationType.notificationTypeId,
      title,
      message,
      'ticket',
      ticketId,
      'normal',
      null,
      createdBy,
      createdBy
    );
  }

  static async createRTRUploaded(rtrId, fileName, createdBy) {
    const notificationType = await NotificationTypes.findByName('rtr_uploaded');
    if (!notificationType) return null;

    const title = `RTR File Uploaded`;
    const message = `New RTR file "${fileName}" has been uploaded and processed`;
    
    return await this.create(
      notificationType.notificationTypeId,
      title,
      message,
      'rtr',
      rtrId,
      'normal',
      null,
      createdBy,
      createdBy
    );
  }
}

module.exports = Notifications; 