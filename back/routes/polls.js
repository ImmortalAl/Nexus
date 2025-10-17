const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Poll = require('../models/Poll');

// IP extraction and hashing utility
function getClientIP(req) {
    // Try various headers for IP (handles proxies, load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    return req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

function hashIP(ip) {
    // Use environment variable for salt, fallback to default
    const salt = process.env.IP_HASH_SALT || 'immortal-nexus-eternal-salt-2024';
    return crypto.createHash('sha256')
        .update(ip + salt)
        .digest('hex');
}

// Initialize default poll if it doesn't exist
async function ensureDefaultPoll() {
    try {
        const existingPoll = await Poll.findOne({ pollId: 'censorship-justified' });

        if (!existingPoll) {
            const defaultPoll = new Poll({
                pollId: 'censorship-justified',
                question: 'Is censorship ever justified?',
                votes: { yes: 0, no: 0 },
                voters: []
            });

            await defaultPoll.save();
            console.log('[Poll] Created default poll: censorship-justified');
        }
    } catch (error) {
        console.error('[Poll] Error creating default poll:', error);
    }
}

// Call on module load
ensureDefaultPoll();

// GET /api/poll/:pollId - Get poll results and check if user has voted
router.get('/:pollId', async (req, res) => {
    try {
        const { pollId } = req.params;

        // Get and hash client IP
        const clientIP = getClientIP(req);
        const ipHash = hashIP(clientIP);

        // Find poll
        const poll = await Poll.findOne({ pollId });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        // Get results with voter status
        const results = poll.getResults(ipHash);

        res.json(results);

    } catch (error) {
        console.error('[Poll] Error fetching poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch poll results'
        });
    }
});

// POST /api/poll/:pollId/vote - Submit a vote
router.post('/:pollId/vote', async (req, res) => {
    try {
        const { pollId } = req.params;
        const { vote } = req.body;

        // Validate vote value
        if (!vote || !['yes', 'no'].includes(vote)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vote. Must be "yes" or "no"'
            });
        }

        // Get and hash client IP
        const clientIP = getClientIP(req);
        const ipHash = hashIP(clientIP);

        // Find poll
        const poll = await Poll.findOne({ pollId });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        // Check if already voted
        if (poll.hasVoted(ipHash)) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this poll'
            });
        }

        // Add vote
        poll.addVote(ipHash, vote);
        await poll.save();

        // Return updated results
        const results = poll.getResults(ipHash);

        res.json({
            success: true,
            message: 'Vote recorded successfully',
            results
        });

    } catch (error) {
        console.error('[Poll] Error submitting vote:', error);

        if (error.message === 'Already voted') {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this poll'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to record vote'
        });
    }
});

module.exports = router;
