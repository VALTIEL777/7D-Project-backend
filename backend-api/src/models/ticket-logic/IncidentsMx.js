const db = require('../../config/db');

class IncidentsMx {
  static async create(name, earliestRptDate, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO IncidentsMx(name, earliestRptDate, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [name, earliestRptDate, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(incidentId) {
    const res = await db.query('SELECT * FROM IncidentsMx WHERE incidentId = $1 AND deletedAt IS NULL;', [incidentId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM IncidentsMx WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(incidentId, name, earliestRptDate, updatedBy) {
    const res = await db.query(
      'UPDATE IncidentsMx SET name = $1, earliestRptDate = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE incidentId = $4 AND deletedAt IS NULL RETURNING *;',
      [name, earliestRptDate, updatedBy, incidentId]
    );
    return res.rows[0];
  }

  static async delete(incidentId) {
    const res = await db.query('UPDATE IncidentsMx SET deletedAt = CURRENT_TIMESTAMP WHERE incidentId = $1 AND deletedAt IS NULL RETURNING *;', [incidentId]);
    return res.rows[0];
  }
}

module.exports = IncidentsMx; 