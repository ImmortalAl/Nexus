const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const auth = require('../middleware/auth');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// More restrictive rate limiting for login specifically
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 login attempts per window
    message: {
        error: 'Too many login attempts. Please try again in 15 minutes.',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip;
    try {
        if (!username || !password) {
            console.log(`[LOGIN ATTEMPT] Failed: Missing credentials from ${ip}`);
            // Track failed attempt
            await LoginAttempt.create({
                username: username || 'unknown',
                ip,
                success: false,
                reason: 'missing_credentials'
            }).catch(err => console.error('Failed to log login attempt:', err));
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Use case-insensitive search with sanitized input to prevent NoSQL injection
        const user = await User.findOne({
            username: {
                $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                $options: 'i'
            }
        });
        if (!user) {
            console.log(`[LOGIN ATTEMPT] Failed: User not found for username: ${username} from ${ip}`);
            // Track failed attempt
            await LoginAttempt.create({
                username,
                ip,
                success: false,
                reason: 'user_not_found'
            }).catch(err => console.error('Failed to log login attempt:', err));
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[LOGIN ATTEMPT] Failed: Incorrect password for username: ${username} from ${ip}`);
            // Track failed attempt
            await LoginAttempt.create({
                username,
                ip,
                success: false,
                reason: 'incorrect_password'
            }).catch(err => console.error('Failed to log login attempt:', err));
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is banned
        if (user.banned) {
            console.log(`[LOGIN ATTEMPT] Failed: Banned user attempted login: ${username} from ${ip}`);
            // Track failed attempt
            await LoginAttempt.create({
                username,
                ip,
                success: false,
                reason: 'user_banned'
            }).catch(err => console.error('Failed to log login attempt:', err));
            return res.status(403).json({ error: 'Your account has been banned from Immortal Nexus' });
        }

        // Update online status and lastLogin time
        console.log(`[LOGIN] User ${username} found. Current online status: ${user.online}. Attempting to set online: true and update lastLogin.`);
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { online: true, lastLogin: new Date() }, // Set online and update lastLogin
            { new: true } // Return the updated document
        ).select('-password -seed'); // Exclude sensitive fields

        if (!updatedUser) {
            console.error(`[LOGIN CRITICAL] Failed to update user ${username} to online: true and set lastLogin from ${ip}. User might appear offline.`);
            // Even if update fails, proceed with login but log critical error
            const token = await jwt.sign({ id: user._id, username }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.json({ token, user: user.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; delete ret.seed; return ret; } }) });
        }
        
        console.log(`[LOGIN SUCCESS] User: ${updatedUser.username}, Online: ${updatedUser.online}, LastLogin: ${updatedUser.lastLogin}, IP: ${ip}`);
        
        // Track successful attempt
        await LoginAttempt.create({
            username: updatedUser.username,
            ip,
            success: true,
            reason: 'success'
        }).catch(err => console.error('Failed to log login attempt:', err));
        
        const token = await jwt.sign({ id: updatedUser._id, username: updatedUser.username }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: updatedUser });

    } catch (error) {
        console.error(`[LOGIN ERROR] For ${username} from ${ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/signup', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            console.log(`Signup failed: Missing credentials from ${req.ip}`);
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log(`Signup failed: Username taken: ${username} from ${req.ip}`);
            return res.status(400).json({ error: 'Username taken' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, online: true });
        await user.save();
        const token = await jwt.sign({ id: user._id, username }, process.env.JWT_SECRET, { expiresIn: '30d' });
        const safeUser = user.toObject({
            getters: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.seed;
                return ret;
            }
        });
        console.log(`Signup successful for username: ${username} from ${req.ip}`);
        res.json({ token, user: safeUser });
    } catch (error) {
        console.error(`Signup error for ${username || 'unknown'} from ${req.ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', auth, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { online: false },
            { new: true }
        );
        if (!updatedUser) {
            console.warn(`Failed to set offline status for user ID: ${req.user.id} from ${req.ip}`);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(`Logout successful for user ID: ${req.user.id} from ${req.ip}`);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error(`Logout error for user ID: ${req.user.id} from ${req.ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request password reset
router.post('/request-password-reset', authLimiter, async (req, res) => {
    const { username } = req.body;
    const ip = req.ip;
    try {
        if (!username) {
            console.log(`[PASSWORD RESET REQUEST] Failed: Missing username from ${ip}`);
            return res.status(400).json({ error: 'Username is required' });
        }

        // Find user (case-insensitive)
        const user = await User.findOne({
            username: {
                $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                $options: 'i'
            }
        });

        if (!user) {
            console.log(`[PASSWORD RESET REQUEST] Failed: User not found for username: ${username} from ${ip}`);
            // Don't reveal if user exists or not (security best practice)
            return res.json({ message: 'If the user exists, a password reset request has been created. Please contact an administrator.' });
        }

        // Check if user is banned
        if (user.banned) {
            console.log(`[PASSWORD RESET REQUEST] Failed: Banned user attempted reset: ${username} from ${ip}`);
            return res.status(403).json({ error: 'Your account has been banned from Immortal Nexus' });
        }

        // Set password reset requested flag (admin will approve and generate token)
        await User.findByIdAndUpdate(user._id, {
            passwordResetRequested: true
        });

        console.log(`[PASSWORD RESET REQUEST] Created for username: ${username} from ${ip}`);
        res.json({ message: 'Password reset request submitted. An administrator will review your request shortly.' });

    } catch (error) {
        console.error(`[PASSWORD RESET REQUEST ERROR] For ${username} from ${ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset password with token
router.post('/reset-password', authLimiter, async (req, res) => {
    const { token, newPassword } = req.body;
    const ip = req.ip;
    try {
        if (!token || !newPassword) {
            console.log(`[PASSWORD RESET] Failed: Missing token or password from ${ip}`);
            return res.status(400).json({ error: 'Reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpiry: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`[PASSWORD RESET] Failed: Invalid or expired token from ${ip}`);
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password and clear reset fields
        user.password = newPassword; // Will be hashed by pre-save hook
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        user.passwordResetRequested = false;
        await user.save();

        console.log(`[PASSWORD RESET SUCCESS] User: ${user.username} from ${ip}`);
        res.json({ message: 'Password reset successful. You can now log in with your new password.' });

    } catch (error) {
        console.error(`[PASSWORD RESET ERROR] From ${ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;