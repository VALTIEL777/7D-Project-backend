const db = require('../../config/db');

class Routes {
  static async create(routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy) {
    // Convert JavaScript objects to JSON strings for PostgreSQL JSONB fields
    const optimizedOrderJson = Array.isArray(optimizedOrder) ? JSON.stringify(optimizedOrder) : (optimizedOrder ? JSON.stringify(optimizedOrder) : null);
    const optimizationMetadataJson = optimizationMetadata ? JSON.stringify(optimizationMetadata) : null;
    
    const res = await db.query(
      'INSERT INTO Routes(routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, createdBy, updatedBy) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;',
      [routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrderJson, optimizationMetadataJson, createdBy, updatedBy]
    );
    return res.rows[0];
  }

  static async findById(routeId) {
    const res = await db.query('SELECT * FROM Routes WHERE routeId = $1 AND deletedAt IS NULL;', [routeId]);
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query('SELECT * FROM Routes WHERE deletedAt IS NULL ORDER BY createdAt DESC;');
    return res.rows;
  }

  static async findByType(type) {
    const res = await db.query('SELECT * FROM Routes WHERE type = $1 AND deletedAt IS NULL ORDER BY createdAt DESC;', [type]);
    return res.rows;
  }

  static async update(routeId, routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrder, optimizationMetadata, updatedBy) {
    // Convert JavaScript objects to JSON strings for PostgreSQL JSONB fields
    const optimizedOrderJson = Array.isArray(optimizedOrder) ? JSON.stringify(optimizedOrder) : (optimizedOrder ? JSON.stringify(optimizedOrder) : null);
    const optimizationMetadataJson = optimizationMetadata ? JSON.stringify(optimizationMetadata) : null;
    
    const res = await db.query(
      'UPDATE Routes SET routeCode = $1, type = $2, startDate = $3, endDate = $4, encodedPolyline = $5, totalDistance = $6, totalDuration = $7, optimizedOrder = $8, optimizationMetadata = $9, updatedAt = CURRENT_TIMESTAMP, updatedBy = $10 WHERE routeId = $11 AND deletedAt IS NULL RETURNING *;',
      [routeCode, type, startDate, endDate, encodedPolyline, totalDistance, totalDuration, optimizedOrderJson, optimizationMetadataJson, updatedBy, routeId]
    );
    return res.rows[0];
  }

  static async delete(routeId) {
    const res = await db.query('UPDATE Routes SET deletedAt = CURRENT_TIMESTAMP WHERE routeId = $1 AND deletedAt IS NULL RETURNING *;', [routeId]);
    return res.rows[0];
  }

  static async updateOptimization(routeId, encodedPolyline, totalDistance, totalDuration, optimizedOrder, updatedBy) {
    // Convert JavaScript objects to JSON strings for PostgreSQL JSONB fields
    const optimizedOrderJson = Array.isArray(optimizedOrder) ? JSON.stringify(optimizedOrder) : (optimizedOrder ? JSON.stringify(optimizedOrder) : null);
    
    const res = await db.query(
      'UPDATE Routes SET encodedPolyline = $1, totalDistance = $2, totalDuration = $3, optimizedOrder = $4, updatedAt = CURRENT_TIMESTAMP, updatedBy = $5 WHERE routeId = $6 AND deletedAt IS NULL RETURNING *;',
      [encodedPolyline, totalDistance, totalDuration, optimizedOrderJson, updatedBy, routeId]
    );
    return res.rows[0];
  }

