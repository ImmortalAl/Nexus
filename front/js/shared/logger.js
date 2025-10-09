/**
 * Structured Logging System - Immortal Nexus
 * Production-ready logging with levels, formatting, and filtering
 *
 * Features:
 * - Log levels (debug, info, warn, error, critical)
 * - Structured data logging
 * - Filtering by module/level
 * - Environment-based configuration
 * - Performance timing
 * - Optional remote logging
 */

class Logger {
    constructor() {
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            CRITICAL: 4
        };

        // Default configuration
        this.config = {
            level: this.isDevelopment() ? this.levels.DEBUG : this.levels.INFO,
            enableConsole: true,
            enableRemote: false,
            remoteEndpoint: null,
            includedModules: [], // Empty = all modules
            excludedModules: [],
            maxLogSize: 1000, // Max logs to keep in memory
            colorize: true
        };

        this.logs = [];
        this.timers = new Map();

        // Colors for console output
        this.colors = {
            DEBUG: '#9ca3af',    // Gray
            INFO: '#3b82f6',     // Blue
            WARN: '#f59e0b',     // Amber
            ERROR: '#ef4444',    // Red
            CRITICAL: '#dc2626'  // Dark red
        };
    }

    /**
     * Check if running in development
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }

    /**
     * Configure logger
     */
    configure(options = {}) {
        this.config = { ...this.config, ...options };
    }

    /**
     * Check if module should be logged
     */
    shouldLog(module, level) {
        // Check log level
        if (level < this.config.level) {
            return false;
        }

        // Check included modules
        if (this.config.includedModules.length > 0 &&
            !this.config.includedModules.includes(module)) {
            return false;
        }

        // Check excluded modules
        if (this.config.excludedModules.includes(module)) {
            return false;
        }

        return true;
    }

    /**
     * Core logging function
     */
    log(level, module, message, data = {}) {
        const levelName = Object.keys(this.levels).find(key => this.levels[key] === level);

        if (!this.shouldLog(module, level)) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            module,
            message,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store log
        this.logs.push(logEntry);
        if (this.logs.length > this.config.maxLogSize) {
            this.logs.shift(); // Remove oldest
        }

        // Console output
        if (this.config.enableConsole) {
            this.logToConsole(logEntry);
        }

        // Remote logging (if enabled)
        if (this.config.enableRemote && this.config.remoteEndpoint) {
            this.logToRemote(logEntry);
        }
    }

    /**
     * Log to console with formatting
     */
    logToConsole(entry) {
        const { level, module, message, data } = entry;
        const color = this.colors[level] || '#000000';
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();

        const prefix = `%c[${timestamp}] [${level}] [${module}]`;
        const style = `color: ${color}; font-weight: bold;`;

        if (level === 'ERROR' || level === 'CRITICAL') {
            console.error(prefix, style, message, data);
        } else if (level === 'WARN') {
            console.warn(prefix, style, message, data);
        } else {
            console.log(prefix, style, message, data);
        }
    }

    /**
     * Log to remote endpoint
     */
    async logToRemote(entry) {
        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.error('[Logger] Failed to send log to remote:', error);
        }
    }

    /**
     * Debug level logging
     */
    debug(module, message, data = {}) {
        this.log(this.levels.DEBUG, module, message, data);
    }

    /**
     * Info level logging
     */
    info(module, message, data = {}) {
        this.log(this.levels.INFO, module, message, data);
    }

    /**
     * Warning level logging
     */
    warn(module, message, data = {}) {
        this.log(this.levels.WARN, module, message, data);
    }

    /**
     * Error level logging
     */
    error(module, message, data = {}) {
        this.log(this.levels.ERROR, module, message, data);
    }

    /**
     * Critical level logging
     */
    critical(module, message, data = {}) {
        this.log(this.levels.CRITICAL, module, message, data);
    }

    /**
     * Start performance timer
     */
    time(label) {
        this.timers.set(label, performance.now());
    }

    /**
     * End performance timer and log duration
     */
    timeEnd(module, label) {
        if (!this.timers.has(label)) {
            this.warn('Logger', `Timer "${label}" does not exist`);
            return;
        }

        const start = this.timers.get(label);
        const duration = performance.now() - start;
        this.timers.delete(label);

        this.info(module, `${label} completed in ${duration.toFixed(2)}ms`, {
            duration,
            label
        });

        return duration;
    }

    /**
     * Get all logs
     */
    getLogs(filter = {}) {
        let filtered = this.logs;

        if (filter.level) {
            filtered = filtered.filter(log => log.level === filter.level);
        }

        if (filter.module) {
            filtered = filtered.filter(log => log.module === filter.module);
        }

        if (filter.since) {
            const sinceDate = new Date(filter.since);
            filtered = filtered.filter(log => new Date(log.timestamp) >= sinceDate);
        }

        return filtered;
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        this.info('Logger', 'Logs cleared');
    }

    /**
     * Export logs as JSON
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Download logs as file
     */
    downloadLogs() {
        const blob = new Blob([this.exportLogs()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get log statistics
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byModule: {},
            timeRange: {
                start: this.logs[0]?.timestamp,
                end: this.logs[this.logs.length - 1]?.timestamp
            }
        };

        this.logs.forEach(log => {
            // Count by level
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

            // Count by module
            stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
        });

        return stats;
    }

    /**
     * Create module-specific logger
     */
    createModuleLogger(moduleName) {
        return {
            debug: (message, data) => this.debug(moduleName, message, data),
            info: (message, data) => this.info(moduleName, message, data),
            warn: (message, data) => this.warn(moduleName, message, data),
            error: (message, data) => this.error(moduleName, message, data),
            critical: (message, data) => this.critical(moduleName, message, data),
            time: (label) => this.time(label),
            timeEnd: (label) => this.timeEnd(moduleName, label)
        };
    }
}

// Create singleton instance
const logger = new Logger();

// Auto-configure based on environment
if (logger.isDevelopment()) {
    logger.configure({
        level: logger.levels.DEBUG,
        colorize: true
    });
} else {
    logger.configure({
        level: logger.levels.INFO,
        colorize: false
    });
}

// Export to global scope
window.Logger = logger;

// Also export class for testing
window.LoggerClass = Logger;

// Add helpful global shortcuts
window.logDebug = (module, message, data) => logger.debug(module, message, data);
window.logInfo = (module, message, data) => logger.info(module, message, data);
window.logWarn = (module, message, data) => logger.warn(module, message, data);
window.logError = (module, message, data) => logger.error(module, message, data);

console.log('[Logger] Structured logging system initialized ✓');
