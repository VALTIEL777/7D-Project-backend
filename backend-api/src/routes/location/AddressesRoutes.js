const express = require('express');
const AddressesController = require('../../controllers/location/AddressesController');

const router = express.Router();

router.post('/', AddressesController.createAddress);
router.get('/:addressId', AddressesController.getAddressById);
router.get('/', AddressesController.getAllAddresses);
router.put('/:addressId', AddressesController.updateAddress);
router.delete('/:addressId', AddressesController.deleteAddress);

module.exports = router; 