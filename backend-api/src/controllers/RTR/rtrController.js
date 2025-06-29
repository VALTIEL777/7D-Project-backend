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
    const timestamp = Date.now();
    // Sanitize the filename to avoid URL encoding issues
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${folder}/${timestamp}-${sanitizedName}`;

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
      
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
      
      await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
      console.log(`Set public read policy for bucket: ${bucket}`);
    }

    await minioClient.putObject(bucket, objectName, req.file.buffer);

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
              const generatedFileName = `processed-${originalName.replace('.xlsx', '')}-${Date.now()}.xlsx`;
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
    console.log('🔍 Starting listRTRFiles...');
    const bucket = 'uploads';
    const uploadedFolder = 'rtr/uploaded';
    const generatedFolder = 'rtr/generated';
    
    console.log(`📦 Checking bucket: ${bucket}`);
    // Check if bucket exists first, create it if it doesn't
    const bucketExists = await minioClient.bucketExists(bucket).catch((err) => {
      console.error(`❌ Error checking bucket existence:`, err);
      return false;
    });
    
    console.log(`📦 Bucket exists: ${bucketExists}`);
    
    if (!bucketExists) {
      try {
        console.log(`📦 Creating bucket: ${bucket}`);
        await minioClient.makeBucket(bucket);
        console.log(`✅ Created MinIO bucket: ${bucket}`);
        
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
        
        await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
        console.log(`✅ Set public read policy for bucket: ${bucket}`);
      } catch (makeBucketError) {
        console.error(`❌ Failed to create bucket ${bucket}:`, makeBucketError);
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
    
    // List uploaded files
    console.log(`📁 Listing uploaded files in: ${uploadedFolder}`);
    const uploadedFiles = [];
    let uploadedStream;
    try {
      uploadedStream = minioClient.listObjects(bucket, uploadedFolder, true);
    } catch (streamError) {
      console.error('❌ Failed to create uploaded files stream:', streamError);
      uploadedStream = null;
    }
    
    if (uploadedStream) {
      uploadedStream.on('data', async (obj) => {
        console.log(`📄 Found uploaded file: ${obj.name}`);
        try {
          // Generate presigned URL for download (valid for 1 hour)
          const presignedUrl = await minioClient.presignedGetObject(bucket, obj.name, 3600);
          console.log(`🔗 Generated presigned URL for: ${obj.name}`);
          
          uploadedFiles.push({
            name: obj.name.replace(uploadedFolder + '/', ''),
            size: obj.size,
            lastModified: obj.lastModified,
            type: 'uploaded',
            url: presignedUrl,
            objectKey: obj.name
          });
        } catch (urlError) {
          console.error(`❌ Failed to generate presigned URL for ${obj.name}:`, urlError);
          uploadedFiles.push({
            name: obj.name.replace(uploadedFolder + '/', ''),
            size: obj.size,
            lastModified: obj.lastModified,
            type: 'uploaded',
            url: null,
            objectKey: obj.name,
            error: 'Failed to generate download URL'
          });
        }
      });
    }
    
    // List generated files
    console.log(`📁 Listing generated files in: ${generatedFolder}`);
    const generatedFiles = [];
    let generatedStream;
    try {
      generatedStream = minioClient.listObjects(bucket, generatedFolder, true);
    } catch (streamError) {
      console.error('❌ Failed to create generated files stream:', streamError);
      generatedStream = null;
    }
    
    if (generatedStream) {
      generatedStream.on('data', async (obj) => {
        console.log(`📄 Found generated file: ${obj.name}`);
        try {
          // Generate presigned URL for download (valid for 1 hour)
          const presignedUrl = await minioClient.presignedGetObject(bucket, obj.name, 3600);
          console.log(`🔗 Generated presigned URL for: ${obj.name}`);
          
          generatedFiles.push({
            name: obj.name.replace(generatedFolder + '/', ''),
            size: obj.size,
            lastModified: obj.lastModified,
            type: 'generated',
            url: presignedUrl,
            objectKey: obj.name
          });
        } catch (urlError) {
          console.error(`❌ Failed to generate presigned URL for ${obj.name}:`, urlError);
          generatedFiles.push({
            name: obj.name.replace(generatedFolder + '/', ''),
            size: obj.size,
            lastModified: obj.lastModified,
            type: 'generated',
            url: null,
            objectKey: obj.name,
            error: 'Failed to generate download URL'
          });
        }
      });
    }
    
    // Wait for both streams to complete (if they exist)
    if (uploadedStream || generatedStream) {
      console.log('⏳ Waiting for file listing to complete...');
      await new Promise((resolve, reject) => {
        let completedStreams = 0;
        const totalStreams = (uploadedStream ? 1 : 0) + (generatedStream ? 1 : 0);
        
        const checkComplete = () => {
          completedStreams++;
          console.log(`📊 Stream completed: ${completedStreams}/${totalStreams}`);
          if (completedStreams >= totalStreams) {
            resolve();
          }
        };
        
        if (uploadedStream) {
          uploadedStream.on('end', () => {
            console.log('✅ Uploaded files stream completed');
            checkComplete();
          });
          uploadedStream.on('error', (err) => {
            console.error('❌ Uploaded files stream error:', err);
            checkComplete();
          });
        }
        
        if (generatedStream) {
          generatedStream.on('end', () => {
            console.log('✅ Generated files stream completed');
            checkComplete();
          });
          generatedStream.on('error', (err) => {
            console.error('❌ Generated files stream error:', err);
            checkComplete();
          });
        }
      });
    }
    
    console.log(`📊 Final results - Uploaded: ${uploadedFiles.length}, Generated: ${generatedFiles.length}`);
    
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
    console.error('❌ Failed to list RTR files:', err);
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
    
    console.log(`Direct download - Bucket: ${bucket}, Key: ${objectKey}`);
    
    // Get file from MinIO
    minioClient.getObject(bucket, objectKey, (err, dataStream) => {
      if (err) {
        console.error('MinIO getObject error:', err);
        
        // Check if it's a "not found" error
        if (err.code === 'NoSuchKey') {
          return res.status(404).json({ 
            success: false, 
            error: 'File not found in storage',
            details: `File ${objectKey} not found in bucket ${bucket}`
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to download file from MinIO',
          details: err.message
        });
      }
      
      // Extract filename from object key
      const filename = objectKey.split('/').pop() || 'download.xlsx';
      
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

    console.log('💾 Save request received:', {
      newTicketsCount: newTickets?.length || 0,
      inconsistentTicketsCount: inconsistentTickets?.length || 0,
      decisionsKeys: Object.keys(decisions || {}),
      decisions: decisions
    });

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
      console.log('🔄 Processing inconsistent tickets:', inconsistentTickets.length);
      
      for (const ticketData of inconsistentTickets) {
        try {
          console.log(`📋 Processing ticket ${ticketData.ticketId}:`, {
            ticketCode: ticketData.ticketCode,
            ticketId: ticketData.ticketId,
            decisionsForTicket: decisions[ticketData.ticketId] || {},
            inconsistencies: ticketData.inconsistencies?.length || 0
          });

          const finalData = applyUserDecisions(ticketData.excelData, ticketData.databaseData, decisions[ticketData.ticketId] || {});
          const result = await updateTicketWithData(ticketData.ticketId, finalData, updatedBy);
          results.ticketsUpdated.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            result: result
          });
        } catch (error) {
          console.error(`❌ Error processing ticket ${ticketData.ticketId}:`, error);
          results.errors.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            error: error.message
          });
        }
      }
    }

    console.log('✅ Save completed with results:', {
      newTicketsCreated: results.newTicketsCreated.length,
      ticketsUpdated: results.ticketsUpdated.length,
      errors: results.errors.length
    });

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
  
  console.log('🔧 Applying user decisions:', {
    decisions,
    excelData: Object.keys(excelData),
    databaseData: Object.keys(databaseData)
  });
  
  // Apply decisions directly using the field names from inconsistencies
  for (const [field, choice] of Object.entries(decisions)) {
    console.log(`Processing decision for field "${field}": ${choice}`);
    
    if (choice === 'excel') {
      // Use the Excel value for this field
      if (excelData[field] !== undefined) {
        // Map Excel field to database field
        const dbField = getDatabaseFieldMapping(field);
        if (dbField) {
          finalData[dbField] = excelData[field];
          console.log(`✅ Applied Excel value for ${field} -> ${dbField}: ${excelData[field]}`);
        } else {
          console.warn(`⚠️ No database field mapping found for Excel field: ${field}`);
        }
      } else {
        console.warn(`⚠️ Excel field "${field}" not found in excelData`);
      }
    } else if (choice === 'database') {
      // Keep the database value (already copied in finalData)
      console.log(`✅ Keeping database value for field: ${field}`);
    } else {
      console.warn(`⚠️ Unknown choice "${choice}" for field "${field}"`);
    }
  }
  
  console.log('🔧 Final data after applying decisions:', finalData);
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
    console.log(`🔄 Updating ticket ${ticketId} with data:`, finalData);
    
    // Get the current ticket to preserve unchanged fields
    const currentTicket = await Tickets.findById(ticketId);
    if (!currentTicket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    console.log(`📋 Current ticket data:`, currentTicket);

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

    console.log(`📝 Update data prepared:`, updateData);

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

    console.log(`✅ Ticket ${ticketId} updated successfully:`, updatedTicket);

    return {
      ticketId: ticketId,
      updated: true,
      message: 'Ticket updated successfully',
      updatedTicket: updatedTicket
    };
  } catch (error) {
    console.error(`❌ Error updating ticket ${ticketId}:`, error);
    throw error;
  }
}

// Function to save generated files to MinIO
async function saveGeneratedFile(fileBuffer, fileName, rtrId) {
  const bucket = 'uploads';
  const folder = 'rtr/generated';
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const objectName = `${folder}/${rtrId}-${timestamp}-${sanitizedName}`;

  // Ensure bucket exists
  const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
  if (!bucketExists) {
    await minioClient.makeBucket(bucket);
  }

  await minioClient.putObject(bucket, objectName, fileBuffer);
  
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

    console.log(`=== Starting saveStepperData ===`);
    console.log(`newTickets count: ${newTickets?.length || 0}`);
    console.log(`inconsistentTickets count: ${inconsistentTickets?.length || 0}`);
    console.log(`missingInfoFilled count: ${missingInfoFilled?.length || 0}`);
    console.log(`createdBy: ${createdBy}, updatedBy: ${updatedBy}`);

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
        console.log(`Step 1: Saving original file to MinIO...`);
        const bucket = 'uploads';
        const folder = 'rtr/uploaded';
        const originalName = fileInfo.originalName || 'rtr-upload.xlsx';
        const timestamp = Date.now();
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const objectName = `${folder}/${timestamp}-${sanitizedName}`;

        // Ensure bucket exists
        const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
        if (!bucketExists) {
          await minioClient.makeBucket(bucket);
        }

        // Convert base64 buffer back to Buffer
        const fileBuffer = Buffer.from(fileInfo.buffer, 'base64');
        console.log(`Step 1: File buffer size: ${fileBuffer.length} bytes`);
        
        await minioClient.putObject(bucket, objectName, fileBuffer);
        
        // Store the object key instead of constructing a URL
        // This makes file retrieval more reliable
        originalFileUrl = objectName; // Store just the object key

        // Save metadata to RTRs table
        rtrRecord = await RTR.saveRTRFile(originalName, originalFileUrl);
        
        console.log(`Step 1: Saved original file to MinIO: ${originalFileUrl}`);
        console.log(`Step 1: RTR record created with ID: ${rtrRecord?.rtrId}`);
      } catch (fileError) {
        console.error("Step 1: Failed to save original file to MinIO:", fileError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save original file',
          details: fileError.message
        });
      }
    }

    // Step 2: Process new tickets
    if (newTickets && Array.isArray(newTickets)) {
      console.log(`Step 2: Processing ${newTickets.length} new tickets...`);
      for (let i = 0; i < newTickets.length; i++) {
        const ticketData = newTickets[i];
        console.log(`Step 2: Processing new ticket ${i + 1}/${newTickets.length}: ${ticketData.ticketCode}`);
        
        try {
          console.log(`Step 2: Calling RTR.processRTRData for ticket: ${ticketData.ticketCode}`);
          console.log(`Step 2: Excel data:`, ticketData.excelData);
          
          const result = await RTR.processRTRData([ticketData.excelData], createdBy || 1, updatedBy || 1);
          console.log(`Step 2: RTR.processRTRData result:`, result);
          
          results.newTicketsCreated.push({
            ticketCode: ticketData.ticketCode,
            result: result
          });
          results.summary.created++;
          console.log(`Step 2: Successfully processed ticket: ${ticketData.ticketCode}`);
        } catch (error) {
          console.error(`Step 2: Error processing ticket ${ticketData.ticketCode}:`, error);
          results.errors.push({
            ticketCode: ticketData.ticketCode,
            error: error.message
          });
          results.summary.failed++;
        }
        results.summary.total++;
      }
    }

    // Step 3: Process inconsistent tickets with user decisions
    if (inconsistentTickets && Array.isArray(inconsistentTickets)) {
      console.log(`Step 3: Processing ${inconsistentTickets.length} inconsistent tickets...`);
      for (let i = 0; i < inconsistentTickets.length; i++) {
        const ticketData = inconsistentTickets[i];
        console.log(`Step 3: Processing inconsistent ticket ${i + 1}/${inconsistentTickets.length}: ${ticketData.ticketCode}`);
        
        try {
          const finalData = applyUserDecisions(ticketData.excelData, ticketData.databaseData, decisions[ticketData.ticketId] || {});
          console.log(`Step 3: Final data for ticket ${ticketData.ticketCode}:`, finalData);
          
          const result = await updateTicketWithData(ticketData.ticketId, finalData, updatedBy || 1);
          console.log(`Step 3: Update result for ticket ${ticketData.ticketCode}:`, result);
          
          results.ticketsUpdated.push({
            ticketId: ticketData.ticketId,
            ticketCode: ticketData.ticketCode,
            result: result
          });
          results.summary.updated++;
          console.log(`Step 3: Successfully updated ticket: ${ticketData.ticketCode}`);
        } catch (error) {
          console.error(`Step 3: Error updating ticket ${ticketData.ticketCode}:`, error);
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
      console.log(`Step 4: Processing ${missingInfoFilled.length} filled missing info...`);
      for (let i = 0; i < missingInfoFilled.length; i++) {
        const filledInfo = missingInfoFilled[i];
        console.log(`Step 4: Processing filled info ${i + 1}/${missingInfoFilled.length}: ${filledInfo.ticketCode}`);
        
        try {
          console.log(`Step 4: Calling RTR.processRTRData for filled info: ${filledInfo.ticketCode}`);
          console.log(`Step 4: Filled data:`, filledInfo.data);
          
          const result = await RTR.processRTRData([filledInfo.data], createdBy || 1, updatedBy || 1);
          console.log(`Step 4: RTR.processRTRData result:`, result);
          
          results.newTicketsCreated.push({
            ticketCode: filledInfo.ticketCode,
            result: result
          });
          results.summary.created++;
          console.log(`Step 4: Successfully processed filled info: ${filledInfo.ticketCode}`);
        } catch (error) {
          console.error(`Step 4: Error processing filled info ${filledInfo.ticketCode}:`, error);
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
      console.log(`Step 5: Recording ${skippedRows.length} skipped tickets...`);
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
        console.log(`Step 6: Generating processed Excel file...`);
        const allProcessedData = [
          ...(newTickets || []).map(t => ({ ...t.excelData, status: 'created' })),
          ...(inconsistentTickets || []).map(t => ({ ...t.excelData, status: 'updated' })),
          ...(missingInfoFilled || []).map(t => ({ ...t.data, status: 'created' })),
          ...(skippedRows || []).map(t => ({ ...t, status: 'skipped' }))
        ];

        const processedExcelBuffer = await generateProcessedExcel(allProcessedData, results, rtrRecord.rtrId);
        const generatedFileName = `stepper-processed-${Date.now()}.xlsx`;
        const generatedFile = await saveGeneratedFile(processedExcelBuffer, generatedFileName, rtrRecord.rtrId);
        generatedFileUrl = generatedFile.fileUrl;
        
        console.log(`Step 6: Generated processed Excel file: ${generatedFileUrl}`);
      } catch (genError) {
        console.error("Step 6: Failed to generate processed Excel file:", genError);
      }
    }

    console.log(`=== Final Results Summary ===`);
    console.log(`Total processed: ${results.summary.total}`);
    console.log(`Created: ${results.summary.created}`);
    console.log(`Updated: ${results.summary.updated}`);
    console.log(`Skipped: ${results.summary.skipped}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Errors: ${results.errors.length}`);

    return res.status(200).json({
      success: true,
      rtrId: rtrRecord?.rtrId,
      rtrName: rtrRecord?.name,
      originalFileUrl: originalFileUrl,
      results: results,
      generatedFileUrl: generatedFileUrl,
      message: `Processing completed. ${results.summary.created} created, ${results.summary.updated} updated, ${results.summary.skipped} skipped, ${results.summary.failed} failed.`
    });

  } catch (err) {
    console.error("❌ Stepper save failed:", err);
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
