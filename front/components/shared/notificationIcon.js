/**
 * Notification Icon Component
 * Renders the courier pigeon notification icon in the header
 * Handles dropdown (desktop) and modal (mobile) displays
 * Version: 1.0
 */

(function() {
    'use strict';

    class NotificationIcon {
        constructor() {
            this.container = null;
            this.dropdown = null;
            this.modal = null;
            this.isDropdownOpen = false;
            this.isModalOpen = false;
        }

        /**
         * Initialize the notification icon
         */
        init() {
            console.log('[NotificationIcon] Initializing...');

            const token = localStorage.getItem('sessionToken');
            if (!token) {
                console.log('[NotificationIcon] User not logged in, hiding notification icon');
                return;
            }

            console.log('[NotificationIcon] Token found, looking for container...');

            this.container = document.getElementById('notificationIconContainer');
            if (!this.container) {
                console.error('[NotificationIcon] Container #notificationIconContainer not found in DOM!');
                console.log('[NotificationIcon] Available elements:', document.querySelectorAll('[id*="notification"]'));
                return;
            }

            console.log('[NotificationIcon] Container found, rendering icon...');
            this.render();
            this.attachEventListeners();
            this.subscribeToNotificationEvents();
            console.log('[NotificationIcon] Initialization complete!');
        }

        /**
         * Render the notification icon
         */
        render() {
            console.log('[NotificationIcon] Rendering icon...');
            const unreadCount = window.NEXUSNotifications?.getUnreadCount() || 0;
            console.log('[NotificationIcon] Unread count:', unreadCount);

            this.container.innerHTML = `
                <button class="notification-icon" id="notificationIconBtn" aria-label="Notifications">
                    <svg class="pigeon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <!-- Pigeon body -->
                        <ellipse cx="12" cy="14" rx="4" ry="5" fill="currentColor" opacity="0.2"/>
                        <!-- Pigeon head -->
                        <circle cx="13" cy="7.5" r="2.5" fill="currentColor" opacity="0.2"/>
                        <!-- Eye -->
                        <circle cx="14" cy="7" r="0.6" fill="currentColor"/>
                        <!-- Beak -->
                        <path d="M15.5 7.5 L17.5 7" stroke-width="1.5"/>
                        <!-- Wing (left) -->
                        <path d="M10 12 Q7 11 5 13" stroke-width="1.8"/>
                        <path d="M9 13.5 Q6.5 13 5 15" stroke-width="1.5" opacity="0.7"/>
                        <!-- Tail feathers -->
                        <path d="M9 17 L6 19" stroke-width="1.5"/>
                        <path d="M9 18 L6.5 20.5" stroke-width="1.5" opacity="0.7"/>
                        <!-- Feet -->
                        <path d="M11 18.5 L10.5 20.5" stroke-width="1.2"/>
                        <path d="M13 18.5 L13.5 20.5" stroke-width="1.2"/>
                        <!-- Letter scroll (showing it's a carrier pigeon) -->
                        <rect x="8" y="14.5" width="3" height="1.5" rx="0.3" stroke-width="1" opacity="0.9"/>
                    </svg>
                    ${unreadCount > 0 ? `<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                </button>
            `;

            // Create dropdown (desktop)
            this.createDropdown();

            // Create modal (mobile)
            this.createModal();
        }

        /**
         * Create notification dropdown (desktop)
         */
        createDropdown() {
            // Remove existing dropdown if present
            const existing = document.getElementById('notificationDropdown');
            if (existing) existing.remove();

            this.dropdown = document.createElement('div');
            this.dropdown.id = 'notificationDropdown';
            this.dropdown.className = 'notification-dropdown';
            this.dropdown.style.display = 'none';

            document.body.appendChild(this.dropdown);
        }

        /**
         * Create notification modal (mobile)
         */
        createModal() {
            // Remove existing modal if present
            const existing = document.getElementById('notificationModal');
            if (existing) existing.remove();

            this.modal = document.createElement('div');
            this.modal.id = 'notificationModal';
            this.modal.className = 'notification-modal';
            this.modal.style.display = 'none';

            this.modal.innerHTML = `
                <div class="notification-modal-content">
                    <div class="notification-modal-header">
                        <h2>
                            <svg class="pigeon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <ellipse cx="12" cy="14" rx="4" ry="5" fill="currentColor" opacity="0.2"/>
                                <circle cx="13" cy="7.5" r="2.5" fill="currentColor" opacity="0.2"/>
                                <circle cx="14" cy="7" r="0.6" fill="currentColor"/>
                                <path d="M15.5 7.5 L17.5 7" stroke-width="1.5"/>
                                <path d="M10 12 Q7 11 5 13" stroke-width="1.8"/>
                                <path d="M9 13.5 Q6.5 13 5 15" stroke-width="1.5" opacity="0.7"/>
                                <path d="M9 17 L6 19" stroke-width="1.5"/>
                                <path d="M9 18 L6.5 20.5" stroke-width="1.5" opacity="0.7"/>
                                <path d="M11 18.5 L10.5 20.5" stroke-width="1.2"/>
                                <path d="M13 18.5 L13.5 20.5" stroke-width="1.2"/>
                                <rect x="8" y="14.5" width="3" height="1.5" rx="0.3" stroke-width="1" opacity="0.9"/>
                            </svg>
                            Courier Pigeons
                        </h2>
                        <button class="notification-modal-close" aria-label="Close notifications">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="notification-modal-actions">
                        <button class="notification-mark-all-read" id="markAllReadBtn">
                            <i class="fas fa-check-double"></i> Mark All as Read
                        </button>
                    </div>
                    <div class="notification-modal-body" id="notificationModalBody">
                        <div class="notification-loading">
                            <i class="fas fa-spinner fa-spin"></i> Loading notifications...
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(this.modal);
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            const iconBtn = document.getElementById('notificationIconBtn');
            if (!iconBtn) return;

            // Toggle notifications on click
            iconBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotifications();
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isDropdownOpen && !this.dropdown.contains(e.target) && e.target.id !== 'notificationIconBtn') {
                    this.closeDropdown();
                }
            });

            // Modal close button
            const modalCloseBtn = this.modal.querySelector('.notification-modal-close');
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', () => this.closeModal());
            }

            // Mark all as read button
            const markAllBtn = document.getElementById('markAllReadBtn');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', () => this.markAllAsRead());
            }

            // Close modal on overlay click
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        /**
         * Subscribe to notification events
         */
        subscribeToNotificationEvents() {
            if (!window.NEXUSNotifications) return;

            // Update badge count when notifications change
            window.NEXUSNotifications.on('countUpdate', (count) => {
                this.updateBadge(count);
            });

            // Refresh list when new notification arrives
            window.NEXUSNotifications.on('newNotification', () => {
                if (this.isDropdownOpen || this.isModalOpen) {
                    this.renderNotificationList();
                }
            });

            // Initial load
            window.NEXUSNotifications.on('notificationsLoaded', () => {
                const count = window.NEXUSNotifications.getUnreadCount();
                this.updateBadge(count);
            });
        }

        /**
         * Toggle notifications (dropdown on desktop, modal on mobile)
         */
        toggleNotifications() {
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                if (this.isModalOpen) {
                    this.closeModal();
                } else {
                    this.openModal();
                }
            } else {
                if (this.isDropdownOpen) {
                    this.closeDropdown();
                } else {
                    this.openDropdown();
                }
            }
        }

        /**
         * Open dropdown (desktop)
         */
        openDropdown() {
            const iconBtn = document.getElementById('notificationIconBtn');
            const rect = iconBtn.getBoundingClientRect();

            this.dropdown.style.top = `${rect.bottom + 10}px`;
            this.dropdown.style.right = `${window.innerWidth - rect.right}px`;
            this.dropdown.style.display = 'block';

            this.isDropdownOpen = true;
            this.renderNotificationList();

            // Animate in
            setTimeout(() => this.dropdown.classList.add('open'), 10);
        }

        /**
         * Close dropdown
         */
        closeDropdown() {
            this.dropdown.classList.remove('open');
            setTimeout(() => {
                this.dropdown.style.display = 'none';
                this.isDropdownOpen = false;
            }, 200);
        }

        /**
         * Open modal (mobile)
         */
        openModal() {
            this.modal.style.display = 'flex';
            this.isModalOpen = true;
            this.renderNotificationList();

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Animate in
            setTimeout(() => this.modal.classList.add('open'), 10);
        }

        /**
         * Close modal
         */
        closeModal() {
            this.modal.classList.remove('open');
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.isModalOpen = false;
                document.body.style.overflow = '';
            }, 300);
        }

        /**
         * Render notification list
         */
        renderNotificationList() {
            const notifications = window.NEXUSNotifications?.getNotifications() || [];
            const isMobile = this.isModalOpen;
            const container = isMobile
                ? document.getElementById('notificationModalBody')
                : this.dropdown;

            if (!container) return;

            if (notifications.length === 0) {
                container.innerHTML = `
                    <div class="notification-empty">
                        <svg class="pigeon-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <ellipse cx="12" cy="14" rx="4" ry="5" fill="currentColor" opacity="0.2"/>
                            <circle cx="13" cy="7.5" r="2.5" fill="currentColor" opacity="0.2"/>
                            <circle cx="14" cy="7" r="0.6" fill="currentColor"/>
                            <path d="M15.5 7.5 L17.5 7"/>
                            <path d="M10 12 Q7 11 5 13"/>
                            <path d="M9 13.5 Q6.5 13 5 15" opacity="0.7"/>
                            <path d="M9 17 L6 19"/>
                            <path d="M9 18 L6.5 20.5" opacity="0.7"/>
                            <path d="M11 18.5 L10.5 20.5" stroke-width="1.2"/>
                            <path d="M13 18.5 L13.5 20.5" stroke-width="1.2"/>
                            <rect x="8" y="14.5" width="3" height="1.5" rx="0.3" opacity="0.9"/>
                        </svg>
                        <p>No pigeons have arrived yet</p>
                        <small>You'll be notified when something happens</small>
                    </div>
                `;
                return;
            }

            const listHTML = notifications.map(notif => this.renderNotificationItem(notif)).join('');

            const html = `
                ${!isMobile ? `
                    <div class="notification-dropdown-header">
                        <h3>Notifications</h3>
                        <button class="notification-mark-all-read-small" onclick="window.NEXUS.NotificationIcon.markAllAsRead()">
                            Mark all as read
                        </button>
                    </div>
                ` : ''}
                <div class="notification-list">
                    ${listHTML}
                </div>
            `;

            container.innerHTML = html;
        }

        /**
         * Render individual notification item
         */
        renderNotificationItem(notification) {
            const timeAgo = this.getTimeAgo(new Date(notification.createdAt));
            const unreadClass = notification.read ? '' : 'unread';

            return `
                <div class="notification-item ${unreadClass}" data-id="${notification._id}">
                    <div class="notification-item-content" onclick="window.NEXUS.NotificationIcon.handleNotificationClick('${notification._id}', '${notification.link || ''}')">
                        <div class="notification-item-header">
                            <span class="notification-type-icon">${this.getTypeIcon(notification.type)}</span>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                        <div class="notification-item-title">${this.escapeHtml(notification.title)}</div>
                        <div class="notification-item-message">${this.escapeHtml(notification.message)}</div>
                    </div>
                    ${!notification.read ? `
                        <button class="notification-mark-read" onclick="event.stopPropagation(); window.NEXUS.NotificationIcon.markAsRead('${notification._id}')" aria-label="Mark as read">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Get icon for notification type
         */
        getTypeIcon(type) {
            const icons = {
                'message': '<i class="fas fa-envelope"></i>',
                'comment_reply': '<i class="fas fa-reply"></i>',
                'chronicle_comment': '<i class="fas fa-comment"></i>',
                'echo_comment': '<i class="fas fa-comment-dots"></i>',
                'governance_update': '<i class="fas fa-gavel"></i>',
                'moderation_action': '<i class="fas fa-shield-alt"></i>',
                'admin_broadcast': '<i class="fas fa-bullhorn"></i>',
                'soul_interaction': '<i class="fas fa-users"></i>',
                'mention': '<i class="fas fa-at"></i>'
            };
            return icons[type] || '<i class="fas fa-bell"></i>';
        }

        /**
         * Handle notification click
         */
        handleNotificationClick(notificationId, link) {
            window.NEXUSNotifications.markAsRead(notificationId);

            if (link) {
                window.location.href = link;
            }

            this.closeDropdown();
            this.closeModal();
        }

        /**
         * Mark single notification as read
         */
        async markAsRead(notificationId) {
            await window.NEXUSNotifications.markAsRead(notificationId);
            this.renderNotificationList();
        }

        /**
         * Mark all notifications as read
         */
        async markAllAsRead() {
            await window.NEXUSNotifications.markAllAsRead();
            this.renderNotificationList();
        }

        /**
         * Update badge count
         */
        updateBadge(count) {
            const iconBtn = document.getElementById('notificationIconBtn');
            if (!iconBtn) return;

            const existingBadge = iconBtn.querySelector('.notification-badge');

            if (count > 0) {
                const badgeText = count > 99 ? '99+' : count;
                if (existingBadge) {
                    existingBadge.textContent = badgeText;
                } else {
                    const badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    badge.textContent = badgeText;
                    iconBtn.appendChild(badge);
                }
            } else {
                if (existingBadge) {
                    existingBadge.remove();
                }
            }
        }

        /**
         * Get time ago string
         */
        getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);

            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60
            };

            for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                const interval = Math.floor(seconds / secondsInUnit);
                if (interval >= 1) {
                    return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
                }
            }

            return 'just now';
        }

        /**
         * Escape HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Initialize and expose globally
    const notificationIcon = new NotificationIcon();

    if (!window.NEXUS) window.NEXUS = {};
    window.NEXUS.NotificationIcon = notificationIcon;
    window.NEXUS.initNotificationIcon = () => notificationIcon.init();

})();
