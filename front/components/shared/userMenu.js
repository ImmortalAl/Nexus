// userMenu.js - Handles the user dropdown menu functionality

// Constants are now in config.js and accessed via window.NEXUS_CONFIG
// const API_BASE_URL = 'https://nexus-ytrg.onrender.com/api'; // REMOVED
// const DEFAULT_AVATAR = '/assets/images/default-avatar.png'; // REMOVED

// Update user dropdown menu based on authentication status
function updateUserMenu() {
  
  const API_BASE_URL = window.NEXUS_CONFIG.API_BASE_URL;
  const DEFAULT_AVATAR = window.NEXUS_CONFIG.DEFAULT_AVATAR;
  
  const userMenuContainer = document.getElementById('userMenuContainer');
  const headerAuthButtonsContainer = document.getElementById('headerAuthButtonsContainer');

  if (!userMenuContainer || !headerAuthButtonsContainer) {
    return; // Silently skip if elements not found
  }
  
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');

  if (token && cachedUser) {
    document.body.classList.add('user-logged-in');
    userMenuContainer.style.display = 'flex'; // Or 'block' or 'inline-block' depending on desired layout
    headerAuthButtonsContainer.style.display = 'none';
    headerAuthButtonsContainer.innerHTML = ''; // Clear any old buttons

    const userMenuBtn = document.createElement('button');
    userMenuBtn.className = 'user-menu-btn';
    userMenuBtn.id = 'userMenuBtn';
    
    const userDropdown = document.createElement('div');
    userDropdown.className = 'user-dropdown';
    userDropdown.id = 'userDropdown';
    userDropdown.classList.remove('active');

    try {
      const userData = JSON.parse(cachedUser);
      userMenuBtn.innerHTML = `
        <img src="${userData.avatar || DEFAULT_AVATAR}" alt="User Avatar" id="userMenuAvatar">
        <span id="userMenuName">${userData.displayName || userData.username || 'Soul Seeker'}</span>
        <i class="fas fa-chevron-down"></i>
      `;
      
      userDropdown.innerHTML = `
        <a href="/lander.html"><i class="fas fa-fire"></i> Eternal Hearth</a>
        ${userData.username === 'ImmortalAl' || userData.role === 'admin' ? `
        <div class="divider"></div>
        <a href="/admin/"><i class="fas fa-crown"></i> Admin Panel</a>
        ` : ''}
        <div class="divider"></div>
        <a href="#" id="themeToggleMenu"><i class="fas fa-moon"></i> <span id="themeToggleText">Light Mode</span></a>
        <div class="divider"></div>
        <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Transcend Session</a>
      `;
      
      userMenuContainer.innerHTML = ''; 
      userMenuContainer.appendChild(userMenuBtn);
      userMenuContainer.appendChild(userDropdown);

    } catch (error) {
      console.error('[userMenu.js] Error parsing user data:', error);
      // Fallback to logged-out state if error
      document.body.classList.remove('user-logged-in');
      userMenuContainer.style.display = 'none';
      userMenuContainer.innerHTML = '';
      headerAuthButtonsContainer.style.display = 'flex'; // Assuming flex for column layout
      populateHeaderAuthButtons(headerAuthButtonsContainer);
    }
  } else {
    document.body.classList.remove('user-logged-in');
    userMenuContainer.style.display = 'none';
    userMenuContainer.innerHTML = ''; // Clear it
    headerAuthButtonsContainer.style.display = 'flex'; // Assuming flex for column layout
    populateHeaderAuthButtons(headerAuthButtonsContainer);
  }
  
  if (window.NEXUS && window.NEXUS.updateActiveUsersButtonVisibility) {
    window.NEXUS.updateActiveUsersButtonVisibility();
  }
  
  // Add a small delay to ensure elements are fully in DOM before setting up events
  setTimeout(() => {
    setupUserMenuEvents(); // Sets up dropdown toggle and logout
  }, 50);
  // Event listeners for new header buttons are set in populateHeaderAuthButtons
}

