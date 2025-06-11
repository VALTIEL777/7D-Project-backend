const express = require('express');
const SuppliersController = require('../../controllers/material-equipment/SuppliersController');

const router = express.Router();

router.post('/', SuppliersController.createSupplier);
router.get('/:supplierId', SuppliersController.getSupplierById);
router.get('/', SuppliersController.getAllSuppliers);
router.put('/:supplierId', SuppliersController.updateSupplier);
router.delete('/:supplierId', SuppliersController.deleteSupplier);

module.exports = router; 