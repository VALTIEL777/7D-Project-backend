const db = require('../../config/db');

class Diggers {
  static async create(permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Diggers(permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(diggerId) {
    const res = await db.query('SELECT * FROM Diggers WHERE diggerId = $1 AND deletedAt IS NULL;', [diggerId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Diggers WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(diggerId, permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy) {
    const res = await db.query(
      'UPDATE Diggers SET permitId = $1, diggerNumber = $2, status = $3, startDate = $4, expireDate = $5, watchnProtect = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7 WHERE diggerId = $8 AND deletedAt IS NULL RETURNING *;',
      [permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy, diggerId]
    );
    return res.rows[0];
  }

  static async delete(diggerId) {
    const res = await db.query('UPDATE Diggers SET deletedAt = CURRENT_TIMESTAMP WHERE diggerId = $1 AND deletedAt IS NULL RETURNING *;', [diggerId]);
    return res.rows[0];
  }

  static async updateWatchnProtect(diggerId, watchnProtect, updatedBy) {
    const result = await db.query(
      'UPDATE Diggers SET watchnProtect = $1, updatedBy = $2, updatedAt = CURRENT_TIMESTAMP WHERE diggerId = $3 AND deletedAt IS NULL RETURNING *',
      [watchnProtect, updatedBy, diggerId]
    );
    return result.rows[0];
  }
}

module.exports = Diggers; 