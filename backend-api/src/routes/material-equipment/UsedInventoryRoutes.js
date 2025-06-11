const express = require('express');
const UsedInventoryController = require('../../controllers/material-equipment/UsedInventoryController');

const router = express.Router();

router.post('/', UsedInventoryController.createUsedInventory);
router.get('/:CrewId/:inventoryId', UsedInventoryController.getUsedInventoryById);
router.get('/', UsedInventoryController.getAllUsedInventory);
router.put('/:CrewId/:inventoryId', UsedInventoryController.updateUsedInventory);
router.delete('/:CrewId/:inventoryId', UsedInventoryController.deleteUsedInventory);

module.exports = router; 