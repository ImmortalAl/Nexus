/**
 * MLNF Theme Manager - Centralized theme management system
 * Provides consistent dark/light mode across all pages
 */

class NexusThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // Default theme
        this.themeKey = 'nexus-theme';
        this.init();
    }

    init() {
        // Load saved theme or detect system preference
        const savedTheme = localStorage.getItem(this.themeKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Default to dark theme for MLNF
            this.currentTheme = 'dark';
        }
        
        // Apply theme immediately
        this.applyTheme(this.currentTheme);
        
        // Connect existing theme toggle buttons
        this.connectExistingToggles();
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.themeKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    connectExistingToggles() {
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            // Find and connect existing theme toggle buttons
            const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
            
            toggleButtons.forEach(button => {
                // Remove any existing click listeners to avoid duplicates
                button.removeEventListener('click', this.handleToggleClick);
                // Add new click listener
                button.addEventListener('click', () => {
                    this.toggleTheme();
                });
            });
        }, 100);
    }

    applyTheme(theme) {
        console.log('applyTheme called with:', theme);
        console.log('Body classes before:', Array.from(document.body.classList));
        
        // Remove existing theme classes
        document.body.classList.remove('light-theme', 'dark-theme');
        
        // Add new theme class
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.add('dark-theme');
        }
        
        console.log('Body classes after:', Array.from(document.body.classList));
        
        // Update theme color meta tag
        const themeColor = theme === 'light' ? '#ffffff' : '#0d0d1a';
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = themeColor;
        }
        
        // Update all theme toggle buttons
        this.updateThemeToggles(theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('nexus-theme-changed', { 
            detail: { theme } 
        }));
        
        console.log('Theme applied successfully. Current body classes:', Array.from(document.body.classList));
    }

    setTheme(theme) {
        console.log('setTheme called with:', theme);
        this.currentTheme = theme;
        localStorage.setItem(this.themeKey, theme);
        console.log('Theme saved to localStorage:', localStorage.getItem(this.themeKey));
        this.applyTheme(theme);
    }

    toggleTheme() {
        console.log('toggleTheme called. Current theme:', this.currentTheme);
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        console.log('Switching to theme:', newTheme);
        this.setTheme(newTheme);
    }

    getTheme() {
        return this.currentTheme;
    }

    updateThemeToggles(theme) {
        // Update all theme toggle buttons on the page
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        toggleButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
            button.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
        });
    }

    createThemeToggle() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('data-theme-toggle', 'true');
        button.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
        
        const icon = document.createElement('i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        button.appendChild(icon);
        
        button.addEventListener('click', () => this.toggleTheme());
        
        return button;
    }
}

// Initialize theme manager globally
function initThemeManager() {
    if (!window.NEXUSTheme) {
        window.NEXUSTheme = new NexusThemeManager();
    }
    return window.NEXUSTheme;
}

// Auto-initialize theme manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initThemeManager();
    });
} else {
    // DOM already loaded
    initThemeManager();
}

// Expose on MLNF namespace
window.NEXUS = window.NEXUS || {};
window.NEXUS.initThemeManager = initThemeManager;
window.NEXUS.ThemeManager = NexusThemeManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusThemeManager;
}