const express = require('express');
const TicketStatusController = require('../../controllers/route/TicketStatusController');

const router = express.Router();

router.post('/', TicketStatusController.createTicketStatus);
router.get('/:taskStatusId/:ticketId', TicketStatusController.getTicketStatusById);
router.get('/', TicketStatusController.getAllTicketStatuses);
router.put('/:taskStatusId/:ticketId', TicketStatusController.updateTicketStatus);
router.delete('/:taskStatusId/:ticketId', TicketStatusController.deleteTicketStatus);

module.exports = router; 