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
        console.log('connectExistingToggles called');
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            // Find and connect existing theme toggle buttons
            const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
            console.log('Found toggle buttons:', toggleButtons.length);

            toggleButtons.forEach((button, index) => {
                console.log(`Setting up toggle button ${index}:`, button);

                // Remove any existing handler to prevent duplicates
                if (button._themeToggleHandler) {
                    button.removeEventListener('click', button._themeToggleHandler);
                    console.log(`Removed existing handler from button ${index}`);
                }

                // Add new click listener with proper binding
                const boundToggle = (e) => {
                    console.log('Theme toggle button clicked, current theme:', this.currentTheme);
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleTheme();
                    console.log('Theme toggled to:', this.currentTheme);
                };
                button.addEventListener('click', boundToggle);

                // Store reference for cleanup
                button._themeToggleHandler = boundToggle;

                // Update initial button state
                this.updateSingleToggle(button, this.currentTheme);
                console.log(`Toggle button ${index} setup complete with theme:`, this.currentTheme);
            });
        }, 100);
    }

    applyTheme(theme) {
        console.log(`Applying theme: ${theme}`);

        // Remove existing theme classes
        document.body.classList.remove('light-theme', 'dark-theme');

        // Add new theme class
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            console.log('Added light-theme class to body');
        } else {
            document.body.classList.add('dark-theme');
            console.log('Added dark-theme class to body');
        }

        // Debug: Check what CSS variables are actually set
        const computedStyle = getComputedStyle(document.body);
        console.log('Theme applied - CSS Variables check:', {
            '--background': computedStyle.getPropertyValue('--background'),
            '--text': computedStyle.getPropertyValue('--text'),
            '--newspaper-black': computedStyle.getPropertyValue('--newspaper-black'),
            '--newspaper-white': computedStyle.getPropertyValue('--newspaper-white')
        });

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

        console.log(`Theme application complete: ${theme}`);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem(this.themeKey, theme);
        this.applyTheme(theme);
    }

    toggleTheme() {
        console.log('toggleTheme called, current theme:', this.currentTheme);
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        console.log('toggleTheme switching to:', newTheme);
        this.setTheme(newTheme);
        console.log('toggleTheme complete, new theme:', this.currentTheme);
    }

    getTheme() {
        return this.currentTheme;
    }

    updateSingleToggle(button, theme) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
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
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        button.appendChild(icon);
        
        button.addEventListener('click', () => this.toggleTheme());
        
        return button;
    }
}

// Initialize theme manager globally
function initThemeManager() {
    if (!window.NEXUSTheme) {
        console.log('Initializing NexusThemeManager');
        window.NEXUSTheme = new NexusThemeManager();
    } else {
        console.log('NexusThemeManager already exists, re-connecting toggles');
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