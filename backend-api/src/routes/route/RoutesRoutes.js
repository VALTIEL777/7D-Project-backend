const express = require('express');
const RoutesController = require('../../controllers/route/RoutesController');

const router = express.Router();

router.post('/', RoutesController.createRoute);
router.get('/:routeId', RoutesController.getRouteById);
router.get('/', RoutesController.getAllRoutes);
router.put('/:routeId', RoutesController.updateRoute);
router.delete('/:routeId', RoutesController.deleteRoute);

module.exports = router; 