const express = require('express');
const WayfindingController = require('../../controllers/location/WayfindingController');

const router = express.Router();

router.post('/', WayfindingController.createWayfinding);
router.get('/:wayfindingId', WayfindingController.getWayfindingById);
router.get('/', WayfindingController.getAllWayfindings);
router.put('/:wayfindingId', WayfindingController.updateWayfinding);
router.delete('/:wayfindingId', WayfindingController.deleteWayfinding);

module.exports = router; 