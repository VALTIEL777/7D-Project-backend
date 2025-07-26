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
  saveStepperData,
  updateTicketsWithDatabaseValues,
  updatePermitStatuses,
  generateTicketStatuses
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

// Update Excel file with database values
router.post("/update-with-database", upload.single("file"), updateTicketsWithDatabaseValues);

// Update permit statuses based on expiration dates
router.post("/update-permit-statuses", updatePermitStatuses);

// Generate TicketStatus records for tickets
router.post("/generate-ticket-statuses", generateTicketStatuses);

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
 * @swagger
 * /rtr/files:
 *   get:
 *     summary: List all RTR files from MinIO storage (uploaded and generated)
 *     description: Retrieves all RTR files stored in MinIO, separated by type (uploaded vs generated). This endpoint provides direct access to file system data with presigned download URLs.
 *     tags: [RTR]
 *     responses:
 *       200:
 *         description: List of RTR files from MinIO storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: object
 *                   description: Files organized by type
 *                   properties:
 *                     uploaded:
 *                       type: array
 *                       description: Original files uploaded by users
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: File name (without folder path)
 *                             example: "1705123456789-Seven-D_RTR_04-21-25.xlsx"
 *                           size:
 *                             type: integer
 *                             description: File size in bytes
 *                             example: 24576
 *                           lastModified:
 *                             type: string
 *                             format: date-time
 *                             description: Last modification date
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           type:
 *                             type: string
 *                             description: File type classification
 *                             example: "uploaded"
 *                           url:
 *                             type: string
 *                             description: Presigned download URL (valid for 1 hour)
 *                             example: "http://localhost:9000/uploads/rtr/uploaded/1705123456789-Seven-D_RTR_04-21-25.xlsx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
 *                           objectKey:
 *                             type: string
 *                             description: MinIO object key for direct access
 *                             example: "rtr/uploaded/1705123456789-Seven-D_RTR_04-21-25.xlsx"
 *                           error:
 *                             type: string
 *                             description: Error message if URL generation failed
 *                             nullable: true
 *                             example: "Failed to generate download URL"
 *                     generated:
 *                       type: array
 *                       description: Files generated by the system (processed, updated, etc.)
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: File name (without folder path)
 *                             example: "1705123456789-Seven-D_RTR_04-21-25_updated_2024-01-15.xlsx"
 *                           size:
 *                             type: integer
 *                             description: File size in bytes
 *                             example: 25600
 *                           lastModified:
 *                             type: string
 *                             format: date-time
 *                             description: Last modification date
 *                             example: "2024-01-15T11:45:00.000Z"
 *                           type:
 *                             type: string
 *                             description: File type classification
 *                             example: "generated"
 *                           url:
 *                             type: string
 *                             description: Presigned download URL (valid for 1 hour)
 *                             example: "http://localhost:9000/uploads/rtr/generated/1705123456789-Seven-D_RTR_04-21-25_updated_2024-01-15.xlsx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
 *                           objectKey:
 *                             type: string
 *                             description: MinIO object key for direct access
 *                             example: "rtr/generated/1705123456789-Seven-D_RTR_04-21-25_updated_2024-01-15.xlsx"
 *                           error:
 *                             type: string
 *                             description: Error message if URL generation failed
 *                             nullable: true
 *                             example: "Failed to generate download URL"
 *                 debug:
 *                   type: object
 *                   description: Debug information about the request
 *                   properties:
 *                     bucketExists:
 *                       type: boolean
 *                       description: Whether the MinIO bucket exists
 *                       example: true
 *                     bucket:
 *                       type: string
 *                       description: MinIO bucket name
 *                       example: "uploads"
 *                     uploadedFolder:
 *                       type: string
 *                       description: Folder path for uploaded files
 *                       example: "rtr/uploaded"
 *                     generatedFolder:
 *                       type: string
 *                       description: Folder path for generated files
 *                       example: "rtr/generated"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to list RTR files"
 *                 details:
 *                   type: string
 *                   example: "MinIO connection failed"
 *                 stack:
 *                   type: string
 *                   description: Error stack trace (development only)
 *
 * @swagger
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
 *     summary: Save all stepper data to database and MinIO
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
 *               - newTickets
 *               - inconsistentTickets
 *               - decisions
 *               - missingInfoFilled
 *               - skippedRows
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               fileInfo:
 *                 type: object
 *                 properties:
 *                   originalName:
 *                     type: string
 *                     example: "Seven-D_RTR_04-21-25.xlsx"
 *                   buffer:
 *                     type: string
 *                     format: base64
 *                     description: Base64 encoded file content
 *                   size:
 *                     type: integer
 *                     example: 24576
 *                   mimetype:
 *                     type: string
 *                     example: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
 *               newTickets:
 *                 type: array
 *                 description: Array of new tickets to create
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
 *                         NOTES2_RES:
 *                           type: string
 *                           description: Notes
 *                         SAP_ITEM_NUM:
 *                           type: string
 *                           description: SAP item number
 *                         LOCATION2_RES:
 *                           type: string
 *                           description: Location
 *                         length_x_width:
 *                           type: string
 *                           description: Dimensions
 *                         AGENCY_NO:
 *                           type: string
 *                           description: Agency number
 *                         START_DATE:
 *                           type: string
 *                           description: Start date
 *                         EXP_DATE:
 *                           type: string
 *                           description: Expiration date
 *                         SQFT_QTY_RES:
 *                           type: number
 *                           description: Quantity
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *                       example: "TK6514243"
 *               inconsistentTickets:
 *                 type: array
 *                 description: Array of tickets with inconsistencies
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: integer
 *                       description: Database ticket ID
 *                       example: 2
 *                     ticketCode:
 *                       type: string
 *                       description: Ticket code
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
 *                         NOTES2_RES:
 *                           type: string
 *                           description: Notes
 *                         SAP_ITEM_NUM:
 *                           type: string
 *                           description: SAP item number
 *                         LOCATION2_RES:
 *                           type: string
 *                           description: Location
 *                         length_x_width:
 *                           type: string
 *                           description: Dimensions
 *                         AGENCY_NO:
 *                           type: string
 *                           description: Agency number
 *                         START_DATE:
 *                           type: string
 *                           description: Start date
 *                         EXP_DATE:
 *                           type: string
 *                           description: Expiration date
 *                         SQFT_QTY_RES:
 *                           type: number
 *                           description: Quantity
 *                     databaseData:
 *                       type: object
 *                       description: The current database data for this ticket
 *                       properties:
 *                         ticketId:
 *                           type: integer
 *                           description: Database ticket ID
 *                         ticketCode:
 *                           type: string
 *                           description: Ticket code
 *                         comment7d:
 *                           type: string
 *                           description: 7D comments
 *                         partnercomment:
 *                           type: string
 *                           description: Partner comments
 *                         partnersupervisorcomment:
 *                           type: string
 *                           description: Partner supervisor comments
 *                         contractnumber:
 *                           type: string
 *                           description: Contract number
 *                         amounttopay:
 *                           type: number
 *                           description: Amount to pay
 *                         quantity:
 *                           type: number
 *                           description: Quantity
 *                         tickettype:
 *                           type: string
 *                           description: Ticket type
 *                         createdat:
 *                           type: string
 *                           format: date-time
 *                           description: Creation date
 *                         updatedat:
 *                           type: string
 *                           format: date-time
 *                           description: Last update date
 *                     inconsistencies:
 *                       type: array
 *                       description: Array of field inconsistencies
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             description: Excel field name
 *                             example: "Contractor Comments"
 *                           databaseField:
 *                             type: string
 *                             description: Database field name
 *                             example: "comment7d"
 *                           excelValue:
 *                             type: string
 *                             description: Value from Excel
 *                             example: "TK - COMPLETED"
 *                           databaseValue:
 *                             type: string
 *                             description: Value from database
 *                             example: "TK - Schedule"
 *                           type:
 *                             type: string
 *                             description: Field type
 *                             example: "text"
 *                           taskWoNum:
 *                             type: string
 *                             description: Task work order number
 *                             example: "TK6514243"
 *                           address:
 *                             type: string
 *                             description: Address
 *                             example: "2821 W WILCOX ST"
 *                           restWoNum:
 *                             type: string
 *                             description: Rest work order number
 *                             example: "MX5035817"
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
 *                   additionalProperties:
 *                     type: string
 *                     enum: ["excel", "database"]
 *               missingInfoFilled:
 *                 type: array
 *                 description: Array of tickets with missing info filled
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketCode:
 *                       type: string
 *                       description: The ticket code
 *                       example: "TK6514243"
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
 *                         NOTES2_RES:
 *                           type: string
 *                           description: Notes
 *                         SAP_ITEM_NUM:
 *                           type: string
 *                           description: SAP item number
 *                         LOCATION2_RES:
 *                           type: string
 *                           description: Location
 *                         length_x_width:
 *                           type: string
 *                           description: Dimensions
 *                         AGENCY_NO:
 *                           type: string
 *                           description: Agency number
 *                         START_DATE:
 *                           type: string
 *                           description: Start date
 *                         EXP_DATE:
 *                           type: string
 *                           description: Expiration date
 *                         SQFT_QTY_RES:
 *                           type: number
 *                           description: Quantity
 *               skippedRows:
 *                 type: array
 *                 description: Array of skipped rows with reasons
 *                 items:
 *                   type: object
 *                   properties:
 *                     reason:
 *                       type: string
 *                       description: Reason for skipping
 *                       example: "Missing required field: TASK_WO_NUM"
 *               createdBy:
 *                 type: integer
 *                 description: User ID who created the records
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: User ID who updated the records
 *                 example: 1
 *     responses:
 *       200:
 *         description: All data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All data saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rtrId:
 *                       type: integer
 *                       description: RTR record ID
 *                       example: 3
 *                     originalFileName:
 *                       type: string
 *                       description: Original file name
 *                       example: "Seven-D_RTR_04-21-25.xlsx"
 *                     generatedFileName:
 *                       type: string
 *                       description: Generated file name
 *                       example: "1751039650467-Seven-D_RTR_04-21-25.xlsx"
 *                     objectKey:
 *                       type: string
 *                       description: MinIO object key
 *                       example: "rtr/generated/1751039650467-Seven-D_RTR_04-21-25.xlsx"
 *                     downloadUrl:
 *                       type: string
 *                       description: Presigned download URL
 *                       example: "http://localhost:9000/uploads/rtr/generated/1751039650467-Seven-D_RTR_04-21-25.xlsx?X-Amz-Algorithm=..."
 *                     summary:
 *                       type: object
 *                       properties:
 *                         newTicketsCreated:
 *                           type: integer
 *                           description: Number of new tickets created
 *                           example: 2
 *                         ticketsUpdated:
 *                           type: integer
 *                           description: Number of tickets updated
 *                           example: 1
 *                         missingInfoFilled:
 *                           type: integer
 *                           description: Number of tickets with missing info filled
 *                           example: 0
 *                         skippedRows:
 *                           type: integer
 *                           description: Number of rows skipped
 *                           example: 0
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 *
 * @swagger
 * /rtr/update-with-database:
 *   post:
 *     summary: Update Excel file with database values
 *     description: Upload an Excel file and update the Contractor Comments column with values from the database comment7d field based on TASK_WO_NUM matching
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
 *                 description: The RTR Excel file to update with database values
 *     responses:
 *       200:
 *         description: Excel file updated with database values successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Excel file updated with database values successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rtrId:
 *                       type: integer
 *                       description: RTR record ID
 *                       example: 4
 *                     originalFileName:
 *                       type: string
 *                       description: Original file name
 *                       example: "Seven-D_RTR_04-21-25.xlsx"
 *                     generatedFileName:
 *                       type: string
 *                       description: Generated file name with timestamp
 *                       example: "1751039650467-Seven-D_RTR_04-21-25.xlsx"
 *                     objectKey:
 *                       type: string
 *                       description: MinIO object key for the generated file
 *                       example: "rtr/generated/1751039650467-Seven-D_RTR_04-21-25.xlsx"
 *                     downloadUrl:
 *                       type: string
 *                       description: Presigned download URL for the generated file
 *                       example: "http://localhost:9000/uploads/rtr/generated/1751039650467-Seven-D_RTR_04-21-25.xlsx?X-Amz-Algorithm=..."
 *                     updateResults:
 *                       type: array
 *                       description: Results of each row update
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                             description: Row number (1-based)
 *                             example: 1
 *                           taskWoNum:
 *                             type: string
 *                             description: Task work order number
 *                             example: "TK6514243"
 *                           status:
 *                             type: string
 *                             enum: ["updated", "not_found", "error"]
 *                             description: Status of the update
 *                             example: "updated"
 *                           oldValue:
 *                             type: string
 *                             description: Original value from Excel
 *                             example: "TK - COMPLETED"
 *                           newValue:
 *                             type: string
 *                             description: New value from database
 *                             example: "TK - Schedule"
 *                           ticketId:
 *                             type: integer
 *                             description: Database ticket ID (only for updated status)
 *                             example: 2
 *                           message:
 *                             type: string
 *                             description: Error message (only for not_found/error status)
 *                             example: "Ticket not found in database"
 *                           error:
 *                             type: string
 *                             description: Error details (only for error status)
 *                             example: "Database connection failed"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                           description: Total number of rows processed
 *                           example: 5
 *                         updatedRows:
 *                           type: integer
 *                           description: Number of rows successfully updated
 *                           example: 3
 *                         notFoundRows:
 *                           type: integer
 *                           description: Number of rows where ticket was not found
 *                           example: 1
 *                         errorRows:
 *                           type: integer
 *                           description: Number of rows with errors
 *                           example: 1
 *       400:
 *         description: Invalid request (missing file, wrong format, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No file uploaded"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update Excel file with database values"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *
 * @swagger
 * /rtr/update-permit-statuses:
 *   post:
 *     summary: Update all permit statuses based on expiration dates and check for permits expiring within 7 days
 *     description: Checks all permits in the database and updates their status based on their expiration date. Also checks for permits expiring within 7 days and updates the corresponding tickets' comment7d field to 'TK - NEEDS PERMIT EXTENSION' if the comment is null or empty.
 *     tags: [RTR]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedBy:
 *                 type: integer
 *                 description: User ID who is performing the update
 *                 example: 1
 *     responses:
 *       200:
 *         description: Permit statuses and ticket comments updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Permit statuses and ticket comments updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         permits:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               description: Total number of permits processed
 *                               example: 25
 *                             statusUpdated:
 *                               type: integer
 *                               description: Number of permits that had their status updated
 *                               example: 5
 *                             unchanged:
 *                               type: integer
 *                               description: Number of permits that didn't need status updates
 *                               example: 20
 *                             statusChanges:
 *                               type: object
 *                               properties:
 *                                 toExpired:
 *                                   type: integer
 *                                   description: Number of permits changed to EXPIRED
 *                                   example: 3
 *                                 toExpiresToday:
 *                                   type: integer
 *                                   description: Number of permits changed to EXPIRES_TODAY
 *                                   example: 1
 *                                 toActive:
 *                                   type: integer
 *                                   description: Number of permits changed to ACTIVE
 *                                   example: 1
 *                                 toPending:
 *                                   type: integer
 *                                   description: Number of permits changed to PENDING
 *                                   example: 0
 *                         tickets:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               description: Total number of tickets with permits expiring within 7 days
 *                               example: 8
 *                             commentUpdated:
 *                               type: integer
 *                               description: Number of tickets that had their comment7d updated
 *                               example: 3
 *                             unchanged:
 *                               type: integer
 *                               description: Number of tickets that didn't need comment updates
 *                               example: 5
 *                     permitStatusUpdates:
 *                       type: array
 *                       description: Detailed results for each permit status update
 *                       items:
 *                         type: object
 *                         properties:
 *                           permitId:
 *                             type: integer
 *                             description: Permit ID
 *                             example: 123
 *                           oldStatus:
 *                             type: string
 *                             description: Previous status
 *                             example: "ACTIVE"
 *                           newStatus:
 *                             type: string
 *                             description: New status after update
 *                             example: "EXPIRED"
 *                           updated:
 *                             type: boolean
 *                             description: Whether the status was actually changed
 *                             example: true
 *                     ticketCommentUpdates:
 *                       type: array
 *                       description: Detailed results for each ticket comment update
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketId:
 *                             type: integer
 *                             description: Ticket ID
 *                             example: 456
 *                           ticketCode:
 *                             type: string
 *                             description: Ticket code
 *                             example: "TK6514243"
 *                           permitId:
 *                             type: integer
 *                             description: Associated permit ID
 *                             example: 123
 *                           permitNumber:
 *                             type: string
 *                             description: Permit number
 *                             example: "PERM-2024-001"
 *                           expireDate:
 *                             type: string
 *                             format: date
 *                             description: Permit expiration date
 *                             example: "2024-01-20"
 *                           daysUntilExpiry:
 *                             type: integer
 *                             description: Days until permit expires
 *                             example: 3
 *                           oldComment:
 *                             type: string
 *                             description: Previous comment7d value
 *                             example: ""
 *                           newComment:
 *                             type: string
 *                             description: New comment7d value
 *                             example: "TK - NEEDS PERMIT EXTENSION"
 *                           updated:
 *                             type: boolean
 *                             description: Whether the comment was actually updated
 *                             example: true
 *                           reason:
 *                             type: string
 *                             description: Reason if not updated (only present when updated is false)
 *                             example: "Comment already set to something other than extension message"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to update permit statuses and check expiring permits"
 *                 details:
 *                   type: string
 *                   example: "Database connection failed"
 *
 * @swagger
 * /rtr/generate-ticket-statuses:
 *   post:
 *     summary: Generate TicketStatus records for tickets based on their ContractUnit phases
 *     description: Creates TicketStatus records for the specified tickets based on the phases defined in their ContractUnits. Each ContractUnit has associated phases (TaskStatus records) that define the workflow steps. This endpoint creates TicketStatus records to track the progress of each ticket through these phases. Works for tickets with any comment7d value.
 *     tags: [RTR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketIds
 *             properties:
 *               ticketIds:
 *                 type: array
 *                 description: Array of ticket IDs to generate TicketStatus records for
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4, 5]
 *               updatedBy:
 *                 type: integer
 *                 description: User ID who is performing the operation
 *                 example: 1
 *     responses:
 *       200:
 *         description: TicketStatus records generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "TicketStatus records generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalTickets:
 *                           type: integer
 *                           description: Total number of tickets processed
 *                           example: 5
 *                         processed:
 *                           type: integer
 *                           description: Number of tickets successfully processed
 *                           example: 5
 *                         successful:
 *                           type: integer
 *                           description: Number of tickets that had TicketStatus records generated
 *                           example: 4
 *                         failed:
 *                           type: integer
 *                           description: Number of tickets that failed to process
 *                           example: 1
 *                         totalPhasesFound:
 *                           type: integer
 *                           description: Total number of phases found across all ContractUnits
 *                           example: 20
 *                         totalStatusesCreated:
 *                           type: integer
 *                           description: Total number of TicketStatus records created
 *                           example: 15
 *                     results:
 *                       type: array
 *                       description: Detailed results for each ticket
 *                       items:
 *                         type: object
 *                         properties:
 *                           ticketId:
 *                             type: integer
 *                             description: Ticket ID
 *                             example: 1
 *                           contractUnitId:
 *                             type: integer
 *                             description: ContractUnit ID associated with the ticket
 *                             example: 10
 *                           phasesFound:
 *                             type: integer
 *                             description: Number of phases found for the ContractUnit
 *                             example: 4
 *                           statusesCreated:
 *                             type: integer
 *                             description: Number of TicketStatus records created for this ticket
 *                             example: 3
 *                           skipped:
 *                             type: boolean
 *                             description: Whether the ticket was skipped
 *                             example: false
 *                           reason:
 *                             type: string
 *                             description: Reason for skipping (only present when skipped is true)
 *                             example: "No ContractUnit assigned to ticket"
 *                           error:
 *                             type: string
 *                             description: Error message (only present when processing failed)
 *                             example: "Ticket not found"
 *                           results:
 *                             type: array
 *                             description: Detailed results for each phase (only present when not skipped)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 taskStatusId:
 *                                   type: integer
 *                                   description: TaskStatus ID
 *                                   example: 1
 *                                 taskStatusName:
 *                                   type: string
 *                                   description: TaskStatus name
 *                                   example: "Sawcut"
 *                                 taskStatusDescription:
 *                                   type: string
 *                                   description: TaskStatus description
 *                                   example: "Cutting the damaged pavement section with a saw"
 *                                 created:
 *                                   type: boolean
 *                                   description: Whether the TicketStatus record was created
 *                                   example: true
 *                                 reason:
 *                                   type: string
 *                                   description: Reason if not created (only present when created is false)
 *                                   example: "TicketStatus already exists"
 *                                 error:
 *                                   type: string
 *                                   description: Error message if creation failed (only present when created is false)
 *                                   example: "Database constraint violation"
 *                                 ticketStatusRecord:
 *                                   type: object
 *                                   description: Created TicketStatus record (only present when created is true)
 *                                   properties:
 *                                     taskStatusId:
 *                                       type: integer
 *                                       example: 1
 *                                     ticketId:
 *                                       type: integer
 *                                       example: 1
 *       400:
 *         description: Invalid request data
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
 *                   example: "ticketIds array is required and must not be empty"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to generate TicketStatus records"
 *                 details:
 *                   type: string
 *                   example: "Database connection failed"
 */

module.exports = router;
