const express = require('express');
const CrewEmployeesController = require('../../controllers/human-resources/CrewEmployeesController');

const router = express.Router();

router.post('/', CrewEmployeesController.createCrewEmployees);
router.get('/:crewId/:peopleId', CrewEmployeesController.getCrewEmployeesById);
router.get('/', CrewEmployeesController.getAllCrewEmployees);
router.put('/:crewId/:peopleId', CrewEmployeesController.updateCrewEmployees);
router.delete('/:crewId/:peopleId', CrewEmployeesController.deleteCrewEmployees);

module.exports = router; 