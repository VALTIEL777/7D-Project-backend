const express = require('express');
const TicketsController = require('../../controllers/ticket-logic/TicketsController');

const router = express.Router();

router.post('/', TicketsController.createTicket);
router.get('/:ticketId', TicketsController.getTicketById);
router.get('/', TicketsController.getAllTickets);
router.put('/:ticketId', TicketsController.updateTicket);
router.delete('/:ticketId', TicketsController.deleteTicket);

module.exports = router; 