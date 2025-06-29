const express = require("express");
const { 
  uploadExcel, 
  listRTRExcels, 
  listRTRFiles, 
  downloadRTRExcel, 
  downloadFileByKey,
  analyzeRTRData, 
  saveRTRDataWithDecisions,
  uploadForStepper,
  analyzeForStepper,
  validateStepperData,
  saveStepperData
} = require("../../controllers/RTR/rtrController");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Specific middleware for analyze endpoint to handle large payloads
const analyzeMiddleware = express.json({ limit: '100mb' });

// Health check endpoint for RTR module
router.get("/health", (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    module: 'RTR',
    message: 'RTR API is running',
    endpoints: {
      upload: 'POST /rtr',
      list: 'GET /rtr/list',
      files: 'GET /rtr/files',
      download: 'GET /rtr/download/:rtrId',
      downloadByKey: 'GET /rtr/download-file/:bucket/:objectKey',
      analyze: 'POST /rtr/analyze',
      saveWithDecisions: 'POST /rtr/save-with-decisions',
      stepper: {
        upload: 'POST /rtr/stepper/upload',
        analyze: 'POST /rtr/stepper/analyze',
        validate: 'POST /rtr/stepper/validate',
        save: 'POST /rtr/stepper/save'
      }
    }
  });
});

router.post("/", upload.single("file"), uploadExcel);

// List all RTR Excel files
router.get("/list", listRTRExcels);

// List all RTR files (uploaded and generated)
router.get("/files", listRTRFiles);

// Download a specific RTR Excel file by rtrId
router.get("/download/:rtrId", downloadRTRExcel);

// Download a file directly by bucket and object key
router.get("/download-file/:bucket/:objectKey", downloadFileByKey);

// Download a file from default bucket (uploads) by object key
router.get("/download-file/:objectKey", (req, res) => {
  req.params.bucket = 'uploads';
  downloadFileByKey(req, res);
});

// Analyze RTR data for new tickets and inconsistencies
router.post("/analyze", analyzeMiddleware, analyzeRTRData);

// Save RTR data with user decisions
router.post("/save-with-decisions", analyzeMiddleware, saveRTRDataWithDecisions);

// ================================================================================
// STEPPER WORKFLOW ROUTES
// ================================================================================

// Step 1: Upload file for stepper workflow
router.post("/stepper/upload", upload.single("file"), uploadForStepper);

// Step 2: Analyze data for stepper workflow
router.post("/stepper/analyze", analyzeMiddleware, analyzeForStepper);

// Step 3: Validate data before saving
router.post("/stepper/validate", analyzeMiddleware, validateStepperData);

// Step 4: Save all stepper data
router.post("/stepper/save", analyzeMiddleware, saveStepperData);

