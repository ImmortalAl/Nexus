// Immortal Nexus Error Tracking System
// Captures and reports client-side errors for monitoring

(function() {
    'use strict';

    const ErrorTracker = {
        apiBaseUrl: window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api',
        errorQueue: [],
        maxQueueSize: 50,
        reportingEnabled: true,
        sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),

        init() {
            // Capture unhandled errors
            window.addEventListener('error', (event) => {
                this.captureError({
                    type: 'javascript',
                    message: event.message,
                    source: event.filename,
                    line: event.lineno,
                    column: event.colno,
                    stack: event.error?.stack,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                });
            });

            // Capture unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.captureError({
                    type: 'unhandled_promise',
                    message: event.reason?.message || String(event.reason),
                    stack: event.reason?.stack,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                });
            });

            // Capture resource loading errors
            window.addEventListener('error', (event) => {
                if (event.target !== window) {
                    this.captureError({
                        type: 'resource',
                        message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
                        source: event.target.src || event.target.href,
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    });
                }
            }, true);

            // Monitor performance issues
            if ('PerformanceObserver' in window) {
                try {
                    // Check if longtask is supported before observing
                    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
                        const longTaskObserver = new PerformanceObserver((list) => {
                            for (const entry of list.getEntries()) {
                                if (entry.duration > 50) {
                                    this.capturePerformanceIssue({
                                        type: 'long_task',
                                        duration: entry.duration,
                                        startTime: entry.startTime,
                                        name: entry.name,
                                        url: window.location.href
                                    });
                                }
                            }
                        });
                        longTaskObserver.observe({ entryTypes: ['longtask'] });
                    }
                } catch (e) {
                    // Long task monitoring not supported
                }
            }

            // Send queued errors before page unload
            window.addEventListener('beforeunload', () => {
                this.flushErrorQueue();
            });

            // Periodically send errors (every 30 seconds)
            setInterval(() => {
                if (this.errorQueue.length > 0) {
                    this.flushErrorQueue();
                }
            }, 30000);
        },

        captureError(errorData) {
            // Don't capture errors from localhost or development
            if (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1') {
                console.error('Error captured (dev mode):', errorData);
                return;
            }

            // Add session and user context
            errorData.sessionId = this.sessionId;
            errorData.viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            // Add user info if available
            const user = this.getUserInfo();
            if (user) {
                errorData.userId = user.id;
                errorData.username = user.username;
            }

            // Add to queue
            this.errorQueue.push(errorData);

            // Limit queue size
            if (this.errorQueue.length > this.maxQueueSize) {
                this.errorQueue.shift();
            }

            // Send immediately if critical error
            if (errorData.type === 'javascript' || this.errorQueue.length >= 10) {
                this.flushErrorQueue();
            }
        },

        capturePerformanceIssue(perfData) {
            // Only capture significant performance issues
            if (perfData.duration < 100) return;

            this.captureError({
                type: 'performance',
                subtype: perfData.type,
                message: `Performance issue: ${perfData.type} took ${Math.round(perfData.duration)}ms`,
                details: perfData,
                timestamp: new Date().toISOString()
            });
        },

        async flushErrorQueue() {
            if (!this.reportingEnabled || this.errorQueue.length === 0) {
                return;
            }

            const errors = [...this.errorQueue];
            this.errorQueue = [];

            try {
                // Send to backend
                await fetch(`${this.apiBaseUrl}/errors/report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        errors: errors,
                        environment: {
                            url: window.location.href,
                            referrer: document.referrer,
                            screen: {
                                width: screen.width,
                                height: screen.height,
                                colorDepth: screen.colorDepth
                            },
                            connection: navigator.connection ? {
                                effectiveType: navigator.connection.effectiveType,
                                downlink: navigator.connection.downlink,
                                rtt: navigator.connection.rtt
                            } : null
                        }
                    })
                });
            } catch (e) {
                // Failed to send errors, add them back to queue
                this.errorQueue = [...errors, ...this.errorQueue].slice(0, this.maxQueueSize);
            }
        },

        getUserInfo() {
            // Try to get user info from authManager or localStorage
            if (window.authManager && window.authManager.getUser) {
                const user = window.authManager.getUser();
                if (user) {
                    return {
                        id: user._id || user.id,
                        username: user.username
                    };
                }
            }

            // Fallback to localStorage
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return {
                        id: payload.userId,
                        username: payload.username
                    };
                } catch (e) {
                    // Invalid token
                }
            }

            return null;
        },

        // Public API for manual error reporting
        reportError(message, details = {}) {
            this.captureError({
                type: 'manual',
                message: message,
                details: details,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        },

        // Disable/enable error reporting
        setReportingEnabled(enabled) {
            this.reportingEnabled = enabled;
        },

        // Get error statistics
        getStats() {
            return {
                queuedErrors: this.errorQueue.length,
                sessionId: this.sessionId,
                reportingEnabled: this.reportingEnabled
            };
        }
    };

    // Initialize error tracking
    ErrorTracker.init();

    // Expose global API
    window.NexusErrorTracker = {
        reportError: ErrorTracker.reportError.bind(ErrorTracker),
        setReportingEnabled: ErrorTracker.setReportingEnabled.bind(ErrorTracker),
        getStats: ErrorTracker.getStats.bind(ErrorTracker)
    };

    // Log initialization
    console.info('Nexus Error Tracker initialized');

})();