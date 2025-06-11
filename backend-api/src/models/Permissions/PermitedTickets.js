const db = require('../config/db');

class PermitedTickets {
  static async create(permitId, ticketId, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO PermitedTickets(permitId, ticketId, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [permitId, ticketId, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(permitId, ticketId) {
    const res = await db.query(
      'SELECT * FROM PermitedTickets WHERE permitId = $1 AND ticketId = $2;',
      [permitId, ticketId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM PermitedTickets;');
    return res.rows;
  }

  static async update(permitId, ticketId, updatedBy) {
    const res = await db.query(
      'UPDATE PermitedTickets SET updatedAt = CURRENT_TIMESTAMP, updatedBy = $1 WHERE permitId = $2 AND ticketId = $3 RETURNING *;',
      [updatedBy, permitId, ticketId]
    );
    return res.rows[0];
  }

  static async delete(permitId, ticketId) {
    const res = await db.query(
      'UPDATE PermitedTickets SET deletedAt = CURRENT_TIMESTAMP WHERE permitId = $1 AND ticketId = $2 RETURNING *;',
      [permitId, ticketId]
    );
    return res.rows[0];
  }
}

module.exports = PermitedTickets; 