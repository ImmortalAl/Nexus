/**
 * The Gateways - Links Page JavaScript
 * Community-curated links with light governance
 * Version: 1.0
 */

(function() {
    'use strict';

    // State
    let currentCategory = 'all';
    let allLinks = [];
    let pendingLinks = [];
    let searchTerm = '';

    // DOM Elements
    const linksGrid = document.getElementById('linksGrid');
    const emptyState = document.getElementById('emptyState');
    const pendingNotice = document.getElementById('pendingNotice');
    const pendingCount = document.getElementById('pendingCount');
    const linkSearch = document.getElementById('linkSearch');
    const categoryFilters = document.querySelectorAll('.category-filter');

    // Modals
    const submitModal = document.getElementById('submitLinkModal');
    const pendingModal = document.getElementById('pendingLinksModal');
    const submitForm = document.getElementById('submitLinkForm');
    const descriptionInput = document.getElementById('linkDescription');
    const charCount = document.getElementById('descCharCount');

    // Category metadata
    const categoryMeta = {
        knowledge: { icon: 'fa-book', label: 'Knowledge & Learning', color: '#3b82f6' },
        philosophy: { icon: 'fa-brain', label: 'Philosophy & Thought', color: '#8b5cf6' },
        technology: { icon: 'fa-microchip', label: 'Technology & Tools', color: '#22c55e' },
        creative: { icon: 'fa-palette', label: 'Creative & Arts', color: '#f59e0b' },
        community: { icon: 'fa-handshake', label: 'Community Partners', color: '#ec4899' },
        reading: { icon: 'fa-bookmark', label: 'Recommended Reading', color: '#14b8a6' }
    };

    /**
     * Initialize the links page
     */
    function init() {
        setupEventListeners();
        loadLinks();
        if (window.authManager?.isLoggedIn()) {
            loadPendingLinks();
        }
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Search
        if (linkSearch) {
            linkSearch.addEventListener('input', debounce(handleSearch, 300));
        }

        // Category filters
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => handleCategoryFilter(filter));
        });

        // Submit button
        document.getElementById('submitLinkBtn')?.addEventListener('click', openSubmitModal);
        document.getElementById('emptySubmitBtn')?.addEventListener('click', openSubmitModal);

        // Modal controls
        document.getElementById('closeSubmitModal')?.addEventListener('click', closeSubmitModal);
        document.getElementById('cancelSubmit')?.addEventListener('click', closeSubmitModal);
        document.getElementById('closePendingModal')?.addEventListener('click', closePendingModal);
        document.getElementById('viewPendingBtn')?.addEventListener('click', openPendingModal);

        // Form submission
        if (submitForm) {
            submitForm.addEventListener('submit', handleSubmitLink);
        }

        // Character count for description
        if (descriptionInput) {
            descriptionInput.addEventListener('input', updateCharCount);
        }

        // Close modals on overlay click
        [submitModal, pendingModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.setAttribute('aria-hidden', 'true');
                    }
                });
            }
        });
    }

    /**
     * Load approved links from API
     */
    async function loadLinks() {
        showLoading();

        try {
            const response = await window.apiClient.get('/links');
            allLinks = response.links || [];
            renderLinks();
        } catch (error) {
            console.error('Failed to load links:', error);
            showError('Failed to load gateways. Please try again.');
        }
    }

    /**
     * Load pending links for review
     */
    async function loadPendingLinks() {
        try {
            const response = await window.apiClient.get('/links/pending');
            pendingLinks = response.links || [];
            updatePendingNotice();
        } catch (error) {
            console.error('Failed to load pending links:', error);
        }
    }

    /**
     * Render links to the grid
     */
    function renderLinks() {
        let filteredLinks = allLinks;

        // Filter by category
        if (currentCategory !== 'all') {
            filteredLinks = filteredLinks.filter(link => link.category === currentCategory);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredLinks = filteredLinks.filter(link =>
                link.title.toLowerCase().includes(term) ||
                link.description.toLowerCase().includes(term) ||
                link.url.toLowerCase().includes(term)
            );
        }

        if (filteredLinks.length === 0) {
            linksGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        linksGrid.innerHTML = filteredLinks.map(link => createLinkCard(link)).join('');

        // Attach event listeners to new cards
        attachCardListeners();
    }

    /**
     * Create HTML for a link card
     */
    function createLinkCard(link) {
        const meta = categoryMeta[link.category] || { icon: 'fa-link', label: link.category, color: '#6b7280' };
        const domain = extractDomain(link.url);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

        return `
            <article class="link-card" data-id="${link._id}">
                <div class="link-card-header">
                    <div class="link-favicon">
                        <img src="${faviconUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <i class="fas fa-globe" style="display:none;"></i>
                    </div>
                    <h3 class="link-title">
                        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(link.title)}
                        </a>
                    </h3>
                </div>
                <p class="link-description">${escapeHtml(link.description)}</p>
                <div class="link-meta">
                    <span class="link-category" style="background: ${meta.color}20; color: ${meta.color}">
                        <i class="fas ${meta.icon}"></i> ${meta.label}
                    </span>
                    <div class="link-stats">
                        <span title="Submitted by ${escapeHtml(link.submittedBy?.username || 'Anonymous')}">
                            <i class="fas fa-user"></i> ${escapeHtml(link.submittedBy?.username || 'Anonymous')}
                        </span>
                    </div>
                </div>
                <div class="link-actions">
                    <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-action-btn visit-btn">
                        <i class="fas fa-external-link-alt"></i> Visit
                    </a>
                    <button class="link-action-btn flag-btn" data-id="${link._id}" title="Report this link">
                        <i class="fas fa-flag"></i>
                    </button>
                </div>
            </article>
        `;
    }

    /**
     * Attach event listeners to card buttons
     */
    function attachCardListeners() {
        document.querySelectorAll('.flag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleFlagLink(btn.dataset.id);
            });
        });
    }

    /**
     * Handle category filter click
     */
    function handleCategoryFilter(filter) {
        categoryFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        currentCategory = filter.dataset.category;
        renderLinks();
    }

    /**
     * Handle search input
     */
    function handleSearch(e) {
        searchTerm = e.target.value.trim();
        renderLinks();
    }

    /**
     * Open submit modal
     */
    function openSubmitModal() {
        if (!window.authManager?.isLoggedIn()) {
            window.authManager?.showLogin();
            return;
        }
        submitForm.reset();
        charCount.textContent = '0';
        submitModal.setAttribute('aria-hidden', 'false');
    }

    /**
     * Close submit modal
     */
    function closeSubmitModal() {
        submitModal.setAttribute('aria-hidden', 'true');
    }

    /**
     * Open pending links modal
     */
    function openPendingModal() {
        pendingModal.setAttribute('aria-hidden', 'false');
        renderPendingLinks();
    }

    /**
     * Close pending links modal
     */
    function closePendingModal() {
        pendingModal.setAttribute('aria-hidden', 'true');
    }

    /**
     * Render pending links in the modal
     */
    function renderPendingLinks() {
        const container = document.getElementById('pendingLinksList');

        if (pendingLinks.length === 0) {
            container.innerHTML = '<p class="empty-state">No pending gateways to review.</p>';
            return;
        }

        container.innerHTML = pendingLinks.map(link => {
            const userVoted = link.approvalVotes?.includes(window.authManager?.getCurrentUser()?._id);
            return `
                <div class="pending-link-card" data-id="${link._id}">
                    <div class="pending-link-header">
                        <span class="pending-link-title">${escapeHtml(link.title)}</span>
                        <span class="pending-link-category">${categoryMeta[link.category]?.label || link.category}</span>
                    </div>
                    <div class="pending-link-url">${escapeHtml(link.url)}</div>
                    <p class="pending-link-description">${escapeHtml(link.description)}</p>
                    <div class="pending-link-votes">
                        <span class="vote-count">${link.approvalVotes?.length || 0}/3</span> approvals
                    </div>
                    <div class="pending-link-actions">
                        <button class="approve-btn ${userVoted ? 'voted' : ''}" data-id="${link._id}" ${userVoted ? 'disabled' : ''}>
                            <i class="fas fa-check"></i> ${userVoted ? 'Approved' : 'Approve'}
                        </button>
                        <button class="reject-btn" data-id="${link._id}">
                            <i class="fas fa-times"></i> Flag
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach listeners
        container.querySelectorAll('.approve-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => handleApproveLink(btn.dataset.id));
        });

        container.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => handleFlagLink(btn.dataset.id));
        });
    }

    /**
     * Handle link submission
     */
    async function handleSubmitLink(e) {
        e.preventDefault();

        const formData = new FormData(submitForm);
        const data = {
            url: formData.get('url'),
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category')
        };

        try {
            await window.apiClient.post('/links', data);
            showNotification('Gateway submitted! It will appear after 3 community approvals.', 'success');
            closeSubmitModal();
            loadPendingLinks();
        } catch (error) {
            console.error('Failed to submit link:', error);
            showNotification(error.error || 'Failed to submit gateway. Please try again.', 'error');
        }
    }

    /**
     * Handle approving a pending link
     */
    async function handleApproveLink(linkId) {
        try {
            const response = await window.apiClient.post(`/links/${linkId}/approve`);

            if (response.approved) {
                showNotification('Gateway approved and is now live!', 'success');
                loadLinks();
            } else {
                showNotification(`Vote recorded! ${response.votesNeeded} more needed.`, 'info');
            }

            loadPendingLinks();
            renderPendingLinks();
        } catch (error) {
            console.error('Failed to approve link:', error);
            showNotification(error.error || 'Failed to approve. Please try again.', 'error');
        }
    }

    /**
     * Handle flagging a link
     */
    async function handleFlagLink(linkId) {
        if (!window.authManager?.isLoggedIn()) {
            window.authManager?.showLogin();
            return;
        }

        const reason = prompt('Why should this gateway be removed? (optional)');
        if (reason === null) return; // User cancelled

        try {
            await window.apiClient.post(`/links/${linkId}/flag`, { reason });
            showNotification('Flag submitted. Thank you for helping moderate.', 'success');
        } catch (error) {
            console.error('Failed to flag link:', error);
            showNotification(error.error || 'Failed to submit flag.', 'error');
        }
    }

    /**
     * Update pending notice visibility and count
     */
    function updatePendingNotice() {
        if (pendingLinks.length > 0 && window.authManager?.isLoggedIn()) {
            pendingNotice.style.display = 'flex';
            pendingCount.textContent = pendingLinks.length;
        } else {
            pendingNotice.style.display = 'none';
        }
    }

    /**
     * Update character count
     */
    function updateCharCount() {
        charCount.textContent = descriptionInput.value.length;
    }

    /**
     * Show loading state
     */
    function showLoading() {
        linksGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Opening the gateways...</p>
            </div>
        `;
        emptyState.style.display = 'none';
    }

    /**
     * Show error state
     */
    function showError(message) {
        linksGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Extract domain from URL
     */
    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
