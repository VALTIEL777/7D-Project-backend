const express = require('express');
const PermitedTicketsController = require('../../controllers/permissions/PermitedTicketsController');

const router = express.Router();

router.post('/', PermitedTicketsController.createPermitedTickets);
router.get('/:permitId/:ticketId', PermitedTicketsController.getPermitedTicketsById);
router.get('/', PermitedTicketsController.getAllPermitedTickets);
router.put('/:permitId/:ticketId', PermitedTicketsController.updatePermitedTickets);
router.delete('/:permitId/:ticketId', PermitedTicketsController.deletePermitedTickets);

module.exports = router; 