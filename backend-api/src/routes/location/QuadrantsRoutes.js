const express = require('express');
const QuadrantsController = require('../../controllers/location/QuadrantsController');

const router = express.Router();

router.post('/', QuadrantsController.createQuadrant);
router.get('/:quadrantId', QuadrantsController.getQuadrantById);
router.get('/', QuadrantsController.getAllQuadrants);
router.put('/:quadrantId', QuadrantsController.updateQuadrant);
router.delete('/:quadrantId', QuadrantsController.deleteQuadrant);

module.exports = router; 