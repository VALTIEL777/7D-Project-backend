const express = require('express');
const TaskStatusController = require('../../controllers/route/TaskStatusController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Task Status
 *   description: Managing statuses for tasks within tickets
 */

/**
 * @swagger
 * /taskstatus:
 *   post:
 *     summary: Create a new task status
 *     tags: [Task Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - createdBy
 *               - updatedBy
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the task status (e.g., 'Pending', 'In Progress', 'Completed').
 *                 example: Pending
 *               description:
 *                 type: string
 *                 description: A brief description of the task status.
 *                 example: The task is awaiting action.
 *               createdBy:
 *                 type: integer
 *                 description: The ID of the user who created this entry.
 *                 example: 1
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 1
 *     responses:
 *       201:
 *         description: The task status was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStatusId:
 *                   type: integer
 *                   description: The auto-generated ID of the task status.
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Pending
 *       500:
 *         description: Server error
 */
router.post('/', TaskStatusController.createTaskStatus);

/**
 * @swagger
 * /taskstatus/{taskStatusId}:
 *   get:
 *     summary: Get a task status by ID
 *     tags: [Task Status]
 *     parameters:
 *       - in: path
 *         name: taskStatusId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the task status.
 *     responses:
 *       200:
 *         description: Task status found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStatusId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Pending
 *       404:
 *         description: Task status not found
 *       500:
 *         description: Server error
 */
router.get('/:taskStatusId', TaskStatusController.getTaskStatusById);

/**
 * @swagger
 * /taskstatus:
 *   get:
 *     summary: Retrieve a list of all task statuses
 *     tags: [Task Status]
 *     responses:
 *       200:
 *         description: A list of task statuses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   taskStatusId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Pending
 *       500:
 *         description: Server error
 */
router.get('/', TaskStatusController.getAllTaskStatuses);

/**
 * @swagger
 * /taskstatus/{taskStatusId}:
 *   put:
 *     summary: Update a task status by ID
 *     tags: [Task Status]
 *     parameters:
 *       - in: path
 *         name: taskStatusId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the task status.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the task status.
 *                 example: Completed
 *               description:
 *                 type: string
 *                 description: An updated description of the task status.
 *                 example: The task has been successfully completed.
 *               updatedBy:
 *                 type: integer
 *                 description: The ID of the user who last updated this entry.
 *                 example: 2
 *     responses:
 *       200:
 *         description: The task status was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStatusId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Completed
 *       404:
 *         description: Task status not found
 *       500:
 *         description: Server error
 */
router.put('/:taskStatusId', TaskStatusController.updateTaskStatus);

/**
 * @swagger
 * /taskstatus/{taskStatusId}:
 *   delete:
 *     summary: Delete a task status by ID
 *     tags: [Task Status]
 *     parameters:
 *       - in: path
 *         name: taskStatusId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the task status.
 *     responses:
 *       200:
 *         description: The task status was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: TaskStatus deleted successfully
 *       404:
 *         description: Task status not found
 *       500:
 *         description: Server error
 */
router.delete('/:taskStatusId', TaskStatusController.deleteTaskStatus);

module.exports = router; 