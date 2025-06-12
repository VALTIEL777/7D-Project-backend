const db = require('../../config/db');

class RouteTickets {
  static async create(routeId, ticketId, queue, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO RouteTickets(routeId, ticketId, queue, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5) RETURNING *;',
      [routeId, ticketId, queue, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(routeId, ticketId) {
    const res = await db.query(
      'SELECT * FROM RouteTickets WHERE routeId = $1 AND ticketId = $2;',
      [routeId, ticketId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM RouteTickets;');
    return res.rows;
  }

  static async update(routeId, ticketId, queue, updatedBy) {
    const res = await db.query(
      'UPDATE RouteTickets SET queue = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE routeId = $3 AND ticketId = $4 RETURNING *;',
      [queue, updatedBy, routeId, ticketId]
    );
    return res.rows[0];
  }

  static async delete(routeId, ticketId) {
    const res = await db.query(
      'UPDATE RouteTickets SET deletedAt = CURRENT_TIMESTAMP WHERE routeId = $1 AND ticketId = $2 RETURNING *;',
      [routeId, ticketId]
    );
    return res.rows[0];
  }
}

module.exports = RouteTickets; 