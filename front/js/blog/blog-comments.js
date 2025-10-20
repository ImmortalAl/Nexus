/**
 * Blog Comments Module - Manages comment loading and display for blog posts
 * Part of the Immortal Nexus Blog System
 *
 * This module manages:
 * - Loading comments for blog posts
 * - Displaying comments with avatars
 * - Comment submission integration
 * - Counterpoint highlighting
 * - Replies and nested comments
 */

class BlogComments {
    constructor() {
        // Bind methods
        this.loadComments = this.loadComments.bind(this);
        this.displayComments = this.displayComments.bind(this);
        this.createCommentElement = this.createCommentElement.bind(this);
    }

    /**
     * Load comments for a specific blog post
     */
    async loadComments(postId) {
        const commentsSection = document.getElementById('modalCommentsSection');
        if (!commentsSection) {
            console.error('[BlogComments] Comments section not found');
            return;
        }

        const API_BASE_URL = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';

        try {
            commentsSection.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>';

            const token = localStorage.getItem('sessionToken');
            const headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            };
            
            // Add auth header if user is logged in
            if (token && window.BlogAPI?.isTokenValid(token)) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/comments/blog/${postId}`, {
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.status}`);
            }

            const comments = await response.json();
            this.displayComments(comments, postId);

        } catch (error) {
            console.error('[BlogComments] Error loading comments:', error);
            commentsSection.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Failed to load comments. Please try again later.
                </div>
            `;
        }
    }

    /**
     * Display comments in the modal
     */
    displayComments(comments, postId) {
        const commentsSection = document.getElementById('modalCommentsSection');
        if (!commentsSection) return;

        if (!comments || comments.length === 0) {
            commentsSection.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
            return;
        }

        // Build comments HTML
        let commentsHTML = '<div class="comments-list">';

        comments.forEach(comment => {
            commentsHTML += this.createCommentElement(comment);
        });

        commentsHTML += '</div>';

        // Add comment form
        commentsHTML += this.createCommentForm(postId);

        commentsSection.innerHTML = commentsHTML;

        // Setup comment form handler
        this.setupCommentFormHandler(postId);
    }

    /**
     * Create HTML for a single comment using authorIdentityCard
     */
    createCommentElement(comment) {
        const isCounterpoint = comment.isCounterpoint || comment.content?.includes('🗡️ **Counterpoint:**');
        const currentUser = window.BlogAPI?.getCurrentUser();
        const canDelete = currentUser && (currentUser.id === comment.author?._id || currentUser.role === 'admin');

        // Create comment container
        const commentDiv = document.createElement('div');
        commentDiv.className = `comment ${isCounterpoint ? 'counterpoint-comment' : ''}`;
        commentDiv.setAttribute('data-comment-id', comment._id);

        // Create unified author display WITH VOTING using AuthorIdentityCard
        let authorDisplay;

        if (window.AuthorIdentityCard) {
            // NEW UNIFIED SYSTEM WITH VOTING!
            const voteData = {
                upvotes: comment.upvoteCount || comment.upvotes || comment.likes || 0,
                challenges: comment.challengeCount || comment.downvoteCount || comment.downvotes || comment.dislikes || 0,
                userUpvoted: comment.userUpvoted || comment.userLiked || false,
                userChallenged: comment.userChallenged || comment.userDownvoted || comment.userDisliked || false
            };
            
            console.log('[BlogComments] Creating AuthorIdentityCard for comment:', {
                commentId: comment._id,
                voteData: voteData,
                enableChallenge: true,
                simpleDownvote: true,
                comment: comment
            });
            
            const identityCard = new AuthorIdentityCard({
                author: comment.author,
                contentType: 'comment',
                contentId: comment._id,
                timestamp: comment.createdAt,
                upvotes: voteData.upvotes,
                challenges: voteData.challenges,
                userUpvoted: voteData.userUpvoted,
                userChallenged: voteData.userChallenged,
                size: 'sm',
                variant: 'inline',
                showVoting: true,
                showTimestamp: true,
                enableChallenge: true,
                simpleDownvote: true // Use simple downvote for comments (not 3-tier challenge)
            });

            authorDisplay = identityCard.render();

            // Listen for vote updates
            if (window.unifiedVoting) {
                const unsubscribe = window.unifiedVoting.addListener((detail) => {
                    if (detail.contentType === 'comment' && detail.contentId === comment._id) {
                        identityCard.updateVoteState(detail.votes);
                        identityCard.refreshVoteDisplay();
                    }
                });
                commentDiv._unsubscribeVoting = unsubscribe;
            }
        } else {
            // Fallback to custom HTML (OLD SYSTEM)
            const authorName = comment.author?.displayName || comment.author?.username || 'Anonymous';
            const authorId = comment.author?._id || '';
            const timestamp = this.formatTimestamp(comment.createdAt);
            const avatarLetter = authorName.charAt(0).toUpperCase();

            authorDisplay = document.createElement('div');
            authorDisplay.className = 'comment-author-info';
            authorDisplay.innerHTML = `
                <div class="comment-avatar" data-user-id="${authorId}">
                    <img src="${comment.author?.avatar || '/assets/images/default.jpg'}"
                         alt="${authorName}"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="avatar-fallback" style="display: none;">
                        ${avatarLetter}
                    </div>
                </div>
                <div class="comment-meta">
                    <span class="comment-author">${authorName}</span>
                    ${isCounterpoint ? '<span class="counterpoint-badge">🗡️ Counterpoint</span>' : ''}
                    <span class="comment-timestamp">${timestamp}</span>
                </div>
            `;
        }

        // Create comment header with author display and actions
        const commentHeader = document.createElement('div');
        commentHeader.className = 'comment-header';
        commentHeader.appendChild(authorDisplay);

        // Add delete button if user can delete
        if (canDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'comment-delete-btn';
            deleteBtn.title = 'Delete comment';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.onclick = () => window.BlogComments.deleteComment(comment._id);
            commentHeader.appendChild(deleteBtn);
        }

        // Create comment content
        const commentContent = document.createElement('div');
        commentContent.className = 'comment-content';
        commentContent.innerHTML = this.formatCommentContent(comment.content);

        // Assemble comment
        commentDiv.appendChild(commentHeader);
        commentDiv.appendChild(commentContent);

        // Add replies if they exist
        if (comment.replies && comment.replies.length > 0) {
            const repliesDiv = document.createElement('div');
            repliesDiv.className = 'comment-replies';
            comment.replies.forEach(reply => {
                repliesDiv.appendChild(this.createCommentElement(reply));
            });
            commentDiv.appendChild(repliesDiv);
        }

        return commentDiv.outerHTML;
    }

    /**
     * Format comment content (supports markdown-like syntax)
     */
    formatCommentContent(content) {
        if (!content) return '';

        // Convert markdown-like syntax
        let formatted = content
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Code
            .replace(/`(.+?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return formatted;
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        // Format as date
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Create comment form HTML
     */
    createCommentForm(postId) {
        const isLoggedIn = window.BlogAPI?.isTokenValid(localStorage.getItem('sessionToken'));

        if (!isLoggedIn) {
            return `
                <div class="comment-form-wrapper">
                    <div class="login-prompt">
                        <p>Please <a href="#" onclick="window.NEXUS?.openSoulModal('login'); return false;">log in</a> to leave a comment.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="comment-form-wrapper">
                <form id="commentForm" class="comment-form">
                    <textarea
                        id="commentContent"
                        placeholder="Share your thoughts..."
                        rows="3"
                        required
                    ></textarea>
                    <div class="comment-form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Post Comment
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Setup comment form submission handler
     */
    setupCommentFormHandler(postId) {
        const commentForm = document.getElementById('commentForm');
        if (!commentForm) return;

        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitComment(postId);
        });
    }

    /**
     * Submit a new comment
     */
    async submitComment(postId) {
        const commentContent = document.getElementById('commentContent');
        if (!commentContent) return;

        const content = commentContent.value.trim();
        if (!content) {
            alert('Please enter a comment');
            return;
        }

        const token = localStorage.getItem('sessionToken');
        if (!window.BlogAPI?.isTokenValid(token)) {
            alert('Please log in to comment');
            return;
        }

        const API_BASE_URL = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';

        try {
            // Disable submit button
            const submitBtn = commentContent.closest('form').querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            }

            const response = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content,
                    targetType: 'blog',
                    targetId: postId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to post comment');
            }

            // Clear form
            commentContent.value = '';

            // Reload comments
            await this.loadComments(postId);

            // Show success notification
            if (window.BlogModal?.showNotification) {
                window.BlogModal.showNotification('Comment posted successfully!', 'success');
            }

        } catch (error) {
            console.error('[BlogComments] Error submitting comment:', error);
            alert('Failed to post comment: ' + error.message);

            // Re-enable submit button
            const submitBtn = commentContent.closest('form').querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
            }
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
            return;
        }

        const token = localStorage.getItem('sessionToken');
        if (!window.BlogAPI?.isTokenValid(token)) {
            alert('Authentication required');
            return;
        }

        const API_BASE_URL = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';

        try {
            const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete comment');
            }

            // Remove comment from UI
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
            }

            // Show success notification
            if (window.BlogModal?.showNotification) {
                window.BlogModal.showNotification('Comment deleted', 'success');
            }

        } catch (error) {
            console.error('[BlogComments] Error deleting comment:', error);
            alert('Failed to delete comment: ' + error.message);
        }
    }

    /**
     * Refresh comments for current post
     */
    async refreshComments() {
        if (window.BlogModal?.currentPostId) {
            await this.loadComments(window.BlogModal.currentPostId);
        }
    }
}

// Create and export singleton instance
const blogComments = new BlogComments();

// Export to global scope
window.BlogComments = blogComments;

// Also export class for testing
window.BlogCommentsClass = BlogComments;

// Export functions for backward compatibility
window.loadBlogComments = (postId) => blogComments.loadComments(postId);
window.deleteComment = (commentId) => blogComments.deleteComment(commentId);
window.refreshBlogComments = () => blogComments.refreshComments();
