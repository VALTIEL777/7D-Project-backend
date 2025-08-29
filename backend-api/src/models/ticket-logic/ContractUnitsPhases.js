const db = require('../../config/db');

class ContractUnitsPhases {
  static async create(contractUnitId, taskStatusId, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO ContractUnitsPhases (contractUnitId, taskStatusId, createdBy, updatedBy) VALUES ($1, $2, $3, $4) RETURNING *;',
      [contractUnitId, taskStatusId, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(contractUnitId, taskStatusId) {
    const res = await db.query(
      'SELECT * FROM ContractUnitsPhases WHERE contractUnitId = $1 AND taskStatusId = $2;',
      [contractUnitId, taskStatusId]
    );
    return res.rows[0];
  }

  static async findByContractUnitId(contractUnitId) {
    const query = `
      SELECT contractUnitId, taskStatusId
      FROM ContractUnitsPhases
      WHERE contractUnitId = $1;
    `;
    const res = await db.query(query, [contractUnitId]);
    return res.rows;
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM ContractUnitsPhases;');
    return res.rows;
  }

  static async update(contractUnitId, taskStatusId, updatedBy) {
    const res = await db.query(
      'UPDATE ContractUnitsPhases SET updatedAt = CURRENT_TIMESTAMP, updatedBy = $1 WHERE contractUnitId = $2 AND taskStatusId = $3 RETURNING *;',
      [updatedBy, contractUnitId, taskStatusId]
    );
    return res.rows[0];
  }

  static async delete(contractUnitId, taskStatusId) {
    const res = await db.query(
      'UPDATE ContractUnitsPhases SET deletedAt = CURRENT_TIMESTAMP WHERE contractUnitId = $1 AND taskStatusId = $2 RETURNING *;',
      [contractUnitId, taskStatusId]
    );
    return res.rows[0];
  }
}

module.exports = ContractUnitsPhases;
