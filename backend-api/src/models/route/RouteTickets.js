const db = require('../../config/db');

class RouteTickets {
  static async create(routeId, ticketId, address, queue, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO RouteTickets(routeId, ticketId, address, queue, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [routeId, ticketId, address, queue, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async createBatch(routeTickets) {
    // Create multiple route tickets in a single transaction with UPSERT
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const ticket of routeTickets) {
        const res = await client.query(
          `INSERT INTO RouteTickets(routeId, ticketId, address, queue, createdBy, updatedBy) 
           VALUES($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (routeId, ticketId) 
           DO UPDATE SET 
             address = EXCLUDED.address,
             queue = EXCLUDED.queue,
             updatedAt = CURRENT_TIMESTAMP,
             updatedBy = EXCLUDED.updatedBy
           RETURNING *;`,
          [ticket.routeId, ticket.ticketId, ticket.address, ticket.queue, ticket.createdBy, ticket.updatedBy]
        );
        results.push(res.rows[0]);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByRouteId(routeId) {
    const res = await db.query(`
      SELECT rt.*, t.ticketCode, t.quantity, t.amountToPay
      FROM RouteTickets rt
      LEFT JOIN Tickets t ON rt.ticketId = t.ticketId
      WHERE rt.routeId = $1 AND rt.deletedAt IS NULL
      ORDER BY rt.queue ASC
    `, [routeId]);
    return res.rows;
  }

  static async deleteByRouteId(routeId) {
    const res = await db.query(
      'UPDATE RouteTickets SET deletedAt = CURRENT_TIMESTAMP WHERE routeId = $1 AND deletedAt IS NULL RETURNING *;',
      [routeId]
    );
    return res.rows;
  }

  static async deleteByRouteAndTicket(routeId, ticketId, updatedBy) {
    const res = await db.query(
      'UPDATE RouteTickets SET deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP, updatedBy = $1 WHERE routeId = $2 AND ticketId = $3 AND deletedAt IS NULL RETURNING *;',
      [updatedBy, routeId, ticketId]
    );
    return res.rows[0];
  }

  static async updateQueue(routeId, ticketId, queue, updatedBy) {
    const res = await db.query(
      'UPDATE RouteTickets SET queue = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE routeId = $3 AND ticketId = $4 AND deletedAt IS NULL RETURNING *;',
      [queue, updatedBy, routeId, ticketId]
    );
    return res.rows[0];
  }
}

module.exports = RouteTickets; 