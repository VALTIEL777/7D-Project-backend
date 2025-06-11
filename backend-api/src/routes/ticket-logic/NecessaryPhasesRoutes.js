const express = require('express');
const NecessaryPhasesController = require('../../controllers/ticket-logic/NecessaryPhasesController');

const router = express.Router();

router.post('/', NecessaryPhasesController.createNecessaryPhases);
router.get('/:necessaryPhaseId', NecessaryPhasesController.getNecessaryPhasesById);
router.get('/', NecessaryPhasesController.getAllNecessaryPhases);
router.put('/:necessaryPhaseId', NecessaryPhasesController.updateNecessaryPhases);
router.delete('/:necessaryPhaseId', NecessaryPhasesController.deleteNecessaryPhases);

module.exports = router; 