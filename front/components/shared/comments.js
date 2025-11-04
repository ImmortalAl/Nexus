// Comments Component
class CommentsSystem {
    constructor(targetType, targetId, containerId) {
        this.targetType = targetType;
        this.targetId = targetId;
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.comments = [];
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        this.token = localStorage.getItem('sessionToken');
        
        if (!this.container) {
            console.error(`Comments container #${containerId} not found`);
            return;
        }
        
        this.init();
    }
    
    async init() {
        this.createCommentsSection();
        await this.loadComments();
        this.attachEventListeners();
    }
    
    createCommentsSection() {
        this.container.innerHTML = `
            <div class="comments-section">
                <h3 class="comments-title">
                    <i class="fas fa-comments"></i>
                    Eternal Echoes
                </h3>
                <div class="comments-list" id="${this.containerId}-list">
                    <div class="loading-comments">Summoning eternal echoes...</div>
                </div>
                <div class="comment-form-container">
                    <textarea 
                        id="${this.containerId}-input" 
                        class="comment-input" 
                        placeholder="Share your eternal thoughts..."
                        rows="3"
                    ></textarea>
                    <button id="${this.containerId}-submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        Send Echo
                    </button>
                </div>
            </div>
        `;
    }
    
    async loadComments() {
        const listContainer = document.getElementById(`${this.containerId}-list`);
        if (!listContainer) return;

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Only add auth header if user is logged in
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            // Ensure targetId is properly encoded in URL
            const encodedTargetId = encodeURIComponent(this.targetId);
            const url = `${window.NEXUS_CONFIG.API_BASE_URL}/comments/${this.targetType}/${encodedTargetId}`;

            const response = await fetch(url, { headers });
            
            
            if (!response.ok) {
                if (response.status === 404) {
                    // Comments endpoint doesn't exist for this type, show empty state
                    // Comments endpoint doesn't exist for this type, show empty state
                    this.comments = [];
                    this.renderComments();
                    return;
                }
                throw new Error(`Failed to fetch comments: ${response.status}`);
            }
            
            const data = await response.json();

            // Handle different response formats
            if (Array.isArray(data)) {
                this.comments = data;
            } else if (data.comments && Array.isArray(data.comments)) {
                this.comments = data.comments;
            } else if (data.docs && Array.isArray(data.docs)) {
                this.comments = data.docs;
            } else {
                console.warn('[Comments] Unexpected response format:', data);
                this.comments = [];
            }

            this.renderComments();
        } catch (error) {
            console.error('[Comments] Error loading comments:', error);
            
            // Check if it's a network error or API not available
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.comments = [];
                this.renderComments();
            } else {
                listContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Failed to load eternal echoes. The cosmic energies are unstable.
                    </div>
                `;
            }
        }
    }
    
    renderComments() {
        const listContainer = document.getElementById(`${this.containerId}-list`);
        if (!listContainer) return;
        
        if (!this.comments.length) {
            listContainer.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-feather"></i>
                    No eternal echoes yet. Be the first to share your thoughts.
                </div>
            `;
            return;
        }
        
        // Clear existing content
        listContainer.innerHTML = '';
        
