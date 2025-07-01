const express = require('express');
const NotificationsController = require('../../controllers/notifications/NotificationsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Managing user notifications
 */

/**
 * @swagger
 * /notifications/user/{userId}:
 *   get:
 *     summary: Get notifications for a specific user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notifications to skip
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *     responses:
 *       200:
 *         description: List of user notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', NotificationsController.getUserNotifications);

/**
 * @swagger
 * /notifications/user/{userId}/unread-count:
 *   get:
 *     summary: Get unread notification count for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/user/:userId/unread-count', NotificationsController.getUnreadCount);

/**
 * @swagger
 * /notifications/user/{userId}/mark-read/{notificationId}:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the notification
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/user/:userId/mark-read/:notificationId', NotificationsController.markAsRead);

/**
 * @swagger
 * /notifications/user/{userId}/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Server error
 */
router.put('/user/:userId/mark-all-read', NotificationsController.markAllAsRead);

/**
 * @swagger
 * /notifications/user/{userId}/delete/{notificationId}:
 *   delete:
 *     summary: Delete a notification for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the notification
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/user/:userId/delete/:notificationId', NotificationsController.deleteNotification);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications (admin only)
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: List of all notifications
 *       500:
 *         description: Server error
 */
router.get('/', NotificationsController.getAllNotifications);

/**
 * @swagger
 * /notifications/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get notifications by entity type and ID
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         schema:
 *           type: string
 *         required: true
 *         description: The type of entity (ticket, incident, permit, etc.)
 *       - in: path
 *         name: entityId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the entity
 *     responses:
 *       200:
 *         description: List of notifications for the entity
 *       500:
 *         description: Server error
 */
router.get('/entity/:entityType/:entityId', NotificationsController.getNotificationsByEntity);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a custom notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationTypeId
 *               - title
 *               - message
 *             properties:
 *               notificationTypeId:
 *                 type: integer
 *                 description: The ID of the notification type
 *               title:
 *                 type: string
 *                 description: The notification title
 *               message:
 *                 type: string
 *                 description: The notification message
 *               entityType:
 *                 type: string
 *                 description: The type of entity this notification relates to
 *               entityId:
 *                 type: integer
 *                 description: The ID of the entity
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *                 description: The notification priority
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the notification expires
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of user IDs to assign the notification to
 *               assignToAll:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to assign to all users
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       500:
 *         description: Server error
 */
router.post('/', NotificationsController.createNotification);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   put:
 *     summary: Update a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The notification title
 *               message:
 *                 type: string
 *                 description: The notification message
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 description: The notification priority
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the notification expires
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:notificationId', NotificationsController.updateNotification);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification (admin only)
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the notification
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:notificationId', NotificationsController.deleteNotificationAdmin);

module.exports = router; 