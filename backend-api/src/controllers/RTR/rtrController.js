const XLSX = require("xlsx");
const RTR = require("../../models/RTR/rtr").RTR;
const NotificationService = require("../../services/NotificationService");
const minioClient = require('../../config/minio');
const path = require('path');
const Tickets = require("../../models/ticket-logic/Tickets");

const importantColumns = [
  "RESTN_WO_NUM",
  "TASK_WO_NUM",
  "PGL ComD:Wments",
  "Contractor Comments",
  "SHOP",
  "SQ_MI",
  "Earliest_Rpt_Dt",
  "ADDRESS",
  "STREET_FROM_RES",
  "STREET_TO_RES",
  "NOTES2_RES",
  "SAP_ITEM_NUM",
  "LOCATION2_RES",
  "length_x_width",
  "AGENCY_NO",
  "ILL_ONLY",
  "START_DATE",
  "EXP_DATE",
];

function normalize(str) {
  return typeof str === "string"
    ? str.normalize("NFKC").replace(/\s+/g, " ").trim().toUpperCase()
    : "";
}

function isRowEmpty(row) {
  return row.every(
    (cell) => cell === null || cell === undefined || cell === ""
  );
}

function parseDateValue(value) {
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return null;
  return new Date(
    parsed.y,
    parsed.m - 1,
    parsed.d,
    parsed.H || 0,
    parsed.M || 0,
    parsed.S || 0
  ).toISOString();
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function getClosestHeaderIndex(target, headers) {
  const normalizedTarget = normalize(target);
  let bestMatch = { index: -1, score: Infinity };

  headers.forEach((header, idx) => {
    const normHeader = normalize(header);
    if (normHeader.includes(normalizedTarget)) {
      bestMatch = { index: idx, score: 0 };
      return;
    }
    const score = levenshtein(normHeader, normalizedTarget);
    if (score < bestMatch.score) {
      bestMatch = { index: idx, score };
    }
  });

  return bestMatch.score <= 4 ? bestMatch.index : -1;
}

function extractDimensions(value) {
  if (typeof value !== "string") return { length: null, width: null };
  const match = value.match(/(\d+)\s*[xX*×]\s*(\d+)/);
  if (!match) return { length: null, width: null };
  return {
    length: parseInt(match[1], 10),
    width: parseInt(match[2], 10),
  };
}

function parseAddress(address) {
  if (typeof address !== "string") {
    return {
      addressNumber: null,
      addressCardinal: null,
      addressStreet: null,
      addressSuffix: null,
    };
  }

  address = address.trim();
  address = address.replace(/^(\d+)-\d+/, "$1");

  const regex = /^(\d+)\s+([NSEW]{1,2})?\s*([\w\s]+?)\s+(ST|AVE|BLVD|RD|LN|DR|PL|CT|CIR|WAY|TER|TRL|PARKWAY|PKWY|HWY|EXPY|EXPRESSWAY|CRES|SQ|ALY|PLZ|BND|PT|ROW|RTE)?\.?$/i;
  const match = address.match(regex);

  if (!match) {
    return {
      addressNumber: null,
      addressCardinal: null,
      addressStreet: address,
      addressSuffix: null,
    };
  }

  return {
    addressNumber: match[1] || null,
    addressCardinal: match[2] || null,
    addressStreet: match[3]?.trim() || null,
    addressSuffix: match[4] || null,
  };
}

function parseRangeAddress(address) {
  if (typeof address !== "string") {
    return {
      number: null,
      cardinal: null,
      street: null,
      suffix: null,
    };
  }

  address = address.trim();

  const regex = /^([\d\-]+)\s+([NSEW]{1,2})?\s*([\w\s]+?)\s*(ST|AVE|BLVD|RD|LN|DR|PL|CT|CIR|WAY|TER|TRL|PARKWAY|PKWY|HWY|EXPY|EXPRESSWAY|CRES|SQ|ALY|PLZ|BND|PT|ROW|RTE)?\.?$/i;
  const match = address.match(regex);

  if (!match) {
    return {
      number: null,
      cardinal: null,
      street: address,
      suffix: null,
    };
  }

  return {
    number: match[1] || null,
    cardinal: match[2] || null,
    street: match[3]?.trim() || null,
    suffix: match[4] || null,
  };
}

exports.uploadExcel = async (req, res) => {
  try {
    // 1. Save file to MinIO
    const bucket = 'uploads'; // or your bucket name
    const folder = 'rtr';
    const originalName = req.file.originalname || 'rtr-upload.xlsx';
    const timestamp = Date.now();
    // Sanitize the filename to avoid URL encoding issues
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${folder}/${timestamp}-${sanitizedName}`;

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
    }

    await minioClient.putObject(bucket, objectName, req.file.buffer);

    // 2. Construct the file URL (use the sanitized name for the URL)
    const fileUrl = `http://${process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost'}:9000/${bucket}/${objectName}`;

    // 3. Save metadata to RTRs table
    const rtrRecord = await RTR.saveRTRFile(originalName, fileUrl);

    // 4. Create notification for RTR upload
    if (rtrRecord) {
      await NotificationService.notifyRTRUploaded(
        rtrRecord.rtrId,
        originalName,
        req.body.createdBy || 1
      );
    }

    // 5. Continue with Excel processing - only process "Seven-D" sheet
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const results = [];
    const saveToDatabase = req.query.save === 'true'; // Optional query parameter
    const createdBy = req.body.createdBy || 1; // Default user ID
    const updatedBy = req.body.updatedBy || 1; // Default user ID

    // Check if "Seven-D" sheet exists
    if (!workbook.SheetNames.includes('Seven-D')) {
      return res.status(400).json({
        success: false,
        error: 'Sheet "Seven-D" not found in the Excel file',
        availableSheets: workbook.SheetNames
      });
    }

    // Only process the "Seven-D" sheet
    const sheetName = 'Seven-D';
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sheet "Seven-D" is empty'
      });
    }

    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const normalized = rows[i].map(normalize);
      const matchCount = importantColumns.filter((col) =>
        normalized.includes(normalize(col))
      ).length;

      if (matchCount >= importantColumns.length * 0.6) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      results.push({
        sheet: sheetName,
        error: "Could not detect header row",
        message: "No row matched expected column names.",
      });
    } else {
      const headers = rows[headerRowIndex];
      const colIndexMap = {};
      importantColumns.forEach((col) => {
        const idx = getClosestHeaderIndex(col, headers);
        if (idx !== -1) colIndexMap[col] = idx;
      });

      const missing = importantColumns.filter((col) => !(col in colIndexMap));
      if (missing.length > 0) {
        results.push({
          sheet: sheetName,
          headerRow: headerRowIndex + 1,
          error: "Missing required columns",
          missing,
        });
      } else {
        const dataRows = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (isRowEmpty(row)) break;

          const entry = {};
          for (const [key, idx] of Object.entries(colIndexMap)) {
            const raw = row[idx];

            if (
              ["Earliest_Rpt_Dt", "START_DATE", "EXP_DATE"].includes(key) &&
              typeof raw === "number"
            ) {
              entry[key] = parseDateValue(raw);
            } else if (key === "length_x_width") {
              entry[key] = raw ?? null;
              const { length, width } = extractDimensions(raw);
              entry["length"] = length;
              entry["width"] = width;
            } else if (key === "ADDRESS") {
              entry[key] = raw ?? null;
              const {
                addressNumber,
                addressCardinal,
                addressStreet,
                addressSuffix,
              } = parseAddress(raw);
              entry["addressNumber"] = addressNumber;
              entry["addressCardinal"] = addressCardinal;
              entry["addressStreet"] = addressStreet;
              entry["addressSuffix"] = addressSuffix;
            } else if (key === "STREET_FROM_RES") {
              entry[key] = raw ?? null;
              const {
                number,
                cardinal,
                street,
                suffix,
              } = parseRangeAddress(raw);
              entry["fromAddressNumber"] = number;
              entry["fromAddressCardinal"] = cardinal;
              entry["fromAddressStreet"] = street;
              entry["fromAddressSuffix"] = suffix;
            } else if (key === "STREET_TO_RES") {
              entry[key] = raw ?? null;
              const {
                number,
                cardinal,
                street,
                suffix,
              } = parseRangeAddress(raw);
              entry["toAddressNumber"] = number;
              entry["toAddressCardinal"] = cardinal;
              entry["toAddressStreet"] = street;
              entry["toAddressSuffix"] = suffix;
            } else {
              entry[key] = raw ?? null;
            }
          }

          entry.ticketType = "regular"; // Since we're only processing Seven-D sheet
          dataRows.push(entry);
        }

        // Save to database if requested
        let databaseResults = null;
        if (saveToDatabase && dataRows.length > 0) {
          try {
            databaseResults = await RTR.processRTRData(dataRows, createdBy, updatedBy);
          } catch (dbError) {
            console.error("Database save error:", dbError);
            databaseResults = {
              error: "Failed to save to database",
              details: dbError.message
            };
          }
        }

        results.push({
          sheet: sheetName,
          headerRowUsed: headerRowIndex + 1,
          count: dataRows.length,
          data: dataRows,
          databaseResults: databaseResults
        });
      }
    }

    // Extract the processed data for analysis
    const processedData = results.length > 0 && results[0].data ? results[0].data : [];

    return res.status(200).json({
      success: true,
      rtrId: rtrRecord?.rtrId,
      rtrName: rtrRecord?.name,
      sheetCount: results.length,
      results,
      processedData: processedData, // Include processed data for analysis
      savedToDatabase: saveToDatabase
    });
  } catch (err) {
    console.error("❌ Excel processing failed:", err);
    return res.status(500).send("Failed to process file");
  }
};

