const XLSX = require("xlsx");
const RTR = require("../../models/RTR/rtr").RTR;
const minioClient = require('../../config/minio');
const path = require('path');

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
    const objectName = `${folder}/${timestamp}-${originalName}`;

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
    }

    await minioClient.putObject(bucket, objectName, req.file.buffer);

    // 2. Construct the file URL
    const fileUrl = `http://${process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost'}:9000/${bucket}/${objectName}`;

    // 3. Save metadata to RTRs table
    await RTR.saveRTRFile(originalName, fileUrl);

    // 4. Continue with Excel processing as before
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const results = [];
    const saveToDatabase = req.query.save === 'true'; // Optional query parameter
    const createdBy = req.body.createdBy || 1; // Default user ID
    const updatedBy = req.body.updatedBy || 1; // Default user ID

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length === 0) continue;

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
        continue;
      }

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
        continue;
      }

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

        entry.ticketType = /MOB/i.test(sheetName) ? "mobilization" : "regular";
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

    return res.status(200).json({
      success: true,
      sheetCount: results.length,
      results,
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
    const rtr = await RTR.getRTRById(rtrId);
    if (!rtr) {
      return res.status(404).json({ success: false, error: 'RTR not found' });
    }
    // Extract bucket and object key from URL
    const url = new URL(rtr.url);
    const bucket = url.pathname.split('/')[1];
    const objectKey = url.pathname.split('/').slice(2).join('/');
    // Get file from MinIO
    minioClient.getObject(bucket, objectKey, (err, dataStream) => {
      if (err) {
        console.error('MinIO getObject error:', err);
        return res.status(500).json({ success: false, error: 'Failed to download file from MinIO' });
      }
      res.setHeader('Content-Disposition', `attachment; filename="${rtr.name}"`);
      dataStream.pipe(res);
    });
  } catch (err) {
    console.error('Failed to download RTR Excel:', err);
    res.status(500).json({ success: false, error: 'Failed to download RTR Excel' });
  }
};