  // Get route with optimized tickets
  static async findByIdWithOptimizedTickets(routeId) {
    const res = await db.query(`
      SELECT 
        r.*,
        rt.ticketId,
        rt.address,
        rt.queue,
        t.ticketCode,
        t.quantity,
        t.amountToPay,
        -- Get coordinates from Addresses table
        a.latitude,
        a.longitude,
        a.placeid
      FROM Routes r
      LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId
      LEFT JOIN Tickets t ON rt.ticketId = t.ticketId
      LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
      LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
      WHERE r.routeId = $1 AND r.deletedAt IS NULL
      ORDER BY rt.queue ASC
    `, [routeId]);
    
    if (res.rows.length === 0) return null;
    
    // Group the results
    const route = {
      ...res.rows[0],
      tickets: res.rows.filter(row => row.ticketId).map(row => ({
        ticketId: row.ticketId,
        ticketCode: row.ticketCode,
        address: row.address,
        queue: row.queue,
        quantity: row.quantity,
        amountToPay: row.amountToPay,
        // Add coordinates for Leaflet marker placement
        coordinates: {
          latitude: row.latitude,
          longitude: row.longitude,
          placeid: row.placeid
        }
      }))
    };
    
    return route;
  }

  // Get routes by type with their tickets and addresses, only active routes
  static async findByTypeWithTickets(type) {
    try {
      const res = await db.query(`
        SELECT 
          r.*,
          rt.ticketId,
          rt.address,
          rt.queue,
          t.ticketCode,
          t.quantity,
          t.amountToPay,
          -- Contract unit name
          cu.name AS contractUnitName,
          -- Permit latest expire date for ticket
          perm.permitExpireDate AS permitExpireDate,
          -- Latest phase by ending date
          last_phase.latest_phase_name AS latestPhaseName,
          last_phase.latest_phase_end AS latestPhaseEnd,
          -- Phases that still have no photo evidence (filtered by route type)
          missing_photos.missing_photo_phases AS missingPhotoPhases,
          -- Get coordinates from Addresses table
          a.latitude,
          a.longitude,
          a.placeid,
          -- Get watchAndProtect status from Diggers
          digger.watchnProtect AS watchAndProtect
        FROM Routes r
        LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId AND rt.deletedAt IS NULL
        LEFT JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
        LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
        LEFT JOIN (
          SELECT pt.ticketId, MAX(p.expireDate) AS permitExpireDate
          FROM PermitedTickets pt
          JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
          WHERE pt.deletedAt IS NULL
          GROUP BY pt.ticketId
        ) perm ON perm.ticketId = t.ticketId
        LEFT JOIN LATERAL (
          SELECT d.watchnProtect
          FROM Diggers d
          JOIN Permits p ON d.permitId = p.PermitId AND p.deletedAt IS NULL
          JOIN PermitedTickets pt ON p.PermitId = pt.permitId AND pt.deletedAt IS NULL
          WHERE pt.ticketId = t.ticketId
            AND d.deletedAt IS NULL
          LIMIT 1
        ) digger ON TRUE
        LEFT JOIN LATERAL (
          SELECT
            ts.name AS latest_phase_name,
            MAX(tks.endingdate) AS latest_phase_end
          FROM TicketStatus tks
          JOIN TaskStatus ts ON ts.taskStatusId = tks.taskStatusId AND ts.deletedAt IS NULL
          WHERE tks.ticketId = t.ticketId 
            AND tks.deletedAt IS NULL
            AND tks.endingdate IS NOT NULL -- only consider completed phases
          GROUP BY ts.name
          ORDER BY MAX(tks.endingdate) DESC, ts.name
          LIMIT 1
        ) last_phase ON TRUE
        LEFT JOIN LATERAL (
          WITH expected AS (
            SELECT ts.taskStatusId, ts.name
            FROM ContractUnitsPhases cup
            JOIN TaskStatus ts ON ts.taskStatusId = cup.taskStatusId AND ts.deletedAt IS NULL
            WHERE cup.contractUnitId = t.contractUnitId
              AND cup.deletedAt IS NULL
              AND (
                (r.type = 'SPOTTER' AND ts.name IN ('Spotting')) OR
                (r.type = 'CONCRETE' AND ts.name IN ('Sawcut','Removal','Framing','Pour','Clean')) OR
                (r.type = 'ASPHALT' AND ts.name IN ('Grind','Asphalt','Crack Seal','Install Signs','Steel Plate Pick Up')) OR
                (r.type NOT IN ('SPOTTER','CONCRETE','ASPHALT'))
              )
          ), photos_by_phase AS (
            SELECT tks.taskStatusId
            FROM TicketStatus tks
            LEFT JOIN PhotoEvidence pe ON pe.ticketStatusId = tks.taskStatusId AND pe.ticketId = tks.ticketId AND pe.deletedAt IS NULL
            WHERE tks.ticketId = t.ticketId AND tks.deletedAt IS NULL
            GROUP BY tks.taskStatusId
            HAVING COUNT(pe.photoId) > 0
          )
          SELECT ARRAY(
            SELECT e.name
            FROM expected e
            LEFT JOIN photos_by_phase pbp ON pbp.taskStatusId = e.taskStatusId
            WHERE pbp.taskStatusId IS NULL
            ORDER BY e.name
          ) AS missing_photo_phases
        ) missing_photos ON TRUE
        LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
        LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
        WHERE r.type = $1 
          AND r.deletedAt IS NULL
          AND (
            r.endDate IS NULL 
            OR r.endDate > CURRENT_DATE
          )
        ORDER BY r.createdAt DESC, rt.queue ASC
      `, [type]);
      
      if (res.rows.length === 0) return [];
      
      // Group routes with their tickets
      const routesMap = new Map();
      
      res.rows.forEach(row => {
        const routeId = row.routeid;
        
        if (!routesMap.has(routeId)) {
          // Parse JSONB fields safely
          let optimizedOrder = null;
          let optimizationMetadata = null;
          
          try {
            if (row.optimizedorder) {
              try {
                optimizedOrder = JSON.parse(row.optimizedorder);
              } catch (e) {
                // Fallback: try to parse as comma-separated numbers (legacy format)
                if (typeof row.optimizedorder === 'string' && row.optimizedorder.match(/^\s*\d+(,\s*\d+)*\s*$/)) {
                  optimizedOrder = row.optimizedorder.split(',').map(s => parseInt(s.trim(), 10));
                } else {
                  console.warn(`Failed to parse optimizedOrder for route ${routeId}:`, e.message);
                  optimizedOrder = null;
                }
              }
            } else {
              optimizedOrder = null;
            }
          } catch (e) {
            console.warn(`Failed to parse optimizedOrder for route ${routeId}:`, e.message);
            optimizedOrder = null;
          }
          
          try {
            optimizationMetadata = row.optimizationmetadata ? JSON.parse(row.optimizationmetadata) : null;
          } catch (e) {
            console.warn(`Failed to parse optimizationMetadata for route ${routeId}:`, e.message);
          }
          
          // Create route object without ticket-specific fields
          const route = {
            routeId: row.routeid,
            routeCode: row.routecode,
            type: row.type,
            startDate: row.startdate,
            endDate: row.enddate,
            encodedPolyline: row.encodedpolyline,
            totalDistance: row.totaldistance,
            totalDuration: row.totalduration,
            optimizedOrder: optimizedOrder,
            optimizationMetadata: optimizationMetadata,
            createdAt: row.createdat,
            updatedAt: row.updatedat,
            createdBy: row.createdby,
            updatedBy: row.updatedby,
            tickets: []
          };
          routesMap.set(routeId, route);
        }
        
        // Add ticket if it exists
        if (row.ticketid) {
          // Determine phase order based on route type
          const phaseOrderMap = {
            SPOTTER: ['Spotting'],
            CONCRETE: ['Sawcut', 'Removal', 'Framing', 'Pour', 'Clean'],
            ASPHALT: ['Grind', 'Asphalt', 'Crack Seal', 'Install Signs', 'Steel Plate Pick Up']
          };
          const routeType = (row.type || '').toUpperCase();
          const orderedPhases = phaseOrderMap[routeType] || [];

          // Normalize missing photo phases array from SQL
          const rawMissing = Array.isArray(row.missingphotophases)
            ? row.missingphotophases
            : (row.missingphotophases ? [row.missingphotophases] : []);

          // Compute current active phase index: next after the latest completed phase
          const latestCompletedName = row.latestphasename || null;
          const latestIdx = latestCompletedName ? orderedPhases.indexOf(latestCompletedName) : -1;

          // Filter missing photos to include only phases up to the latest completed phase (exclude next/upcoming)
          const filteredMissing = latestIdx >= 0
            ? rawMissing.filter(p => {
                const idx = orderedPhases.indexOf(p);
                return idx !== -1 && idx <= latestIdx;
              })
            : [];

          const ticket = {
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            address: row.address,
            queue: row.queue,
            quantity: row.quantity,
            amountToPay: row.amounttopay,
            contractUnitName: row.contractunitname,
            permitExpireDate: row.permitexpiredate,
            latestPhase: row.latestphasename
              ? { name: row.latestphasename, endedAt: row.latestphaseend }
              : (routeType === 'SPOTTER' ? { name: 'Spotting', endedAt: null } : null),
            missingPhotoPhases: filteredMissing,
            // Add coordinates for Leaflet marker placement
            coordinates: {
              latitude: row.latitude,
              longitude: row.longitude,
              placeid: row.placeid
            }
          };
          routesMap.get(routeId).tickets.push(ticket);
        }
      });
      
      return Array.from(routesMap.values());
    } catch (error) {
      console.error('Error in findByTypeWithTickets:', error);
      throw error;
    }
  }

