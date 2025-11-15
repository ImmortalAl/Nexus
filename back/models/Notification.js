const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Recipient of the notification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Type of notification
    type: {
        type: String,
        required: true,
        enum: [
            'message',              // New private message
            'comment_reply',        // Reply to user's comment
            'soul_interaction',     // Soul Scrolls interaction
            'chronicle_comment',    // New comment on chronicle
            'echo_comment',         // New comment on echo (Echoes Unbound)
            'governance_update',    // Governance/democracy update
            'moderation_action',    // Community moderation action
            'admin_broadcast',      // Admin announcement
            'mention',              // User was mentioned
            'clash_update',         // Clash of Immortals update (future)
            'vault_notification'    // Timeless Vault notification (future)
        ],
        index: true
    },

    // Notification title
    title: {
        type: String,
        required: true,
        maxlength: 200
    },

    // Notification message/content
    message: {
        type: String,
        required: true,
        maxlength: 500
    },

    // Link to relevant content (optional)
    link: {
        type: String,
        trim: true
    },

    // Read status
    read: {
        type: Boolean,
        default: false,
        index: true
    },

    // When notification was read
    readAt: {
        type: Date,
        default: null
    },

    // Additional metadata (flexible for different notification types)
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Who triggered this notification (optional)
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Related content reference (flexible)
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },

    relatedModel: {
        type: String,
        enum: ['Message', 'Comment', 'Chronicle', 'Post', 'Proposal', 'ModerationCase', null]
    }

}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Compound index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Index for cleanup job (find old read notifications)
notificationSchema.index({ read: 1, readAt: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
    try {
        const notification = new this(notificationData);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
    try {
        const notification = await this.findOneAndUpdate(
            { _id: notificationId, userId: userId },
            {
                read: true,
                readAt: new Date()
            },
            { new: true }
        );
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
    try {
        const result = await this.updateMany(
            { userId: userId, read: false },
            {
                read: true,
                readAt: new Date()
            }
        );
        return result;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
    try {
        const count = await this.countDocuments({ userId: userId, read: false });
        return count;
    } catch (error) {
        console.error('Error getting unread count:', error);
        throw error;
    }
};

// Static method to cleanup old read notifications (90 days)
notificationSchema.statics.cleanupOldNotifications = async function() {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const result = await this.deleteMany({
            read: true,
            readAt: { $lte: ninetyDaysAgo }
        });

        console.log(`Cleaned up ${result.deletedCount} old notifications`);
        return result;
    } catch (error) {
        console.error('Error cleaning up old notifications:', error);
        throw error;
    }
};

// Instance method to mark this notification as read
notificationSchema.methods.markRead = async function() {
    this.read = true;
    this.readAt = new Date();
    await this.save();
    return this;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
