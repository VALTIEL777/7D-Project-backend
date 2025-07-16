const db = require('../../config/db');

class TicketStatus {
  static async create(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO TicketStatus(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [taskStatusId, ticketId, crewId, startingDate, endingDate, observation, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findByTicket(ticketId) {
    const query = `
      SELECT * FROM TicketStatus
      WHERE ticketId = $1 AND deletedAt IS NULL;
    `;
    const { rows } = await db.query(query, [ticketId]);
    return rows;
  }


  static async findById(taskStatusId, ticketId) {
    const res = await db.query(
      'SELECT * FROM TicketStatus WHERE taskStatusId = $1 AND ticketId = $2 AND deletedAt IS NULL;',
      [taskStatusId, ticketId]
    );
    return res.rows[0];
  }

  static async findByTicketAndCrew(ticketId, crewId) {
  const res = await db.query(
    'SELECT * FROM TicketStatus WHERE ticketId = $1 AND crewId = $2;',
    [ticketId, crewId]
  );
  return res.rows[0]; 
}

  static async findAll() {
    const res = await db.query('SELECT * FROM TicketStatus WHERE deletedAt IS NULL;');
    return res.rows;
  }

static async findCompletedTickets() {
  const query = `
    SELECT 
      ts.*, 
      w.fromaddressstreet, 
      w.toaddressstreet, 
      w.fromaddresscardinal, 
      w.fromaddresssuffix,
      w.width,
      w.length,
      w.surfacetotal
    FROM TicketStatus ts
    JOIN tickets t ON t.ticketid = ts.ticketid
    LEFT JOIN wayfinding w ON w.wayfindingid = t.wayfindingid
    WHERE ts.endingdate IS NOT NULL
    ORDER BY ts.endingdate DESC;
  `;
  
  const result = await db.query(query);
  return result.rows;
}


  static async update(taskStatusId, ticketId, crewId, startingDate, endingDate, observation, updatedBy) {
  const existing = await db.query(
    'SELECT * FROM TicketStatus WHERE taskStatusId = $1 AND ticketId = $2;',
    [taskStatusId, ticketId]
  );

  if (existing.rows.length === 0) return null;

  const current = existing.rows[0];

  const res = await db.query(
    `UPDATE TicketStatus
     SET crewId = $1,
         startingDate = $2,
         endingDate = $3,
         observation = $4,
         updatedAt = CURRENT_TIMESTAMP,
         updatedBy = $5
     WHERE taskStatusId = $6 AND ticketId = $7
     RETURNING *;`,
    [
      crewId ?? current.crewid,
      startingDate ?? current.startingdate,
      endingDate ?? current.endingdate,
      observation ?? current.observation,
      updatedBy,
      taskStatusId,
      ticketId
    ]
  );

  return res.rows[0];
}


  static async delete(taskStatusId, ticketId) {
    const res = await db.query(
      'UPDATE TicketStatus SET deletedAt = CURRENT_TIMESTAMP WHERE taskStatusId = $1 AND ticketId = $2 AND deletedAt IS NULL RETURNING *;',
      [taskStatusId, ticketId]
    );
    return res.rows[0];
  }
}

module.exports = TicketStatus; 