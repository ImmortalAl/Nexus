const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const Link = require('../models/Link');

// Valid categories
const VALID_CATEGORIES = ['knowledge', 'philosophy', 'technology', 'creative', 'community', 'reading'];

// @route   GET /api/links
// @desc    Get all approved links
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category } = req.query;

        const query = { status: 'approved' };
        if (category && VALID_CATEGORIES.includes(category)) {
            query.category = category;
        }

        const links = await Link.find(query)
            .populate('submittedBy', 'username displayName')
            .sort({ approvedAt: -1 })
            .limit(200);

        res.json({ links });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// @route   GET /api/links/pending
// @desc    Get pending links awaiting approval
// @access  Private
router.get('/pending', auth, async (req, res) => {
    try {
        const links = await Link.find({ status: 'pending' })
            .populate('submittedBy', 'username displayName')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ links });
    } catch (error) {
        console.error('Error fetching pending links:', error);
        res.status(500).json({ error: 'Failed to fetch pending links' });
    }
});

// @route   POST /api/links
// @desc    Submit a new link
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { url, title, description, category } = req.body;

        // Validation
        if (!url || !title || !description || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Check for duplicate URL
        const existingLink = await Link.findOne({ url: url.trim() });
        if (existingLink) {
            if (existingLink.status === 'approved') {
                return res.status(400).json({ error: 'This link already exists' });
            } else if (existingLink.status === 'pending') {
                return res.status(400).json({ error: 'This link is already pending approval' });
            }
            // If removed, allow resubmission
        }

        const link = new Link({
            url: url.trim(),
            title: title.trim().substring(0, 100),
            description: description.trim().substring(0, 200),
            category,
            submittedBy: req.user._id,
            approvalVotes: [req.user._id] // Submitter auto-approves
        });

        await link.save();

        res.status(201).json({
            success: true,
            message: 'Link submitted successfully. It needs 2 more approvals to go live.',
            link
        });
    } catch (error) {
        console.error('Error submitting link:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'This link already exists' });
        }
        res.status(500).json({ error: 'Failed to submit link' });
    }
});

// @route   POST /api/links/:id/approve
// @desc    Vote to approve a pending link
// @access  Private
router.post('/:id/approve', auth, async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        if (link.status !== 'pending') {
            return res.status(400).json({ error: 'Link is not pending approval' });
        }

        // Check if user already voted
        if (link.approvalVotes.includes(req.user._id)) {
            return res.status(400).json({ error: 'You have already approved this link' });
        }

        link.approvalVotes.push(req.user._id);

        // Check if link has enough approvals (3 votes)
        if (link.approvalVotes.length >= 3) {
            link.status = 'approved';
            link.approvedAt = new Date();
        }

        await link.save();

        res.json({
            success: true,
            approved: link.status === 'approved',
            votesNeeded: Math.max(0, 3 - link.approvalVotes.length),
            message: link.status === 'approved'
                ? 'Link approved and is now live!'
                : `Vote recorded. ${3 - link.approvalVotes.length} more needed.`
        });
    } catch (error) {
        console.error('Error approving link:', error);
        res.status(500).json({ error: 'Failed to approve link' });
    }
});

// @route   POST /api/links/:id/flag
// @desc    Flag a link for removal
// @access  Private
router.post('/:id/flag', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        const link = await Link.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Check if user already flagged
        const alreadyFlagged = link.removalFlags.some(
            flag => flag.user.toString() === req.user._id.toString()
        );

        if (alreadyFlagged) {
            return res.status(400).json({ error: 'You have already flagged this link' });
        }

        link.removalFlags.push({
            user: req.user._id,
            reason: reason || 'No reason provided'
        });

        // Auto-remove if 5+ flags
        if (link.removalFlags.length >= 5) {
            link.status = 'removed';
            link.removedAt = new Date();
            link.removedReason = 'Community flagged for removal';
        }

        await link.save();

        res.json({
            success: true,
            removed: link.status === 'removed',
            message: link.status === 'removed'
                ? 'Link has been removed due to community flags.'
                : 'Flag recorded. Thank you for helping moderate.'
        });
    } catch (error) {
        console.error('Error flagging link:', error);
        res.status(500).json({ error: 'Failed to flag link' });
    }
});

// @route   DELETE /api/links/:id
// @desc    Remove a link (admin only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const link = await Link.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        link.status = 'removed';
        link.removedAt = new Date();
        link.removedReason = req.body.reason || 'Removed by admin';

        await link.save();

        res.json({
            success: true,
            message: 'Link removed successfully'
        });
    } catch (error) {
        console.error('Error removing link:', error);
        res.status(500).json({ error: 'Failed to remove link' });
    }
});

// @route   GET /api/links/stats
// @desc    Get link statistics
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const stats = await Link.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const totalApproved = await Link.countDocuments({ status: 'approved' });
        const totalPending = await Link.countDocuments({ status: 'pending' });

        res.json({
            total: totalApproved,
            pending: totalPending,
            byCategory: stats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error fetching link stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
