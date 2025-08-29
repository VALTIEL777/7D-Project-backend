const express = require('express');
const router = express.Router();
const RouteOptimizationController = require('../../controllers/route/RouteOptimizationController');

/**
 * @route GET /api/route-optimization/status
 * @desc Get route optimization service status
 * @access Private (assuming you have auth middleware)
 */
router.get('/status', RouteOptimizationController.getOptimizationStatus);

/**
 * @route POST /api/route-optimization/geocode-optimize
 * @desc Optimize a route using addresses (geocoding intermediates)
 * @access Private (assuming you have auth middleware)
 */
router.post('/geocode-optimize', RouteOptimizationController.geocodeOptimize);

/**
 * @route POST /api/route-optimization/optimize-single
 * @desc Single route optimization with minimal API calls
 * @access Private (assuming you have auth middleware)
 */
router.post('/optimize-single', RouteOptimizationController.optimizeSingle);

/**
 * @route POST /api/route-optimization/route/:routeId/add-tickets
 * @desc Add tickets to an existing route without re-optimizing
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/add-tickets', RouteOptimizationController.addTicketsToRoute);

/**
 * @route DELETE /api/route-optimization/route/:routeId/remove-tickets
 * @desc Remove tickets from an existing route
 * @access Private (assuming you have auth middleware)
 */
router.delete('/route/:routeId/remove-tickets', RouteOptimizationController.removeTicketsFromRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/reoptimize
 * @desc Re-optimize an existing route with current tickets
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/reoptimize', RouteOptimizationController.reoptimizeRoute);

/**
 * @route POST /api/route-optimization/optimize-clustered
 * @desc Optimize routes by clustering locations into groups of max 100 locations each
 * @access Private (assuming you have auth middleware)
 */
router.post('/optimize-clustered', RouteOptimizationController.optimizeClustered);

/**
 * @route POST /api/route-optimization/suggest-addresses
 * @desc Find similar or nearby addresses for tickets missing valid addresses
 * @access Private (assuming you have auth middleware)
 */
router.post('/suggest-addresses', RouteOptimizationController.suggestAddresses);

/**
 * @route POST /api/route-optimization/suggest-addresses-batch
 * @desc Find similar addresses for multiple tickets at once
 * @access Private (assuming you have auth middleware)
 */
router.post('/suggest-addresses-batch', RouteOptimizationController.suggestAddressesBatch);

/**
 * @route POST /api/route-optimization/route/:routeId/cancel
 * @desc Cancel a route by removing endingDate from all ticket statuses
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/cancel', RouteOptimizationController.cancelRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/cancel-spotting
 * @desc Cancel a spotting route by soft deleting it and resetting SPOTTING statuses
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/cancel-spotting', RouteOptimizationController.cancelSpottingRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/cancel-concrete
 * @desc Cancel a concrete route by soft deleting it and resetting SAWCUT statuses
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/cancel-concrete', RouteOptimizationController.cancelConcreteRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/cancel-asphalt
 * @desc Cancel an asphalt route by soft deleting it and resetting FRAMING statuses
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/cancel-asphalt', RouteOptimizationController.cancelAsphaltRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/complete-concrete
 * @desc Complete a concrete route by completing current phases and moving to next phases
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/complete-concrete', RouteOptimizationController.completeConcreteRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/complete-spotting
 * @desc Complete a spotting route by completing SPOTTING phases
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/complete-spotting', RouteOptimizationController.completeSpottingRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/complete-asphalt
 * @desc Complete an asphalt route by completing asphalt phases
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/complete-asphalt', RouteOptimizationController.completeAsphaltRoute);

/**
 * @route POST /api/route-optimization/route/:routeId/complete
 * @desc Complete a route by setting endingDate to current timestamp for all ticket statuses (generic for other route types)
 * @access Private (assuming you have auth middleware)
 */
router.post('/route/:routeId/complete', RouteOptimizationController.completeRoute);

/**
 * @route GET /api/route-optimization/route/:routeId/details
 * @desc Get detailed information about tickets in a route including their status
 * @access Private (assuming you have auth middleware)
 */
router.get('/route/:routeId/details', RouteOptimizationController.getRouteDetails);

// Removed the /optimize-latlng route as it's no longer needed.
// The main /optimize endpoint now handles address-based input with internal geocoding.

module.exports = router;