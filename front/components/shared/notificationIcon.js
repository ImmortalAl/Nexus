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
                    <svg class="pigeon-icon" viewBox="0 0 24 24" fill="none">
                        <!-- Streamline Envelope Pigeon - messenger pigeon with letter -->
                        <path fill="currentColor" d="M10.306 12.482c-.15-.11-.27-.1-.791.15c-.52.25-1.241.67-2.693 1.431a.35.35 0 0 0-.16.48a.34.34 0 0 0 .47.16c1.002-.46 1.772-.81 2.253-1c-.18.59-.48 1.441-.821 2.272q-.405 1.031-.94 2.002a1.8 1.8 0 0 1-.411.56h-.13l-.38-.06c-.361-.09-.721-.22-.922-.28l-4.153-1.301l1.33-.571a.32.32 0 0 0 .191-.41a.31.31 0 0 0-.4-.18c-.64.22-2.522.92-2.543.93a.32.32 0 0 0-.19.4q.28.862.44 1.752c.18.911.311 1.822.461 2.733q.054.661.18 1.31c.06.3.223.57.46.762c.237.147.513.217.791.2q.652-.08 1.272-.3c.68-.2 1.36-.42 2.001-.651c.64-.23 1.332-.48 2.002-.73a75 75 0 0 0 2.502-1.002c.5-.22 1.001-.46 1.632-.76a4.3 4.3 0 0 0 1.321-.921c.219-.248.334-.57.32-.901a12 12 0 0 0-1.23-3.193a11.7 11.7 0 0 0-1.863-2.882m1.721 6.465a4 4 0 0 1-.76.41L7.152 21.01l-3.913 1.45c-.2.07-.48.2-.75.27s-.43.281-.53-.45c-.081-.36-.121-.74-.151-.91c-.22-.901-.4-1.812-.64-2.713q-.136-.57-.33-1.12c.57.23 1.57.64 2.571 1c.771.29 1.522.57 2.062.75q.707.272 1.451.401c.343.07.698.013 1.001-.16a6.2 6.2 0 0 0 1.462-2.522q.612-1.592 1-3.253c.3.51.661 1.25 1.002 2.002a11 11 0 0 1 1 2.872c-.04.13-.21.22-.36.32"/>
                        <path fill="currentColor" d="M15.49 1.892c.22.36.295.789.21 1.201c0 .12-.44.69-.54.951a.62.62 0 0 0 0 .53c.083.152.203.28.35.37c.18.121.42.181.57.281c.298.2.55.458.741.76a.82.82 0 0 1 .13.802q-.096.182-.25.32a2 2 0 0 1-.37.24a2.4 2.4 0 0 0-.43.19a.45.45 0 0 0-.22.3a.75.75 0 0 0 .19.561c.21.26.64.59.72.8a.88.88 0 0 1-.11.861c-.403.43-.89.77-1.431 1.001a.31.31 0 0 0-.14.42a.32.32 0 0 0 .43.14a5 5 0 0 0 1.691-1.1a1.52 1.52 0 0 0 .25-1.522a3.3 3.3 0 0 0-.49-1q.237-.114.44-.28c.19-.147.346-.331.461-.541a1.5 1.5 0 0 0 0-1.371a3.4 3.4 0 0 0-1.13-1.392l-.291-.16c.162-.268.287-.558.37-.86a2.93 2.93 0 0 0-.4-2.403a1.84 1.84 0 0 0-1.632-.8a2.19 2.19 0 0 0-1.861 1.16c-.333.85-.558 1.738-.67 2.643c-.19.866-.483 1.706-.872 2.502a6.9 6.9 0 0 1-1.511 2.062c-.18.16-.59.56-1.001.92a5 5 0 0 1-.61.451a8.4 8.4 0 0 0-1.442-1.2c.13-.944.13-1.9 0-2.843a4.8 4.8 0 0 0-.81-2.002c-.31-.42-1.001-.95-1.402-1.541a.87.87 0 0 1-.24-.761a.31.31 0 0 1 .24-.18c.21-.068.43-.098.65-.09c.48-.003.956.1 1.392.3c.13.08.15.23.2.34q.082.213.21.4q.076.106.18.18a.8.8 0 0 0 .411.16q.399.005.79-.06c.213.003.423.044.621.12c.192.082.366.201.51.351q.122.148.18.33q.067.19.06.39c0 .07-.11.341-.12.511a.53.53 0 0 0 .1.41a.35.35 0 0 0 .501 0s.18-.08.28-.9a1.9 1.9 0 0 0-.06-.67a1.7 1.7 0 0 0-.37-.541a2.15 2.15 0 0 0-.75-.64a3.75 3.75 0 0 0-1.592-.321a2.4 2.4 0 0 0-.19-.48a1.15 1.15 0 0 0-.4-.45A4.4 4.4 0 0 0 4.66.18a1.72 1.72 0 0 0-1.7 1.09a1.77 1.77 0 0 0 .21 1.482a15.6 15.6 0 0 0 1.792 1.832c.37.44.64.955.79 1.51c.177.775.248 1.57.21 2.363a2 2 0 0 0-.31-.07a3.6 3.6 0 0 0-1.691.21A2.69 2.69 0 0 0 2.118 11a3.1 3.1 0 0 0 1.251 2.443a2 2 0 0 0 0 .22q.02.324.1.64l.14.57c.063.331.24.63.501.842c.22.11.53.15.86-.28l.21-.321l.782-1.111a.36.36 0 0 0-.56-.44l-.842 1.19l-.08.12a.8.8 0 0 1-.08-.16l-.12-.55c0-.14 0-.29-.06-.44a1.1 1.1 0 0 1 0-.36a.42.42 0 0 0-.15-.36a2.33 2.33 0 0 1-1.001-1.883A1.71 1.71 0 0 1 4.27 9.59a2.55 2.55 0 0 1 1.231-.13c.388.085.739.292 1.001.59c.14.15.49.621.76.861a1 1 0 0 0 .551.29a2 2 0 0 0 1.151-.46a19 19 0 0 0 1.562-1.291a8 8 0 0 0 1.751-2.452c.446-.877.782-1.804 1.001-2.763c.08-.803.258-1.593.53-2.352a1.09 1.09 0 0 1 .931-.59c.32 0 .581.28.751.6m8.488 13.301a12.5 12.5 0 0 0-.791-3.003a2.4 2.4 0 0 0-.51-.84a1.4 1.4 0 0 0-.781-.32c-.484.002-.965.07-1.432.2q-1.04.293-2.111.44a2.56 2.56 0 0 1-1.272-.22a.36.36 0 0 0-.3.65a3.4 3.4 0 0 0 1.592.37q1.137-.081 2.252-.32q.431-.092.87-.13c.581 0 .54.21.611.39q.326.935.53 1.902c.49 2.002 0 2.162-.88 2.092c-1.151-.09-2.372-.74-3.443-.61a1.06 1.06 0 0 0-.56.24q-.273.314-.501.66q-.36.397-.771.741q-.399.346-.86.6l-1.112.491a.31.31 0 0 0-.19.4a.31.31 0 0 0 .39.2l1.221-.45a6 6 0 0 0 1.001-.61a7.5 7.5 0 0 0 .911-.761q.206-.218.38-.46a.24.24 0 0 1 .13-.09c.511.02 1.014.135 1.482.34q.86.338 1.771.49a2.87 2.87 0 0 0 1.792-.37a1.18 1.18 0 0 0 .51-.76a3.9 3.9 0 0 0 .07-1.262"/>
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
                            <svg class="pigeon-icon" viewBox="0 0 24 24" fill="none">
                                <!-- Streamline Envelope Pigeon - messenger pigeon with letter -->
                                <path fill="currentColor" d="M10.306 12.482c-.15-.11-.27-.1-.791.15c-.52.25-1.241.67-2.693 1.431a.35.35 0 0 0-.16.48a.34.34 0 0 0 .47.16c1.002-.46 1.772-.81 2.253-1c-.18.59-.48 1.441-.821 2.272q-.405 1.031-.94 2.002a1.8 1.8 0 0 1-.411.56h-.13l-.38-.06c-.361-.09-.721-.22-.922-.28l-4.153-1.301l1.33-.571a.32.32 0 0 0 .191-.41a.31.31 0 0 0-.4-.18c-.64.22-2.522.92-2.543.93a.32.32 0 0 0-.19.4q.28.862.44 1.752c.18.911.311 1.822.461 2.733q.054.661.18 1.31c.06.3.223.57.46.762c.237.147.513.217.791.2q.652-.08 1.272-.3c.68-.2 1.36-.42 2.001-.651c.64-.23 1.332-.48 2.002-.73a75 75 0 0 0 2.502-1.002c.5-.22 1.001-.46 1.632-.76a4.3 4.3 0 0 0 1.321-.921c.219-.248.334-.57.32-.901a12 12 0 0 0-1.23-3.193a11.7 11.7 0 0 0-1.863-2.882m1.721 6.465a4 4 0 0 1-.76.41L7.152 21.01l-3.913 1.45c-.2.07-.48.2-.75.27s-.43.281-.53-.45c-.081-.36-.121-.74-.151-.91c-.22-.901-.4-1.812-.64-2.713q-.136-.57-.33-1.12c.57.23 1.57.64 2.571 1c.771.29 1.522.57 2.062.75q.707.272 1.451.401c.343.07.698.013 1.001-.16a6.2 6.2 0 0 0 1.462-2.522q.612-1.592 1-3.253c.3.51.661 1.25 1.002 2.002a11 11 0 0 1 1 2.872c-.04.13-.21.22-.36.32"/>
                                <path fill="currentColor" d="M15.49 1.892c.22.36.295.789.21 1.201c0 .12-.44.69-.54.951a.62.62 0 0 0 0 .53c.083.152.203.28.35.37c.18.121.42.181.57.281c.298.2.55.458.741.76a.82.82 0 0 1 .13.802q-.096.182-.25.32a2 2 0 0 1-.37.24a2.4 2.4 0 0 0-.43.19a.45.45 0 0 0-.22.3a.75.75 0 0 0 .19.561c.21.26.64.59.72.8a.88.88 0 0 1-.11.861c-.403.43-.89.77-1.431 1.001a.31.31 0 0 0-.14.42a.32.32 0 0 0 .43.14a5 5 0 0 0 1.691-1.1a1.52 1.52 0 0 0 .25-1.522a3.3 3.3 0 0 0-.49-1q.237-.114.44-.28c.19-.147.346-.331.461-.541a1.5 1.5 0 0 0 0-1.371a3.4 3.4 0 0 0-1.13-1.392l-.291-.16c.162-.268.287-.558.37-.86a2.93 2.93 0 0 0-.4-2.403a1.84 1.84 0 0 0-1.632-.8a2.19 2.19 0 0 0-1.861 1.16c-.333.85-.558 1.738-.67 2.643c-.19.866-.483 1.706-.872 2.502a6.9 6.9 0 0 1-1.511 2.062c-.18.16-.59.56-1.001.92a5 5 0 0 1-.61.451a8.4 8.4 0 0 0-1.442-1.2c.13-.944.13-1.9 0-2.843a4.8 4.8 0 0 0-.81-2.002c-.31-.42-1.001-.95-1.402-1.541a.87.87 0 0 1-.24-.761a.31.31 0 0 1 .24-.18c.21-.068.43-.098.65-.09c.48-.003.956.1 1.392.3c.13.08.15.23.2.34q.082.213.21.4q.076.106.18.18a.8.8 0 0 0 .411.16q.399.005.79-.06c.213.003.423.044.621.12c.192.082.366.201.51.351q.122.148.18.33q.067.19.06.39c0 .07-.11.341-.12.511a.53.53 0 0 0 .1.41a.35.35 0 0 0 .501 0s.18-.08.28-.9a1.9 1.9 0 0 0-.06-.67a1.7 1.7 0 0 0-.37-.541a2.15 2.15 0 0 0-.75-.64a3.75 3.75 0 0 0-1.592-.321a2.4 2.4 0 0 0-.19-.48a1.15 1.15 0 0 0-.4-.45A4.4 4.4 0 0 0 4.66.18a1.72 1.72 0 0 0-1.7 1.09a1.77 1.77 0 0 0 .21 1.482a15.6 15.6 0 0 0 1.792 1.832c.37.44.64.955.79 1.51c.177.775.248 1.57.21 2.363a2 2 0 0 0-.31-.07a3.6 3.6 0 0 0-1.691.21A2.69 2.69 0 0 0 2.118 11a3.1 3.1 0 0 0 1.251 2.443a2 2 0 0 0 0 .22q.02.324.1.64l.14.57c.063.331.24.63.501.842c.22.11.53.15.86-.28l.21-.321l.782-1.111a.36.36 0 0 0-.56-.44l-.842 1.19l-.08.12a.8.8 0 0 1-.08-.16l-.12-.55c0-.14 0-.29-.06-.44a1.1 1.1 0 0 1 0-.36a.42.42 0 0 0-.15-.36a2.33 2.33 0 0 1-1.001-1.883A1.71 1.71 0 0 1 4.27 9.59a2.55 2.55 0 0 1 1.231-.13c.388.085.739.292 1.001.59c.14.15.49.621.76.861a1 1 0 0 0 .551.29a2 2 0 0 0 1.151-.46a19 19 0 0 0 1.562-1.291a8 8 0 0 0 1.751-2.452c.446-.877.782-1.804 1.001-2.763c.08-.803.258-1.593.53-2.352a1.09 1.09 0 0 1 .931-.59c.32 0 .581.28.751.6m8.488 13.301a12.5 12.5 0 0 0-.791-3.003a2.4 2.4 0 0 0-.51-.84a1.4 1.4 0 0 0-.781-.32c-.484.002-.965.07-1.432.2q-1.04.293-2.111.44a2.56 2.56 0 0 1-1.272-.22a.36.36 0 0 0-.3.65a3.4 3.4 0 0 0 1.592.37q1.137-.081 2.252-.32q.431-.092.87-.13c.581 0 .54.21.611.39q.326.935.53 1.902c.49 2.002 0 2.162-.88 2.092c-1.151-.09-2.372-.74-3.443-.61a1.06 1.06 0 0 0-.56.24q-.273.314-.501.66q-.36.397-.771.741q-.399.346-.86.6l-1.112.491a.31.31 0 0 0-.19.4a.31.31 0 0 0 .39.2l1.221-.45a6 6 0 0 0 1.001-.61a7.5 7.5 0 0 0 .911-.761q.206-.218.38-.46a.24.24 0 0 1 .13-.09c.511.02 1.014.135 1.482.34q.86.338 1.771.49a2.87 2.87 0 0 0 1.792-.37a1.18 1.18 0 0 0 .51-.76a3.9 3.9 0 0 0 .07-1.262"/>
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
                // Trigger pigeon flying animation
                this.triggerFlyingAnimation();

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
                        <svg class="pigeon-icon-large" viewBox="0 0 24 24" fill="none">
                            <!-- Streamline Envelope Pigeon - messenger pigeon with letter -->
                            <path fill="currentColor" d="M10.306 12.482c-.15-.11-.27-.1-.791.15c-.52.25-1.241.67-2.693 1.431a.35.35 0 0 0-.16.48a.34.34 0 0 0 .47.16c1.002-.46 1.772-.81 2.253-1c-.18.59-.48 1.441-.821 2.272q-.405 1.031-.94 2.002a1.8 1.8 0 0 1-.411.56h-.13l-.38-.06c-.361-.09-.721-.22-.922-.28l-4.153-1.301l1.33-.571a.32.32 0 0 0 .191-.41a.31.31 0 0 0-.4-.18c-.64.22-2.522.92-2.543.93a.32.32 0 0 0-.19.4q.28.862.44 1.752c.18.911.311 1.822.461 2.733q.054.661.18 1.31c.06.3.223.57.46.762c.237.147.513.217.791.2q.652-.08 1.272-.3c.68-.2 1.36-.42 2.001-.651c.64-.23 1.332-.48 2.002-.73a75 75 0 0 0 2.502-1.002c.5-.22 1.001-.46 1.632-.76a4.3 4.3 0 0 0 1.321-.921c.219-.248.334-.57.32-.901a12 12 0 0 0-1.23-3.193a11.7 11.7 0 0 0-1.863-2.882m1.721 6.465a4 4 0 0 1-.76.41L7.152 21.01l-3.913 1.45c-.2.07-.48.2-.75.27s-.43.281-.53-.45c-.081-.36-.121-.74-.151-.91c-.22-.901-.4-1.812-.64-2.713q-.136-.57-.33-1.12c.57.23 1.57.64 2.571 1c.771.29 1.522.57 2.062.75q.707.272 1.451.401c.343.07.698.013 1.001-.16a6.2 6.2 0 0 0 1.462-2.522q.612-1.592 1-3.253c.3.51.661 1.25 1.002 2.002a11 11 0 0 1 1 2.872c-.04.13-.21.22-.36.32"/>
                            <path fill="currentColor" d="M15.49 1.892c.22.36.295.789.21 1.201c0 .12-.44.69-.54.951a.62.62 0 0 0 0 .53c.083.152.203.28.35.37c.18.121.42.181.57.281c.298.2.55.458.741.76a.82.82 0 0 1 .13.802q-.096.182-.25.32a2 2 0 0 1-.37.24a2.4 2.4 0 0 0-.43.19a.45.45 0 0 0-.22.3a.75.75 0 0 0 .19.561c.21.26.64.59.72.8a.88.88 0 0 1-.11.861c-.403.43-.89.77-1.431 1.001a.31.31 0 0 0-.14.42a.32.32 0 0 0 .43.14a5 5 0 0 0 1.691-1.1a1.52 1.52 0 0 0 .25-1.522a3.3 3.3 0 0 0-.49-1q.237-.114.44-.28c.19-.147.346-.331.461-.541a1.5 1.5 0 0 0 0-1.371a3.4 3.4 0 0 0-1.13-1.392l-.291-.16c.162-.268.287-.558.37-.86a2.93 2.93 0 0 0-.4-2.403a1.84 1.84 0 0 0-1.632-.8a2.19 2.19 0 0 0-1.861 1.16c-.333.85-.558 1.738-.67 2.643c-.19.866-.483 1.706-.872 2.502a6.9 6.9 0 0 1-1.511 2.062c-.18.16-.59.56-1.001.92a5 5 0 0 1-.61.451a8.4 8.4 0 0 0-1.442-1.2c.13-.944.13-1.9 0-2.843a4.8 4.8 0 0 0-.81-2.002c-.31-.42-1.001-.95-1.402-1.541a.87.87 0 0 1-.24-.761a.31.31 0 0 1 .24-.18c.21-.068.43-.098.65-.09c.48-.003.956.1 1.392.3c.13.08.15.23.2.34q.082.213.21.4q.076.106.18.18a.8.8 0 0 0 .411.16q.399.005.79-.06c.213.003.423.044.621.12c.192.082.366.201.51.351q.122.148.18.33q.067.19.06.39c0 .07-.11.341-.12.511a.53.53 0 0 0 .1.41a.35.35 0 0 0 .501 0s.18-.08.28-.9a1.9 1.9 0 0 0-.06-.67a1.7 1.7 0 0 0-.37-.541a2.15 2.15 0 0 0-.75-.64a3.75 3.75 0 0 0-1.592-.321a2.4 2.4 0 0 0-.19-.48a1.15 1.15 0 0 0-.4-.45A4.4 4.4 0 0 0 4.66.18a1.72 1.72 0 0 0-1.7 1.09a1.77 1.77 0 0 0 .21 1.482a15.6 15.6 0 0 0 1.792 1.832c.37.44.64.955.79 1.51c.177.775.248 1.57.21 2.363a2 2 0 0 0-.31-.07a3.6 3.6 0 0 0-1.691.21A2.69 2.69 0 0 0 2.118 11a3.1 3.1 0 0 0 1.251 2.443a2 2 0 0 0 0 .22q.02.324.1.64l.14.57c.063.331.24.63.501.842c.22.11.53.15.86-.28l.21-.321l.782-1.111a.36.36 0 0 0-.56-.44l-.842 1.19l-.08.12a.8.8 0 0 1-.08-.16l-.12-.55c0-.14 0-.29-.06-.44a1.1 1.1 0 0 1 0-.36a.42.42 0 0 0-.15-.36a2.33 2.33 0 0 1-1.001-1.883A1.71 1.71 0 0 1 4.27 9.59a2.55 2.55 0 0 1 1.231-.13c.388.085.739.292 1.001.59c.14.15.49.621.76.861a1 1 0 0 0 .551.29a2 2 0 0 0 1.151-.46a19 19 0 0 0 1.562-1.291a8 8 0 0 0 1.751-2.452c.446-.877.782-1.804 1.001-2.763c.08-.803.258-1.593.53-2.352a1.09 1.09 0 0 1 .931-.59c.32 0 .581.28.751.6m8.488 13.301a12.5 12.5 0 0 0-.791-3.003a2.4 2.4 0 0 0-.51-.84a1.4 1.4 0 0 0-.781-.32c-.484.002-.965.07-1.432.2q-1.04.293-2.111.44a2.56 2.56 0 0 1-1.272-.22a.36.36 0 0 0-.3.65a3.4 3.4 0 0 0 1.592.37q1.137-.081 2.252-.32q.431-.092.87-.13c.581 0 .54.21.611.39q.326.935.53 1.902c.49 2.002 0 2.162-.88 2.092c-1.151-.09-2.372-.74-3.443-.61a1.06 1.06 0 0 0-.56.24q-.273.314-.501.66q-.36.397-.771.741q-.399.346-.86.6l-1.112.491a.31.31 0 0 0-.19.4a.31.31 0 0 0 .39.2l1.221-.45a6 6 0 0 0 1.001-.61a7.5 7.5 0 0 0 .911-.761q.206-.218.38-.46a.24.24 0 0 1 .13-.09c.511.02 1.014.135 1.482.34q.86.338 1.771.49a2.87 2.87 0 0 0 1.792-.37a1.18 1.18 0 0 0 .51-.76a3.9 3.9 0 0 0 .07-1.262"/>
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
                // Add has-unread class for idle bobbing animation
                iconBtn.classList.add('has-unread');
            } else {
                if (existingBadge) {
                    existingBadge.remove();
                }
                iconBtn.classList.remove('has-unread');
            }
        }

        /**
         * Trigger flying animation when new notification arrives
         */
        triggerFlyingAnimation() {
            const iconBtn = document.getElementById('notificationIconBtn');
            if (!iconBtn) return;

            const pigeonIcon = iconBtn.querySelector('.pigeon-icon');
            if (!pigeonIcon) return;

            // Remove any existing animation classes
            pigeonIcon.classList.remove('flying', 'flutter');

            // Force reflow to restart animation
            void pigeonIcon.offsetWidth;

            // Add flying animation
            pigeonIcon.classList.add('flying');

            // Remove class after animation completes
            setTimeout(() => {
                pigeonIcon.classList.remove('flying');
            }, 800);
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
