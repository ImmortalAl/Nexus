/**
 * Blog Voting Module - Manages voting, challenges, and debates for blog posts
 * Part of the Immortal Nexus Blog System
 *
 * This module manages:
 * - Like/unlike posts
 * - Challenge system (3-tier response)
 * - Quick downvote
 * - Counterpoint creation
 * - Formal debate creation
 * - Vote button UI updates
 */

class BlogVoting {
    constructor() {
        this.currentChallengePostId = null;

        // Bind methods
        this.likePost = this.likePost.bind(this);
        this.challengePost = this.challengePost.bind(this);
        this.quickDownvote = this.quickDownvote.bind(this);
        this.openCounterpoint = this.openCounterpoint.bind(this);
        this.submitCounterpoint = this.submitCounterpoint.bind(this);
        this.createFormalDebate = this.createFormalDebate.bind(this);
    }

    /**
     * Initialize voting system
     */
    init() {
        this.attachEventListeners();
    }

    /**
     * Attach global event listeners
     */
    attachEventListeners() {
        // Attach counterpoint form handler if exists
        const counterpointForm = document.getElementById('counterpointForm');
        if (counterpointForm) {
            counterpointForm.addEventListener('submit', this.submitCounterpoint);
        }
    }

    /**
     * Like a blog post
     */
    async likePost(postId) {
        if (!window.BlogAPI.isTokenValid(localStorage.getItem('sessionToken'))) {
            this.requireAuth();
            return;
        }

        try {
            // Use unified voting system to ensure modal updates properly
            const result = await window.unifiedVoting.vote('blog', postId, 'upvote');
            return result;
        } catch (error) {
            console.error('Error liking post:', error);
            alert('Failed to like post: ' + error.message);
        }
    }

    /**
     * Challenge a blog post (shows 3-tier options)
     */
    challengePost(postId) {
        if (!window.BlogAPI.isTokenValid(localStorage.getItem('sessionToken'))) {
            this.requireAuth();
            return;
        }

        this.currentChallengePostId = postId;
        this.showChallengeOptions(postId);
    }

    /**
     * Show challenge options dropdown
     */
    showChallengeOptions(postId) {
        // Remove any existing dropdown
        const existingDropdown = document.querySelector('.challenge-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'challenge-dropdown';
        dropdown.innerHTML = `
            <div class="challenge-options">
                <button onclick="window.BlogVoting.quickDownvote('${postId}')" class="challenge-option">
                    <i class="fas fa-thumbs-down"></i> Quick Downvote
                </button>
                <button onclick="window.BlogVoting.openCounterpoint('${postId}')" class="challenge-option">
                    <i class="fas fa-comment-dots"></i> Write Counter-point
                </button>
                <button onclick="window.BlogVoting.createFormalDebate('${postId}')" class="challenge-option">
                    <i class="fas fa-gavel"></i> Create Formal Debate
                </button>
            </div>
        `;

        // Find challenge button
        const modalBtn = document.getElementById('modalChallengeBtn');
        const cardBtn = document.querySelector(`button[data-post-id="${postId}"].challenge-btn`) ||
                        document.querySelector(`button[onclick*="challengePost('${postId}')"]`);

        const challengeBtn = (modalBtn && modalBtn.getAttribute('data-post-id') === postId) ? modalBtn : cardBtn;

        if (!challengeBtn) {
            console.error('[BlogVoting] Could not find challenge button for post:', postId);
            return;
        }

        // Position dropdown
        const isInModalHeader = challengeBtn.closest('.modal-header-bar');
        let parentCard = null;

        if (isInModalHeader) {
            // Append to body to escape ALL clipping contexts (modal border-radius, etc.)
            document.body.appendChild(dropdown);

            // Position fixed dropdown based on button position
            const rect = challengeBtn.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.right = 'auto'; // Override CSS default right: 0
            dropdown.style.zIndex = '999999'; // Above everything

            // Check if there's enough space below the button
            const dropdownHeight = 200; // Estimated height
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
                // Position below button
                dropdown.style.top = `${rect.bottom + 8}px`;
                dropdown.style.bottom = 'auto';
            } else {
                // Position above button
                dropdown.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                dropdown.style.top = 'auto';
            }
        } else {
            challengeBtn.parentElement.style.position = 'relative';
            challengeBtn.parentElement.appendChild(dropdown);

            // Elevate parent card z-index to ensure dropdown appears above other cards
            parentCard = challengeBtn.closest('.blog-post-card');
            if (parentCard) {
                parentCard.classList.add('has-active-dropdown');
            }
        }

        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && !challengeBtn.contains(e.target)) {
                    dropdown.remove();
                    // Remove elevated z-index from parent card
                    if (parentCard) {
                        parentCard.classList.remove('has-active-dropdown');
                    }
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }

