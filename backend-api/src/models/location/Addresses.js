const db = require('../../config/db');

class Addresses {
  static async create(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Addresses(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(addressId) {
    const res = await db.query('SELECT * FROM Addresses WHERE addressId = $1;', [addressId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Addresses;');
    return res.rows;
  }

  static async update(addressId, addressNumber, addressCardinal, addressStreet, addressSuffix, updatedBy) {
    const res = await db.query(
      'UPDATE Addresses SET addressNumber = $1, addressCardinal = $2, addressStreet = $3, addressSuffix = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE addressId = $6 RETURNING *;',
      [addressNumber, addressCardinal, addressStreet, addressSuffix, updatedBy, addressId]
    );
    return res.rows[0];
  }

  static async delete(addressId) {
    const res = await db.query('UPDATE Addresses SET deletedAt = CURRENT_TIMESTAMP WHERE addressId = $1 RETURNING *;', [addressId]);
    return res.rows[0];
  }
}

module.exports = Addresses; 