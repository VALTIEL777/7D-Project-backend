const XLSX = require('xlsx');
const path = require('path');
const { getMinioClient } = require('../../config/minio');
const Tickets = require('../../models/ticket-logic/Tickets');
const Invoices = require('../../models/payments/Invoices');
const ContractUnits = require('../../models/ticket-logic/ContractUnits');

// Required columns and their mapping
const COLUMN_MAP = {
  'Contract Number': 'contractNumber',
  'SIP Number': 'invoiceNumber',
  'SIP ST Description': 'status',
  'SIP Creation Date': 'invoiceDateRequested',
  'Planned': 'ticketCode',
  'Payline Item Code': 'paylineItemCode',
  'Actual Quantity': 'actualQuantity',
  'Item Unit Price': 'itemUnitPrice',
};

function normalizeHeader(header) {
  // Convert to string and handle null/undefined/numbers
  const headerStr = String(header || '');
  return headerStr.trim().replace(/\s+/g, ' ').toUpperCase();
}

function levenshtein(a, b) {
  // Handle null/undefined parameters
  if (!a || !b) {
    return Math.max((a || '').length, (b || '').length);
  }
  
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function findColumnIndexesFuzzy(headers) {
  const indexes = {};
  // Filter out null/undefined headers and convert to strings
  const normalizedHeaders = (headers || []).map(h => normalizeHeader(h || ''));
  
  for (const [excelCol, key] of Object.entries(COLUMN_MAP)) {
    const target = normalizeHeader(excelCol);
    let bestIdx = -1;
    let bestScore = Infinity;
    
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      if (!header) continue; // Skip empty headers
      
      const score = levenshtein(target, header);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
      if (header.includes(target) || target.includes(header)) {
        bestScore = 0;
        bestIdx = i;
        break;
      }
    }
    if (bestScore <= 3) {
      indexes[key] = bestIdx;
    }
  }
  return indexes;
}

// Find the best header row in the first N rows
function findBestHeaderRow(rows, maxRowsToCheck = 5) {
  let best = { rowIdx: 0, matchCount: 0, indexes: {} };
  
  for (let i = 0; i < Math.min(rows.length, maxRowsToCheck); i++) {
    const candidate = rows[i] || [];
    // Skip completely empty rows
    if (!candidate || candidate.length === 0 || candidate.every(cell => !cell)) {
      continue;
    }
    
    const indexes = findColumnIndexesFuzzy(candidate);
    const matchCount = Object.keys(indexes).length;
    if (matchCount > best.matchCount) {
      best = { rowIdx: i, matchCount, indexes };
    }
  }
  return best;
}