exports.listRTRExcels = async (req, res) => {
  try {
    const result = await RTR.getAllRTRs();
    res.status(200).json({ success: true, rtrs: result });
  } catch (err) {
    console.error('Failed to list RTR Excels:', err);
    res.status(500).json({ success: false, error: 'Failed to list RTR Excels' });
  }
};

exports.downloadRTRExcel = async (req, res) => {
  try {
    const rtrId = req.params.rtrId;
    
    // Validate rtrId parameter
    if (!rtrId || rtrId === 'undefined') {
      return res.status(400).json({ 
        success: false, 
        error: 'RTR ID is required and must be a valid number',
        receivedValue: rtrId
      });
    }
    
    // Check if rtrId is a valid number
    const numericRtrId = parseInt(rtrId);
    if (isNaN(numericRtrId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'RTR ID must be a valid number',
        receivedValue: rtrId
      });
    }
    
    const rtr = await RTR.getRTRById(numericRtrId);
    if (!rtr) {
      return res.status(404).json({ success: false, error: 'RTR not found' });
    }
    
    // Extract bucket and object key from URL
    const url = new URL(rtr.url);
    const bucket = url.pathname.split('/')[1];
    // Decode the URL-encoded object key
    const objectKey = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
    
    console.log(`Attempting to download from MinIO - Bucket: ${bucket}, Key: ${objectKey}`);
    console.log(`Original URL: ${rtr.url}`);
    console.log(`Parsed pathname: ${url.pathname}`);
    
    // Get file from MinIO
    minioClient.getObject(bucket, objectKey, (err, dataStream) => {
      if (err) {
        console.error('MinIO getObject error:', err);
        
        // Check if it's a "not found" error
        if (err.code === 'NoSuchKey') {
          return res.status(404).json({ 
            success: false, 
            error: 'File not found in storage',
            details: `File ${objectKey} not found in bucket ${bucket}`,
            rtrInfo: {
              id: rtr.rtrId,
              name: rtr.name,
              url: rtr.url
            }
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to download file from MinIO',
          details: err.message
        });
      }
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${rtr.name}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Pipe the file stream to response
      dataStream.pipe(res);
    });
  } catch (err) {
    console.error('Failed to download RTR Excel:', err);
    res.status(500).json({ success: false, error: 'Failed to download RTR Excel' });
  }
};

