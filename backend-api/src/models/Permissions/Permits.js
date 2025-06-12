const db = require('../../config/db');

class Permits {
  static async create(permitNumber, status, startDate, expireDate, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Permits(permitNumber, status, startDate, expireDate, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [permitNumber, status, startDate, expireDate, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(PermitId) {
    const res = await db.query('SELECT * FROM Permits WHERE PermitId = $1;', [PermitId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Permits;');
    return res.rows;
  }

  static async update(PermitId, permitNumber, status, startDate, expireDate, updatedBy) {
    const res = await db.query(
      'UPDATE Permits SET permitNumber = $1, status = $2, startDate = $3, expireDate = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE PermitId = $6 RETURNING *;',
      [permitNumber, status, startDate, expireDate, updatedBy, PermitId]
    );
    return res.rows[0];
  }

  static async delete(PermitId) {
    const res = await db.query('UPDATE Permits SET deletedAt = CURRENT_TIMESTAMP WHERE PermitId = $1 RETURNING *;', [PermitId]);
    return res.rows[0];
  }
}

module.exports = Permits; 