    /**
     * Quick downvote (old dislike functionality)
     */
    async quickDownvote(postId) {
        // Remove dropdown
        const dropdown = document.querySelector('.challenge-dropdown');
        if (dropdown) dropdown.remove();

        try {
            // Use unified voting system to ensure modal updates properly
            const result = await window.unifiedVoting.vote('blog', postId, 'challenge');

            if (result && window.BlogModal) {
                window.BlogModal.showNotification('Downvoted', 'info');
            }
            return result;
        } catch (error) {
            console.error('Error downvoting post:', error);
            alert('Failed to downvote post: ' + error.message);
        }
    }

    /**
     * Open counterpoint modal
     */
    openCounterpoint(postId) {
        // Remove dropdown
        const dropdown = document.querySelector('.challenge-dropdown');
        if (dropdown) dropdown.remove();

        // Set post ID
        const counterpointPostIdInput = document.getElementById('counterpointPostId');
        if (counterpointPostIdInput) {
            counterpointPostIdInput.value = postId;
        }

        // Clear previous input
        const counterpointText = document.getElementById('counterpointText');
        const counterpointSources = document.getElementById('counterpointSources');
        if (counterpointText) counterpointText.value = '';
        if (counterpointSources) counterpointSources.value = '';

        // Show modal
        const modal = document.getElementById('counterpointModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');

            // Focus on textarea
            setTimeout(() => {
                if (counterpointText) counterpointText.focus();
            }, 100);
        }
    }

    /**
     * Close counterpoint modal
     */
    closeCounterpointModal() {
        const modal = document.getElementById('counterpointModal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Submit counterpoint
     */
    async submitCounterpoint(event) {
        event.preventDefault();

        if (!window.BlogAPI.isTokenValid(localStorage.getItem('sessionToken'))) {
            alert('You must be logged in to submit a counterpoint');
            return;
        }

        const postId = document.getElementById('counterpointPostId')?.value;
        const counterpointText = document.getElementById('counterpointText')?.value.trim();
        const counterpointSources = document.getElementById('counterpointSources')?.value.trim();

        if (!postId || !counterpointText) {
            alert('Please provide a counterpoint');
            return;
        }

        try {
            await window.BlogAPI.submitCounterpoint(postId, counterpointText, counterpointSources);

            // Close modal
            this.closeCounterpointModal();

            // Reload comments if viewing this post
            if (window.BlogModal && window.BlogModal.currentPostId === postId) {
                // Comments will auto-refresh via the comments system
            }

            window.BlogModal.showNotification('Counterpoint submitted successfully!', 'success');
        } catch (error) {
            console.error('Error submitting counterpoint:', error);
            alert('Failed to submit counterpoint: ' + error.message);
        }
    }

    /**
     * Create formal debate
     */
    async createFormalDebate(postId) {
        // Remove dropdown
        const dropdown = document.querySelector('.challenge-dropdown');
        if (dropdown) dropdown.remove();

        const post = window.BlogAPI.getCachedPost(postId);
        if (!post) {
            alert('Unable to create debate: Post not found');
            return;
        }

        try {
            const result = await window.BlogAPI.createDebate(postId, post.title, post.author._id);
            window.BlogModal.showNotification('Debate created! Redirecting to Clash of Immortals...', 'success');

            // Redirect after delay
            setTimeout(() => {
                window.location.href = `/pages/debate.html#debate-${result.debateId}`;
            }, 2000);
        } catch (error) {
            console.error('Error creating debate:', error);
            alert('Failed to create debate: ' + error.message);
        }
    }

    /**
     * Vote from modal (like/dislike)
     */
    async voteFromModal(voteType) {
        const postId = window.BlogModal.currentPostId;
        if (!postId) {
            console.error('No current post ID');
            return;
        }

        if (!window.BlogAPI.isTokenValid(localStorage.getItem('sessionToken'))) {
            this.requireAuth();
            return;
        }

        try {
            const result = voteType === 'like'
                ? await window.BlogAPI.likePost(postId)
                : await window.BlogAPI.dislikePost(postId);

            this.updateVoteButtons(postId, result);
            this.updateModalVoteButtons(postId, result);
        } catch (error) {
            console.error(`Error ${voteType} post:`, error);
            alert(`Failed to ${voteType} post: ` + error.message);
        }
    }

    /**
     * Challenge from modal
     */
    challengePostFromModal() {
        const postId = window.BlogModal.currentPostId;
        if (!postId) {
            console.error('No current post ID');
            return;
        }

        if (!window.BlogAPI.isTokenValid(localStorage.getItem('sessionToken'))) {
            this.requireAuth();
            return;
        }

        // Update challenge button's data-post-id
        const modalChallengeBtn = document.getElementById('modalChallengeBtn');
        if (modalChallengeBtn) {
            modalChallengeBtn.setAttribute('data-post-id', postId);
        }

        this.showChallengeOptions(postId);
    }

    /**
     * Update vote buttons in post list
     */
    updateVoteButtons(postId, result) {
        // Find post by data-post-id attribute
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) {
            console.warn('[BlogVoting] Could not find post element for:', postId);
            return;
        }

        const likeBtn = postElement.querySelector('.like-btn');
        const challengeBtn = postElement.querySelector('.challenge-btn') || postElement.querySelector('.dislike-btn');

        // Find vote count spans inside the buttons
        const likeCount = likeBtn?.querySelector('.vote-count');
        const challengeCount = challengeBtn?.querySelector('.vote-count');

        if (likeCount) likeCount.textContent = result.likes;
        if (challengeCount) challengeCount.textContent = result.dislikes;

        // Update button states
        if (likeBtn) {
            if (result.userLiked) {
                likeBtn.classList.add('active', 'voted');
            } else {
                likeBtn.classList.remove('active', 'voted');
            }
        }

        if (challengeBtn) {
            if (result.userDisliked) {
                challengeBtn.classList.add('active', 'voted');
            } else {
                challengeBtn.classList.remove('active', 'voted');
            }
        }
    }

    /**
     * Update modal vote buttons
     */
    updateModalVoteButtons(postId, result) {
        // Only update if modal is showing this post
        if (window.BlogModal && window.BlogModal.currentPostId !== postId) {
            return;
        }

        const upvoteCount = document.getElementById('modalUpvoteCount');
        const challengeCount = document.getElementById('modalChallengeCount');
        const upvoteBtn = document.getElementById('modalUpvoteBtn');
        const challengeBtn = document.getElementById('modalChallengeBtn');

        if (upvoteCount && result.likes !== undefined) {
            upvoteCount.textContent = result.likes;
        }

        if (challengeCount && result.dislikes !== undefined) {
            challengeCount.textContent = result.dislikes;
        }

        // Update button states
        if (upvoteBtn) {
            if (result.userLiked) {
                upvoteBtn.classList.add('voted', 'active');
            } else {
                upvoteBtn.classList.remove('voted', 'active');
            }
        }

        if (challengeBtn) {
            if (result.userDisliked) {
                challengeBtn.classList.add('voted', 'active');
            } else {
                challengeBtn.classList.remove('voted', 'active');
            }
        }

        // Set post ID on challenge button
        if (challengeBtn && postId) {
            challengeBtn.setAttribute('data-post-id', postId);
        }
    }

    /**
     * Require authentication
     */
    requireAuth() {
        if (window.NEXUS && window.NEXUS.openSoulModal) {
            window.NEXUS.openSoulModal('login');
        } else {
            alert('Please log in to vote');
        }
    }

    /**
     * Delete post with confirmation
     */
    async confirmDeletePost(postId) {
        const post = window.BlogAPI.getCachedPost(postId);
        if (!post) {
            alert('Post not found.');
            return;
        }

        const confirmMessage = `Are you sure you want to permanently delete the scroll "${post.title}"?\n\nThis action cannot be undone.`;

        if (confirm(confirmMessage)) {
            try {
                await window.BlogAPI.deletePost(postId);

                // Remove from UI
                const postElement = document.getElementById(postId);
                if (postElement) {
                    postElement.remove();
                }

                // Show success message
                alert('Scroll has been permanently deleted.');

                // Close modal if it's open
                if (window.BlogModal && window.BlogModal.currentPostId === postId) {
                    window.BlogModal.close();
                }
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete scroll: ' + error.message);
            }
        }
    }

    /**
     * Delete current post
     */
    confirmDeleteCurrentPost() {
        if (window.BlogModal && window.BlogModal.currentPostId) {
            this.confirmDeletePost(window.BlogModal.currentPostId);
        }
    }
}

// Create and export singleton instance
const blogVoting = new BlogVoting();

// Export to global scope
window.BlogVoting = blogVoting;

// Also export class for testing
window.BlogVotingClass = BlogVoting;

// Export functions for backward compatibility
window.likePost = (postId) => blogVoting.likePost(postId);
window.challengePost = (postId) => blogVoting.challengePost(postId);
window.challengePostFromModal = () => blogVoting.challengePostFromModal();
window.voteFromModal = (voteType) => blogVoting.voteFromModal(voteType);
window.quickDownvote = (postId) => blogVoting.quickDownvote(postId);
window.openCounterpoint = (postId) => blogVoting.openCounterpoint(postId);
window.closeCounterpointModal = () => blogVoting.closeCounterpointModal();
window.submitCounterpoint = (event) => blogVoting.submitCounterpoint(event);
window.createFormalDebate = (postId) => blogVoting.createFormalDebate(postId);
window.confirmDeletePost = (postId) => blogVoting.confirmDeletePost(postId);
window.confirmDeleteCurrentPost = () => blogVoting.confirmDeleteCurrentPost();

// Legacy compatibility
window.dislikePost = window.challengePost;