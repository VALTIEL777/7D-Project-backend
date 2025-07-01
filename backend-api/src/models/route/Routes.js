const db = require('../../config/db');

class Routes {
  static async create(routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Routes(routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;',
      [routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(routeId) {
    const res = await db.query('SELECT * FROM Routes WHERE routeId = $1 AND deletedAt IS NULL;', [routeId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Routes WHERE deletedAt IS NULL ORDER BY createdAt DESC;');
    return res.rows;
  }

  static async update(routeId, routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, updatedBy) {
    const res = await db.query(
      'UPDATE Routes SET routeCode = $1, type = $2, startDate = $3, endDate = $4, encodedPolyline = $5, totalDistance = $6, totalDuration = $7, optimizedOrder = $8, optimizationMetadata = $9, updatedAt = CURRENT_TIMESTAMP, updatedBy = $10 WHERE routeId = $11 AND deletedAt IS NULL RETURNING *;',
      [routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, updatedBy, routeId]
    );
    return res.rows[0];
  }

  static async delete(routeId) {
    const res = await db.query('UPDATE Routes SET deletedAt = CURRENT_TIMESTAMP WHERE routeId = $1 AND deletedAt IS NULL RETURNING *;', [routeId]);
    return res.rows[0];
  }

  // Get route with optimized tickets
  static async findByIdWithOptimizedTickets(routeId) {
    const res = await db.query(`
      SELECT 
        r.*,
        rt.ticketId,
        rt.address,
        rt.queue,
        t.ticketCode,
        t.quantity,
        t.amountToPay
      FROM Routes r
      LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId
      LEFT JOIN Tickets t ON rt.ticketId = t.ticketId
      WHERE r.routeId = $1 AND r.deletedAt IS NULL
      ORDER BY rt.queue ASC
    `, [routeId]);
    
    if (res.rows.length === 0) return null;
    
    // Group the results
    const route = {
      ...res.rows[0],
      tickets: res.rows.filter(row => row.ticketId).map(row => ({
        ticketId: row.ticketId,
        ticketCode: row.ticketCode,
        address: row.address,
        queue: row.queue,
        quantity: row.quantity,
        amountToPay: row.amountToPay
      }))
    };
    
    return route;
  }
}

module.exports = Routes; 