/**
 * Error Boundary System - Immortal Nexus
 * Graceful error handling to prevent full page crashes
 *
 * Features:
 * - Wraps dangerous functions with try-catch
 * - Provides fallback UI for errors
 * - Logs errors for debugging
 * - Prevents cascading failures
 */

class ErrorBoundary {
    constructor() {
        this.errorCount = 0;
        this.errorLog = [];
        this.maxErrors = 10; // Prevent infinite error loops

        // Setup global error handler
        this.setupGlobalHandler();
    }

    /**
     * Setup global unhandled error catcher
     */
    setupGlobalHandler() {
        window.addEventListener('error', (event) => {
            this.logError('Global Error', event.error || event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });

            // Don't prevent default - let browser handle it too
            return false;
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason, {
                promise: event.promise
            });

            // Prevent console spam
            event.preventDefault();
        });
    }

    /**
     * Wrap a synchronous function with error boundary
     * @param {Function} fn - Function to wrap
     * @param {*} fallback - Fallback return value on error
     * @param {string} context - Context for logging
     * @returns {*} Function result or fallback
     */
    wrap(fn, fallback = null, context = 'Unknown') {
        try {
            return fn();
        } catch (error) {
            this.logError(context, error);
            return fallback;
        }
    }

    /**
     * Wrap an async function with error boundary
     * @param {Function} fn - Async function to wrap
     * @param {*} fallback - Fallback return value on error
     * @param {string} context - Context for logging
     * @returns {Promise<*>} Function result or fallback
     */
    async wrapAsync(fn, fallback = null, context = 'Unknown') {
        try {
            return await fn();
        } catch (error) {
            this.logError(context, error);
            return fallback;
        }
    }

    /**
     * Create a safe version of any function
     * @param {Function} fn - Function to make safe
     * @param {*} fallback - Fallback return value
     * @param {string} context - Context for logging
     * @returns {Function} Safe version of function
     */
    safe(fn, fallback = null, context = 'Unknown') {
        return (...args) => {
            try {
                const result = fn(...args);

                // Handle promises
                if (result && typeof result.then === 'function') {
                    return result.catch(error => {
                        this.logError(context, error);
                        return fallback;
                    });
                }

                return result;
            } catch (error) {
                this.logError(context, error);
                return fallback;
            }
        };
    }

    /**
     * Log error with context
     * @param {string} context - Where the error occurred
     * @param {Error|string} error - The error
     * @param {Object} metadata - Additional info
     */
    logError(context, error, metadata = {}) {
        this.errorCount++;

        const errorInfo = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || String(error),
            stack: error?.stack,
            metadata,
            count: this.errorCount
        };

        this.errorLog.push(errorInfo);

        // Keep log size manageable
        if (this.errorLog.length > 50) {
            this.errorLog.shift();
        }

        // Log to console
        console.error(`[ErrorBoundary] ${context}:`, error, metadata);

        // Check for error storm
        if (this.errorCount > this.maxErrors) {
            this.showErrorStorm();
        }
    }

    /**
     * Show error storm warning
     */
    showErrorStorm() {
        console.error('[ErrorBoundary] ERROR STORM DETECTED! Too many errors in quick succession.');

        // Show user-friendly message
        this.showErrorUI({
            title: 'Multiple Errors Detected',
            message: 'The application encountered several errors. Please refresh the page.',
            severity: 'critical'
        });
    }

    /**
     * Show error UI to user
     * @param {Object} options - Error display options
     */
    showErrorUI(options = {}) {
        const {
            title = 'Something went wrong',
            message = 'An error occurred. Please try again.',
            severity = 'error',
            canDismiss = true,
            actions = []
        } = options;

        // Remove any existing error UI
        const existing = document.getElementById('errorBoundaryUI');
        if (existing) existing.remove();

        // Create error UI
        const errorUI = document.createElement('div');
        errorUI.id = 'errorBoundaryUI';
        errorUI.className = `error-boundary-ui error-${severity}`;
        errorUI.innerHTML = `
            <div class="error-boundary-content">
                <div class="error-boundary-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="error-boundary-text">
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
                <div class="error-boundary-actions">
                    ${actions.map(action => `
                        <button class="btn btn-${action.type || 'secondary'}" onclick="${action.onClick}">
                            ${action.label}
                        </button>
                    `).join('')}
                    ${canDismiss ? `
                        <button class="btn btn-secondary" onclick="this.closest('.error-boundary-ui').remove()">
                            Dismiss
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(errorUI);

        // Auto-dismiss after 10 seconds for non-critical errors
        if (severity !== 'critical' && canDismiss) {
            setTimeout(() => {
                if (errorUI.parentElement) {
                    errorUI.classList.add('fade-out');
                    setTimeout(() => errorUI.remove(), 300);
                }
            }, 10000);
        }
    }

    /**
     * Get error log for debugging
     * @returns {Array} Error log
     */
    getErrorLog() {
        return this.errorLog;
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.errorCount = 0;
    }

    /**
     * Check if a function is likely to fail
     * @param {Function} fn - Function to test
     * @returns {boolean} True if function throws
     */
    willFail(fn) {
        try {
            fn();
            return false;
        } catch (error) {
            return true;
        }
    }

    /**
     * Retry a function with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} delay - Initial delay in ms
     * @returns {Promise<*>} Function result or error
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxRetries) {
                    this.logError('Retry Failed', error, { attempts: maxRetries });
                    throw error;
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    /**
     * Create a circuit breaker for unreliable functions
     * @param {Function} fn - Function to wrap
     * @param {number} threshold - Failure threshold
     * @param {number} timeout - Circuit reset timeout
     */
    circuitBreaker(fn, threshold = 5, timeout = 60000) {
        let failures = 0;
        let circuitOpen = false;
        let resetTimer = null;

        return async (...args) => {
            if (circuitOpen) {
                throw new Error('Circuit breaker open - too many failures');
            }

            try {
                const result = await fn(...args);
                failures = 0; // Reset on success
                return result;
            } catch (error) {
                failures++;

                if (failures >= threshold) {
                    circuitOpen = true;
                    this.logError('Circuit Breaker', 'Circuit opened due to repeated failures', {
                        failures,
                        threshold
                    });

                    // Reset circuit after timeout
                    resetTimer = setTimeout(() => {
                        circuitOpen = false;
                        failures = 0;
                    }, timeout);
                }

                throw error;
            }
        };
    }
}

