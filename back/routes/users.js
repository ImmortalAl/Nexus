﻿const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const adminAuth = require('../middleware/adminAuth');
const mongoose = require('mongoose');

// Get user analytics for admin dashboard
router.get('/analytics', auth, async (req, res) => {
    try {
        // Check if user is admin (basic check - should be enhanced)
        if (req.user.username !== 'ImmortalAl' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const totalUsers = await User.countDocuments();
        const onlineUsers = await User.countDocuments({ online: true });

        // Calculate daily active users (logged in today)
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dailyActive = await User.countDocuments({
            lastLogin: { $gte: startOfDay },
            online: true
        });

        // Recent user registrations
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username displayName createdAt online');

        // Calculate engagement rate (users who logged in vs total users)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const activeThisWeek = await User.countDocuments({
            lastLogin: { $gte: weekAgo }
        });
        const engagementRate = totalUsers > 0 ? ((activeThisWeek / totalUsers) * 100).toFixed(0) : '0';

        // Mock session duration (would need session tracking for real data)
        const avgSession = '8m 24s'; // Placeholder for now

        res.json({
            totalUsers,
            onlineUsers,
            dailyActive,
            engagementRate: `${engagementRate}%`,
            avgSession,
            recentUsers,
            activeThisWeek
        });
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
});

// Get online users
router.get('/online', auth, async (req, res) => {
    const ip = req.ip;
    try {
        const users = await User.find({ online: true, banned: { $ne: true } })
            .select('username displayName avatar status online lastLogin banned')
            .sort({ username: 1 });

        res.json(users);
    } catch (error) {
        console.error('Error fetching online users:', error);
        res.status(500).json({ error: 'Failed to fetch online users' });
    }
});

// Get all users with pagination
router.get('/', optionalAuth, async (req, res) => {
    const { page = 1, limit = 12, q = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ip = req.ip;
    try {
        const queryOptions = q 
            ? { 
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { displayName: { $regex: q, $options: 'i' } }
                ]
            }
            : {};
        
        // Include banned field for admin users
        let selectFields = 'username displayName avatar status bio createdAt online lastLogin';
        
        // Check if user is admin to include sensitive fields
        if (req.user?.id) {
            try {
                const requester = await User.findById(req.user.id);
                if (requester && requester.role === 'admin') {
                    selectFields += ' banned role';
                }
            } catch (err) {
                console.error('Could not verify admin status:', err);
            }
        }

        const users = await User.find(queryOptions)
            .select(selectFields)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await User.countDocuments(queryOptions);

        // The frontend expects the array directly for the souls page.
        // We will send the array directly.
        res.json(users);
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -seed');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user by username
router.get('/:username', optionalAuth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('username displayName avatar status bio createdAt online');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user by username:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update current user
router.patch('/me', auth, async (req, res) => {
    const { username, displayName, avatar, status, bio } = req.body;
    const updates = { username, displayName, avatar, status, bio };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ error: 'Username taken' });
            }
        }

        if (avatar) {
            try {
                new URL(avatar);
            } catch {
                return res.status(400).json({ error: 'Invalid avatar URL' });
            }
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({ error: 'Bio must be less than 500 characters' });
        }

        Object.assign(user, updates);
        await user.save();
        const updatedUser = await User.findById(req.user.id).select('-password -seed');
        
        // Broadcast status update via WebSocket if status changed
        if (updates.status !== undefined) {
            const wsManager = req.app.get('wsManager');
            if (wsManager) {
                wsManager.broadcastUserStatus(req.user.id, updatedUser.online ? 'online' : 'offline');
            } else {
                console.error('WebSocket manager not found for status update');
            }
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ADMIN ROUTE: Update user by ID or Username
router.put('/:identifier', auth, adminAuth, async (req, res) => {
    const { identifier } = req.params;
    const { displayName, email, status, bio, role, online, banned } = req.body;

    const allowedUpdates = {};
    if (displayName !== undefined) allowedUpdates.displayName = displayName;
    if (email !== undefined) allowedUpdates.email = email;
    if (status !== undefined) allowedUpdates.status = status;
    if (bio !== undefined) allowedUpdates.bio = bio;
    if (role !== undefined) allowedUpdates.role = role;
    if (online !== undefined && typeof online === 'boolean') allowedUpdates.online = online;
    if (banned !== undefined && typeof banned === 'boolean') allowedUpdates.banned = banned;

    if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({ error: 'No updatable fields provided' });
    }

    try {
        let userToUpdate;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            userToUpdate = await User.findById(identifier);
        }
        if (!userToUpdate) {
            userToUpdate = await User.findOne({ username: identifier });
        }

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (allowedUpdates.email && allowedUpdates.email !== userToUpdate.email) {
            const existingUserWithEmail = await User.findOne({ email: allowedUpdates.email });
            if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userToUpdate._id.toString()) {
                return res.status(400).json({ error: 'Email is already in use by another account.' });
            }
        }

        Object.assign(userToUpdate, allowedUpdates);
        await userToUpdate.save();

        const updatedUser = await User.findById(userToUpdate._id).select('-password -seed');
        
        // Broadcast status update via WebSocket if status or online state changed
        if (allowedUpdates.status !== undefined || allowedUpdates.online !== undefined) {
            const wsManager = req.app.get('wsManager');
            if (wsManager) {
                wsManager.broadcastUserStatus(userToUpdate._id.toString(), updatedUser.online ? 'online' : 'offline');
            }
        }

        res.json(updatedUser);

    } catch (error) {
        console.error('Admin error updating user:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error while updating user' });
    }
});

