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
      if (window.NEXUS && window.NEXUS.openSoulModal) {
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
  const userMenuContainer = document.getElementById('userMenuContainer');
  if (!userMenuContainer) return;

  // Event delegation for all actions within the user menu
  userMenuContainer.addEventListener('click', (event) => {
    const userMenuBtn = event.target.closest('#userMenuBtn');
    const logoutBtn = event.target.closest('#logoutBtn');
    const themeToggleMenu = event.target.closest('#themeToggleMenu');

    if (userMenuBtn) {
      handleToggleDropdown(event, userMenuBtn);
    }
    if (logoutBtn) {
      event.preventDefault();
      handleLogout();
    }
    if (themeToggleMenu) {
      event.preventDefault();
      if (window.NEXUSTheme) {
        window.NEXUSTheme.toggleTheme();
        updateThemeMenuText();
      }
    }
  });
}

function handleToggleDropdown(event, button) {
  event.preventDefault();
  event.stopPropagation();
  const dropdown = document.getElementById('userDropdown');
  if (!dropdown) return;

  if (dropdown.classList.contains('active')) {
    closeDropdown(dropdown);
  } else {
    openDropdown(dropdown, button);
  }
}

function openDropdown(dropdown, button) {
  // Position the dropdown invisibly first
  positionDropdown(dropdown, button);

  // Use rAF to apply the 'active' class after the browser has painted the new position
  requestAnimationFrame(() => {
    dropdown.classList.add('active');
    
    // Add all closing event listeners
    document.addEventListener('click', handleOutsideClick, true);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    document.addEventListener('keydown', handleEscapeKey);
  });
}

function closeDropdown(dropdown) {
  dropdown.classList.remove('active');

  // Immediately remove listeners to prevent them from firing during the closing transition
  document.removeEventListener('click', handleOutsideClick, true);
  window.removeEventListener('resize', handleViewportChange);
  window.removeEventListener('scroll', handleViewportChange, { passive: true });
  document.removeEventListener('keydown', handleEscapeKey);

  // After the transition ends, clean up inline styles
  const onTransitionEnd = () => {
    clearDropdownPosition(dropdown);
    dropdown.removeEventListener('transitionend', onTransitionEnd);
  };
  dropdown.addEventListener('transitionend', onTransitionEnd);
}

// These handlers need to be named so they can be removed
function handleOutsideClick(event) {
  const dropdown = document.getElementById('userDropdown');
  const button = document.getElementById('userMenuBtn');
  // If the dropdown exists, is active, and the click was outside both the button and dropdown
  if (dropdown && dropdown.classList.contains('active')) {
      if (button && !button.contains(event.target) && !dropdown.contains(event.target)) {
          closeDropdown(dropdown);
      }
  }
}

function handleEscapeKey(event) {
  const dropdown = document.getElementById('userDropdown');
  if (event.key === 'Escape' && dropdown && dropdown.classList.contains('active')) {
    closeDropdown(dropdown);
  }
}

function handleViewportChange() {
  const dropdown = document.getElementById('userDropdown');
  const button = document.getElementById('userMenuBtn');
  if (dropdown && button && dropdown.classList.contains('active')) {
    positionDropdown(dropdown, button);
  }
}

function positionDropdown(dropdown, button) {
  if (!dropdown || !button) return;
  dropdown.classList.add('floating');
  const rect = button.getBoundingClientRect();
  const dropdownWidth = dropdown.offsetWidth || 200;
  const gutter = 10;
  
  let top = rect.bottom + gutter;
  let left = rect.right - dropdownWidth;

  const maxLeft = Math.max(0, window.innerWidth - dropdownWidth - gutter);
  if (left < gutter) left = gutter;
  if (left > maxLeft) left = maxLeft;

  dropdown.style.position = 'fixed';
  dropdown.style.top = `${Math.round(top)}px`;
  dropdown.style.left = `${Math.round(left)}px`;
  dropdown.style.right = 'auto';
}

function clearDropdownPosition(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove('floating');
    dropdown.style.removeProperty('position');
    dropdown.style.removeProperty('top');
    dropdown.style.removeProperty('left');
    dropdown.style.removeProperty('right');
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
  setupUserMenuEvents(); // Setup event delegation ONCE
  
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