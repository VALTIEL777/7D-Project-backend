const db = require('../../config/db');

class Invoices {
  static async create(ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Invoices(ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(invoiceId) {
    const res = await db.query('SELECT * FROM Invoices WHERE invoiceId = $1 AND deletedAt IS NULL;', [invoiceId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query(`
      SELECT i.*, t.ticketCode 
      FROM Invoices i
      LEFT JOIN Tickets t ON i.ticketId = t.ticketId AND t.deletedAt IS NULL
      WHERE i.deletedAt IS NULL
      ORDER BY i.invoiceId ASC;
    `);
    return res.rows;
  }

  static async update(invoiceId, ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, updatedBy) {
    const res = await db.query(
      'UPDATE Invoices SET ticketId = $1, invoiceNumber = $2, invoiceDateRequested = $3, amountRequested = $4, status = $5, invoiceURL = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7 WHERE invoiceId = $8 AND deletedAt IS NULL RETURNING *;',
      [ticketId, invoiceNumber, invoiceDateRequested, amountRequested, status, invoiceURL, updatedBy, invoiceId]
    );
    return res.rows[0];
  }

  static async delete(invoiceId) {
    const res = await db.query('UPDATE Invoices SET deletedAt = CURRENT_TIMESTAMP WHERE invoiceId = $1 AND deletedAt IS NULL RETURNING *;', [invoiceId]);
    return res.rows[0];
  }

  // Find invoice by ticket ID
  static async findByTicketId(ticketId) {
    const res = await db.query('SELECT * FROM Invoices WHERE ticketId = $1 AND deletedAt IS NULL;', [ticketId]);
    return res.rows[0];
  }
}

module.exports = Invoices; 