exports.analyzeRTRData = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Data array is required'
      });
    }

    const analysis = {
      newTickets: [],
      inconsistentTickets: [],
      matchingTickets: [],
      summary: {
        total: data.length,
        new: 0,
        inconsistent: 0,
        matching: 0
      }
    };

    for (const row of data) {
      const ticketCode = row.RESTN_WO_NUM || row.TASK_WO_NUM;
      
      if (!ticketCode) {
        console.warn('Row missing ticket code:', row);
        continue;
      }

      const existingTicket = await Tickets.findByTicketCode(ticketCode);
      
      if (!existingTicket) {
        analysis.newTickets.push({
          excelData: row,
          ticketCode: ticketCode
        });
        analysis.summary.new++;
      } else {
        const inconsistencies = compareTicketData(row, existingTicket);
        
        if (inconsistencies.length > 0) {
          analysis.inconsistentTickets.push({
            ticketId: existingTicket.ticketId,
            ticketCode: existingTicket.ticketCode,
            excelData: row,
            databaseData: existingTicket,
            inconsistencies: inconsistencies
          });
          analysis.summary.inconsistent++;
        } else {
          analysis.matchingTickets.push({
            ticketId: existingTicket.ticketId,
            ticketCode: existingTicket.ticketCode,
            excelData: row,
            databaseData: existingTicket
          });
          analysis.summary.matching++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (err) {
    console.error("❌ RTR analysis failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze RTR data',
      details: err.message
    });
  }
};

exports.saveRTRDataWithDecisions = async (req, res) => {
  try {
    const { newTickets, inconsistentTickets, decisions } = req.body;
    const createdBy = req.body.createdBy || 1;
    const updatedBy = req.body.updatedBy || 1;

    const results = {
      newTicketsCreated: [],
      ticketsUpdated: [],
      errors: []
    };

    // Process new tickets
    if (newTickets && Array.isArray(newTickets)) {
      for (const ticketData of newTickets) {
        try {
          const result = await RTR.processRTRData([ticketData.excelData], createdBy, updatedBy);
          results.newTicketsCreated.push({
            ticketCode: ticketData.ticketCode,
            result: result
          });
        } catch (error) {
          results.errors.push({
            ticketCode: ticketData.ticketCode,
            error: error.message
          });
        }
      }
    }

    // Process inconsistent tickets with user decisions
    if (inconsistentTickets && Array.isArray(inconsistentTickets)) {
      for (const ticketData of inconsistentTickets) {
        try {
          const finalData = applyUserDecisions(ticketData.excelData, ticketData.databaseData, decisions[ticketData.ticketId] || {});
          const result = await updateTicketWithData(ticketData.ticketId, finalData, updatedBy);
          results.ticketsUpdated.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            result: result
          });
        } catch (error) {
          results.errors.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            error: error.message
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      results: results
    });

  } catch (err) {
    console.error("❌ RTR save with decisions failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save RTR data with decisions',
      details: err.message
    });
  }
};

