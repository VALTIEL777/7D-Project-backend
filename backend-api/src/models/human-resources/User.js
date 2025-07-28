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
    const res = await db.query('SELECT * FROM Users WHERE userid = $1 AND deletedat IS NULL;', [userId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Users WHERE deletedat IS NULL;');
    return res.rows;
  }

  static async update(userId, username, password) {
    const res = await db.query(
      'UPDATE Users SET username = $1, password = $2, updatedat = CURRENT_TIMESTAMP WHERE userid = $3 AND deletedat IS NULL RETURNING *;',
      [username, password, userId]
    );
    return res.rows[0];
  }

  static async delete(userId) {
    const res = await db.query('UPDATE Users SET deletedat = CURRENT_TIMESTAMP WHERE userid = $1 AND deletedat IS NULL RETURNING *;', [userId]);
    return res.rows[0];
  }

   static async findByUsername(username) {
    const res = await db.query('SELECT * FROM Users WHERE username = $1;', [username]);
    return res.rows[0]; // Devuelve null si no existe
  }
}


module.exports = User; 