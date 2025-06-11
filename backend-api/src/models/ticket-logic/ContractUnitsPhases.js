const db = require('../config/db');

class ContractUnitsPhases {
  static async create(contractUnitId, necessaryPhaseId, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO ContractUnitsPhases(contractUnitId, necessaryPhaseId, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [contractUnitId, necessaryPhaseId, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(contractUnitId, necessaryPhaseId) {
    const res = await db.query(
      'SELECT * FROM ContractUnitsPhases WHERE contractUnitId = $1 AND necessaryPhaseId = $2;',
      [contractUnitId, necessaryPhaseId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM ContractUnitsPhases;');
    return res.rows;
  }

  static async update(contractUnitId, necessaryPhaseId, updatedBy) {
    const res = await db.query(
      'UPDATE ContractUnitsPhases SET updatedAt = CURRENT_TIMESTAMP, updatedBy = $1 WHERE contractUnitId = $2 AND necessaryPhaseId = $3 RETURNING *;',
      [updatedBy, contractUnitId, necessaryPhaseId]
    );
    return res.rows[0];
  }

  static async delete(contractUnitId, necessaryPhaseId) {
    const res = await db.query(
      'UPDATE ContractUnitsPhases SET deletedAt = CURRENT_TIMESTAMP WHERE contractUnitId = $1 AND necessaryPhaseId = $2 RETURNING *;',
      [contractUnitId, necessaryPhaseId]
    );
    return res.rows[0];
  }
}

module.exports = ContractUnitsPhases; 