// Helper function to compare ticket data and find inconsistencies
function compareTicketData(excelData, databaseTicket) {
  const inconsistencies = [];
  
  // Define the fields to compare and their mappings to actual database fields
  const fieldMappings = {
    'RESTN_WO_NUM': 'ticketCode',
    'TASK_WO_NUM': 'ticketCode',
    'PGL ComD:Wments': 'comment7d',
    'Contractor Comments': 'PartnerComment',
    'SQ_MI': 'quantity',
    'Earliest_Rpt_Dt': 'earliestRptDate',
    'NOTES2_RES': 'PartnerSupervisorComment',
    'SAP_ITEM_NUM': 'contractUnitId', // This would need to be looked up
    'LOCATION2_RES': 'location', // This might be in wayfinding table
    'AGENCY_NO': 'agencyNo', // This might be in permits table
    'START_DATE': 'startDate', // This might be in permits table
    'EXP_DATE': 'expDate' // This might be in permits table
  };

  for (const [excelField, dbField] of Object.entries(fieldMappings)) {
    const excelValue = excelData[excelField];
    const dbValue = databaseTicket[dbField];
    
    // Skip if both values are null/undefined/empty
    if ((!excelValue || excelValue === '') && (!dbValue || dbValue === '')) continue;
    
    // Normalize values for comparison
    const normalizedExcel = normalizeValue(excelValue);
    const normalizedDb = normalizeValue(dbValue);
    
    if (normalizedExcel !== normalizedDb) {
      inconsistencies.push({
        field: excelField,
        databaseField: dbField,
        excelValue: excelValue,
        databaseValue: dbValue,
        type: getFieldType(excelField)
      });
    }
  }

  return inconsistencies;
}

