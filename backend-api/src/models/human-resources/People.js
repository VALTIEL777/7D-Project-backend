const db = require('../../config/db');

class People {
  static async create(userid, firstname, lastname, role, phone, email, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO People(userid, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [userid, firstname, lastname, role, phone, email, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(employeeId) {
    const res = await db.query('SELECT * FROM People WHERE employeeId = $1 AND deletedAt IS NULL;', [employeeId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM People WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(employeeId, UserId, firstname, lastname, role, phone, email, updatedBy) {
    const res = await db.query(
      'UPDATE People SET UserId = $1, firstname = $2, lastname = $3, role = $4, phone = $5, email = $6, updatedAt = CURRENT_TIMESTAMP, updatedBy = $7 WHERE employeeId = $8 AND deletedAt IS NULL RETURNING *;',
      [UserId, firstname, lastname, role, phone, email, updatedBy, employeeId]
    );
    return res.rows[0];
  }

  static async delete(employeeId) {
    const res = await db.query('UPDATE People SET deletedAt = CURRENT_TIMESTAMP WHERE employeeId = $1 AND deletedAt IS NULL RETURNING *;', [employeeId]);
    return res.rows[0];
  }
}

module.exports = People; 