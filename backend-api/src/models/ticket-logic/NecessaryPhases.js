const db = require('../config/db');

class NecessaryPhases {
  static async create(name, description, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO NecessaryPhases(name, description, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [name, description, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(necessaryPhaseId) {
    const res = await db.query('SELECT * FROM NecessaryPhases WHERE necessaryPhaseId = $1;', [necessaryPhaseId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM NecessaryPhases;');
    return res.rows;
  }

  static async update(necessaryPhaseId, name, description, updatedBy) {
    const res = await db.query(
      'UPDATE NecessaryPhases SET name = $1, description = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE necessaryPhaseId = $4 RETURNING *;',
      [name, description, updatedBy, necessaryPhaseId]
    );
    return res.rows[0];
  }

  static async delete(necessaryPhaseId) {
    const res = await db.query('UPDATE NecessaryPhases SET deletedAt = CURRENT_TIMESTAMP WHERE necessaryPhaseId = $1 RETURNING *;', [necessaryPhaseId]);
    return res.rows[0];
  }
}

module.exports = NecessaryPhases; 