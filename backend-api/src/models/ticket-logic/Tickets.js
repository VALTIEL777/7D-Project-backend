const db = require('../config/db');

class Tickets {
  static async create(incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Tickets(incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;',
      [incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(ticketId) {
    const res = await db.query('SELECT * FROM Tickets WHERE ticketId = $1;', [ticketId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Tickets;');
    return res.rows;
  }

  static async update(ticketId, incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, updatedBy) {
    const res = await db.query(
      'UPDATE Tickets SET incidentId = $1, cuadranteId = $2, contractUnitId = $3, wayfindingId = $4, paymentId = $5, mobilizationId = $6, ticketCode = $7, quantity = $8, daysOutstanding = $9, comment7d = $10, PeopleGasComment = $11, contractNumber = $12, amountToPay = $13, ticketType = $14, updatedAt = CURRENT_TIMESTAMP, updatedBy = $15 WHERE ticketId = $16 RETURNING *;',
      [incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, updatedBy, ticketId]
    );
    return res.rows[0];
  }

  static async delete(ticketId) {
    const res = await db.query('UPDATE Tickets SET deletedAt = CURRENT_TIMESTAMP WHERE ticketId = $1 RETURNING *;', [ticketId]);
    return res.rows[0];
  }
}

module.exports = Tickets; 