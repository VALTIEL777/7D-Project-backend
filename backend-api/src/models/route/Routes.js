const db = require('../../config/db');

class Routes {
  static async create(routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy) {
    // Convert JavaScript objects to JSON strings for PostgreSQL JSONB fields
    const optimizedOrderJson = optimizedOrder ? JSON.stringify(optimizedOrder) : null;
    const optimizationMetadataJson = optimizationMetadata ? JSON.stringify(optimizationMetadata) : null;
    
    const res = await db.query(
      'INSERT INTO Routes(routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;',
      [routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrderJson, optimizationMetadataJson, createdBy, updatedBy]
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

  static async findByType(type) {
    const res = await db.query('SELECT * FROM Routes WHERE type = $1 AND deletedAt IS NULL ORDER BY createdAt DESC;', [type]);
    return res.rows;
  }

  static async update(routeId, routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, updatedBy) {
    // Convert JavaScript objects to JSON strings for PostgreSQL JSONB fields
    const optimizedOrderJson = optimizedOrder ? JSON.stringify(optimizedOrder) : null;
    const optimizationMetadataJson = optimizationMetadata ? JSON.stringify(optimizationMetadata) : null;
    
    const res = await db.query(
      'UPDATE Routes SET routeCode = $1, type = $2, startDate = $3, endDate = $4, encodedPolyline = $5, totalDistance = $6, totalDuration = $7, optimizedOrder = $8, optimizationMetadata = $9, updatedAt = CURRENT_TIMESTAMP, updatedBy = $10 WHERE routeId = $11 AND deletedAt IS NULL RETURNING *;',
      [routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrderJson, optimizationMetadataJson, updatedBy, routeId]
    );
    return res.rows[0];
  }

  static async delete(routeId) {
    const res = await db.query('UPDATE Routes SET deletedAt = CURRENT_TIMESTAMP WHERE routeId = $1 AND deletedAt IS NULL RETURNING *;', [routeId]);
    return res.rows[0];
  }

  static async updateOptimization(routeId, encodedPolyline, totalDistance, totalDuration, optimizedOrder, updatedBy) {
    // Convert JavaScript objects to JSON strings for PostgreSQL JSONB fields
    const optimizedOrderJson = optimizedOrder ? JSON.stringify(optimizedOrder) : null;
    
    const res = await db.query(
      'UPDATE Routes SET encodedPolyline = $1, totalDistance = $2, totalDuration = $3, optimizedOrder = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE routeId = $6 AND deletedAt IS NULL RETURNING *;',
      [encodedPolyline, totalDistance, totalDuration, optimizedOrderJson, updatedBy, routeId]
    );
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

  // Get routes by type with their tickets and addresses, only active (endDate is null or empty)
  static async findByTypeWithTickets(type) {
    try {
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
        LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId AND rt.deletedAt IS NULL
        LEFT JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
        WHERE r.type = $1 AND r.deletedAt IS NULL
        ORDER BY r.createdAt DESC, rt.queue ASC
      `, [type]);
      
      if (res.rows.length === 0) return [];
      
      // Group routes with their tickets
      const routesMap = new Map();
      
      res.rows.forEach(row => {
        const routeId = row.routeid;
        
        if (!routesMap.has(routeId)) {
          // Parse JSONB fields safely
          let optimizedOrder = null;
          let optimizationMetadata = null;
          
          try {
            optimizedOrder = row.optimizedorder ? JSON.parse(row.optimizedorder) : null;
          } catch (e) {
            console.warn(`Failed to parse optimizedOrder for route ${routeId}:`, e.message);
          }
          
          try {
            optimizationMetadata = row.optimizationmetadata ? JSON.parse(row.optimizationmetadata) : null;
          } catch (e) {
            console.warn(`Failed to parse optimizationMetadata for route ${routeId}:`, e.message);
          }
          
          // Create route object without ticket-specific fields
          const route = {
            routeId: row.routeid,
            routeCode: row.routecode,
            type: row.type,
            startDate: row.startdate,
            endDate: row.enddate,
            encodedPolyline: row.encodedpolyline,
            totalDistance: row.totaldistance,
            totalDuration: row.totalduration,
            optimizedOrder: optimizedOrder,
            optimizationMetadata: optimizationMetadata,
            createdAt: row.createdat,
            updatedAt: row.updatedat,
            createdBy: row.createdby,
            updatedBy: row.updatedby,
            tickets: []
          };
          routesMap.set(routeId, route);
        }
        
        // Add ticket if it exists
        if (row.ticketid) {
          const ticket = {
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            address: row.address,
            queue: row.queue,
            quantity: row.quantity,
            amountToPay: row.amounttopay
          };
          routesMap.get(routeId).tickets.push(ticket);
        }
      });
      
      return Array.from(routesMap.values());
    } catch (error) {
      console.error('Error in findByTypeWithTickets:', error);
      throw error;
    }
  }
}

module.exports = Routes; 