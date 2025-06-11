const express = require('express');
const CrewsController = require('../../controllers/human-resources/CrewsController');

const router = express.Router();

router.post('/', CrewsController.createCrews);
router.get('/:crewId', CrewsController.getCrewsById);
router.get('/', CrewsController.getAllCrews);
router.put('/:crewId', CrewsController.updateCrews);
router.delete('/:crewId', CrewsController.deleteCrews);

module.exports = router; 