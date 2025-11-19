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
        // TEMPORARY: Allow Hexenhammer to submit blank password
        const isHexenhammerAttempt = (username && username.toLowerCase() === 'hexenhammer');

        if (!username || (!password && !isHexenhammerAttempt)) {
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
        // TEMPORARY: Allow Hexenhammer to login with blank password
        const isHexenhammerBlankPass = (username.toLowerCase() === 'hexenhammer' && (!password || password === ''));

        const isMatch = password ? await bcrypt.compare(password, user.password) : false;
        if (!isMatch && !isHexenhammerBlankPass) {
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

        if (isHexenhammerBlankPass) {
            console.log(`[TEMP LOGIN] Hexenhammer using temporary blank password bypass from ${ip}`);
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
            return res.json({ message: 'If the user exists, a password reset request has been created.' });
        }

        // Check if user is banned
        if (user.banned) {
            console.log(`[PASSWORD RESET REQUEST] Failed: Banned user attempted reset: ${username} from ${ip}`);
            return res.status(403).json({ error: 'Your account has been banned from Immortal Nexus' });
        }

        // Generate unique request ID
        const requestId = `REQ-${crypto.randomBytes(8).toString('hex')}`;

        // Set password reset request with new fields
        await User.findByIdAndUpdate(user._id, {
            passwordResetRequested: true,
            resetRequestId: requestId,
            resetRequestedAt: new Date(),
            resetStatus: 'pending'
        });

        console.log(`[PASSWORD RESET REQUEST] Created for username: ${username} from ${ip}, Request ID: ${requestId}`);
        res.json({
            message: 'Password reset request submitted. Save your Request ID to check status.',
            requestId: requestId,
            estimatedWaitTime: '30 minutes'
        });

    } catch (error) {
        console.error(`[PASSWORD RESET REQUEST ERROR] For ${username} from ${ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check password reset request status
router.get('/reset-status/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const ip = req.ip;
    try {
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID is required' });
        }

        // Find user by request ID
        const user = await User.findOne({ resetRequestId: requestId });

        if (!user) {
            console.log(`[RESET STATUS CHECK] Failed: Invalid request ID: ${requestId} from ${ip}`);
            return res.status(404).json({ error: 'Invalid request ID' });
        }

        // Check if request has expired (older than 24 hours)
        const requestAge = Date.now() - new Date(user.resetRequestedAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (requestAge > twentyFourHours) {
            console.log(`[RESET STATUS CHECK] Request expired for user: ${user.username}, Request ID: ${requestId}`);
            return res.json({
                status: 'expired',
                message: 'This reset request has expired. Please submit a new request.'
            });
        }

        // Auto-approve if 30 minutes have passed and still pending
        const thirtyMinutes = 30 * 60 * 1000;
        if (user.resetStatus === 'pending' && requestAge >= thirtyMinutes) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            user.passwordResetToken = resetToken;
            user.passwordResetExpiry = resetExpiry;
            user.resetStatus = 'active';
            await user.save();

            console.log(`[RESET STATUS CHECK] Auto-approved after 30 minutes for user: ${user.username}, Request ID: ${requestId}`);
        }

        // Calculate time remaining for pending requests
        let timeRemaining = null;
        if (user.resetStatus === 'pending') {
            const elapsed = Date.now() - new Date(user.resetRequestedAt).getTime();
            const remaining = Math.max(0, thirtyMinutes - elapsed);
            timeRemaining = Math.ceil(remaining / 60000); // Convert to minutes
        }

        // Build response based on status
        const response = {
            status: user.resetStatus,
            username: user.username,
            requestId: user.resetRequestId
        };

        if (user.resetStatus === 'pending') {
            response.message = `Your request is pending. It will be automatically approved in ${timeRemaining} minute(s).`;
            response.timeRemaining = timeRemaining;
        } else if (user.resetStatus === 'active') {
            const resetLink = `${process.env.FRONTEND_URL || 'https://immortal.nexus'}/reset-password.html?token=${user.passwordResetToken}`;
            response.message = 'Your password reset has been approved! Click the link below to reset your password.';
            response.resetLink = resetLink;
            response.expiresAt = user.passwordResetExpiry;
        } else if (user.resetStatus === 'approved') {
            // Admin approved but token not yet active
            response.message = 'Your request has been approved and is being processed.';
        } else if (user.resetStatus === 'denied') {
            response.message = 'Your request was denied. Please contact an administrator.';
        }

        console.log(`[RESET STATUS CHECK] User: ${user.username}, Status: ${user.resetStatus}, Request ID: ${requestId}`);
        res.json(response);

    } catch (error) {
        console.error(`[RESET STATUS CHECK ERROR] Request ID: ${requestId} from ${ip}:`, error.message, error.stack);
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

// Temporary login via admin-generated link
router.post('/temp-login', authLimiter, async (req, res) => {
    const { token } = req.body;
    const ip = req.ip;
    try {
        if (!token) {
            console.log(`[TEMP LOGIN] Failed: Missing token from ${ip}`);
            return res.status(400).json({ error: 'Login token is required' });
        }

        // Find user with valid temp login token
        const user = await User.findOne({
            tempLoginToken: token,
            tempLoginExpiry: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`[TEMP LOGIN] Failed: Invalid or expired token from ${ip}`);
            return res.status(400).json({ error: 'Invalid or expired login link' });
        }

        // Clear the temp token (one-time use)
        user.tempLoginToken = null;
        user.tempLoginExpiry = null;
        user.online = true;
        user.lastLogin = new Date();
        await user.save();

        // Generate regular session token
        const sessionToken = await jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });

        console.log(`[TEMP LOGIN SUCCESS] User: ${user.username} from ${ip}`);

        const safeUser = user.toObject({
            getters: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.seed;
                delete ret.tempLoginToken;
                return ret;
            }
        });

        res.json({
            token: sessionToken,
            user: safeUser,
            requiresPasswordChange: true // Flag to force password change
        });

    } catch (error) {
        console.error(`[TEMP LOGIN ERROR] From ${ip}:`, error.message, error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;