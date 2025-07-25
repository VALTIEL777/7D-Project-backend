const db = require('../../config/db');

class PhotoEvidence {
  static async create(ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO PhotoEvidence(ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;',
      [ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, createdBy, updatedBy]
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

  static async update(photoId, ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, updatedBy) {
    const res = await db.query(
      'UPDATE PhotoEvidence SET ticketStatusId = $1, ticketId = $2, name = $3, latitude = $4, longitude = $5, photo = $6, date = $7, comment = $8, photoURL = $9, updatedAt = CURRENT_TIMESTAMP, updatedBy = $10 WHERE photoId = $11 RETURNING *;',
      [ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, photoURL, updatedBy, photoId]
    );
    return res.rows[0];
  }

  static async delete(photoId) {
    const res = await db.query('UPDATE PhotoEvidence SET deletedAt = CURRENT_TIMESTAMP WHERE photoId = $1 RETURNING *;', [photoId]);
    return res.rows[0];
  }

  static async findByTicketId(ticketId) {
    const res = await db.query('SELECT * FROM PhotoEvidence WHERE ticketId = $1 AND deletedAt IS NULL;', [ticketId]);
    return res.rows;
  }
}

module.exports = PhotoEvidence; 