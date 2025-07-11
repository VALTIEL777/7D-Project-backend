const db = require('../../config/db');

class People {
  static async create(UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO People(UserId, firstname, lastname, role, phone, email, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
      [UserId, firstname, lastname, role, phone, email, createdBy, updatedBy]
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

  static async findByRole(role) {
    const res = await db.query('SELECT * FROM People WHERE role = $1 AND deletedAt IS NULL;', [role]);
    return res.rows;
  }

  static async findWithQuadrants() {
    const res = await db.query(`
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'quadrantId', q.quadrantid,
              'name', q.name,
              'shop', q.shop,
              'zone', q.zone,
              'relationship', CASE 
                WHEN q.supervisorid = p.employeeid THEN 'supervisor'
                WHEN q.zonemanagerid = p.employeeid THEN 'zoneManager'
                ELSE NULL
              END
            ) ORDER BY q.quadrantid
          ) FILTER (WHERE q.quadrantid IS NOT NULL),
          '[]'::json
        ) as assignedQuadrants
      FROM People p
      INNER JOIN (
        SELECT DISTINCT employeeid
        FROM (
          SELECT supervisorid as employeeid FROM Quadrants WHERE deletedat IS NULL AND supervisorid IS NOT NULL
          UNION
          SELECT zonemanagerid as employeeid FROM Quadrants WHERE deletedat IS NULL AND zonemanagerid IS NOT NULL
        ) assigned_people
      ) ap ON p.employeeid = ap.employeeid
      LEFT JOIN Quadrants q ON (q.supervisorid = p.employeeid OR q.zonemanagerid = p.employeeid) AND q.deletedat IS NULL
      WHERE p.deletedat IS NULL
      GROUP BY p.employeeid, p.userid, p.firstname, p.lastname, p.role, p.phone, p.email, p.createdat, p.updatedat, p.deletedat, p.createdby, p.updatedby
      ORDER BY p.employeeid;
    `);
    return res.rows;
  }

  static async findByIdWithQuadrants(employeeId) {
    const res = await db.query(`
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'quadrantId', q.quadrantid,
              'name', q.name,
              'shop', q.shop,
              'zone', q.zone,
              'relationship', CASE 
                WHEN q.supervisorid = p.employeeid THEN 'supervisor'
                WHEN q.zonemanagerid = p.employeeid THEN 'zoneManager'
                ELSE NULL
              END
            ) ORDER BY q.quadrantid
          ) FILTER (WHERE q.quadrantid IS NOT NULL),
          '[]'::json
        ) as assignedQuadrants
      FROM People p
      LEFT JOIN Quadrants q ON (q.supervisorid = p.employeeid OR q.zonemanagerid = p.employeeid) AND q.deletedat IS NULL
      WHERE p.employeeid = $1 AND p.deletedat IS NULL
      GROUP BY p.employeeid, p.userid, p.firstname, p.lastname, p.role, p.phone, p.email, p.createdat, p.updatedat, p.deletedat, p.createdby, p.updatedby;
    `, [employeeId]);
    return res.rows[0];
  }

  static async findByRoleWithQuadrants(role) {
    const res = await db.query(`
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'quadrantId', q.quadrantid,
              'name', q.name,
              'shop', q.shop,
              'zone', q.zone,
              'relationship', CASE 
                WHEN q.supervisorid = p.employeeid THEN 'supervisor'
                WHEN q.zonemanagerid = p.employeeid THEN 'zoneManager'
                ELSE NULL
              END
            ) ORDER BY q.quadrantid
          ) FILTER (WHERE q.quadrantid IS NOT NULL),
          '[]'::json
        ) as assignedQuadrants
      FROM People p
      INNER JOIN (
        SELECT DISTINCT employeeid
        FROM (
          SELECT supervisorid as employeeid FROM Quadrants WHERE deletedat IS NULL AND supervisorid IS NOT NULL
          UNION
          SELECT zonemanagerid as employeeid FROM Quadrants WHERE deletedat IS NULL AND zonemanagerid IS NOT NULL
        ) assigned_people
      ) ap ON p.employeeid = ap.employeeid
      LEFT JOIN Quadrants q ON (q.supervisorid = p.employeeid OR q.zonemanagerid = p.employeeid) AND q.deletedat IS NULL
      WHERE p.role = $1 AND p.deletedat IS NULL
      GROUP BY p.employeeid, p.userid, p.firstname, p.lastname, p.role, p.phone, p.email, p.createdat, p.updatedat, p.deletedat, p.createdby, p.updatedby
      ORDER BY p.employeeid;
    `, [role]);
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