const express = require('express');
const router = express.Router();
const RouteOptimizationController = require('../../controllers/route/RouteOptimizationController');

/**
 * @route POST /api/route-optimization/optimize
 * @desc Optimize routes for tickets and crews
 * @access Private (assuming you have auth middleware)
 */
router.post('/optimize', RouteOptimizationController.optimizeRoutes);

/**
 * @route GET /api/route-optimization/status
 * @desc Get route optimization service status
 * @access Private (assuming you have auth middleware)
 */
router.get('/status', RouteOptimizationController.getOptimizationStatus);

/**
 * @route POST /api/route-optimization/test
 * @desc Test route optimization with sample data
 * @access Private (assuming you have auth middleware)
 */
router.post('/test', RouteOptimizationController.testOptimization);

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

// Removed the /optimize-latlng route as it's no longer needed.
// The main /optimize endpoint now handles address-based input with internal geocoding.

module.exports = router;