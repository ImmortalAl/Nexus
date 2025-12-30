/**
 * Blog Main Module - Orchestrator for the Immortal Nexus Blog System
 * Part of the Immortal Nexus Blog System
 *
 * This module serves as the main entry point and coordinator for all blog functionality.
 * It initializes and coordinates the following modules:
 * - blog-api.js (API interactions)
 * - blog-modal.js (Modal management)
 * - blog-voting.js (Voting/challenge system)
 * - blog-comments.js (Comments system)
 * - blog-editor.js (Rich text editing)
 * - blog-ui.js (UI rendering and state)
 *
 * IMPORTANT: All functionality has been extracted to dedicated modules.
 * This file now only handles initialization and coordination.
 */

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the blog system
 */
async function initializeBlog() {
    console.log('[Blog] Initializing Immortal Nexus Blog System...');

    // Verify all required modules are loaded
    if (!verifyModules()) {
        console.error('[Blog] Failed to load required modules');
        showErrorState('Failed to load blog system. Please refresh the page.');
        return;
    }

    // Initialize each module
    try {
        // Initialize editor if Quill is available
        if (typeof Quill !== 'undefined') {
            window.BlogEditor.initializeEditor();
        }

        // Initialize voting system
        window.BlogVoting.init();

        // Initialize modal system (enables auto-opening from sessionStorage, URL params, hash)
        window.BlogModal.init();

        // Initialize UI and load posts
        await window.BlogUI.init();

        console.log('[Blog] Blog system initialized successfully');

        // Setup URL parameter handling (for direct post links)
        handleUrlParameters();

    } catch (error) {
        console.error('[Blog] Initialization error:', error);
        showErrorState('Failed to initialize blog system: ' + error.message);
    }
}

/**
 * Verify all required modules are loaded
 */
function verifyModules() {
    const requiredModules = [
        'BlogAPI',
        'BlogModal',
        'BlogVoting',
        'BlogComments',
        'BlogEditor',
        'BlogUI'
    ];

    const missingModules = requiredModules.filter(module => !window[module]);

    if (missingModules.length > 0) {
        console.error('[Blog] Missing required modules:', missingModules);
        return false;
    }

    console.log('[Blog] All required modules loaded ✓');
    return true;
}
/**
 * Handle URL parameters (e.g., ?post=123) and sessionStorage
 */
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("post");

    // Check sessionStorage for scroll ID from homepage navigation
    const sessionScrollId = sessionStorage.getItem("openScrollId");
    
    const scrollToOpen = postId || sessionScrollId;

    if (scrollToOpen) {
        // Clear sessionStorage to prevent re-opening on refresh
        if (sessionScrollId) {
            sessionStorage.removeItem("openScrollId");
        }

        // Open modal for specific post
        setTimeout(() => {
            window.BlogModal.open(scrollToOpen);
        }, 500);
    }
}

/**
 * Show error state
 */
function showErrorState(message) {
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

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close blog modal
            const blogModal = document.getElementById('fullBlogModal');
            if (blogModal && blogModal.style.display === 'flex') {
                window.BlogModal.close();
            }

            // Close editor modal
            const editorModal = document.getElementById('createScrollModal');
            if (editorModal && editorModal.style.display === 'flex') {
                window.BlogEditor.closeEditorModal();
            }

            // Close counterpoint modal
            const counterpointModal = document.getElementById('counterpointModal');
            if (counterpointModal && counterpointModal.style.display === 'flex') {
                window.BlogVoting.closeCounterpointModal();
            }
        }
    });

    // Setup "Create New Scroll" button
    const createScrollBtn = document.getElementById('createScrollBtn');
    if (createScrollBtn) {
        createScrollBtn.addEventListener('click', () => {
            const token = localStorage.getItem('sessionToken');
            if (!window.BlogAPI.isTokenValid(token)) {
                // Prompt login
                if (window.NEXUS && window.NEXUS.openSoulModal) {
                    window.NEXUS.openSoulModal('login');
                } else {
                    alert('Please log in to create a scroll');
                }
            } else {
                window.BlogEditor.openCreateModal();
            }
        });
    }

    // Setup modal close buttons
    const modalCloseButtons = document.querySelectorAll('.close-modal, .close-btn');
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    });
}

// ============================================================================
// BACKWARD COMPATIBILITY LAYER
// ============================================================================

/**
 * Legacy function wrappers for backward compatibility
 * These functions delegate to the new modular system
 */

// Blog post operations
window.fetchBlogPosts = (page) => window.BlogUI.loadPage(page);
window.openBlogModal = (postId) => window.BlogModal.open(postId);
window.closeBlogModal = () => window.BlogModal.close();

// Voting operations
window.likePost = (postId) => window.BlogVoting.likePost(postId);
window.challengePost = (postId) => window.BlogVoting.challengePost(postId);
window.dislikePost = (postId) => window.BlogVoting.challengePost(postId); // Legacy alias

// Editor operations
window.openCreateScrollModal = () => window.BlogEditor.openCreateModal();
window.openEditScrollModal = (postId) => window.BlogEditor.openEditModal(postId);
window.closeScrollModal = () => window.BlogEditor.closeEditorModal();

// Comment operations
window.loadBlogComments = (postId) => window.BlogComments.loadComments(postId);

// Sharing and bookmarks
window.sharePost = (postId) => window.BlogUI.sharePost(postId);
window.toggleBookmark = (postId) => window.BlogUI.toggleBookmark(postId);

// Delete operations
window.confirmDeletePost = (postId) => window.BlogVoting.confirmDeletePost(postId);
window.confirmDeleteCurrentPost = () => window.BlogVoting.confirmDeleteCurrentPost();

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

/**
 * Auto-initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Blog] DOM loaded, initializing...');

    // Setup event listeners
    setupEventListeners();

    // Initialize blog system
    await initializeBlog();
});

/**
 * Fallback initialization if DOMContentLoaded already fired
 */
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('[Blog] DOM already loaded, initializing immediately...');
    setupEventListeners();
    initializeBlog();
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export initialization function for manual initialization if needed
window.initializeBlog = initializeBlog;

console.log('[Blog] Blog system module loaded ✓');