function populateHeaderAuthButtons(container) {
  container.innerHTML = `
    <a href="#" class="btn btn-primary" id="headerSignupButton">Embrace Immortality</a>
    <a href="#" class="btn btn-outline" id="headerLoginButton">Enter Sanctuary</a>
  `;
  const headerSignupButton = document.getElementById('headerSignupButton');
  const headerLoginButton = document.getElementById('headerLoginButton');

  if (headerSignupButton) {
    headerSignupButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.NEXUS && window.NEXUS.openSoulModal) {
        window.NEXUS.openSoulModal('register');
      } else {
        console.error('[userMenu.js] openSoulModal function not available!');
        alert('Registration modal not available. Please refresh the page.');
      }
    });
  }
  if (headerLoginButton) {
    headerLoginButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[userMenu.js] Login button clicked');
      if (window.NEXUS && window.NEXUS.openSoulModal) {
        console.log('[userMenu.js] Calling openSoulModal with login mode');
        window.NEXUS.openSoulModal('login');
      } else {
        console.error('[userMenu.js] openSoulModal function not available!');
        alert('Login modal not available. Please refresh the page.');
      }
    });
  }
}

// Update theme menu text and icon based on current theme
function updateThemeMenuText() {
  const themeToggleMenu = document.getElementById('themeToggleMenu');
  const themeToggleText = document.getElementById('themeToggleText');
  
  if (themeToggleMenu && themeToggleText && window.NEXUSTheme) {
    const currentTheme = window.NEXUSTheme.getTheme();
    const icon = themeToggleMenu.querySelector('i');
    
    if (currentTheme === 'dark') {
      themeToggleText.textContent = 'Light Mode';
      if (icon) icon.className = 'fas fa-sun';
    } else {
      themeToggleText.textContent = 'Dark Mode';
      if (icon) icon.className = 'fas fa-moon';
    }
  }
}

// Setup event listeners for user menu (dropdown toggle, logout)
function setupUserMenuEvents() {
  console.log('[userMenu.js] Setting up user menu events...');
  const userMenuBtn = document.getElementById('userMenuBtn'); // This might not exist if logged out
  const userDropdown = document.getElementById('userDropdown'); // This might not exist if logged out

  console.log('[userMenu.js] Elements found:', {
    userMenuBtn: !!userMenuBtn,
    userDropdown: !!userDropdown,
    userMenuBtnElement: userMenuBtn,
    userDropdownElement: userDropdown
  });

  if (userMenuBtn && userDropdown) {
    console.log('[userMenu.js] Setting up event listeners for user dropdown');
    
    // Add both click and touchstart events for mobile compatibility
    const toggleDropdown = (event) => {
      console.log('[userMenu.js] Dropdown toggle triggered by:', event.type);
      
      // Visual debug indicator
      const debugEl = document.getElementById('debug-indicator') || document.createElement('div');
      debugEl.id = 'debug-indicator';
      debugEl.style.cssText = `
        position: fixed; top: 10px; left: 10px; 
        background: red; color: white; padding: 5px; 
        z-index: 99999; font-size: 12px;
      `;
      debugEl.textContent = `Tap detected: ${event.type}`;
      if (!document.getElementById('debug-indicator')) {
        document.body.appendChild(debugEl);
      }
      setTimeout(() => debugEl.remove(), 2000);
      
      userDropdown.classList.toggle('active');
      const isActive = userDropdown.classList.contains('active');
      console.log('[userMenu.js] Dropdown active state:', isActive);
      
      // Visual debug for dropdown state
      const stateEl = document.getElementById('dropdown-state') || document.createElement('div');
      stateEl.id = 'dropdown-state';
      stateEl.style.cssText = `
        position: fixed; top: 50px; left: 10px; 
        background: ${isActive ? 'green' : 'blue'}; color: white; padding: 5px; 
        z-index: 99999; font-size: 12px;
      `;
      stateEl.textContent = `Dropdown: ${isActive ? 'OPEN' : 'CLOSED'}`;
      if (!document.getElementById('dropdown-state')) {
        document.body.appendChild(stateEl);
      }
      setTimeout(() => stateEl.remove(), 2000);
      
      // Force repaint and inline styles on mobile
      if (isActive) {
        // Force inline styles to override CSS issues with mobile-friendly z-index
        userDropdown.style.cssText = `
          position: absolute !important;
          top: calc(100% + 5px) !important;
          right: 0 !important;
          width: 200px !important;
          z-index: 999999 !important;
          background: var(--secondary, #1a1a33) !important;
          border: 1px solid var(--accent, #ff5e78) !important;
          border-radius: 12px !important;
          padding: 0.5rem 0 !important;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3) !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(0) translate3d(0,0,0) !important;
          display: block !important;
          pointer-events: auto !important;
          color: var(--text, white) !important;
        `;
        userDropdown.offsetHeight; // Force reflow
        
      } else {
        // Reset to hidden
        userDropdown.style.cssText = `
          opacity: 0 !important;
          visibility: hidden !important;
          transform: translateY(-10px) !important;
          pointer-events: none !important;
        `;
      }
    };
    
    // Remove any existing listeners first
    userMenuBtn.replaceWith(userMenuBtn.cloneNode(true));
    const freshBtn = document.getElementById('userMenuBtn');
    
    freshBtn.addEventListener('click', toggleDropdown);
    freshBtn.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent double-firing
      e.stopPropagation();
      toggleDropdown(e);
    });
    
    // Also try mousedown for additional compatibility
    freshBtn.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click only
        toggleDropdown(e);
      }
    });

    // Handle outside clicks/touches to close dropdown
    const closeOnOutsideClick = (event) => {
      const currentBtn = document.getElementById('userMenuBtn');
      const currentDropdown = document.getElementById('userDropdown');
      
      if (currentBtn && currentDropdown && 
          !currentBtn.contains(event.target) && 
          !currentDropdown.contains(event.target)) {
        if (currentDropdown.classList.contains('active')) {
          console.log('[userMenu.js] Closing dropdown due to outside click');
          currentDropdown.classList.remove('active');
        }
      }
    };
    
    // Remove existing listeners to avoid duplicates
    document.removeEventListener('click', closeOnOutsideClick);
    document.removeEventListener('touchstart', closeOnOutsideClick);
    
    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
  }
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Theme toggle menu item
  const themeToggleMenu = document.getElementById('themeToggleMenu');
  if (themeToggleMenu) {
    themeToggleMenu.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.NEXUSTheme) {
        window.NEXUSTheme.toggleTheme();
        updateThemeMenuText();
      }
    });
    
    // Update initial text based on current theme
    updateThemeMenuText();
  }
}

