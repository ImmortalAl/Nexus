/**
 * Notification Service
 * Centralized service for creating and managing notifications
 * Part of the Immortal Nexus Courier Pigeon Notification System
 */

const Notification = require('../models/Notification');

// Global WebSocket Manager reference
let wsManager = null;

class NotificationService {
    /**
     * Set WebSocket Manager for real-time notifications
     * @param {Object} manager - WebSocket Manager instance
     */
    static setWebSocketManager(manager) {
        wsManager = manager;
    }
    /**
     * Create a new notification
     * @param {Object} notificationData - Notification data
     * @returns {Object} Created notification
     */
    static async createNotification(notificationData) {
        try {
            const {
                userId,
                type,
                title,
                message,
                link = null,
                metadata = {},
                triggeredBy = null,
                relatedId = null,
                relatedModel = null
            } = notificationData;

            // Validate required fields
            if (!userId || !type || !title || !message) {
                throw new Error('Missing required notification fields');
            }

            // Create notification
            const notification = await Notification.createNotification({
                userId,
                type,
                title,
                message,
                link,
                metadata,
                triggeredBy,
                relatedId,
                relatedModel
            });

            // Send real-time notification via WebSocket if user is online
            if (wsManager) {
                wsManager.sendNotification(userId, notification);
            }

            return notification;
        } catch (error) {
            console.error('NotificationService.createNotification error:', error);
            throw error;
        }
    }

    /**
     * Create notification for new private message
     * @param {String} recipientId - Message recipient user ID
     * @param {String} senderId - Message sender user ID
     * @param {String} senderUsername - Sender's username
     * @param {String} messageId - Message ID
     * @param {String} preview - Message preview text
     */
    static async notifyNewMessage(recipientId, senderId, senderUsername, messageId, preview) {
        try {
            const truncatedPreview = preview.length > 100
                ? preview.substring(0, 100) + '...'
                : preview;

            return await this.createNotification({
                userId: recipientId,
                type: 'message',
                title: `New message from ${senderUsername}`,
                message: truncatedPreview,
                link: `/messages?id=${messageId}`,
                triggeredBy: senderId,
                relatedId: messageId,
                relatedModel: 'Message',
                metadata: { senderUsername }
            });
        } catch (error) {
            console.error('NotificationService.notifyNewMessage error:', error);
        }
    }

    /**
     * Create notification for comment reply
     * @param {String} recipientId - Original commenter user ID
     * @param {String} replierId - User who replied
     * @param {String} replierUsername - Replier's username
     * @param {String} commentId - Comment ID
     * @param {String} contentType - Type of content (blog, chronicle, echo)
     * @param {String} contentId - ID of the content (blog post, chronicle, etc.)
     * @param {String} contentTitle - Title of the content
     * @param {String} replyPreview - Reply preview text
     */
    static async notifyCommentReply(recipientId, replierId, replierUsername, commentId, contentType, contentId, contentTitle, replyPreview) {
        try {
            const truncatedPreview = replyPreview.length > 100
                ? replyPreview.substring(0, 100) + '...'
                : replyPreview;

            const typeMap = {
                'blog': 'comment_reply',
                'chronicle': 'chronicle_comment',
                'echo': 'echo_comment'
            };

            // Generate correct link based on content type
            const linkMap = {
                'blog': `/pages/blog.html?id=${contentId}`,
                'chronicle': `/pages/chronicles.html?id=${contentId}`,
                'echo': `/pages/messageboard.html?id=${contentId}`
            };
            const link = linkMap[contentType] || `/pages/blog.html?id=${contentId}`;

            return await this.createNotification({
                userId: recipientId,
                type: typeMap[contentType] || 'comment_reply',
                title: `${replierUsername} replied to your comment`,
                message: `On "${contentTitle}": ${truncatedPreview}`,
                link: link,
                triggeredBy: replierId,
                relatedId: commentId,
                relatedModel: 'Comment',
                metadata: {
                    replierUsername,
                    contentType,
                    contentId,
                    contentTitle
                }
            });
        } catch (error) {
            console.error('NotificationService.notifyCommentReply error:', error);
        }
    }

    /**
     * Create notification for new comment on user's content
     * @param {String} authorId - Content author user ID
     * @param {String} commenterId - User who commented
     * @param {String} commenterUsername - Commenter's username
     * @param {String} commentId - Comment ID
     * @param {String} contentType - Type of content
     * @param {String} contentId - ID of the content (blog post, chronicle, etc.)
     * @param {String} contentTitle - Title of the content
     * @param {String} commentPreview - Comment preview text
     */
    static async notifyNewComment(authorId, commenterId, commenterUsername, commentId, contentType, contentId, contentTitle, commentPreview) {
        try {
            const truncatedPreview = commentPreview.length > 100
                ? commentPreview.substring(0, 100) + '...'
                : commentPreview;

            const typeMap = {
                'chronicle': 'chronicle_comment',
                'echo': 'echo_comment',
                'blog': 'comment_reply'
            };

            // Generate correct link based on content type
            const linkMap = {
                'blog': `/pages/blog.html?id=${contentId}`,
                'chronicle': `/pages/chronicles.html?id=${contentId}`,
                'echo': `/pages/messageboard.html?id=${contentId}`
            };
            const link = linkMap[contentType] || `/pages/blog.html?id=${contentId}`;

            return await this.createNotification({
                userId: authorId,
                type: typeMap[contentType] || 'comment_reply',
                title: `${commenterUsername} commented on your ${contentType === 'blog' ? 'scroll' : contentType}`,
                message: `"${contentTitle}": ${truncatedPreview}`,
                link: link,
                triggeredBy: commenterId,
                relatedId: commentId,
                relatedModel: 'Comment',
                metadata: {
                    commenterUsername,
                    contentType,
                    contentId,
                    contentTitle
                }
            });
        } catch (error) {
            console.error('NotificationService.notifyNewComment error:', error);
        }
    }

