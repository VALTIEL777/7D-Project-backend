const express = require('express');
const QuadrantSupervisorController = require('../../controllers/human-resources/QuadrantSupervisorController');

const router = express.Router();

router.post('/', QuadrantSupervisorController.createQuadrantSupervisor);
router.get('/:employeeId/:quadrantId', QuadrantSupervisorController.getQuadrantSupervisorById);
router.get('/', QuadrantSupervisorController.getAllQuadrantSupervisors);
router.put('/:employeeId/:quadrantId', QuadrantSupervisorController.updateQuadrantSupervisor);
router.delete('/:employeeId/:quadrantId', QuadrantSupervisorController.deleteQuadrantSupervisor);

module.exports = router; 