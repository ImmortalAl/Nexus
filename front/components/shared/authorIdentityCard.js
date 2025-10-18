/**
 * AuthorIdentityCard - Universal Identity & Voting Component
 * The immortal foundation for all content attribution across the Nexus
 *
 * @version 1.0.0
 * @author Immortal Nexus
 */

class AuthorIdentityCard {
    constructor(options = {}) {
        // Core properties
        this.author = options.author || {};
        this.contentType = options.contentType; // 'blog', 'comment', 'echo', 'node', 'reply'
        this.contentId = options.contentId;
        this.parentId = options.parentId; // For nested content (e.g., threadId for replies)
        this.timestamp = options.timestamp || new Date();

        // Voting data
        this.votes = {
            upvotes: options.upvotes || 0,
            challenges: options.challenges || 0,
            userUpvoted: options.userUpvoted || false,
            userChallenged: options.userChallenged || false
        };

        // Display options
        this.size = options.size || 'md'; // 'sm', 'md', 'lg'
        this.variant = options.variant || 'card'; // 'card', 'header', 'inline', 'minimal'
        this.showVoting = options.showVoting !== false;
        this.showTimestamp = options.showTimestamp !== false;
        this.showCredibility = options.showCredibility !== false;
        this.enableChallenge = options.enableChallenge !== false;
        this.simpleDownvote = options.simpleDownvote || false; // Use simple downvote instead of 3-tier challenge

        // Custom labels for voting buttons (allows section-specific terminology)
        this.customLabels = options.customLabels || {
            upvote: 'Upvote',
            upvoteIcon: 'fa-chevron-up',
            challenge: 'Challenge',
            challengeIcon: 'fa-bolt'
        };

        // Credibility data (if available)
        this.authorCredibility = options.authorCredibility || null;

        // Initialize
        this.element = null;
        this.init();
    }

    init() {
        // Check for required dependencies
        if (!window.NexusAvatars && window.ImmortalNexusAvatars) {
            window.NexusAvatars = window.ImmortalNexusAvatars;
        }

        if (!window.NexusAvatars) {
            console.warn('[AuthorIdentityCard] Avatar system not loaded, using fallback');
        }
    }

