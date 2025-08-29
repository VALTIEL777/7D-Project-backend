const XLSX = require('xlsx');
const path = require('path');
const { getMinioClient } = require('../../config/minio');
const Tickets = require('../../models/ticket-logic/Tickets');
const Invoices = require('../../models/payments/Invoices');
const Payments = require('../../models/payments/Payments');
const ContractUnits = require('../../models/ticket-logic/ContractUnits');

// Column mappings for different Excel types
const INVOICE_COLUMN_MAP = {
  'Contract Number': 'contractNumber',
  'SIP Number': 'invoiceNumber',
  'SIP ST Description': 'status',
  'SIP Creation Date': 'invoiceDateRequested',
  'Planned': 'ticketCode',
  'Payline Item Code': 'paylineItemCode',
  'Actual Quantity': 'actualQuantity',
  'Item Unit Price': 'itemUnitPrice',
};

const PAYMENT_COLUMN_MAP = {
  'amount': 'paymentAmount',
  'lineItem.paymentAmount': 'lineItemPaymentAmount',
  'Payment Reference': 'paymentReference',
  'paymentReference': 'paymentReference',
  'PaymentReference': 'paymentReference',
  'payment_reference': 'paymentReference',
  'Payment Reference Number': 'paymentReference',
  'LineItem.InvoiceNumber': 'lineItemInvoiceNumber',
  'lineItem.invoiceNumber': 'lineItemInvoiceNumber',
  'Date': 'date'
};

function normalizeHeader(header) {
  const headerStr = String(header || '');
  return headerStr.trim().replace(/\s+/g, ' ').toUpperCase();
}