// Handle user logout
function handleLogout() {
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  document.body.classList.remove('user-logged-in');
  
  updateUserMenu(); // This will also trigger updateActiveUsersButtonVisibility
  
  // No updateUserSidebar to call
  
  window.location.href = '/'; // Redirect to home page after logout
}

// Check if token exists but user data is missing, then fetch user data
async function validateUserSession() {
  const API_BASE_URL = window.NEXUS_CONFIG.API_BASE_URL;
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');
  
  if (token && !cachedUser) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // If fetching user data fails (e.g., token invalid), clear token
        console.warn('[userMenu.js] Failed to fetch user data with existing token. Clearing token.');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user'); // Also clear potentially stale user data
      }
    } catch (error) {
      console.error('[userMenu.js] Error fetching user data for session validation:', error);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
    }
  }
  updateUserMenu(); // This will also trigger updateActiveUsersButtonVisibility
}

// Initialize user menu
function initUserMenu() {
  validateUserSession(); // Validate and then update UI
  // updateUserMenu(); // This is now called by validateUserSession
  
  // Listen for theme changes to update menu text
  window.addEventListener('nexus-theme-changed', updateThemeMenuText);
}

// Export the initialization function
window.NEXUS = window.NEXUS || {};
window.NEXUS.initUserMenu = initUserMenu;
window.NEXUS.updateUserMenu = updateUserMenu; // Expose for nexus-core.js storage listener
window.NEXUS.handleLogout = handleLogout; // Expose if needed by other components, e.g. mobile menu

// Function to update mobile auth links - DISABLED: Mobile nav should only contain navigation links
function updateMobileAuthLinks() {
    // Mobile navigation should only contain navigation links, not user auth functions
    // User authentication is handled through the header user menu dropdown
    return;
}
// Make sure setupMobileAuthClickHandlers can be called by navigation.js if it's responsible for main link injection
window.NEXUS.setupMobileAuthClickHandlers = updateMobileAuthLinks;
window.NEXUS.updateMobileAuthLinks = updateMobileAuthLinks;