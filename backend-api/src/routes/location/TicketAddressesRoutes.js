const express = require('express');
const TicketAddressesController = require('../../controllers/location/TicketAddressesController');

const router = express.Router();

router.post('/', TicketAddressesController.createTicketAddresses);
router.get('/:ticketId/:addressId', TicketAddressesController.getTicketAddressesById);
router.get('/', TicketAddressesController.getAllTicketAddresses);
router.put('/:ticketId/:addressId', TicketAddressesController.updateTicketAddresses);
router.delete('/:ticketId/:addressId', TicketAddressesController.deleteTicketAddresses);

module.exports = router; 