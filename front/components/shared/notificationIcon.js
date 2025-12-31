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
            const token = localStorage.getItem('sessionToken');
            if (!token) {
                return;
            }

            this.container = document.getElementById('notificationIconContainer');
            if (!this.container) {
                return;
            }

            this.render();
            this.attachEventListeners();
            this.subscribeToNotificationEvents();
        }

        /**
         * Render the notification icon
         */
        render() {
            const unreadCount = window.NEXUSNotifications?.getUnreadCount() || 0;

            this.container.innerHTML = `
                <button class="notification-icon" id="notificationIconBtn" aria-label="Notifications">
                    <svg class="pigeon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <!-- Messenger Pigeon - Clean silhouette design -->
                        <!-- Body - plump pigeon shape -->
                        <path d="M6 14 C6 11 8 9 12 9 C16 9 18 11 18 14 C18 17 15 19 12 19 C9 19 6 17 6 14" fill="currentColor" opacity="0.15"/>
                        <!-- Head -->
                        <circle cx="17" cy="8" r="3" fill="currentColor" opacity="0.15"/>
                        <circle cx="17" cy="8" r="3"/>
                        <!-- Eye -->
                        <circle cx="18" cy="7.5" r="0.8" fill="currentColor"/>
                        <!-- Beak -->
                        <path d="M20 8 L22 9 L20 10"/>
                        <!-- Neck connecting head to body -->
                        <path d="M14.5 10 C15 11 15 12 14 13"/>
                        <!-- Wing raised in flight -->
                        <path d="M8 12 C6 10 4 9 2 10 C4 11 5 12 6 14" fill="currentColor" opacity="0.1"/>
                        <path d="M8 12 C6 10 4 9 2 10"/>
                        <path d="M7 13 C5 12 3 11 2 12"/>
                        <!-- Tail feathers -->
                        <path d="M6 16 L3 18 M7 17 L4 19 M8 17.5 L5.5 19.5"/>
                        <!-- Letter/scroll in beak -->
                        <rect x="21" y="7.5" width="2" height="3" rx="0.3" fill="currentColor" opacity="0.6" stroke="none"/>
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
                            <svg class="pigeon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <!-- Messenger Pigeon - Clean silhouette design -->
                                <!-- Body - plump pigeon shape -->
                                <path d="M6 14 C6 11 8 9 12 9 C16 9 18 11 18 14 C18 17 15 19 12 19 C9 19 6 17 6 14" fill="currentColor" opacity="0.15"/>
                                <!-- Head -->
                                <circle cx="17" cy="8" r="3" fill="currentColor" opacity="0.15"/>
                                <circle cx="17" cy="8" r="3"/>
                                <!-- Eye -->
                                <circle cx="18" cy="7.5" r="0.8" fill="currentColor"/>
                                <!-- Beak -->
                                <path d="M20 8 L22 9 L20 10"/>
                                <!-- Neck connecting head to body -->
                                <path d="M14.5 10 C15 11 15 12 14 13"/>
                                <!-- Wing raised in flight -->
                                <path d="M8 12 C6 10 4 9 2 10 C4 11 5 12 6 14" fill="currentColor" opacity="0.1"/>
                                <path d="M8 12 C6 10 4 9 2 10"/>
                                <path d="M7 13 C5 12 3 11 2 12"/>
                                <!-- Tail feathers -->
                                <path d="M6 16 L3 18 M7 17 L4 19 M8 17.5 L5.5 19.5"/>
                                <!-- Letter/scroll in beak -->
                                <rect x="21" y="7.5" width="2" height="3" rx="0.3" fill="currentColor" opacity="0.6" stroke="none"/>
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
                            <!-- Messenger Pigeon - Clean silhouette design -->
                            <!-- Body - plump pigeon shape -->
                            <path d="M6 14 C6 11 8 9 12 9 C16 9 18 11 18 14 C18 17 15 19 12 19 C9 19 6 17 6 14" fill="currentColor" opacity="0.15"/>
                            <!-- Head -->
                            <circle cx="17" cy="8" r="3" fill="currentColor" opacity="0.15"/>
                            <circle cx="17" cy="8" r="3"/>
                            <!-- Eye -->
                            <circle cx="18" cy="7.5" r="0.8" fill="currentColor"/>
                            <!-- Beak -->
                            <path d="M20 8 L22 9 L20 10"/>
                            <!-- Neck connecting head to body -->
                            <path d="M14.5 10 C15 11 15 12 14 13"/>
                            <!-- Wing raised in flight -->
                            <path d="M8 12 C6 10 4 9 2 10 C4 11 5 12 6 14" fill="currentColor" opacity="0.1"/>
                            <path d="M8 12 C6 10 4 9 2 10"/>
                            <path d="M7 13 C5 12 3 11 2 12"/>
                            <!-- Tail feathers -->
                            <path d="M6 16 L3 18 M7 17 L4 19 M8 17.5 L5.5 19.5"/>
                            <!-- Letter/scroll in beak -->
                            <rect x="21" y="7.5" width="2" height="3" rx="0.3" fill="currentColor" opacity="0.6" stroke="none"/>
                        </svg>
                        <p>No messages from the eternal realm</p>
                        <small>Your courier pigeon will deliver notifications here</small>
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
