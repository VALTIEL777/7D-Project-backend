const express = require('express');
const RouteTicketsController = require('../../controllers/route/RouteTicketsController');

const router = express.Router();

router.post('/', RouteTicketsController.createRouteTickets);
router.get('/:routeId/:ticketId', RouteTicketsController.getRouteTicketsById);
router.get('/', RouteTicketsController.getAllRouteTickets);
router.put('/:routeId/:ticketId', RouteTicketsController.updateRouteTickets);
router.delete('/:routeId/:ticketId', RouteTicketsController.deleteRouteTickets);

module.exports = router; 