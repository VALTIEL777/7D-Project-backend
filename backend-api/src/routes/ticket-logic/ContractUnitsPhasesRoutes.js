const express = require('express');
const ContractUnitsPhasesController = require('../../controllers/ticket-logic/ContractUnitsPhasesController');

const router = express.Router();

router.post('/', ContractUnitsPhasesController.createContractUnitsPhases);
router.get('/:contractUnitId/:necessaryPhaseId', ContractUnitsPhasesController.getContractUnitsPhasesById);
router.get('/', ContractUnitsPhasesController.getAllContractUnitsPhases);
router.put('/:contractUnitId/:necessaryPhaseId', ContractUnitsPhasesController.updateContractUnitsPhases);
router.delete('/:contractUnitId/:necessaryPhaseId', ContractUnitsPhasesController.deleteContractUnitsPhases);

module.exports = router; 