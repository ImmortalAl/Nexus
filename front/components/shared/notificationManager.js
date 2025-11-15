/**
 * Notification Manager
 * Handles notification fetching, WebSocket listening, and toast displays
 * Part of the Immortal Nexus Courier Pigeon Notification System
 * Version: 1.0
 */

(function() {
    'use strict';

    const API_BASE = 'https://nexus-ytrg.onrender.com/api';

    class NotificationManager {
        constructor() {
            this.notifications = [];
            this.unreadCount = 0;
            this.wsConnection = null;
            this.eventHandlers = {
                'newNotification': [],
                'countUpdate': [],
                'notificationsLoaded': []
            };

            // Initialize if user is logged in
            this.init();
        }

        /**
         * Initialize the notification manager
         */
        async init() {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('[NotificationManager] User not logged in, skipping initialization');
                return;
            }

            console.log('[NotificationManager] Initializing...');

            // Fetch initial notifications
            await this.fetchNotifications();

            // Connect to WebSocket for real-time updates
            this.connectWebSocket();
        }

        /**
         * Fetch notifications from API
         */
        async fetchNotifications(options = {}) {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const {
                    limit = 50,
                    skip = 0,
                    unreadOnly = false
                } = options;

                const queryParams = new URLSearchParams({
                    limit,
                    skip,
                    unreadOnly: unreadOnly.toString()
                });

                const response = await fetch(`${API_BASE}/notifications?${queryParams}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                this.notifications = data.notifications || [];
                this.unreadCount = data.unreadCount || 0;

                console.log(`[NotificationManager] Loaded ${this.notifications.length} notifications, ${this.unreadCount} unread`);

                this.trigger('notificationsLoaded', {
                    notifications: this.notifications,
                    unreadCount: this.unreadCount
                });

                this.trigger('countUpdate', this.unreadCount);

                return data;
            } catch (error) {
                console.error('[NotificationManager] Fetch error:', error);
                return null;
            }
        }

        /**
         * Connect to WebSocket for real-time notifications
         */
        connectWebSocket() {
            const token = localStorage.getItem('token');
            if (!token) return;

            // WebSocket URL
            const wsUrl = `wss://nexus-ytrg.onrender.com?token=${token}`;

            try {
                this.wsConnection = new WebSocket(wsUrl);

                this.wsConnection.onopen = () => {
                    console.log('[NotificationManager] WebSocket connected');
                };

                this.wsConnection.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    } catch (error) {
                        console.error('[NotificationManager] WebSocket message parse error:', error);
                    }
                };

                this.wsConnection.onerror = (error) => {
                    console.error('[NotificationManager] WebSocket error:', error);
                };

                this.wsConnection.onclose = () => {
                    console.log('[NotificationManager] WebSocket disconnected, reconnecting in 5s...');
                    setTimeout(() => this.connectWebSocket(), 5000);
                };
            } catch (error) {
                console.error('[NotificationManager] WebSocket connection error:', error);
            }
        }

        /**
         * Handle incoming WebSocket messages
         */
        handleWebSocketMessage(data) {
            switch (data.type) {
                case 'notification':
                    this.handleNewNotification(data.notification);
                    break;
                case 'notificationCount':
                    this.handleCountUpdate(data.unreadCount);
                    break;
                default:
                    console.log('[NotificationManager] Unknown WebSocket message type:', data.type);
            }
        }

        /**
         * Handle new real-time notification
         */
        handleNewNotification(notification) {
            console.log('[NotificationManager] New notification received:', notification);

            // Add to notifications array
            this.notifications.unshift(notification);
            this.unreadCount++;

            // Show toast notification
            this.showToast(notification);

            // Trigger events
            this.trigger('newNotification', notification);
            this.trigger('countUpdate', this.unreadCount);
        }

        /**
         * Handle notification count update
         */
        handleCountUpdate(count) {
            this.unreadCount = count;
            this.trigger('countUpdate', count);
        }

        /**
         * Show toast notification
         */
        showToast(notification) {
            // Create toast element
            const toast = document.createElement('div');
            toast.className = 'nexus-notification-toast';
            toast.innerHTML = `
                <div class="toast-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8c-2.5 0-4.5 1.5-5 3.5-.3 1.2-.2 2.5.5 3.5.7 1 2 1.5 3.5 1.5 1.2 0 2.3-.3 3-.8"/>
                        <circle cx="13" cy="7" r="2"/>
                        <path d="M14.5 6.5l2-1"/>
                        <path d="M8 11c-1.5.5-2.5 1.5-3 2.5-.3.7-.3 1.5 0 2.2"/>
                        <path d="M7.5 13.5l-2 2"/>
                        <path d="M7 12.5l-2.5 1"/>
                        <path d="M7 14.5l-1.5 2.5"/>
                        <path d="M11 16.5v2"/>
                        <path d="M13 16.5v2"/>
                        <path d="M10 10l1-2h2l1 2"/>
                        <circle cx="13.5" cy="6.8" r="0.4" fill="currentColor"/>
                    </svg>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${this.escapeHtml(notification.title)}</div>
                    <div class="toast-message">${this.escapeHtml(notification.message)}</div>
                </div>
                <button class="toast-close" aria-label="Close notification">×</button>
            `;

            // Add click handler to navigate
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('toast-close')) {
                    if (notification.link) {
                        window.location.href = notification.link;
                    }
                    this.markAsRead(notification._id);
                }
            });

            // Close button handler
            toast.querySelector('.toast-close').addEventListener('click', (e) => {
                e.stopPropagation();
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 300);
            });

            // Add to document
            let toastContainer = document.querySelector('.nexus-notification-toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'nexus-notification-toast-container';
                document.body.appendChild(toastContainer);
            }

            toastContainer.appendChild(toast);

            // Auto-remove after 7 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.add('toast-hiding');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 7000);
        }

        /**
         * Mark notification as read
         */
        async markAsRead(notificationId) {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Update local state
                    const notification = this.notifications.find(n => n._id === notificationId);
                    if (notification && !notification.read) {
                        notification.read = true;
                        notification.readAt = new Date().toISOString();
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                        this.trigger('countUpdate', this.unreadCount);
                    }
                }
            } catch (error) {
                console.error('[NotificationManager] Mark as read error:', error);
            }
        }

        /**
         * Mark all notifications as read
         */
        async markAllAsRead() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_BASE}/notifications/read-all`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Update local state
                    this.notifications.forEach(n => {
                        n.read = true;
                        n.readAt = new Date().toISOString();
                    });
                    this.unreadCount = 0;
                    this.trigger('countUpdate', this.unreadCount);
                }
            } catch (error) {
                console.error('[NotificationManager] Mark all as read error:', error);
            }
        }

        /**
         * Delete a notification
         */
        async deleteNotification(notificationId) {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Remove from local state
                    const index = this.notifications.findIndex(n => n._id === notificationId);
                    if (index !== -1) {
                        const notification = this.notifications[index];
                        if (!notification.read) {
                            this.unreadCount = Math.max(0, this.unreadCount - 1);
                        }
                        this.notifications.splice(index, 1);
                        this.trigger('countUpdate', this.unreadCount);
                    }
                }
            } catch (error) {
                console.error('[NotificationManager] Delete notification error:', error);
            }
        }

        /**
         * Register event handler
         */
        on(event, handler) {
            if (this.eventHandlers[event]) {
                this.eventHandlers[event].push(handler);
            }
        }

        /**
         * Trigger event handlers
         */
        trigger(event, data) {
            if (this.eventHandlers[event]) {
                this.eventHandlers[event].forEach(handler => handler(data));
            }
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
         * Get unread count
         */
        getUnreadCount() {
            return this.unreadCount;
        }

        /**
         * Get all notifications
         */
        getNotifications() {
            return this.notifications;
        }
    }

    // Create global instance
    window.NEXUSNotifications = new NotificationManager();

})();
