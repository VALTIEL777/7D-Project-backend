const Notifications = require('../../models/notifications/Notifications');
const UserNotifications = require('../../models/notifications/UserNotifications');

const NotificationsController = {
  // Get notifications for a specific user
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0, unreadOnly = false } = req.query;
      
      const notifications = await UserNotifications.findByUser(
        parseInt(userId), 
        parseInt(limit), 
        parseInt(offset), 
        unreadOnly === 'true'
      );
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
  },

  // Get unread count for a user
  async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;
      const count = await UserNotifications.getUnreadCount(parseInt(userId));
      
      res.status(200).json({ unreadCount: count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Error fetching unread count', error: error.message });
    }
  },

  // Mark a notification as read
  async markAsRead(req, res) {
    try {
      const { userId, notificationId } = req.params;
      const result = await UserNotifications.markAsRead(parseInt(userId), parseInt(notificationId));
      
      if (!result) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserNotifications.markAllAsRead(parseInt(userId));
      
      res.status(200).json({ 
        message: 'All notifications marked as read',
        updatedCount: result.length 
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Error marking notifications as read', error: error.message });
    }
  },

  // Delete a notification for a user
  async deleteNotification(req, res) {
    try {
      const { userId, notificationId } = req.params;
      const result = await UserNotifications.delete(parseInt(userId), parseInt(notificationId));
      
      if (!result) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
  },

  // Get all notifications (admin only)
  async getAllNotifications(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const notifications = await Notifications.findAll(parseInt(limit), parseInt(offset));
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
  },

  // Get notifications by entity
  async getNotificationsByEntity(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const notifications = await Notifications.findByEntity(entityType, parseInt(entityId));
      
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching entity notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
  },

  // Create a custom notification
  async createNotification(req, res) {
    try {
      const { 
        notificationTypeId, 
        title, 
        message, 
        entityType, 
        entityId, 
        priority, 
        expiresAt,
        userIds, // Array of user IDs to assign to
        assignToAll = false // If true, assign to all users
      } = req.body;
      
      const createdBy = req.body.createdBy || 1; // Default user ID
      
      // Create the notification
      const notification = await Notifications.create(
        notificationTypeId,
        title,
        message,
        entityType,
        entityId,
        priority,
        expiresAt,
        createdBy,
        createdBy
      );
      
      // Assign to users
      if (assignToAll) {
        await UserNotifications.assignToAllUsers(notification.notificationId);
      } else if (userIds && userIds.length > 0) {
        await UserNotifications.assignToUsers(notification.notificationId, userIds);
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
  },

  // Update a notification
  async updateNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const { title, message, priority, expiresAt } = req.body;
      const updatedBy = req.body.updatedBy || 1;
      
      const notification = await Notifications.update(
        parseInt(notificationId),
        title,
        message,
        priority,
        expiresAt,
        updatedBy
      );
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json(notification);
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
  },

  // Delete a notification (admin only)
  async deleteNotificationAdmin(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await Notifications.delete(parseInt(notificationId));
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
  }
};

module.exports = NotificationsController; 