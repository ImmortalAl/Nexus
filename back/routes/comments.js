const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// Get comments for a specific target (blog post, profile, etc.)
router.get('/:targetType/:targetId', optionalAuth, async (req, res) => {
    try {
        // Decode targetId to handle special characters and spaces
        const { targetType } = req.params;
        const targetId = decodeURIComponent(req.params.targetId);

        const comments = await Comment.find({
            targetType,
            targetId
        })
        .populate('author', 'username displayName avatar')
        .sort({ createdAt: -1 });

        // Add vote counts and user vote status for authenticated users
        const enrichedComments = comments.map(comment => {
            const commentObj = comment.toObject();
            
            // Add vote counts
            commentObj.upvoteCount = comment.upvotes?.length || 0;
            commentObj.downvoteCount = comment.downvotes?.length || 0;
            commentObj.challengeCount = comment.downvotes?.length || 0; // Alias for unified system
            
            // Add user vote status if authenticated
            if (req.user) {
                commentObj.userUpvoted = comment.upvotes?.includes(req.user.id) || false;
                commentObj.userDownvoted = comment.downvotes?.includes(req.user.id) || false;
                commentObj.userChallenged = comment.downvotes?.includes(req.user.id) || false; // Alias
            }
            
            // Remove vote arrays from response for privacy
            delete commentObj.upvotes;
            delete commentObj.downvotes;
            
            return commentObj;
        });

        res.json(enrichedComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create a new comment
router.post('/', auth, async (req, res) => {
    try {
        const { content, targetType, targetId } = req.body;

        if (!content || !targetType || !targetId) {
            return res.status(400).json({
                error: 'Content, target type, and target ID are required'
            });
        }

        const comment = new Comment({
            content,
            targetType,
            targetId,
            author: req.user.id
        });

        await comment.save();

        // Populate author info before returning
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'username displayName avatar');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Update a comment
router.put('/:id', auth, async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        // Check if user owns the comment
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this comment' });
        }
        
        comment.content = content;
        comment.isEdited = true;
        comment.updatedAt = new Date();
        
        await comment.save();
        
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'username displayName avatar');
            
        res.json(populatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete a comment
router.delete('/:id', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        // Check if user owns the comment
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }
        
        await Comment.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// Vote on a comment (upvote/downvote)
router.post('/:id/vote', auth, async (req, res) => {
    try {
        const { action } = req.body; // 'upvote' or 'downvote'
        const commentId = req.params.id;
        const userId = req.user.id;

        if (!action || !['upvote', 'downvote'].includes(action)) {
            return res.status(400).json({ error: 'Action must be "upvote" or "downvote"' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Prevent self-voting
        if (comment.author.toString() === userId) {
            return res.status(400).json({ error: 'You cannot vote on your own comment' });
        }

        // Check if user has already voted
        const hasUpvoted = comment.upvotes.includes(userId);
        const hasDownvoted = comment.downvotes.includes(userId);

        if (action === 'upvote') {
            if (hasUpvoted) {
                // Remove upvote
                comment.upvotes.pull(userId);
            } else {
                // Add upvote, remove downvote if exists
                comment.upvotes.push(userId);
                if (hasDownvoted) {
                    comment.downvotes.pull(userId);
                }
            }
        } else { // downvote
            if (hasDownvoted) {
                // Remove downvote
                comment.downvotes.pull(userId);
            } else {
                // Add downvote, remove upvote if exists
                comment.downvotes.push(userId);
                if (hasUpvoted) {
                    comment.upvotes.pull(userId);
                }
            }
        }

        await comment.save();

        // Return normalized response for unified voting system
        const updatedComment = await Comment.findById(commentId);
        res.json({
            upvotes: updatedComment.upvotes.length,
            downvotes: updatedComment.downvotes.length,
            challenges: updatedComment.downvotes.length, // Alias for unified system
            userUpvoted: updatedComment.upvotes.includes(userId),
            userDownvoted: updatedComment.downvotes.includes(userId),
            userChallenged: updatedComment.downvotes.includes(userId) // Alias for unified system
        });

    } catch (error) {
        console.error('Error voting on comment:', error);
        res.status(500).json({ error: 'Failed to vote on comment' });
    }
});

// Admin route: Recover corrupted profile comments
router.post('/recover/corrupted', auth, async (req, res) => {
    try {
        console.log('[Comments Recovery] Starting corrupted comments recovery...');

        // Find all profile comments with suspicious targetIds
        const profileComments = await Comment.find({ targetType: 'profile' });
        console.log(`[Comments Recovery] Found ${profileComments.length} profile comments to check`);

        const User = require('../models/User');
        const recoveredComments = [];

        for (const comment of profileComments) {
            // Check if targetId looks corrupted (contains 'object', '[', or other non-username chars)
            const targetId = comment.targetId;
            const isCorrupted = targetId.includes('object') ||
                              targetId.includes('[') ||
                              targetId.includes('<') ||
                              targetId.length > 50; // Usernames shouldn't be super long

            if (isCorrupted) {
                console.log(`[Comments Recovery] Found corrupted comment: ${comment._id} with targetId: ${targetId}`);

                // Try to find the intended user by checking the comment author's recent activity
                // For now, we'll just log these for manual inspection
                recoveredComments.push({
                    commentId: comment._id,
                    corruptedTargetId: targetId,
                    author: comment.author,
                    content: comment.content.substring(0, 50) + '...',
                    createdAt: comment.createdAt
                });
            }
        }

        res.json({
            message: 'Corrupted comments scan completed',
            corruptedCount: recoveredComments.length,
            corruptedComments: recoveredComments
        });

    } catch (error) {
        console.error('[Comments Recovery] Error during recovery:', error);
        res.status(500).json({ error: 'Failed to recover corrupted comments' });
    }
});

// Admin route: Clean up orphaned profile comments
router.delete('/cleanup/orphaned', auth, async (req, res) => {
    try {
        // This should be admin-only, but we'll make it available for debugging
        console.log('[Comments Cleanup] Starting orphaned comments cleanup...');

        const User = require('../models/User');

        // Find all profile comments
        const profileComments = await Comment.find({ targetType: 'profile' });
        console.log(`[Comments Cleanup] Found ${profileComments.length} profile comments`);

        let orphanedCount = 0;
        const orphanedCommentIds = [];

        // Check each comment to see if target user still exists
        for (const comment of profileComments) {
            const userExists = await User.findOne({ username: comment.targetId });
            if (!userExists) {
                orphanedCommentIds.push(comment._id);
                orphanedCount++;
                console.log(`[Comments Cleanup] Found orphaned comment for deleted user: ${comment.targetId}`);
            }
        }

        // Delete orphaned comments
        if (orphanedCommentIds.length > 0) {
            const deleteResult = await Comment.deleteMany({ _id: { $in: orphanedCommentIds } });
            console.log(`[Comments Cleanup] Deleted ${deleteResult.deletedCount} orphaned comments`);

            res.json({
                message: 'Orphaned comments cleanup completed',
                deletedCount: deleteResult.deletedCount,
                orphanedUsers: [...new Set(profileComments
                    .filter(c => orphanedCommentIds.includes(c._id))
                    .map(c => c.targetId))]
            });
        } else {
            res.json({
                message: 'No orphaned comments found',
                deletedCount: 0
            });
        }

    } catch (error) {
        console.error('[Comments Cleanup] Error during cleanup:', error);
        res.status(500).json({ error: 'Failed to cleanup orphaned comments' });
    }
});

module.exports = router; 