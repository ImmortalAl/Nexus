/**
 * Blog Editor Module - Manages blog post creation and editing
 * Part of the Immortal Nexus Blog System
 *
 * This module manages:
 * - Rich text editing with Quill
 * - Post creation workflow
 * - Post editing workflow
 * - Draft management
 * - Image upload handling
 * - Preview functionality
 */

class BlogEditor {
    constructor() {
        this.quillInstance = null;
        this.isEditMode = false;
        this.currentEditPostId = null;

        // Bind methods
        this.initializeEditor = this.initializeEditor.bind(this);
        this.openCreateModal = this.openCreateModal.bind(this);
        this.openEditModal = this.openEditModal.bind(this);
        this.submitPost = this.submitPost.bind(this);
        this.updatePost = this.updatePost.bind(this);
    }

    /**
     * Initialize Quill editor
     */
    initializeEditor() {
        const editorContainer = document.getElementById('scrollEditor');
        if (!editorContainer) {
            console.error('[BlogEditor] Editor container not found');
            return;
        }

        // Check if Quill is loaded
        if (typeof Quill === 'undefined') {
            console.error('[BlogEditor] Quill library not loaded');
            return;
        }

        // Initialize Quill
        this.quillInstance = new Quill('#scrollEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    [{ 'align': [] }],
                    ['clean']
                ]
            },
            placeholder: 'Write your scroll content here...'
        });

        console.log('[BlogEditor] Quill initialized');
    }

    /**
     * Open create post modal
     */
    openCreateModal() {
        const modal = document.getElementById('createScrollModal');
        if (!modal) {
            console.error('[BlogEditor] Create modal not found');
            return;
        }

        // Reset form
        this.isEditMode = false;
        this.currentEditPostId = null;

        const titleInput = document.getElementById('scrollTitle');
        if (titleInput) {
            titleInput.value = '';
        }

        // Reset editor
        if (this.quillInstance) {
            this.quillInstance.setText('');
        } else {
            this.initializeEditor();
        }

        // Update modal title
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Create New Scroll';
        }

        // Update submit button
        const submitBtn = document.getElementById('submitScrollBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Publish Scroll';
            submitBtn.onclick = () => this.submitPost();
        }

        // Show modal
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        // Focus title input
        setTimeout(() => {
            if (titleInput) titleInput.focus();
        }, 100);
    }

    /**
     * Open edit post modal
     */
    async openEditModal(postId) {
        if (!window.BlogAPI?.isTokenValid(localStorage.getItem('sessionToken'))) {
            alert('Please log in to edit posts');
            return;
        }

        const modal = document.getElementById('createScrollModal');
        if (!modal) {
            console.error('[BlogEditor] Create modal not found');
            return;
        }

        try {
            // Fetch post data
            const post = await window.BlogAPI.fetchPost(postId);

            // Verify ownership
            const currentUser = window.BlogAPI.getCurrentUser();
            if (!currentUser || (currentUser.id !== post.author._id && currentUser.role !== 'admin')) {
                alert('You do not have permission to edit this post');
                return;
            }

            // Set edit mode
            this.isEditMode = true;
            this.currentEditPostId = postId;

            // Populate title
            const titleInput = document.getElementById('scrollTitle');
            if (titleInput) {
                titleInput.value = post.title || '';
            }

            // Populate content
            if (this.quillInstance) {
                // Quill expects Delta format, but we can set HTML
                const delta = this.quillInstance.clipboard.convert(post.content || '');
                this.quillInstance.setContents(delta);
            } else {
                this.initializeEditor();
                setTimeout(() => {
                    const delta = this.quillInstance.clipboard.convert(post.content || '');
                    this.quillInstance.setContents(delta);
                }, 100);
            }

            // Update modal title
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Scroll';
            }

            // Update submit button
            const submitBtn = document.getElementById('submitScrollBtn');
            if (submitBtn) {
                submitBtn.textContent = 'Update Scroll';
                submitBtn.onclick = () => this.updatePost();
            }

            // Show modal
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');

            // Focus title input
            setTimeout(() => {
                if (titleInput) titleInput.focus();
            }, 100);

        } catch (error) {
            console.error('[BlogEditor] Error opening edit modal:', error);
            alert('Failed to load post for editing: ' + error.message);
        }
    }

    /**
     * Close editor modal
     */
    closeEditorModal() {
        const modal = document.getElementById('createScrollModal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }

        // Reset state
        this.isEditMode = false;
        this.currentEditPostId = null;
    }

    /**
     * Submit new post
     */
    async submitPost() {
        const titleInput = document.getElementById('scrollTitle');
        const title = titleInput?.value.trim();

        if (!title) {
            alert('Please enter a title for your scroll');
            if (titleInput) titleInput.focus();
            return;
        }

        if (!this.quillInstance) {
            alert('Editor not initialized');
            return;
        }

        const content = this.quillInstance.root.innerHTML.trim();

        if (!content || content === '<p><br></p>') {
            alert('Please enter some content for your scroll');
            return;
        }

        if (!window.BlogAPI?.isTokenValid(localStorage.getItem('sessionToken'))) {
            alert('Please log in to create a post');
            return;
        }

        const submitBtn = document.getElementById('submitScrollBtn');
        const originalBtnText = submitBtn?.textContent;

        try {
            // Disable submit button
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
            }

            // Create post via API
            const newPost = await window.BlogAPI.createPost(title, content);

            // Close modal
            this.closeEditorModal();

            // Show success notification
            if (window.BlogModal?.showNotification) {
                window.BlogModal.showNotification('Scroll published successfully!', 'success');
            } else {
                alert('Scroll published successfully!');
            }

            // Reload page to show new post
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('[BlogEditor] Error creating post:', error);
            alert('Failed to publish scroll: ' + error.message);

            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText || 'Publish Scroll';
            }
        }
    }

    /**
     * Update existing post
     */
    async updatePost() {
        if (!this.isEditMode || !this.currentEditPostId) {
            console.error('[BlogEditor] Not in edit mode or no post ID');
            return;
        }

        const titleInput = document.getElementById('scrollTitle');
        const title = titleInput?.value.trim();

        if (!title) {
            alert('Please enter a title for your scroll');
            if (titleInput) titleInput.focus();
            return;
        }

        if (!this.quillInstance) {
            alert('Editor not initialized');
            return;
        }

        const content = this.quillInstance.root.innerHTML.trim();

        if (!content || content === '<p><br></p>') {
            alert('Please enter some content for your scroll');
            return;
        }

        if (!window.BlogAPI?.isTokenValid(localStorage.getItem('sessionToken'))) {
            alert('Please log in to update posts');
            return;
        }

        const submitBtn = document.getElementById('submitScrollBtn');
        const originalBtnText = submitBtn?.textContent;

        try {
            // Disable submit button
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            }

            // Update post via API
            await window.BlogAPI.updatePost(this.currentEditPostId, title, content);

            // Close modal
            this.closeEditorModal();

            // Show success notification
            if (window.BlogModal?.showNotification) {
                window.BlogModal.showNotification('Scroll updated successfully!', 'success');
            } else {
                alert('Scroll updated successfully!');
            }

            // Reload page to show updated post
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('[BlogEditor] Error updating post:', error);
            alert('Failed to update scroll: ' + error.message);

            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText || 'Update Scroll';
            }
        }
    }

    /**
     * Preview post before publishing
     */
    previewPost() {
        if (!this.quillInstance) {
            alert('Editor not initialized');
            return;
        }

        const titleInput = document.getElementById('scrollTitle');
        const title = titleInput?.value.trim() || 'Untitled';
        const content = this.quillInstance.root.innerHTML;

        // Create preview modal
        const previewModal = document.createElement('div');
        previewModal.className = 'modal preview-modal';
        previewModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Preview</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <article class="blog-post-preview">
                        <h1 class="post-title">${this.escapeHtml(title)}</h1>
                        <div class="post-content">
                            ${content}
                        </div>
                    </article>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Close Preview
                    </button>
                </div>
            </div>
        `;

        previewModal.style.display = 'flex';
        document.body.appendChild(previewModal);
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
     * Save draft to localStorage
     */
    saveDraft() {
        if (!this.quillInstance) return;

        const titleInput = document.getElementById('scrollTitle');
        const title = titleInput?.value.trim() || '';
        const content = this.quillInstance.root.innerHTML;

        const draft = {
            title,
            content,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('blogPostDraft', JSON.stringify(draft));

        if (window.BlogModal?.showNotification) {
            window.BlogModal.showNotification('Draft saved', 'info');
        }
    }

    /**
     * Load draft from localStorage
     */
    loadDraft() {
        const draftJson = localStorage.getItem('blogPostDraft');
        if (!draftJson) {
            alert('No draft found');
            return;
        }

        try {
            const draft = JSON.parse(draftJson);

            if (confirm(`Load draft from ${new Date(draft.timestamp).toLocaleString()}?`)) {
                const titleInput = document.getElementById('scrollTitle');
                if (titleInput) {
                    titleInput.value = draft.title || '';
                }

                if (this.quillInstance) {
                    const delta = this.quillInstance.clipboard.convert(draft.content || '');
                    this.quillInstance.setContents(delta);
                }

                if (window.BlogModal?.showNotification) {
                    window.BlogModal.showNotification('Draft loaded', 'success');
                }
            }
        } catch (error) {
            console.error('[BlogEditor] Error loading draft:', error);
            alert('Failed to load draft');
        }
    }

    /**
     * Clear draft from localStorage
     */
    clearDraft() {
        localStorage.removeItem('blogPostDraft');

        if (window.BlogModal?.showNotification) {
            window.BlogModal.showNotification('Draft cleared', 'info');
        }
    }
}

// Create and export singleton instance
const blogEditor = new BlogEditor();

// Export to global scope
window.BlogEditor = blogEditor;

// Also export class for testing
window.BlogEditorClass = BlogEditor;

// Export functions for backward compatibility
window.openCreateScrollModal = () => blogEditor.openCreateModal();
window.openEditScrollModal = (postId) => blogEditor.openEditModal(postId);
window.closeScrollModal = () => blogEditor.closeEditorModal();
window.submitScroll = () => blogEditor.submitPost();
window.updateScroll = () => blogEditor.updatePost();
window.previewScroll = () => blogEditor.previewPost();
window.saveDraft = () => blogEditor.saveDraft();
window.loadDraft = () => blogEditor.loadDraft();

// Auto-save draft every 30 seconds if editor is open
setInterval(() => {
    const modal = document.getElementById('createScrollModal');
    if (modal && modal.style.display === 'flex' && blogEditor.quillInstance) {
        const content = blogEditor.quillInstance.root.innerHTML;
        if (content && content !== '<p><br></p>') {
            blogEditor.saveDraft();
        }
    }
}, 30000);
