const express = require('express');
const EquipmentController = require('../../controllers/material-equipment/EquipmentController');

const router = express.Router();

router.post('/', EquipmentController.createEquipment);
router.get('/:equipmentId', EquipmentController.getEquipmentById);
router.get('/', EquipmentController.getAllEquipment);
router.put('/:equipmentId', EquipmentController.updateEquipment);
router.delete('/:equipmentId', EquipmentController.deleteEquipment);

module.exports = router; 