// Parse date value from Excel
function parseDateValue(value) {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  // If it's a number (Excel date serial)
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H || 0,
      parsed.M || 0,
      parsed.S || 0
    ).toISOString().split('T')[0];
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Process a single row of invoice data
async function processInvoiceRow(row, indexes, headerRowIndex, rowIndex, fileUrl) {
  console.log(`=== Processing Invoice Row ${rowIndex + 1} ===`);
  
  try {
    // Extract data from row using indexes
    const ticketCode = indexes['ticketCode'] !== undefined ? row[indexes['ticketCode']] : undefined;
    const contractNumber = indexes['contractNumber'] !== undefined ? row[indexes['contractNumber']] : undefined;
    const invoiceNumber = indexes['invoiceNumber'] !== undefined ? row[indexes['invoiceNumber']] : undefined;
    const status = indexes['status'] !== undefined ? row[indexes['status']] : undefined;
    const invoiceDateRequested = indexes['invoiceDateRequested'] !== undefined ? 
      parseDateValue(row[indexes['invoiceDateRequested']]) : undefined;
    const actualQuantity = indexes['actualQuantity'] !== undefined ? 
      parseFloat(row[indexes['actualQuantity']] || 0) : 0;
    const itemUnitPrice = indexes['itemUnitPrice'] !== undefined ? 
      parseFloat(row[indexes['itemUnitPrice']] || 0) : 0;
    const paylineCode = indexes['paylineItemCode'] !== undefined ? row[indexes['paylineItemCode']] : undefined;
    
    console.log(`Row data extracted:`, {
      ticketCode,
      contractNumber,
      invoiceNumber,
      status,
      invoiceDateRequested,
      actualQuantity,
      itemUnitPrice,
      paylineCode
    });
    
    // Validate required fields
    if (!ticketCode) {
      throw new Error('Ticket code is required');
    }
    
    // Step 1: Find ticket
    console.log(`Step 1: Finding ticket with code: ${ticketCode}`);
    const ticket = await Tickets.findByCode(ticketCode);
    if (!ticket) {
      throw new Error(`Ticket not found with code: ${ticketCode}`);
    }
    console.log(`Step 1 - Found ticket:`, ticket);
    console.log(`Step 1 - Found ticket ID: ${ticket.ticketid}`);
    console.log(`Step 1 - Found ticket ID (camelCase): ${ticket.ticketId}`);
    
    // Step 2: Update contract number if provided
    if (contractNumber) {
      console.log(`Step 2: Updating contract number to: ${contractNumber}`);
      await Tickets.updateContractNumber(ticket.ticketid, contractNumber);
      console.log(`Step 2 - Contract number updated`);
    }
    
    // Step 3: Calculate amount requested
    const amountRequested = actualQuantity * itemUnitPrice;
    console.log(`Step 3: Calculated amount requested: ${actualQuantity} * ${itemUnitPrice} = ${amountRequested}`);
    
    // Step 4: Check Payline Item Code consistency
    let paylineConsistent = true;
    if (paylineCode) {
      console.log(`Step 4: Checking payline item code: ${paylineCode}`);
      const contractUnit = await ContractUnits.findByItemCode(paylineCode);
      if (!contractUnit) {
        paylineConsistent = false;
        console.log(`Step 4 - Payline item code not found in ContractUnits`);
      } else {
        console.log(`Step 4 - Payline item code found in ContractUnits`);
      }
    }
    
    // Step 5: Create or update invoice
    console.log(`Step 5: Processing invoice for ticket ${ticket.ticketid}`);
    let invoice = await Invoices.findByTicketId(ticket.ticketid);
    
    if (invoice) {
      console.log(`Step 5 - Updating existing invoice ID: ${invoice.invoiceid}`);
      await Invoices.update(
        invoice.invoiceid, 
        ticket.ticketid, 
        invoiceNumber, 
        invoiceDateRequested, 
        amountRequested, 
        status, 
        fileUrl, 
        ticket.updatedby
      );
    } else {
      console.log(`Step 5 - Creating new invoice`);
      invoice = await Invoices.create(
        ticket.ticketid, 
        invoiceNumber, 
        invoiceDateRequested, 
        amountRequested, 
        status, 
        fileUrl, 
        ticket.createdby, 
        ticket.updatedby
      );
    }
    
    console.log(`=== Invoice Row Processing Complete ===`);
    
    return {
      success: true,
      row: headerRowIndex + 1 + rowIndex,
      ticketCode,
      ticketId: ticket.ticketid,
      invoiceId: invoice.invoiceid,
      invoiceNumber,
      amountRequested,
      paylineConsistent,
      message: 'Invoice processed successfully'
    };
    
  } catch (error) {
    console.error(`=== Error Processing Invoice Row ${rowIndex + 1} ===`);
    console.error(`Error details:`, error);
    console.error(`Error message:`, error.message);
    console.error(`Row data:`, row);
    
    return {
      success: false,
      row: headerRowIndex + 1 + rowIndex,
      ticketCode: indexes['ticketCode'] !== undefined ? row[indexes['ticketCode']] : 'Unknown',
      error: error.message,
      data: row
    };
  }
}

// New endpoint to get all available payline item codes
exports.getAvailableItemCodes = async (req, res) => {
  try {
    console.log('=== Getting Available Item Codes ===');
    
    const itemCodes = await ContractUnits.getAllItemCodes();
    
    console.log(`Found ${itemCodes.length} available item codes`);
    
    res.json({
      success: true,
      itemCodes: itemCodes,
      count: itemCodes.length
    });
  } catch (err) {
    console.error('=== Get Available Item Codes Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    res.status(500).json({ 
      error: 'Failed to get available item codes', 
      details: err.message 
    });
  }
};