/**
 * @swagger
 * /rtr/health:
 *   get:
 *     summary: Check RTR API health status
 *     tags: [RTR]
 *     responses:
 *       200:
 *         description: RTR API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 module:
 *                   type: string
 *                   example: RTR
 *                 message:
 *                   type: string
 *                   example: RTR API is running
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     upload:
 *                       type: string
 *                       example: POST /rtr
 *                     list:
 *                       type: string
 *                       example: GET /rtr/list
 *                     files:
 *                       type: string
 *                       example: GET /rtr/files
 *                     download:
 *                       type: string
 *                       example: GET /rtr/download/:rtrId
 *                     downloadByKey:
 *                       type: string
 *                       example: GET /rtr/download-file/:bucket/:objectKey
 *                     analyze:
 *                       type: string
 *                       example: POST /rtr/analyze
 *                     saveWithDecisions:
 *                       type: string
 *                       example: POST /rtr/save-with-decisions
 *                     stepper:
 *                       type: object
 *                       properties:
 *                         upload:
 *                           type: string
 *                           example: POST /rtr/stepper/upload
 *                           description: Step 1 - Upload and parse Excel file
 *                         analyze:
 *                           type: string
 *                           example: POST /rtr/stepper/analyze
 *                           description: Step 2 - Analyze data for new/inconsistent tickets
 *                         validate:
 *                           type: string
 *                           example: POST /rtr/stepper/validate
 *                           description: Step 3 - Validate data before saving
 *                         save:
 *                           type: string
 *                           example: POST /rtr/stepper/save
 *                           description: Step 4 - Save to database and MinIO
 *
 * @swagger
 * /rtr:
 *   post:
 *     summary: Upload an RTR Excel file
 *     tags: [RTR]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The RTR Excel file to upload
 *     responses:
 *       200:
 *         description: RTR Excel file uploaded and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sheetCount:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                 savedToDatabase:
 *                   type: boolean
 *       500:
 *         description: Failed to process file
 *
 * @swagger
 * /rtr/list:
 *   get:
 *     summary: List all uploaded RTR Excel files
 *     tags: [RTR]
 *     responses:
 *       200:
 *         description: List of RTR Excel files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rtrs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rtrId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       deletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *
 * /rtr/download/{rtrId}:
 *   get:
 *     summary: Download a specific RTR Excel file by rtrId
 *     tags: [RTR]
 *     parameters:
 *       - in: path
 *         name: rtrId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the RTR Excel file
 *     responses:
 *       200:
 *         description: The Excel file will be downloaded as an attachment
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: RTR not found
 *
 * @swagger
 * /rtr/analyze:
 *   post:
 *     summary: Analyze RTR data to identify new tickets and inconsistencies
 *     tags: [RTR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 description: Array of RTR data rows from Excel
 *                 items:
 *                   type: object
 *                   properties:
 *                     RESTN_WO_NUM:
 *                       type: string
 *                       description: Rest number
 *                     TASK_WO_NUM:
 *                       type: string
 *                       description: Task number
 *                     PGL_ComD_Wments:
 *                       type: string
 *                       description: PGL comments
 *                     Contractor_Comments:
 *                       type: string
 *                       description: Contractor comments
 *                     SHOP:
 *                       type: string
 *                       description: Shop information
 *                     SQ_MI:
 *                       type: number
 *                       description: Square miles
 *                     Earliest_Rpt_Dt:
 *                       type: string
 *                       format: date
 *                       description: Earliest report date
 *                     ADDRESS:
 *                       type: string
 *                       description: Address
 *                     STREET_FROM_RES:
 *                       type: string
 *                       description: Street from
 *                     STREET_TO_RES:
 *                       type: string
 *                       description: Street to
 *                     NOTES2_RES:
 *                       type: string
 *                       description: Notes
 *                     SAP_ITEM_NUM:
 *                       type: string
 *                       description: SAP item number
 *                     LOCATION2_RES:
 *                       type: string
 *                       description: Location
 *                     length_x_width:
 *                       type: string
 *                       description: Dimensions
 *                     AGENCY_NO:
 *                       type: number
 *                       description: Agency number
 *                     ILL_ONLY:
 *                       type: string
 *                       description: Illinois only flag
 *                     START_DATE:
 *                       type: string
 *                       format: date
 *                       description: Start date
 *                     EXP_DATE:
 *                       type: string
 *                       format: date
 *                       description: Expiration date
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     newTickets:
 *                       type: array
 *                       description: Array of new tickets to be created
 *                       items:
 *                         type: object
 *                         properties:
 *                           excelData:
 *                             type: object
 *                           ticketCode:
 *                             type: string
 *                     inconsistentTickets:
 *                       type: array
 *                       description: Array of tickets with inconsistencies
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketId:
 *                             type: integer
 *                           ticketCode:
 *                             type: string
 *                           excelData:
 *                             type: object
 *                           databaseData:
 *                             type: object
 *                           inconsistencies:
 *                             type: array
 *                             description: Array of field inconsistencies
 *                             items:
 *                               type: object
 *                               properties:
 *                                 field:
 *                                   type: string
 *                                   description: Excel field name
 *                                   example: "Contractor Comments"
 *                                 databaseField:
 *                                   type: string
 *                                   description: Database field name
 *                                   example: "comment7d"
 *                                 excelValue:
 *                                   type: string
 *                                   description: Value from Excel
 *                                   example: "TK - COMPLETED"
 *                                 databaseValue:
 *                                   type: string
 *                                   description: Value from database
 *                                   example: "TK - Schedule"
 *                                 type:
 *                                   type: string
 *                                   description: Field type (text, number, date)
 *                                   example: "text"
 *                                 taskWoNum:
 *                                   type: string
 *                                   description: Task work order number
 *                                   example: "TK6514243"
 *                                 address:
 *                                   type: string
 *                                   description: Address for context
 *                                   example: "2821 W WILCOX ST"
 *                                 restWoNum:
 *                                   type: string
 *                                   description: Rest work order number
 *                                   example: "MX5035817"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         new:
 *                           type: integer
 *                         inconsistent:
 *                           type: integer
 *                         matching:
 *                           type: integer
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 *
 * @swagger
 * /rtr/save-with-decisions:
 *   post:
 *     summary: Save RTR data with user decisions for inconsistencies
 *     tags: [RTR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newTickets:
 *                 type: array
 *                 description: Array of new tickets to create
 *                 items:
 *                   type: object
 *                   properties:
 *                     excelData:
 *                       type: object
 *                     ticketCode:
 *                       type: string
 *               inconsistentTickets:
 *                 type: array
 *                 description: Array of tickets with inconsistencies
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                     ticketCode:
 *                       type: string
 *                     excelData:
 *                       type: object
 *                     databaseData:
 *                       type: object
 *                     inconsistencies:
 *                       type: array
 *               decisions:
 *                 type: object
 *                 description: User decisions for each ticket field. Keys are ticket IDs, values are objects with field names as keys and "excel" or "database" as values.
 *                 example: {
 *                   "2": {
 *                     "Contractor Comments": "excel",
 *                     "PGL ComD:Wments": "database",
 *                     "NOTES2_RES": "excel"
 *                   },
 *                   "5": {
 *                     "ADDRESS": "excel",
 *                     "SQFT_QTY_RES": "database"
 *                   }
 *                 }
 *                 additionalProperties:
 *                   type: object
 *                   description: Field decisions for a specific ticket
 *                   additionalProperties:
 *                     type: string
 *                     enum: [excel, database]
 *                     description: Whether to use the Excel value or keep the database value for this field
 *               createdBy:
 *                 type: integer
 *                 description: User ID who created the data
 *               updatedBy:
 *                 type: integer
 *                 description: User ID who updated the data
 *     responses:
 *       200:
 *         description: Data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: object
 *                   properties:
 *                     newTicketsCreated:
 *                       type: array
 *                     ticketsUpdated:
 *                       type: array
 *                     errors:
 *                       type: array
 *       500:
 *         description: Server error
 *
 * @swagger
 * /rtr/stepper/upload:
 *   post:
 *     summary: Step 1 - Upload and parse RTR Excel file for stepper workflow
 *     description: Uploads an Excel file, parses it, and returns the parsed data for analysis. File is NOT saved to MinIO yet.
 *     tags: [RTR Stepper]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The RTR Excel file to upload and parse
 *     responses:
 *       200:
 *         description: File parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 fileInfo:
 *                   type: object
 *                   properties:
 *                     originalName:
 *                       type: string
 *                       example: "Seven-D_RTR_04-21-25.xlsx"
 *                     size:
 *                       type: integer
 *                       example: 24576
 *                     mimetype:
 *                       type: string
 *                       example: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
 *                 parsedData:
 *                   type: array
 *                   description: Array of parsed Excel rows
 *                   items:
 *                     type: object
 *                     properties:
 *                       RESTN_WO_NUM:
 *                         type: string
 *                         description: Rest number
 *                       TASK_WO_NUM:
 *                         type: string
 *                         description: Task number
 *                       SAP_ITEM_NUM:
 *                         type: string
 *                         description: SAP item number
 *                       SQFT_QTY_RES:
 *                         type: number
 *                         description: Quantity (auto-assigned to 1 if null)
 *                       ADDRESS:
 *                         type: string
 *                         description: Address
 *                 totalRows:
 *                   type: integer
 *                   example: 150
 *                 message:
 *                   type: string
 *                   example: "File parsed successfully. Ready for analysis."
 *       400:
 *         description: Invalid file or parsing error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Sheet 'Seven-D' not found in the Excel file"
 *                 availableSheets:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error
 *
 * @swagger
 * /rtr/stepper/analyze:
 *   post:
 *     summary: Step 2 - Analyze parsed RTR data for new tickets and inconsistencies
 *     description: Analyzes the parsed data to identify new tickets, inconsistent tickets, and missing information
 *     tags: [RTR Stepper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parsedData
 *             properties:
 *               parsedData:
 *                 type: array
 *                 description: Array of parsed Excel rows from step 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     RESTN_WO_NUM:
 *                       type: string
 *                       description: Rest number
 *                     TASK_WO_NUM:
 *                       type: string
 *                       description: Task number
 *                     SAP_ITEM_NUM:
 *                       type: string
 *                       description: SAP item number
 *                     SQFT_QTY_RES:
 *                       type: number
 *                       description: Quantity (auto-assigned to 1 if null)
 *                     ADDRESS:
 *                       type: string
 *                       description: Address
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     newTickets:
 *                       type: array
 *                       description: Array of new tickets to be created
 *                       items:
 *                         type: object
 *                         properties:
 *                           excelData:
 *                             type: object
 *                             description: The parsed Excel data for this ticket
 *                           ticketCode:
 *                             type: string
 *                             description: The ticket code (RESTN_WO_NUM or TASK_WO_NUM)
 *                     inconsistentTickets:
 *                       type: array
 *                       description: Array of tickets with inconsistencies
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketId:
 *                             type: integer
 *                             description: Database ticket ID
 *                           ticketCode:
 *                             type: string
 *                             description: The ticket code
 *                           excelData:
 *                             type: object
 *                             description: The parsed Excel data
 *                           databaseData:
 *                             type: object
 *                             description: The current database data for this ticket
 *                             properties:
 *                               ticketId:
 *                                 type: integer
 *                                 description: Database ticket ID
 *                               ticketCode:
 *                                 type: string
 *                                 description: Ticket code
 *                               comment7d:
 *                                 type: string
 *                                 description: 7D comments
 *                               partnercomment:
 *                                 type: string
 *                                 description: Partner comments
 *                               partnersupervisorcomment:
 *                                 type: string
 *                                 description: Partner supervisor comments
 *                               address:
 *                                 type: string
 *                                 description: Address
 *                               quantity:
 *                                 type: number
 *                                 description: Quantity
 *                           inconsistencies:
 *                             type: array
 *                             description: Array of field inconsistencies
 *                             items:
 *                               type: object
 *                               properties:
 *                                 field:
 *                                   type: string
 *                                   description: Excel field name
 *                                   example: "Contractor Comments"
 *                                 databaseField:
 *                                   type: string
 *                                   description: Database field name
 *                                   example: "comment7d"
 *                                 excelValue:
 *                                   type: string
 *                                   description: Value from Excel
 *                                   example: "TK - COMPLETED"
 *                                 databaseValue:
 *                                   type: string
 *                                   description: Value from database
 *                                   example: "TK - Schedule"
 *                                 type:
 *                                   type: string
 *                                   description: Field type (text, number, date)
 *                                   example: "text"
 *                                 taskWoNum:
 *                                   type: string
 *                                   description: Task work order number
 *                                   example: "TK6514243"
 *                                 address:
 *                                   type: string
 *                                   description: Address for context
 *                                   example: "2821 W WILCOX ST"
 *                                 restWoNum:
 *                                   type: string
 *                                   description: Rest work order number
 *                                   example: "MX5035817"
 *                     matchingTickets:
 *                       type: array
 *                       description: Array of tickets that match exactly
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketId:
 *                             type: integer
 *                           ticketCode:
 *                             type: string
 *                           excelData:
 *                             type: object
 *                           databaseData:
 *                             type: object
 *                     missingInfo:
 *                       type: array
 *                       description: Array of rows with missing required information
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketCode:
 *                             type: string
 *                           row:
 *                             type: object
 *                           missingFields:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 field:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of rows analyzed
 *                         new:
 *                           type: integer
 *                           description: Number of new tickets
 *                         inconsistent:
 *                           type: integer
 *                           description: Number of inconsistent tickets
 *                         matching:
 *                           type: integer
 *                           description: Number of matching tickets
 *                         missingInfo:
 *                           type: integer
 *                           description: Number of rows with missing info
 *                 message:
 *                   type: string
 *                   example: "Analysis completed successfully"
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 *
 * @swagger
 * /rtr/stepper/validate:
 *   post:
 *     summary: Step 3 - Validate data before saving
 *     description: Validates all data (new tickets, inconsistent tickets with decisions, filled missing info) before saving to database
 *     tags: [RTR Stepper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newTickets:
 *                 type: array
 *                 description: Array of new tickets to validate
 *                 items:
 *                   type: object
 *                   properties:
 *                     excelData:
 *                       type: object
 *                       description: The Excel data for this ticket
 *                       properties:
 *                         RESTN_WO_NUM:
 *                           type: string
 *                           description: Rest number
 *                         TASK_WO_NUM:
 *                           type: string
 *                           description: Task number
 *                         ADDRESS:
 *                           type: string
 *                           description: Address
 *                         "Contractor Comments":
 *                           type: string
 *                           description: Contractor comments
 *                         "PGL ComD:Wments":
 *                           type: string
 *                           description: PGL comments
 *                         SAP_ITEM_NUM:
 *                           type: string
 *                           description: SAP item number
 *                         SQFT_QTY_RES:
 *                           type: number
 *                           description: Quantity
 *                         NOTES2_RES:
 *                           type: string
 *                           description: Additional notes
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *               inconsistentTickets:
 *                 type: array
 *                 description: Array of inconsistent tickets to validate
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                     ticketCode:
 *                       type: string
 *                     excelData:
 *                       type: object
 *                     databaseData:
 *                       type: object
 *                     inconsistencies:
 *                       type: array
 *               decisions:
 *                 type: object
 *                 description: User decisions for each ticket field. Keys are ticket IDs, values are objects with field names as keys and "excel" or "database" as values.
 *                 example: {
 *                   "2": {
 *                     "Contractor Comments": "excel",
 *                     "PGL ComD:Wments": "database",
 *                     "NOTES2_RES": "excel"
 *                   },
 *                   "5": {
 *                     "ADDRESS": "excel",
 *                     "SQFT_QTY_RES": "database"
 *                   }
 *                 }
 *                 additionalProperties:
 *                   type: object
 *                   description: Field decisions for a specific ticket
 *                   additionalProperties:
 *                     type: string
 *                     enum: [excel, database]
 *                     description: Whether to use the Excel value or keep the database value for this field
 *               missingInfoFilled:
 *                 type: array
 *                 description: Array of filled missing information
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketCode:
 *                       type: string
 *                     data:
 *                       type: object
 *                       description: The filled data
 *                       properties:
 *                         RESTN_WO_NUM:
 *                           type: string
 *                           description: Rest number
 *                         TASK_WO_NUM:
 *                           type: string
 *                           description: Task number
 *                         ADDRESS:
 *                           type: string
 *                           description: Address
 *                         "Contractor Comments":
 *                           type: string
 *                           description: Contractor comments
 *                         "PGL ComD:Wments":
 *                           type: string
 *                           description: PGL comments
 *                         SAP_ITEM_NUM:
 *                           type: string
 *                           description: SAP item number
 *                         SQFT_QTY_RES:
 *                           type: number
 *                           description: Quantity
 *                         NOTES2_RES:
 *                           type: string
 *                           description: Additional notes
 *               skippedRows:
 *                 type: array
 *                 description: Array of rows that were skipped
 *                 items:
 *                   type: object
 *                   properties:
 *                     reason:
 *                       type: string
 *                       description: Reason for skipping
 *     responses:
 *       200:
 *         description: Validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 validation:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       description: Whether all data is valid
 *                     errors:
 *                       type: array
 *                       description: Array of validation errors
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketCode:
 *                             type: string
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *                     warnings:
 *                       type: array
 *                       description: Array of validation warnings
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalTickets:
 *                           type: integer
 *                         validTickets:
 *                           type: integer
 *                         invalidTickets:
 *                           type: integer
 *                         skippedTickets:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: "All data is valid and ready to save"
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 *
 * @swagger
 * /rtr/stepper/save:
 *   post:
 *     summary: Step 4 - Save all stepper data to database and MinIO
 *     description: Saves the original file to MinIO, processes all tickets, and generates a processed Excel file
 *     tags: [RTR Stepper]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileInfo
 *             properties:
 *               fileInfo:
 *                 type: object
 *                 description: File information from step 1
 *                 properties:
 *                   originalName:
 *                     type: string
 *                     example: "Seven-D_RTR_04-21-25.xlsx"
 *                   buffer:
 *                     type: string
 *                     format: binary
 *                     description: File buffer (base64 encoded)
 *                   size:
 *                     type: integer
 *                   mimetype:
 *                     type: string
 *               newTickets:
 *                 type: array
 *                 description: Array of new tickets to create
 *                 items:
 *                   type: object
 *                   properties:
 *                     excelData:
 *                       type: object
 *                     ticketCode:
 *                       type: string
 *               inconsistentTickets:
 *                 type: array
 *                 description: Array of inconsistent tickets to update
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                     ticketCode:
 *                       type: string
 *                     excelData:
 *                       type: object
 *                     databaseData:
 *                       type: object
 *                     inconsistencies:
 *                       type: array
 *               decisions:
 *                 type: object
 *                 description: User decisions for each ticket field. Keys are ticket IDs, values are objects with field names as keys and "excel" or "database" as values.
 *                 example: {
 *                   "2": {
 *                     "Contractor Comments": "excel",
 *                     "PGL ComD:Wments": "database",
 *                     "NOTES2_RES": "excel"
 *                   },
 *                   "5": {
 *                     "ADDRESS": "excel",
 *                     "SQFT_QTY_RES": "database"
 *                   }
 *                 }
 *                 additionalProperties:
 *                   type: object
 *                   description: Field decisions for a specific ticket
 *                   additionalProperties:
 *                     type: string
 *                     enum: [excel, database]
 *                     description: Whether to use the Excel value or keep the database value for this field
 *               missingInfoFilled:
 *                 type: array
 *                 description: Array of filled missing information
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketCode:
 *                       type: string
 *                     data:
 *                       type: object
 *                       description: The filled data
 *                       properties:
 *                         RESTN_WO_NUM:
 *                           type: string
 *                           description: Rest number
 *                         TASK_WO_NUM:
 *                           type: string
 *                           description: Task number
 *                         ADDRESS:
 *                           type: string
 *                           description: Address
 *                         "Contractor Comments":
 *                           type: string
 *                           description: Contractor comments
 *                         "PGL ComD:Wments":
 *                           type: string
 *                           description: PGL comments
 *                         SAP_ITEM_NUM:
 *                           type: string
 *                           description: SAP item number
 *                         SQFT_QTY_RES:
 *                           type: number
 *                           description: Quantity
 *                         NOTES2_RES:
 *                           type: string
 *                           description: Additional notes
 *               skippedRows:
 *                 type: array
 *                 description: Array of rows that were skipped
 *                 items:
 *                   type: object
 *                   properties:
 *                     reason:
 *                       type: string
 *               createdBy:
 *                 type: integer
 *                 description: User ID who created the data
 *               updatedBy:
 *                 type: integer
 *                 description: User ID who updated the data
 *     responses:
 *       200:
 *         description: Data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rtrId:
 *                   type: integer
 *                   description: The RTR record ID
 *                 rtrName:
 *                   type: string
 *                   description: The original file name
 *                 originalFileUrl:
 *                   type: string
 *                   description: URL to download the original file
 *                   example: "http://localhost:9000/uploads/rtr/uploaded/1751039650467-Seven-D_RTR_04-21-25.xlsx"
 *                 results:
 *                   type: object
 *                   properties:
 *                     newTicketsCreated:
 *                       type: array
 *                       description: Array of successfully created tickets
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketCode:
 *                             type: string
 *                           result:
 *                             type: object
 *                     ticketsUpdated:
 *                       type: array
 *                       description: Array of successfully updated tickets
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketId:
 *                             type: integer
 *                           ticketCode:
 *                             type: string
 *                           result:
 *                             type: object
 *                     skippedTickets:
 *                       type: array
 *                       description: Array of skipped tickets
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketCode:
 *                             type: string
 *                           reason:
 *                             type: string
 *                     errors:
 *                       type: array
 *                       description: Array of errors that occurred
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketCode:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of tickets processed
 *                         created:
 *                           type: integer
 *                           description: Number of tickets created
 *                         updated:
 *                           type: integer
 *                           description: Number of tickets updated
 *                         skipped:
 *                           type: integer
 *                           description: Number of tickets skipped
 *                         failed:
 *                           type: integer
 *                           description: Number of tickets that failed
 *                 generatedFileUrl:
 *                   type: string
 *                   description: URL to download the processed Excel file
 *                   example: "http://localhost:9000/uploads/rtr/generated/123-1751039650467-stepper-processed.xlsx"
 *                 message:
 *                   type: string
 *                   example: "Processing completed. 2 created, 1 updated, 1 skipped, 0 failed."
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */

module.exports = router;
