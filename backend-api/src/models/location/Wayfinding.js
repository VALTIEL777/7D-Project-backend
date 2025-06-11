const db = require('../config/db');

class Wayfinding {
  static async create(streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO wayfinding(streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;',
      [streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(wayfindingId) {
    const res = await db.query('SELECT * FROM wayfinding WHERE wayfindingId = $1;', [wayfindingId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM wayfinding;');
    return res.rows;
  }

  static async update(wayfindingId, streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, updatedBy) {
    const res = await db.query(
      'UPDATE wayfinding SET streetFrom = $1, streetTo = $2, location = $3, addressCardinal = $4, addressStreet = $5, addressSuffix = $6, width = $7, length = $8, surfaceTotal = $9, updatedAt = CURRENT_TIMESTAMP, updatedBy = $10 WHERE wayfindingId = $11 RETURNING *;',
      [streetFrom, streetTo, location, addressCardinal, addressStreet, addressSuffix, width, length, surfaceTotal, updatedBy, wayfindingId]
    );
    return res.rows[0];
  }

  static async delete(wayfindingId) {
    const res = await db.query('UPDATE wayfinding SET deletedAt = CURRENT_TIMESTAMP WHERE wayfindingId = $1 RETURNING *;', [wayfindingId]);
    return res.rows[0];
  }
}

module.exports = Wayfinding; 