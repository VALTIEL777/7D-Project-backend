const db = require('../../config/db');

class TaskStatus {
  static async create(name, description, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO TaskStatus(name, description, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [name, description, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(taskStatusId) {
    const res = await db.query('SELECT * FROM TaskStatus WHERE taskStatusId = $1 AND deletedAt IS NULL;', [taskStatusId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM TaskStatus WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(taskStatusId, name, description, updatedBy) {
    const res = await db.query(
      'UPDATE TaskStatus SET name = $1, description = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE taskStatusId = $4 AND deletedAt IS NULL RETURNING *;',
      [name, description, updatedBy, taskStatusId]
    );
    return res.rows[0];
  }

  static async delete(taskStatusId) {
    const res = await db.query('UPDATE TaskStatus SET deletedAt = CURRENT_TIMESTAMP WHERE taskStatusId = $1 AND deletedAt IS NULL RETURNING *;', [taskStatusId]);
    return res.rows[0];
  }
}

module.exports = TaskStatus; 