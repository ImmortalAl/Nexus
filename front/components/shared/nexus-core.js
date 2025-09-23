// nexus-core.js - Core initialization for MLNF components

// Establish the global namespace
window.NEXUS = window.NEXUS || {};

// Centralized component initialization
document.addEventListener('DOMContentLoaded', () => {

  // The order of initialization can be important.
  // For example, user menu should be initialized before components that might use it.
  
  // Initialize components only if their functions are available
  const components = [
    { name: 'initThemeManager', desc: 'Theme Manager' },
    { name: 'initUserMenu', desc: 'User Menu' },
    { name: 'initNavigation', desc: 'Navigation' },
    { name: 'initAuthModal', desc: 'Auth Modal' },
    { name: 'initMessageModal', desc: 'Message Modal' },
    { name: 'initActiveUsers', desc: 'Active Users Sidebar' }
  ];

  let successfulInits = 0;
  
  components.forEach(component => {
    if (typeof window.NEXUS[component.name] === 'function') {
      try {
        console.log(`Initializing ${component.desc}...`);
        window.NEXUS[component.name]();
        console.log(`Successfully initialized ${component.desc}`);
        successfulInits++;
      } catch (error) {
        console.error(`Failed to initialize ${component.desc}:`, error);
      }
    } else {
      console.warn(`${component.desc} (${component.name}) not available in window.NEXUS`);
    }
  });

  
  // Particle system is auto-initialized by particleSystem.js

});

// Listen for authentication state changes
window.addEventListener('storage', (event) => {
  if (event.key === 'sessionToken' || event.key === 'user') {
    if (typeof window.NEXUS.updateUserMenu === 'function') {
      window.NEXUS.updateUserMenu();
    }
  }
}); 