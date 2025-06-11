const express = require('express');
const PeopleController = require('../../controllers/human-resources/PeopleController');

const router = express.Router();

router.post('/', PeopleController.createPeople);
router.get('/:employeeId', PeopleController.getPeopleById);
router.get('/', PeopleController.getAllPeople);
router.put('/:employeeId', PeopleController.updatePeople);
router.delete('/:employeeId', PeopleController.deletePeople);

module.exports = router; 