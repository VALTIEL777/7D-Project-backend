const db = require('../../config/db');

class PhotoEvidence {
  static async create(ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO PhotoEvidence(ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;',
      [ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(photoId) {
    const res = await db.query('SELECT * FROM PhotoEvidence WHERE photoId = $1;', [photoId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM PhotoEvidence;');
    return res.rows;
  }

  static async update(photoId, ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, updatedBy) {
    const res = await db.query(
      'UPDATE PhotoEvidence SET ticketStatusId = $1, ticketId = $2, name = $3, latitude = $4, longitude = $5, photo = $6, date = $7, comment = $8, photoURL = $9, address = $10, updatedAt = CURRENT_TIMESTAMP, updatedBy = $11 WHERE photoId = $12 RETURNING *;',
      [ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, address, updatedBy, photoId]
    );
    return res.rows[0];
  }

  static async delete(photoId) {
    const res = await db.query('UPDATE PhotoEvidence SET deletedAt = CURRENT_TIMESTAMP WHERE photoId = $1 RETURNING *;', [photoId]);
    return res.rows[0];
  }
}

module.exports = PhotoEvidence; 