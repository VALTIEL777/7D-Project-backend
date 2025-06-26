const db = require('../../config/db');

class Routes {
  static async create(routeCode, type, startDate, endDate, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Routes(routeCode, type, startDate, endDate, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [routeCode, type, startDate, endDate, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(routeId) {
    const res = await db.query('SELECT * FROM Routes WHERE routeId = $1 AND deletedAt IS NULL;', [routeId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Routes WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(routeId, routeCode, type, startDate, endDate, updatedBy) {
    const res = await db.query(
      'UPDATE Routes SET routeCode = $1, type = $2, startDate = $3, endDate = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE routeId = $6 AND deletedAt IS NULL RETURNING *;',
      [routeCode, type, startDate, endDate, updatedBy, routeId]
    );
    return res.rows[0];
  }

  static async delete(routeId) {
    const res = await db.query('UPDATE Routes SET deletedAt = CURRENT_TIMESTAMP WHERE routeId = $1 AND deletedAt IS NULL RETURNING *;', [routeId]);
    return res.rows[0];
  }
}

module.exports = Routes; 