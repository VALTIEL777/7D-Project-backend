const express = require('express');
const PhotoEvidenceController = require('../../controllers/route/PhotoEvidenceController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Photo Evidence
 *   description: Managing photo evidence for ticket statuses
 */

/**
 * @swagger
 * /photoevidence:
 *   post:
 *     summary: Create a new photo evidence record
 *     tags: [Photo Evidence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketStatusId
 *               - ticketId
 *               - name
 *               - latitude
 *               - longitude
 *               - photo
 *               - date
 *               - comment
 *               - photoURL
 *               - address
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               ticketStatusId:
 *                 type: integer
 *                 description: The ID of the associated ticket status.
 *                 example: 1
 *               ticketId:
 *                 type: integer
 *                 description: The ID of the associated ticket.
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: The name or title of the photo evidence.
 *                 example: Site Photo 1
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitude of where the photo was taken.
 *                 example: 34.052235
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitude of where the photo was taken.
 *                 example: -118.243683
 *               photo:
 *                 type: string
 *                 description: Base64 encoded string of the photo or path to the photo file.
 *                 example: base64stringofphoto
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time the photo was taken.
 *                 example: 2023-01-01T10:00:00Z
 *               comment:
 *                 type: string
 *                 description: Any comments or observations about the photo.
 *                 example: Photo of the site before work began.
 *               photoURL:
 *                 type: string
 *                 description: URL to the hosted photo.
 *                 example: http://example.com/photo1.jpg
 *               address:
 *                 type: string
 *                 description: The address related to the photo.
 *                 example: 123 Main St, Anytown
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this entry.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The photo evidence record was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoId:
 *                   type: integer
 *                   description: The auto-generated ID of the photo evidence.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Site Photo 1
 *       500:
 *         description: Server error
 */
router.post('/', PhotoEvidenceController.createPhotoEvidence);

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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               address:
 *                 type: string
 *                 description: The updated address.
 *                 example: 456 Oak Ave, Anytown
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
router.put('/:photoId', PhotoEvidenceController.updatePhotoEvidence);

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