// Create singleton instance
const errorBoundary = new ErrorBoundary();

// Export to global scope
window.ErrorBoundary = errorBoundary;

// Export class for testing
window.ErrorBoundaryClass = ErrorBoundary;

// Add styles
const style = document.createElement('style');
style.textContent = `
.error-boundary-ui {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    background: #ffffff;
    border: 2px solid #ef4444;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 100000;
    animation: slideIn 0.3s ease;
}

.error-boundary-ui.error-critical {
    border-color: #dc2626;
    background: #fee2e2;
}

.error-boundary-content {
    padding: 1.5rem;
}

.error-boundary-icon {
    font-size: 2rem;
    color: #ef4444;
    text-align: center;
    margin-bottom: 1rem;
}

.error-boundary-text h3 {
    margin: 0 0 0.5rem 0;
    color: #dc2626;
    font-size: 1.25rem;
}

.error-boundary-text p {
    margin: 0;
    color: #374151;
    font-size: 0.9rem;
}

.error-boundary-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.error-boundary-actions button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
}

.error-boundary-ui.fade-out {
    animation: slideOut 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

/* Dark theme support */
body.dark-theme .error-boundary-ui {
    background: #1f2937;
    color: #f3f4f6;
}

body.dark-theme .error-boundary-text p {
    color: #d1d5db;
}
`;
document.head.appendChild(style);

console.log('[ErrorBoundary] System initialized ✓');
