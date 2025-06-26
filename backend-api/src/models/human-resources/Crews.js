const db = require('../../config/db');

class Crews {
  static async create(type, photo, workedHours, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Crews(type, photo, workedHours, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5) RETURNING *;',
      [type, photo, workedHours, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(crewId) {
    const res = await db.query('SELECT * FROM Crews WHERE crewId = $1 AND deletedAt IS NULL;', [crewId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Crews WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(crewId, type, photo, workedHours, updatedBy) {
    const res = await db.query(
      'UPDATE Crews SET type = $1, photo = $2, workedHours = $3, updatedAt = CURRENT_TIMESTAMP, updatedBy = $4 WHERE crewId = $5 AND deletedAt IS NULL RETURNING *;',
      [type, photo, workedHours, updatedBy, crewId]
    );
    return res.rows[0];
  }

  static async delete(crewId) {
    const res = await db.query('UPDATE Crews SET deletedAt = CURRENT_TIMESTAMP WHERE crewId = $1 AND deletedAt IS NULL RETURNING *;', [crewId]);
    return res.rows[0];
  }
}

module.exports = Crews; 