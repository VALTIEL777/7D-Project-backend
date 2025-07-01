const db = require('../../config/db');

class NotificationTypes {
  static async create(name, description, icon, color, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO NotificationTypes(name, description, icon, color, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [name, description, icon, color, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(notificationTypeId) {
    const res = await db.query('SELECT * FROM NotificationTypes WHERE notificationTypeId = $1;', [notificationTypeId]);
    return res.rows[0];
  }

  static async findByName(name) {
    const res = await db.query('SELECT * FROM NotificationTypes WHERE name = $1;', [name]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM NotificationTypes WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(notificationTypeId, name, description, icon, color, updatedBy) {
    const res = await db.query(
      'UPDATE NotificationTypes SET name = $1, description = $2, icon = $3, color = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE notificationTypeId = $6 RETURNING *;',
      [name, description, icon, color, updatedBy, notificationTypeId]
    );
    return res.rows[0];
  }

  static async delete(notificationTypeId) {
    const res = await db.query('UPDATE NotificationTypes SET deletedAt = CURRENT_TIMESTAMP WHERE notificationTypeId = $1 RETURNING *;', [notificationTypeId]);
    return res.rows[0];
  }
}

module.exports = NotificationTypes; 