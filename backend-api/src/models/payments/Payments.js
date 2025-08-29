const db = require('../../config/db');

class Payments {
  static async create(paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Payments(paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *;',
      [paymentNumber, datePaid, amountPaid, status, paymentURL, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(checkId) {
    const res = await db.query('SELECT * FROM Payments WHERE checkId = $1 AND deletedAt IS NULL;', [checkId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Payments WHERE deletedAt IS NULL;');
    return res.rows;
  }

  // Find payment by payment number
  static async findByPaymentNumber(paymentNumber) {
    const res = await db.query('SELECT * FROM Payments WHERE paymentNumber = $1 AND deletedAt IS NULL;', [paymentNumber]);
    return res.rows[0];
  }

  static async update(checkId, paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy) {
    const res = await db.query(
      'UPDATE Payments SET paymentNumber = $1, datePaid = $2, amountPaid = $3, status = $4, paymentURL = $5, updatedAt = CURRENT_TIMESTAMP, updatedBy = $6 WHERE checkId = $7 AND deletedAt IS NULL RETURNING *;',
      [paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy, checkId]
    );
    return res.rows[0];
  }

  static async delete(checkId) {
    const res = await db.query('UPDATE Payments SET deletedAt = CURRENT_TIMESTAMP WHERE checkId = $1 AND deletedAt IS NULL RETURNING *;', [checkId]);
    return res.rows[0];
  }

  static async getPaymentInvoiceTicketInfo() {
    const query = `
      SELECT 
        p.paymentNumber,
        p.amountPaid,
        i.invoiceNumber,
        i.amountRequested,
        t.amountToPay,
        t.calculatedCost,
        t.ticketCode
      FROM Payments p
      LEFT JOIN Tickets t ON p.checkId = t.paymentId
      LEFT JOIN Invoices i ON t.ticketId = i.ticketId
      WHERE p.deletedAt IS NULL 
        AND (t.deletedAt IS NULL OR t.deletedAt IS NULL)
        AND (i.deletedAt IS NULL OR i.deletedAt IS NULL)
      ORDER BY p.checkId, t.ticketId, i.invoiceId;
    `;
    const res = await db.query(query);
    return res.rows;
  }
}

module.exports = Payments; 