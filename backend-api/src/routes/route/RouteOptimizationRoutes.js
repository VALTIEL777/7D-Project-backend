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

// Removed the /optimize-latlng route as it's no longer needed.
// The main /optimize endpoint now handles address-based input with internal geocoding.

module.exports = router;