const XLSX = require('xlsx');
const path = require('path');
const { getMinioClient } = require('../../config/minio');
const Tickets = require('../../models/ticket-logic/Tickets');
const Invoices = require('../../models/payments/Invoices');
const Payments = require('../../models/payments/Payments');

// Required columns and their mapping for payment Excel files
const COLUMN_MAP = {
  'Amount': 'amount',
  'Payment Reference': 'paymentReference',
  'LineItem.InvoiceNumber': 'lineItemInvoiceNumber',
  'Date': 'date'
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

// Process a single row of payment data
async function processPaymentRow(row, indexes, headerRowIndex, rowIndex, fileUrl) {
  console.log(`=== Processing Payment Row ${rowIndex + 1} ===`);
  
  try {
    // Extract data from row using indexes
    const amount = indexes['amount'] !== undefined ? parseFloat(row[indexes['amount']] || 0) : 0;
    const paymentReference = indexes['paymentReference'] !== undefined ? row[indexes['paymentReference']] : undefined;
    const lineItemInvoiceNumber = indexes['lineItemInvoiceNumber'] !== undefined ? row[indexes['lineItemInvoiceNumber']] : undefined;
    const date = indexes['date'] !== undefined ? parseDateValue(row[indexes['date']]) : undefined;
    
    console.log(`Row data extracted:`, {
      amount,
      paymentReference,
      lineItemInvoiceNumber,
      date
    });
    
    // Validate required fields
    if (!lineItemInvoiceNumber) {
      throw new Error('LineItem.InvoiceNumber is required');
    }
    
    if (!paymentReference) {
      throw new Error('Payment Reference is required');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    // Step 1: Find invoice by invoice number
    console.log(`Step 1: Finding invoice with number: ${lineItemInvoiceNumber}`);
    const invoice = await Invoices.findByInvoiceNumber(lineItemInvoiceNumber);
    if (!invoice) {
      throw new Error(`Invoice not found with number: ${lineItemInvoiceNumber}`);
    }
    console.log(`Step 1 - Found invoice:`, invoice);
    
    // Step 2: Get ticket from invoice
    console.log(`Step 2: Getting ticket for invoice`);
    const ticket = await Tickets.findById(invoice.ticketid);
    if (!ticket) {
      throw new Error(`Ticket not found for invoice: ${lineItemInvoiceNumber}`);
    }
    console.log(`Step 2 - Found ticket:`, ticket);
    
    // Step 3: Create payment record
    console.log(`Step 3: Creating payment record`);
    const payment = await Payments.create(
      paymentReference, 
      date, 
      amount, 
      'Completed', // Default status
      fileUrl, 
      ticket.createdby || 1, 
      ticket.updatedby || 1
    );
    console.log(`Step 3 - Payment created:`, payment);
    
    // Step 4: Update ticket with paymentId
    console.log(`Step 4: Updating ticket with paymentId`);
    await Tickets.updatePaymentId(ticket.ticketid, payment.checkid);
    console.log(`Step 4 - Ticket updated with paymentId: ${payment.checkid}`);
    
    console.log(`=== Payment Row Processing Complete ===`);
    
    return {
      success: true,
      row: headerRowIndex + 1 + rowIndex,
      paymentReference,
      lineItemInvoiceNumber,
      amount,
      date,
      ticketId: ticket.ticketid,
      ticketCode: ticket.ticketcode,
      paymentId: payment.checkid,
      message: 'Payment processed successfully'
    };
    
  } catch (error) {
    console.error(`=== Error Processing Payment Row ${rowIndex + 1} ===`);
    console.error(`Error details:`, error);
    console.error(`Error message:`, error.message);
    console.error(`Row data:`, row);
    
    return {
      success: false,
      row: headerRowIndex + 1 + rowIndex,
      paymentReference: indexes['paymentReference'] !== undefined ? row[indexes['paymentReference']] : 'Unknown',
      lineItemInvoiceNumber: indexes['lineItemInvoiceNumber'] !== undefined ? row[indexes['lineItemInvoiceNumber']] : 'Unknown',
      error: error.message,
      data: row
    };
  }
}

// Columns of interest for preview
const PREVIEW_COLUMNS = [
  { excel: 'Amount', key: 'amount' },
  { excel: 'Payment Reference', key: 'paymentReference' },
  { excel: 'LineItem.InvoiceNumber', key: 'lineItemInvoiceNumber' },
  { excel: 'Date', key: 'date', isDate: true }
];

exports.analyzeExcel = async (req, res) => {
  try {
    console.log('=== Starting Payments Excel Analysis ===');
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
    
    // Check invoice consistency for all data rows
    console.log('Checking invoice consistency...');
    const inconsistencies = [];
    const consistentItems = [];
    const missingInvoices = new Set(); // Use Set to collect unique missing invoices
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = bestHeader.rowIdx + 1 + i;
      
      // Extract invoice number for this row
      const invoiceIdx = indexes['lineItemInvoiceNumber'];
      const lineItemInvoiceNumber = invoiceIdx !== undefined ? row[invoiceIdx] : undefined;
      
      let rowInconsistencies = [];
      let isConsistent = true;
      
      // Check if invoice exists
      if (lineItemInvoiceNumber) {
        const invoice = await Invoices.findByInvoiceNumber(lineItemInvoiceNumber);
        if (!invoice) {
          rowInconsistencies.push({ type: 'invoice', code: lineItemInvoiceNumber, message: 'Invoice not found' });
          missingInvoices.add(lineItemInvoiceNumber);
          isConsistent = false;
        } else {
          // Check if ticket exists for this invoice
          const ticket = await Tickets.findById(invoice.ticketid);
          if (!ticket) {
            rowInconsistencies.push({ type: 'ticket', code: lineItemInvoiceNumber, message: 'Ticket not found for invoice' });
            isConsistent = false;
          }
        }
      }
      
      // Categorize the row
      if (isConsistent) {
        consistentItems.push({
          row: rowNumber,
          lineItemInvoiceNumber,
          message: 'All checks passed'
        });
      } else {
        inconsistencies.push({
          row: rowNumber,
          lineItemInvoiceNumber,
          inconsistencies: rowInconsistencies
        });
      }
    }
    
    // Convert Sets to Arrays and sort for consistent output
    const uniqueMissingInvoices = Array.from(missingInvoices).sort();
    
    console.log('Analysis completed successfully');
    console.log(`Found ${consistentItems.length} consistent items`);
    console.log(`Found ${inconsistencies.length} inconsistent items`);
    console.log(`Found ${uniqueMissingInvoices.length} unique missing invoices:`, uniqueMissingInvoices);
    
    res.json({ 
      headerRow: bestHeader.rowIdx, 
      headers, 
      preview, 
      missing, 
      indexes, 
      inconsistencies, 
      consistentItems,
      totalDataRows: dataRows.length,
      consistentCount: consistentItems.length,
      inconsistentCount: inconsistencies.length,
      missingInvoices: uniqueMissingInvoices,
      missingInvoicesCount: uniqueMissingInvoices.length,
      summary: {
        total: dataRows.length,
        consistent: consistentItems.length,
        inconsistent: inconsistencies.length,
        missingInvoices: uniqueMissingInvoices.length
      }
    });
  } catch (err) {
    console.error('=== Payments Excel Analysis Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Invalid Excel file', details: err.message });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    console.log('=== Starting Payments Excel Upload ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('File size:', req.file ? req.file.size : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Step 1: Save file to MinIO
    console.log('Step 1: Saving file to MinIO...');
    const bucket = 'uploads';
    const folder = 'payments/uploaded';
    const originalName = req.file.originalname || 'payments-upload.xlsx';
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
    
    // Step 4: Collect missing invoices first (block on these)
    console.log('Step 4: Collecting missing invoices...');
    const missingInvoices = new Set();
    const rowsWithMissingInvoices = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Check for missing invoices
      const invoiceIdx = indexes['lineItemInvoiceNumber'];
      const lineItemInvoiceNumber = invoiceIdx !== undefined ? row[invoiceIdx] : undefined;
      if (lineItemInvoiceNumber) {
        const exists = await Invoices.findByInvoiceNumber(lineItemInvoiceNumber);
        if (!exists) {
          missingInvoices.add(lineItemInvoiceNumber);
          rowsWithMissingInvoices.push({ row: bestHeader.rowIdx + 1 + i, lineItemInvoiceNumber });
        }
      }
    }
    
    const uniqueMissingInvoices = Array.from(missingInvoices).sort();
    
    // If there are missing invoices, return error with details
    if (uniqueMissingInvoices.length > 0) {
      console.log(`Step 4 - Found ${uniqueMissingInvoices.length} missing invoices:`, uniqueMissingInvoices);
      return res.status(400).json({
        error: 'Missing Invoices',
        message: `The following ${uniqueMissingInvoices.length} invoices are not found in the system:`,
        missingInvoices: uniqueMissingInvoices,
        missingInvoicesCount: uniqueMissingInvoices.length,
        rowsWithMissingInvoices: rowsWithMissingInvoices,
        totalRowsChecked: dataRows.length,
        fileUrl: fileUrl
      });
    }
    
    // Step 5: Process each row (only if no missing invoices)
    console.log('Step 5: Processing individual rows...');
    const results = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const result = await processPaymentRow(row, indexes, bestHeader.rowIdx, i, fileUrl);
      results.push(result);
    }
    
    // Step 6: Generate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Count missing invoices from failed results
    const missingInvoicesFromFailed = new Set();
    const rowsWithMissingInvoicesFromFailed = [];
    const processingErrors = [];
    
    results.forEach(result => {
      if (!result.success) {
        if (result.error && result.error.includes('Invoice not found')) {
          const lineItemInvoiceNumber = result.lineItemInvoiceNumber;
          if (lineItemInvoiceNumber && lineItemInvoiceNumber !== 'Unknown') {
            missingInvoicesFromFailed.add(lineItemInvoiceNumber);
            rowsWithMissingInvoicesFromFailed.push({ row: result.row, lineItemInvoiceNumber });
          }
        } else {
          // Other processing errors
          processingErrors.push({
            row: result.row,
            lineItemInvoiceNumber: result.lineItemInvoiceNumber,
            error: result.error
          });
        }
      }
    });
    
    const uniqueMissingInvoicesFromFailed = Array.from(missingInvoicesFromFailed).sort();
    
    console.log(`=== Payments Excel Upload Complete ===`);
    console.log(`Total rows processed: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Missing invoices: ${uniqueMissingInvoicesFromFailed.length}`);
    console.log(`Processing errors: ${processingErrors.length}`);
    
    res.json({ 
      fileUrl, 
      results, 
      totalDataRows: dataRows.length,
      processedRows: successful,
      skippedRows: failed,
      missingInvoices: uniqueMissingInvoicesFromFailed,
      missingInvoicesCount: uniqueMissingInvoicesFromFailed.length,
      rowsWithMissingInvoices: rowsWithMissingInvoicesFromFailed,
      processingErrors: processingErrors,
      summary: {
        total: results.length,
        successful,
        failed,
        missingInvoices: uniqueMissingInvoicesFromFailed.length,
        processingErrors: processingErrors.length,
        successRate: results.length > 0 ? Math.round((successful / results.length) * 100) : 0
      }
    });
  } catch (err) {
    console.error('=== Payments Excel Upload Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Upload failed', details: err.message });
  }
}; 