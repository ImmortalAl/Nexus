const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const auth = require('../middleware/auth');

// Get thread statistics for admin dashboard
router.get('/stats', auth, async (req, res) => {
    try {
        // Check if user is admin (basic check - should be enhanced)
        if (req.user.username !== 'ImmortalAl' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const totalThreads = await Thread.countDocuments();
        const totalReplies = await Thread.aggregate([
            { $project: { replyCount: { $size: "$replies" } } },
            { $group: { _id: null, total: { $sum: "$replyCount" } } }
        ]);

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const todayThreads = await Thread.countDocuments({ createdAt: { $gte: startOfDay } });
        const todayReplies = await Thread.aggregate([
            { $match: { "replies.createdAt": { $gte: startOfDay } } },
            { $project: { todayReplies: {
                $size: {
                    $filter: {
                        input: "$replies",
                        cond: { $gte: ["$$this.createdAt", startOfDay] }
                    }
                }
            }}},
            { $group: { _id: null, total: { $sum: "$todayReplies" } } }
        ]);

        const recentThreads = await Thread.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('author', 'username displayName')
            .select('title author createdAt category');

        res.json({
            totalThreads,
            totalReplies: totalReplies[0]?.total || 0,
            todayThreads,
            todayReplies: todayReplies[0]?.total || 0,
            contentRate: ((todayThreads + (todayReplies[0]?.total || 0))).toFixed(1),
            recentThreads
        });
    } catch (error) {
        console.error('Error fetching thread stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Create a new thread
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, category, tags, isAnonymous } = req.body;
        
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        // Generate anonymous display name if posting anonymously
        let anonymousDisplayName = null;
        if (isAnonymous) {
            anonymousDisplayName = generateAnonymousName();
        }

        const thread = new Thread({
            title,
            content,
            category,
            tags: tags || [],
            author: req.user.id,
            isAnonymous: !!isAnonymous,
            anonymousDisplayName,
            createdAt: new Date(),
            updatedAt: new Date(),
            replies: [],
            isLocked: false
        });
        await thread.save();

        res.status(201).json(thread);
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({
            error: 'Failed to create thread',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to generate anonymous display names
function generateAnonymousName() {
    const adjectives = [
        'Eternal', 'Mystic', 'Ancient', 'Wise', 'Noble', 'Silent', 'Hidden',
        'Timeless', 'Immortal', 'Celestial', 'Profound', 'Sacred', 'Enigmatic'
    ];
    
    const nouns = [
        'Seeker', 'Scholar', 'Wanderer', 'Guardian', 'Sage', 'Observer',
        'Keeper', 'Whisper', 'Soul', 'Spirit', 'Flame', 'Shadow', 'Star'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective} ${noun}`;
}

// Get all threads
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, q } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } }
            ];
        }
        
        const threads = await Thread.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('author', 'username displayName avatar');

        // Process threads to handle anonymous display and vote data
        const processedThreads = threads.map(thread => {
            const threadObj = thread.toObject();
            if (threadObj.isAnonymous) {
                threadObj.author = {
                    username: threadObj.anonymousDisplayName || 'Anonymous Seeker',
                    displayName: threadObj.anonymousDisplayName || 'Anonymous Seeker',
                    avatar: null,
                    isAnonymous: true
                };
            }

            // Transform votes from nested structure to flat arrays of user IDs
            // Backend stores: thread.votes.upvotes = [{user, createdAt}]
            // Frontend expects: thread.upvotes = [userId1, userId2, ...]
            if (threadObj.votes) {
                threadObj.upvotes = (threadObj.votes.upvotes || []).map(v => v.user.toString());
                threadObj.downvotes = (threadObj.votes.downvotes || []).map(v => v.user.toString());
            } else {
                threadObj.upvotes = [];
                threadObj.downvotes = [];
            }

            return threadObj;
        });
        const total = await Thread.countDocuments(query);
        
        res.json({
            threads: processedThreads,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
});

// Get a single thread by ID
router.get('/:id', async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid thread ID format' });
        }

        const thread = await Thread.findById(req.params.id)
            .populate('author', 'username displayName avatar signature')
            .populate('replies.author', 'username displayName avatar signature');

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        // Process thread to handle anonymous display
        const threadObj = thread.toObject();
        
        // Handle anonymous thread author
        if (threadObj.isAnonymous) {
            threadObj.author = {
                username: threadObj.anonymousDisplayName || 'Anonymous Seeker',
                displayName: threadObj.anonymousDisplayName || 'Anonymous Seeker',
                avatar: null,
                signature: null,
                isAnonymous: true
            };
        }

        // Handle anonymous replies and transform vote data
        if (threadObj.replies) {
            threadObj.replies = threadObj.replies.map(reply => {
                if (reply.isAnonymous) {
                    reply.author = {
                        username: reply.anonymousDisplayName || 'Anonymous Seeker',
                        displayName: reply.anonymousDisplayName || 'Anonymous Seeker',
                        avatar: null,
                        signature: null,
                        isAnonymous: true
                    };
                }

                // Transform reply votes from nested structure to flat arrays
                if (reply.votes) {
                    reply.upvotes = (reply.votes.upvotes || []).map(v => v.user.toString());
                    reply.downvotes = (reply.votes.downvotes || []).map(v => v.user.toString());
                } else {
                    reply.upvotes = [];
                    reply.downvotes = [];
                }

                return reply;
            });
        }

        // Transform thread votes from nested structure to flat arrays
        if (threadObj.votes) {
            threadObj.upvotes = (threadObj.votes.upvotes || []).map(v => v.user.toString());
            threadObj.downvotes = (threadObj.votes.downvotes || []).map(v => v.user.toString());
        } else {
            threadObj.upvotes = [];
            threadObj.downvotes = [];
        }

        res.json(threadObj);
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ error: 'Failed to fetch thread', details: error.message });
    }
});

// Add a reply to a thread
router.post('/:id/replies', auth, async (req, res) => {
    try {
        const { content, isAnonymous } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Reply content is required' });
        }

        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        if (thread.isLocked) {
            return res.status(403).json({ error: 'Thread is locked' });
        }

        // Generate anonymous display name if replying anonymously
        let anonymousDisplayName = null;
        if (isAnonymous) {
            anonymousDisplayName = generateAnonymousName();
        }

        const reply = {
            content,
            author: req.user.id,
            isAnonymous: !!isAnonymous,
            anonymousDisplayName,
            createdAt: new Date()
        };

        thread.replies.push(reply);
        thread.updatedAt = new Date();
        await thread.save();

        res.status(201).json({ message: 'Reply added successfully', reply });
    } catch (error) {
        console.error('Error adding reply to thread:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

// Vote on a thread
router.post('/:id/vote', auth, async (req, res) => {
    try {
        const { vote } = req.body; // 'upvote' or 'downvote'
        const userId = req.user.id;
        const threadId = req.params.id;

        if (!vote || !['upvote', 'downvote'].includes(vote)) {
            return res.status(400).json({ error: 'Vote must be "upvote" or "downvote"' });
        }

        const thread = await Thread.findById(threadId);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        // Prevent self-voting (users can't vote on their own threads)
        if (thread.author && thread.author.toString() === userId) {
            return res.status(403).json({ error: 'You cannot vote on your own threads' });
        }

        // Initialize votes structure if it doesn't exist
        if (!thread.votes) {
            thread.votes = { upvotes: [], downvotes: [] };
        }
        if (!thread.votes.upvotes) thread.votes.upvotes = [];
        if (!thread.votes.downvotes) thread.votes.downvotes = [];

        // Check if user has already voted
        const existingUpvote = thread.votes.upvotes.find(v => v.user.toString() === userId);
        const existingDownvote = thread.votes.downvotes.find(v => v.user.toString() === userId);

        if (vote === 'upvote') {
            if (existingUpvote) {
                // Remove upvote (toggle off)
                thread.votes.upvotes = thread.votes.upvotes.filter(v => v.user.toString() !== userId);
            } else {
                // Remove any existing downvote first
                if (existingDownvote) {
                    thread.votes.downvotes = thread.votes.downvotes.filter(v => v.user.toString() !== userId);
                }
                // Add upvote
                thread.votes.upvotes.push({ user: userId, createdAt: new Date() });
            }
        } else { // downvote
            if (existingDownvote) {
                // Remove downvote (toggle off)
                thread.votes.downvotes = thread.votes.downvotes.filter(v => v.user.toString() !== userId);
            } else {
                // Remove any existing upvote first
                if (existingUpvote) {
                    thread.votes.upvotes = thread.votes.upvotes.filter(v => v.user.toString() !== userId);
                }
                // Add downvote
                thread.votes.downvotes.push({ user: userId, createdAt: new Date() });
            }
        }

        // Calculate new vote score
        const newScore = thread.votes.upvotes.length - thread.votes.downvotes.length;
        thread.voteScore = newScore;

        await thread.save();

        // Check current user's vote status after save
        const userUpvoted = thread.votes.upvotes.some(v => v.user.toString() === userId);
        const userDownvoted = thread.votes.downvotes.some(v => v.user.toString() === userId);

        // Return format compatible with unified voting system
        res.json({
            message: 'Vote recorded',
            upvotes: thread.votes.upvotes.length,
            challenges: thread.votes.downvotes.length,
            downvotes: thread.votes.downvotes.length,
            userUpvoted: userUpvoted,
            userChallenged: userDownvoted,
            userDownvoted: userDownvoted,
            newScore: newScore
        });
    } catch (error) {
        console.error('Error voting on thread:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Edit a reply
router.put('/:threadId/replies/:replyId', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const { threadId, replyId } = req.params;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Reply content is required' });
        }

        const thread = await Thread.findById(threadId);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        // Find the reply to edit
        const replyIndex = thread.replies.findIndex(reply => reply._id.toString() === replyId);
        if (replyIndex === -1) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        const reply = thread.replies[replyIndex];

        // Check if user is the author
        if (reply.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to edit this reply' });
        }

        // Check if reply is anonymous (cannot edit anonymous replies)
        if (reply.isAnonymous) {
            return res.status(403).json({ error: 'Anonymous replies cannot be edited' });
        }

        // Check if there are any replies after this one (prevent editing if others have replied)
        const hasSubsequentReplies = thread.replies.slice(replyIndex + 1).length > 0;
        if (hasSubsequentReplies) {
            return res.status(403).json({ error: 'Cannot edit reply: other users have already responded' });
        }

        // Store original content in edit history
        if (!reply.editHistory) {
            reply.editHistory = [];
        }
        
        reply.editHistory.push({
            editedAt: new Date(),
            originalContent: reply.content
        });

        // Update the reply
        reply.content = content.trim();
        reply.editedAt = new Date();
        thread.updatedAt = new Date();

        await thread.save();

        res.json({
            message: 'Reply updated successfully',
            reply: {
                _id: reply._id,
                content: reply.content,
                editedAt: reply.editedAt,
                editHistory: reply.editHistory
            }
        });

    } catch (error) {
        console.error('Error editing reply:', error);
        res.status(500).json({ error: 'Failed to edit reply' });
    }
});

// Vote on a reply
router.post('/:threadId/replies/:replyId/vote', auth, async (req, res) => {
    try {
        const { vote } = req.body; // 'upvote' or 'downvote'
        const userId = req.user.id;
        const { threadId, replyId } = req.params;

        if (!vote || !['upvote', 'downvote'].includes(vote)) {
            return res.status(400).json({ error: 'Vote must be "upvote" or "downvote"' });
        }

        const thread = await Thread.findById(threadId);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const reply = thread.replies.id(replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        // Prevent self-voting (users can't vote on their own replies)
        if (reply.author && reply.author.toString() === userId) {
            return res.status(403).json({ error: 'You cannot vote on your own replies' });
        }

        // Initialize votes structure if it doesn't exist
        if (!reply.votes) {
            reply.votes = { upvotes: [], downvotes: [] };
        }
        if (!reply.votes.upvotes) reply.votes.upvotes = [];
        if (!reply.votes.downvotes) reply.votes.downvotes = [];

        // Check if user has already voted on this reply
        const existingUpvote = reply.votes.upvotes.find(v => v.user.toString() === userId);
        const existingDownvote = reply.votes.downvotes.find(v => v.user.toString() === userId);

        if (vote === 'upvote') {
            if (existingUpvote) {
                // Remove upvote (toggle off)
                reply.votes.upvotes = reply.votes.upvotes.filter(v => v.user.toString() !== userId);
            } else {
                // Remove any existing downvote first
                if (existingDownvote) {
                    reply.votes.downvotes = reply.votes.downvotes.filter(v => v.user.toString() !== userId);
                }
                // Add upvote
                reply.votes.upvotes.push({ user: userId, createdAt: new Date() });
            }
        } else { // downvote
            if (existingDownvote) {
                // Remove downvote (toggle off)
                reply.votes.downvotes = reply.votes.downvotes.filter(v => v.user.toString() !== userId);
            } else {
                // Remove any existing upvote first
                if (existingUpvote) {
                    reply.votes.upvotes = reply.votes.upvotes.filter(v => v.user.toString() !== userId);
                }
                // Add downvote
                reply.votes.downvotes.push({ user: userId, createdAt: new Date() });
            }
        }

        // Calculate new vote score
        const newScore = reply.votes.upvotes.length - reply.votes.downvotes.length;
        reply.voteScore = newScore;

        await thread.save();

        res.json({
            message: 'Vote recorded',
            newScore,
            upvotes: reply.votes.upvotes.length,
            challenges: reply.votes.downvotes.length,
            downvotes: reply.votes.downvotes.length,
            userUpvoted: !!reply.votes.upvotes.find(v => v.user.toString() === userId),
            userChallenged: !!reply.votes.downvotes.find(v => v.user.toString() === userId),
            userDownvoted: !!reply.votes.downvotes.find(v => v.user.toString() === userId)
        });
    } catch (error) {
        console.error('Error voting on reply:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Delete a reply
router.delete('/:threadId/replies/:replyId', auth, async (req, res) => {
    try {
        const { threadId, replyId } = req.params;

        // Find the thread
        const thread = await Thread.findById(threadId);

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        // Find the reply
        const replyIndex = thread.replies.findIndex(r => r._id.toString() === replyId);

        if (replyIndex === -1) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        const reply = thread.replies[replyIndex];

        // Check if user is the author or has admin privileges
        const isAuthor = reply.author && reply.author.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ error: 'You can only delete your own replies' });
        }

        // Remove the reply from the thread
        thread.replies.splice(replyIndex, 1);

        // Update reply count
        thread.replyCount = thread.replies.length;

        // Save the thread
        await thread.save();

        res.json({
            message: 'Reply deleted successfully',
            thread: thread
        });

    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ error: 'Failed to delete reply' });
    }
});

// Update a thread
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const thread = await Thread.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        // Ensure the user is the author
        if (thread.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to edit this thread' });
        }

        // Update fields
        thread.title = title || thread.title;
        thread.content = content || thread.content;
        thread.category = category || thread.category;
        thread.tags = tags || thread.tags;
        thread.updatedAt = Date.now();

        await thread.save();

        const updatedThread = await Thread.findById(thread._id)
            .populate('author', 'username displayName avatar');

        res.json(updatedThread);
    } catch (error) {
        console.error('Error updating thread:', error);
        res.status(500).json({ error: 'Failed to update thread' });
    }
});

// Delete a thread
router.delete('/:id', auth, async (req, res) => {
    try {
        const threadId = req.params.id;

        // Find the thread
        const thread = await Thread.findById(threadId);

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        // Check if user is the author or has admin privileges
        const isAuthor = thread.author && thread.author.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ error: 'You can only delete your own threads' });
        }

        // Delete the thread
        await Thread.findByIdAndDelete(threadId);

        res.json({
            message: 'Thread deleted successfully',
            threadId: threadId
        });

    } catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ error: 'Failed to delete thread' });
    }
});

module.exports = router;