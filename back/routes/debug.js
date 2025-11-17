const express = require('express');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const router = express.Router();

// Debug endpoint to check auth status
router.get('/whoami', authMiddleware, async (req, res) => {
  try {
    res.json({
      userId: req.user._id,
      username: req.user.username,
      role: req.user.role,
      isAdmin: req.user.role === 'admin',
      tokenValid: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Admin-only: Check if a user exists and recent login attempts
router.post('/check-user', authMiddleware, adminAuth, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Find user (case-insensitive like login does)
    const user = await User.findOne({
      username: {
        $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i'
      }
    }).select('-password'); // Don't send password hash

    if (!user) {
      return res.json({
        exists: false,
        message: `User "${username}" not found in database`
      });
    }

    // Get recent login attempts for this user
    const recentAttempts = await LoginAttempt.find({ username: user.username })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      exists: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        banned: user.banned,
        isActive: user.isActive,
        online: user.online,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      recentAttempts: recentAttempts.map(attempt => ({
        timestamp: attempt.timestamp,
        success: attempt.success,
        reason: attempt.reason,
        ip: attempt.ip.substring(0, 10) + '...' // Partial IP for privacy
      })),
      diagnosis: {
        accountValid: !user.banned && user.isActive,
        canLogin: !user.banned && user.isActive,
        issues: [
          user.banned && 'Account is banned',
          !user.isActive && 'Account is inactive'
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('[Debug] Check user error:', error);
    res.status(500).json({ error: 'Failed to check user' });
  }
});

module.exports = router;