const db = require('../../config/db');

class Tickets {
  static async create(incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy) {
    const result = await db.query(
      'INSERT INTO Tickets (incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PartnerComment, PartnerSupervisorComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *',
      [incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, PeopleGasComment, contractNumber, amountToPay, ticketType, createdBy, updatedBy]
    );
    return result.rows[0];
  }

  static async findById(ticketId) {
    const result = await db.query('SELECT * FROM Tickets WHERE ticketId = $1 AND deletedAt IS NULL', [ticketId]);
    return result.rows[0];
  }

  static async findByTicketCode(ticketCode) {
    const result = await db.query('SELECT * FROM Tickets WHERE ticketCode = $1 AND deletedAt IS NULL', [ticketCode]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query('SELECT * FROM Tickets WHERE deletedAt IS NULL');
    return result.rows;
  }

  static async update(ticketId, incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, contractNumber, amountToPay, ticketType, updatedBy) {
    const result = await db.query(
      'UPDATE Tickets SET incidentId = $1, cuadranteId = $2, contractUnitId = $3, wayfindingId = $4, paymentId = $5, mobilizationId = $6, ticketCode = $7, quantity = $8, daysOutstanding = $9, comment7d = $10, PartnerComment = $11, PartnerSupervisorComment = $12, contractNumber = $13, amountToPay = $14, ticketType = $15, updatedBy = $16 WHERE ticketId = $17 AND deletedAt IS NULL RETURNING *',
      [incidentId, cuadranteId, contractUnitId, wayfindingId, paymentId, mobilizationId, ticketCode, quantity, daysOutstanding, comment7d, PeopleGasComment, PeopleGasComment, contractNumber, amountToPay, ticketType, updatedBy, ticketId]
    );
    return result.rows[0];
  }

  static async delete(ticketId) {
    const result = await db.query('UPDATE Tickets SET deletedAt = CURRENT_TIMESTAMP WHERE ticketId = $1 AND deletedAt IS NULL RETURNING *', [ticketId]);
    return result.rows[0];
  }

  // Find tickets expiring in specific number of days
  static async findExpiringInDays(days) {
    const result = await db.query(`
      SELECT DISTINCT 
        t.ticketId,
        t.ticketCode,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        t.daysOutstanding,
        t.comment7d,
        p.expireDate,
        EXTRACT(DAY FROM (p.expireDate::date - CURRENT_DATE::date)) as days_until_expiry,
        STRING_AGG(
          CONCAT(
            a.addressNumber, ' ', 
            COALESCE(a.addressCardinal, ''), ' ', 
            a.addressStreet, ' ', 
            COALESCE(a.addressSuffix, '')
          ), 
          ', '
        ) as addresses
      FROM Tickets t
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId
      LEFT JOIN Permits p ON pt.permitId = p.PermitId
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId
      LEFT JOIN Addresses a ON ta.addressId = a.addressId
      WHERE t.deletedAt IS NULL 
        AND p.expireDate IS NOT NULL
        AND p.expireDate > CURRENT_DATE
        AND p.expireDate <= CURRENT_DATE + INTERVAL '${days} days'
      GROUP BY t.ticketId, t.ticketCode, t.contractNumber, t.amountToPay, t.ticketType, t.daysOutstanding, t.comment7d, p.expireDate
      ORDER BY p.expireDate ASC
    `);
    return result.rows;
  }

  // Find tickets expiring after specific number of days
  static async findExpiringAfterDays(days) {
    const result = await db.query(`
      SELECT DISTINCT 
        t.ticketId,
        t.ticketCode,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        t.daysOutstanding,
        t.comment7d,
        p.expireDate,
        EXTRACT(DAY FROM (p.expireDate::date - CURRENT_DATE::date)) as days_until_expiry,
        STRING_AGG(
          CONCAT(
            a.addressNumber, ' ', 
            COALESCE(a.addressCardinal, ''), ' ', 
            a.addressStreet, ' ', 
            COALESCE(a.addressSuffix, '')
          ), 
          ', '
        ) as addresses
      FROM Tickets t
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId
      LEFT JOIN Permits p ON pt.permitId = p.PermitId
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId
      LEFT JOIN Addresses a ON ta.addressId = a.addressId
      WHERE t.deletedAt IS NULL 
        AND p.expireDate IS NOT NULL
        AND p.expireDate > CURRENT_DATE + INTERVAL '${days} days'
      GROUP BY t.ticketId, t.ticketCode, t.contractNumber, t.amountToPay, t.ticketType, t.daysOutstanding, t.comment7d, p.expireDate
      ORDER BY p.expireDate ASC
    `);
    return result.rows;
  }

  // Find expired tickets (tickets that are not completed)
  static async findExpired() {
    const result = await db.query(`
      SELECT DISTINCT 
        t.ticketId,
        t.ticketCode,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        t.daysOutstanding,
        t.comment7d,
        STRING_AGG(
          CONCAT(
            a.addressNumber, ' ', 
            COALESCE(a.addressCardinal, ''), ' ', 
            a.addressStreet, ' ', 
            COALESCE(a.addressSuffix, '')
          ), 
          ', '
        ) as addresses,
        STRING_AGG(DISTINCT ts.name, ', ') as taskStatusNames
      FROM Tickets t
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId
      LEFT JOIN Addresses a ON ta.addressId = a.addressId
      LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId
      LEFT JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId
      WHERE t.deletedAt IS NULL 
        AND NOT EXISTS (
          SELECT 1 FROM TicketStatus tks2 
          JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
          WHERE tks2.ticketId = t.ticketId 
            AND ts2.name = 'TK - COMPLETED'
        )
      GROUP BY t.ticketId, t.ticketCode, t.contractNumber, t.amountToPay, t.ticketType, t.daysOutstanding, t.comment7d
      ORDER BY t.ticketId ASC
    `);
    return result.rows;
  }
}

module.exports = Tickets; 