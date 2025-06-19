const express = require("express");
const { uploadExcel, listRTRExcels, downloadRTRExcel } = require("../../controllers/RTR/rtrController");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), uploadExcel);

// List all RTR Excel files
router.get("/list", listRTRExcels);

// Download a specific RTR Excel file by rtrId
router.get("/download/:rtrId", downloadRTRExcel);

/**
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
 */

module.exports = router;