  // Get routes by type with their tickets and addresses, only routes with incomplete phases
  static async findByTypeWithIncompletePhases(type) {
    try {
      // Define the phases to check based on route type
      let phasesToCheck = [];
      let phaseCondition = '';
      
      switch (type.toUpperCase()) {
        case 'SPOTTER':
          phasesToCheck = ['Spotting'];
          phaseCondition = `ts.name = 'Spotting'`;
          break;
        case 'CONCRETE':
          phasesToCheck = ['Sawcut', 'Removal', 'Framing', 'Pour', 'Clean'];
          phaseCondition = `ts.name IN ('Sawcut', 'Removal', 'Framing', 'Pour', 'Clean')`;
          break;
        case 'ASPHALT':
          phasesToCheck = ['Grind', 'Asphalt', 'Crack Seal', 'Install Signs', 'Steel Plate Pick Up'];
          phaseCondition = `ts.name IN ('Grind', 'Asphalt', 'Crack Seal', 'Install Signs', 'Steel Plate Pick Up')`;
          break;
        default:
          // For other types, return all routes (no phase filtering)
          return await this.findByTypeWithTickets(type);
      }

      const res = await db.query(`
        SELECT DISTINCT
          r.*,
          rt.ticketId,
          rt.address,
          rt.queue,
          t.ticketCode,
          t.quantity,
          t.amountToPay,
          -- Get coordinates from Addresses table
          a.latitude,
          a.longitude,
          a.placeid
        FROM Routes r
        LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId AND rt.deletedAt IS NULL
        LEFT JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
        LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
        LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
        WHERE r.type = $1 
          AND r.deletedAt IS NULL
          AND (
            r.endDate IS NULL 
            OR r.endDate > CURRENT_DATE
          )
          -- Only include routes that have tickets with incomplete phases
          AND EXISTS (
            SELECT 1 
            FROM TicketStatus tks
            JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId
            WHERE tks.ticketId = t.ticketId
              AND ${phaseCondition}
              AND tks.endingDate IS NULL
              AND tks.deletedAt IS NULL
              AND ts.deletedAt IS NULL
          )
        ORDER BY r.createdAt DESC, rt.queue ASC
      `, [type]);
      
      if (res.rows.length === 0) return [];
      
      // Group routes with their tickets
      const routesMap = new Map();
      
      res.rows.forEach(row => {
        const routeId = row.routeid;
        
        if (!routesMap.has(routeId)) {
          // Parse JSONB fields safely
          let optimizedOrder = null;
          let optimizationMetadata = null;
          
          try {
            if (row.optimizedorder) {
              try {
                optimizedOrder = JSON.parse(row.optimizedorder);
              } catch (e) {
                // Fallback: try to parse as comma-separated numbers (legacy format)
                if (typeof row.optimizedorder === 'string' && row.optimizedorder.match(/^\s*\d+(,\s*\d+)*\s*$/)) {
                  optimizedOrder = row.optimizedorder.split(',').map(s => parseInt(s.trim(), 10));
                } else {
                  console.warn(`Failed to parse optimizedOrder for route ${routeId}:`, e.message);
                  optimizedOrder = null;
                }
              }
            } else {
              optimizedOrder = null;
            }
          } catch (e) {
            console.warn(`Failed to parse optimizedOrder for route ${routeId}:`, e.message);
            optimizedOrder = null;
          }
          
          try {
            optimizationMetadata = row.optimizationmetadata ? JSON.parse(row.optimizationmetadata) : null;
          } catch (e) {
            console.warn(`Failed to parse optimizationMetadata for route ${routeId}:`, e.message);
          }
          
          // Create route object without ticket-specific fields
          const route = {
            routeId: row.routeid,
            routeCode: row.routecode,
            type: row.type,
            startDate: row.startdate,
            endDate: row.enddate,
            encodedPolyline: row.encodedpolyline,
            totalDistance: row.totaldistance,
            totalDuration: row.totalduration,
            optimizedOrder: optimizedOrder,
            optimizationMetadata: optimizationMetadata,
            createdAt: row.createdat,
            updatedAt: row.updatedat,
            createdBy: row.createdby,
            updatedBy: row.updatedby,
            tickets: []
          };
          routesMap.set(routeId, route);
        }
        
        // Add ticket if it exists
        if (row.ticketid) {
          const ticket = {
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            address: row.address,
            queue: row.queue,
            quantity: row.quantity,
            amountToPay: row.amounttopay,
            // Add coordinates for Leaflet marker placement
            coordinates: {
              latitude: row.latitude,
              longitude: row.longitude,
              placeid: row.placeid
            }
          };
          routesMap.get(routeId).tickets.push(ticket);
        }
      });
      
      return Array.from(routesMap.values());
    } catch (error) {
      console.error('Error in findByTypeWithIncompletePhases:', error);
      throw error;
    }
  }

