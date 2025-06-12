const db = require('../../config/db');

class QuadrantSupervisor {
  static async create(employeeId, quadrantId, supervisor, revisor, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO QuadrantSupervisor(employeeId, quadrantId, supervisor, revisor, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [employeeId, quadrantId, supervisor, revisor, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(employeeId, quadrantId) {
    const res = await db.query(
      'SELECT * FROM QuadrantSupervisor WHERE employeeId = $1 AND quadrantId = $2;',
      [employeeId, quadrantId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM QuadrantSupervisor;');
    return res.rows;
  }

  static async update(employeeId, quadrantId, supervisor, revisor, updatedBy) {
    const res = await db.query(
      'UPDATE QuadrantSupervisor SET supervisor = $1, revisor = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE employeeId = $4 AND quadrantId = $5 RETURNING *;',
      [supervisor, revisor, updatedBy, employeeId, quadrantId]
    );
    return res.rows[0];
  }

  static async delete(employeeId, quadrantId) {
    const res = await db.query(
      'UPDATE QuadrantSupervisor SET deletedAt = CURRENT_TIMESTAMP WHERE employeeId = $1 AND quadrantId = $2 RETURNING *;',
      [employeeId, quadrantId]
    );
    return res.rows[0];
  }
}

module.exports = QuadrantSupervisor; 