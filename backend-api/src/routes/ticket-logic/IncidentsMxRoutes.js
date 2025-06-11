const express = require('express');
const IncidentsMxController = require('../../controllers/ticket-logic/IncidentsMxController');

const router = express.Router();

router.post('/', IncidentsMxController.createIncidentMx);
router.get('/:incidentId', IncidentsMxController.getIncidentMxById);
router.get('/', IncidentsMxController.getAllIncidentsMx);
router.put('/:incidentId', IncidentsMxController.updateIncidentMx);
router.delete('/:incidentId', IncidentsMxController.deleteIncidentMx);

module.exports = router; 