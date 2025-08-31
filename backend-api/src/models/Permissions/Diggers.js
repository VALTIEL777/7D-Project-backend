const db = require('../../config/db');

class Diggers {
  static async create(permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Diggers(permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [permitId, diggerNumber, status, startDate, expireDate, watchnProtect, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(diggerId) {
    const res = await db.query('SELECT * FROM Diggers WHERE diggerId = $1 AND deletedAt IS NULL;', [diggerId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Diggers WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(diggerId, permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy) {
    const res = await db.query(
      'UPDATE Diggers SET permitId = $1, diggerNumber = $2, status = $3, startDate = $4, expireDate = $5, watchnProtect = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7 WHERE diggerId = $8 AND deletedAt IS NULL RETURNING *;',
      [permitId, diggerNumber, status, startDate, expireDate, watchnProtect, updatedBy, diggerId]
    );
    return res.rows[0];
  }

  static async delete(diggerId) {
    const res = await db.query('UPDATE Diggers SET deletedAt = CURRENT_TIMESTAMP WHERE diggerId = $1 AND deletedAt IS NULL RETURNING *;', [diggerId]);
    return res.rows[0];
  }

  static async updateWatchnProtect(diggerId, watchnProtect, updatedBy) {
    const result = await db.query(
      'UPDATE Diggers SET watchnProtect = $1, updatedBy = $2, updatedAt = CURRENT_TIMESTAMP WHERE diggerId = $3 AND deletedAt IS NULL RETURNING *',
      [watchnProtect, updatedBy, diggerId]
    );
    return result.rows[0];
  }

  // Find digger by permit ID
  static async findByPermitId(permitId) {
    const res = await db.query('SELECT * FROM Diggers WHERE permitId = $1 AND deletedAt IS NULL;', [permitId]);
    return res.rows[0];
  }

  // Find or create a digger record for a permit
  static async findOrCreateByPermitId(permitId, createdBy, updatedBy) {
    // First try to find existing digger
    let digger = await this.findByPermitId(permitId);
    
    if (!digger) {
      // Create a new digger record with default values
      const defaultValues = {
        diggerNumber: `DGR-${permitId}`,
        status: 'ACTIVE',
        startDate: new Date().toISOString().split('T')[0], // Today's date
        expireDate: null, // No expiration date set
        watchnProtect: false // Default to false
      };
      
      console.log(`Creating new digger for permitId: ${permitId}`, {
        permitId,
        diggerNumber: defaultValues.diggerNumber,
        status: defaultValues.status,
        startDate: defaultValues.startDate,
        expireDate: defaultValues.expireDate,
        watchnProtect: defaultValues.watchnProtect,
        createdBy,
        updatedBy
      });
      
      digger = await this.create(
        permitId,
        defaultValues.diggerNumber,
        defaultValues.status,
        defaultValues.startDate,
        defaultValues.expireDate,
        defaultValues.watchnProtect,
        createdBy,
        updatedBy
      );
      
      console.log(`Created digger:`, digger);
    }
    
    return digger;
  }

  // Find digger by ticket ID through the permit chain
  static async findByTicketId(ticketId) {
    const result = await db.query(`
      SELECT 
        d.diggerId,
        d.diggerNumber,
        d.status,
        d.startDate,
        d.expireDate,
        d.watchnProtect,
        d.permitId,
        d.createdAt,
        d.updatedAt,
        p.permitNumber,
        p.status as permitStatus
      FROM Diggers d
      JOIN Permits p ON d.permitId = p.PermitId
      JOIN PermitedTickets pt ON p.PermitId = pt.permitId
      WHERE pt.ticketId = $1 
        AND d.deletedAt IS NULL 
        AND p.deletedAt IS NULL 
        AND pt.deletedAt IS NULL
      LIMIT 1
    `, [ticketId]);
    
    return result.rows[0];
  }

  // Find orphaned digger records (diggers without proper permit associations)
  static async findOrphanedDiggers() {
    const result = await db.query(`
      SELECT 
        d.diggerId,
        d.diggerNumber,
        d.status,
        d.startDate,
        d.expireDate,
        d.watchnProtect,
        d.permitId,
        d.createdAt,
        d.updatedAt
      FROM Diggers d
      LEFT JOIN Permits p ON d.permitId = p.PermitId
      WHERE d.deletedAt IS NULL 
        AND (p.PermitId IS NULL OR p.deletedAt IS NOT NULL)
    `);
    
    return result.rows;
  }

  // Fix orphaned digger by linking it to the correct permit for a ticket
  static async fixOrphanedDigger(diggerId, permitId, updatedBy) {
    const result = await db.query(
      'UPDATE Diggers SET permitId = $1, updatedBy = $2, updatedAt = CURRENT_TIMESTAMP WHERE diggerId = $3 AND deletedAt IS NULL RETURNING *',
      [permitId, updatedBy, diggerId]
    );
    return result.rows[0];
  }
}

module.exports = Diggers; 