function levenshtein(a, b) {
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

function findColumnIndexesFuzzy(headers, columnMap) {
  const indexes = {};
  const normalizedHeaders = (headers || []).map(h => normalizeHeader(h || ''));
  
  for (const [excelCol, key] of Object.entries(columnMap)) {
    // Skip fuzzy matching for lineItem.paymentAmount - we'll handle it explicitly
    if (key === 'lineItemPaymentAmount') continue;
    
    const target = normalizeHeader(excelCol);
    let bestIdx = -1;
    let bestScore = Infinity;
    
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      if (!header) continue;
      
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
  
  // Special handling for payment files - look for invoice numbers in the data
  if (columnMap === PAYMENT_COLUMN_MAP) {
    // If we didn't find lineItemInvoiceNumber in headers, look for it in the data
    if (!('lineItemInvoiceNumber' in indexes)) {
      for (let i = 0; i < headers.length; i++) {
        const value = headers[i];
        if (value && typeof value === 'string' && value.startsWith('SR')) {
          indexes['lineItemInvoiceNumber'] = i;
          break;
        }
      }
    }
    
    // Look for lineItem.paymentAmount column
    for (let i = 0; i < headers.length; i++) {
      const value = headers[i];
      if (value && typeof value === 'string') {
        const normalizedValue = value.toLowerCase().trim();
        if (normalizedValue.includes('lineitem.paymentamount') || 
            normalizedValue.includes('lineitem.paymentamount') ||
            normalizedValue.includes('lineitem.payment') ||
            normalizedValue.includes('line item.paymentamount') ||
            normalizedValue.includes('line item.payment') ||
            normalizedValue.includes('lineitem paymentamount') ||
            normalizedValue.includes('line item paymentamount') ||
            normalizedValue.includes('paymentamount') ||
            normalizedValue.includes('payment amount') ||
            (normalizedValue.includes('amount') && normalizedValue.includes('lineitem'))) {
          indexes['lineItemPaymentAmount'] = i;
          break;
        }
      }
    }
    
    // Look for generic amount column for Payments table
    for (let i = 0; i < headers.length; i++) {
      const value = headers[i];
      if (value && typeof value === 'string') {
        const normalizedValue = value.toLowerCase().trim();
        if (normalizedValue === 'amount' || 
            normalizedValue === 'payment amount' ||
            normalizedValue === 'total amount' ||
            normalizedValue === 'amount paid' ||
            normalizedValue === 'payment' ||
            normalizedValue.includes('amount') && !normalizedValue.includes('lineitem')) {
          indexes['paymentAmount'] = i;
          break;
        }
      }
    }
    
    // Check if both columns are found
    if (!('lineItemPaymentAmount' in indexes)) {
      console.log('WARNING: lineItem.paymentAmount column not found in headers:', headers);
      console.log('Available headers for lineItem.paymentAmount detection:', headers.filter(h => h && typeof h === 'string' && h.toLowerCase().includes('amount')));
    }
    if (!('paymentAmount' in indexes)) {
      console.log('WARNING: amount column not found in headers:', headers);
      console.log('Available headers for amount detection:', headers.filter(h => h && typeof h === 'string' && h.toLowerCase().includes('amount')));
    }
    
    // Log successful detections
    if ('lineItemPaymentAmount' in indexes) {
      console.log(`SUCCESS: Found lineItem.paymentAmount at column ${indexes['lineItemPaymentAmount']}: "${headers[indexes['lineItemPaymentAmount']]}"`);
    }
    if ('paymentAmount' in indexes) {
      console.log(`SUCCESS: Found amount at column ${indexes['paymentAmount']}: "${headers[indexes['paymentAmount']]}"`);
    }
    
    // Look for date values
    if (!('date' in indexes)) {
      for (let i = 0; i < headers.length; i++) {
        const value = headers[i];
        if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          indexes['date'] = i;
          break;
        }
      }
    }
    
    // If still no lineItemInvoiceNumber found, look for any column that might contain invoice numbers
    if (!('lineItemInvoiceNumber' in indexes)) {
      for (let i = 0; i < headers.length; i++) {
        const value = headers[i];
        if (value && typeof value === 'string' && (value.includes('invoice') || value.includes('Invoice'))) {
          indexes['lineItemInvoiceNumber'] = i;
          break;
        }
      }
    }
  }
  
  return indexes;
}

function findBestHeaderRow(rows, maxRowsToCheck = 5) {
  let best = { rowIdx: 0, matchCount: 0, indexes: {} };
  
  for (let i = 0; i < Math.min(rows.length, maxRowsToCheck); i++) {
    const candidate = rows[i] || [];
    if (!candidate || candidate.length === 0 || candidate.every(cell => !cell)) {
      continue;
    }
    
    // Try both invoice and payment column maps
    const invoiceIndexes = findColumnIndexesFuzzy(candidate, INVOICE_COLUMN_MAP);
    const paymentIndexes = findColumnIndexesFuzzy(candidate, PAYMENT_COLUMN_MAP);
    
    const invoiceMatchCount = Object.keys(invoiceIndexes).length;
    const paymentMatchCount = Object.keys(paymentIndexes).length;
    
    // Prioritize the first row (row 0) if it has any matches, as it's likely the header
    if (i === 0 && (invoiceMatchCount > 0 || paymentMatchCount > 0)) {
      if (paymentMatchCount >= invoiceMatchCount) {
        best = { rowIdx: i, matchCount: paymentMatchCount, indexes: paymentIndexes, type: 'payment' };
      } else {
        best = { rowIdx: i, matchCount: invoiceMatchCount, indexes: invoiceIndexes, type: 'invoice' };
      }
      break; // Use the first row if it has matches
    }
    
    // Otherwise, find the best match
    if (invoiceMatchCount > best.matchCount) {
      best = { rowIdx: i, matchCount: invoiceMatchCount, indexes: invoiceIndexes, type: 'invoice' };
    }
    if (paymentMatchCount > best.matchCount) {
      best = { rowIdx: i, matchCount: paymentMatchCount, indexes: paymentIndexes, type: 'payment' };
    }
  }
  return best;
}

function detectExcelType(headers) {
  // Check for invoice-specific columns
  const invoiceMatches = ['CONTRACT NUMBER', 'SIP NUMBER', 'PLANNED', 'PAYLINE ITEM CODE'];
  const paymentMatches = ['AMOUNT', 'PAYMENT REFERENCE', 'LINEITEM.INVOICENUMBER'];
  
  const normalizedHeaders = headers.map(h => normalizeHeader(h)).filter(h => h && h.length > 0);
  
  let invoiceScore = 0;
  let paymentScore = 0;
  
  for (const header of normalizedHeaders) {
    if (header && typeof header === 'string') {
      if (invoiceMatches.some(match => header.includes(match) || match.includes(header))) {
        invoiceScore++;
      }
      if (paymentMatches.some(match => header.includes(match) || match.includes(header))) {
        paymentScore++;
      }
    }
  }
  
  console.log(`Excel type detection - Invoice score: ${invoiceScore}, Payment score: ${paymentScore}`);
  
  if (invoiceScore > paymentScore && invoiceScore >= 2) {
    return 'invoice';
  } else if (paymentScore > invoiceScore && paymentScore >= 2) {
    return 'payment';
  } else {
    return 'unknown';
  }
}

function parseDateValue(value) {
  if (!value) return null;
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
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
  
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Process a single invoice row
async function processInvoiceRow(row, indexes, headerRowIndex, rowIndex, fileUrl) {
  console.log(`=== Processing Invoice Row ${rowIndex + 1} ===`);
  
  try {
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
    
    if (!ticketCode) {
      throw new Error('Ticket code is required');
    }
    
    // Step 1: Check if invoice already exists with same data
    if (invoiceNumber) {
      console.log(`Step 1: Checking if invoice already exists: ${invoiceNumber}`);
      const existingInvoice = await Invoices.findByInvoiceNumber(invoiceNumber);
      if (existingInvoice) {
        // Calculate amount requested for comparison
        const amountRequested = actualQuantity * itemUnitPrice;
        
        // Check if all data is the same
        const isSameData = 
          existingInvoice.invoicenumber === invoiceNumber &&
          existingInvoice.status === status &&
          existingInvoice.amountrequested === amountRequested.toString() &&
          existingInvoice.invoicedaterequested === invoiceDateRequested;
        
        if (isSameData) {
          console.log(`Step 1 - Invoice already exists with same data, skipping`);
          return {
            success: true,
            row: headerRowIndex + 1 + rowIndex,
            ticketCode,
            invoiceNumber,
            amountRequested,
            skipped: true,
            message: 'Invoice already exists with same data - skipped'
          };
        } else {
          console.log(`Step 1 - Invoice exists but data is different, will update`);
        }
      }
    }
    
    // Step 2: Find ticket
    console.log(`Step 2: Finding ticket with code: ${ticketCode}`);
    const ticket = await Tickets.findByCode(ticketCode);
    if (!ticket) {
      throw new Error(`Ticket not found with code: ${ticketCode}`);
    }
    console.log(`Step 2 - Found ticket:`, ticket);
    
    // Step 3: Update contract number if provided
    if (contractNumber) {
      console.log(`Step 3: Updating contract number to: ${contractNumber}`);
      await Tickets.updateContractNumber(ticket.ticketid, contractNumber);
      console.log(`Step 3 - Contract number updated`);
    }
    
    // Step 4: Calculate amount requested
    const amountRequested = actualQuantity * itemUnitPrice;
    console.log(`Step 4: Calculated amount requested: ${actualQuantity} * ${itemUnitPrice} = ${amountRequested}`);
    
    // Step 5: Check Payline Item Code consistency
    let paylineConsistent = true;
    if (paylineCode) {
      console.log(`Step 5: Checking payline item code: ${paylineCode}`);
      const contractUnit = await ContractUnits.findByItemCode(paylineCode);
      if (!contractUnit) {
        paylineConsistent = false;
        console.log(`Step 5 - Payline item code not found in ContractUnits`);
      } else {
        console.log(`Step 5 - Payline item code found in ContractUnits`);
      }
    }
    
    // Step 6: Create or update invoice
    console.log(`Step 6: Processing invoice for ticket ${ticket.ticketid}`);
    let invoice = await Invoices.findByTicketId(ticket.ticketid);
    
    if (invoice) {
      console.log(`Step 6 - Updating existing invoice ID: ${invoice.invoiceid}`);
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
      console.log(`Step 6 - Creating new invoice`);
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
      skipped: false,
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

// Process a single payment row
async function processPaymentRow(row, indexes, headerRowIndex, rowIndex, fileUrl) {
  console.log(`=== Processing Payment Row ${rowIndex + 1} ===`);
  console.log(`Indexes available:`, indexes);
  console.log(`Row data:`, row);
  
  // Document the mapping for clarity:
  // Excel 'amount' → amountPaid in Payments table
  // Excel 'lineItem.paymentAmount' → amountPaid in Tickets table
  
  try {
    const paymentAmount = indexes['paymentAmount'] !== undefined ? parseFloat(String(row[indexes['paymentAmount']] || 0).replace(/[^\d.-]/g, '')) : 0;
    const lineItemPaymentAmount = indexes['lineItemPaymentAmount'] !== undefined ? parseFloat(String(row[indexes['lineItemPaymentAmount']] || 0).replace(/[^\d.-]/g, '')) : 0;
    const paymentReference = indexes['paymentReference'] !== undefined ? row[indexes['paymentReference']] : undefined;
    const lineItemInvoiceNumber = indexes['lineItemInvoiceNumber'] !== undefined ? row[indexes['lineItemInvoiceNumber']] : undefined;
    const date = indexes['date'] !== undefined ? parseDateValue(row[indexes['date']]) : undefined;
    
    console.log(`Row data extracted:`, {
      rawPaymentAmount: indexes['paymentAmount'] !== undefined ? row[indexes['paymentAmount']] : 'undefined',
      paymentAmount,
      rawLineItemAmount: indexes['lineItemPaymentAmount'] !== undefined ? row[indexes['lineItemPaymentAmount']] : 'undefined',
      lineItemPaymentAmount,
      paymentReference,
      lineItemInvoiceNumber,
      date
    });
    
    if (!lineItemInvoiceNumber) {
      throw new Error('LineItem.InvoiceNumber is required');
    }
    
    if (!paymentReference) {
      throw new Error('Payment Reference is required');
    }
    
    if (!paymentAmount || paymentAmount <= 0) {
      throw new Error('amount must be greater than 0');
    }
    
    if (!lineItemPaymentAmount || lineItemPaymentAmount <= 0) {
      throw new Error('lineItem.paymentAmount must be greater than 0');
    }
    
    // Step 1: Check if payment already exists with same data
    console.log(`Step 1: Checking if payment already exists: ${paymentReference}`);
    const existingPayment = await Payments.findByPaymentNumber(paymentReference);
    if (existingPayment) {
      // Check if all data is the same (convert to numbers for comparison)
      const existingAmount = parseFloat(existingPayment.amountpaid || 0);
      const isSameData = 
        existingPayment.paymentnumber === paymentReference &&
        existingAmount === paymentAmount &&
        existingPayment.datepaid === date;
      
      console.log(`Step 1 - Comparing payment data:`, {
        existingPaymentNumber: existingPayment.paymentnumber,
        newPaymentReference: paymentReference,
        existingAmount: existingAmount,
        newAmount: paymentAmount,
        existingDate: existingPayment.datepaid,
        newDate: date,
        isSameData: isSameData
      });
      
      if (isSameData) {
        console.log(`Step 1 - Payment already exists with same data, skipping`);
        return {
          success: true,
          row: headerRowIndex + 1 + rowIndex,
          paymentReference,
          lineItemInvoiceNumber,
          lineItemPaymentAmount,
          date,
          paymentId: existingPayment.checkid,
          skipped: true,
          message: 'Payment already exists with same data - skipped'
        };
      } else {
        console.log(`Step 1 - Payment exists but data is different, will update`);
      }
    }
    
    // Step 2: Find invoice by invoice number
    console.log(`Step 2: Finding invoice with number: ${lineItemInvoiceNumber}`);
    const invoice = await Invoices.findByInvoiceNumber(lineItemInvoiceNumber);
    if (!invoice) {
      throw new Error(`Invoice not found with number: ${lineItemInvoiceNumber}`);
    }
    console.log(`Step 2 - Found invoice:`, invoice);
    
    // Step 3: Get ticket from invoice
    console.log(`Step 3: Getting ticket for invoice`);
    const ticket = await Tickets.findById(invoice.ticketid);
    if (!ticket) {
      throw new Error(`Ticket not found for invoice: ${lineItemInvoiceNumber}`);
    }
    console.log(`Step 3 - Found ticket:`, ticket);
    
    // Step 4: Create or update payment
    console.log(`Step 4: Processing payment`);
    let payment;
    
                    if (existingPayment) {
                  // Update existing payment with new data
                  console.log(`Step 4 - Updating existing payment ID: ${existingPayment.checkid}`);
                  payment = await Payments.update(
                    existingPayment.checkid,
                    paymentReference,
                    date,
                    paymentAmount,
                    'Completed',
                    fileUrl,
                    ticket.updatedby || 1
                  );
                } else {
                  // Create new payment
                  console.log(`Step 4 - Creating new payment record`);
                  payment = await Payments.create(
                    paymentReference, 
                    date, 
                    paymentAmount, 
                    'Completed',
                    fileUrl, 
                    ticket.createdby || 1, 
                    ticket.updatedby || 1
                  );
                }
    
    console.log(`Step 4 - Payment processed:`, payment);
    
                    // Step 5: Update ticket with paymentId and amountPaid
                console.log(`Step 5: Updating ticket with paymentId and amountPaid`);
                await Tickets.updatePaymentId(ticket.ticketid, payment.checkid);
                await Tickets.updateAmountPaid(ticket.ticketid, lineItemPaymentAmount);
                console.log(`Step 5 - Ticket updated with paymentId: ${payment.checkid} and amountPaid: ${lineItemPaymentAmount}`);
    
    console.log(`=== Payment Row Processing Complete ===`);
    
    return {
      success: true,
      row: headerRowIndex + 1 + rowIndex,
      paymentReference,
      lineItemInvoiceNumber,
      lineItemPaymentAmount,
      date,
      ticketId: ticket.ticketid,
      ticketCode: ticket.ticketcode,
      paymentId: payment.checkid,
      skipped: false,
      message: existingPayment ? 'Payment updated successfully' : 'Payment created successfully'
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
                  lineItemPaymentAmount: indexes['lineItemPaymentAmount'] !== undefined ? row[indexes['lineItemPaymentAmount']] : 'Unknown',
                  error: error.message,
                  data: row
                };
  }
}

exports.analyzeExcel = async (req, res) => {
  try {
    console.log('=== Starting Unified Excel Analysis ===');
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
    let excelType = bestHeader.type;
    
    // If header detection didn't work, try detectExcelType
    if (!excelType) {
      excelType = detectExcelType(headers);
    }
    
    console.log(`Detected Excel type: ${excelType}`);
    
    if (excelType === 'unknown') {
      return res.status(400).json({ 
        error: 'Unknown Excel type', 
        message: 'Could not determine if this is an invoice or payment Excel file. Please check the column headers.',
        headers: headers
      });
    }
    
    // Use appropriate column map based on detected type
    const columnMap = excelType === 'invoice' ? INVOICE_COLUMN_MAP : PAYMENT_COLUMN_MAP;
    const indexes = bestHeader.indexes; // Use the indexes from header detection
    const missing = Object.keys(columnMap).filter(col => !(columnMap[col] in indexes));
    
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
    
    // Build preview
    const preview = dataRows.slice(0, 5).map(row => {
      const obj = {};
      for (const [excelCol, key] of Object.entries(columnMap)) {
        const idx = indexes[key];
        let value = idx !== undefined ? row[idx] : undefined;
        if (key.includes('Date') && value !== undefined) {
          value = parseDateValue(value);
        }
        obj[key] = value;
      }
      return obj;
    });
    
    // Analyze consistency based on Excel type
    let analysisResult;
    if (excelType === 'invoice') {
      analysisResult = await analyzeInvoiceConsistency(dataRows, indexes, bestHeader.rowIdx);
    } else {
      analysisResult = await analyzePaymentConsistency(dataRows, indexes, bestHeader.rowIdx);
    }
    
    console.log('Analysis completed successfully');
    console.log(`Excel type: ${excelType}`);
    console.log(`Found ${analysisResult.consistentItems.length} consistent items`);
    console.log(`Found ${analysisResult.inconsistencies.length} inconsistent items`);
    
    res.json({ 
      excelType,
      headerRow: bestHeader.rowIdx, 
      headers, 
      preview, 
      missing, 
      indexes, 
      ...analysisResult,
      summary: {
        total: dataRows.length,
        consistent: analysisResult.consistentItems.length,
        inconsistent: analysisResult.inconsistencies.length,
        ...analysisResult.summary
      }
    });
  } catch (err) {
    console.error('=== Unified Excel Analysis Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Invalid Excel file', details: err.message });
  }
};

async function analyzeInvoiceConsistency(dataRows, indexes, headerRowIndex) {
  const inconsistencies = [];
  const consistentItems = [];
  const missingItemCodes = new Set();
  const missingTickets = new Set();
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = headerRowIndex + 1 + i;
    
    const ticketIdx = indexes['ticketCode'];
    const paylineIdx = indexes['paylineItemCode'];
    const ticketCode = ticketIdx !== undefined ? row[ticketIdx] : undefined;
    const paylineCode = paylineIdx !== undefined ? row[paylineIdx] : undefined;
    
    let rowInconsistencies = [];
    let isConsistent = true;
    
    if (paylineCode) {
      const exists = await ContractUnits.findByItemCode(paylineCode);
      if (!exists) {
        rowInconsistencies.push({ type: 'payline', code: paylineCode, message: 'Payline item code not found' });
        missingItemCodes.add(paylineCode);
        isConsistent = false;
      }
    }
    
    if (ticketCode) {
      const ticket = await Tickets.findByCode(ticketCode);
      if (!ticket) {
        rowInconsistencies.push({ type: 'ticket', code: ticketCode, message: 'Ticket not found' });
        missingTickets.add(ticketCode);
        isConsistent = false;
      }
    }
    
    if (isConsistent) {
      consistentItems.push({
        row: rowNumber,
        ticketCode,
        paylineCode,
        message: 'All checks passed'
      });
    } else {
      inconsistencies.push({
        row: rowNumber,
        ticketCode,
        paylineCode,
        inconsistencies: rowInconsistencies
      });
    }
  }
  
  const uniqueMissingItemCodes = Array.from(missingItemCodes).sort();
  const uniqueMissingTickets = Array.from(missingTickets).sort();
  
  return {
    inconsistencies,
    consistentItems,
    missingItemCodes: uniqueMissingItemCodes,
    missingItemCodesCount: uniqueMissingItemCodes.length,
    missingTickets: uniqueMissingTickets,
    missingTicketsCount: uniqueMissingTickets.length,
    summary: {
      missingItemCodes: uniqueMissingItemCodes.length,
      missingTickets: uniqueMissingTickets.length
    }
  };
}

async function analyzePaymentConsistency(dataRows, indexes, headerRowIndex) {
  const inconsistencies = [];
  const consistentItems = [];
  const missingInvoices = new Set();
  const existingPayments = new Set();
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = headerRowIndex + 1 + i;
    
    const invoiceIdx = indexes['lineItemInvoiceNumber'];
    const paymentRefIdx = indexes['paymentReference'];
    const paymentAmountIdx = indexes['paymentAmount']; // This maps to amount
    const lineItemPaymentAmountIdx = indexes['lineItemPaymentAmount']; // This maps to lineItem.paymentAmount
    const lineItemInvoiceNumber = invoiceIdx !== undefined ? row[invoiceIdx] : undefined;
    const paymentReference = paymentRefIdx !== undefined ? row[paymentRefIdx] : undefined;
    const paymentAmount = paymentAmountIdx !== undefined ? parseFloat(String(row[paymentAmountIdx] || 0).replace(/[^\d.-]/g, '')) : 0;
    const lineItemPaymentAmount = lineItemPaymentAmountIdx !== undefined ? parseFloat(String(row[lineItemPaymentAmountIdx] || 0).replace(/[^\d.-]/g, '')) : 0;
    
    let rowInconsistencies = [];
    let isConsistent = true;
    
    // Check paymentAmount validity (for Payments table)
    if (!paymentAmount || paymentAmount <= 0) {
      rowInconsistencies.push({ type: 'amount', code: paymentAmount, message: 'amount must be greater than 0' });
      isConsistent = false;
    }
    
    // Check lineItem.paymentAmount validity (for Tickets table)
    if (!lineItemPaymentAmount || lineItemPaymentAmount <= 0) {
      rowInconsistencies.push({ type: 'lineItem.paymentAmount', code: lineItemPaymentAmount, message: 'lineItem.paymentAmount must be greater than 0' });
      isConsistent = false;
    }
    
    if (lineItemInvoiceNumber) {
      const invoice = await Invoices.findByInvoiceNumber(lineItemInvoiceNumber);
      if (!invoice) {
        rowInconsistencies.push({ type: 'invoice', code: lineItemInvoiceNumber, message: 'Invoice not found' });
        missingInvoices.add(lineItemInvoiceNumber);
        isConsistent = false;
      } else {
        const ticket = await Tickets.findById(invoice.ticketid);
        if (!ticket) {
          rowInconsistencies.push({ type: 'ticket', code: lineItemInvoiceNumber, message: 'Ticket not found for invoice' });
          isConsistent = false;
        }
      }
    }
    
    // Check if payment already exists
    if (paymentReference) {
      const existingPayment = await Payments.findByPaymentNumber(paymentReference);
      if (existingPayment) {
        existingPayments.add(paymentReference);
        // Don't mark as inconsistent for existing payments - this is expected
        console.log(`Payment reference ${paymentReference} already exists in database`);
      }
    }
    
    if (isConsistent) {
      consistentItems.push({
        row: rowNumber,
        lineItemInvoiceNumber,
        paymentReference,
        paymentAmount,
        lineItemPaymentAmount,
        message: 'All checks passed'
      });
    } else {
      inconsistencies.push({
        row: rowNumber,
        lineItemInvoiceNumber,
        paymentReference,
        paymentAmount,
        lineItemPaymentAmount,
        inconsistencies: rowInconsistencies
      });
    }
  }
  
  const uniqueMissingInvoices = Array.from(missingInvoices).sort();
  const uniqueExistingPayments = Array.from(existingPayments).sort();
  
  return {
    inconsistencies,
    consistentItems,
    missingInvoices: uniqueMissingInvoices,
    missingInvoicesCount: uniqueMissingInvoices.length,
    existingPayments: uniqueExistingPayments,
    existingPaymentsCount: uniqueExistingPayments.length,
    summary: {
      missingInvoices: uniqueMissingInvoices.length,
      existingPayments: uniqueExistingPayments.length
    }
  };
}

exports.uploadExcel = async (req, res) => {
  try {
    console.log('=== Starting Unified Excel Upload ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('File size:', req.file ? req.file.size : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Step 1: Save file to MinIO
    console.log('Step 1: Saving file to MinIO...');
    const bucket = 'uploads';
    const folder = 'unified/uploaded';
    const originalName = req.file.originalname || 'unified-upload.xlsx';
    const objectName = `${folder}/${Date.now()}_${originalName}`;
    
    const bucketExists = await getMinioClient().bucketExists(bucket).catch(() => false);
    if (!bucketExists) {
      await getMinioClient().makeBucket(bucket);
      console.log(`Created bucket: ${bucket}`);
    }
    
    await getMinioClient().putObject(bucket, objectName, req.file.buffer);
    const fileUrl = objectName;
    console.log(`Step 1 - File saved to MinIO: ${fileUrl}`);

    // Step 2: Parse Excel and detect type
    console.log('Step 2: Parsing Excel file...');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const bestHeader = findBestHeaderRow(rows);
    const headers = rows[bestHeader.rowIdx] || [];
    let excelType = bestHeader.type;
    
    // If header detection didn't work, try detectExcelType
    if (!excelType) {
      excelType = detectExcelType(headers);
    }
    
    console.log(`Step 2 - Detected Excel type: ${excelType}`);
    console.log(`Step 2 - Headers found:`, headers);
    
    if (excelType === 'unknown') {
      return res.status(400).json({
        error: 'Unknown Excel type',
        message: 'Could not determine if this is an invoice or payment Excel file. Please check the column headers.',
        headers: headers
      });
    }
    
    const columnMap = excelType === 'invoice' ? INVOICE_COLUMN_MAP : PAYMENT_COLUMN_MAP;
    const indexes = bestHeader.indexes; // Use the indexes from header detection
    
    console.log(`Step 2 - Column indexes:`, indexes);
    
    // Step 3: Process data rows
    console.log('Step 3: Processing data rows...');
    const dataRows = [];
    for (let i = bestHeader.rowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(cell => !cell)) break;
      dataRows.push(row);
    }
    
    console.log(`Step 3 - Found ${dataRows.length} data rows to process`);
    
    // Step 4: Validate data based on type
    console.log('Step 4: Validating data...');
    let validationResult;
    
    // Add timeout to validation (5 minutes)
    const validationTimeout = 300000; // 5 minutes in milliseconds
    const validationPromise = excelType === 'invoice' 
      ? validateInvoiceData(dataRows, indexes, bestHeader.rowIdx)
      : validatePaymentData(dataRows, indexes, bestHeader.rowIdx);
    
    try {
      validationResult = await Promise.race([
        validationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Validation timeout')), validationTimeout)
        )
      ]);
    } catch (error) {
      console.error('Validation error:', error);
      if (error.message === 'Validation timeout') {
        return res.status(400).json({ 
          error: 'Validation Timeout', 
          message: 'Validation took too long. Please try with a smaller file or contact support.' 
        });
      }
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: error.message 
      });
    }
    
    if (!validationResult.isValid) {
      return res.status(400).json(validationResult.error);
    }
    
    // Step 5: Process each row
    console.log('Step 5: Processing individual rows...');
    const results = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      let result;
      
      if (excelType === 'invoice') {
        result = await processInvoiceRow(row, indexes, bestHeader.rowIdx, i, fileUrl);
      } else {
        result = await processPaymentRow(row, indexes, bestHeader.rowIdx, i, fileUrl);
      }
      
      results.push(result);
    }
    
    // Step 6: Generate summary
    const successful = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.success && r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`=== Unified Excel Upload Complete ===`);
    console.log(`Excel type: ${excelType}`);
    console.log(`Total rows processed: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    
    res.json({ 
      excelType,
      fileUrl, 
      results, 
      totalDataRows: dataRows.length,
      processedRows: successful,
      skippedRows: skipped,
      failedRows: failed,
      summary: {
        total: results.length,
        successful,
        skipped,
        failed,
        successRate: results.length > 0 ? Math.round(((successful + skipped) / results.length) * 100) : 0
      }
    });
  } catch (err) {
    console.error('=== Unified Excel Upload Error ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(400).json({ error: 'Upload failed', details: err.message });
  }
};

async function validateInvoiceData(dataRows, indexes, headerRowIndex) {
  const missingItemCodes = new Set();
  const rowsWithMissingCodes = [];
  
  console.log(`Invoice validation - Starting validation for ${dataRows.length} rows...`);
  
  try {
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = headerRowIndex + 1 + i;
      
      // Check for missing payline item codes (only these are required)
      const paylineIdx = indexes['paylineItemCode'];
      const paylineCode = paylineIdx !== undefined ? row[paylineIdx] : undefined;
      if (paylineCode) {
        try {
          const exists = await ContractUnits.findByItemCode(paylineCode);
          if (!exists) {
            missingItemCodes.add(paylineCode);
            rowsWithMissingCodes.push({ row: rowNumber, paylineCode });
          }
        } catch (error) {
          console.error(`Invoice validation - Error checking payline code ${paylineCode}:`, error);
          // Continue processing other rows even if one fails
        }
      }
      
      // Log progress every 50 rows
      if ((i + 1) % 50 === 0) {
        console.log(`Invoice validation - Processed ${i + 1}/${dataRows.length} rows...`);
      }
    }
    
    const uniqueMissingItemCodes = Array.from(missingItemCodes).sort();
    
    console.log(`Invoice validation - Completed validation. Found ${uniqueMissingItemCodes.length} missing item codes.`);
    
    // Return error if there are missing item codes (these are required)
    if (uniqueMissingItemCodes.length > 0) {
      return {
        isValid: false,
        error: {
          error: 'Missing Payline Item Codes',
          message: `The following ${uniqueMissingItemCodes.length} payline item codes are not found in the system:`,
          missingItemCodes: uniqueMissingItemCodes,
          missingItemCodesCount: uniqueMissingItemCodes.length,
          rowsWithMissingCodes: rowsWithMissingCodes,
          totalRowsChecked: dataRows.length
        }
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error(`Invoice validation - Unexpected error:`, error);
    throw error;
  }
}

async function validatePaymentData(dataRows, indexes, headerRowIndex) {
  const missingInvoices = new Set();
  const existingPayments = new Set();
  const rowsWithMissingInvoices = [];
  const rowsWithExistingPayments = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const invoiceIdx = indexes['lineItemInvoiceNumber'];
    const paymentRefIdx = indexes['paymentReference'];
    const lineItemInvoiceNumber = invoiceIdx !== undefined ? row[invoiceIdx] : undefined;
    const paymentReference = paymentRefIdx !== undefined ? row[paymentRefIdx] : undefined;
    
    if (lineItemInvoiceNumber) {
      const exists = await Invoices.findByInvoiceNumber(lineItemInvoiceNumber);
      if (!exists) {
        missingInvoices.add(lineItemInvoiceNumber);
        rowsWithMissingInvoices.push({ row: headerRowIndex + 1 + i, lineItemInvoiceNumber });
      }
    }
    
    // Check for existing payments
    if (paymentReference) {
      const existingPayment = await Payments.findByPaymentNumber(paymentReference);
      if (existingPayment) {
        existingPayments.add(paymentReference);
        rowsWithExistingPayments.push({ row: headerRowIndex + 1 + i, paymentReference });
      }
    }
  }
  
  const uniqueMissingInvoices = Array.from(missingInvoices).sort();
  const uniqueExistingPayments = Array.from(existingPayments).sort();
  
  // For payment files, missing invoices are expected and should not block the upload
  // Instead, we'll log them but allow the upload to proceed
  if (uniqueMissingInvoices.length > 0) {
    console.log(`Payment validation - Found ${uniqueMissingInvoices.length} missing invoices (this is expected):`, uniqueMissingInvoices);
    console.log(`Payment validation - Rows with missing invoices:`, rowsWithMissingInvoices);
  }
  
  // Log existing payments but don't block upload
  if (uniqueExistingPayments.length > 0) {
    console.log(`Payment validation - Found ${uniqueExistingPayments.length} existing payments (this is expected):`, uniqueExistingPayments);
    console.log(`Payment validation - Rows with existing payments:`, rowsWithExistingPayments);
  }
  
  return { isValid: true };
} 