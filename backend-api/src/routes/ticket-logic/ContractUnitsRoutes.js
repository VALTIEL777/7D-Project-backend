const express = require('express');
const ContractUnitsController = require('../../controllers/ticket-logic/ContractUnitsController');

const router = express.Router();

router.post('/', ContractUnitsController.createContractUnit);
router.get('/:contractUnitId', ContractUnitsController.getContractUnitById);
router.get('/', ContractUnitsController.getAllContractUnits);
router.put('/:contractUnitId', ContractUnitsController.updateContractUnit);
router.delete('/:contractUnitId', ContractUnitsController.deleteContractUnit);

module.exports = router; 