// Helper function to normalize values for comparison
function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim().toLowerCase();
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return value.toISOString();
  return String(value).trim().toLowerCase();
}

// Helper function to get field type for UI display
function getFieldType(field) {
  const dateFields = ['Earliest_Rpt_Dt', 'START_DATE', 'EXP_DATE'];
  const numberFields = ['SQ_MI', 'AGENCY_NO'];
  const textFields = ['PGL ComD:Wments', 'Contractor Comments', 'NOTES2_RES', 'LOCATION2_RES'];
  
  if (dateFields.includes(field)) return 'date';
  if (numberFields.includes(field)) return 'number';
  if (textFields.includes(field)) return 'text';
  return 'string';
}

// Helper function to apply user decisions to ticket data
function applyUserDecisions(excelData, databaseData, decisions) {
  const finalData = { ...databaseData };
  
  // Map Excel fields to database fields
  const fieldMappings = {
    'RESTN_WO_NUM': 'ticketCode',
    'TASK_WO_NUM': 'ticketCode',
    'PGL ComD:Wments': 'comment7d',
    'Contractor Comments': 'PartnerComment',
    'SQ_MI': 'quantity',
    'Earliest_Rpt_Dt': 'earliestRptDate',
    'NOTES2_RES': 'PartnerSupervisorComment'
  };
  
  for (const [excelField, dbField] of Object.entries(fieldMappings)) {
    if (decisions[excelField] === 'excel') {
      finalData[dbField] = excelData[excelField];
    }
    // If decision is 'database' or not specified, keep the existing value (already copied)
  }
  
  return finalData;
}

// Helper function to update ticket with final data
async function updateTicketWithData(ticketId, finalData, updatedBy) {
  try {
    // Get the current ticket to preserve unchanged fields
    const currentTicket = await Tickets.findById(ticketId);
    if (!currentTicket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    // Update only the fields that were changed by user decisions
    const updateData = {
      incidentId: finalData.incidentId || currentTicket.incidentid,
      cuadranteId: finalData.cuadranteId || currentTicket.cuadranteid,
      contractUnitId: finalData.contractUnitId || currentTicket.contractunitid,
      wayfindingId: finalData.wayfindingId || currentTicket.wayfindingid,
      paymentId: finalData.paymentId || currentTicket.paymentid,
      mobilizationId: finalData.mobilizationId || currentTicket.mobilizationid,
      ticketCode: finalData.ticketCode || currentTicket.ticketcode,
      quantity: finalData.quantity || currentTicket.quantity,
      daysOutstanding: finalData.daysOutstanding || currentTicket.daysoutstanding,
      comment7d: finalData.comment7d || currentTicket.comment7d,
      PartnerComment: finalData.PartnerComment || currentTicket.partnercomment,
      contractNumber: finalData.contractNumber || currentTicket.contractnumber,
      amountToPay: finalData.amountToPay || currentTicket.amounttopay,
      ticketType: finalData.ticketType || currentTicket.tickettype
    };

    const updatedTicket = await Tickets.update(
      ticketId,
      updateData.incidentId,
      updateData.cuadranteId,
      updateData.contractUnitId,
      updateData.wayfindingId,
      updateData.paymentId,
      updateData.mobilizationId,
      updateData.ticketCode,
      updateData.quantity,
      updateData.daysOutstanding,
      updateData.comment7d,
      updateData.PartnerComment,
      updateData.contractNumber,
      updateData.amountToPay,
      updateData.ticketType,
      updatedBy
    );

    return {
      ticketId: ticketId,
      updated: true,
      message: 'Ticket updated successfully',
      updatedTicket: updatedTicket
    };
  } catch (error) {
    console.error(`Error updating ticket ${ticketId}:`, error);
    throw error;
  }
}