        // Create and append DOM elements directly to preserve event listeners
        this.comments.forEach(comment => {
            const commentEl = this.createCommentElement(comment);
            listContainer.appendChild(commentEl);
        });
    }
    
    createCommentElement(comment) {
        const isAuthor = this.currentUser._id === comment.author._id;
        const formattedDate = new Date(comment.createdAt).toLocaleString();
        const editedText = comment.isEdited ? ' (edited)' : '';
        
        // Create comment container
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.id = `comment-${comment._id}`;

        // Create unified author display WITH VOTING using AuthorIdentityCard
        let authorDisplay;

        if (window.AuthorIdentityCard) {
            // NEW UNIFIED SYSTEM WITH VOTING!
            const identityCard = new AuthorIdentityCard({
                author: comment.author,
                contentType: 'comment',
                contentId: comment._id,
                timestamp: comment.createdAt,
                upvotes: comment.upvotes || 0,
                challenges: comment.challenges || 0,
                userUpvoted: comment.userUpvoted || false,
                userChallenged: comment.userChallenged || false,
                size: 'sm',
                variant: 'inline',
                showVoting: true,
                showTimestamp: true,
                enableChallenge: true, // Enable downvoting on comments
                simpleDownvote: true // Use simple down-chevron icon
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
        } else if (window.NexusAvatars && window.NexusAvatars.createUserDisplay) {
            // Fallback to avatar system without voting
            authorDisplay = window.NexusAvatars.createUserDisplay({
                username: comment.author.username,
                title: comment.author.title || 'Eternal Soul',
                status: `${formattedDate}${editedText}`,
                avatarSize: 'sm',
                displaySize: 'xs',
                compact: true,
                mystical: comment.author.isVIP || comment.author.role === 'admin',
                online: comment.author.online,
                customAvatar: comment.author.avatar,
                usernameStyle: 'immortal',
                enableUnifiedNavigation: true
            });
        } else {
            // Ultimate fallback
            authorDisplay = document.createElement('div');
            authorDisplay.className = 'comment-author-fallback';
            authorDisplay.innerHTML = `
                <img src="${comment.author.avatar || '/assets/images/default.jpg'}"
                     alt="${comment.author.username}"
                     class="comment-author-avatar" />
                <div class="comment-author-info">
                    <span class="comment-author-name">${comment.author.username}</span>
                    <span class="comment-author-date">${formattedDate}${editedText}</span>
                </div>
            `;
        }
        
        // Create comment header with author display and actions
        const commentHeader = document.createElement('div');
        commentHeader.className = 'comment-header';
        
        commentHeader.appendChild(authorDisplay);
        
        if (isAuthor) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'comment-actions';
            actionsDiv.innerHTML = `
                <button class="btn-edit" data-id="${comment._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" data-id="${comment._id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            commentHeader.appendChild(actionsDiv);
        }
        
        // Create comment content
        const commentContent = document.createElement('div');
        commentContent.className = 'comment-content';
        commentContent.innerHTML = comment.content;
        
        // Assemble comment
        commentDiv.appendChild(commentHeader);
        commentDiv.appendChild(commentContent);
        
        return commentDiv;
    }
    
    attachEventListeners() {
        const submitBtn = document.getElementById(`${this.containerId}-submit`);
        const inputField = document.getElementById(`${this.containerId}-input`);
        const listContainer = document.getElementById(`${this.containerId}-list`);
        
        if (submitBtn && inputField) {
            submitBtn.addEventListener('click', () => this.submitComment(inputField));
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submitComment(inputField);
                }
            });
        }
        
        if (listContainer) {
            listContainer.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                const commentId = target.dataset.id;
                if (target.classList.contains('btn-edit')) {
                    this.editComment(commentId);
                } else if (target.classList.contains('btn-delete')) {
                    this.deleteComment(commentId);
                }
            });
        }
    }
    
    async submitComment(inputField) {
        const content = inputField.value.trim();
        if (!content) return;

        if (!this.token) {
            alert('Please log in to share your eternal thoughts.');
            return;
        }

        try {
            console.log('[Comments] Submitting comment:', {
                targetType: this.targetType,
                targetId: this.targetId,
                contentLength: content.length,
                hasToken: !!this.token
            });

            const response = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    targetType: this.targetType,
                    targetId: this.targetId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Comments] Server error:', errorData);
                throw new Error(errorData.error || `Failed to post comment (${response.status})`);
            }

            const newComment = await response.json();
            this.comments.unshift(newComment);
            this.renderComments();
            inputField.value = '';
        } catch (error) {
            console.error('[Comments] Error posting comment:', error);
            alert(`Failed to share your eternal thoughts: ${error.message}`);
        }
    }
    
    async editComment(commentId) {
        const comment = this.comments.find(c => c._id === commentId);
        if (!comment) return;
        
        const newContent = prompt('Edit your eternal thought:', comment.content);
        if (!newContent || newContent === comment.content) return;
        
        try {
            const response = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });
            
            if (!response.ok) throw new Error('Failed to edit comment');
            
            const updatedComment = await response.json();
            const index = this.comments.findIndex(c => c._id === commentId);
            if (index !== -1) {
                this.comments[index] = updatedComment;
                this.renderComments();
            }
        } catch (error) {
            console.error('Error editing comment:', error);
            alert('Failed to edit your eternal thought. Please try again.');
        }
    }
    
    async deleteComment(commentId) {
        if (!confirm('Delete this eternal thought forever?')) return;
        
        try {
            const response = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete comment');
            
            this.comments = this.comments.filter(c => c._id !== commentId);
            this.renderComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete your eternal thought. Please try again.');
        }
    }
}

// Add to global Nexus object
window.NEXUS = window.NEXUS || {};
window.NEXUS.CommentsSystem = CommentsSystem; 