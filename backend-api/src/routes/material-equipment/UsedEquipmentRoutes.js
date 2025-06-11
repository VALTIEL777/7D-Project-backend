const express = require('express');
const UsedEquipmentController = require('../../controllers/material-equipment/UsedEquipmentController');

const router = express.Router();

router.post('/', UsedEquipmentController.createUsedEquipment);
router.get('/:CrewId/:equipmentId', UsedEquipmentController.getUsedEquipmentById);
router.get('/', UsedEquipmentController.getAllUsedEquipment);
router.put('/:CrewId/:equipmentId', UsedEquipmentController.updateUsedEquipment);
router.delete('/:CrewId/:equipmentId', UsedEquipmentController.deleteUsedEquipment);

module.exports = router; 