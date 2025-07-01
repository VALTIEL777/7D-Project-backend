const XLSX = require("xlsx");
const RTR = require("../../models/RTR/rtr").RTR;
const NotificationService = require("../../services/NotificationService");
const { getMinioClient, generatePublicPresignedUrl } = require('../../config/minio');
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
  "SQFT_QTY_RES",
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
    // 1. Save file to MinIO in 'uploaded' folder
    const bucket = 'uploads'; // or your bucket name
    const folder = 'rtr/uploaded'; // Changed to uploaded folder
    const originalName = req.file.originalname || 'rtr-upload.xlsx';
    
    // Function to generate unique filename
    const generateUniqueFilename = async (baseName) => {
      let counter = 0;
      let finalName = baseName;
      
      while (true) {
        const objectName = `${folder}/${finalName}`;
        try {
          // Check if file exists
          await getMinioClient().statObject(bucket, objectName);
          // File exists, try with counter
          counter++;
          const nameWithoutExt = baseName.replace(/\.[^/.]+$/, ''); // Remove extension
          const ext = baseName.split('.').pop(); // Get extension
          finalName = `${nameWithoutExt}_${counter}.${ext}`;
        } catch (err) {
          if (err.code === 'NotFound') {
            // File doesn't exist, we can use this name
            return finalName;
          }
          throw err;
        }
      }
    };
    
    // Generate unique filename
    const uniqueFilename = await generateUniqueFilename(originalName);
    const objectName = `${folder}/${uniqueFilename}`;
    
    console.log(`Original filename: ${originalName}`);
    console.log(`Final object name: ${objectName}`);

    // Ensure bucket exists
    const bucketExists = await getMinioClient().bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await getMinioClient().makeBucket(bucket);
      
      // Set bucket policy to allow public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`]
          }
        ]
      };
      
      await getMinioClient().setBucketPolicy(bucket, JSON.stringify(policy));
      console.log(`Set public read policy for bucket: ${bucket}`);
    }

    await getMinioClient().putObject(bucket, objectName, req.file.buffer);

    // 2. Store the object key instead of constructing a URL
    // This makes file retrieval more reliable
    const fileUrl = objectName; // Store just the object key

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
        console.log(`=== Excel Processing Debug ===`);
        console.log(`Headers found:`, headers);
        console.log(`Column mapping:`, colIndexMap);
        console.log(`SQFT_QTY_RES mapped to index: ${colIndexMap['SQFT_QTY_RES']}`);
        
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
            } else if (key === "SQFT_QTY_RES") {
              // Special handling for quantity column - ensure it's a number
              let quantity = null;
              if (raw !== null && raw !== undefined && raw !== "") {
                // Convert to number, handling various formats
                if (typeof raw === "number") {
                  quantity = raw;
                } else if (typeof raw === "string") {
                  // Remove any non-numeric characters except decimal point
                  const cleanValue = raw.toString().replace(/[^\d.-]/g, '');
                  quantity = parseFloat(cleanValue);
                  if (isNaN(quantity)) {
                    quantity = null;
                  }
                } else {
                  quantity = parseFloat(raw);
                  if (isNaN(quantity)) {
                    quantity = null;
                  }
                }
              }
              entry[key] = quantity;
              console.log(`SQFT_QTY_RES processing: raw="${raw}" (type: ${typeof raw}) -> quantity=${quantity}`);
            } else {
              entry[key] = raw ?? null;
            }
          }

          entry.ticketType = "regular"; // Since we're only processing Seven-D sheet
          dataRows.push(entry);
        }

        // Save to database if requested
        let databaseResults = null;
        let generatedFileUrl = null;
        
        if (saveToDatabase && dataRows.length > 0) {
          try {
            databaseResults = await RTR.processRTRData(dataRows, createdBy, updatedBy);
            
            // Generate and save processed Excel file
            try {
              const processedExcelBuffer = await generateProcessedExcel(dataRows, databaseResults, rtrRecord.rtrId);
              const originalFileName = req.file.originalname || 'rtr-upload.xlsx';
              const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
              const ext = originalFileName.split('.').pop(); // Get extension
              const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
              const generatedFileName = `${baseName}_processed_${timestamp}.${ext}`;
              const generatedFile = await saveGeneratedFile(processedExcelBuffer, generatedFileName, rtrRecord.rtrId);
              generatedFileUrl = generatedFile.fileUrl;
              
              console.log(`Generated processed Excel file: ${generatedFileUrl}`);
            } catch (genError) {
              console.error("Failed to generate processed Excel file:", genError);
            }
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
      savedToDatabase: saveToDatabase,
      generatedFileUrl: generatedFileUrl
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

exports.listRTRFiles = async (req, res) => {
  try {
    const bucket = 'uploads';
    const uploadedFolder = 'rtr/uploaded';
    const generatedFolder = 'rtr/generated';
    
    // Check if bucket exists first, create it if it doesn't
    const bucketExists = await getMinioClient().bucketExists(bucket).catch((err) => {
      console.error(`Error checking bucket existence:`, err);
      return false;
    });
    
    if (!bucketExists) {
      try {
        await getMinioClient().makeBucket(bucket);
        
        // Set bucket policy to allow public read access
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`]
            }
          ]
        };
        
        await getMinioClient().setBucketPolicy(bucket, JSON.stringify(policy));
      } catch (makeBucketError) {
        console.error(`Failed to create bucket ${bucket}:`, makeBucketError);
        // If we can't create the bucket, return empty lists
        return res.status(200).json({ 
          success: true, 
          files: {
            uploaded: [],
            generated: []
          },
          debug: {
            bucketExists: false,
            error: makeBucketError.message
          }
        });
      }
    }
    
    // Helper function to list files from a folder
    const listFilesFromFolder = async (folderPath) => {
      const files = [];
      return new Promise((resolve, reject) => {
        try {
          const stream = getMinioClient().listObjects(bucket, folderPath, true);
          
          stream.on('data', async (obj) => {
            try {
              // Generate presigned URL for download (valid for 1 hour) with public hostname
              const presignedUrl = await generatePublicPresignedUrl(bucket, obj.name, 3600, req);
              
              files.push({
                name: obj.name.replace(folderPath + '/', ''),
          size: obj.size,
          lastModified: obj.lastModified,
                type: folderPath === uploadedFolder ? 'uploaded' : 'generated',
                url: presignedUrl,
                objectKey: obj.name
              });
            } catch (urlError) {
              console.error(`Failed to generate presigned URL for ${obj.name}:`, urlError);
              files.push({
                name: obj.name.replace(folderPath + '/', ''),
          size: obj.size,
          lastModified: obj.lastModified,
                type: folderPath === uploadedFolder ? 'uploaded' : 'generated',
                url: null,
                objectKey: obj.name,
                error: 'Failed to generate download URL'
              });
          }
          });
        
          stream.on('end', () => {
            resolve(files);
          });
          
          stream.on('error', (err) => {
            console.error(`Stream error for ${folderPath}:`, err);
            reject(err);
          });
        } catch (streamError) {
          console.error(`Failed to create stream for ${folderPath}:`, streamError);
          resolve([]);
        }
      });
    };
    
    // List both uploaded and generated files concurrently
    const [uploadedFiles, generatedFiles] = await Promise.all([
      listFilesFromFolder(uploadedFolder),
      listFilesFromFolder(generatedFolder)
    ]);
    
    res.status(200).json({ 
      success: true, 
      files: {
        uploaded: uploadedFiles,
        generated: generatedFiles
      },
      debug: {
        bucketExists: bucketExists,
        bucket: bucket,
        uploadedFolder: uploadedFolder,
        generatedFolder: generatedFolder
      }
    });
  } catch (err) {
    console.error('Failed to list RTR files:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list RTR files',
      details: err.message,
      stack: err.stack
    });
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
    
    // Try to extract bucket and object key from URL
    let bucket, objectKey;
    
    try {
    const url = new URL(rtr.url);
      bucket = url.pathname.split('/')[1];
    // Decode the URL-encoded object key
      objectKey = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
    } catch (urlError) {
      console.error('Failed to parse URL:', rtr.url, urlError);
      // Fallback: assume the URL is just the object key
      bucket = 'uploads';
      objectKey = rtr.url.replace(/^https?:\/\/[^\/]+\//, '');
    }
    
    console.log(`Attempting to download from MinIO - Bucket: ${bucket}, Key: ${objectKey}`);
    console.log(`Original URL: ${rtr.url}`);
    
    // Get file from MinIO
    getMinioClient().getObject(bucket, objectKey, (err, dataStream) => {
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

// New direct download function using object key
exports.downloadFileByKey = async (req, res) => {
  try {
    const { bucket = 'uploads', objectKey } = req.params;
    
    if (!objectKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Object key is required'
      });
    }
    
    // Decode the object key if it's URL-encoded
    const decodedObjectKey = decodeURIComponent(objectKey);
    
    console.log(`Direct download - Bucket: ${bucket}, Key: ${decodedObjectKey}`);
    console.log(`Original encoded key: ${objectKey}`);
    
    // Get file from MinIO
    getMinioClient().getObject(bucket, decodedObjectKey, (err, dataStream) => {
      if (err) {
        console.error('MinIO getObject error:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        
        // Check if it's a "not found" error
        if (err.code === 'NoSuchKey') {
          return res.status(404).json({ 
            success: false, 
            error: 'File not found in storage',
            details: `File ${decodedObjectKey} not found in bucket ${bucket}`,
            debug: {
              bucket: bucket,
              objectKey: decodedObjectKey,
              originalEncodedKey: objectKey
            }
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to download file from MinIO',
          details: err.message,
          debug: {
            bucket: bucket,
            objectKey: decodedObjectKey,
            originalEncodedKey: objectKey
          }
        });
      }
      
      // Extract filename from object key
      const filename = decodedObjectKey.split('/').pop() || 'download.xlsx';
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Pipe the file stream to response
      dataStream.pipe(res);
    });
  } catch (err) {
    console.error('Failed to download file by key:', err);
    res.status(500).json({ success: false, error: 'Failed to download file' });
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
      const ticketCode = row.TASK_WO_NUM; // Only use TASK_WO_NUM for database lookup
      
      if (!ticketCode) {
        console.warn('Row missing TASK_WO_NUM:', row);
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
          console.error(`Error processing ticket ${ticketData.ticketId}:`, error);
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
    console.error("RTR save with decisions failed:", err);
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
  // Based on how data is stored in createTicket function:
  // - row['PGL ComD:Wments'] -> partnerComment (Contractor field)
  // - row['Contractor Comments'] -> comment7d (7D field)
  const fieldMappings = {
    'TASK_WO_NUM': 'ticketcode',  // Compare TASK_WO_NUM with database ticketcode
    'PGL ComD:Wments': 'partnercomment',  // PGL comments go to partnerComment field
    'Contractor Comments': 'comment7d',   // Contractor comments go to comment7d field
    'NOTES2_RES': 'partnersupervisorcomment'
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
        type: getFieldType(excelField),
        // Add additional context information
        taskWoNum: excelData.TASK_WO_NUM || databaseTicket.ticketcode,
        address: excelData.ADDRESS || databaseTicket.address || 'N/A',
        restWoNum: excelData.RESTN_WO_NUM || 'N/A'
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
  
  // Apply decisions directly using the field names from inconsistencies
  for (const [field, choice] of Object.entries(decisions)) {
    if (choice === 'excel') {
      // Use the Excel value for this field
      if (excelData[field] !== undefined) {
        // Map Excel field to database field
        const dbField = getDatabaseFieldMapping(field);
        if (dbField) {
          finalData[dbField] = excelData[field];
        } else {
          console.warn(`No database field mapping found for Excel field: ${field}`);
        }
      } else {
        console.warn(`Excel field "${field}" not found in excelData`);
      }
    } else if (choice === 'database') {
      // Keep the database value (already copied in finalData)
      // No action needed
    } else {
      console.warn(`Unknown choice "${choice}" for field "${field}"`);
    }
  }
  
  return finalData;
}

// Helper function to map Excel field names to database field names
function getDatabaseFieldMapping(excelField) {
  const fieldMappings = {
    'TASK_WO_NUM': 'ticketCode',
    'RESTN_WO_NUM': 'ticketCode',
    'PGL ComD:Wments': 'partnercomment',
    'Contractor Comments': 'comment7d',
    'NOTES2_RES': 'partnersupervisorcomment',
    'SQ_MI': 'quantity',
    'Earliest_Rpt_Dt': 'earliestRptDate',
    'ADDRESS': 'address',
    'SAP_ITEM_NUM': 'sapItemNum'
  };
  
  return fieldMappings[excelField] || null;
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
      PartnerComment: finalData.partnercomment || currentTicket.partnercomment,
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

// Function to save generated files to MinIO
async function saveGeneratedFile(fileBuffer, fileName, rtrId) {
  const bucket = 'uploads';
  const folder = 'rtr/generated';
  
  // Create a more descriptive filename
  const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  const ext = fileName.split('.').pop(); // Get extension
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const descriptiveName = `${baseName}_processed_${timestamp}.${ext}`;
  const objectName = `${folder}/${descriptiveName}`;

  // Ensure bucket exists
  const bucketExists = await getMinioClient().bucketExists(bucket).catch(() => false);
  if (!bucketExists) {
    await getMinioClient().makeBucket(bucket);
  }

  await getMinioClient().putObject(bucket, objectName, fileBuffer);
  
  // Return the object key instead of constructing a URL
  // This makes file retrieval more reliable
  const fileUrl = objectName; // Store just the object key
  return { objectName, fileUrl };
}

// Function to generate processed Excel file
async function generateProcessedExcel(originalData, processedResults, rtrId) {
  const workbook = XLSX.utils.book_new();
  
  // Create a summary sheet
  const summaryData = [
    ['RTR Processing Summary'],
    [''],
    ['Original File ID:', rtrId],
    ['Processing Date:', new Date().toISOString()],
    ['Total Rows Processed:', originalData.length],
    ['Successful Tickets:', processedResults.filter(r => r.success).length],
    ['Failed Tickets:', processedResults.filter(r => !r.success).length],
    [''],
    ['Processing Results:'],
    ['Ticket ID', 'Status', 'Message', 'Amount Calculated']
  ];
  
  processedResults.forEach(result => {
    if (result.success) {
      summaryData.push([
        result.ticketId,
        'SUCCESS',
        result.message,
        result.amountToPay || 'N/A'
      ]);
    } else {
      summaryData.push([
        'N/A',
        'FAILED',
        result.error,
        'N/A'
      ]);
    }
  });
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Processing Summary');
  
  // Create processed data sheet
  const processedData = originalData.map((row, index) => {
    const result = processedResults[index];
    return {
      'Row Number': index + 1,
      'Status': result.success ? 'SUCCESS' : 'FAILED',
      'Ticket ID': result.success ? result.ticketId : 'N/A',
      'SAP Item Code': row.SAP_ITEM_NUM,
      'Quantity (SQFT_QTY_RES)': row.SQFT_QTY_RES,
      'Amount Calculated': result.success ? (result.amountToPay || 'N/A') : 'N/A',
      'Error Message': result.success ? '' : result.error,
      'RESTN_WO_NUM': row.RESTN_WO_NUM,
      'TASK_WO_NUM': row.TASK_WO_NUM,
      'Quadrant': row.SQ_MI,
      'Location': row.LOCATION2_RES
    };
  });
  
  const processedSheet = XLSX.utils.json_to_sheet(processedData);
  XLSX.utils.book_append_sheet(workbook, processedSheet, 'Processed Data');
  
  // Generate the Excel file buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return excelBuffer;
}

exports.uploadForStepper = async (req, res) => {
  try {
    // Parse Excel file but don't save to MinIO yet
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    
    if (!workbook.SheetNames.includes('Seven-D')) {
      return res.status(400).json({
        success: false,
        error: 'Sheet "Seven-D" not found in the Excel file',
        availableSheets: workbook.SheetNames
      });
    }

    const sheetName = 'Seven-D';
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sheet "Seven-D" is empty'
      });
    }

    // Parse data using existing logic
    const parsedData = await parseExcelData(rows, sheetName);
    
    if (!parsedData.success) {
      return res.status(400).json(parsedData);
    }

    // Store file buffer as base64 to avoid JSON serialization issues
    const fileInfo = {
      originalName: req.file.originalname || 'rtr-upload.xlsx',
      buffer: req.file.buffer.toString('base64'), // Convert to base64
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    return res.status(200).json({
      success: true,
      fileInfo: fileInfo,
      parsedData: parsedData.data,
      totalRows: parsedData.data.length,
      message: 'File parsed successfully. Ready for analysis.'
    });

  } catch (err) {
    console.error("❌ File upload for stepper failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: err.message
    });
  }
};

exports.analyzeForStepper = async (req, res) => {
  try {
    const { parsedData } = req.body;
    
    if (!parsedData || !Array.isArray(parsedData)) {
      return res.status(400).json({
        success: false,
        error: 'Parsed data array is required'
      });
    }

    const analysis = {
      newTickets: [],
      inconsistentTickets: [],
      matchingTickets: [],
      missingInfo: [],
      summary: {
        total: parsedData.length,
        new: 0,
        inconsistent: 0,
        matching: 0,
        missingInfo: 0
      }
    };

    for (const row of parsedData) {
      const ticketCode = row.TASK_WO_NUM; // Only use TASK_WO_NUM for database lookup
      
      if (!ticketCode) {
        analysis.missingInfo.push({
          ticketCode: 'N/A',
          taskWoNum: row.TASK_WO_NUM || 'N/A',
          address: row.ADDRESS || 'N/A',
          restWoNum: row.RESTN_WO_NUM || 'N/A',
          row: row,
          missingField: 'TASK_WO_NUM',
          type: 'critical',
          description: 'Missing TASK_WO_NUM (required for database lookup)'
        });
        analysis.summary.missingInfo++;
        continue;
      }

      // Auto-assign quantity = 1 if null or missing
      const processedRow = { ...row };
      if (!processedRow.SQFT_QTY_RES || processedRow.SQFT_QTY_RES === null || processedRow.SQFT_QTY_RES === '') {
        processedRow.SQFT_QTY_RES = 1;
      }

      // Search for existing ticket using only TASK_WO_NUM
      let existingTicket = null;
      
      console.log(`\n=== Analyzing ticket ===`);
      console.log(`TASK_WO_NUM: "${row.TASK_WO_NUM}"`);
      console.log(`RESTN_WO_NUM: "${row.RESTN_WO_NUM}" (for reference only)`);
      
      // Only search with TASK_WO_NUM (since that's what's stored in the database)
      existingTicket = await Tickets.findByTicketCode(row.TASK_WO_NUM);
      console.log(`Searched with TASK_WO_NUM: "${row.TASK_WO_NUM}" - Found: ${!!existingTicket}`);
      
      if (existingTicket) {
        console.log(`Found existing ticket:`, {
          ticketId: existingTicket.ticketid,
          ticketCode: existingTicket.ticketcode
        });
      } else {
        console.log(`No existing ticket found - this should be a NEW ticket`);
      }
      
      if (!existingTicket) {
        // Check for missing required information (excluding quantity since we auto-assigned it)
        const missingFields = checkMissingRequiredFields(processedRow);
        if (missingFields.length > 0) {
          console.log(`Missing required fields:`, missingFields);
          analysis.missingInfo.push({
            ticketCode: ticketCode,
            taskWoNum: processedRow.TASK_WO_NUM || 'N/A',
            address: processedRow.ADDRESS || 'N/A',
            restWoNum: processedRow.RESTN_WO_NUM || 'N/A',
            row: processedRow,
            missingFields: missingFields,
            type: 'required',
            description: `Missing ${missingFields.length} required field(s)`
          });
          analysis.summary.missingInfo++;
        } else {
          console.log(`Adding to newTickets`);
          analysis.newTickets.push({
            excelData: processedRow,
            ticketCode: ticketCode,
            taskWoNum: processedRow.TASK_WO_NUM || 'N/A',
            address: processedRow.ADDRESS || 'N/A',
            restWoNum: processedRow.RESTN_WO_NUM || 'N/A'
          });
          analysis.summary.new++;
        }
      } else {
        console.log(`Comparing data for existing ticket`);
        const inconsistencies = compareTicketData(processedRow, existingTicket);
        console.log(`Found ${inconsistencies.length} inconsistencies:`, inconsistencies);
        
        if (inconsistencies.length > 0) {
          console.log(`Adding to inconsistentTickets`);
          analysis.inconsistentTickets.push({
            ticketId: existingTicket.ticketId,
            ticketCode: existingTicket.ticketCode,
            taskWoNum: processedRow.TASK_WO_NUM || existingTicket.ticketcode || 'N/A',
            address: processedRow.ADDRESS || 'N/A',
            restWoNum: processedRow.RESTN_WO_NUM || 'N/A',
            excelData: processedRow,
            databaseData: existingTicket,
            inconsistencies: inconsistencies
          });
          analysis.summary.inconsistent++;
        } else {
          console.log(`Adding to matchingTickets`);
          analysis.matchingTickets.push({
            ticketId: existingTicket.ticketId,
            ticketCode: existingTicket.ticketCode,
            taskWoNum: processedRow.TASK_WO_NUM || existingTicket.ticketcode || 'N/A',
            address: processedRow.ADDRESS || 'N/A',
            restWoNum: processedRow.RESTN_WO_NUM || 'N/A',
            excelData: processedRow,
            databaseData: existingTicket
          });
          analysis.summary.matching++;
        }
      }
    }

    console.log(`\n=== Final Analysis Summary ===`);
    console.log(`New tickets: ${analysis.summary.new}`);
    console.log(`Inconsistent tickets: ${analysis.summary.inconsistent}`);
    console.log(`Matching tickets: ${analysis.summary.matching}`);
    console.log(`Missing info: ${analysis.summary.missingInfo}`);

    return res.status(200).json({
      success: true,
      analysis: analysis,
      message: 'Analysis completed successfully'
    });

  } catch (err) {
    console.error("❌ RTR analysis for stepper failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze RTR data',
      details: err.message
    });
  }
};

exports.validateStepperData = async (req, res) => {
  try {
    const { 
      newTickets, 
      inconsistentTickets, 
      decisions, 
      missingInfoFilled,
      skippedRows 
    } = req.body;

    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalTickets: 0,
        validTickets: 0,
        invalidTickets: 0,
        skippedTickets: 0
      }
    };

    // Validate new tickets
    if (newTickets && Array.isArray(newTickets)) {
      for (const ticket of newTickets) {
        const ticketValidation = validateTicketData(ticket.excelData);
        if (!ticketValidation.isValid) {
          validation.isValid = false;
          validation.errors.push({
            ticketCode: ticket.ticketCode,
            errors: ticketValidation.errors
          });
          validation.summary.invalidTickets++;
        } else {
          validation.summary.validTickets++;
        }
        validation.summary.totalTickets++;
      }
    }

    // Validate inconsistent tickets with decisions
    if (inconsistentTickets && Array.isArray(inconsistentTickets)) {
      for (const ticket of inconsistentTickets) {
        const finalData = applyUserDecisions(ticket.excelData, ticket.databaseData, decisions[ticket.ticketId] || {});
        const ticketValidation = validateTicketData(finalData);
        if (!ticketValidation.isValid) {
          validation.isValid = false;
          validation.errors.push({
            ticketId: ticket.ticketId,
            ticketCode: ticket.ticketCode,
            errors: ticketValidation.errors
          });
          validation.summary.invalidTickets++;
        } else {
          validation.summary.validTickets++;
        }
        validation.summary.totalTickets++;
      }
    }

    // Validate filled missing information
    if (missingInfoFilled && Array.isArray(missingInfoFilled)) {
      for (const filledInfo of missingInfoFilled) {
        const ticketValidation = validateTicketData(filledInfo.data);
        if (!ticketValidation.isValid) {
          validation.isValid = false;
          validation.errors.push({
            ticketCode: filledInfo.ticketCode,
            errors: ticketValidation.errors
          });
          validation.summary.invalidTickets++;
        } else {
          validation.summary.validTickets++;
        }
        validation.summary.totalTickets++;
      }
    }

    // Count skipped tickets
    if (skippedRows && Array.isArray(skippedRows)) {
      validation.summary.skippedTickets = skippedRows.length;
    }

    return res.status(200).json({
      success: true,
      validation: validation,
      message: validation.isValid ? 'All data is valid and ready to save' : 'Please fix validation errors before proceeding'
    });

  } catch (err) {
    console.error("❌ Data validation failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate data',
      details: err.message
    });
  }
};

exports.saveStepperData = async (req, res) => {
  try {
    const { 
      fileInfo,
      newTickets, 
      inconsistentTickets, 
      decisions, 
      missingInfoFilled,
      skippedRows,
      createdBy,
      updatedBy 
    } = req.body;

    const results = {
      newTicketsCreated: [],
      ticketsUpdated: [],
      skippedTickets: [],
      errors: [],
      summary: {
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0
      }
    };

    // Step 1: Save the original file to MinIO
    let rtrRecord = null;
    let originalFileUrl = null;
    
    if (fileInfo && fileInfo.buffer) {
      try {
        const bucket = 'uploads';
        const folder = 'rtr/uploaded';
        const originalName = fileInfo.originalName || 'rtr-upload.xlsx';
        
        // Function to generate unique filename (same as uploadExcel)
        const generateUniqueFilename = async (baseName) => {
          let counter = 0;
          let finalName = baseName;
          
          while (true) {
            const objectName = `${folder}/${finalName}`;
            try {
              // Check if file exists
              await getMinioClient().statObject(bucket, objectName);
              // File exists, try with counter
              counter++;
              const nameWithoutExt = baseName.replace(/\.[^/.]+$/, ''); // Remove extension
              const ext = baseName.split('.').pop(); // Get extension
              finalName = `${nameWithoutExt}_${counter}.${ext}`;
            } catch (err) {
              if (err.code === 'NotFound') {
                // File doesn't exist, we can use this name
                return finalName;
              }
              throw err;
            }
          }
        };
        
        // Generate unique filename
        const uniqueFilename = await generateUniqueFilename(originalName);
        const objectName = `${folder}/${uniqueFilename}`;
        
        console.log(`Stepper - Original filename: ${originalName}`);
        console.log(`Stepper - Final object name: ${objectName}`);

        // Ensure bucket exists
        const bucketExists = await getMinioClient().bucketExists(bucket).catch(() => false);
        if (!bucketExists) {
          await getMinioClient().makeBucket(bucket);
        }

        // Convert base64 buffer back to Buffer
        const fileBuffer = Buffer.from(fileInfo.buffer, 'base64');
        
        await getMinioClient().putObject(bucket, objectName, fileBuffer);
        
        // Store the object key instead of constructing a URL
        // This makes file retrieval more reliable
        originalFileUrl = objectName; // Store just the object key

        // Save metadata to RTRs table
        rtrRecord = await RTR.saveRTRFile(originalName, originalFileUrl);
      } catch (fileError) {
        console.error("Failed to save original file to MinIO:", fileError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save original file',
          details: fileError.message
        });
      }
    }

    // Step 2: Process new tickets
    if (newTickets && Array.isArray(newTickets)) {
      for (let i = 0; i < newTickets.length; i++) {
        const ticketData = newTickets[i];
        
        try {
          const result = await RTR.processRTRData([ticketData.excelData], createdBy || 1, updatedBy || 1);
          
          results.newTicketsCreated.push({
            ticketCode: ticketData.ticketCode,
            result: result
          });
          results.summary.created++;
        } catch (error) {
          console.error(`Error processing ticket ${ticketData.ticketCode}:`, error);
          results.errors.push({
            ticketCode: ticketData.ticketCode,
            error: error.message
          });
          results.summary.failed++;
        }
        results.summary.total++;
      }
    }

    // Step 2.5: Generate TicketStatus records for new tickets
    let ticketStatusResults = null;
    try {
      console.log('Generating TicketStatus records for new tickets...');
      
      // Extract ticket IDs from successfully created tickets
      const newTicketIds = results.newTicketsCreated
        .filter(ticket => ticket.result && ticket.result.length > 0 && ticket.result[0].success)
        .map(ticket => ticket.result[0].ticketId)
        .filter(id => id); // Filter out any undefined IDs
      
      if (newTicketIds.length > 0) {
        console.log(`Generating TicketStatus records for ${newTicketIds.length} new tickets:`, newTicketIds);
        ticketStatusResults = await RTR.generateTicketStatusesForTickets(newTicketIds, updatedBy || 1);
        console.log(`TicketStatus generation completed: ${ticketStatusResults.summary.totalStatusesCreated} statuses created`);
      } else {
        console.log('No new tickets to generate TicketStatus records for');
      }
    } catch (ticketStatusError) {
      console.error("Failed to generate TicketStatus records:", ticketStatusError);
      // Don't fail the entire operation if TicketStatus generation fails
    }

    // Step 3: Process inconsistent tickets with user decisions
    if (inconsistentTickets && Array.isArray(inconsistentTickets)) {
      for (let i = 0; i < inconsistentTickets.length; i++) {
        const ticketData = inconsistentTickets[i];
        
        try {
          const finalData = applyUserDecisions(ticketData.excelData, ticketData.databaseData, decisions[ticketData.ticketId] || {});
          
          const result = await updateTicketWithData(ticketData.ticketId, finalData, updatedBy || 1);
          
          results.ticketsUpdated.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            result: result
          });
          results.summary.updated++;
        } catch (error) {
          console.error(`Error updating ticket ${ticketData.ticketCode}:`, error);
          results.errors.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            error: error.message
          });
          results.summary.failed++;
        }
        results.summary.total++;
      }
    }

    // Step 4: Process filled missing information
    if (missingInfoFilled && Array.isArray(missingInfoFilled)) {
      for (let i = 0; i < missingInfoFilled.length; i++) {
        const filledInfo = missingInfoFilled[i];
        
        try {
          const result = await RTR.processRTRData([filledInfo.data], createdBy || 1, updatedBy || 1);
          
          results.newTicketsCreated.push({
            ticketCode: filledInfo.ticketCode,
            result: result
          });
          results.summary.created++;
        } catch (error) {
          console.error(`Error processing filled info ${filledInfo.ticketCode}:`, error);
          results.errors.push({
            ticketCode: filledInfo.ticketCode,
            error: error.message
          });
          results.summary.failed++;
        }
        results.summary.total++;
      }
    }

    // Step 5: Record skipped tickets
    if (skippedRows && Array.isArray(skippedRows)) {
      results.skippedTickets = skippedRows.map(row => ({
        ticketCode: row.RESTN_WO_NUM || row.TASK_WO_NUM,
        reason: row.reason || 'User skipped'
      }));
      results.summary.skipped = skippedRows.length;
    }

    // Step 6: Generate processed Excel file
    let generatedFileUrl = null;
    if (rtrRecord && rtrRecord.rtrId) {
      try {
        const allProcessedData = [
          ...(newTickets || []).map(t => ({ ...t.excelData, status: 'created' })),
          ...(inconsistentTickets || []).map(t => ({ ...t.excelData, status: 'updated' })),
          ...(missingInfoFilled || []).map(t => ({ ...t.data, status: 'created' })),
          ...(skippedRows || []).map(t => ({ ...t, status: 'skipped' }))
        ];

        const processedExcelBuffer = await generateProcessedExcel(allProcessedData, results, rtrRecord.rtrId);
        const originalFileName = fileInfo?.originalName || 'rtr-upload.xlsx';
        const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
        const ext = originalFileName.split('.').pop(); // Get extension
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const generatedFileName = `${baseName}_stepper_processed_${timestamp}.${ext}`;
        const generatedFile = await saveGeneratedFile(processedExcelBuffer, generatedFileName, rtrRecord.rtrId);
        generatedFileUrl = generatedFile.fileUrl;
      } catch (genError) {
        console.error("Failed to generate processed Excel file:", genError);
      }
    }

    // Step 7: Update permit statuses based on expiration dates
    let permitStatusResults = null;
    try {
      console.log('Updating permit statuses and checking for permits expiring within 7 days...');
      permitStatusResults = await RTR.updatePermitStatusesAndCheckExpiring(updatedBy || 1);
      console.log(`Comprehensive permit update completed: ${permitStatusResults.summary.permitsStatusUpdated} permits updated, ${permitStatusResults.summary.ticketsCommentUpdated} tickets updated`);
    } catch (permitError) {
      console.error("Failed to update permit statuses and check expiring permits:", permitError);
      // Don't fail the entire operation if permit status update fails
    }

    return res.status(200).json({
      success: true,
      message: 'All data saved successfully',
      data: {
      rtrId: rtrRecord?.rtrId,
        originalFileName: fileInfo?.originalName,
        generatedFileName: generatedFileUrl ? generatedFileUrl.split('/').pop() : null,
        objectKey: generatedFileUrl,
        downloadUrl: generatedFileUrl ? await generatePublicPresignedUrl('uploads', generatedFileUrl, 3600, req) : null,
        summary: {
          newTicketsCreated: results.summary.created,
          ticketsUpdated: results.summary.updated,
          missingInfoFilled: results.summary.created - (newTickets?.length || 0),
          skippedRows: results.summary.skipped
        },
        ticketStatusGeneration: ticketStatusResults ? {
          totalTickets: ticketStatusResults.summary.totalTickets,
          processed: ticketStatusResults.summary.processed,
          successful: ticketStatusResults.summary.successful,
          failed: ticketStatusResults.summary.failed,
          totalPhasesFound: ticketStatusResults.summary.totalPhasesFound,
          totalStatusesCreated: ticketStatusResults.summary.totalStatusesCreated
        } : null,
        permitStatusUpdate: permitStatusResults ? {
          permits: {
            total: permitStatusResults.summary.totalPermitsChecked,
            statusUpdated: permitStatusResults.summary.permitsStatusUpdated,
            unchanged: permitStatusResults.summary.totalPermitsChecked - permitStatusResults.summary.permitsStatusUpdated,
            statusChanges: {
              toExpired: permitStatusResults.statusUpdates.filter(r => r.updated && r.newStatus === 'EXPIRED').length,
              toExpiresToday: permitStatusResults.statusUpdates.filter(r => r.updated && r.newStatus === 'EXPIRES_TODAY').length,
              toActive: permitStatusResults.statusUpdates.filter(r => r.updated && r.newStatus === 'ACTIVE').length,
              toPending: permitStatusResults.statusUpdates.filter(r => r.updated && r.newStatus === 'PENDING').length
            }
          },
          tickets: {
            total: permitStatusResults.summary.totalTicketsChecked,
            commentUpdated: permitStatusResults.summary.ticketsCommentUpdated,
            unchanged: permitStatusResults.summary.totalTicketsChecked - permitStatusResults.summary.ticketsCommentUpdated
          }
        } : null
      }
    });

  } catch (err) {
    console.error("RTR stepper save failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save stepper data',
      details: err.message
    });
  }
};

// Helper function to parse Excel data (extracted from existing uploadExcel function)
async function parseExcelData(rows, sheetName) {
  try {
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
      return {
        success: false,
        error: "Could not detect header row",
        message: "No row matched expected column names."
      };
    }

    const headers = rows[headerRowIndex];
    const colIndexMap = {};
    importantColumns.forEach((col) => {
      const idx = getClosestHeaderIndex(col, headers);
      if (idx !== -1) colIndexMap[col] = idx;
    });

    const missing = importantColumns.filter((col) => !(col in colIndexMap));
    if (missing.length > 0) {
      return {
        success: false,
        error: "Missing required columns",
        missing: missing
      };
    }

    const dataRows = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (isRowEmpty(row)) break;

      const entry = {};
      for (const [key, idx] of Object.entries(colIndexMap)) {
        const raw = row[idx];

        if (["Earliest_Rpt_Dt", "START_DATE", "EXP_DATE"].includes(key) && typeof raw === "number") {
          entry[key] = parseDateValue(raw);
        } else if (key === "length_x_width") {
          entry[key] = raw ?? null;
          const { length, width } = extractDimensions(raw);
          entry["length"] = length;
          entry["width"] = width;
        } else if (key === "ADDRESS") {
          entry[key] = raw ?? null;
          const { addressNumber, addressCardinal, addressStreet, addressSuffix } = parseAddress(raw);
          entry["addressNumber"] = addressNumber;
          entry["addressCardinal"] = addressCardinal;
          entry["addressStreet"] = addressStreet;
          entry["addressSuffix"] = addressSuffix;
        } else if (key === "STREET_FROM_RES") {
          entry[key] = raw ?? null;
          const { number, cardinal, street, suffix } = parseRangeAddress(raw);
          entry["fromAddressNumber"] = number;
          entry["fromAddressCardinal"] = cardinal;
          entry["fromAddressStreet"] = street;
          entry["fromAddressSuffix"] = suffix;
        } else if (key === "STREET_TO_RES") {
          entry[key] = raw ?? null;
          const { number, cardinal, street, suffix } = parseRangeAddress(raw);
          entry["toAddressNumber"] = number;
          entry["toAddressCardinal"] = cardinal;
          entry["toAddressStreet"] = street;
          entry["toAddressSuffix"] = suffix;
        } else if (key === "SQFT_QTY_RES") {
          let quantity = null;
          if (raw !== null && raw !== undefined && raw !== "") {
            if (typeof raw === "number") {
              quantity = raw;
            } else if (typeof raw === "string") {
              const cleanValue = raw.toString().replace(/[^\d.-]/g, '');
              quantity = parseFloat(cleanValue);
              if (isNaN(quantity)) {
                quantity = null;
              }
            } else {
              quantity = parseFloat(raw);
              if (isNaN(quantity)) {
                quantity = null;
              }
            }
          }
          entry[key] = quantity;
        } else {
          entry[key] = raw ?? null;
        }
      }

      entry.ticketType = "regular";
      dataRows.push(entry);
    }

    return {
      success: true,
      data: dataRows
    };

  } catch (error) {
    return {
      success: false,
      error: "Failed to parse Excel data",
      details: error.message
    };
  }
}

// Helper function to check for missing required fields
function checkMissingRequiredFields(row) {
  const requiredFields = [
    { field: 'RESTN_WO_NUM', name: 'Rest Number' },
    { field: 'TASK_WO_NUM', name: 'Task Number' },
    { field: 'SAP_ITEM_NUM', name: 'SAP Item Number' },
    { field: 'ADDRESS', name: 'Address' }
  ];

  const missing = [];
  for (const required of requiredFields) {
    if (!row[required.field] || row[required.field] === '' || row[required.field] === null) {
      missing.push({
        field: required.field,
        name: required.name,
        type: 'required'
      });
    }
  }

  return missing;
}

// Helper function to validate ticket data
function validateTicketData(data) {
  const validation = {
    isValid: true,
    errors: []
  };

  // Check required fields (excluding quantity since we auto-assign it)
  const requiredFields = [
    { field: 'RESTN_WO_NUM', name: 'Rest Number' },
    { field: 'TASK_WO_NUM', name: 'Task Number' },
    { field: 'SAP_ITEM_NUM', name: 'SAP Item Number' },
    { field: 'ADDRESS', name: 'Address' }
  ];

  for (const required of requiredFields) {
    if (!data[required.field] || data[required.field] === '' || data[required.field] === null) {
      validation.isValid = false;
      validation.errors.push(`Missing required field: ${required.name}`);
    }
  }

  // Validate quantity is a positive number (including auto-assigned value)
  if (data.SQFT_QTY_RES !== null && data.SQFT_QTY_RES !== undefined) {
    const quantity = parseFloat(data.SQFT_QTY_RES);
    if (isNaN(quantity) || quantity <= 0) {
      validation.isValid = false;
      validation.errors.push('Quantity must be a positive number');
    }
  } else {
    // If quantity is still null/undefined, auto-assign it to 1
    data.SQFT_QTY_RES = 1;
  }

  // Validate dates
  const dateFields = ['Earliest_Rpt_Dt', 'START_DATE', 'EXP_DATE'];
  for (const dateField of dateFields) {
    if (data[dateField]) {
      const date = new Date(data[dateField]);
      if (isNaN(date.getTime())) {
        validation.isValid = false;
        validation.errors.push(`Invalid date format for ${dateField}`);
      }
    }
  }

  return validation;
}

exports.updateTicketsWithDatabaseValues = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // 1. Parse the uploaded Excel file using existing parseExcelData function
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames.includes('Seven-D')) {
      return res.status(400).json({
        success: false,
        error: 'Sheet "Seven-D" not found in the Excel file',
        availableSheets: workbook.SheetNames
      });
    }

    const sheetName = 'Seven-D';
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sheet "Seven-D" is empty'
      });
    }

    // Use existing parseExcelData function to get structured data
    const parsedData = await parseExcelData(rows, sheetName);
    
    if (!parsedData.success) {
      return res.status(400).json(parsedData);
    }

    // 2. Process each row and update database values
    const updatedData = [];
    const updateResults = [];
    
    for (let i = 0; i < parsedData.data.length; i++) {
      const row = parsedData.data[i];
      const taskWoNum = row.TASK_WO_NUM;
      
      if (!taskWoNum) {
        updatedData.push(row);
        continue;
      }
      
      try {
        // Find ticket in database by TASK_WO_NUM
        const ticket = await Tickets.findByTicketCode(taskWoNum);
        
        if (ticket) {
          // Update the Contractor Comments field with database comment7d value
          const updatedRow = { ...row };
          updatedRow['Contractor Comments'] = ticket.comment7d || '';
          
          updatedData.push(updatedRow);
          
          updateResults.push({
            row: i + 1,
            taskWoNum: taskWoNum,
            status: 'updated',
            oldValue: row['Contractor Comments'] || '',
            newValue: ticket.comment7d || '',
            ticketId: ticket.ticketid
          });
        } else {
          updatedData.push(row); // Keep original row
          
          updateResults.push({
            row: i + 1,
            taskWoNum: taskWoNum,
            status: 'not_found',
            message: 'Ticket not found in database'
          });
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        updatedData.push(row); // Keep original row on error
        
        updateResults.push({
          row: i + 1,
          taskWoNum: taskWoNum,
          status: 'error',
          error: error.message
        });
      }
    }

    // 3. Create new workbook with updated data
    const newWorkbook = XLSX.utils.book_new();
    
    // Convert updated data back to worksheet format
    const updatedWorksheet = XLSX.utils.json_to_sheet(updatedData);
    XLSX.utils.book_append_sheet(newWorkbook, updatedWorksheet, sheetName);

    // 4. Generate new Excel file buffer
    const newExcelBuffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });

    // 5. Generate file name with "_updated" and date
    const originalName = req.file.originalname || 'rtr-update.xlsx';
    const baseName = originalName.replace('.xlsx', '').replace('.xls', '');
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const generatedFileName = `${baseName}_updated_${currentDate}.xlsx`;

    // 6. Save to MinIO in rtr/generated folder
    const bucket = 'uploads';
    const folder = 'rtr/generated';
    const timestamp = Date.now();
    const sanitizedName = generatedFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${folder}/${timestamp}-${sanitizedName}`;

    // Ensure bucket exists
    const bucketExists = await getMinioClient().bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await getMinioClient().makeBucket(bucket);
    }

    await getMinioClient().putObject(bucket, objectName, newExcelBuffer);

    // 7. Generate presigned URL for download
    const presignedUrl = await generatePublicPresignedUrl(bucket, objectName, 3600, req);

    // 8. Save RTR record to database
    const rtrRecord = await RTR.saveRTRFile(generatedFileName, objectName);

    res.status(200).json({
      success: true,
      message: 'Excel file updated with database values successfully',
      data: {
        rtrId: rtrRecord.rtrId,
        originalFileName: originalName,
        generatedFileName: generatedFileName,
        objectKey: objectName,
        downloadUrl: presignedUrl,
        updateResults: updateResults,
        summary: {
          totalRows: parsedData.data.length,
          updatedRows: updateResults.filter(r => r.status === 'updated').length,
          notFoundRows: updateResults.filter(r => r.status === 'not_found').length,
          errorRows: updateResults.filter(r => r.status === 'error').length
        }
      }
    });

  } catch (error) {
    console.error('Error in updateTicketsWithDatabaseValues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Excel file with database values',
      error: error.message
    });
  }
};

// New method to update permit statuses based on expiration dates
exports.updatePermitStatuses = async (req, res) => {
  try {
    const updatedBy = req.body.updatedBy || 1;
    
    console.log('Starting comprehensive permit status and expiration check...');
    
    // Use the combined method that updates statuses and checks for expiring permits
    const results = await RTR.updatePermitStatusesAndCheckExpiring(updatedBy);
    
    const summary = {
      permits: {
        total: results.summary.totalPermitsChecked,
        statusUpdated: results.summary.permitsStatusUpdated,
        unchanged: results.summary.totalPermitsChecked - results.summary.permitsStatusUpdated,
        statusChanges: {
          toExpired: results.statusUpdates.filter(r => r.updated && r.newStatus === 'EXPIRED').length,
          toExpiresToday: results.statusUpdates.filter(r => r.updated && r.newStatus === 'EXPIRES_TODAY').length,
          toActive: results.statusUpdates.filter(r => r.updated && r.newStatus === 'ACTIVE').length,
          toPending: results.statusUpdates.filter(r => r.updated && r.newStatus === 'PENDING').length
        }
      },
      tickets: {
        total: results.summary.totalTicketsChecked,
        commentUpdated: results.summary.ticketsCommentUpdated,
        unchanged: results.summary.totalTicketsChecked - results.summary.ticketsCommentUpdated
      }
    };
    
    console.log('Comprehensive permit update completed:', summary);
    
    res.status(200).json({
      success: true,
      message: 'Permit statuses and ticket comments updated successfully',
      data: {
        summary: summary,
        permitStatusUpdates: results.statusUpdates,
        ticketCommentUpdates: results.expiringChecks
      }
    });
    
  } catch (error) {
    console.error('Error updating permit statuses and checking expiring permits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permit statuses and check expiring permits',
      details: error.message
    });
  }
};

// New method to generate TicketStatus records for tickets
exports.generateTicketStatuses = async (req, res) => {
  try {
    const { ticketIds, updatedBy } = req.body;
    
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ticketIds array is required and must not be empty'
      });
    }
    
    console.log(`Generating TicketStatus records for ${ticketIds.length} tickets...`);
    
    // Generate TicketStatus records for the specified tickets
    const results = await RTR.generateTicketStatusesForTickets(ticketIds, updatedBy || 1);
    
    res.status(200).json({
      success: true,
      message: 'TicketStatus records generated successfully',
      data: {
        summary: results.summary,
        results: results.results
      }
    });
    
  } catch (error) {
    console.error('Error generating TicketStatus records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate TicketStatus records',
      details: error.message
    });
  }
};