  // Get completed routes by type with their tickets and addresses
  // A route is considered completed if it has an endDate set
  static async findCompletedByTypeWithTickets(type) {
    try {
      const res = await db.query(`
        SELECT 
          r.*,
          rt.ticketId,
          rt.address,
          rt.queue,
          t.ticketCode,
          t.quantity,
          t.amountToPay,
          -- Get coordinates from Addresses table
          a.latitude,
          a.longitude,
          a.placeid
        FROM Routes r
        LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId AND rt.deletedAt IS NULL
        LEFT JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
        LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
        LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
        WHERE r.type = $1 
          AND r.deletedAt IS NULL
          AND r.endDate IS NOT NULL
          AND r.endDate <= CURRENT_DATE
        ORDER BY r.endDate DESC, r.createdAt DESC, rt.queue ASC
      `, [type]);
      
      if (res.rows.length === 0) return [];
      
      // Group routes with their tickets
      const routesMap = new Map();
      
      res.rows.forEach(row => {
        const routeId = row.routeid;
        
        if (!routesMap.has(routeId)) {
          // Parse JSONB fields safely
          let optimizedOrder = null;
          let optimizationMetadata = null;
          
          try {
            optimizedOrder = row.optimizedorder ? JSON.parse(row.optimizedorder) : null;
          } catch (e) {
            console.warn(`Failed to parse optimizedOrder for route ${routeId}:`, e.message);
          }
          
          try {
            optimizationMetadata = row.optimizationmetadata ? JSON.parse(row.optimizationmetadata) : null;
          } catch (e) {
            console.warn(`Failed to parse optimizationMetadata for route ${routeId}:`, e.message);
          }
          
          // Create route object without ticket-specific fields
          const route = {
            routeId: row.routeid,
            routeCode: row.routecode,
            type: row.type,
            startDate: row.startdate,
            endDate: row.enddate,
            encodedPolyline: row.encodedpolyline,
            totalDistance: row.totaldistance,
            totalDuration: row.totalduration,
            optimizedOrder: optimizedOrder,
            optimizationMetadata: optimizationMetadata,
            createdAt: row.createdat,
            updatedAt: row.updatedat,
            createdBy: row.createdby,
            updatedBy: row.updatedby,
            tickets: []
          };
          routesMap.set(routeId, route);
        }
        
        // Add ticket if it exists
        if (row.ticketid) {
          const ticket = {
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            address: row.address,
            queue: row.queue,
            quantity: row.quantity,
            amountToPay: row.amounttopay,
            // Add coordinates for Leaflet marker placement
            coordinates: {
              latitude: row.latitude,
              longitude: row.longitude,
              placeid: row.placeid
            }
          };
          routesMap.get(routeId).tickets.push(ticket);
        }
      });
      
      return Array.from(routesMap.values());
    } catch (error) {
      console.error('Error in findCompletedByTypeWithTickets:', error);
      throw error;
    }
  }

