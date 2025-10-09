/**
 * Blog UI Module - Manages UI state and interactions for blog system
 * Part of the Immortal Nexus Blog System
 *
 * This module manages:
 * - Post card rendering
 * - Pagination UI
 * - Loading states
 * - Scroll animations
 * - Bookmarking UI
 * - Sharing functionality
 * - Search/filter UI
 */

class BlogUI {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.postsPerPage = 10;
        this.isLoading = false;

        // Bind methods
        this.renderPostCard = this.renderPostCard.bind(this);
        this.renderPosts = this.renderPosts.bind(this);
        this.updatePagination = this.updatePagination.bind(this);
        this.sharePost = this.sharePost.bind(this);
    }

    /**
     * Render a single blog post card
     */
    renderPostCard(post) {
        if (!post) return '';

        const authorName = post.author?.displayName || post.author?.username || 'Anonymous';
        const authorId = post.author?._id || '';
        const avatarUrl = post.author?.avatar || '/images/default-avatar.png';
        const excerpt = post.excerpt || this.createExcerpt(post.content);
        const timestamp = this.formatDate(post.createdAt);
        const likes = post.likes || 0;
        const dislikes = post.dislikes || 0;
        const commentsCount = post.commentsCount || 0;

        // Check if post is bookmarked
        const bookmarkedPosts = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
        const isBookmarked = bookmarkedPosts.includes(post._id);

        // Check if current user is author
        const currentUser = window.BlogAPI?.getCurrentUser();
        const isAuthor = currentUser && currentUser.id === authorId;

        return `
            <article class="blog-post-card" id="${post._id}">
                <div class="post-header">
                    <div class="author-info">
                        <img src="${avatarUrl}" alt="${authorName}" class="author-avatar">
                        <div class="author-details">
                            <span class="author-name">${authorName}</span>
                            <span class="post-date">${timestamp}</span>
                        </div>
                    </div>
                    ${isAuthor ? `
                        <div class="post-actions">
                            <button class="action-btn" onclick="window.BlogEditor.openEditModal('${post._id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn" onclick="window.BlogVoting.confirmDeletePost('${post._id}')" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="post-content" onclick="window.BlogModal.open('${post._id}')">
                    <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
                    <div class="post-excerpt">
                        ${excerpt}
                    </div>
                    <button class="read-more-btn">
                        Read Full Scroll <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <div class="post-footer">
                    <div class="post-stats">
                        <span class="stat">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="like-count">${likes}</span>
                        </span>
                        <span class="stat">
                            <i class="fas fa-shield-alt"></i>
                            <span class="challenge-count">${dislikes}</span>
                        </span>
                        <span class="stat">
                            <i class="fas fa-comment"></i>
                            <span>${commentsCount}</span>
                        </span>
                    </div>

                    <div class="post-interactions">
                        <button class="like-btn" onclick="window.BlogVoting.likePost('${post._id}')" title="Upvote">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <button class="challenge-btn" onclick="window.BlogVoting.challengePost('${post._id}')" title="Challenge">
                            <i class="fas fa-shield-alt"></i>
                        </button>
                        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
                                onclick="window.BlogUI.toggleBookmark('${post._id}')"
                                title="${isBookmarked ? 'Remove bookmark' : 'Bookmark'}">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button class="share-btn" onclick="window.BlogUI.sharePost('${post._id}')" title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Render multiple posts to container
     */
    renderPosts(posts, containerId = 'blogPostsContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            logger.debug('BlogUI', `Container not found: ${containerId} - not on list page`);
            return;
        }

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts-message">
                    <i class="fas fa-scroll"></i>
                    <h3>No scrolls found</h3>
                    <p>Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const postsHTML = posts.map(post => this.renderPostCard(post)).join('');
        container.innerHTML = postsHTML;

        // Apply scroll animations
        this.applyScrollAnimations();
    }

    /**
     * Update pagination controls
     */
    updatePagination(currentPage, totalPages, totalDocs = 0) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;

        const paginationContainer = document.getElementById('paginationControls');
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';

        // Previous button
        paginationHTML += `
            <button class="page-btn"
                    ${currentPage === 1 ? 'disabled' : ''}
                    onclick="window.BlogUI.loadPage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            paginationHTML += `
                <button class="page-btn" onclick="window.BlogUI.loadPage(1)">1</button>
                ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
            `;
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}"
                        onclick="window.BlogUI.loadPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            paginationHTML += `
                ${endPage < totalPages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
                <button class="page-btn" onclick="window.BlogUI.loadPage(${totalPages})">${totalPages}</button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="page-btn"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    onclick="window.BlogUI.loadPage(${currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHTML += '</div>';

        // Page info
        paginationHTML += `
            <div class="page-info">
                Showing page ${currentPage} of ${totalPages} (${totalDocs} scrolls total)
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    /**
     * Load a specific page
     */
    async loadPage(pageNumber) {
        if (this.isLoading || pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }

        this.showLoadingState();

        try {
            const result = await window.BlogAPI.fetchPosts(pageNumber, this.postsPerPage);

            // Extract posts from paginated result
            const posts = result.docs || result;
            const totalPages = result.totalPages || 1;
            const totalDocs = result.totalDocs || posts.length;

            this.renderPosts(posts);
            this.updatePagination(pageNumber, totalPages, totalDocs);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('[BlogUI] Error loading page:', error);
            this.showErrorState('Failed to load posts. Please try again.');
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.isLoading = true;
        const container = document.getElementById('blogPostsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin fa-3x"></i>
                    <p>Loading scrolls...</p>
                </div>
            `;
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.isLoading = false;
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const container = document.getElementById('blogPostsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>Oops!</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Refresh Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Toggle bookmark for a post
     */
    toggleBookmark(postId) {
        let bookmarkedPosts = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
        const index = bookmarkedPosts.indexOf(postId);

        if (index > -1) {
            // Remove bookmark
            bookmarkedPosts.splice(index, 1);
            this.updateBookmarkButton(postId, false);
        } else {
            // Add bookmark
            bookmarkedPosts.push(postId);
            this.updateBookmarkButton(postId, true);
        }

        localStorage.setItem('bookmarkedPosts', JSON.stringify(bookmarkedPosts));
    }

    /**
     * Update bookmark button state
     */
    updateBookmarkButton(postId, isBookmarked) {
        const postCard = document.getElementById(postId);
        if (!postCard) return;

        const bookmarkBtn = postCard.querySelector('.bookmark-btn');
        if (bookmarkBtn) {
            if (isBookmarked) {
                bookmarkBtn.classList.add('bookmarked');
                bookmarkBtn.title = 'Remove bookmark';
            } else {
                bookmarkBtn.classList.remove('bookmarked');
                bookmarkBtn.title = 'Bookmark';
            }
        }
    }

    /**
     * Share post
     */
    async sharePost(postId) {
        const post = window.BlogAPI?.getCachedPost(postId);
        if (!post) {
            alert('Post not found');
            return;
        }

        const shareData = {
            title: post.title,
            text: `Check out this scroll: ${post.title}`,
            url: `${window.location.origin}/pages/blog.html?post=${postId}`
        };

        // Try Web Share API first
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (error) {
                // User cancelled share or API not available
                console.log('[BlogUI] Web Share cancelled or unavailable');
            }
        }

        // Fallback: Copy link to clipboard
        try {
            await navigator.clipboard.writeText(shareData.url);
            if (window.BlogModal?.showNotification) {
                window.BlogModal.showNotification('Link copied to clipboard!', 'success');
            } else {
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            // Final fallback: Show share modal
            this.showShareModal(shareData);
        }
    }

    /**
     * Show share modal (fallback)
     */
    showShareModal(shareData) {
        const modal = document.createElement('div');
        modal.className = 'modal share-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share Scroll</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="text"
                           value="${shareData.url}"
                           readonly
                           class="share-url-input"
                           onclick="this.select()">
                    <button class="btn btn-primary" onclick="
                        this.previousElementSibling.select();
                        document.execCommand('copy');
                        this.innerHTML = '<i class=\\'fas fa-check\\'></i> Copied!';
                    ">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        document.body.appendChild(modal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Create excerpt from content
     */
    createExcerpt(content, maxLength = 200) {
        if (!content) return '';

        // Remove HTML tags
        const text = content.replace(/<[^>]*>/g, '');

        // Trim to maxLength
        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Apply scroll animations to elements
     */
    applyScrollAnimations() {
        const cards = document.querySelectorAll('.blog-post-card');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        cards.forEach(card => {
            observer.observe(card);
        });
    }

    /**
     * Initialize blog UI
     */
    async init() {
        console.log('[BlogUI] Initializing...');

        // Load initial page
        await this.loadPage(1);

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Search functionality (if exists)
        const searchInput = document.getElementById('blogSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter buttons (if exist)
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.handleFilter(filter);
            });
        });
    }

    /**
     * Handle search (debounced)
     */
    handleSearch(query) {
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Set new timeout
        this.searchTimeout = setTimeout(async () => {
            console.log('[BlogUI] Searching for:', query);
            // TODO: Implement search API call
        }, 300);
    }

    /**
     * Handle filter
     */
    handleFilter(filter) {
        console.log('[BlogUI] Applying filter:', filter);
        // TODO: Implement filter functionality
    }
}

// Create and export singleton instance
const blogUI = new BlogUI();

// Export to global scope
window.BlogUI = blogUI;

// Also export class for testing
window.BlogUIClass = BlogUI;

// Export functions for backward compatibility
window.loadBlogPage = (page) => blogUI.loadPage(page);
window.sharePost = (postId) => blogUI.sharePost(postId);
window.toggleBookmark = (postId) => blogUI.toggleBookmark(postId);
