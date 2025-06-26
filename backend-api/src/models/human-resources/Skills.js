const db = require('../../config/db');

class Skills {
  static async create(name, description, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Skills(name, description, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [name, description, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(skillId) {
    const res = await db.query('SELECT * FROM Skills WHERE skillId = $1 AND deletedAt IS NULL;', [skillId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Skills WHERE deletedAt IS NULL;');
    return res.rows;
  }

  static async update(skillId, name, description, updatedBy) {
    const res = await db.query(
      'UPDATE Skills SET name = $1, description = $2, updatedAt = CURRENT_TIMESTAMP, updatedBy = $3 WHERE skillId = $4 AND deletedAt IS NULL RETURNING *;',
      [name, description, updatedBy, skillId]
    );
    return res.rows[0];
  }

  static async delete(skillId) {
    const res = await db.query('UPDATE Skills SET deletedAt = CURRENT_TIMESTAMP WHERE skillId = $1 AND deletedAt IS NULL RETURNING *;', [skillId]);
    return res.rows[0];
  }
}

module.exports = Skills; 