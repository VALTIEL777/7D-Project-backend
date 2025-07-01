const db = require('../../config/db');

class Suppliers {
  static async create(name, phone, email, address, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Suppliers(name, phone, email, address, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [name, phone, email, address, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(supplierId) {
    const res = await db.query('SELECT * FROM Suppliers WHERE supplierId = $1 AND deletedAt IS NULL;', [supplierId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Suppliers WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(supplierId, name, phone, email, address, updatedBy) {
    const res = await db.query(
      'UPDATE Suppliers SET name = $1, phone = $2, email = $3, address = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE supplierId = $6 AND deletedAt IS NULL RETURNING *;',
      [name, phone, email, address, updatedBy, supplierId]
    );
    return res.rows[0];
  }

  static async delete(supplierId) {
    const res = await db.query('UPDATE Suppliers SET deletedAt = CURRENT_TIMESTAMP WHERE supplierId = $1 AND deletedAt IS NULL RETURNING *;', [supplierId]);
    return res.rows[0];
  }
}

module.exports = Suppliers; 