// Delete user (Admin only)
router.delete('/:identifier', auth, adminAuth, async (req, res) => {
    const { identifier } = req.params;
    
    try {
        let userToDelete;
        
        // Find user by ID or username
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            userToDelete = await User.findById(identifier);
        }
        if (!userToDelete) {
            userToDelete = await User.findOne({ username: identifier });
        }
        
        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent self-deletion
        if (userToDelete._id.toString() === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        const deletedUsername = userToDelete.username;
        const deletedUserId = userToDelete._id.toString();
        
        // Delete user
        await User.findByIdAndDelete(userToDelete._id);

        // Clean up orphaned profile comments for this user
        const Comment = require('../models/Comment');
        const deletedCommentsCount = await Comment.deleteMany({
            targetType: 'profile',
            targetId: deletedUsername
        });

        console.log(`[User Deletion] Cleaned up ${deletedCommentsCount.deletedCount} profile comments for deleted user: ${deletedUsername}`);

        // Note: Other content (blogs, user-authored comments, etc.) will be orphaned
        // This is intentional to preserve content history
        
        res.json({ 
            message: 'User deleted successfully',
            deletedUser: {
                id: deletedUserId,
                username: deletedUsername
            }
        });
        
    } catch (error) {
        console.error('Admin error deleting user:', error);
        res.status(500).json({ error: 'Server error while deleting user' });
    }
});

// Admin endpoint to clean up stale online users
router.post('/cleanup-online-status', auth, adminAuth, async (req, res) => {
    try {
        // Find users who are marked online but have old lastLogin (more than 30 days ago)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const staleUsers = await User.find({
            online: true,
            lastLogin: { $lt: thirtyDaysAgo }
        }).select('username lastLogin');
        
        if (staleUsers.length === 0) {
            return res.json({
                message: 'No stale online users found',
                cleaned: 0,
                details: []
            });
        }
        
        // Set these users offline
        const result = await User.updateMany(
            {
                online: true,
                lastLogin: { $lt: thirtyDaysAgo }
            },
            { online: false }
        );
        
        
        res.json({
            message: `Successfully cleaned up ${result.modifiedCount} stale online users`,
            cleaned: result.modifiedCount,
            details: staleUsers.map(user => ({
                username: user.username,
                lastLogin: user.lastLogin
            }))
        });
        
    } catch (error) {
        console.error('Admin error during online status cleanup:', error);
        res.status(500).json({ error: 'Server error during online status cleanup' });
    }
});

module.exports = router;