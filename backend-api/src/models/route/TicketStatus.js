const db = require('../../config/db');

class TicketStatus {
  static async create(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO TicketStatus(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(taskStatusId, ticketId) {
    const res = await db.query(
      'SELECT * FROM TicketStatus WHERE taskStatusId = $1 AND ticketId = $2;',
      [taskStatusId, ticketId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM TicketStatus;');
    return res.rows;
  }

  static async update(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, updatedBy) {
    const res = await db.query(
      'UPDATE TicketStatus SET crewId = $1, startingDate = $2, endingDate = $3, observation = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE taskStatusId = $6 AND ticketId = $7 RETURNING *;',
      [crewId, startingDate, endingDate, observation, updatedBy, taskStatusId, ticketId]
    );
    return res.rows[0];
  }

  static async delete(taskStatusId, ticketId) {
    const res = await db.query(
      'UPDATE TicketStatus SET deletedAt = CURRENT_TIMESTAMP WHERE taskStatusId = $1 AND ticketId = $2 RETURNING *;',
      [taskStatusId, ticketId]
    );
    return res.rows[0];
  }
}

module.exports = TicketStatus; 