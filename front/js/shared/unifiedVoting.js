/**
 * Unified Voting System API
 * Central voting interface for all content types across the Nexus
 *
 * @version 1.0.0
 */

class UnifiedVotingSystem {
    constructor() {
        this.apiUrl = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';
        this.cache = new Map(); // Cache vote states
        this.listeners = new Set(); // Event listeners

        // Bind global event handler
        this.init();
    }

    init() {
        // Listen for vote events from AuthorIdentityCard components
        document.addEventListener('nexusVote', (e) => {
            this.notifyListeners(e.detail);
        });
    }

    /**
     * Submit vote for any content type
     * @param {string} contentType - 'blog', 'comment', 'echo', 'node'
     * @param {string} contentId - ID of the content
     * @param {string} action - 'upvote' or 'challenge'
     */
    async vote(contentType, contentId, action) {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            this.requireAuth();
            return null;
        }

        const cacheKey = `${contentType}:${contentId}`;

        try {
            // For now, use existing endpoints until backend is unified
            const response = await this.submitVoteToAPI(contentType, contentId, action, token);

            // Cache the result
            this.cache.set(cacheKey, response);

            // Notify all listeners
            this.notifyListeners({
                contentType,
                contentId,
                action,
                votes: response
            });

            return response;

        } catch (error) {
            console.error('[UnifiedVoting] Vote failed:', error);
            throw error;
        }
    }

    /**
     * Submit vote based on content type
     * Routes to appropriate endpoint until unified backend is ready
     */
    async submitVoteToAPI(contentType, contentId, action, token) {
        console.log(`[UnifiedVoting] submitVoteToAPI called with:`, { contentType, contentId, action });
        let endpoint, method = 'POST', body = {};

        switch (contentType) {
            case 'blog':
                // Use existing blog endpoints
                endpoint = `${this.apiUrl}/blogs/${contentId}/${action === 'upvote' ? 'like' : 'dislike'}`;
                break;

            case 'node':
                // Infinite Nexus nodes
                endpoint = `${this.apiUrl}/mindmap/nodes/${contentId}/vote`;
                body = { value: action === 'upvote' ? 1 : -1 };
                break;

            case 'comment':
                // New endpoint for comments
                endpoint = `${this.apiUrl}/comments/${contentId}/vote`;
                // Map 'challenge' to 'downvote' for API compatibility
                body = { action: action === 'challenge' ? 'downvote' : action };
                break;

            case 'echo':
                // Message board posts
                endpoint = `${this.apiUrl}/threads/${contentId}/vote`;
                // Map 'challenge' to 'downvote' for API compatibility
                const mappedAction = action === 'challenge' ? 'downvote' : action;
                body = { action: mappedAction };
                console.log(`[UnifiedVoting] Echo vote: ${action} → ${mappedAction}`, body);
                break;

            case 'chronicle':
                // Chronicles use consecrate/investigate endpoints
                if (action === 'upvote' || action === 'consecrate') {
                    endpoint = `${this.apiUrl}/chronicles/${contentId}/validate`;
                } else {
                    endpoint = `${this.apiUrl}/chronicles/${contentId}/challenge`;
                }
                break;

            default:
                // Future-proof: use unified endpoint pattern
                endpoint = `${this.apiUrl}/vote/${contentType}/${contentId}`;
                // Map 'challenge' to 'downvote' for API compatibility
                body = { action: action === 'challenge' ? 'downvote' : action };
        }

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Vote failed' }));
            throw new Error(error.error || 'Vote failed');
        }

        const data = await response.json();

        // Normalize response format
        return this.normalizeVoteResponse(data, contentType);
    }

    /**
     * Normalize different API response formats
     */
    normalizeVoteResponse(data, contentType) {
        let normalized = {
            upvotes: 0,
            challenges: 0,
            userUpvoted: false,
            userChallenged: false
        };

        switch (contentType) {
            case 'blog':
                // Blog uses likes/dislikes arrays
                normalized.upvotes = Array.isArray(data.likes) ? data.likes.length : (data.likes || 0);
                normalized.challenges = Array.isArray(data.dislikes) ? data.dislikes.length : (data.dislikes || 0);
                normalized.userUpvoted = data.userLiked || false;
                normalized.userChallenged = data.userDisliked || false;
                break;

            case 'node':
                // Nodes use credibility score
                if (data.credibility) {
                    const upvotes = data.credibility.votes?.filter(v => v.value === 1).length || 0;
                    const downvotes = data.credibility.votes?.filter(v => v.value === -1).length || 0;
                    normalized.upvotes = upvotes;
                    normalized.challenges = downvotes;
                    normalized.credibilityScore = data.credibility.score;
                }
                break;

            default:
                // Use standard format if available
                normalized.upvotes = data.upvotes || 0;
                normalized.challenges = data.challenges || data.downvotes || 0;
                normalized.userUpvoted = data.userUpvoted || false;
                normalized.userChallenged = data.userChallenged || data.userDownvoted || false;
        }

        // Calculate credibility tier
        normalized.credibilityTier = this.calculateCredibilityTier(
            normalized.upvotes,
            normalized.challenges
        );

        return normalized;
    }

    /**
     * Calculate credibility tier based on votes
     */
    calculateCredibilityTier(upvotes, challenges) {
        const netVotes = upvotes - challenges;
        const totalEngagement = upvotes + challenges;

        // Controversial: High engagement, roughly equal votes
        if (totalEngagement > 20 && Math.abs(upvotes - challenges) < 5) {
            return 'controversial';
        }

        // Elevated: Strong positive reception
        if (netVotes >= 10) {
            return 'elevated';
        }

        // Below: Significantly challenged
        if (netVotes <= -3) {
            return 'below';
        }

        // Neutral: Default state
        return 'neutral';
    }

    /**
     * Get cached vote state
     */
    getCachedVotes(contentType, contentId) {
        const cacheKey = `${contentType}:${contentId}`;
        return this.cache.get(cacheKey) || null;
    }

    /**
     * Register listener for vote updates
     */
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback); // Return unsubscribe function
    }

    /**
     * Notify all listeners of vote changes
     */
    notifyListeners(detail) {
        this.listeners.forEach(callback => {
            try {
                callback(detail);
            } catch (error) {
                console.error('[UnifiedVoting] Listener error:', error);
            }
        });
    }

    /**
     * Show authentication modal
     */
    requireAuth() {
        if (window.NEXUS && window.NEXUS.openSoulModal) {
            window.NEXUS.openSoulModal('login');
        } else {
            alert('Please log in to vote');
        }
    }

    /**
     * Batch fetch vote states for multiple items
     */
    async batchFetchVotes(items) {
        // Group by content type for efficient fetching
        const grouped = {};
        items.forEach(({ contentType, contentId }) => {
            if (!grouped[contentType]) grouped[contentType] = [];
            grouped[contentType].push(contentId);
        });

        const results = {};

        for (const [contentType, ids] of Object.entries(grouped)) {
            // Fetch vote states (implementation depends on backend support)
            // For now, return cached values
            ids.forEach(id => {
                const cached = this.getCachedVotes(contentType, id);
                if (cached) {
                    results[`${contentType}:${id}`] = cached;
                }
            });
        }

        return results;
    }

    /**
     * Get aggregate credibility for a user
     */
    async getUserCredibility(username) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${username}/credibility`);
            if (!response.ok) {
                throw new Error('Failed to fetch user credibility');
            }

            const data = await response.json();
            return {
                totalUpvotes: data.totalUpvotes || 0,
                totalChallenges: data.totalChallenges || 0,
                netCredibility: data.netCredibility || 0,
                contentCount: data.contentCount || 0,
                averageCredibility: data.averageCredibility || 0,
                tier: data.tier || 'neutral'
            };
        } catch (error) {
            console.error('[UnifiedVoting] Failed to fetch user credibility:', error);
            return null;
        }
    }

    /**
     * Handle special blog challenge types
     */
    async challengeBlog(blogId, type) {
        switch (type) {
            case 'quick':
                return this.vote('blog', blogId, 'challenge');

            case 'counterpoint':
                if (window.openCounterpoint) {
                    window.openCounterpoint(blogId);
                } else {
                    console.warn('[UnifiedVoting] Counterpoint system not available');
                }
                break;

            case 'debate':
                if (window.createFormalDebate) {
                    window.createFormalDebate(blogId);
                } else {
                    console.warn('[UnifiedVoting] Formal debate system not available');
                }
                break;
        }
    }
}

// Create global instance
window.unifiedVoting = new UnifiedVotingSystem();

// Expose to NEXUS global
if (!window.NEXUS) window.NEXUS = {};
window.NEXUS.voting = window.unifiedVoting;

// Helper function for easy voting
window.NEXUS.voteContent = async function(contentType, contentId, action) {
    return window.unifiedVoting.vote(contentType, contentId, action);
};

// Helper for challenge dropdown
window.NEXUS.challengeContent = function(contentType, contentId) {
    if (contentType === 'blog') {
        // Show challenge options
        const event = new CustomEvent('showChallengeOptions', {
            detail: { contentId }
        });
        document.dispatchEvent(event);
    } else {
        // Direct challenge
        return window.unifiedVoting.vote(contentType, contentId, 'challenge');
    }
};