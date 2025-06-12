const db = require('../../config/db');

class Fines {
  static async create(ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Fines(ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;',
      [ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(fineId) {
    const res = await db.query('SELECT * FROM Fines WHERE fineId = $1;', [fineId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Fines;');
    return res.rows;
  }

  static async update(fineId, ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, updatedBy) {
    const res = await db.query(
      'UPDATE Fines SET ticketId = $1, fineNumber = $2, fineDate = $3, paymentDate = $4, amount = $5, status = $6, fineURL = $7, updatedAt = CURRENT_TIMESTAMP, updatedBy = $8 WHERE fineId = $9 RETURNING *;',
      [ticketId, fineNumber, fineDate, paymentDate, amount, status, fineURL, updatedBy, fineId]
    );
    return res.rows[0];
  }

  static async delete(fineId) {
    const res = await db.query('UPDATE Fines SET deletedAt = CURRENT_TIMESTAMP WHERE fineId = $1 RETURNING *;', [fineId]);
    return res.rows[0];
  }
}

module.exports = Fines; 