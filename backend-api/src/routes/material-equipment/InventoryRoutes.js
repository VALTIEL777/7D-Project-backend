const express = require('express');
const InventoryController = require('../../controllers/material-equipment/InventoryController');

const router = express.Router();

router.post('/', InventoryController.createInventory);
router.get('/:inventoryId', InventoryController.getInventoryById);
router.get('/', InventoryController.getAllInventory);
router.put('/:inventoryId', InventoryController.updateInventory);
router.delete('/:inventoryId', InventoryController.deleteInventory);

module.exports = router; 