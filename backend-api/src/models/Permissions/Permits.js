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
    const res = await db.query('SELECT * FROM Permits WHERE PermitId = $1 AND deletedAt IS NULL;', [PermitId]);
    return res.rows[0];
  }

  static async findByPermitNumber(permitNumber) {
    const res = await db.query('SELECT * FROM Permits WHERE permitNumber = $1 AND deletedAt IS NULL;', [permitNumber]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Permits WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(PermitId, permitNumber, status, startDate, expireDate, updatedBy) {
    const res = await db.query(
      'UPDATE Permits SET permitNumber = $1, status = $2, startDate = $3, expireDate = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE PermitId = $6 AND deletedAt IS NULL RETURNING *;',
      [permitNumber, status, startDate, expireDate, updatedBy, PermitId]
    );
    return res.rows[0];
  }

  static async findPermitIdByTicketId(ticketId) {
    const res = await db.query(
      `SELECT p.PermitId 
       FROM Permits p
       JOIN PermitedTickets pt ON p.PermitId = pt.permitId
       WHERE pt.ticketId = $1 AND pt.deletedAt IS NULL AND p.deletedAt IS NULL
       ORDER BY p.createdAt DESC
       LIMIT 1`,
      [ticketId]
    );
    return res.rows[0] ? res.rows[0].permitid : null;
  }

  static async updateExpireDate(PermitId, expireDate, updatedBy) {
    const res = await db.query(
      'UPDATE Permits SET expireDate = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE PermitId = $3 AND deletedAt IS NULL RETURNING *;',
      [expireDate, updatedBy, PermitId]
    );
    return res.rows[0];
  }

  static async delete(PermitId) {
    const res = await db.query('UPDATE Permits SET deletedAt = CURRENT_TIMESTAMP WHERE PermitId = $1 AND deletedAt IS NULL RETURNING *;', [PermitId]);
    return res.rows[0];
  }
}

module.exports = Permits; 