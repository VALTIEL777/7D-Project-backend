const socketIo = require('socket.io');

class WebSocketService {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: ["https://7d-compass.christba.com", "http://localhost:3000"],
        methods: ["GET", "POST"]
      }
    });
    
    this.userSockets = new Map(); // Map userId to socket
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        this.userSockets.set(userId, socket);
        socket.userId = userId;
        console.log(`User ${userId} authenticated`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
      });

      // Handle notification read
      socket.on('markNotificationRead', (notificationId) => {
        // This could trigger a database update
        console.log(`Notification ${notificationId} marked as read by user ${socket.userId}`);
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('notification', notification);
      console.log(`Notification sent to user ${userId}:`, notification.title);
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.sendToUser(userId, notification);
    });
  }

  // Send notification to all connected users
  sendToAll(notification) {
    this.io.emit('notification', notification);
    console.log('Notification sent to all users:', notification.title);
  }

  // Send unread count update to user
  sendUnreadCountUpdate(userId, count) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('unreadCountUpdate', { count });
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Get list of connected user IDs
  getConnectedUserIds() {
    return Array.from(this.userSockets.keys());
  }
}

module.exports = WebSocketService; 