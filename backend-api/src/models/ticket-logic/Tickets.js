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
    const result = await db.query(`
      SELECT 
        t.*,
        cu.name as contractUnitName,
        i.name as incidentName
      FROM Tickets t
      LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
      LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
      WHERE t.ticketId = $1 AND t.deletedAt IS NULL
    `, [ticketId]);
    return result.rows[0];
  }

  static async findByTicketCode(ticketCode) {
    const result = await db.query(`
      SELECT 
        t.*,
        cu.name as contractUnitName,
        i.name as incidentName
      FROM Tickets t
      LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
      LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
      WHERE t.ticketCode = $1 AND t.deletedAt IS NULL
    `, [ticketCode]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query(`
      SELECT 
        t.*,
        cu.name as contractUnitName,
        i.name as incidentName
      FROM Tickets t
      LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
      LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
      WHERE t.deletedAt IS NULL
      ORDER BY t.ticketId ASC
    `);
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

  // Find ticket by code (alias for findByTicketCode)
  static async findByCode(ticketCode) {
    return this.findByTicketCode(ticketCode);
  }

  // Update contract number for a ticket
  static async updateContractNumber(ticketId, contractNumber) {
    const result = await db.query(
      'UPDATE Tickets SET contractNumber = $1, updatedAt = CURRENT_TIMESTAMP WHERE ticketId = $2 AND deletedAt IS NULL RETURNING *',
      [contractNumber, ticketId]
    );
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
        (p.expireDate::date - CURRENT_DATE::date) as days_until_expiry,
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
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
      LEFT JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND p.expireDate IS NOT NULL
        AND p.expireDate > CURRENT_DATE
        AND p.expireDate <= CURRENT_DATE + INTERVAL '${days} days'
        AND (t.comment7d IS NULL OR t.comment7d NOT IN ('TK - COMPLETED', 'TK - COMPLETE', 'COMPLETED', 'COMPLETE'))
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
        (p.expireDate::date - CURRENT_DATE::date) as days_until_expiry,
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
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
      LEFT JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND p.expireDate IS NOT NULL
        AND p.expireDate > CURRENT_DATE + INTERVAL '${days} days'
        AND (t.comment7d IS NULL OR t.comment7d NOT IN ('TK - COMPLETED', 'TK - COMPLETE', 'COMPLETED', 'COMPLETE'))
      GROUP BY t.ticketId, t.ticketCode, t.contractNumber, t.amountToPay, t.ticketType, t.daysOutstanding, t.comment7d, p.expireDate
      ORDER BY p.expireDate ASC
    `);
    return result.rows;
  }

  // Find expired tickets (tickets where expire date has passed or daysOutstanding is 0)
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
        p.expireDate,
        (CURRENT_DATE::date - p.expireDate::date) as days_expired,
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
      LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
      LEFT JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
      LEFT JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId AND ts.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND (
          -- Tickets with expired permits (expire date has passed)
          (p.expireDate IS NOT NULL AND p.expireDate < CURRENT_DATE)
          OR 
          -- Tickets with daysOutstanding = 0
          t.daysOutstanding = 0
        )
        AND (t.comment7d IS NULL OR t.comment7d NOT IN ('TK - COMPLETED', 'TK - COMPLETE', 'COMPLETED', 'COMPLETE'))
      GROUP BY t.ticketId, t.ticketCode, t.contractNumber, t.amountToPay, t.ticketType, t.daysOutstanding, t.comment7d, p.expireDate
      ORDER BY p.expireDate ASC, t.ticketId ASC
    `);
    return result.rows;
  }

  // Get ticket information by ticketCode with full address and statuses
  static async getTicketWithAddressAndStatuses(ticketCode) {
    const result = await db.query(`
      SELECT 
        t.ticketId,
        t.ticketCode,
        t.quantity,
        t.daysOutstanding,
        t.comment7d,
        t.PartnerComment,
        t.PartnerSupervisorComment,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        t.createdAt,
        t.updatedAt,
        -- Full address construction
        CONCAT(
          COALESCE(a.addressNumber, ''), ' ',
          COALESCE(a.addressCardinal, ''), ' ',
          COALESCE(a.addressStreet, ''), ' ',
          COALESCE(a.addressSuffix, '')
        ) as fullAddress,
        -- Individual address components
        a.addressNumber,
        a.addressCardinal,
        a.addressStreet,
        a.addressSuffix,
        -- Task statuses as JSON array
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'taskStatusId', ts.taskStatusId,
              'name', ts.name,
              'description', ts.description,
              'startingDate', tks.startingDate,
              'endingDate', tks.endingDate,
              'observation', tks.observation,
              'crewId', tks.crewId
            )
          ) FILTER (WHERE ts.taskStatusId IS NOT NULL),
          '[]'::json
        ) as taskStatuses
      FROM Tickets t
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId
      LEFT JOIN Addresses a ON ta.addressId = a.addressId
      LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId
      LEFT JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId
      WHERE t.ticketCode = $1 AND t.deletedAt IS NULL
      GROUP BY 
        t.ticketId, t.ticketCode, t.quantity, t.daysOutstanding, t.comment7d,
        t.PartnerComment, t.PartnerSupervisorComment, t.contractNumber,
        t.amountToPay, t.ticketType, t.createdAt, t.updatedAt,
        a.addressNumber, a.addressCardinal, a.addressStreet, a.addressSuffix
    `, [ticketCode]);
    
    return result.rows[0];
  }

  // Find tickets with issues (specific comment7d values) and their crew comments
  static async findTicketsWithIssues() {
    const result = await db.query(`
      SELECT 
        t.ticketId,
        t.ticketCode,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        t.daysOutstanding,
        t.comment7d,
        t.quantity,
        t.createdAt,
        t.updatedAt,
        -- Contract Unit information
        cu.name as contractUnitName,
        -- Incident information
        i.name as incidentName,
        -- Addresses
        STRING_AGG(
          CONCAT(
            a.addressNumber, ' ', 
            COALESCE(a.addressCardinal, ''), ' ', 
            a.addressStreet, ' ', 
            COALESCE(a.addressSuffix, '')
          ), 
          ', '
        ) as addresses,
        -- Task statuses with crew comments as JSON array
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'taskStatusId', ts.taskStatusId,
              'name', ts.name,
              'description', ts.description,
              'startingDate', tks.startingDate,
              'endingDate', tks.endingDate,
              'crewComment', tks.observation,
              'crewId', tks.crewId
            )
          ) FILTER (WHERE ts.taskStatusId IS NOT NULL),
          '[]'::json
        ) as taskStatuses,
        -- Count of task statuses
        COUNT(ts.taskStatusId) as taskStatusCount
      FROM Tickets t
      LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
      LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
      LEFT JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId AND ts.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND t.comment7d IN ('TK - ON HOLD OFF', 'TK - WILL BE SCHEDULE', 'TK - NEEDS PERMIT EXTENSION')
      GROUP BY 
        t.ticketId, t.ticketCode, t.contractNumber, t.amountToPay, t.ticketType, 
        t.daysOutstanding, t.comment7d, t.quantity, t.createdAt, t.updatedAt,
        cu.name, i.name
      ORDER BY t.ticketId ASC
    `);
    return result.rows;
  }

  // Find tickets with issues (specific comment7d values) - NO aggregation
  static async findTicketsWithIssuesSimple() {
    const result = await db.query(`
      SELECT DISTINCT
        t.ticketId,
        t.ticketCode,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        t.daysOutstanding,
        t.comment7d,
        t.quantity,
        t.createdAt,
        t.updatedAt,
        cu.name as contractUnitName,
        i.name as incidentName
      FROM Tickets t
      LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
      LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
      INNER JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
      WHERE t.deletedAt IS NULL 
        AND t.comment7d IN ('TK - ON HOLD OFF', 'TK - WILL BE SCHEDULE', 'TK - NEEDS PERMIT EXTENSION')
        AND tks.observation IS NOT NULL 
        AND tks.observation != ''
        AND tks.observation != ' '
      ORDER BY t.ticketId ASC
    `);
    return result.rows;
  }

  // Get addresses for a list of ticket IDs
  static async getAddressesForTickets(ticketIds) {
    if (!ticketIds.length) return [];
    const result = await db.query(`
      SELECT 
        ta.ticketId,
        a.addressId,
        a.addressNumber,
        a.addressCardinal,
        a.addressStreet,
        a.addressSuffix,
        a.latitude,
        a.longitude,
        a.placeid,
        CONCAT(
          COALESCE(a.addressNumber, ''), ' ',
          COALESCE(a.addressCardinal, ''), ' ',
          COALESCE(a.addressStreet, ''), ' ',
          COALESCE(a.addressSuffix, '')
        ) as fullAddress
      FROM TicketAddresses ta
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      WHERE ta.ticketId = ANY($1::int[])
        AND ta.deletedAt IS NULL
    `, [ticketIds]);
    return result.rows;
  }

  // Get task statuses for a list of ticket IDs
  static async getTaskStatusesForTickets(ticketIds) {
    if (!ticketIds.length) return [];
    const result = await db.query(`
      SELECT 
        tks.ticketId,
        tks.taskStatusId,
        ts.name,
        ts.description,
        tks.startingDate,
        tks.endingDate,
        tks.observation as crewComment,
        tks.crewId
      FROM TicketStatus tks
      LEFT JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId AND ts.deletedAt IS NULL
      WHERE tks.ticketId = ANY($1::int[])
        AND tks.deletedAt IS NULL
        AND tks.observation IS NOT NULL 
        AND tks.observation != ''
        AND tks.observation != ' '
    `, [ticketIds]);
    return result.rows;
  }

  // Get ticket coordinates by ticket code
  static async getTicketCoordinates(ticketCode) {
    const result = await db.query(`
      SELECT 
        t.ticketId,
        t.ticketCode,
        t.contractNumber,
        t.amountToPay,
        t.ticketType,
        -- Address coordinates
        a.addressId,
        a.addressNumber,
        a.addressCardinal,
        a.addressStreet,
        a.addressSuffix,
        a.latitude,
        a.longitude,
        a.placeid,
        -- Full address construction
        CONCAT(
          COALESCE(a.addressNumber, ''), ' ',
          COALESCE(a.addressCardinal, ''), ' ',
          COALESCE(a.addressStreet, ''), ' ',
          COALESCE(a.addressSuffix, '')
        ) as fullAddress
      FROM Tickets t
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      WHERE t.ticketCode = $1 AND t.deletedAt IS NULL
      ORDER BY a.addressId
    `, [ticketCode]);
    
    return result.rows;
  }

  // Get ticket information with related payment and invoice data
  static async getTicketPaymentInvoiceInfo() {
    const result = await db.query(`
      SELECT 
        t.ticketCode,
        t.amountToPay,
        t.calculatedCost,
        i.invoiceNumber,
        i.amountRequested,
        p.amountPaid,
        p.status as statusPaid
      FROM Tickets t
      LEFT JOIN Invoices i ON t.ticketId = i.ticketId AND i.deletedAt IS NULL
      LEFT JOIN Payments p ON t.paymentId = p.checkId AND p.deletedAt IS NULL
      WHERE t.deletedAt IS NULL
      ORDER BY t.ticketId ASC
    `);
    return result.rows;
  }
}

module.exports = Tickets; 