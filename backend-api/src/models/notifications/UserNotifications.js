const db = require('../../config/db');

class UserNotifications {
  static async create(userId, notificationId) {
    const res = await db.query(
      'INSERT INTO UserNotifications(userId, notificationId) VALUES($1, $2) RETURNING *;',
      [userId, notificationId]
    );
    return res.rows[0];
  }

  static async findByUser(userId, limit = 50, offset = 0, unreadOnly = false) {
    let query = `
      SELECT un.*, n.*, nt.name as typeName, nt.icon, nt.color 
      FROM UserNotifications un
      JOIN Notifications n ON un.notificationId = n.notificationId
      JOIN NotificationTypes nt ON n.notificationTypeId = nt.notificationTypeId
      WHERE un.userId = $1 AND un.deletedAt IS NULL AND n.deletedAt IS NULL
    `;
    
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND un.isRead = false';
    }
    
    query += ' ORDER BY n.createdAt DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const res = await db.query(query, params);
    return res.rows;
  }

  static async getUnreadCount(userId) {
    const res = await db.query(`
      SELECT COUNT(*) as count
      FROM UserNotifications un
      JOIN Notifications n ON un.notificationId = n.notificationId
      WHERE un.userId = $1 AND un.isRead = false AND un.deletedAt IS NULL AND n.deletedAt IS NULL
    `, [userId]);
    return parseInt(res.rows[0].count);
  }

  static async markAsRead(userId, notificationId) {
    const res = await db.query(
      'UPDATE UserNotifications SET isRead = true, readAt = CURRENT_TIMESTAMP WHERE userId = $1 AND notificationId = $2 RETURNING *;',
      [userId, notificationId]
    );
    return res.rows[0];
  }

  static async markAllAsRead(userId) {
    const res = await db.query(
      'UPDATE UserNotifications SET isRead = true, readAt = CURRENT_TIMESTAMP WHERE userId = $1 AND isRead = false RETURNING *;',
      [userId]
    );
    return res.rows;
  }

  static async delete(userId, notificationId) {
    const res = await db.query(
      'UPDATE UserNotifications SET deletedAt = CURRENT_TIMESTAMP WHERE userId = $1 AND notificationId = $2 RETURNING *;',
      [userId, notificationId]
    );
    return res.rows[0];
  }

  // Assign notification to multiple users
  static async assignToUsers(notificationId, userIds) {
    const values = userIds.map((userId, index) => `($${index + 2}, $1)`).join(', ');
    const params = [notificationId, ...userIds];
    
    const res = await db.query(
      `INSERT INTO UserNotifications(userId, notificationId) VALUES ${values} RETURNING *;`,
      params
    );
    return res.rows;
  }

  // Assign notification to all users (for system-wide notifications)
  static async assignToAllUsers(notificationId) {
    const res = await db.query(`
      INSERT INTO UserNotifications(userId, notificationId)
      SELECT UserId, $1 FROM Users WHERE deletedAt IS NULL
      ON CONFLICT (userId, notificationId) DO NOTHING
      RETURNING *;
    `, [notificationId]);
    return res.rows;
  }
}

module.exports = UserNotifications; 