    /**
     * Calculate content credibility tier based on votes
     */
    getCredibilityTier() {
        const netVotes = this.votes.upvotes - this.votes.challenges;
        const totalEngagement = this.votes.upvotes + this.votes.challenges;

        // Controversial: High engagement, roughly equal votes
        if (totalEngagement > 20 && Math.abs(this.votes.upvotes - this.votes.challenges) < 5) {
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
     * Render the component and return DOM element
     */
    render() {
        const container = document.createElement('div');
        container.className = `author-identity-card author-identity--${this.variant} author-identity--${this.size}`;
        container.setAttribute('data-content-type', this.contentType);
        container.setAttribute('data-content-id', this.contentId);

        // Apply credibility tier styling to container
        const tier = this.getCredibilityTier();
        container.classList.add(`content-credibility-${tier}`);

        // Build component structure based on variant
        switch (this.variant) {
            case 'header':
                this.renderHeaderVariant(container);
                break;
            case 'inline':
                this.renderInlineVariant(container);
                break;
            case 'minimal':
                this.renderMinimalVariant(container);
                break;
            default:
                this.renderCardVariant(container);
        }

        this.element = container;
        return container;
    }

    /**
     * Header variant - for modal headers and prominent displays
     */
    renderHeaderVariant(container) {
        // Create grid layout: votes | author | actions
        container.innerHTML = `
            <div class="identity-header-grid">
                ${this.showVoting ? this.createVoteSection() : ''}
                <div class="identity-author-section">
                    ${this.createAuthorDisplay()}
                </div>
                <div class="identity-actions-section">
                    <!-- Space for additional actions -->
                </div>
            </div>
        `;

        // Attach event handlers after DOM creation
        if (this.showVoting) {
            this.attachVoteHandlers(container);
        }
    }

    /**
     * Card variant - for content cards and list items
     */
    renderCardVariant(container) {
        container.innerHTML = `
            <div class="identity-card-layout">
                <div class="identity-author-row">
                    ${this.createAuthorDisplay()}
                </div>
                ${this.showVoting ? `
                    <div class="identity-vote-row">
                        ${this.createVoteSection()}
                    </div>
                ` : ''}
            </div>
        `;

        if (this.showVoting) {
            this.attachVoteHandlers(container);
        }
    }

    /**
     * Inline variant - for comments and compact displays
     */
    renderInlineVariant(container) {
        container.innerHTML = `
            <div class="identity-inline-layout">
                ${this.createAuthorDisplay()}
                ${this.showVoting ? this.createCompactVotes() : ''}
            </div>
        `;

        if (this.showVoting) {
            this.attachVoteHandlers(container);
        }
    }

    /**
     * Minimal variant - author only, no voting
     */
    renderMinimalVariant(container) {
        container.innerHTML = this.createAuthorDisplay();
    }

    /**
     * Create author display with avatar
     */
    createAuthorDisplay() {
        const displayName = this.author.displayName || this.author.username || 'Anonymous Soul';
        const username = this.author.username || 'anonymous';
        const profileUrl = `/souls/${username}.html`;

        // Create avatar using the universal system if available
        let avatarHtml = '';
        if (window.NexusAvatars) {
            // Ensure we have a valid avatar URL or use default
            const avatarUrl = this.author.avatar || this.author.customAvatar || null;

            const avatarElement = window.NexusAvatars.createAvatar({
                username: username,
                customAvatar: avatarUrl,
                size: this.size,
                online: this.author.online,
                mystical: this.author.isVIP || this.author.role === 'admin'
            });

            // Convert element to HTML string
            const wrapper = document.createElement('div');
            wrapper.appendChild(avatarElement);
            avatarHtml = wrapper.innerHTML;
        } else {
            // Fallback avatar
            const avatarUrl = this.author.avatar || `/assets/images/default.jpg`;
            avatarHtml = `
                <div class="nexus-avatar nexus-avatar--${this.size}">
                    <img src="${avatarUrl}" alt="${displayName}'s avatar">
                    ${this.author.online ? '<div class="online-dot online"></div>' : ''}
                </div>
            `;
        }

        // Build author section with credibility glow if applicable
        const credibilityClass = this.getAuthorCredibilityClass();

        return `
            <div class="identity-author ${credibilityClass}">
                <a href="${profileUrl}" class="identity-avatar-link">
                    ${avatarHtml}
                </a>
                <div class="identity-info">
                    <a href="${profileUrl}" class="identity-name">
                        ${displayName}
                        ${this.author.title ? `<span class="identity-title">${this.author.title}</span>` : ''}
                    </a>
                    ${this.showTimestamp ? `
                        <span class="identity-timestamp">${this.formatTimestamp()}</span>
                    ` : ''}
                    ${this.showCredibility && this.authorCredibility ? `
                        <span class="identity-credibility" title="Author credibility across all content">
                            <i class="fas fa-star"></i> ${this.formatCredibility()}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create vote section with buttons
     */
    createVoteSection() {
        const upvoteClass = this.votes.userUpvoted ? 'voted active' : '';
        const challengeClass = this.votes.userChallenged ? 'voted active' : '';

        // Use custom labels if provided, otherwise defaults
        const upvoteIcon = this.customLabels.upvoteIcon;
        const upvoteLabel = this.customLabels.upvote;
        const challengeIcon = this.simpleDownvote ? 'fa-chevron-down' : this.customLabels.challengeIcon;
        const challengeLabel = this.simpleDownvote ? 'Downvote' : this.customLabels.challenge;

        return `
            <div class="identity-vote-controls">
                <button class="identity-vote-btn upvote-btn ${upvoteClass}"
                        data-action="upvote"
                        data-content-type="${this.contentType}"
                        data-content-id="${this.contentId}"
                        aria-label="${upvoteLabel} this ${this.contentType}"
                        title="${upvoteLabel}">
                    <i class="fas ${upvoteIcon}"></i>
                    <span class="vote-label">${upvoteLabel}</span>
                    <span class="vote-count">${this.formatVoteCount(this.votes.upvotes)}</span>
                </button>
                ${this.enableChallenge ? `
                    <button class="identity-vote-btn challenge-btn ${this.simpleDownvote ? 'downvote-btn' : ''} ${challengeClass}"
                            data-action="challenge"
                            data-content-type="${this.contentType}"
                            data-content-id="${this.contentId}"
                            aria-label="${challengeLabel} this ${this.contentType}"
                            title="${challengeLabel}">
                        <i class="fas ${challengeIcon}"></i>
                        <span class="vote-label">${challengeLabel}</span>
                        <span class="vote-count">${this.formatVoteCount(this.votes.challenges)}</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create compact vote display for inline variant
     */
    createCompactVotes() {
        return `
            <div class="identity-compact-votes">
                <span class="compact-vote upvotes ${this.votes.userUpvoted ? 'voted' : ''}"
                      data-action="upvote">
                    <i class="fas fa-chevron-up"></i> ${this.votes.upvotes}
                </span>
                ${this.enableChallenge ? `
                    <span class="compact-vote challenges ${this.votes.userChallenged ? 'voted' : ''}"
                          data-action="challenge">
                        <i class="fas fa-bolt"></i> ${this.votes.challenges}
                    </span>
                ` : ''}
            </div>
        `;
    }

    /**
     * Attach vote button event handlers with keyboard support
     */
    attachVoteHandlers(container) {
        // Handle all vote buttons and compact votes
        container.querySelectorAll('[data-action="upvote"], [data-action="challenge"]').forEach(element => {
            // Make buttons keyboard accessible
            element.setAttribute('tabindex', '0');
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', element.dataset.action === 'upvote' ? 'Upvote' : 'Challenge');

            // Click handler
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.createRippleEffect(e);
                this.handleVote(element.dataset.action);
            });

            // Keyboard support (Enter/Space)
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.createRippleEffect(e);
                    this.handleVote(element.dataset.action);
                }
            });
        });
    }

    /**
     * Create ripple effect on button click
     */
    createRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX ? event.clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
        const y = event.clientY ? event.clientY - rect.top - size / 2 : rect.height / 2 - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.className = 'ripple';

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Handle vote action
     */
    async handleVote(action) {
        // Check authentication
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            if (window.NEXUS && window.NEXUS.openSoulModal) {
                window.NEXUS.openSoulModal('login');
            }
            return;
        }

        // Special handling for challenges on blogs (3-tier system)
        if (action === 'challenge' && this.contentType === 'blog') {
            this.showChallengeOptions();
            return;
        }

        try {
            // Call unified voting API
            const response = await this.submitVote(action);

            // Update local state
            this.updateVoteState(response);

            // Update UI
            this.refreshVoteDisplay();

            // Emit event for other components
            this.emitVoteEvent(action, response);

            // Show success feedback
            this.showToast(`Vote ${action === 'upvote' ? 'recorded' : 'challenged'}!`, 'success');

        } catch (error) {
            console.error(`[AuthorIdentityCard] Vote failed:`, error);

            // Check for specific error messages to provide better UX
            const errorMessage = error.message || '';

            if (errorMessage.includes('cannot vote on your own')) {
                this.showToast('You cannot vote on your own content', 'info');
            } else if (errorMessage.includes('already voted')) {
                this.showToast('You have already voted on this content', 'info');
            } else if (errorMessage.includes('Authentication') || errorMessage.includes('login')) {
                this.showToast('Please log in to vote', 'warning');
            } else {
                this.showToast('Failed to record vote. Please try again.', 'error');
            }
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove any existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} show`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Submit vote to API using UnifiedVoting system
     */
    async submitVote(action) {
        // Use the UnifiedVoting system if available
        if (window.unifiedVoting) {
            return await window.unifiedVoting.vote(this.contentType, this.contentId, action, this.parentId);
        }

        // Fallback to direct API call with correct endpoints
        const apiUrl = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';
        const token = localStorage.getItem('sessionToken');

        let endpoint;
        let body = {};

        // Route to correct endpoint based on content type
        switch (this.contentType) {
            case 'blog':
                endpoint = `${apiUrl}/blogs/${this.contentId}/${action === 'upvote' ? 'like' : 'dislike'}`;
                break;
            case 'comment':
                endpoint = `${apiUrl}/comments/${this.contentId}/vote`;
                // Map 'challenge' to 'downvote' for API compatibility
                body = { action: action === 'challenge' ? 'downvote' : action };
                break;
            case 'node':
                endpoint = `${apiUrl}/mindmap/nodes/${this.contentId}/vote`;
                body = { value: action === 'upvote' ? 1 : -1 };
                break;
            case 'echo':
                endpoint = `${apiUrl}/threads/${this.contentId}/vote`;
                // Map 'challenge' to 'downvote' for API compatibility
                body = { action: action === 'challenge' ? 'downvote' : action };
                break;
            default:
                // Future unified endpoint
                endpoint = `${apiUrl}/vote/${this.contentType}/${this.contentId}`;
                // Map 'challenge' to 'downvote' for API compatibility
                body = { action: action === 'challenge' ? 'downvote' : action };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || 'Vote failed');
        }

        const data = await response.json();

        // Normalize the response based on content type
        return this.normalizeResponse(data);
    }

    /**
     * Normalize response from different API formats
     */
    normalizeResponse(data) {
        let normalized = {
            upvotes: 0,
            challenges: 0,
            userUpvoted: false,
            userChallenged: false
        };

        if (this.contentType === 'blog') {
            // Blog uses likes/dislikes
            normalized.upvotes = Array.isArray(data.likes) ? data.likes.length : (data.likes || 0);
            normalized.challenges = Array.isArray(data.dislikes) ? data.dislikes.length : (data.dislikes || 0);
            normalized.userUpvoted = data.userLiked || false;
            normalized.userChallenged = data.userDisliked || false;
        } else {
            // Default format
            normalized.upvotes = data.upvotes || 0;
            normalized.challenges = data.challenges || data.downvotes || 0;
            normalized.userUpvoted = data.userUpvoted || false;
            normalized.userChallenged = data.userChallenged || data.userDownvoted || false;
        }

        return normalized;
    }

    /**
     * Update vote state from API response
     */
    updateVoteState(response) {
        this.votes.upvotes = response.upvotes || 0;
        this.votes.challenges = response.challenges || 0;
        this.votes.userUpvoted = response.userUpvoted || false;
        this.votes.userChallenged = response.userChallenged || false;
    }

    /**
     * Refresh vote display after state change
     */
    refreshVoteDisplay() {
        if (!this.element) return;

        // Update vote counts
        this.element.querySelectorAll('.upvote-btn .vote-count, .upvotes').forEach(el => {
            el.textContent = this.formatVoteCount(this.votes.upvotes);
        });

        this.element.querySelectorAll('.challenge-btn .vote-count, .challenges').forEach(el => {
            el.textContent = this.formatVoteCount(this.votes.challenges);
        });

        // Update vote states
        this.element.querySelectorAll('[data-action="upvote"]').forEach(el => {
            el.classList.toggle('voted', this.votes.userUpvoted);
            el.classList.toggle('active', this.votes.userUpvoted);
        });

        this.element.querySelectorAll('[data-action="challenge"]').forEach(el => {
            el.classList.toggle('voted', this.votes.userChallenged);
            el.classList.toggle('active', this.votes.userChallenged);
        });

        // Update credibility tier
        const newTier = this.getCredibilityTier();
        this.element.className = this.element.className.replace(/content-credibility-\w+/, '');
        this.element.classList.add(`content-credibility-${newTier}`);
    }

    /**
     * Show challenge options for blog posts (3-tier system)
     */
    showChallengeOptions() {
        // Remove any existing dropdown
        document.querySelectorAll('.challenge-dropdown').forEach(el => el.remove());

        const dropdown = document.createElement('div');
        dropdown.className = 'challenge-dropdown identity-challenge-dropdown';
        dropdown.innerHTML = `
            <div class="challenge-options">
                <button class="challenge-option" data-challenge="quick">
                    <i class="fas fa-thumbs-down"></i>
                    <span>Quick Downvote</span>
                </button>
                <button class="challenge-option" data-challenge="counterpoint">
                    <i class="fas fa-comment-dots"></i>
                    <span>Write Counterpoint</span>
                </button>
                <button class="challenge-option" data-challenge="debate">
                    <i class="fas fa-gavel"></i>
                    <span>Create Formal Debate</span>
                </button>
            </div>
        `;

        // Position relative to challenge button but append to body to escape clipping
        const challengeBtn = this.element.querySelector('.challenge-btn');

        if (challengeBtn) {
            // Append dropdown to body to escape all container constraints
            document.body.appendChild(dropdown);

            // Make it initially visible
            dropdown.style.display = 'block';
            dropdown.style.visibility = 'visible';
            dropdown.style.opacity = '1';

            // Position dropdown relative to button
            this.positionDropdown(dropdown, challengeBtn);

            // Reposition on scroll/resize
            const repositionHandler = () => this.positionDropdown(dropdown, challengeBtn);
            window.addEventListener('scroll', repositionHandler, { passive: true });
            window.addEventListener('resize', repositionHandler);

            // Clean up event listeners when dropdown is removed
            const originalRemove = dropdown.remove.bind(dropdown);
            dropdown.remove = () => {
                window.removeEventListener('scroll', repositionHandler);
                window.removeEventListener('resize', repositionHandler);
                originalRemove();
            };
        }

        // Attach handlers
        dropdown.querySelectorAll('.challenge-option').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.handleChallengeType(btn.dataset.challenge);
                dropdown.remove();
            });
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }

    /**
     * Position dropdown relative to button
     */
    positionDropdown(dropdown, button) {
        if (!dropdown || !button) return;
        
        const rect = button.getBoundingClientRect();
        const dropdownWidth = dropdown.offsetWidth || 220;
        const dropdownHeight = dropdown.offsetHeight || 200;
        const gutter = 10;
        
        let top = rect.bottom + gutter;
        let left = rect.right - dropdownWidth;
        
        // Adjust if dropdown would go off-screen
        const maxLeft = Math.max(0, window.innerWidth - dropdownWidth - gutter);
        const maxTop = Math.max(0, window.innerHeight - dropdownHeight - gutter);
        
        if (left < gutter) left = gutter;
        if (left > maxLeft) left = maxLeft;
        
        // If dropdown would go below viewport, position above button
        if (top > maxTop) {
            top = rect.top - dropdownHeight - gutter;
        }
        
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${Math.round(top)}px`;
        dropdown.style.left = `${Math.round(left)}px`;
        dropdown.style.right = 'auto';
        dropdown.style.bottom = 'auto';
        dropdown.style.zIndex = '10001'; // Above modal
    }

    /**
     * Handle different challenge types
     */
    async handleChallengeType(type) {
        switch (type) {
            case 'quick':
                // Submit a quick downvote
                try {
                    const response = await this.submitVote('challenge');
                    this.updateVoteState(response);
                    this.refreshVoteDisplay();
                    this.emitVoteEvent('challenge', response);
                    this.showToast('Challenge recorded!', 'success');
                } catch (error) {
                    console.error('[AuthorIdentityCard] Quick challenge failed:', error);
                    this.showToast('Failed to record challenge', 'error');
                }
                break;
            case 'counterpoint':
                // Open counterpoint writing interface
                if (window.openCounterpoint) {
                    window.openCounterpoint(this.contentId);
                } else {
                    this.showToast('Counterpoint feature coming soon!', 'info');
                }
                break;
            case 'debate':
                // Create formal debate
                if (window.createFormalDebate) {
                    window.createFormalDebate(this.contentId);
                } else {
                    this.showToast('Debate feature coming soon!', 'info');
                }
                break;
        }
    }

    /**
     * Emit custom event for vote updates
     */
    emitVoteEvent(action, response) {
        const event = new CustomEvent('nexusVote', {
            detail: {
                contentType: this.contentType,
                contentId: this.contentId,
                action: action,
                votes: response
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get author credibility class for visual styling
     */
    getAuthorCredibilityClass() {
        if (!this.authorCredibility) return '';

        const netCredibility = this.authorCredibility.netCredibility || 0;

        if (netCredibility >= 100) return 'author-credibility-elevated';
        if (netCredibility <= -20) return 'author-credibility-low';
        return '';
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp() {
        const date = new Date(this.timestamp);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    }

    /**
     * Format vote count for display
     */
    formatVoteCount(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    }

    /**
     * Format credibility for display
     */
    formatCredibility() {
        if (!this.authorCredibility) return '';

        const avg = this.authorCredibility.averageCredibility || 0;
        if (avg >= 10) return 'Highly Valued';
        if (avg >= 5) return 'Respected';
        if (avg <= -5) return 'Controversial';
        return 'Neutral';
    }

    /**
     * Show error message
     */
    showError(message) {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            console.error(`[AuthorIdentityCard] ${message}`);
        }
    }

    /**
     * Update author data dynamically
     */
    updateAuthor(author) {
        this.author = author;
        if (this.element) {
            const oldElement = this.element;
            const newElement = this.render();
            oldElement.replaceWith(newElement);
        }
    }

    /**
     * Static factory method for easy creation
     */
    static create(options) {
        const card = new AuthorIdentityCard(options);
        return card.render();
    }
}

// Export for global use
window.AuthorIdentityCard = AuthorIdentityCard;

// Auto-initialize on existing elements
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-identity-card]').forEach(el => {
        const options = JSON.parse(el.dataset.identityCard || '{}');
        const card = new AuthorIdentityCard(options);
        el.replaceWith(card.render());
    });
});