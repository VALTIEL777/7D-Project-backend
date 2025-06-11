const express = require('express');
const TaskStatusController = require('../../controllers/route/TaskStatusController');

const router = express.Router();

router.post('/', TaskStatusController.createTaskStatus);
router.get('/:taskStatusId', TaskStatusController.getTaskStatusById);
router.get('/', TaskStatusController.getAllTaskStatuses);
router.put('/:taskStatusId', TaskStatusController.updateTaskStatus);
router.delete('/:taskStatusId', TaskStatusController.deleteTaskStatus);

module.exports = router; 