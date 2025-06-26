const db = require('../../config/db');

class Quadrants {
  static async create(name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId) {
    const res = await db.query(
      'INSERT INTO Quadrants(name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;',
      [name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId]
    );
    return res.rows[0];
  }

  static async findById(quadrantId) {
    const res = await db.query('SELECT * FROM Quadrants WHERE quadrantId = $1 AND deletedAt IS NULL;', [quadrantId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Quadrants WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(quadrantId, name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId) {
    const res = await db.query(
      'UPDATE Quadrants SET name = $1, shop = $2, minLatitude = $3, maxLatitude = $4, minLongitude = $5, maxLongitude = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7, supervisorId = $8 WHERE quadrantId = $9 AND deletedAt IS NULL RETURNING *;',
      [name, shop, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId, quadrantId]
    );
    return res.rows[0];
  }

  static async delete(quadrantId) {
    const res = await db.query('UPDATE Quadrants SET deletedAt = CURRENT_TIMESTAMP WHERE quadrantId = $1 AND deletedAt IS NULL RETURNING *;', [quadrantId]);
    return res.rows[0];
  }
}

module.exports = Quadrants; 