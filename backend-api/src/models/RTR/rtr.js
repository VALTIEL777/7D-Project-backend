// Placeholder model for Excel data
// Replace this with Mongoose/Sequelize schema if needed

const db = require('../../config/db');

class ExcelItem {
  constructor(data) {
    this.data = data;
    // Optional: validation logic here
  }

  // Example save method
  save() {
    console.log("Saving item:", this.data);
  }
}

class RTR {
  static async createIncident(name, earliestRptDate, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO IncidentsMx(name, earliestRptDate, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING incidentId;',
      [name, earliestRptDate, createdBy, updatedBy]
    );
    return res.rows[0].incidentid;
  }

  static async createWayfinding(location, fromAddressNumber, fromAddressCardinal, fromAddressStreet, fromAddressSuffix, toAddressNumber, toAddressCardinal, toAddressStreet, toAddressSuffix, length, width, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO wayfinding(location, fromAddressNumber, fromAddressCardinal, fromAddressStreet, fromAddressSuffix, toAddressNumber, toAddressCardinal, toAddressStreet, toAddressSuffix, length, width, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING wayfindingId;',
      [location, fromAddressNumber, fromAddressCardinal, fromAddressStreet, fromAddressSuffix, toAddressNumber, toAddressCardinal, toAddressStreet, toAddressSuffix, length, width, createdBy, updatedBy]
    );
    return res.rows[0].wayfindingid;
  }

  static async findQuadrantByName(name) {
    const res = await db.query('SELECT quadrantId FROM Quadrants WHERE name = $1 AND deletedAt IS NULL;', [name]);
    return res.rows[0]?.quadrantid;
  }

  static async createTicket(incidentId, quadrantId, wayfindingId, partnerComment, comment7d, ticketCode, partnerSupervisorComment, ticketType, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Tickets(incidentId, cuadranteId, wayfindingId, PartnerComment, comment7d, ticketCode, PartnerSupervisorComment, ticketType, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ticketId;',
      [incidentId, quadrantId, wayfindingId, partnerComment, comment7d, ticketCode, partnerSupervisorComment, ticketType, createdBy, updatedBy]
    );
    return res.rows[0].ticketid;
  }

  static async createAddress(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Addresses(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING addressId;',
      [addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy]
    );
    return res.rows[0].addressid;
  }

  static async createTicketAddress(ticketId, addressId, isPartner, is7d, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO TicketAddresses(ticketId, addressId, ispartner, is7d, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [ticketId, addressId, isPartner, is7d, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findContractUnitByName(name) {
    const res = await db.query('SELECT contractUnitId FROM ContractUnits WHERE name = $1 AND deletedAt IS NULL;', [name]);
    return res.rows[0]?.contractunitid;
  }

  static async updateTicketContractUnit(ticketId, contractUnitId, updatedBy) {
    const res = await db.query(
      'UPDATE Tickets SET contractUnitId = $1, updatedBy = $2 WHERE ticketId = $3 RETURNING *;',
      [contractUnitId, updatedBy, ticketId]
    );
    return res.rows[0];
  }

  static async createPermit(permitNumber, startDate, expireDate, status, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Permits(permitNumber, startDate, expireDate, status, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING PermitId;',
      [permitNumber, startDate, expireDate, status, createdBy, updatedBy]
    );
    return res.rows[0].permitid;
  }

  static async createPermitedTicket(permitId, ticketId, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO PermitedTickets(permitId, ticketId, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [permitId, ticketId, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async processRTRData(data, createdBy, updatedBy) {
    const results = [];
    
    for (const row of data) {
      try {
        // Step 1: Create Incident
        const incidentId = await this.createIncident(
          row.RESTN_WO_NUM,
          row.Earliest_Rpt_Dt,
          createdBy,
          updatedBy
        );

        // Step 2: Create Wayfinding
        const wayfindingId = await this.createWayfinding(
          row.LOCATION2_RES,
          row.fromAddressNumber,
          row.fromAddressCardinal,
          row.fromAddressStreet,
          row.fromAddressSuffix,
          row.toAddressNumber,
          row.toAddressCardinal,
          row.toAddressStreet,
          row.toAddressSuffix,
          row.length,
          row.width,
          createdBy,
          updatedBy
        );

        // Step 3: Find Quadrant
        const quadrantId = await this.findQuadrantByName(row.SQ_MI);

        // Step 4: Create Ticket
        const ticketId = await this.createTicket(
          incidentId,
          quadrantId,
          wayfindingId,
          row['PGL ComD:Wments'],
          row['Contractor Comments'],
          row.TASK_WO_NUM,
          row.NOTES2_RES,
          row.ticketType,
          createdBy,
          updatedBy
        );

        // Step 5: Create Address
        const addressId = await this.createAddress(
          row.addressNumber,
          row.addressCardinal,
          row.addressStreet,
          row.addressSuffix,
          createdBy,
          updatedBy
        );

        // Step 6: Create TicketAddress
        await this.createTicketAddress(
          ticketId,
          addressId,
          true, // isPartner
          false, // is7d
          createdBy,
          updatedBy
        );

        // Step 7: Find and link ContractUnit
        const contractUnitId = await this.findContractUnitByName(row.SAP_ITEM_NUM);
        if (contractUnitId) {
          await this.updateTicketContractUnit(ticketId, contractUnitId, updatedBy);
        }

        // Step 8: Create Permit
        const currentDate = new Date();
        const expireDate = new Date(row.EXP_DATE);
        const status = expireDate > currentDate ? 'ACTIVE' : 'EXPIRED';
        
        const permitId = await this.createPermit(
          row.AGENCY_NO,
          row.START_DATE,
          row.EXP_DATE,
          status,
          createdBy,
          updatedBy
        );

        // Step 9: Create PermitedTicket
        await this.createPermitedTicket(permitId, ticketId, createdBy, updatedBy);

        results.push({
          success: true,
          ticketId,
          incidentId,
          wayfindingId,
          addressId,
          permitId,
          message: 'Record created successfully'
        });

      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          data: row
        });
      }
    }

    return results;
  }

  static async saveRTRFile(name, url) {
    const res = await db.query(
      'INSERT INTO RTRs(name, url) VALUES($1, $2) RETURNING *;',
      [name, url]
    );
    return res.rows[0];
  }

  static async getAllRTRs() {
    const res = await db.query('SELECT * FROM RTRs ORDER BY createdAt DESC;');
    return res.rows;
  }

  static async getRTRById(rtrId) {
    const res = await db.query('SELECT * FROM RTRs WHERE rtrId = $1;', [rtrId]);
    return res.rows[0];
  }
}

module.exports = { ExcelItem, RTR };
