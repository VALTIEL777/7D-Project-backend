const express = require('express');
const PhotoEvidenceController = require('../../controllers/route/PhotoEvidenceController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Photo Evidence
 *   description: Managing photo evidence for ticket statuses
 */
router.get('/ticket/:ticketId', PhotoEvidenceController.getPhotoEvidenceByTicketId);

/**
 * @swagger
 * /photoevidence:
 *   post:
 *     summary: Upload a photo evidence image (png, jpg, jpeg) and save its URL in MinIO
 *     tags: [Photo Evidence]
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
 *                 description: The image file to upload (png, jpg, jpeg)
 *               ticketStatusId:
 *                 type: integer
 *               ticketId:
 *                 type: integer
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               photo:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               comment:
 *                 type: string
 *               createdBy:
 *                 type: integer
 *               updatedBy:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Photo evidence created and image saved to MinIO
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoURL:
 *                   type: string
 *                   description: The MinIO URL where the image is saved
 *       500:
 *         description: Error creating PhotoEvidence
 */
router.post('/',  upload.array('file', 5), PhotoEvidenceController.createPhotoEvidence);

/**
 * @swagger
 * /photoevidence/{photoId}:
 *   get:
 *     summary: Get a photo evidence record by ID
 *     tags: [Photo Evidence]
 *     parameters:
 *       - in: path
 *         name: photoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the photo evidence.
 *     responses:
 *       200:
 *         description: Photo evidence record found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Site Photo 1
 *       404:
 *         description: Photo evidence not found
 *       500:
 *         description: Server error
 */
router.get('/:photoId', PhotoEvidenceController.getPhotoEvidenceById);

/**
 * @swagger
 * /photoevidence:
 *   get:
 *     summary: Retrieve a list of all photo evidence records
 *     tags: [Photo Evidence]
 *     responses:
 *       200:
 *         description: A list of photo evidence records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   photoId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Site Photo 1
 *       500:
 *         description: Server error
 */
router.get('/', PhotoEvidenceController.getAllPhotoEvidence);

/**
 * @swagger
 * /photoevidence/{photoId}:
 *   put:
 *     summary: Update a photo evidence record by ID
 *     tags: [Photo Evidence]
 *     parameters:
 *       - in: path
 *         name: photoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the photo evidence.
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
 *                 description: The image file to upload (png, jpg, jpeg)
 *               ticketStatusId:
 *                 type: integer
 *                 description: The updated ID of the associated ticket status.
 *                 example: 2
 *               ticketId:
 *                 type: integer
 *                 description: The updated ID of the associated ticket.
 *                 example: 2
 *               name:
 *                 type: string
 *                 description: The updated name or title.
 *                 example: Post-work Photo
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Updated latitude.
 *                 example: 34.052235
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Updated longitude.
 *                 example: -118.243683
 *               photo:
 *                 type: string
 *                 description: Updated base64 encoded photo string or path.
 *                 example: updated_base64string
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The updated date and time.
 *                 example: 2023-01-02T11:00:00Z
 *               comment:
 *                 type: string
 *                 description: Updated comments.
 *                 example: Photo after work completion.
 *               photoURL:
 *                 type: string
 *                 description: Updated URL to the hosted photo.
 *                 example: http://example.com/photo2.jpg
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The photo evidence record was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Post-work Photo
 *       404:
 *         description: Photo evidence not found
 *       500:
 *         description: Server error
 */
router.put('/:photoId', upload.single('file'), PhotoEvidenceController.updatePhotoEvidence);

/**
 * @swagger
 * /photoevidence/{photoId}:
 *   delete:
 *     summary: Delete a photo evidence record by ID
 *     tags: [Photo Evidence]
 *     parameters:
 *       - in: path
 *         name: photoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the photo evidence.
 *     responses:
 *       200:
 *         description: The photo evidence record was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PhotoEvidence deleted successfully
 *       404:
 *         description: Photo evidence not found
 *       500:
 *         description: Server error
 */
router.delete('/:photoId', PhotoEvidenceController.deletePhotoEvidence);

module.exports = router; 