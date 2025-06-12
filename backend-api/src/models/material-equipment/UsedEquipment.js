const db = require('../../config/db');

class UsedEquipment {
  static async create(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO usedEquipment(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;',
      [CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(CrewId, equipmentId) {
    const res = await db.query(
      'SELECT * FROM usedEquipment WHERE CrewId = $1 AND equipmentId = $2;',
      [CrewId, equipmentId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM usedEquipment;');
    return res.rows;
  }

  static async update(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, updatedBy) {
    const res = await db.query(
      'UPDATE usedEquipment SET startDate = $1, endDate = $2, hoursLent = $3, quantity = $4, equipmentCost = $5, observation = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7 WHERE CrewId = $8 AND equipmentId = $9 RETURNING *;',
      [startDate, endDate, hoursLent, quantity, equipmentCost, observation, updatedBy, CrewId, equipmentId]
    );
    return res.rows[0];
  }

  static async delete(CrewId, equipmentId) {
    const res = await db.query(
      'UPDATE usedEquipment SET deletedAt = CURRENT_TIMESTAMP WHERE CrewId = $1 AND equipmentId = $2 RETURNING *;',
      [CrewId, equipmentId]
    );
    return res.rows[0];
  }
}

module.exports = UsedEquipment; 