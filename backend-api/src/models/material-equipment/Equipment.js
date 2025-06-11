const db = require('../../config/db');

class Equipment {
  static async create(supplierId, equipmentName, owner, type, hourlyRate, observation, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Equipment(supplierId, equipmentName, owner, type, hourlyRate, observation, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [supplierId, equipmentName, owner, type, hourlyRate, observation, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(equipmentId) {
    const res = await db.query('SELECT * FROM Equipment WHERE equipmentId = $1;', [equipmentId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Equipment;');
    return res.rows;
  }

  static async update(equipmentId, supplierId, equipmentName, owner, type, hourlyRate, observation, updatedBy) {
    const res = await db.query(
      'UPDATE Equipment SET supplierId = $1, equipmentName = $2, owner = $3, type = $4, hourlyRate = $5, observation = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7 WHERE equipmentId = $8 RETURNING *;',
      [supplierId, equipmentName, owner, type, hourlyRate, observation, updatedBy, equipmentId]
    );
    return res.rows[0];
  }

  static async delete(equipmentId) {
    const res = await db.query('UPDATE Equipment SET deletedAt = CURRENT_TIMESTAMP WHERE equipmentId = $1 RETURNING *;', [equipmentId]);
    return res.rows[0];
  }
}

module.exports = Equipment; 