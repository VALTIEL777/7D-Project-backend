const db = require('../../config/db');

class TicketAddresses {
  static async create(ticketId, addressId, ispartner, is7d, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO TicketAddresses(ticketId, addressId, ispartner, is7d, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [ticketId, addressId, ispartner, is7d, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(ticketId, addressId) {
    const res = await db.query(
      'SELECT * FROM TicketAddresses WHERE ticketId = $1 AND addressId = $2;',
      [ticketId, addressId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM TicketAddresses;');
    return res.rows;
  }

  static async update(ticketId, addressId, ispartner, is7d, updatedBy) {
    const res = await db.query(
      'UPDATE TicketAddresses SET ispartner = $1, is7d = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE ticketId = $4 AND addressId = $5 RETURNING *;',
      [ispartner, is7d, updatedBy, ticketId, addressId]
    );
    return res.rows[0];
  }

  static async delete(ticketId, addressId) {
    const res = await db.query(
      'UPDATE TicketAddresses SET deletedAt = CURRENT_TIMESTAMP WHERE ticketId = $1 AND addressId = $2 RETURNING *;',
      [ticketId, addressId]
    );
    return res.rows[0];
  }
}

module.exports = TicketAddresses; 