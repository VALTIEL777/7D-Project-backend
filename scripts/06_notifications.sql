-- Notification Types table
CREATE TABLE NotificationTypes (
    notificationTypeId SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(128),
    color VARCHAR(32),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);

-- Notifications table
CREATE TABLE Notifications (
    notificationId SERIAL PRIMARY KEY,
    notificationTypeId INTEGER REFERENCES NotificationTypes(notificationTypeId),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entityType VARCHAR(64), -- 'ticket', 'incident', 'permit', etc.
    entityId INTEGER, -- ID of the related entity (ticketId, incidentId, etc.)
    priority VARCHAR(32) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    isRead BOOLEAN DEFAULT FALSE,
    readAt TIMESTAMP,
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    createdBy INTEGER REFERENCES Users(UserId),
    updatedBy INTEGER REFERENCES Users(UserId)
);

-- User Notifications junction table (many-to-many)
CREATE TABLE UserNotifications (
    userId INTEGER REFERENCES Users(UserId),
    notificationId INTEGER REFERENCES Notifications(notificationId),
    isRead BOOLEAN DEFAULT FALSE,
    readAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    PRIMARY KEY (userId, notificationId)
);

-- Insert default notification types
INSERT INTO NotificationTypes (name, description, icon, color) VALUES
('ticket_status_update', 'Ticket status has been updated', 'status-change', 'blue'),
('ticket_completed', 'Ticket has been completed', 'check-circle', 'green'),
('new_incident', 'New incident has been created', 'alert-triangle', 'red'),
('permit_expiring', 'Permit is expiring soon', 'clock', 'orange'),
('payment_received', 'Payment has been received', 'dollar-sign', 'green'),
('crew_assigned', 'Crew has been assigned to ticket', 'users', 'purple'),
('photo_uploaded', 'New photo evidence uploaded', 'camera', 'blue'),
('rtr_uploaded', 'New RTR file uploaded', 'file-text', 'indigo');

-- Create indexes for better performance
CREATE INDEX idx_notifications_entity ON Notifications(entityType, entityId);
CREATE INDEX idx_notifications_created_at ON Notifications(createdAt DESC);
CREATE INDEX idx_notifications_type ON Notifications(notificationTypeId);
CREATE INDEX idx_user_notifications_user ON UserNotifications(userId);
CREATE INDEX idx_user_notifications_read ON UserNotifications(userId, isRead);

-- Create triggers for updatedAt
CREATE TRIGGER set_updated_at_notificationtypes
BEFORE UPDATE ON NotificationTypes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_notifications
BEFORE UPDATE ON Notifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_updated_at_usernotifications
BEFORE UPDATE ON UserNotifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp(); 

