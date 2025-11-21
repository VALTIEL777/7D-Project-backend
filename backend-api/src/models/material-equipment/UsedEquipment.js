const db = require('../../config/db');

class UsedEquipment {
  static async create(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy, ticketId = null, retrievalCrewId = null) {
    const res = await db.query(
      'INSERT INTO usedEquipment(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy, ticketId, retrievalCrewId) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;',
      [CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, createdBy, updatedBy, ticketId, retrievalCrewId]
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

  static async update(CrewId, equipmentId, startDate, endDate, hoursLent, quantity, equipmentCost, observation, updatedBy, ticketId = null, retrievalCrewId = null) {
    const res = await db.query(
      'UPDATE usedEquipment SET startDate = $1, endDate = $2, hoursLent = $3, quantity = $4, equipmentCost = $5, observation = $6, ticketId = $7, retrievalCrewId = $8, updatedAt = CURRENT_TIMESTAMP, updatedBy = $9 WHERE CrewId = $10 AND equipmentId = $11 RETURNING *;',
      [startDate, endDate, hoursLent, quantity, equipmentCost, observation, ticketId, retrievalCrewId, updatedBy, CrewId, equipmentId]
    );
    return res.rows[0];
  }

  static async findByTicketId(ticketId) {
    const res = await db.query(
      'SELECT * FROM usedEquipment WHERE ticketId = $1 AND deletedAt IS NULL;',
      [ticketId]
    );
    return res.rows;
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