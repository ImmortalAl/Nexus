const express = require('express');
const authMiddleware = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const router = express.Router();

/**
 * GET /api/notifications
 * Fetch notifications for authenticated user
 * Query params: limit, skip, unreadOnly
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            limit = 50,
            skip = 0,
            unreadOnly = false
        } = req.query;

        const options = {
            limit: parseInt(limit),
            skip: parseInt(skip),
            unreadOnly: unreadOnly === 'true'
        };

        const notifications = await NotificationService.getUserNotifications(userId, options);
        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.json({
            notifications,
            unreadCount,
            total: notifications.length
        });
    } catch (error) {
        console.error('GET /api/notifications error:', error.message);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
});

/**
 * GET /api/notifications/count
 * Get unread notification count for authenticated user
 */
router.get('/count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.json({ unreadCount });
    } catch (error) {
        console.error('GET /api/notifications/count error:', error.message);
        res.status(500).json({ error: 'Server error fetching notification count' });
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const notification = await NotificationService.markAsRead(notificationId, userId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('PATCH /api/notifications/:id/read error:', error.message);
        res.status(500).json({ error: 'Server error marking notification as read' });
    }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for authenticated user
 */
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await NotificationService.markAllAsRead(userId);

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('PATCH /api/notifications/read-all error:', error.message);
        res.status(500).json({ error: 'Server error marking all notifications as read' });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const result = await NotificationService.deleteNotification(notificationId, userId);

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('DELETE /api/notifications/:id error:', error.message);
        res.status(500).json({ error: 'Server error deleting notification' });
    }
});

/**
 * POST /api/notifications/broadcast (Admin only)
 * Broadcast notification to all users or specific users
 */
router.post('/broadcast', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { title, message, link, userIds } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }

        const notifications = await NotificationService.broadcastAdminNotification(
            title,
            message,
            link,
            userIds
        );

        res.json({
            message: 'Broadcast sent successfully',
            count: notifications.length
        });
    } catch (error) {
        console.error('POST /api/notifications/broadcast error:', error.message);
        res.status(500).json({ error: 'Server error broadcasting notification' });
    }
});

/**
 * POST /api/notifications/cleanup (Admin only)
 * Manually trigger cleanup of old read notifications
 */
router.post('/cleanup', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await NotificationService.cleanupOldNotifications();

        res.json({
            message: 'Cleanup completed',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('POST /api/notifications/cleanup error:', error.message);
        res.status(500).json({ error: 'Server error during cleanup' });
    }
});

module.exports = router;
