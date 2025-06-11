const express = require('express');
const PhotoEvidenceController = require('../../controllers/route/PhotoEvidenceController');

const router = express.Router();

router.post('/', PhotoEvidenceController.createPhotoEvidence);
router.get('/:photoId', PhotoEvidenceController.getPhotoEvidenceById);
router.get('/', PhotoEvidenceController.getAllPhotoEvidence);
router.put('/:photoId', PhotoEvidenceController.updatePhotoEvidence);
router.delete('/:photoId', PhotoEvidenceController.deletePhotoEvidence);

module.exports = router; 