  // Get all routes with polylines and addresses for map display (including deleted routes)
  static async findAllWithPolylinesAndAddresses() {
    try {
      const res = await db.query(`
        SELECT 
          r.*,
          rt.ticketId,
          rt.address,
          rt.queue,
          t.ticketCode,
          t.quantity,
          t.amountToPay,
          t.comment7d,
          -- Build full address string from RouteTickets
          CASE 
            WHEN rt.address IS NOT NULL AND rt.address != '' THEN rt.address
            ELSE NULL
          END as fullAddress,
          -- Get coordinates from Addresses table
          a.latitude,
          a.longitude,
          a.placeid
        FROM Routes r
        LEFT JOIN RouteTickets rt ON r.routeId = rt.routeId AND rt.deletedAt IS NULL
        LEFT JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
        LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
        LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
        ORDER BY r.createdAt DESC, rt.queue ASC
      `);
      
      if (res.rows.length === 0) return [];
      
      // Group routes with their tickets and addresses
      const routesMap = new Map();
      
      res.rows.forEach(row => {
        const routeId = row.routeid;
        
        if (!routesMap.has(routeId)) {
          // Create route object
          const route = {
            routeId: row.routeid,
            routeCode: row.routecode,
            type: row.type,
            startDate: row.startdate,
            endDate: row.enddate,
            encodedPolyline: row.encodedpolyline,
            totalDistance: row.totaldistance,
            totalDuration: row.totalduration,
            optimizedOrder: row.optimizedorder,
            optimizationMetadata: row.optimizationmetadata,
            createdAt: row.createdat,
            updatedAt: row.updatedat,
            deletedAt: row.deletedat,
            createdBy: row.createdby,
            updatedBy: row.updatedby,
            tickets: [],
            addressCount: 0
          };
          
          routesMap.set(routeId, route);
        }
        
        // Add ticket if it exists
        if (row.ticketid) {
          const ticket = {
            ticketId: row.ticketid,
            ticketCode: row.ticketcode,
            address: row.address,
            fullAddress: row.fulladdress,
            queue: row.queue,
            quantity: row.quantity,
            amountToPay: row.amounttopay,
            comment7d: row.comment7d,
            // Add coordinates for Leaflet marker placement
            coordinates: {
              latitude: row.latitude,
              longitude: row.longitude,
              placeid: row.placeid
            }
          };
          
          routesMap.get(routeId).tickets.push(ticket);
          routesMap.get(routeId).addressCount++;
        }
      });
      
      return Array.from(routesMap.values());
      
    } catch (error) {
      console.error('Error getting all routes with polylines and addresses:', error);
      throw error;
    }
  }
}

module.exports = Routes; 