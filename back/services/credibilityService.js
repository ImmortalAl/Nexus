/**
 * Credibility Service
 * Aggregates and manages user credibility scores across all content types
 * Part of the Immortal Nexus Avatar-Voting Integration System
 */

const User = require('../models/User');
const Blog = require('../models/Blog');
const Thread = require('../models/Thread');
const Comment = require('../models/Comment');
const MindmapNode = require('../models/MindmapNode');
const Chronicle = require('../models/Chronicle');

class CredibilityService {
    /**
     * Calculate and update a user's aggregate credibility
     * @param {String} userId - User ID to calculate credibility for
     * @returns {Object} Updated credibility data
     */
    static async calculateUserCredibility(userId) {
        try {
            // Initialize counters
            let breakdown = {
                blogs: { upvotes: 0, downvotes: 0 },
                comments: { upvotes: 0, downvotes: 0 },
                threads: { upvotes: 0, downvotes: 0 },
                nodes: { upvotes: 0, downvotes: 0 },
                chronicles: { upvotes: 0, downvotes: 0 }
            };

            // 1. Aggregate Blog votes
            const userBlogs = await Blog.find({ author: userId });
            for (const blog of userBlogs) {
                breakdown.blogs.upvotes += (blog.likes || []).length;
                breakdown.blogs.downvotes += (blog.dislikes || []).length;
            }

            // 2. Aggregate Comment votes
            const userComments = await Comment.find({ author: userId });
            for (const comment of userComments) {
                // Comments may have upvotes/downvotes arrays or counts
                if (comment.upvotes) {
                    breakdown.comments.upvotes += Array.isArray(comment.upvotes)
                        ? comment.upvotes.length
                        : comment.upvotes;
                }
                if (comment.downvotes) {
                    breakdown.comments.downvotes += Array.isArray(comment.downvotes)
                        ? comment.downvotes.length
                        : comment.downvotes;
                }
            }

            // 3. Aggregate Thread votes (main threads)
            const userThreads = await Thread.find({ author: userId });
            for (const thread of userThreads) {
                if (thread.votes) {
                    breakdown.threads.upvotes += (thread.votes.upvotes || []).length;
                    breakdown.threads.downvotes += (thread.votes.downvotes || []).length;
                }
            }

            // 4. Aggregate Thread Reply votes
            const threadsWithReplies = await Thread.find({ 'replies.author': userId });
            for (const thread of threadsWithReplies) {
                const userReplies = thread.replies.filter(r => r.author.toString() === userId);
                for (const reply of userReplies) {
                    if (reply.votes) {
                        breakdown.threads.upvotes += (reply.votes.upvotes || []).length;
                        breakdown.threads.downvotes += (reply.votes.downvotes || []).length;
                    }
                }
            }

            // 5. Aggregate Mindmap Node votes
            const userNodes = await MindmapNode.find({ creator: userId });
            for (const node of userNodes) {
                if (node.credibility && node.credibility.votes) {
                    const upvotes = node.credibility.votes.filter(v => v.value === 1).length;
                    const downvotes = node.credibility.votes.filter(v => v.value === -1).length;
                    breakdown.nodes.upvotes += upvotes;
                    breakdown.nodes.downvotes += downvotes;
                }
            }

            // 6. Aggregate Chronicle votes (validations/challenges)
            const userChronicles = await Chronicle.find({ author: userId });
            for (const chronicle of userChronicles) {
                breakdown.chronicles.upvotes += (chronicle.validations || []).length;
                breakdown.chronicles.downvotes += (chronicle.challenges || []).length;
            }

            // Calculate totals
            let totalUpvotes = 0;
            let totalDownvotes = 0;

            for (const contentType of Object.values(breakdown)) {
                totalUpvotes += contentType.upvotes;
                totalDownvotes += contentType.downvotes;
            }

            const netScore = totalUpvotes - totalDownvotes;
            const tier = this.calculateTier(netScore);

            // Update user document
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    credibility: {
                        totalUpvotes,
                        totalDownvotes,
                        netScore,
                        tier,
                        breakdown,
                        lastUpdated: new Date()
                    }
                },
                { new: true }
            );

