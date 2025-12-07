/**
 * Governance Indicator Component
 * Shows active voting proposals in the header
 * Provides quick access to democratic participation
 * Version: 1.0
 */

(function() {
    'use strict';

    class GovernanceIndicator {
        constructor() {
            this.container = null;
            this.activeProposals = [];
            this.refreshInterval = null;
        }

        /**
         * Initialize the governance indicator
         */
        async init() {
            // Only show for logged-in users
            const token = localStorage.getItem('sessionToken');
            if (!token) {
                return;
            }

            // Create container in header-controls if it doesn't exist
            this.createContainer();

            // Fetch initial data
            await this.fetchActiveProposals();

            // Refresh every 5 minutes
            this.refreshInterval = setInterval(() => this.fetchActiveProposals(), 5 * 60 * 1000);

            // Add badge to Echoes Unbound nav link if there are active votes
            this.updateNavBadge();
        }

        /**
         * Create the indicator container in the header
         */
        createContainer() {
            const headerControls = document.querySelector('.header-controls');
            if (!headerControls) return;

            // Check if already exists
            if (document.getElementById('governanceIndicator')) return;

            this.container = document.createElement('div');
            this.container.id = 'governanceIndicator';
            this.container.className = 'governance-indicator';
            this.container.style.display = 'none';

            // Insert before notification icon
            const notificationContainer = document.getElementById('notificationIconContainer');
            if (notificationContainer) {
                headerControls.insertBefore(this.container, notificationContainer);
            } else {
                headerControls.insertBefore(this.container, headerControls.firstChild);
            }
        }

        /**
         * Fetch active governance proposals from API
         */
        async fetchActiveProposals() {
            try {
                const response = await window.apiClient?.get('/governance/proposals?status=voting');
                this.activeProposals = response?.proposals || [];
                this.render();
                this.updateNavBadge();
            } catch (error) {
                console.error('[GovernanceIndicator] Failed to fetch proposals:', error);
            }
        }

        /**
         * Render the governance indicator
         */
        render() {
            if (!this.container) return;

            const count = this.activeProposals.length;

            if (count === 0) {
                this.container.style.display = 'none';
                return;
            }

            this.container.style.display = 'flex';
            this.container.innerHTML = `
                <a href="/pages/messageboard.html#governance" class="governance-indicator-btn" title="${count} active vote${count > 1 ? 's' : ''}">
                    <i class="fas fa-vote-yea"></i>
                    <span class="governance-badge">${count}</span>
                </a>
            `;
        }

        /**
         * Update the Echoes Unbound navigation link with a badge
         */
        updateNavBadge() {
            const count = this.activeProposals.length;

            // Find Echoes Unbound link in navigation
            const navLinks = document.querySelectorAll('nav a, .mobile-nav a');
            navLinks.forEach(link => {
                if (link.textContent.includes('Echoes') || link.href?.includes('messageboard')) {
                    // Remove existing badge
                    const existingBadge = link.querySelector('.nav-vote-badge');
                    if (existingBadge) existingBadge.remove();

                    // Add new badge if there are active votes
                    if (count > 0) {
                        const badge = document.createElement('span');
                        badge.className = 'nav-vote-badge';
                        badge.textContent = count;
                        badge.title = `${count} active governance vote${count > 1 ? 's' : ''}`;
                        link.appendChild(badge);
                    }
                }
            });
        }

        /**
         * Cleanup on logout
         */
        destroy() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
            if (this.container) {
                this.container.remove();
            }
            // Remove nav badges
            document.querySelectorAll('.nav-vote-badge').forEach(badge => badge.remove());
        }
    }

    // Create global instance
    const governanceIndicator = new GovernanceIndicator();

    // Initialize when DOM is ready and after auth
    function initGovernance() {
        if (window.authManager?.isLoggedIn()) {
            governanceIndicator.init();
        }
    }

    // Listen for auth events
    window.addEventListener('nexus:auth:login', () => {
        setTimeout(() => governanceIndicator.init(), 500);
    });

    window.addEventListener('nexus:auth:logout', () => {
        governanceIndicator.destroy();
    });

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initGovernance, 1000);
        });
    } else {
        setTimeout(initGovernance, 1000);
    }

    // Expose globally
    window.NEXUSGovernance = governanceIndicator;
})();
