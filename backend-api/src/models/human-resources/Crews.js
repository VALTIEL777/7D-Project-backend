const db = require('../../config/db');

class Crews {
 static async create(type, photo, workedHours, routeId, createdBy, updatedBy) {
  const res = await db.query(
    'INSERT INTO Crews(type, photo, workedHours, routeId, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
    [type, photo, workedHours, routeId, createdBy, updatedBy]
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


static async findAllWithEmployees() {
  const res = await db.query(`
    SELECT
      c.crewId,
      c.type,
      c.workedHours,
      -- Construimos un arreglo JSON con los empleados y sus nombres completos por cada crew
      json_agg(
        json_build_object(
          'employeeId', ce.employeeId,
          'fullName', CONCAT(p.firstname, ' ', p.lastname),
          'crewLeader', ce.crewLeader
        )
      ) AS employees
    FROM Crews c
    LEFT JOIN CrewEmployees ce ON c.crewId = ce.crewId AND ce.deletedAt IS NULL
    LEFT JOIN People p ON ce.employeeId = p.employeeId AND p.deletedAt IS NULL
    WHERE c.deletedAt IS NULL
    GROUP BY c.crewId, c.type, c.workedHours
  `);

  return res.rows;
}

static async getCrewDetailsById(crewId) {
  const query = `
    SELECT
      r.routeid,
      r.routecode,
      t.ticketid,
      ta.taskstatusid,
      ts.name AS taskstatusname,
      addr.addressnumber,
      addr.addresscardinal,
      addr.addressstreet,
      addr.addresssuffix,

      -- 🧭 Wayfinding
      w.location,
      w.fromaddressstreet,
      w.toaddressstreet,
      w.fromaddresscardinal,
      w.fromaddresssuffix,
      w.width,
      w.length,
      w.surfacetotal,

      -- 📦 Contract Units
      cu.contractunitid,
      cu.itemcode,
      cu.name AS contractunit_name,
      cu.unit,
      cu.description AS contractunit_description,
      cu.costperunit,
      cu.zone,
      cu.paymentclause,

      -- 🔁 Phases (reemplazando NecessaryPhases)
      ts2.taskstatusid AS phase_id,
      ts2.name AS phase_name,
      ts2.description AS phase_description,

      -- 📄 Permits
      p.permitid,
      p.permitnumber,
      p.status AS permit_status,
      p.startdate AS permit_start,
      p.expiredate AS permit_expire,

      -- 📄 Diggers
      d.diggerid,
      d.diggernumber,
      d.status AS digger_status,
      d.startdate AS digger_start,
      d.expiredate AS digger_expire

    FROM crews c
    JOIN routes r ON c.routeid = r.routeid
    JOIN routetickets rt ON rt.routeid = r.routeid
    JOIN tickets t ON t.ticketid = rt.ticketid

    LEFT JOIN ticketstatus ta ON ta.ticketid = t.ticketid AND ta.crewid = c.crewid
    LEFT JOIN taskstatus ts ON ts.taskstatusid = ta.taskstatusid
    LEFT JOIN ticketaddresses taddr ON t.ticketid = taddr.ticketid
    LEFT JOIN addresses addr ON addr.addressid = taddr.addressid

    LEFT JOIN wayfinding w ON w.wayfindingid = t.wayfindingid
    LEFT JOIN ContractUnits cu ON cu.contractunitid = t.contractunitid
    LEFT JOIN ContractUnitsPhases cup ON cup.contractunitid = cu.contractunitid
    LEFT JOIN TaskStatus ts2 ON ts2.taskstatusid = cup.taskstatusid

    -- 👇 Permits
    LEFT JOIN PermitedTickets pt ON pt.ticketid = t.ticketid
    LEFT JOIN Permits p ON p.permitid = pt.permitid
    LEFT JOIN Diggers d ON d.permitid = p.permitid

    WHERE c.crewid = $1;
  `;

  const result = await db.query(query, [crewId]);
  return result.rows;
}





}

module.exports = Crews; 