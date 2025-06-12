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
    const res = await db.query('SELECT * FROM Payments WHERE checkId = $1;', [checkId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Payments;');
    return res.rows;
  }

  static async update(checkId, paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy) {
    const res = await db.query(
      'UPDATE Payments SET paymentNumber = $1, datePaid = $2, amountPaid = $3, status = $4, paymentURL = $5, updatedAt = CURRENT_TIMESTAMP, updatedBy = $6 WHERE checkId = $7 RETURNING *;',
      [paymentNumber, datePaid, amountPaid, status, paymentURL, updatedBy, checkId]
    );
    return res.rows[0];
  }

  static async delete(checkId) {
    const res = await db.query('UPDATE Payments SET deletedAt = CURRENT_TIMESTAMP WHERE checkId = $1 RETURNING *;', [checkId]);
    return res.rows[0];
  }
}

module.exports = Payments; 