const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const Moderation = require('../models/Moderation');
const auth = require('../middleware/auth');

// Flag a thread for moderation
router.post('/flags', auth, async (req, res) => {
    const { threadId } = req.body;

    if (!threadId) {
        return res.status(400).json({ error: 'Thread ID is required' });
    }

    try {
        const thread = await Thread.findById(threadId);
        if (!thread || thread.hidden) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        let moderation = await Moderation.findOne({ threadId });
        if (!moderation) {
            moderation = new Moderation({
                threadId,
                flags: [{ userId: req.user.id, createdAt: new Date() }],
                votes: []
            });
        } else {
            if (moderation.flags.some(flag => flag.userId.toString() === req.user.id)) {
                return res.status(400).json({ error: 'You have already flagged this thread' });
            }
            moderation.flags.push({ userId: req.user.id, createdAt: new Date() });
        }

        // Auto-hide after 5 flags
        if (moderation.flags.length >= 5 && !thread.hidden) {
            thread.hidden = true;
            await thread.save();
            moderation.status = 'pending';
        }

        await moderation.save();
        res.status(201).json({ message: 'Thread flagged for community review' });
    } catch (error) {
        console.error('Error flagging thread:', error);
        res.status(500).json({ error: 'Failed to flag thread' });
    }
});

// Vote on a moderation action
router.post('/votes', auth, async (req, res) => {
    const { threadId, action } = req.body; // action: 'delete', 'hide', 'ban'

    if (!threadId || !action) {
        return res.status(400).json({ error: 'Thread ID and action are required' });
    }

    const validActions = ['delete', 'hide', 'ban'];
    if (!validActions.includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        const moderation = await Moderation.findOne({ threadId });
        if (!moderation) {
            return res.status(404).json({ error: 'No moderation record found' });
        }

        if (moderation.votes.some(vote => vote.userId.toString() === req.user.id)) {
            return res.status(400).json({ error: 'You have already voted' });
        }

        moderation.votes.push({ userId: req.user.id, action, createdAt: new Date() });
        await moderation.save();

        // Calculate vote outcome
        const totalVotes = moderation.votes.length;
        const actionVotes = moderation.votes.filter(vote => vote.action === action).length;
        const votePercentage = (actionVotes / totalVotes) * 100;

        let threshold = action === 'ban' ? 75 : 66; // 75% for ban, 66% for delete/hide
        if (totalVotes >= 10 && votePercentage >= threshold) {
            const thread = await Thread.findById(threadId);
            if (!thread) {
                return res.status(404).json({ error: 'Thread not found' });
            }

            if (action === 'delete') {
                await Thread.deleteOne({ _id: threadId });
                moderation.status = 'deleted';
            } else if (action === 'hide') {
                thread.hidden = true;
                await thread.save();
                moderation.status = 'hidden';
            } else if (action === 'ban') {
                const user = await User.findById(thread.author);
                if (user) {
                    user.status = 'banned';
                    await user.save();
                    moderation.status = 'banned';
                }
            }
            await moderation.save();
        }

        res.status(201).json({ message: 'Vote recorded' });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Get moderation logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await Moderation.find()
            .populate('threadId', 'title')
            .populate('flags.userId', 'username')
            .populate('votes.userId', 'username')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching moderation logs:', error);
        res.status(500).json({ error: 'Failed to fetch moderation logs' });
    }
});

module.exports = router;