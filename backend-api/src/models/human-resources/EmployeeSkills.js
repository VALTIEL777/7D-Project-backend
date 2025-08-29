const db = require('../../config/db');

class EmployeeSkills {
  // Crear un nuevo registro
  static async create(employeeId, skillId, proficiencyLevel, createdBy, updatedBy) {
    const res = await db.query(
      `INSERT INTO EmployeeSkills(employeeId, skillId, proficiencyLevel, createdBy, updatedBy)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *;`,
      [employeeId, skillId, proficiencyLevel, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  // Buscar un registro por employeeId y skillId (clave compuesta)
  static async findById(employeeId, skillId) {
    const res = await db.query(
      `SELECT * FROM EmployeeSkills 
       WHERE employeeId = $1 AND skillId = $2 AND deletedAt IS NULL;`,
      [employeeId, skillId]
    );
    return res.rows[0];
  }

  // Buscar todas las habilidades de un empleado
  static async findByEmployee(employeeId) {
  const res = await db.query(
    `SELECT 
       es.employeeid,
       es.skillid,
       s.name AS skillname,
       es.proficiencylevel,
       es.createdat,
       es.updatedat
     FROM employeeskills es
     JOIN skills s ON s.skillid = es.skillid
     WHERE es.employeeid = $1 AND es.deletedat IS NULL;`,
    [employeeId]
  );
  return res.rows;
}


  // Buscar todos los registros (opcional)
  static async findAll() {
    const res = await db.query(
      `SELECT * FROM EmployeeSkills 
       WHERE deletedAt IS NULL;`
    );
    return res.rows;
  }

  // Actualizar el nivel de habilidad (proficiencyLevel) o updatedBy
  static async update(employeeId, skillId, proficiencyLevel, updatedBy) {
    const res = await db.query(
      `UPDATE EmployeeSkills 
       SET proficiencyLevel = $1, updatedAt = CURRENT_TIMESTAMP, updatedBy = $2
       WHERE employeeId = $3 AND skillId = $4 AND deletedAt IS NULL
       RETURNING *;`,
      [proficiencyLevel, updatedBy, employeeId, skillId]
    );
    return res.rows[0];
  }

  // "Eliminar" un registro (soft delete)
  static async delete(employeeId, skillId) {
    const res = await db.query(
      `UPDATE EmployeeSkills 
       SET deletedAt = CURRENT_TIMESTAMP
       WHERE employeeId = $1 AND skillId = $2 AND deletedAt IS NULL
       RETURNING *;`,
      [employeeId, skillId]
    );
    return res.rows[0];
  }
}

module.exports = EmployeeSkills;