// Columns of interest for preview
const PREVIEW_COLUMNS = [
  { excel: 'Contract Number', key: 'contractNumber' },
  { excel: 'SIP Number', key: 'invoiceNumber' },
  { excel: 'SIP ST Description', key: 'status' },
  { excel: 'SIP Creation Date', key: 'invoiceDateRequested', isDate: true },
  { excel: 'Planned', key: 'ticketCode' },
  { excel: 'Cost Object', key: 'costObject' },
  { excel: 'Payline Item Code', key: 'paylineItemCode' }
];

exports.analyzeExcel = async (req, res) => {
  try {
    console.log('=== Starting Invoices Excel Analysis ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('File size:', req.file ? req.file.size : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    console.log('Workbook sheets:', workbook.SheetNames);
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Total rows:', rows.length);
    console.log('First few rows:', rows.slice(0, 3));
    
    const bestHeader = findBestHeaderRow(rows);
    console.log('Best header row:', bestHeader);
    
    const headers = rows[bestHeader.rowIdx] || [];
    const indexes = bestHeader.indexes;
    const missing = Object.keys(COLUMN_MAP).filter(col => !(COLUMN_MAP[col] in indexes));
    
    console.log('Headers found:', headers);
    console.log('Column indexes:', indexes);
    console.log('Missing columns:', missing);
    
    // Process all data rows after the header until an empty row
    const dataRows = [];
    for (let i = bestHeader.rowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(cell => !cell)) break;
      dataRows.push(row);
    }
    
    console.log(`Found ${dataRows.length} data rows to process`);
    // Build preview with only the columns of interest
    const preview = dataRows.slice(0, 5).map(row => {
      const obj = {};
      for (const col of PREVIEW_COLUMNS) {
        const idx = indexes[col.key];
        let value = idx !== undefined ? row[idx] : undefined;
        if (col.isDate && value !== undefined) {
          value = parseDateValue(value);
        }
        obj[col.key] = value;
      }
      return obj;
    });
    
    // Check Payline Item Code and Ticket consistency for all data rows
    console.log('Checking payline item code and ticket consistency...');
    const inconsistencies = [];
    const missingItemCodes = new Set(); // Use Set to collect unique missing item codes
    const missingTickets = new Set(); // Use Set to collect unique missing tickets
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Check payline item codes
      const paylineIdx = indexes['paylineItemCode'];
      const paylineCode = paylineIdx !== undefined ? row[paylineIdx] : undefined;
      if (paylineCode) {
        const exists = await ContractUnits.findByItemCode(paylineCode);
        if (!exists) {
          inconsistencies.push({ row: bestHeader.rowIdx + 1 + i, paylineCode, type: 'payline' });
          missingItemCodes.add(paylineCode); // Add to set of missing codes
        }
      }
      
      // Check tickets
      const ticketIdx = indexes['ticketCode'];
      const ticketCode = ticketIdx !== undefined ? row[ticketIdx] : undefined;
      if (ticketCode) {
        const ticket = await Tickets.findByCode(ticketCode);
        if (!ticket) {
          inconsistencies.push({ row: bestHeader.rowIdx + 1 + i, ticketCode, type: 'ticket' });
          missingTickets.add(ticketCode); // Add to set of missing tickets
        }
      }
    }
    
    // Convert Sets to Arrays and sort for consistent output
    const uniqueMissingItemCodes = Array.from(missingItemCodes).sort();
    const uniqueMissingTickets = Array.from(missingTickets).sort();
    
    console.log('Analysis completed successfully');
    console.log(`Found ${uniqueMissingItemCodes.length} unique missing item codes:`, uniqueMissingItemCodes);
    console.log(`Found ${uniqueMissingTickets.length} unique missing tickets:`, uniqueMissingTickets);
    
    res.json({ 
      headerRow: bestHeader.rowIdx, 
      headers, 
      preview, 
      missing, 
      indexes, 
      inconsistencies, 
      totalDataRows: dataRows.length,
      missingItemCodes: uniqueMissingItemCodes,
      missingItemCodesCount: uniqueMissingItemCodes.length,
      missingTickets: uniqueMissingTickets,
      missingTicketsCount: uniqueMissingTickets.length
    });
  } catch (err) {
    console.error('=== Invoices Excel Analysis Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Invalid Excel file', details: err.message });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    console.log('=== Starting Invoices Excel Upload ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('File size:', req.file ? req.file.size : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Step 1: Save file to MinIO
    console.log('Step 1: Saving file to MinIO...');
    const bucket = 'uploads';
    const folder = 'invoices/uploaded';
    const originalName = req.file.originalname || 'invoices-upload.xlsx';
    const objectName = `${folder}/${Date.now()}_${originalName}`;
    
    // Ensure bucket exists
    const bucketExists = await getMinioClient().bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await getMinioClient().makeBucket(bucket);
      console.log(`Created bucket: ${bucket}`);
    }
    
    await getMinioClient().putObject(bucket, objectName, req.file.buffer);
    const fileUrl = objectName;
    console.log(`Step 1 - File saved to MinIO: ${fileUrl}`);

    // Step 2: Parse Excel
    console.log('Step 2: Parsing Excel file...');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const bestHeader = findBestHeaderRow(rows);
    const headers = rows[bestHeader.rowIdx] || [];
    const indexes = bestHeader.indexes;
    
    console.log(`Step 2 - Headers found:`, headers);
    console.log(`Step 2 - Column indexes:`, indexes);
    
    // Step 3: Process all data rows after the header until an empty row
    console.log('Step 3: Processing data rows...');
    const dataRows = [];
    for (let i = bestHeader.rowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(cell => !cell)) break;
      dataRows.push(row);
    }
    
    console.log(`Step 3 - Found ${dataRows.length} data rows to process`);
    
    // Step 4: Collect missing item codes first (still block on these)
    console.log('Step 4: Collecting missing item codes...');
    const missingItemCodes = new Set();
    const rowsWithMissingCodes = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Check for missing payline item codes
      const paylineIdx = indexes['paylineItemCode'];
      const paylineCode = paylineIdx !== undefined ? row[paylineIdx] : undefined;
      if (paylineCode) {
        const exists = await ContractUnits.findByItemCode(paylineCode);
        if (!exists) {
          missingItemCodes.add(paylineCode);
          rowsWithMissingCodes.push({ row: bestHeader.rowIdx + 1 + i, paylineCode });
        }
      }
    }
    
    const uniqueMissingItemCodes = Array.from(missingItemCodes).sort();
    
    // If there are missing item codes, return error with details
    if (uniqueMissingItemCodes.length > 0) {
      console.log(`Step 4 - Found ${uniqueMissingItemCodes.length} missing item codes:`, uniqueMissingItemCodes);
      return res.status(400).json({
        error: 'Missing Payline Item Codes',
        message: `The following ${uniqueMissingItemCodes.length} payline item codes are not found in the system:`,
        missingItemCodes: uniqueMissingItemCodes,
        missingItemCodesCount: uniqueMissingItemCodes.length,
        rowsWithMissingCodes: rowsWithMissingCodes,
        totalRowsChecked: dataRows.length,
        fileUrl: fileUrl
      });
    }
    
    // Step 5: Process each row (only if no missing item codes)
    console.log('Step 5: Processing individual rows...');
    const results = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const result = await processInvoiceRow(row, indexes, bestHeader.rowIdx, i, fileUrl);
      results.push(result);
    }
    
    // Step 6: Generate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Count missing tickets from failed results
    const missingTickets = new Set();
    const rowsWithMissingTickets = [];
    results.forEach(result => {
      if (!result.success && result.error && result.error.includes('Ticket not found')) {
        const ticketCode = result.ticketCode;
        if (ticketCode && ticketCode !== 'Unknown') {
          missingTickets.add(ticketCode);
          rowsWithMissingTickets.push({ row: result.row, ticketCode });
        }
      }
    });
    
    const uniqueMissingTickets = Array.from(missingTickets).sort();
    
    console.log(`=== Invoices Excel Upload Complete ===`);
    console.log(`Total rows processed: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Missing tickets: ${uniqueMissingTickets.length}`);
    
    res.json({ 
      fileUrl, 
      results, 
      totalDataRows: dataRows.length,
      processedRows: successful,
      skippedRows: failed,
      missingTickets: uniqueMissingTickets,
      missingTicketsCount: uniqueMissingTickets.length,
      rowsWithMissingTickets: rowsWithMissingTickets,
      summary: {
        total: results.length,
        successful,
        failed,
        missingTickets: uniqueMissingTickets.length
      }
    });
  } catch (err) {
    console.error('=== Invoices Excel Upload Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Upload failed', details: err.message });
  }
}; 