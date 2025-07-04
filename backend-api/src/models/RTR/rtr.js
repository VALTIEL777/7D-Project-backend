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
    if (!name) return null;
    
    // First try to find the exact quadrant name
    const res = await db.query('SELECT quadrantId FROM Quadrants WHERE name = $1 AND deletedAt IS NULL;', [name]);
    if (res.rows[0]) {
      return res.rows[0].quadrantid;
    }
    
    // If exact match not found, try fuzzy matching on the number part
    // Extract number from name (e.g., "PGL-072" -> "072")
    const numberMatch = name.match(/(\d+)/);
    if (numberMatch) {
      const number = numberMatch[1];
      const normalizedNumber = parseInt(number, 10).toString(); // Remove leading zeros
      console.log(`Exact match not found for "${name}", searching for quadrants containing number "${normalizedNumber}"...`);
      
      // Search for quadrants that contain this number (with and without leading zeros)
      const fuzzyRes = await db.query(
        `SELECT quadrantId, name FROM Quadrants 
         WHERE (name LIKE $1 OR name LIKE $2 OR name LIKE $3) 
         AND deletedAt IS NULL 
         ORDER BY name LIMIT 1;`, 
        [`%${number}%`, `%${normalizedNumber}%`, `%PGL-${normalizedNumber}%`]
      );
      
      if (fuzzyRes.rows[0]) {
        console.log(`Found matching quadrant: "${fuzzyRes.rows[0].name}" for input "${name}"`);
        return fuzzyRes.rows[0].quadrantid;
      }
      
      // If still not found, try more flexible matching
      // Look for any quadrant that contains the number part
      const flexibleRes = await db.query(
        `SELECT quadrantId, name FROM Quadrants 
         WHERE name ~ $1 
         AND deletedAt IS NULL 
         ORDER BY name LIMIT 1;`,
        [`PGL-?${normalizedNumber}\\b|PGL-${number}\\b`]
      );
      
      if (flexibleRes.rows[0]) {
        console.log(`Found flexible matching quadrant: "${flexibleRes.rows[0].name}" for input "${name}"`);
        return flexibleRes.rows[0].quadrantid;
  }
    }
    
    console.log(`No matching quadrant found for "${name}"`);
    return null;
  }

  static async createTicket(incidentId, quadrantId, contractUnitId, wayfindingId, partnerComment, comment7d, ticketCode, partnerSupervisorComment, ticketType, amountToPay, quantity, createdBy, updatedBy) {
    console.log(`Creating ticket with amountToPay: ${amountToPay} (type: ${typeof amountToPay}) and quantity: ${quantity}`);
    
    const res = await db.query(
      'INSERT INTO Tickets(incidentId, cuadranteId, contractUnitId, wayfindingId, PartnerComment, comment7d, ticketCode, PartnerSupervisorComment, ticketType, amounttopay, quantity, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING ticketId;',
      [incidentId, quadrantId, contractUnitId, wayfindingId, partnerComment, comment7d, ticketCode, partnerSupervisorComment, ticketType, amountToPay, quantity, createdBy, updatedBy]
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

  // Helper method to determine permit status based on expiration date
  static determinePermitStatus(expireDate) {
    if (!expireDate) {
      return 'PENDING'; // No expiration date set
    }
    
    const currentDate = new Date();
    const expirationDate = new Date(expireDate);
    
    // Reset time to start of day for accurate date comparison
    currentDate.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    if (expirationDate < currentDate) {
      return 'EXPIRED';
    } else if (expirationDate.getTime() === currentDate.getTime()) {
      return 'EXPIRES_TODAY';
    } else {
      return 'ACTIVE';
    }
  }

  // Method to update permit status based on expiration date
  static async updatePermitStatus(permitId, updatedBy) {
    try {
      // Get the permit with its expiration date
      const permitRes = await db.query(
        'SELECT expireDate FROM Permits WHERE PermitId = $1 AND deletedAt IS NULL;',
        [permitId]
      );
      
      if (permitRes.rows.length === 0) {
        throw new Error(`Permit with ID ${permitId} not found`);
      }
      
      const expireDate = permitRes.rows[0].expiredate;
      const newStatus = this.determinePermitStatus(expireDate);
      
      // Update the permit status
      const updateRes = await db.query(
        'UPDATE Permits SET status = $1, updatedBy = $2 WHERE PermitId = $3 RETURNING *;',
        [newStatus, updatedBy, permitId]
      );
      
      return updateRes.rows[0];
    } catch (error) {
      console.error(`Error updating permit status for permit ${permitId}:`, error);
      throw error;
    }
  }

  // Method to update all permit statuses based on expiration dates
  static async updateAllPermitStatuses(updatedBy) {
    try {
      // Get all permits that need status updates
      const permitsRes = await db.query(
        `SELECT PermitId, expireDate, status 
         FROM Permits 
         WHERE deletedAt IS NULL 
         AND (status = 'ACTIVE' OR status = 'PENDING' OR status = 'EXPIRES_TODAY');`
      );
      
      const results = [];
      
      for (const permit of permitsRes.rows) {
        const newStatus = this.determinePermitStatus(permit.expiredate);
        
        // Only update if status has changed
        if (newStatus !== permit.status) {
          const updateRes = await db.query(
            'UPDATE Permits SET status = $1, updatedBy = $2 WHERE PermitId = $3 RETURNING *;',
            [newStatus, updatedBy, permit.permitid]
          );
          
          results.push({
            permitId: permit.permitid,
            oldStatus: permit.status,
            newStatus: newStatus,
            updated: true
          });
        } else {
          results.push({
            permitId: permit.permitid,
            oldStatus: permit.status,
            newStatus: newStatus,
            updated: false
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error updating all permit statuses:', error);
      throw error;
    }
  }

  // Method to check permits expiring within 7 days and update ticket comments
  static async checkPermitsExpiringSoon(updatedBy) {
    try {
      console.log('Checking for permits expiring within 7 days...');
      
      // Calculate date 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999); // End of day
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Start of day
      
      console.log(`Checking permits expiring between ${currentDate.toISOString()} and ${sevenDaysFromNow.toISOString()}`);
      
      // Get permits expiring within 7 days and their associated tickets
      const permitsRes = await db.query(
        `SELECT 
           p.PermitId,
           p.permitNumber,
           p.expireDate,
           p.status,
           t.ticketId,
           t.ticketCode,
           t.comment7d
         FROM Permits p
         INNER JOIN PermitedTickets pt ON p.PermitId = pt.permitId
         INNER JOIN Tickets t ON pt.ticketId = t.ticketId
         WHERE p.deletedAt IS NULL 
         AND pt.deletedAt IS NULL
         AND t.deletedAt IS NULL
         AND p.expireDate >= $1 
         AND p.expireDate <= $2
         AND (t.comment7d IS NULL OR t.comment7d = '' OR t.comment7d = 'TK - NEEDS PERMIT EXTENSION')
         ORDER BY p.expireDate ASC;`,
        [currentDate, sevenDaysFromNow]
      );
      
      console.log(`Found ${permitsRes.rows.length} tickets with permits expiring within 7 days`);
      
      const results = [];
      
      for (const row of permitsRes.rows) {
        const daysUntilExpiry = Math.ceil((new Date(row.expiredate) - currentDate) / (1000 * 60 * 60 * 24));
        
        // Only update if comment7d is null, empty, or already has the extension message
        if (!row.comment7d || row.comment7d === '' || row.comment7d === 'TK - NEEDS PERMIT EXTENSION') {
          // Update the ticket's comment7d
          const updateRes = await db.query(
            'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3 RETURNING ticketId, comment7d;',
            ['TK - NEEDS PERMIT EXTENSION', updatedBy, row.ticketid]
          );
          
          results.push({
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            permitId: row.permitid,
            permitNumber: row.permitnumber,
            expireDate: row.expiredate,
            daysUntilExpiry: daysUntilExpiry,
            oldComment: row.comment7d || '',
            newComment: 'TK - NEEDS PERMIT EXTENSION',
            updated: true
          });
          
          console.log(`Updated ticket ${row.ticketcode} (ID: ${row.ticketid}) - Permit ${row.permitnumber} expires in ${daysUntilExpiry} days`);
        } else {
          results.push({
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            permitId: row.permitid,
            permitNumber: row.permitnumber,
            expireDate: row.expiredate,
            daysUntilExpiry: daysUntilExpiry,
            oldComment: row.comment7d,
            newComment: row.comment7d,
            updated: false,
            reason: 'Comment already set to something other than extension message'
          });
        }
      }
      
      console.log(`Permit extension check completed: ${results.filter(r => r.updated).length} tickets updated`);
      
      return results;
    } catch (error) {
      console.error('Error checking permits expiring soon:', error);
      throw error;
    }
  }

  // Combined method to update permit statuses and check for expiring permits
  static async updatePermitStatusesAndCheckExpiring(updatedBy) {
    try {
      console.log('Starting comprehensive permit status and expiration check...');
      
      // First update permit statuses
      const statusResults = await this.updateAllPermitStatuses(updatedBy);
      
      // Then check for permits expiring within 7 days
      const expiringResults = await this.checkPermitsExpiringSoon(updatedBy);
      
      return {
        statusUpdates: statusResults,
        expiringChecks: expiringResults,
        summary: {
          totalPermitsChecked: statusResults.length,
          permitsStatusUpdated: statusResults.filter(r => r.updated).length,
          totalTicketsChecked: expiringResults.length,
          ticketsCommentUpdated: expiringResults.filter(r => r.updated).length
        }
      };
    } catch (error) {
      console.error('Error in comprehensive permit update:', error);
      throw error;
    }
  }

  static async createPermitedTicket(permitId, ticketId, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO PermitedTickets(permitId, ticketId, createdBy, updatedBy) VALUES($1, $2, $3, $4) RETURNING *;',
      [permitId, ticketId, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findContractUnitByItemCode(itemCode) {
    if (!itemCode) {
      console.log(`findContractUnitByItemCode: itemCode is null/undefined`);
      return null;
    }
    
    console.log(`findContractUnitByItemCode: Searching for itemCode "${itemCode}"`);
    
    const res = await db.query(
      'SELECT contractUnitId, CostPerUnit FROM ContractUnits WHERE itemCode = $1 AND deletedAt IS NULL;', 
      [itemCode]
    );
    
    console.log(`findContractUnitByItemCode: Query returned ${res.rows.length} rows`);
    
    if (res.rows[0]) {
      console.log(`findContractUnitByItemCode: Found row:`, res.rows[0]);
      console.log(`findContractUnitByItemCode: contractUnitId = ${res.rows[0].contractunitid}, CostPerUnit = ${res.rows[0].costperunit}`);
      return {
        contractUnitId: res.rows[0].contractunitid,
        costPerUnit: res.rows[0].costperunit
      };
    }
    
    console.log(`findContractUnitByItemCode: No ContractUnit found with itemCode "${itemCode}"`);
    
    // Let's also check what ContractUnits exist in the database
    const allContractUnits = await db.query('SELECT contractUnitId, itemCode, CostPerUnit FROM ContractUnits WHERE deletedAt IS NULL LIMIT 5;');
    console.log(`findContractUnitByItemCode: Available ContractUnits:`, allContractUnits.rows);
    
    return null;
  }

  static async processRTRData(data, createdBy, updatedBy) {
    const results = [];
    
    console.log(`=== Starting RTR Data Processing ===`);
    console.log(`Total rows to process: ${data.length}`);
    console.log(`createdBy: ${createdBy}, updatedBy: ${updatedBy}`);
    
    for (const row of data) {
      try {
        console.log(`\n=== Processing Row ===`);
        console.log(`Row data keys: ${Object.keys(row)}`);
        console.log(`SAP_ITEM_NUM: ${row.SAP_ITEM_NUM}`);
        console.log(`SQFT_QTY_RES: ${row.SQFT_QTY_RES} (type: ${typeof row.SQFT_QTY_RES})`);
        console.log(`TASK_WO_NUM: ${row.TASK_WO_NUM}`);
        console.log(`RESTN_WO_NUM: ${row.RESTN_WO_NUM}`);
        
        // Step 1: Create Incident
        console.log(`Step 1: Creating incident with RESTN_WO_NUM: ${row.RESTN_WO_NUM}`);
        const incidentId = await this.createIncident(
          row.RESTN_WO_NUM,
          row.Earliest_Rpt_Dt,
          createdBy,
          updatedBy
        );
        console.log(`Step 1 - Created Incident ID: ${incidentId}`);

        // Step 2: Create Wayfinding
        console.log(`Step 2: Creating wayfinding with LOCATION2_RES: ${row.LOCATION2_RES}`);
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
        console.log(`Step 2 - Created Wayfinding ID: ${wayfindingId}`);

        // Step 3: Find Quadrant (or create if doesn't exist)
        console.log(`Step 3: Finding quadrant with SQ_MI: ${row.SQ_MI}`);
        const quadrantId = await this.findQuadrantByName(row.SQ_MI);
        console.log(`Step 3 - Found Quadrant ID: ${quadrantId}`);

        // Step 4: Find ContractUnit by SAP_ITEM_NUM
        console.log(`Step 4: Looking for ContractUnit with itemCode: "${row.SAP_ITEM_NUM}"`);
        const contractUnitData = await this.findContractUnitByItemCode(row.SAP_ITEM_NUM);
        const contractUnitId = contractUnitData ? contractUnitData.contractUnitId : null;
        console.log(`Step 4 - ContractUnit result:`, contractUnitData);
        
        // Step 5: Calculate amountToPay
        console.log(`Step 5: Calculating amountToPay`);
        let amountToPay = null;
        let quantity = row.SQFT_QTY_RES || 1; // Get quantity from SQFT_QTY_RES
        
        // If quantity is 0, null, or undefined, use 1 instead
        if (!quantity || quantity === 0) {
          quantity = 1;
        }
        
        console.log(`Step 5 - Raw SQFT_QTY_RES: ${row.SQFT_QTY_RES} (type: ${typeof row.SQFT_QTY_RES})`);
        console.log(`Step 5 - Final quantity: ${quantity} (type: ${typeof quantity})`);
        console.log(`Step 5 - ContractUnit data:`, contractUnitData);
        
        if (contractUnitData && contractUnitData.costPerUnit && quantity) {
          amountToPay = contractUnitData.costPerUnit * quantity;
          console.log(`Step 5 - Calculated amountToPay: ${contractUnitData.costPerUnit} * ${quantity} = ${amountToPay}`);
        } else {
          console.log(`Step 5 - Could not calculate amountToPay:`);
          console.log(`  - contractUnitData exists: ${!!contractUnitData}`);
          console.log(`  - costPerUnit: ${contractUnitData?.costPerUnit}`);
          console.log(`  - quantity: ${quantity}`);
        }

        // Step 6: Create Ticket
        console.log(`Step 6: Creating ticket with TASK_WO_NUM: ${row.TASK_WO_NUM}`);
        console.log(`Step 6: Ticket parameters:`, {
          incidentId,
          quadrantId,
          contractUnitId,
          wayfindingId,
          partnerComment: row['PGL ComD:Wments'],
          comment7d: row['Contractor Comments'],
          ticketCode: row.TASK_WO_NUM,
          partnerSupervisorComment: row.NOTES2_RES,
          ticketType: row.ticketType,
          amountToPay,
          quantity,
          createdBy,
          updatedBy
        });
        
        const ticketId = await this.createTicket(
          incidentId,
          quadrantId,
          contractUnitId, // Pass the found contractUnitId
          wayfindingId,
          row['PGL ComD:Wments'],
          row['Contractor Comments'],
          row.TASK_WO_NUM,
          row.NOTES2_RES,
          row.ticketType,
          amountToPay, // Pass the calculated amountToPay
          quantity, // Pass the calculated quantity
          createdBy,
          updatedBy
        );
        console.log(`Step 6 - Created Ticket ID: ${ticketId}`);

        // Step 7: Create Address
        console.log(`Step 7: Creating address with ADDRESS: ${row.ADDRESS}`);
        const addressId = await this.createAddress(
          row.addressNumber,
          row.addressCardinal,
          row.addressStreet,
          row.addressSuffix,
          createdBy,
          updatedBy
        );
        console.log(`Step 7 - Created Address ID: ${addressId}`);

        // Step 8: Create TicketAddress
        console.log(`Step 8: Creating ticket address link`);
        await this.createTicketAddress(
          ticketId,
          addressId,
          true, // isPartner
          false, // is7d
          createdBy,
          updatedBy
        );
        console.log(`Step 8 - Created TicketAddress link`);

        // Step 9: Create Permit
        console.log(`Step 9: Creating permit with AGENCY_NO: ${row.AGENCY_NO}`);
        const permitStatus = this.determinePermitStatus(row.EXP_DATE);
        console.log(`Step 9 - Permit status determined: ${permitStatus} (expireDate: ${row.EXP_DATE})`);
        
        const permitId = await this.createPermit(
          row.AGENCY_NO,
          row.START_DATE,
          row.EXP_DATE,
          permitStatus,
          createdBy,
          updatedBy
        );
        console.log(`Step 9 - Created Permit ID: ${permitId} with status: ${permitStatus}`);

        // Step 10: Create PermitedTicket
        console.log(`Step 10: Creating permitted ticket link`);
        await this.createPermitedTicket(permitId, ticketId, createdBy, updatedBy);
        console.log(`Step 10 - Created PermitedTicket link`);

        const result = {
          success: true,
          ticketId,
          incidentId,
          wayfindingId,
          addressId,
          permitId,
          message: 'Record created successfully'
        };
        
        console.log(`=== Row Processing Complete ===`);
        console.log(`Final result:`, result);
        
        results.push(result);

      } catch (error) {
        console.error(`=== Error Processing Row ===`);
        console.error(`Error details:`, error);
        console.error(`Error message:`, error.message);
        console.error(`Error stack:`, error.stack);
        console.error(`Row data:`, row);
        
        const errorResult = {
          success: false,
          error: error.message,
          data: row,
          stack: error.stack
        };
        
        console.error(`Error result:`, errorResult);
        results.push(errorResult);
      }
    }

    console.log(`=== RTR Data Processing Complete ===`);
    console.log(`Total results: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);
    
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

  // Method to generate TicketStatus records for a ticket based on its ContractUnit phases
  static async generateTicketStatusesForTicket(ticketId, updatedBy) {
    try {
      console.log(`Generating TicketStatus records for ticket ${ticketId}...`);
      
      // First, get the ticket's contractUnitId
      const ticketRes = await db.query(
        'SELECT contractUnitId FROM Tickets WHERE ticketId = $1 AND deletedAt IS NULL;',
        [ticketId]
      );
      
      if (ticketRes.rows.length === 0) {
        throw new Error(`Ticket with ID ${ticketId} not found`);
      }
      
      const contractUnitId = ticketRes.rows[0].contractunitid;
      
      if (!contractUnitId) {
        console.log(`Ticket ${ticketId} has no ContractUnit assigned, skipping TicketStatus generation`);
        return {
          ticketId: ticketId,
          contractUnitId: null,
          phasesFound: 0,
          statusesCreated: 0,
          skipped: true,
          reason: 'No ContractUnit assigned to ticket'
        };
      }
      
      console.log(`Ticket ${ticketId} has ContractUnit ${contractUnitId}`);
      
      // Get the ContractUnit phases (TaskStatus records) for this ContractUnit
      const phasesRes = await db.query(
        `SELECT 
           cup.contractUnitId,
           cup.taskStatusId,
           ts.name as taskStatusName,
           ts.description as taskStatusDescription
         FROM ContractUnitsPhases cup
         INNER JOIN TaskStatus ts ON cup.taskStatusId = ts.taskStatusId
         WHERE cup.contractUnitId = $1 
         AND cup.deletedAt IS NULL 
         AND ts.deletedAt IS NULL
         ORDER BY cup.taskStatusId;`,
        [contractUnitId]
      );
      
      console.log(`Found ${phasesRes.rows.length} phases for ContractUnit ${contractUnitId}`);
      
      if (phasesRes.rows.length === 0) {
        console.log(`No phases found for ContractUnit ${contractUnitId}, skipping TicketStatus generation`);
        return {
          ticketId: ticketId,
          contractUnitId: contractUnitId,
          phasesFound: 0,
          statusesCreated: 0,
          skipped: true,
          reason: 'No phases defined for ContractUnit'
        };
      }
      
      // Check which TicketStatus records already exist for this ticket
      const existingStatusesRes = await db.query(
        'SELECT taskStatusId FROM TicketStatus WHERE ticketId = $1 AND deletedAt IS NULL;',
        [ticketId]
      );
      
      const existingTaskStatusIds = existingStatusesRes.rows.map(row => row.taskstatusid);
      console.log(`Existing TicketStatus records for ticket ${ticketId}: ${existingTaskStatusIds.length}`);
      
      const results = [];
      let createdCount = 0;
      
      // Create TicketStatus records for each phase that doesn't already exist
      for (const phase of phasesRes.rows) {
        if (!existingTaskStatusIds.includes(phase.taskstatusid)) {
          try {
            // Insert new TicketStatus record
            const insertRes = await db.query(
              `INSERT INTO TicketStatus (taskStatusId, ticketId, createdBy, updatedBy) 
               VALUES ($1, $2, $3, $4) 
               RETURNING taskStatusId, ticketId;`,
              [phase.taskstatusid, ticketId, updatedBy, updatedBy]
            );
            
            results.push({
              taskStatusId: phase.taskstatusid,
              taskStatusName: phase.taskstatusname,
              taskStatusDescription: phase.taskstatusdescription,
              created: true,
              ticketStatusRecord: insertRes.rows[0]
            });
            
            createdCount++;
            console.log(`Created TicketStatus for ticket ${ticketId}, taskStatus: ${phase.taskstatusname} (ID: ${phase.taskstatusid})`);
          } catch (insertError) {
            console.error(`Error creating TicketStatus for ticket ${ticketId}, taskStatus ${phase.taskstatusid}:`, insertError);
            results.push({
              taskStatusId: phase.taskstatusid,
              taskStatusName: phase.taskstatusname,
              taskStatusDescription: phase.taskstatusdescription,
              created: false,
              error: insertError.message
            });
          }
        } else {
          results.push({
            taskStatusId: phase.taskstatusid,
            taskStatusName: phase.taskstatusname,
            taskStatusDescription: phase.taskstatusdescription,
            created: false,
            reason: 'TicketStatus already exists'
          });
          console.log(`TicketStatus already exists for ticket ${ticketId}, taskStatus: ${phase.taskstatusname} (ID: ${phase.taskstatusid})`);
        }
      }
      
      console.log(`TicketStatus generation completed for ticket ${ticketId}: ${createdCount} new records created`);
      
      return {
        ticketId: ticketId,
        contractUnitId: contractUnitId,
        phasesFound: phasesRes.rows.length,
        statusesCreated: createdCount,
        skipped: false,
        results: results
      };
      
    } catch (error) {
      console.error(`Error generating TicketStatus records for ticket ${ticketId}:`, error);
      throw error;
    }
  }

  // Method to generate TicketStatus records for multiple tickets
  static async generateTicketStatusesForTickets(ticketIds, updatedBy) {
    try {
      console.log(`Generating TicketStatus records for ${ticketIds.length} tickets...`);
      
      const results = [];
      
      for (const ticketId of ticketIds) {
        try {
          // First check if the ticket has comment7d as null or empty
          const ticketCheckRes = await db.query(
            'SELECT ticketId, comment7d FROM Tickets WHERE ticketId = $1 AND deletedAt IS NULL;',
            [ticketId]
          );
          
          if (ticketCheckRes.rows.length === 0) {
            console.log(`Ticket ${ticketId} not found, skipping`);
            results.push({
              ticketId: ticketId,
              error: 'Ticket not found',
              skipped: true
            });
            continue;
          }
          
          const ticket = ticketCheckRes.rows[0];
          const comment7d = ticket.comment7d;
          
          // Only generate TicketStatus records if comment7d is null or empty
          if (comment7d !== null && comment7d !== '' && comment7d !== undefined) {
            console.log(`Ticket ${ticketId} has comment7d: "${comment7d}", skipping TicketStatus generation`);
            results.push({
              ticketId: ticketId,
              comment7d: comment7d,
              skipped: true,
              reason: 'comment7d is not null or empty'
            });
            continue;
          }
          
          console.log(`Ticket ${ticketId} has comment7d: "${comment7d}", proceeding with TicketStatus generation`);
          
          const result = await this.generateTicketStatusesForTicket(ticketId, updatedBy);
          results.push(result);
        } catch (error) {
          console.error(`Error processing ticket ${ticketId}:`, error);
          results.push({
            ticketId: ticketId,
            error: error.message,
            skipped: true
          });
        }
      }
      
      const summary = {
        totalTickets: ticketIds.length,
        processed: results.length,
        successful: results.filter(r => !r.skipped || r.statusesCreated > 0).length,
        failed: results.filter(r => r.error).length,
        skipped: results.filter(r => r.skipped && !r.error && !r.statusesCreated).length,
        totalPhasesFound: results.reduce((sum, r) => sum + (r.phasesFound || 0), 0),
        totalStatusesCreated: results.reduce((sum, r) => sum + (r.statusesCreated || 0), 0)
      };
      
      console.log(`TicketStatus generation completed for all tickets:`, summary);
      
      return {
        summary: summary,
        results: results
      };
      
    } catch (error) {
      console.error('Error generating TicketStatus records for multiple tickets:', error);
      throw error;
    }
  }
}

module.exports = { ExcelItem, RTR };
