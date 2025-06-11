const db = require('../config/db');

class Inventory {
  static async create(supplierId, name, costPerUnit, unit, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Inventory(supplierId, name, costPerUnit, unit, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [supplierId, name, costPerUnit, unit, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(inventoryId) {
    const res = await db.query('SELECT * FROM Inventory WHERE inventoryId = $1;', [inventoryId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Inventory;');
    return res.rows;
  }

  static async update(inventoryId, supplierId, name, costPerUnit, unit, updatedBy) {
    const res = await db.query(
      'UPDATE Inventory SET supplierId = $1, name = $2, costPerUnit = $3, unit = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE inventoryId = $6 RETURNING *;',
      [supplierId, name, costPerUnit, unit, updatedBy, inventoryId]
    );
    return res.rows[0];
  }

  static async delete(inventoryId) {
    const res = await db.query('UPDATE Inventory SET deletedAt = CURRENT_TIMESTAMP WHERE inventoryId = $1 RETURNING *;', [inventoryId]);
    return res.rows[0];
  }
}

module.exports = Inventory; 