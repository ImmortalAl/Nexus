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
        setTimeout(() => {
            const toggleButtons = document.querySelectorAll('[data-theme-toggle]');

            if (toggleButtons.length === 0) {
                return;
            }

            toggleButtons.forEach((button, index) => {
                if (button._themeToggleHandler) {
                    button.removeEventListener('click', button._themeToggleHandler);
                }

                const boundToggle = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleTheme();
                };
                button.addEventListener('click', boundToggle);

                button._themeToggleHandler = boundToggle;

                this.updateSingleToggle(button, this.currentTheme);
            });
        }, 100);
    }

    applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');

        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.add('dark-theme');
        }

        const themeColor = theme === 'light' ? '#ffffff' : '#0d0d1a';
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = themeColor;
        }

        this.updateThemeToggles(theme);

        window.dispatchEvent(new CustomEvent('nexus-theme-changed', {
            detail: { theme }
        }));
    }

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem(this.themeKey, theme);
        this.applyTheme(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getTheme() {
        return this.currentTheme;
    }

    updateSingleToggle(button, theme) {
        const icon = button.querySelector('i');
        if (icon) {
            // When in dark mode, show sun icon (switch to light)
            // When in light mode, show moon icon (switch to dark)
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        button.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
    }

    updateThemeToggles(theme) {
        // Update all theme toggle buttons on the page
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        toggleButtons.forEach(button => {
            this.updateSingleToggle(button, theme);
        });

        // Update mobile theme toggle text specifically
        const mobileThemeToggleText = document.getElementById('mobileThemeToggleText');
        if (mobileThemeToggleText) {
            mobileThemeToggleText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
    }

    createThemeToggle() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('data-theme-toggle', 'true');
        button.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);

        const icon = document.createElement('i');
        // When in dark mode, show sun icon (switch to light)
        // When in light mode, show moon icon (switch to dark)
        icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        button.appendChild(icon);

        button.addEventListener('click', () => this.toggleTheme());

        return button;
    }
}

function initThemeManager() {
    if (!window.NEXUSTheme) {
        window.NEXUSTheme = new NexusThemeManager();
    } else {
        window.NEXUSTheme.connectExistingToggles();
    }
    return window.NEXUSTheme;
}

// Auto-initialize theme manager with proper timing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure all other scripts have initialized
        setTimeout(() => {
            initThemeManager();
        }, 50);
    });
} else {
    // DOM already loaded - delay slightly to ensure all scripts loaded
    setTimeout(() => {
        initThemeManager();
    }, 50);
}

// Expose on MLNF namespace
window.NEXUS = window.NEXUS || {};
window.NEXUS.initThemeManager = initThemeManager;
window.NEXUS.ThemeManager = NexusThemeManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusThemeManager;
}