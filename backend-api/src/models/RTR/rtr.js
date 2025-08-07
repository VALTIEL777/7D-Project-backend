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
      
      // Search for quadrants that contain this number (with and without leading zeros)
      const fuzzyRes = await db.query(
        `SELECT quadrantId, name FROM Quadrants 
         WHERE (name LIKE $1 OR name LIKE $2 OR name LIKE $3) 
         AND deletedAt IS NULL 
         ORDER BY name LIMIT 1;`, 
        [`%${number}%`, `%${normalizedNumber}%`, `%PGL-${normalizedNumber}%`]
      );
      
      if (fuzzyRes.rows[0]) {
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
        return flexibleRes.rows[0].quadrantid;
  }
    }
    
    return null;
  }

  static async createTicket(incidentId, quadrantId, contractUnitId, wayfindingId, partnerComment, comment7d, ticketCode, partnerSupervisorComment, ticketType, amountToPay, quantity, createdBy, updatedBy) {
    
    const res = await db.query(
      'INSERT INTO Tickets(incidentId, cuadranteId, contractUnitId, wayfindingId, PartnerComment, comment7d, ticketCode, PartnerSupervisorComment, ticketType, amounttopay, quantity, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING ticketId;',
      [incidentId, quadrantId, contractUnitId, wayfindingId, partnerComment, comment7d, ticketCode, partnerSupervisorComment, ticketType, amountToPay, quantity, createdBy, updatedBy]
    );
    return res.rows[0].ticketid;
  }

  static async findAddress(addressNumber, addressCardinal, addressStreet, addressSuffix) {
    const res = await db.query(
      'SELECT addressId FROM Addresses WHERE addressNumber = $1 AND addressCardinal = $2 AND addressStreet = $3 AND addressSuffix = $4 AND deletedAt IS NULL;',
      [addressNumber, addressCardinal, addressStreet, addressSuffix]
    );
    return res.rows[0]?.addressid;
  }

  static async createAddress(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO Addresses(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING addressId;',
      [addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy]
    );
    return res.rows[0].addressid;
  }

  static async findOrCreateAddress(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy) {
    // First try to find existing address
    const existingAddressId = await this.findAddress(addressNumber, addressCardinal, addressStreet, addressSuffix);
    
    if (existingAddressId) {
      return existingAddressId;
    }
    
    // If not found, create new address
    const newAddressId = await this.createAddress(addressNumber, addressCardinal, addressStreet, addressSuffix, createdBy, updatedBy);
    return newAddressId;
  }

  static async findTicketAddress(ticketId, addressId) {
    const res = await db.query(
      'SELECT * FROM TicketAddresses WHERE ticketId = $1 AND addressId = $2 AND deletedAt IS NULL;',
      [ticketId, addressId]
    );
    return res.rows[0];
  }

  static async createTicketAddress(ticketId, addressId, isPartner, is7d, createdBy, updatedBy) {
    const res = await db.query(
      'INSERT INTO TicketAddresses(ticketId, addressId, ispartner, is7d, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING *;',
      [ticketId, addressId, isPartner, is7d, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findOrCreateTicketAddress(ticketId, addressId, isPartner, is7d, createdBy, updatedBy) {
    // First try to find existing ticket-address relationship
    const existingTicketAddress = await this.findTicketAddress(ticketId, addressId);
    
    if (existingTicketAddress) {
      return existingTicketAddress;
    }
    
    // If not found, create new relationship
    const newTicketAddress = await this.createTicketAddress(ticketId, addressId, isPartner, is7d, createdBy, updatedBy);
    return newTicketAddress;
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

  static async findOrCreatePermit(permitNumber, startDate, expireDate, status, createdBy, updatedBy) {
    // First try to find existing permit by permit number
    const existingPermit = await db.query(
      'SELECT * FROM Permits WHERE permitNumber = $1 AND deletedAt IS NULL;',
      [permitNumber]
    );

    if (existingPermit.rows[0]) {
      // Update existing permit with new dates and status
      const res = await db.query(
        'UPDATE Permits SET startDate = $1, expireDate = $2, status = $3, updatedAt = CURRENT_TIMESTAMP, updatedBy = $4 WHERE PermitId = $5 AND deletedAt IS NULL RETURNING PermitId;',
        [startDate, expireDate, status, updatedBy, existingPermit.rows[0].permitid]
      );
      
      // Check if we need to update ticket comments based on new expiration date
      await this.updateTicketCommentsForPermit(res.rows[0].permitid, updatedBy);
      
      return res.rows[0].permitid;
    } else {
      // Create new permit
      const res = await db.query(
        'INSERT INTO Permits(permitNumber, startDate, expireDate, status, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6) RETURNING PermitId;',
        [permitNumber, startDate, expireDate, status, createdBy, updatedBy]
      );
      return res.rows[0].permitid;
    }
  }

  // Helper method to update ticket comments when permit expiration date changes
  static async updateTicketCommentsForPermit(permitId, updatedBy) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Get the permit and its associated tickets
      // EXCLUDE tickets that are on private property (no permits needed)
      const permitRes = await db.query(
        `SELECT 
           p.PermitId,
           p.permitNumber,
           p.expireDate,
           p.status,
           t.ticketId,
           t.ticketCode,
           t.comment7d,
           w.location
         FROM Permits p
         INNER JOIN PermitedTickets pt ON p.PermitId = pt.permitId
         INNER JOIN Tickets t ON pt.ticketId = t.ticketId
         INNER JOIN wayfinding w ON t.wayfindingId = w.wayfindingId
         WHERE p.PermitId = $1 
         AND p.deletedAt IS NULL 
         AND pt.deletedAt IS NULL
         AND t.deletedAt IS NULL
         AND w.deletedAt IS NULL
         AND (w.location IS NULL OR LOWER(w.location) NOT LIKE '%private property%');`,
        [permitId]
      );

      if (permitRes.rows.length === 0) return;

      const permit = permitRes.rows[0];
      const daysUntilExpiry = Math.ceil((new Date(permit.expiredate) - currentDate) / (1000 * 60 * 60 * 24));
      
      // Skip if comment contains "TK - COMPLETED" or any variant
      if (permit.comment7d && permit.comment7d.toLowerCase().includes('tk - completed')) {
        console.log(`Skipping permit update for ticket ${permit.ticketid} - ticket is completed`);
        return;
      }
      
      // If permit expires within 7 days and ticket comment is empty/null, update it
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        if (!permit.comment7d || permit.comment7d === '' || permit.comment7d === 'TK - NEEDS PERMIT EXTENSION') {
          await db.query(
            'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3;',
            ['TK - NEEDS PERMIT EXTENSION', updatedBy, permit.ticketid]
          );
        }
      } else if (daysUntilExpiry > 7) {
        // If permit is now more than 7 days away and comment was set to extension, update to LAYOUT
        if (permit.comment7d && permit.comment7d.toLowerCase().includes('tk - needs permit extension')) {
          await db.query(
            'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3;',
            ['TK - LAYOUT', updatedBy, permit.ticketid]
          );
        }
      } else if (daysUntilExpiry < 0) {
        // If permit is expired, set to NEEDS PERMIT EXTENSION
        if (!permit.comment7d || permit.comment7d === '' || (permit.comment7d && !permit.comment7d.toLowerCase().includes('tk - needs permit extension'))) {
          await db.query(
            'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3;',
            ['TK - NEEDS PERMIT EXTENSION', updatedBy, permit.ticketid]
          );
        }
      }
    } catch (error) {
      console.error('Error updating ticket comments for permit:', error);
    }
  }

  // Helper method to determine permit status based on expiration date
  static determinePermitStatus(expireDate) {
    if (!expireDate) {
      console.log(`[determinePermitStatus] No expiration date provided, returning PENDING`);
      return 'PENDING'; // No expiration date set
    }
    
    // Create current date in UTC to avoid timezone issues
    const now = new Date();
    const currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // Parse expiration date and ensure it's in UTC
    let expirationDate;
    try {
      expirationDate = new Date(expireDate);
      // If the date is invalid, throw an error
      if (isNaN(expirationDate.getTime())) {
        throw new Error(`Invalid date: ${expireDate}`);
      }
      // Convert to UTC date (start of day)
      expirationDate = new Date(Date.UTC(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate()));
    } catch (error) {
      console.error(`[determinePermitStatus] Error parsing expiration date: ${expireDate}`, error);
      return 'PENDING';
    }
    
    // Add comprehensive logging to debug the date comparison
    console.log(`[determinePermitStatus] ===== DATE COMPARISON DEBUG =====`);
    console.log(`[determinePermitStatus] Raw expireDate input: ${expireDate}`);
    console.log(`[determinePermitStatus] Current date (UTC): ${currentDate.toISOString()}`);
    console.log(`[determinePermitStatus] Expiration date (UTC): ${expirationDate.toISOString()}`);
    console.log(`[determinePermitStatus] Current date (local): ${currentDate.toLocaleDateString()}`);
    console.log(`[determinePermitStatus] Expiration date (local): ${expirationDate.toLocaleDateString()}`);
    console.log(`[determinePermitStatus] Current date timestamp: ${currentDate.getTime()}`);
    console.log(`[determinePermitStatus] Expiration date timestamp: ${expirationDate.getTime()}`);
    console.log(`[determinePermitStatus] Is expiration < current? ${expirationDate < currentDate}`);
    console.log(`[determinePermitStatus] Is expiration === current? ${expirationDate.getTime() === currentDate.getTime()}`);
    
    if (expirationDate < currentDate) {
      console.log(`[determinePermitStatus] ❌ Permit EXPIRED - expiration date (${expirationDate.toISOString()}) is before current date (${currentDate.toISOString()})`);
      return 'EXPIRED';
    } else if (expirationDate.getTime() === currentDate.getTime()) {
      console.log(`[determinePermitStatus] ⚠️ Permit EXPIRES_TODAY - expiration date (${expirationDate.toISOString()}) equals current date (${currentDate.toISOString()})`);
      return 'EXPIRES_TODAY';
    } else {
      console.log(`[determinePermitStatus] ✅ Permit ACTIVE - expiration date (${expirationDate.toISOString()}) is after current date (${currentDate.toISOString()})`);
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
      
      // Calculate date 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999); // End of day
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Start of day
      
      // Get permits expiring within 7 days and their associated tickets
      // EXCLUDE tickets that are on private property (no permits needed)
      // EXCLUDE tickets that already have the correct extension comment
      const permitsRes = await db.query(
        `SELECT 
           p.PermitId,
           p.permitNumber,
           p.expireDate,
           p.status,
           t.ticketId,
           t.ticketCode,
           t.comment7d,
           w.location
         FROM Permits p
         INNER JOIN PermitedTickets pt ON p.PermitId = pt.permitId
         INNER JOIN Tickets t ON pt.ticketId = t.ticketId
         INNER JOIN wayfinding w ON t.wayfindingId = w.wayfindingId
         WHERE p.deletedAt IS NULL 
         AND pt.deletedAt IS NULL
         AND t.deletedAt IS NULL
         AND w.deletedAt IS NULL
         AND p.expireDate >= $1 
         AND p.expireDate <= $2
         AND (t.comment7d IS NULL OR t.comment7d = '')
         AND t.comment7d NOT ILIKE '%tk - needs permit extension%'
         AND t.comment7d NOT ILIKE '%tk - completed%'
         AND t.comment7d NOT ILIKE '%tk - cancelled%'
         AND t.comment7d NOT ILIKE '%tk - on hold off%'
         AND (w.location IS NULL OR LOWER(w.location) NOT LIKE '%private property%')
         ORDER BY p.expireDate ASC;`,
        [currentDate, sevenDaysFromNow]
      );
      
      const results = [];
      
      for (const row of permitsRes.rows) {
        const daysUntilExpiry = Math.ceil((new Date(row.expiredate) - currentDate) / (1000 * 60 * 60 * 24));
        
        // Only update if comment7d is null or empty
        // Additional check to avoid updating tickets that shouldn't be changed
        const comment = row.comment7d || '';
        const shouldSkip = comment.toLowerCase().includes('tk - on hold off') ||
                          comment.toLowerCase().includes('tk - on progress') ||
                          comment.toLowerCase().includes('tk - on schedule') ||
                          comment.toLowerCase().includes('tk - cancelled') ||
                          comment.toLowerCase().includes('tk - needs permit extension');
        
        if (!shouldSkip && (!row.comment7d || row.comment7d === '')) {
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
            updated: true,
            location: row.location
          });
          
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
            reason: shouldSkip ? `Skipped: Comment already has status "${comment}"` : 'Comment not null/empty',
            location: row.location
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error checking permits expiring soon:', error);
      throw error;
    }
  }

  // Method to update ticket comments to LAYOUT when permits are valid
// Method to update ticket comments to LAYOUT when permits are valid
  static async updateTicketCommentsToLayout(updatedBy) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Calculate date 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999);
      
      console.log(`[updateTicketCommentsToLayout] Looking for tickets with TK - NEEDS PERMIT EXTENSION and valid permits (> ${sevenDaysFromNow.toISOString()})`);
      
      // Get tickets with valid permits (more than 7 days away) that have extension comments
      // Exclude tickets with status comments that shouldn't be changed at SQL level
      const ticketsRes = await db.query(
        `SELECT 
          p.PermitId,
          p.permitNumber,
          p.expireDate,
          p.status,
          t.ticketId,
          t.ticketCode,
          t.comment7d,
          COALESCE(w.location, 'Unknown') as location
        FROM Permits p
        INNER JOIN PermitedTickets pt ON p.PermitId = pt.permitId
        INNER JOIN Tickets t ON pt.ticketId = t.ticketId
        LEFT JOIN wayfinding w ON t.wayfindingId = w.wayfindingId AND w.deletedAt IS NULL
        WHERE p.deletedAt IS NULL 
        AND pt.deletedAt IS NULL
        AND t.deletedAt IS NULL
        AND p.expireDate > $1
        AND t.comment7d ILIKE '%tk - needs permit extension%'
        AND t.comment7d NOT ILIKE '%tk - completed%'
        AND t.comment7d NOT ILIKE '%tk - cancelled%'
        AND t.comment7d NOT ILIKE '%tk - on hold off%'
        AND t.comment7d NOT ILIKE '%tk - on progress%'
        AND t.comment7d NOT ILIKE '%tk - on schedule%'
        AND (w.location IS NULL OR LOWER(w.location) NOT LIKE '%private property%')
        ORDER BY p.expireDate ASC;`,
        [sevenDaysFromNow]
      );
      
      console.log(`[updateTicketCommentsToLayout] Found ${ticketsRes.rows.length} tickets with TK - NEEDS PERMIT EXTENSION and valid permits`);
      
      // If no tickets found, let's check if there are any tickets with TK - NEEDS PERMIT EXTENSION at all
      if (ticketsRes.rows.length === 0) {
        console.log(`[updateTicketCommentsToLayout] No tickets found with main query. Checking for any tickets with TK - NEEDS PERMIT EXTENSION...`);
        
        const checkRes = await db.query(
          `SELECT 
            t.ticketId,
            t.ticketCode,
            t.comment7d,
            p.PermitId,
            p.permitNumber,
            p.expireDate,
            p.status
          FROM Tickets t
          LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
          LEFT JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
          WHERE t.deletedAt IS NULL
          AND t.comment7d ILIKE '%tk - needs permit extension%'
          ORDER BY t.ticketId ASC;`
        );
        
        console.log(`[updateTicketCommentsToLayout] Found ${checkRes.rows.length} tickets with TK - NEEDS PERMIT EXTENSION (including those without valid permits or missing relationships)`);
        
        if (checkRes.rows.length > 0) {
          console.log(`[updateTicketCommentsToLayout] Sample tickets with TK - NEEDS PERMIT EXTENSION:`);
          checkRes.rows.slice(0, 5).forEach(row => {
            console.log(`  - Ticket ${row.ticketid} (${row.ticketcode}): comment7d="${row.comment7d}", permitId=${row.permitid}, expireDate=${row.expiredate}`);
          });
        }
      }
      
      const results = [];
      
      for (const row of ticketsRes.rows) {
        const daysUntilExpiry = Math.ceil((new Date(row.expiredate) - currentDate) / (1000 * 60 * 60 * 24));
        
        console.log(`[updateTicketCommentsToLayout] Processing ticket ${row.ticketid} (${row.ticketcode}): comment7d="${row.comment7d}", expires in ${daysUntilExpiry} days`);
        
        // Double check (though SQL should have filtered these out already)
        const comment = row.comment7d || '';
        const shouldSkip = comment.toLowerCase().includes('tk - on hold off') ||
                          comment.toLowerCase().includes('tk - on progress') ||
                          comment.toLowerCase().includes('tk - on schedule') ||
                          comment.toLowerCase().includes('tk - cancelled') ||
                          comment.toLowerCase().includes('tk - completed');
        
        if (!shouldSkip) {
          // Update to LAYOUT since permit is valid and more than 7 days away
          await db.query(
            'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3;',
            ['TK - LAYOUT', updatedBy, row.ticketid]
          );
          
          console.log(`[updateTicketCommentsToLayout] ✅ Updated ticket ${row.ticketid} (${row.ticketcode}) from "${row.comment7d}" to "TK - LAYOUT"`);
          
          results.push({
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            permitId: row.permitid,
            permitNumber: row.permitnumber,
            expireDate: row.expiredate,
            daysUntilExpiry: daysUntilExpiry,
            oldComment: row.comment7d,
            newComment: 'TK - LAYOUT',
            updated: true,
            location: row.location
          });
        } else {
          // This should rarely happen due to SQL filtering, but kept for safety
          console.log(`[updateTicketCommentsToLayout] ⚠️ Skipped ticket ${row.ticketid} (${row.ticketcode}): comment "${comment}" should not be changed`);
          
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
            reason: `Skipped: Comment has status "${comment}" that should not be changed`,
            location: row.location
          });
        }
      }
      
      console.log(`[updateTicketCommentsToLayout] Completed: ${results.filter(r => r.updated).length} tickets updated to TK - LAYOUT`);
      return results;
    } catch (error) {
      console.error('Error updating ticket comments to LAYOUT:', error);
      throw error;
    }
  }

  // Combined method to update permit statuses and check for expiring permits
  static async updatePermitStatusesAndCheckExpiring(updatedBy) {
    try {
      
      // First update permit statuses
      const statusResults = await this.updateAllPermitStatuses(updatedBy);
      
      // Then check for permits expiring within 7 days
      const expiringResults = await this.checkPermitsExpiringSoon(updatedBy);
      
      // Then update tickets with valid permits to LAYOUT
      const layoutResults = await this.updateTicketCommentsToLayout(updatedBy);
      
      return {
        statusUpdates: statusResults,
        expiringChecks: expiringResults,
        layoutUpdates: layoutResults,
        summary: {
          totalPermitsChecked: statusResults.length,
          permitsStatusUpdated: statusResults.filter(r => r.updated).length,
          totalTicketsChecked: expiringResults.length,
          ticketsCommentUpdated: expiringResults.filter(r => r.updated).length,
          totalTicketsUpdatedToLayout: layoutResults.length
        }
      };
    } catch (error) {
      console.error('Error updating permit statuses and checking expiring:', error);
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

  static async findPermitedTicket(permitId, ticketId) {
    const res = await db.query(
      'SELECT * FROM PermitedTickets WHERE permitId = $1 AND ticketId = $2 AND deletedAt IS NULL;',
      [permitId, ticketId]
    );
    return res.rows[0];
  }

  static async findOrCreatePermitedTicket(permitId, ticketId, createdBy, updatedBy) {
    // First try to find existing permitted ticket association
    const existingPermitedTicket = await this.findPermitedTicket(permitId, ticketId);
    
    if (existingPermitedTicket) {
      return existingPermitedTicket;
    }
    
    // If not found, create new association
    const newPermitedTicket = await this.createPermitedTicket(permitId, ticketId, createdBy, updatedBy);
    return newPermitedTicket;
  }

  static async findContractUnitByItemCode(itemCode) {
    if (!itemCode) {
      return null;
    }
    
    const res = await db.query(
      'SELECT contractUnitId, CostPerUnit FROM ContractUnits WHERE itemCode = $1 AND deletedAt IS NULL;', 
      [itemCode]
    );
    
    if (res.rows[0]) {
      return {
        contractUnitId: res.rows[0].contractunitid,
        costPerUnit: res.rows[0].costperunit
      };
    }
    
    // Let's also check what ContractUnits exist in the database
    const allContractUnits = await db.query('SELECT contractUnitId, itemCode, CostPerUnit FROM ContractUnits WHERE deletedAt IS NULL LIMIT 5;');
    
    return null;
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

        // Step 3: Find Quadrant (or create if doesn't exist)
        const quadrantId = await this.findQuadrantByName(row.SQ_MI);

        // Step 4: Find ContractUnit by SAP_ITEM_NUM
        const contractUnitData = await this.findContractUnitByItemCode(row.SAP_ITEM_NUM);
        const contractUnitId = contractUnitData ? contractUnitData.contractUnitId : null;
        
        // Step 5: Calculate amountToPay
        let amountToPay = null;
        let quantity = row.SQFT_QTY_RES || 1; // Get quantity from SQFT_QTY_RES
        
        // If quantity is 0, null, or undefined, use 1 instead
        if (!quantity || quantity === 0) {
          quantity = 1;
        }
        
        if (contractUnitData && contractUnitData.costPerUnit && quantity) {
          amountToPay = contractUnitData.costPerUnit * quantity;
        }

        // Step 6: Create Ticket
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

        // Step 6.5: Auto-correct comment7d based on permit expiration date
        if (row['Contractor Comments'] && row.EXP_DATE) {
          // Skip if comment contains "TK - COMPLETED" or any variant
          if (row['Contractor Comments'].toLowerCase().includes('tk - completed')) {
            console.log(`Skipping auto-correction for new ticket - ticket is completed`);
            // Continue with normal processing without auto-correction
          } else {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const expirationDate = new Date(row.EXP_DATE);
            expirationDate.setHours(0, 0, 0, 0);
            
            const daysUntilExpiry = Math.ceil((expirationDate - currentDate) / (1000 * 60 * 60 * 24));
            
            // If permit is valid (more than 7 days away) but comment says it needs extension
            if (daysUntilExpiry > 7 && row['Contractor Comments'].toLowerCase().includes('tk - needs permit extension')) {
              await db.query(
                'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3;',
                ['TK - LAYOUT', updatedBy, ticketId]
              );
              console.log(`Auto-corrected ticket ${ticketId} comment from "${row['Contractor Comments']}" to "TK - LAYOUT" (permit expires in ${daysUntilExpiry} days)`);
            }
            // If permit is expiring soon (≤ 7 days) but comment doesn't mention it
            else if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && !row['Contractor Comments'].toLowerCase().includes('tk - needs permit extension')) {
              await db.query(
                'UPDATE Tickets SET comment7d = $1, updatedBy = $2 WHERE ticketId = $3;',
                ['TK - NEEDS PERMIT EXTENSION', updatedBy, ticketId]
              );
              console.log(`Auto-corrected ticket ${ticketId} comment to "TK - NEEDS PERMIT EXTENSION" (permit expires in ${daysUntilExpiry} days)`);
            }
          }
        }

        // Step 7: Find or Create Address
        const addressId = await this.findOrCreateAddress(
          row.addressNumber,
          row.addressCardinal,
          row.addressStreet,
          row.addressSuffix,
          createdBy,
          updatedBy
        );

        // Step 8: Find or Create TicketAddress
        await this.findOrCreateTicketAddress(
          ticketId,
          addressId,
          true, // isPartner
          false, // is7d
          createdBy,
          updatedBy
        );

        // Step 9: Create Permit
        const permitStatus = this.determinePermitStatus(row.EXP_DATE);
        
        const permitId = await this.findOrCreatePermit(
          row.AGENCY_NO,
          row.START_DATE,
          row.EXP_DATE,
          permitStatus,
          createdBy,
          updatedBy
        );

        // Step 10: Create PermitedTicket
        await this.findOrCreatePermitedTicket(permitId, ticketId, createdBy, updatedBy);

        const result = {
          success: true,
          ticketId,
          incidentId,
          wayfindingId,
          addressId,
          permitId,
          message: 'Record created successfully'
        };
        
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
      
      // First, get the ticket's contractUnitId and partnerComment
      const ticketRes = await db.query(
        'SELECT contractUnitId, PartnerComment FROM Tickets WHERE ticketId = $1 AND deletedAt IS NULL;',
        [ticketId]
      );
      
      if (ticketRes.rows.length === 0) {
        throw new Error(`Ticket with ID ${ticketId} not found`);
      }
      
      const contractUnitId = ticketRes.rows[0].contractunitid;
      const partnerComment = ticketRes.rows[0].partnercomment;
      
      // Check if partnerComment contains mobilization-related keywords
      const mobilizationKeywords = ['mob', 'mobilization'];
      const hasMobilizationInComment = partnerComment && 
        mobilizationKeywords.some(keyword => 
          partnerComment.toLowerCase().includes(keyword.toLowerCase())
        );
      
      if (hasMobilizationInComment) {
        return {
          ticketId: ticketId,
          contractUnitId: contractUnitId,
          phasesFound: 0,
          statusesCreated: 0,
          skipped: true,
          reason: 'Mobilization-related content in partnerComment'
        };
      }
      
      if (!contractUnitId) {
        return {
          ticketId: ticketId,
          contractUnitId: null,
          phasesFound: 0,
          statusesCreated: 0,
          skipped: true,
          reason: 'No ContractUnit assigned to ticket'
        };
      }
      
      // Check if ContractUnit name contains mobilization-related keywords
      const contractUnitRes = await db.query(
        'SELECT name FROM ContractUnits WHERE contractUnitId = $1 AND deletedAt IS NULL;',
        [contractUnitId]
      );
      
      if (contractUnitRes.rows.length > 0) {
        const contractUnitName = contractUnitRes.rows[0].name;
        const hasMobilizationInContractUnit = contractUnitName && 
          mobilizationKeywords.some(keyword => 
            contractUnitName.toLowerCase().includes(keyword.toLowerCase())
          );
        
        if (hasMobilizationInContractUnit) {
          return {
            ticketId: ticketId,
            contractUnitId: contractUnitId,
            phasesFound: 0,
            statusesCreated: 0,
            skipped: true,
            reason: 'Mobilization-related ContractUnit name'
          };
        }
      }
      
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
      
      if (phasesRes.rows.length === 0) {
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
        }
      }
      
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
      
      const results = [];
      
      for (const ticketId of ticketIds) {
        try {
          // Check if the ticket exists (regardless of comment7d value)
          const ticketCheckRes = await db.query(
            'SELECT ticketId, comment7d FROM Tickets WHERE ticketId = $1 AND deletedAt IS NULL;',
            [ticketId]
          );
          
          if (ticketCheckRes.rows.length === 0) {
            results.push({
              ticketId: ticketId,
              error: 'Ticket not found',
              skipped: true
            });
            continue;
          }
          
          const ticket = ticketCheckRes.rows[0];
          const comment7d = ticket.comment7d;
          
          // Generate TicketStatus records for any comment7d value
          // (Removed restriction - now processes all tickets regardless of comment7d)
          
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
