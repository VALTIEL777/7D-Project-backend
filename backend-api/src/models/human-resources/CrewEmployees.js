const db = require('../../config/db');

class CrewEmployees {
  static async create(crewId, peopleId, crewLeader, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO CrewEmployees(crewId, employeeId, crewLeader, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5) RETURNING *;',
      [crewId, peopleId, crewLeader, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(crewId, peopleId) {
    const res = await db.query(
      'SELECT * FROM CrewEmployees WHERE crewId = $1 AND employeeId = $2 AND deletedAt IS NULL;',
      [crewId, peopleId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM CrewEmployees WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(crewId, peopleId, crewLeader, updatedBy) {
    const res = await db.query(
      'UPDATE CrewEmployees SET crewLeader = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE crewId = $3 AND employeeId = $4 AND deletedAt IS NULL RETURNING *;',
      [crewLeader, updatedBy, crewId, peopleId]
    );
    return res.rows[0];
  }

  static async delete(crewId, peopleId) {
    const res = await db.query(
      'UPDATE CrewEmployees SET deletedAt = CURRENT_TIMESTAMP WHERE crewId = $1 AND employeeId = $2 AND deletedAt IS NULL RETURNING *;',
      [crewId, peopleId]
    );
    return res.rows[0];
  }
}

module.exports = CrewEmployees; 