// This is an added comment to ensure Docker rebuilds and picks up changes.
const db = require('../../config/db.js');

class User {
  static async create(username, password) {
    const res = await db.query(
      'INSERT INTO Users(username, password) VALUES($1, $2) RETURNING *;',
      [username, password]
    );
    return res.rows[0];
  }

  static async findById(userId) {
    const res = await db.query('SELECT * FROM Users WHERE UserId = $1;', [userId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Users;');
    return res.rows;
  }

  static async update(userId, username, password) {
    const res = await db.query(
      'UPDATE Users SET username = $1, password = $2, updatedAt = CURRENT_TIMESTAMP WHERE UserId = $3 RETURNING *;',
      [username, password, userId]
    );
    return res.rows[0];
  }

  static async delete(userId) {
    const res = await db.query('UPDATE Users SET deletedAt = CURRENT_TIMESTAMP WHERE UserId = $1 RETURNING *;', [userId]);
    return res.rows[0];
  }

   static async findByUsername(username) {
    const res = await db.query('SELECT * FROM Users WHERE username = $1;', [username]);
    return res.rows[0]; // Devuelve null si no existe
  }
}


module.exports = User; 