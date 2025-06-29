const db = require('../../config/db');

class Quadrants {
  static async create(name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId, zoneManagerId) {
    const res = await db.query(
      'INSERT INTO Quadrants(name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId, zoneManagerId) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;',
      [name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, createdBy, updatedBy, supervisorId, zoneManagerId]
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

  static async findBySupervisor(supervisorId) {
    const res = await db.query('SELECT * FROM Quadrants WHERE supervisorId = $1 AND deletedAt IS NULL;', [supervisorId]);
    return res.rows;
  }

  static async findByZoneManager(zoneManagerId) {
    const res = await db.query('SELECT * FROM Quadrants WHERE zoneManagerId = $1 AND deletedAt IS NULL;', [zoneManagerId]);
    return res.rows;
  }

  static async updateSupervisor(quadrantId, supervisorId, updatedBy) {
    const res = await db.query(
      'UPDATE Quadrants SET supervisorId = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE quadrantId = $3 AND deletedAt IS NULL RETURNING *;',
      [supervisorId, updatedBy, quadrantId]
    );
    return res.rows[0];
  }

  static async updateZoneManager(quadrantId, zoneManagerId, updatedBy) {
    const res = await db.query(
      'UPDATE Quadrants SET zoneManagerId = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2 WHERE quadrantId = $3 AND deletedAt IS NULL RETURNING *;',
      [zoneManagerId, updatedBy, quadrantId]
    );
    return res.rows[0];
  }

  static async updateAssignments(quadrantId, supervisorId, zoneManagerId, updatedBy) {
    const res = await db.query(
      'UPDATE Quadrants SET supervisorId = $1, zoneManagerId = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE quadrantId = $4 AND deletedAt IS NULL RETURNING *;',
      [supervisorId, zoneManagerId, updatedBy, quadrantId]
    );
    return res.rows[0];
  }

  static async update(quadrantId, name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId, zoneManagerId) {
    const res = await db.query(
      'UPDATE Quadrants SET name = $1, shop = $2, zone = $3, minLatitude = $4, maxLatitude = $5, minLongitude = $6, maxLongitude = $7, updatedAt = CURRENT_TIMESTAMP, updatedBy = $8, supervisorId = $9, zoneManagerId = $10 WHERE quadrantId = $11 AND deletedAt IS NULL RETURNING *;',
      [name, shop, zone, minLatitude, maxLatitude, minLongitude, maxLongitude, updatedBy, supervisorId, zoneManagerId, quadrantId]
    );
    return res.rows[0];
  }

  static async delete(quadrantId) {
    const res = await db.query('UPDATE Quadrants SET deletedAt = CURRENT_TIMESTAMP WHERE quadrantId = $1 AND deletedAt IS NULL RETURNING *;', [quadrantId]);
    return res.rows[0];
  }
}

module.exports = Quadrants; 