    /**
     * Create notification for governance update
     * @param {String} userId - User ID to notify
     * @param {String} updateType - Type of update (proposal_created, vote_started, etc.)
     * @param {String} title - Update title
     * @param {String} message - Update message
     * @param {String} link - Link to governance content
     */
    static async notifyGovernanceUpdate(userId, updateType, title, message, link) {
        try {
            return await this.createNotification({
                userId,
                type: 'governance_update',
                title,
                message,
                link,
                metadata: { updateType }
            });
        } catch (error) {
            console.error('NotificationService.notifyGovernanceUpdate error:', error);
        }
    }

    /**
     * Create notification for moderation action
     * @param {String} userId - User affected by moderation
     * @param {String} action - Moderation action type
     * @param {String} reason - Reason for action
     * @param {String} contentType - Type of content moderated
     * @param {String} moderatorId - Moderator user ID (optional)
     */
    static async notifyModerationAction(userId, action, reason, contentType, moderatorId = null) {
        try {
            return await this.createNotification({
                userId,
                type: 'moderation_action',
                title: `Moderation Action: ${action}`,
                message: `Your ${contentType} was ${action}. Reason: ${reason}`,
                link: '/moderation',
                triggeredBy: moderatorId,
                metadata: {
                    action,
                    reason,
                    contentType
                }
            });
        } catch (error) {
            console.error('NotificationService.notifyModerationAction error:', error);
        }
    }

    /**
     * Create admin broadcast notification for all users or specific users
     * @param {String} title - Broadcast title
     * @param {String} message - Broadcast message
     * @param {String} link - Optional link
     * @param {Array} userIds - Array of user IDs (if null, broadcast to all)
     */
    static async broadcastAdminNotification(title, message, link = null, userIds = null) {
        try {
            const User = require('../models/User');

            // If no specific users, get all user IDs
            if (!userIds) {
                const allUsers = await User.find({}, '_id');
                userIds = allUsers.map(u => u._id);
            }

            // Create notification for each user
            const notifications = await Promise.all(
                userIds.map(userId =>
                    this.createNotification({
                        userId,
                        type: 'admin_broadcast',
                        title,
                        message,
                        link,
                        metadata: { broadcast: true }
                    })
                )
            );

            return notifications;
        } catch (error) {
            console.error('NotificationService.broadcastAdminNotification error:', error);
            throw error;
        }
    }

    /**
     * Fetch notifications for a user
     * @param {String} userId - User ID
     * @param {Object} options - Query options (limit, skip, unreadOnly)
     * @returns {Array} Notifications
     */
    static async getUserNotifications(userId, options = {}) {
        try {
            const {
                limit = 50,
                skip = 0,
                unreadOnly = false
            } = options;

            const query = { userId };
            if (unreadOnly) {
                query.read = false;
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .populate('triggeredBy', 'username displayName avatar')
                .lean();

            return notifications;
        } catch (error) {
            console.error('NotificationService.getUserNotifications error:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count for user
     * @param {String} userId - User ID
     * @returns {Number} Unread count
     */
    static async getUnreadCount(userId) {
        try {
            return await Notification.getUnreadCount(userId);
        } catch (error) {
            console.error('NotificationService.getUnreadCount error:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for verification)
     * @returns {Object} Updated notification
     */
    static async markAsRead(notificationId, userId) {
        try {
            return await Notification.markAsRead(notificationId, userId);
        } catch (error) {
            console.error('NotificationService.markAsRead error:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for user
     * @param {String} userId - User ID
     * @returns {Object} Update result
     */
    static async markAllAsRead(userId) {
        try {
            return await Notification.markAllAsRead(userId);
        } catch (error) {
            console.error('NotificationService.markAllAsRead error:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for verification)
     * @returns {Object} Deletion result
     */
    static async deleteNotification(notificationId, userId) {
        try {
            const result = await Notification.deleteOne({
                _id: notificationId,
                userId: userId
            });
            return result;
        } catch (error) {
            console.error('NotificationService.deleteNotification error:', error);
            throw error;
        }
    }

    /**
     * Cleanup old read notifications (90 days)
     * Should be run periodically via cron job
     * @returns {Object} Cleanup result
     */
    static async cleanupOldNotifications() {
        try {
            return await Notification.cleanupOldNotifications();
        } catch (error) {
            console.error('NotificationService.cleanupOldNotifications error:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;
