const express = require("express");
const { uploadExcel, listRTRExcels, downloadRTRExcel, analyzeRTRData, saveRTRDataWithDecisions } = require("../../controllers/RTR/rtrController");
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
      download: 'GET /rtr/download/:rtrId',
      analyze: 'POST /rtr/analyze',
      saveWithDecisions: 'POST /rtr/save-with-decisions'
    }
  });
});

router.post("/", upload.single("file"), uploadExcel);

// List all RTR Excel files
router.get("/list", listRTRExcels);

// Download a specific RTR Excel file by rtrId
router.get("/download/:rtrId", downloadRTRExcel);

// Analyze RTR data for new tickets and inconsistencies
router.post("/analyze", analyzeMiddleware, analyzeRTRData);

// Save RTR data with user decisions
router.post("/save-with-decisions", analyzeMiddleware, saveRTRDataWithDecisions);

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
 *                     download:
 *                       type: string
 *                       example: GET /rtr/download/:rtrId
 *                     analyze:
 *                       type: string
 *                       example: POST /rtr/analyze
 *                     saveWithDecisions:
 *                       type: string
 *                       example: POST /rtr/save-with-decisions
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
 *                             items:
 *                               type: object
 *                               properties:
 *                                 field:
 *                                   type: string
 *                                 databaseField:
 *                                   type: string
 *                                 excelValue:
 *                                   type: string
 *                                 databaseValue:
 *                                   type: string
 *                                 type:
 *                                   type: string
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
 *                 description: User decisions for each ticket field
 *                 additionalProperties:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                     enum: [excel, database]
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
 */

module.exports = router;