            return updatedUser.credibility;

        } catch (error) {
            console.error('[CredibilityService] Error calculating user credibility:', error);
            throw error;
        }
    }

    /**
     * Calculate credibility tier based on net score
     * @param {Number} netScore - Net vote score (upvotes - downvotes)
     * @returns {String} Tier: 'elevated', 'neutral', or 'below'
     */
    static calculateTier(netScore) {
        if (netScore > 1) return 'elevated';
        if (netScore < 0) return 'below';  // Changed from < 1 to < 0 for clearer neutral zone
        return 'neutral';
    }

    /**
     * Update user credibility (lightweight version for vote events)
     * @param {String} userId - User ID to update
     * @param {String} contentType - Type of content voted on
     * @param {String} voteType - 'upvote' or 'downvote'
     * @param {Number} delta - Change in votes (1 for new vote, -1 for unvote)
     */
    static async updateUserCredibility(userId, contentType, voteType, delta = 1) {
        try {
            const user = await User.findById(userId);
            if (!user) return null;

            // Initialize credibility if needed
            if (!user.credibility) {
                return await this.calculateUserCredibility(userId);
            }

            // Map content types to breakdown keys
            const contentTypeMap = {
                'blog': 'blogs',
                'comment': 'comments',
                'thread': 'threads',
                'echo': 'threads',
                'reply': 'threads',
                'node': 'nodes',
                'chronicle': 'chronicles',
                'news': 'chronicles'
            };

            const breakdownKey = contentTypeMap[contentType];
            if (!breakdownKey) {
                console.warn(`[CredibilityService] Unknown content type: ${contentType}`);
                return await this.calculateUserCredibility(userId);
            }

            // Update breakdown
            const voteKey = voteType === 'upvote' ? 'upvotes' : 'downvotes';
            user.credibility.breakdown[breakdownKey][voteKey] += delta;

            // Update totals
            if (voteType === 'upvote') {
                user.credibility.totalUpvotes += delta;
            } else {
                user.credibility.totalDownvotes += delta;
            }

            // Recalculate net score and tier
            user.credibility.netScore = user.credibility.totalUpvotes - user.credibility.totalDownvotes;
            user.credibility.tier = this.calculateTier(user.credibility.netScore);
            user.credibility.lastUpdated = new Date();

            await user.save();
            return user.credibility;

        } catch (error) {
            console.error('[CredibilityService] Error updating user credibility:', error);
            // Fallback to full recalculation
            return await this.calculateUserCredibility(userId);
        }
    }

    /**
     * Get user credibility by username
     * @param {String} username - Username to look up
     * @returns {Object} User credibility data
     */
    static async getUserCredibilityByUsername(username) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('User not found');
            }

            // If credibility hasn't been calculated yet, calculate it
            if (!user.credibility || !user.credibility.lastUpdated) {
                return await this.calculateUserCredibility(user._id);
            }

            // If credibility is stale (>24 hours old), recalculate
            const hoursSinceUpdate = (Date.now() - new Date(user.credibility.lastUpdated)) / (1000 * 60 * 60);
            if (hoursSinceUpdate > 24) {
                return await this.calculateUserCredibility(user._id);
            }

            return user.credibility;

        } catch (error) {
            console.error('[CredibilityService] Error getting user credibility:', error);
            throw error;
        }
    }

    /**
     * Batch update credibility for multiple users
     * Used for periodic recalculation or migration
     * @param {Array<String>} userIds - Array of user IDs to update
     */
    static async batchUpdateCredibility(userIds = null) {
        try {
            // If no userIds provided, update all users
            if (!userIds) {
                const users = await User.find({}).select('_id');
                userIds = users.map(u => u._id);
            }

            const results = {
                successful: 0,
                failed: 0,
                errors: []
            };

            // Process in batches to avoid overwhelming the system
            const batchSize = 10;
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);

                await Promise.all(batch.map(async (userId) => {
                    try {
                        await this.calculateUserCredibility(userId);
                        results.successful++;
                    } catch (error) {
                        results.failed++;
                        results.errors.push({ userId, error: error.message });
                    }
                }));

                // Log progress
                console.log(`[CredibilityService] Batch update progress: ${i + batch.length}/${userIds.length}`);
            }

            console.log(`[CredibilityService] Batch update complete:`, results);
            return results;

        } catch (error) {
            console.error('[CredibilityService] Error in batch update:', error);
            throw error;
        }
    }
}

module.exports = CredibilityService;