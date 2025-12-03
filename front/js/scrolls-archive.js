/**
 * Soul Scrolls Archive JavaScript
 * Handles fetching, displaying, sorting, searching, and pagination
 * for the Soul Scrolls Archive page
 */

class ScrollsArchive {
    constructor() {
        // Configuration
        this.postsPerPage = 100;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalPosts = 0;

        // State
        this.posts = [];
        this.filteredPosts = [];
        this.currentSort = 'createdAt:desc';
        this.searchQuery = '';
        this.dateRange = 'all';
        this.isLoading = false;

        // User votes tracking
        this.userVotes = new Map();

        // DOM elements
        this.elements = {
            tableBody: null,
            mobileCards: null,
            searchInput: null,
            sortSelect: null,
            dateRangeSelect: null,
            applyButton: null,
            pagination: null,
            stats: {
                total: null,
                authors: null,
                showing: null,
                totalCount: null
            }
        };

        // Bind methods
        this.handleSearch = this.debounce(this.handleSearch.bind(this), 300);
        this.handleSort = this.handleSort.bind(this);
        this.handleDateRange = this.handleDateRange.bind(this);
        this.handleTableHeaderClick = this.handleTableHeaderClick.bind(this);
        this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
    }

    /**
     * Initialize the archive
     */
    async init() {
        // Cache DOM elements
        this.cacheElements();

        // Setup event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadPosts();

        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            tableBody: document.getElementById('archiveTableBody'),
            mobileCards: document.getElementById('archiveMobileCards'),
            searchInput: document.getElementById('archiveSearch'),
            sortSelect: document.getElementById('sortBy'),
            dateRangeSelect: document.getElementById('dateRange'),
            applyButton: document.getElementById('applyFilters'),
            pagination: document.getElementById('archivePagination'),
            stats: {
                total: document.getElementById('totalScrolls'),
                authors: document.getElementById('totalAuthors'),
                showing: document.getElementById('showingCount'),
                totalCount: document.getElementById('totalCount')
            }
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.handleSearch();
            });
        }

        // Sort select
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', this.handleSort);
        }

        // Date range select
        if (this.elements.dateRangeSelect) {
            this.elements.dateRangeSelect.addEventListener('change', this.handleDateRange);
        }

        // Apply filters button
        if (this.elements.applyButton) {
            this.elements.applyButton.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadPosts();
            });
        }

        // Table header sorting
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', this.handleTableHeaderClick);
        });
    }

    /**
     * Load posts from API
     */
    async loadPosts() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoadingState();

        try {
            // Build API URL with parameters
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.postsPerPage,
                sort: this.currentSort
            });

            // Add search query if present
            if (this.searchQuery) {
                params.append('search', this.searchQuery);
            }

            // Add date range filter
            if (this.dateRange !== 'all') {
                const dateFilter = this.getDateRangeFilter();
                if (dateFilter) {
                    params.append('createdAfter', dateFilter);
                }
            }

            // Fetch posts
            const response = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/blogs?${params}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.status}`);
            }

            const data = await response.json();

            // Extract posts and pagination info
            this.posts = data.docs || data;
            this.totalPages = data.totalPages || 1;
            this.totalPosts = data.totalDocs || this.posts.length;
            this.currentPage = data.page || 1;

            // Load user votes if logged in
            await this.loadUserVotes();

            // Render posts
            this.renderPosts();

            // Update stats
            this.updateStats();

            // Render pagination
            this.renderPagination();

        } catch (error) {
            console.error('[ScrollsArchive] Error loading posts:', error);
            this.showErrorState('Failed to load scrolls. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load user votes for current posts
     */
    async loadUserVotes() {
        const token = localStorage.getItem('sessionToken');
        if (!token) return;

        try {
            // Get current user
            const userResponse = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                const userId = userData.user?.id || userData.user?._id;

                // Check votes for each post
                this.posts.forEach(post => {
                    const hasLiked = Array.isArray(post.likes) ?
                        post.likes.includes(userId) : false;
                    const hasDisliked = Array.isArray(post.dislikes) ?
                        post.dislikes.includes(userId) : false;

                    this.userVotes.set(post._id, {
                        liked: hasLiked,
                        disliked: hasDisliked
                    });
                });
            }
        } catch (error) {
            console.error('[ScrollsArchive] Error loading user votes:', error);
        }
    }

    /**
     * Render posts to table and mobile cards
     */
    renderPosts() {
        // Clear existing content
        if (this.elements.tableBody) {
            this.elements.tableBody.innerHTML = '';
        }
        if (this.elements.mobileCards) {
            this.elements.mobileCards.innerHTML = '';
        }

        if (this.posts.length === 0) {
            this.showEmptyState();
            return;
        }

        // Render table rows (desktop)
        this.posts.forEach((post, index) => {
            const row = this.createTableRow(post, index);
            if (row && this.elements.tableBody) {
                this.elements.tableBody.appendChild(row);
            }

            // Render mobile card
            const card = this.createMobileCard(post);
            if (card && this.elements.mobileCards) {
                this.elements.mobileCards.appendChild(card);
            }
        });
    }

    /**
     * Create table row for a post
     */
    createTableRow(post, index) {
        const tr = document.createElement('tr');
        tr.setAttribute('tabindex', index + 1);
        tr.dataset.postId = post._id;

        // Get vote status for this post
        const voteStatus = this.userVotes.get(post._id) || { liked: false, disliked: false };

        // Title cell
        const titleCell = document.createElement('td');
        titleCell.className = 'col-title';
        titleCell.innerHTML = `
            <a href="#" class="scroll-title-cell"
               data-post-id="${post._id}"
               onclick="event.preventDefault(); window.BlogModal.open('${post._id}')">
                ${this.escapeHtml(post.title)}
            </a>
        `;

        // Author cell
        const authorCell = document.createElement('td');
        authorCell.className = 'col-author';
        const authorName = post.author?.username || 'Anonymous';
        authorCell.innerHTML = `
            <a href="/souls/profile.html?username=${authorName}"
               class="author-link">
                ${authorName}
            </a>
        `;

        // Date cell
        const dateCell = document.createElement('td');
        dateCell.className = 'col-date';
        dateCell.textContent = this.formatDate(post.createdAt);

        // Upvotes cell
        const upvotesCell = document.createElement('td');
        upvotesCell.className = 'col-stats';
        const likes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
        upvotesCell.innerHTML = `<span class="stat-value">${likes}</span>`;

        // Comments cell
        const commentsCell = document.createElement('td');
        commentsCell.className = 'col-stats';
        const comments = post.commentsCount || 0;
        commentsCell.innerHTML = `<span class="stat-value">${comments}</span>`;

        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.className = 'col-actions';
        actionsCell.innerHTML = `
            <div class="action-buttons">
                <button class="action-btn btn-view"
                        onclick="window.BlogModal.open('${post._id}')"
                        title="View full scroll"
                        aria-label="View full scroll">
                    <i class="fas fa-eye" aria-hidden="true"></i> View
                </button>
                <button class="action-btn btn-upvote ${voteStatus.liked ? 'voted' : ''}"
                        onclick="window.scrollsArchive.handleVote('${post._id}', 'like')"
                        title="Upvote this scroll"
                        aria-label="Upvote this scroll"
                        aria-pressed="${voteStatus.liked}">
                    <i class="fas fa-thumbs-up" aria-hidden="true"></i>
                </button>
                <button class="action-btn btn-downvote ${voteStatus.disliked ? 'voted' : ''}"
                        onclick="window.scrollsArchive.handleVote('${post._id}', 'dislike')"
                        title="Downvote this scroll"
                        aria-label="Downvote this scroll"
                        aria-pressed="${voteStatus.disliked}">
                    <i class="fas fa-thumbs-down" aria-hidden="true"></i>
                </button>
            </div>
        `;

        // Append cells to row
        tr.appendChild(titleCell);
        tr.appendChild(authorCell);
        tr.appendChild(dateCell);
        tr.appendChild(upvotesCell);
        tr.appendChild(commentsCell);
        tr.appendChild(actionsCell);

        return tr;
    }

    /**
     * Create mobile card for a post
     */
    createMobileCard(post) {
        const card = document.createElement('div');
        card.className = 'archive-card';
        card.dataset.postId = post._id;

        const authorName = post.author?.username || 'Anonymous';
        const likes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
        const comments = post.commentsCount || 0;
        const voteStatus = this.userVotes.get(post._id) || { liked: false, disliked: false };

        card.innerHTML = `
            <h3 class="archive-card-title"
                onclick="window.BlogModal.open('${post._id}')">
                ${this.escapeHtml(post.title)}
            </h3>

            <div class="archive-card-meta">
                <div class="archive-card-meta-item">
                    <i class="fas fa-user"></i>
                    <a href="/souls/profile.html?username=${authorName}"
                       class="author-link">
                        ${authorName}
                    </a>
                </div>
                <div class="archive-card-meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${this.formatDate(post.createdAt)}</span>
                </div>
            </div>

            <div class="archive-card-stats">
                <div class="archive-card-stat">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${likes}</span>
                </div>
                <div class="archive-card-stat">
                    <i class="fas fa-comment"></i>
                    <span>${comments}</span>
                </div>
            </div>

            <div class="archive-card-actions">
                <button class="btn btn-primary btn-sm"
                        onclick="window.BlogModal.open('${post._id}')"
                        aria-label="View scroll">
                    <i class="fas fa-eye" aria-hidden="true"></i> View Scroll
                </button>
                <button class="action-btn btn-upvote ${voteStatus.liked ? 'voted' : ''}"
                        onclick="window.scrollsArchive.handleVote('${post._id}', 'like')"
                        aria-label="Upvote this scroll"
                        aria-pressed="${voteStatus.liked}">
                    <i class="fas fa-thumbs-up" aria-hidden="true"></i>
                </button>
                <button class="action-btn btn-downvote ${voteStatus.disliked ? 'voted' : ''}"
                        onclick="window.scrollsArchive.handleVote('${post._id}', 'dislike')"
                        aria-label="Downvote this scroll"
                        aria-pressed="${voteStatus.disliked}">
                    <i class="fas fa-thumbs-down" aria-hidden="true"></i>
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Handle voting
     */
    async handleVote(postId, voteType) {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            // Open login modal
            if (window.NEXUS && window.NEXUS.openAuthModal) {
                window.NEXUS.openAuthModal('login');
            } else {
                alert('Please log in to vote');
            }
            return;
        }

        try {
            // Use the unified voting system if available
            if (window.BlogVoting) {
                if (voteType === 'like') {
                    await window.BlogVoting.likePost(postId);
                } else {
                    await window.BlogVoting.challengePost(postId);
                }

                // Update vote counts locally WITHOUT reloading the page
                await this.updateVoteCountsLocal(postId);
            }
        } catch (error) {
            console.error('[ScrollsArchive] Error voting:', error);
        }
    }

    /**
     * Update vote counts locally after voting (no page refresh)
     */
    async updateVoteCountsLocal(postId) {
        try {
            // Fetch updated post data
            const response = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/blogs/${postId}`);
            if (!response.ok) return;

            const updatedPost = await response.json();

            // Update the post in our local array
            const postIndex = this.posts.findIndex(p => p._id === postId);
            if (postIndex !== -1) {
                this.posts[postIndex] = updatedPost;
            }

            // Update the UI vote count displays
            const upvoteButtons = document.querySelectorAll(`[onclick*="'${postId}'"][onclick*="'like'"]`);
            const downvoteButtons = document.querySelectorAll(`[onclick*="'${postId}'"][onclick*="'dislike'"]`);

            const likes = Array.isArray(updatedPost.likes) ? updatedPost.likes.length : (updatedPost.likes || 0);

            // Update upvote button states and counts in table
            upvoteButtons.forEach(btn => {
                const votedClass = this.userVotes.get(postId)?.liked ? 'voted' : '';
                btn.className = `action-btn btn-upvote ${votedClass}`;
            });

            // Update downvote button states
            downvoteButtons.forEach(btn => {
                const votedClass = this.userVotes.get(postId)?.disliked ? 'voted' : '';
                btn.className = `action-btn btn-downvote ${votedClass}`;
            });

            // Update vote count in upvotes column
            const row = document.querySelector(`tr[data-post-id="${postId}"]`);
            if (row) {
                const upvotesCell = row.querySelector('.col-stats .stat-value');
                if (upvotesCell) {
                    upvotesCell.textContent = likes;
                }
            }

            // Update mobile card vote counts
            const card = document.querySelector(`.archive-card[data-post-id="${postId}"]`);
            if (card) {
                const upvotesStat = card.querySelector('.archive-card-stat i.fa-thumbs-up + span');
                if (upvotesStat) {
                    upvotesStat.textContent = likes;
                }
            }

        } catch (error) {
            console.error('[ScrollsArchive] Error updating vote counts:', error);
        }
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        if (!this.elements.pagination) return;

        const paginationHTML = [];

        // Page info
        paginationHTML.push(`
            <div class="pagination-info">
                Page ${this.currentPage} of ${this.totalPages}
                (${this.totalPosts} total scrolls)
            </div>
        `);

        // Pagination controls
        paginationHTML.push('<div class="pagination-controls">');

        // Previous button
        paginationHTML.push(`
            <button class="page-btn"
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="window.scrollsArchive.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `);

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            paginationHTML.push(`
                <button class="page-btn" onclick="window.scrollsArchive.goToPage(1)">1</button>
            `);
            if (startPage > 2) {
                paginationHTML.push('<span class="page-ellipsis">...</span>');
            }
        }

        // Page range
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML.push(`
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                        onclick="window.scrollsArchive.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        // Last page
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML.push('<span class="page-ellipsis">...</span>');
            }
            paginationHTML.push(`
                <button class="page-btn"
                        onclick="window.scrollsArchive.goToPage(${this.totalPages})">
                    ${this.totalPages}
                </button>
            `);
        }

        // Next button
        paginationHTML.push(`
            <button class="page-btn"
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    onclick="window.scrollsArchive.goToPage(${this.currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `);

        paginationHTML.push('</div>');

        this.elements.pagination.innerHTML = paginationHTML.join('');
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;

        this.currentPage = page;
        this.loadPosts();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Handle search
     */
    handleSearch() {
        this.currentPage = 1;
        this.loadPosts();
    }

    /**
     * Handle sort change
     */
    handleSort(event) {
        this.currentSort = event.target.value;
        this.currentPage = 1;
        this.loadPosts();
    }

    /**
     * Handle date range change
     */
    handleDateRange(event) {
        this.dateRange = event.target.value;
    }

    /**
     * Handle table header click for sorting
     */
    handleTableHeaderClick(event) {
        const header = event.currentTarget;
        const sortField = header.dataset.sort;

        if (!sortField) return;

        // Toggle sort direction
        const currentDirection = this.currentSort.endsWith(':desc') ? 'desc' : 'asc';
        const newDirection = currentDirection === 'desc' ? 'asc' : 'desc';

        this.currentSort = `${sortField}:${newDirection}`;

        // Update UI
        document.querySelectorAll('.sortable').forEach(h => {
            h.classList.remove('sorted-asc', 'sorted-desc');
        });
        header.classList.add(`sorted-${newDirection}`);

        // Update select dropdown to match
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = this.currentSort;
        }

        // Reload data
        this.currentPage = 1;
        this.loadPosts();
    }

    /**
     * Get date range filter
     */
    getDateRangeFilter() {
        const now = new Date();

        switch (this.dateRange) {
            case 'today':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today.toISOString();

            case 'week':
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                return weekAgo.toISOString();

            case 'month':
                const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
                return monthAgo.toISOString();

            case 'year':
                const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);
                return yearAgo.toISOString();

            default:
                return null;
        }
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', this.handleKeyboardNavigation);
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        // Skip if user is typing in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const focusedRow = document.activeElement.closest('tr');

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (focusedRow && focusedRow.nextElementSibling) {
                    focusedRow.nextElementSibling.focus();
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (focusedRow && focusedRow.previousElementSibling) {
                    focusedRow.previousElementSibling.focus();
                }
                break;

            case 'Enter':
                if (focusedRow) {
                    const postId = focusedRow.dataset.postId;
                    if (postId && window.BlogModal) {
                        window.BlogModal.open(postId);
                    }
                }
                break;
        }
    }

    /**
     * Update stats display
     */
    updateStats() {
        // Total scrolls
        if (this.elements.stats.total) {
            this.elements.stats.total.textContent = this.totalPosts;
        }

        // Unique authors count
        if (this.elements.stats.authors) {
            const uniqueAuthors = new Set(
                this.posts.map(p => p.author?.username || 'Anonymous')
            );
            this.elements.stats.authors.textContent = uniqueAuthors.size;
        }

        // Showing count
        if (this.elements.stats.showing) {
            this.elements.stats.showing.textContent = this.posts.length;
        }

        // Total count
        if (this.elements.stats.totalCount) {
            this.elements.stats.totalCount.textContent = this.totalPosts;
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (this.elements.tableBody) {
            this.elements.tableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Loading archive...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        if (this.elements.mobileCards) {
            this.elements.mobileCards.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading archive...</span>
                </div>
            `;
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const message = this.searchQuery ?
            'No scrolls found matching your search.' :
            'No scrolls available.';

        if (this.elements.tableBody) {
            this.elements.tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">${message}</td>
                </tr>
            `;
        }

        if (this.elements.mobileCards) {
            this.elements.mobileCards.innerHTML = `
                <div class="empty-state">
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        if (this.elements.tableBody) {
            this.elements.tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <i class="fas fa-exclamation-triangle"></i> ${message}
                    </td>
                </tr>
            `;
        }

        if (this.elements.mobileCards) {
            this.elements.mobileCards.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Debounce helper
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Create and initialize archive instance
    window.scrollsArchive = new ScrollsArchive();
    await window.scrollsArchive.init();
});

// Export for global access
window.ScrollsArchive = ScrollsArchive;

/**
 * Edit current post - redirects to lander.html with edit mode
 * Called from the edit button in archive modals
 */
window.editCurrentPost = function() {
    const postId = window.BlogModal?.currentPostId;
    if (!postId) {
        console.error('[ScrollsArchive] No current post ID for editing');
        alert('Unable to edit post - no post ID found');
        return;
    }

    // Redirect to lander with edit parameters
    window.location.href = `/lander.html?expand=editor&editId=${postId}`;
};

/**
 * Confirm delete current post
 * Called from the delete button in archive modals
 */
window.confirmDeleteCurrentPost = function() {
    const postId = window.BlogModal?.currentPostId;
    if (!postId) {
        console.error('[ScrollsArchive] No current post ID for deleting');
        return;
    }

    if (window.BlogVoting) {
        window.BlogVoting.confirmDeletePost(postId);
    } else {
        console.error('[ScrollsArchive] BlogVoting not available');
    }
};