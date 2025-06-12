const db = require('../../config/db');

class UsedInventory {
  static async create(CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO usedInventory(CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [CrewId, inventoryId, quantity, MaterialCost, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(CrewId, inventoryId) {
    const res = await db.query(
      'SELECT * FROM usedInventory WHERE CrewId = $1 AND inventoryId = $2;',
      [CrewId, inventoryId]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM usedInventory;');
    return res.rows;
  }

  static async update(CrewId, inventoryId, quantity, MaterialCost, updatedBy) {
    const res = await db.query(
      'UPDATE usedInventory SET quantity = $1, MaterialCost = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE CrewId = $4 AND inventoryId = $5 RETURNING *;',
      [quantity, MaterialCost, updatedBy, CrewId, inventoryId]
    );
    return res.rows[0];
  }

  static async delete(CrewId, inventoryId) {
    const res = await db.query(
      'UPDATE usedInventory SET deletedAt = CURRENT_TIMESTAMP WHERE CrewId = $1 AND inventoryId = $2 RETURNING *;',
      [CrewId, inventoryId]
    );
    return res.rows[0];
  }
}

module.exports = UsedInventory; 