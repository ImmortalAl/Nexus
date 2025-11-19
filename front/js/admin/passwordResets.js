// Password Reset Management JavaScript
// Handles viewing, approving, and denying password reset requests

const PasswordResetManager = {
    apiBaseUrl: null,
    allResets: [],
    filteredResets: [],
    currentFilter: 'all',
    refreshInterval: null,

    init() {
        try {
            this.apiBaseUrl = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';
            this.setupEventListeners();
            this.loadResetRequests();

            // Auto-refresh every 30 seconds
            this.refreshInterval = setInterval(() => {
                this.loadResetRequests(true); // Silent refresh
            }, 30000);
        } catch (error) {
            console.error('PasswordResetManager: Initialization failed:', error);
            this.showError('Password Reset Manager initialization failed', error.message);
        }
    },

    setupEventListeners() {
        // Filter dropdown
        const filterSelect = document.getElementById('resetFilterStatus');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterResets(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshResetsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadResetRequests());
        }
    },

    async loadResetRequests(silent = false) {
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No authentication token');

            const tbody = document.getElementById('resetsTableBody');
            const mobileCards = document.getElementById('mobileResetCards');

            if (!silent) {
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading reset requests...</td></tr>';
                }
            }

            // Fetch all users with reset requests
            const response = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status} ${response.statusText}`);
            }

            const allUsers = await response.json();

            // Filter users who have reset requests
            this.allResets = allUsers.filter(user =>
                user.resetRequestId && user.resetRequestedAt
            );

            this.filteredResets = [...this.allResets];
            this.renderResetsTable();

        } catch (error) {
            console.error('PasswordResetManager: Error loading resets:', error);
            if (!silent) {
                this.showError('Failed to load reset requests', error.message);
            }
        }
    },

    filterResets(filter) {
        this.currentFilter = filter;

        if (filter === 'all') {
            this.filteredResets = [...this.allResets];
        } else {
            this.filteredResets = this.allResets.filter(reset => reset.resetStatus === filter);
        }

        this.renderResetsTable();
    },

    renderResetsTable() {
        const tbody = document.getElementById('resetsTableBody');
        const mobileCards = document.getElementById('mobileResetCards');

        if (this.filteredResets.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No reset requests found</td></tr>';
            }
            if (mobileCards) {
                mobileCards.innerHTML = '<div class="no-data">No reset requests found</div>';
            }
            return;
        }

        // Sort by most recent first
        const sortedResets = this.filteredResets.sort((a, b) =>
            new Date(b.resetRequestedAt) - new Date(a.resetRequestedAt)
        );

        // Render desktop table
        if (tbody) {
            tbody.innerHTML = sortedResets.map(reset => {
                const timeInfo = this.calculateTimeRemaining(reset);
                const statusBadge = this.getStatusBadge(reset.resetStatus);
                const actions = this.getActionButtons(reset);

                return `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 1rem;">${reset.username}</td>
                        <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem; color: var(--accent);">${reset.resetRequestId}</td>
                        <td style="padding: 1rem;">${this.formatDate(reset.resetRequestedAt)}</td>
                        <td style="padding: 1rem;">${timeInfo}</td>
                        <td style="padding: 1rem;">${statusBadge}</td>
                        <td style="padding: 1rem;">${actions}</td>
                    </tr>
                `;
            }).join('');
        }

        // Render mobile cards
        if (mobileCards) {
            mobileCards.innerHTML = sortedResets.map(reset => {
                const timeInfo = this.calculateTimeRemaining(reset);
                const statusBadge = this.getStatusBadge(reset.resetStatus);
                const actions = this.getActionButtons(reset);

                return `
                    <div class="mobile-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="color: var(--accent);">${reset.username}</strong>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                            Request ID: <span style="font-family: monospace;">${reset.resetRequestId}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                            Requested: ${this.formatDate(reset.resetRequestedAt)}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            ${timeInfo}
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${actions}
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    calculateTimeRemaining(reset) {
        const requestedAt = new Date(reset.resetRequestedAt).getTime();
        const now = Date.now();
        const elapsed = now - requestedAt;
        const thirtyMinutes = 30 * 60 * 1000;

        if (reset.resetStatus === 'pending') {
            const remaining = Math.max(0, thirtyMinutes - elapsed);
            const minutes = Math.ceil(remaining / 60000);

            if (minutes <= 0) {
                return '<span style="color: #4caf50; font-weight: 600;">Ready for auto-approval</span>';
            }
            return `<span style="color: #ffc107;">${minutes} minute(s) remaining</span>`;
        } else if (reset.resetStatus === 'active') {
            return '<span style="color: #4caf50;">✓ Approved</span>';
        } else if (reset.resetStatus === 'denied') {
            return '<span style="color: #f44336;">✗ Denied</span>';
        }
        return '-';
    },

    getStatusBadge(status) {
        const badges = {
            pending: '<span class="status-badge" style="background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; color: #ffc107; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">⏳ Pending</span>',
            active: '<span class="status-badge" style="background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50; color: #4caf50; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">✓ Active</span>',
            denied: '<span class="status-badge" style="background: rgba(244, 67, 54, 0.2); border: 1px solid #f44336; color: #f44336; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">✗ Denied</span>',
            approved: '<span class="status-badge" style="background: rgba(33, 150, 243, 0.2); border: 1px solid #2196f3; color: #2196f3; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Approved</span>'
        };
        return badges[status] || badges.pending;
    },

    getActionButtons(reset) {
        const userId = reset._id || reset.id;

        if (reset.resetStatus === 'pending') {
            return `
                <button class="btn btn-sm btn-success" onclick="PasswordResetManager.approveReset('${userId}', '${reset.username}')" style="background: #4caf50; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
                    <i class="fas fa-check"></i> Approve Now
                </button>
                <button class="btn btn-sm btn-danger" onclick="PasswordResetManager.denyReset('${userId}', '${reset.username}')" style="background: #f44336; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-times"></i> Deny
                </button>
            `;
        } else if (reset.resetStatus === 'active') {
            return `
                <button class="btn btn-sm btn-info" onclick="PasswordResetManager.viewResetLink('${reset.resetRequestId}')" style="background: #2196f3; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-eye"></i> View Link
                </button>
            `;
        } else if (reset.resetStatus === 'denied') {
            return `
                <button class="btn btn-sm btn-warning" onclick="PasswordResetManager.approveReset('${userId}', '${reset.username}')" style="background: #ffc107; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Re-approve
                </button>
            `;
        }
        return '-';
    },

    async approveReset(userId, username) {
        if (!confirm(`Approve password reset for ${username}?\n\nThis will instantly generate a reset link and make it available to the user.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/${userId}/approve-password-reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to approve reset: ${response.status}`);
            }

            const result = await response.json();
            this.showSuccess(`Password reset approved for ${username}. User can now access their reset link.`);

            // Log the reset token for admin reference
            console.log(`[Password Reset Approved] Token for ${username}:`, result.resetToken);
            console.log(`[Password Reset Approved] Expires:`, result.expiresAt);

            // Reload the table
            await this.loadResetRequests();

        } catch (error) {
            console.error('Error approving reset:', error);
            this.showError('Failed to approve password reset', error.message);
        }
    },

    async denyReset(userId, username) {
        if (!confirm(`Deny password reset request for ${username}?\n\nThe user will need to submit a new request.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resetStatus: 'denied',
                    passwordResetRequested: false
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to deny reset: ${response.status}`);
            }

            this.showSuccess(`Password reset denied for ${username}.`);
            await this.loadResetRequests();

        } catch (error) {
            console.error('Error denying reset:', error);
            this.showError('Failed to deny password reset', error.message);
        }
    },

    async viewResetLink(requestId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/reset-status/${requestId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch reset link');
            }

            if (data.resetLink) {
                const message = `Reset Link for ${data.username}:\n\n${data.resetLink}\n\nExpires: ${new Date(data.expiresAt).toLocaleString()}\n\nClick OK to copy to clipboard.`;

                if (confirm(message)) {
                    navigator.clipboard.writeText(data.resetLink).then(() => {
                        alert('Reset link copied to clipboard!');
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        prompt('Copy this link:', data.resetLink);
                    });
                }
            } else {
                alert('No reset link available for this request.');
            }

        } catch (error) {
            console.error('Error viewing reset link:', error);
            this.showError('Failed to retrieve reset link', error.message);
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showError(message, details = '') {
        console.error('Password Reset Manager Error:', message, details);

        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.showError) {
            AdminDashboard.showError(message, details);
        } else {
            alert(`Error: ${message}${details ? ` - ${details}` : ''}`);
        }
    },

    showSuccess(message) {
        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.showSuccess) {
            AdminDashboard.showSuccess(message);
        } else {
            alert(`Success: ${message}`);
        }
    },

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
};

// Make it globally available
window.PasswordResetManager = PasswordResetManager;
