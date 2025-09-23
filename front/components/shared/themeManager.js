/**
 * MLNF Theme Manager - Centralized theme management system
 * Provides consistent dark/light mode across all pages
 */

class NexusThemeManager {
    constructor() {
        console.log('[ThemeManager] Constructor called');
        this.currentTheme = 'dark'; // Default theme
        this.themeKey = 'nexus-theme';
        this.init();
    }

    init() {
        console.log('[ThemeManager] init() called');
        // Load saved theme or detect system preference
        const savedTheme = localStorage.getItem(this.themeKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        console.log('[ThemeManager] Saved theme:', savedTheme, 'System prefers dark:', prefersDark);

        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Default to dark theme for MLNF
            this.currentTheme = 'dark';
        }

        console.log('[ThemeManager] Initial theme set to:', this.currentTheme);

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
            console.log('[ThemeManager] Found', toggleButtons.length, 'theme toggle buttons');

            if (toggleButtons.length === 0) {
                console.warn('[ThemeManager] No theme toggle buttons found!');
                return;
            }

            toggleButtons.forEach((button, index) => {
                console.log('[ThemeManager] Connecting button', index, button);

                if (button._themeToggleHandler) {
                    button.removeEventListener('click', button._themeToggleHandler);
                }

                const boundToggle = (e) => {
                    console.log('[ThemeManager] Button clicked!', e.target);
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
        console.log('[ThemeManager] applyTheme called with:', theme);
        console.log('[ThemeManager] Body classes before:', document.body.className);

        document.body.classList.remove('light-theme', 'dark-theme');

        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.add('dark-theme');
        }

        console.log('[ThemeManager] Body classes after:', document.body.className);

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
        console.log('[ThemeManager] toggleTheme called. Current:', this.currentTheme);
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        console.log('[ThemeManager] Switching to:', newTheme);
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
    console.log('[ThemeManager] initThemeManager called');
    if (!window.NEXUSTheme) {
        console.log('[ThemeManager] Creating new NexusThemeManager instance');
        window.NEXUSTheme = new NexusThemeManager();
    } else {
        console.log('[ThemeManager] Instance already exists, reconnecting toggles');
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