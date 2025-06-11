const db = require('../config/db');

class ContractUnits {
  static async create(neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO ContractUnits(neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;',
      [neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(contractUnitId) {
    const res = await db.query('SELECT * FROM ContractUnits WHERE contractUnitId = $1;', [contractUnitId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM ContractUnits;');
    return res.rows;
  }

  static async update(contractUnitId, neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, updatedBy) {
    const res = await db.query(
      'UPDATE ContractUnits SET neededMobilization = $1, neededContractUnit = $2, itemCode = $3, name = $4, unit = $5, description = $6, workNotIncluded = $7, CDOTStandardImg = $8, CostPerUnit = $9, zone = $10, PaymentClause = $11, updatedAt = CURRENT_TIMESTAMP, updatedBy = $12 WHERE contractUnitId = $13 RETURNING *;',
      [neededMobilization, neededContractUnit, itemCode, name, unit, description, workNotIncluded, CDOTStandardImg, CostPerUnit, zone, PaymentClause, updatedBy, contractUnitId]
    );
    return res.rows[0];
  }

  static async delete(contractUnitId) {
    const res = await db.query('UPDATE ContractUnits SET deletedAt = CURRENT_TIMESTAMP WHERE contractUnitId = $1 RETURNING *;', [contractUnitId]);
    return res.rows[0];
  }
}

module.exports = ContractUnits; 