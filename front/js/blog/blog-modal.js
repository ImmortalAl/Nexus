/**
 * Blog Modal Module - Manages blog post modal display and interactions
 * Part of the Immortal Nexus Blog System
 *
 * This module manages:
 * - Modal opening/closing
 * - Modal content population
 * - Keyboard navigation
 * - Click-outside-to-close
 * - Reading progress tracking
 * - Share functionality
 * - Text size controls
 * - Bookmarking
 */

class BlogModal {
    constructor() {
        this.currentPostId = null;
        this.modalClickOutsideHandler = null;
        this.bookmarkedPosts = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
        this.currentTextSize = 'normal';
        this.voteListener = null;
        this.currentModalIdentityCard = null;

        // Bind methods
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
    }

    /**
     * Initialize modal system
     */
    init() {
        this.setupEventListeners();
        this.checkAutoOpen();
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle hash changes for direct navigation
        window.addEventListener('hashchange', () => {
            if (window.location.hash && window.location.hash.startsWith('#scroll-')) {
                const postId = window.location.hash.replace('#scroll-', '');
                if (postId) {
                    this.open(postId);
                }
            }
        });

        // Check for auto-open on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.checkAutoOpen());
        } else {
            this.checkAutoOpen();
        }
    }

    /**
     * Open blog modal with specified post
     */
    async open(postId) {
        // Prevent duplicate calls
        if (window._blogModalOpening) {
            return;
        }

        window._blogModalOpening = true;
        this.currentPostId = postId;

        // Get modal element
        const modal = document.getElementById('blogModal');
        if (!modal) {
            console.error('Blog modal element not found');
            window._blogModalOpening = false;
            document.body.classList.remove('modal-open');
            return;
        }

        // Show modal with loading state
        this.showWithLoading(modal);

        // Fetch post data
        let post;
        try {
            post = await window.BlogAPI.fetchPost(postId);
        } catch (error) {
            console.error('[BlogModal] Error fetching post:', error);
            this.hideLoading(modal);
            window._blogModalOpening = false;
            document.body.classList.remove('modal-open');
            return;
        }

        if (!post) {
            console.error('No post data returned for ID:', postId);
            this.hideLoading(modal);
            window._blogModalOpening = false;
            document.body.classList.remove('modal-open');
            return;
        }

        // Hide loading and show content
        this.hideLoading(modal);
        this.populateContent(modal, post);

        // Setup features
        this.setupKeyboardNavigation();
        this.setupReadingProgress();
        this.updateBookmarkState(postId);

        // Initialize comments if available
        this.initializeComments(postId);

        // Load author's other posts
        this.loadAuthorOtherPosts(post.author._id, postId);

        window._blogModalOpening = false;
    }

    /**
     * Close the blog modal
     */
    close() {
        const modal = document.getElementById('blogModal');
        if (modal) {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        }

        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyboard);
        this.cleanupClickOutside();

        // Clean up vote listener
        if (this.voteListener) {
            this.voteListener(); // Call unsubscribe function
            this.voteListener = null;
        }

        // Reset current post
        this.currentPostId = null;
        window._blogModalOpening = false;
    }

    /**
     * Show modal with loading state
     */
    showWithLoading(modal) {
        modal.removeAttribute('style');
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        modal.style.zIndex = '10000';
        document.body.classList.add('modal-open');

        // Setup click-outside-to-close
        this.setupClickOutside(modal);

        // Show loading state
        const modalLoading = document.getElementById('modalLoading');
        const modalBody = document.getElementById('modalBody');

        if (modalLoading) modalLoading.style.display = 'flex';
        if (modalBody) modalBody.style.display = 'none';
    }

    /**
     * Hide modal loading state
     */
    hideLoading(modal) {
        const modalLoading = document.getElementById('modalLoading');
        const modalBody = document.getElementById('modalBody');

        if (modalLoading) modalLoading.style.display = 'none';
        if (modalBody) modalBody.style.display = 'block';
    }

    /**
     * Populate modal content with post data
     */
    populateContent(modal, post) {
        const elements = {
            'modal-title': document.getElementById('modal-title'),
            'modal-content': document.getElementById('modal-content')
        };

        if (!elements['modal-title'] || !elements['modal-content']) {
            console.error('Missing essential modal elements');
            return;
        }

        // Update title
        elements['modal-title'].textContent = post.title;

        // Add category badge if present
        if (post.category) {
            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'category-badge';
            categoryBadge.textContent = post.category;
            elements['modal-title'].appendChild(categoryBadge);
        }

        // Update content with linkified URLs
        elements['modal-content'].innerHTML = this.linkifyContent(post.content);

        // Update reading stats
        this.updateReadingStats(post.content);

        // Setup author identity card
        this.setupAuthorIdentityCard(post);

        // Update edit/delete buttons
        this.updateEditDeleteButtons(post);
    }

    /**
     * Setup author identity card with voting
     */
    setupAuthorIdentityCard(post) {
        const modalHeaderBar = document.getElementById('blogModalHeader');
        if (!modalHeaderBar) {
            console.error('[BlogModal] Modal header bar not found');
            return;
        }

        // Clear existing content except close button
        const closeBtn = modalHeaderBar.querySelector('.modal-header-controls');
        modalHeaderBar.innerHTML = '';

        // Create AuthorIdentityCard if available
        if (window.AuthorIdentityCard) {
            // Calculate votes
            const upvotes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
            const challenges = Array.isArray(post.dislikes) ? post.dislikes.length : (post.dislikes || 0);

            // Check if current user has voted
            let userUpvoted = false;
            let userChallenged = false;

            const user = window.BlogAPI.getCurrentUser();
            if (user) {
                const userId = user.id;
                userUpvoted = Array.isArray(post.likes) && post.likes.includes(userId);
                userChallenged = Array.isArray(post.dislikes) && post.dislikes.includes(userId);
            }

            const identityCard = new window.AuthorIdentityCard({
                author: post.author,
                contentType: 'blog',
                contentId: post._id,
                timestamp: post.createdAt,
                upvotes: upvotes,
                challenges: challenges,
                userUpvoted: userUpvoted,
                userChallenged: userChallenged,
                size: 'sm', /* OPTIMIZED: Reduced from 'md' to 'sm' for more compact avatar display */
                variant: 'header',
                showVoting: true,
                showTimestamp: true,
                enableChallenge: true
            });

            const cardElement = identityCard.render();

            // Store reference
            this.currentModalIdentityCard = identityCard;

            // Add to header
            modalHeaderBar.appendChild(cardElement);

            // Re-add close button
            if (closeBtn) {
                modalHeaderBar.appendChild(closeBtn);
            }

            // Listen for vote updates
            if (window.unifiedVoting) {
                this.voteListener = window.unifiedVoting.addListener((detail) => {
                    if (detail.contentType === 'blog' && detail.contentId === post._id) {
                        identityCard.updateVoteState(detail.votes);
                        identityCard.refreshVoteDisplay();
                    }
                });
            }
        }
    }

    /**
     * Update edit/delete button visibility
     */
    updateEditDeleteButtons(post) {
        const editBtn = document.getElementById('editPostBtn');
        const deleteBtn = document.getElementById('deletePostBtn');

        const user = window.BlogAPI.getCurrentUser();
        if (user) {
            const isAuthor = post.author.username === user.username || post.author._id === user.id;
            const isAdmin = user.role === 'admin';
            const canEdit = isAuthor;
            const canDelete = isAuthor || isAdmin;

            if (editBtn) {
                editBtn.style.display = canEdit ? 'inline-flex' : 'none';
            }
            if (deleteBtn) {
                deleteBtn.style.display = canDelete ? 'inline-flex' : 'none';
            }
        } else {
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }

    /**
     * Load author's other posts
     */
    async loadAuthorOtherPosts(authorId, currentPostId) {
        let container = document.getElementById('authorOtherScrolls');

        // Create container if doesn't exist
        if (!container) {
            const modalBody = document.getElementById('modalBody');
            if (!modalBody) return;

            container = document.createElement('div');
            container.id = 'authorOtherScrolls';
            container.className = 'author-other-scrolls';
            container.innerHTML = '<h3>More scrolls from this soul</h3><div class="other-scrolls-list"></div>';
            modalBody.appendChild(container);
        }

        try {
            const otherPosts = await window.BlogAPI.fetchAuthorPosts(authorId, 5, currentPostId);

            const listContainer = container.querySelector('.other-scrolls-list');
            if (!listContainer) return;

            if (otherPosts.length === 0) {
                listContainer.innerHTML = '<p class="no-other-scrolls">No other scrolls from this author yet.</p>';
            } else {
                listContainer.innerHTML = '';
                otherPosts.forEach(post => {
                    const scrollItem = document.createElement('div');
                    scrollItem.className = 'other-scroll-item';
                    scrollItem.innerHTML = `
                        <h4>${post.title}</h4>
                        <p class="scroll-date">${new Date(post.createdAt).toLocaleDateString()}</p>
                    `;
                    scrollItem.onclick = () => {
                        this.close();
                        setTimeout(() => this.open(post._id), 300);
                    };
                    listContainer.appendChild(scrollItem);
                });
            }
        } catch (error) {
            console.error('Error loading author posts:', error);
            const listContainer = container.querySelector('.other-scrolls-list');
            if (listContainer) {
                listContainer.innerHTML = '<p class="error-loading">Failed to load other scrolls.</p>';
            }
        }
    }

    /**
     * Initialize comments system
     */
    initializeComments(postId) {
        setTimeout(() => {
            if (window.NEXUS && window.NEXUS.CommentsSystem) {
                try {
                    new window.NEXUS.CommentsSystem('blog', postId, 'blogComments');
                } catch (error) {
                    console.error('Error initializing comments:', error);
                }
            }
        }, 100);
    }

    /**
     * Make URLs in content clickable
     */
    linkifyContent(html) {
        const urlPattern = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
        return html.replace(urlPattern, function(url) {
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="auto-link">' + url + '</a>';
        });
    }

    /**
     * Update reading statistics
     */
    updateReadingStats(content) {
        const textContent = content.replace(/<[^>]*>/g, '');
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        const readingTime = Math.ceil(wordCount / 200);

        const readingTimeEl = document.getElementById('readingTime');
        const wordCountEl = document.getElementById('wordCount');

        if (readingTimeEl) {
            readingTimeEl.textContent = `${readingTime} min read`;
        }

        if (wordCountEl) {
            wordCountEl.textContent = `${wordCount} words`;
        }
    }

    /**
     * Setup reading progress tracking
     */
    setupReadingProgress() {
        const modalBody = document.getElementById('modalBody');
        const progressFill = document.querySelector('.progress-fill');

        if (!modalBody || !progressFill) return;

        modalBody.addEventListener('scroll', () => {
            const scrollTop = modalBody.scrollTop;
            const scrollHeight = modalBody.scrollHeight - modalBody.clientHeight;
            const progress = (scrollTop / scrollHeight) * 100;

            progressFill.style.width = `${Math.min(progress, 100)}%`;
            progressFill.parentElement.setAttribute('aria-valuenow', Math.round(progress));
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', this.handleKeyboard);
    }

    /**
     * Handle keyboard events
     */
    handleKeyboard(e) {
        const modal = document.getElementById('blogModal');
        if (!modal || !modal.classList.contains('show')) return;

        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    }

    /**
     * Setup click-outside-to-close
     */
    setupClickOutside(modal) {
        this.cleanupClickOutside();

        this.modalClickOutsideHandler = (event) => {
            if (event.target === modal) {
                this.close();
            }
        };

        modal.addEventListener('click', this.modalClickOutsideHandler);
    }

    /**
     * Cleanup click-outside handler
     */
    cleanupClickOutside() {
        if (this.modalClickOutsideHandler) {
            const modal = document.getElementById('blogModal');
            if (modal) {
                modal.removeEventListener('click', this.modalClickOutsideHandler);
            }
            this.modalClickOutsideHandler = null;
        }
    }

    /**
     * Copy post link to clipboard
     */
    copyPostLink() {
        if (!this.currentPostId) return;

        const postUrl = `${window.location.origin}/pages/blog.html?id=${this.currentPostId}`;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(postUrl).then(() => {
                this.showNotification('✨ Link copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyText(postUrl);
            });
        } else {
            this.fallbackCopyText(postUrl);
        }
    }

    /**
     * Fallback copy method
     */
    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            this.showNotification('✨ Link copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('📋 Copy failed. Link: ' + text, 'error');
        }

        document.body.removeChild(textArea);
    }

    /**
     * Share current post
     */
    shareCurrentPost() {
        if (!this.currentPostId) return;

        const shareUrl = `${window.location.origin}${window.location.pathname}#scroll-${this.currentPostId}`;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied');
            }).catch(() => {
                prompt('Copy link:', shareUrl);
            });
        } else {
            prompt('Copy link:', shareUrl);
        }
    }

    /**
     * Toggle text size
     */
    toggleTextSize(direction) {
        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        if (direction === 'larger' || (direction === undefined && this.currentTextSize === 'normal')) {
            modalBody.classList.add('large-text');
            this.currentTextSize = 'large';
            this.showNotification('📖 Text size increased', 'info');
        } else {
            modalBody.classList.remove('large-text');
            this.currentTextSize = 'normal';
            this.showNotification('📖 Text size reset', 'info');
        }
    }

    /**
     * Bookmark/unbookmark current post
     */
    bookmarkPost() {
        if (!this.currentPostId) return;

        const isBookmarked = this.bookmarkedPosts.includes(this.currentPostId);
        const bookmarkBtn = document.querySelector('.bookmark-btn');

        if (isBookmarked) {
            this.bookmarkedPosts = this.bookmarkedPosts.filter(id => id !== this.currentPostId);
            if (bookmarkBtn) {
                bookmarkBtn.classList.remove('bookmarked');
                bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            }
            this.showNotification('🔖 Bookmark removed', 'info');
        } else {
            this.bookmarkedPosts.push(this.currentPostId);
            if (bookmarkBtn) {
                bookmarkBtn.classList.add('bookmarked');
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            }
            this.showNotification('🔖 Post bookmarked!', 'success');
        }

        localStorage.setItem('bookmarkedPosts', JSON.stringify(this.bookmarkedPosts));
    }

    /**
     * Update bookmark button state
     */
    updateBookmarkState(postId) {
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        if (!bookmarkBtn) return;

        const isBookmarked = this.bookmarkedPosts.includes(postId);
        if (isBookmarked) {
            bookmarkBtn.classList.add('bookmarked');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        } else {
            bookmarkBtn.classList.remove('bookmarked');
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `modal-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' :
                         type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(255, 94, 120, 0.9)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10002;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Check for auto-open from URL or hash
     */
    checkAutoOpen() {
        // Check for hash fragment
        let hashPostId = null;
        if (window.location.hash && window.location.hash.startsWith('#scroll-')) {
            hashPostId = window.location.hash.replace('#scroll-', '');
        }

        // Check for URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlPostId = urlParams.get('id');

        // Check for sessionStorage
        const sessionPostId = sessionStorage.getItem('openScrollId');

        const autoOpenScrollId = hashPostId || urlPostId || sessionPostId;

        if (autoOpenScrollId) {
            if (sessionPostId) {
                sessionStorage.removeItem('openScrollId');
            }

            // Wait for systems to be ready
            const attemptAutoOpen = (attempts = 0) => {
                if (!window.NexusAvatars || !window.BlogAPI) {
                    if (attempts < 20) {
                        setTimeout(() => attemptAutoOpen(attempts + 1), 500);
                    }
                    return;
                }

                const modal = document.getElementById('blogModal');
                if (!modal) {
                    if (attempts < 20) {
                        setTimeout(() => attemptAutoOpen(attempts + 1), 500);
                    }
                    return;
                }

                try {
                    this.open(autoOpenScrollId);

                    // Clean up URL if using URL parameter
                    if (urlPostId && !hashPostId) {
                        const newUrl = window.location.pathname + window.location.hash;
                        window.history.replaceState({}, document.title, newUrl);
                    }
                } catch (error) {
                    console.error('Error opening modal:', error);
                }
            };

            setTimeout(() => attemptAutoOpen(), 2000);
        }
    }
}

// Create and export singleton instance
const blogModal = new BlogModal();

// Export to global scope
window.BlogModal = blogModal;

// Also export class for testing
window.BlogModalClass = BlogModal;