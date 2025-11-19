// userMenu.js - Handles the user dropdown menu functionality

// Constants are now in config.js and accessed via window.NEXUS_CONFIG
// const API_BASE_URL = 'https://nexus-ytrg.onrender.com/api'; // REMOVED
// const DEFAULT_AVATAR = '/assets/images/default-avatar.png'; // REMOVED

// Track if event listeners are already attached (prevent duplicate listeners)
let userMenuEventsAttached = false;

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
        <div class="divider"></div>
        <a href="#" id="changePasswordBtn"><i class="fas fa-key"></i> Change Password</a>
        ${userData.username === 'ImmortalAl' || userData.role === 'admin' ? `
        <div class="divider"></div>
        <a href="/admin/"><i class="fas fa-crown"></i> Admin Panel</a>
        ` : ''}
        <div class="divider"></div>
        <a href="#" id="themeToggleMenu" data-theme-toggle="true"><i class="fas fa-moon"></i> <span id="themeToggleText">Light Mode</span></a>
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
  
  // Only set up events if not already attached
  if (!userMenuEventsAttached) {
    setTimeout(() => {
      setupUserMenuEvents(); // Sets up dropdown toggle and logout
      updateThemeMenuText(); // Sync theme toggle with actual current theme
    }, 50);
  } else {
    // Just update theme text if events already exist
    updateThemeMenuText();
  }
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
        console.error('openSoulModal function not available!');
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
        console.error('openSoulModal function not available!');
        alert('Login modal not available. Please refresh the page.');
      }
    });
  }
}

// Update theme menu text and icon based on current theme
function updateThemeMenuText() {
  const themeToggleMenu = document.getElementById('themeToggleMenu');
  const themeToggleText = document.getElementById('themeToggleText');
  
  if (themeToggleMenu && themeToggleText) {
    if (window.NEXUSTheme) {
      const currentTheme = window.NEXUSTheme.getTheme();
      const icon = themeToggleMenu.querySelector('i');
      
      if (currentTheme === 'dark') {
        themeToggleText.textContent = 'Light Mode';
        if (icon) icon.className = 'fas fa-sun';
      } else {
        themeToggleText.textContent = 'Dark Mode';
        if (icon) icon.className = 'fas fa-moon';
      }
    } else {
      // Fallback: detect current theme from body class
      const isDark = document.body.classList.contains('dark-theme');
      const icon = themeToggleMenu.querySelector('i');
      
      if (isDark) {
        themeToggleText.textContent = 'Light Mode';
        if (icon) icon.className = 'fas fa-sun';
      } else {
        themeToggleText.textContent = 'Dark Mode';
        if (icon) icon.className = 'fas fa-moon';
      }
    }
  }
}

// Setup event listeners for user menu (dropdown toggle, logout)
function setupUserMenuEvents() {
  // Prevent duplicate event listeners
  if (userMenuEventsAttached) {
    return;
  }

  const userMenuContainer = document.getElementById('userMenuContainer');
  if (!userMenuContainer) {
    // If element doesn't exist, try again after a short delay (navigation may still be loading)
    setTimeout(() => {
      const retryContainer = document.getElementById('userMenuContainer');
      if (retryContainer) {
        setupUserMenuEventsForContainer(retryContainer);
        userMenuEventsAttached = true;
      }
      // If still not found, silently return - this page doesn't use shared navigation
    }, 100);
    return;
  }

  setupUserMenuEventsForContainer(userMenuContainer);
  userMenuEventsAttached = true;
}

// Separate function to actually set up the events once we have the container
function setupUserMenuEventsForContainer(userMenuContainer) {

  // Event delegation for all actions within the user menu
  userMenuContainer.addEventListener('click', (event) => {
    const logoutBtn = event.target.closest('#logoutBtn');
    const userMenuBtn = event.target.closest('#userMenuBtn');
    const changePasswordBtn = event.target.closest('#changePasswordBtn');

    // Check logout FIRST before dropdown toggle (priority order matters!)
    if (logoutBtn) {
      event.preventDefault();
      event.stopPropagation();
      handleLogout();
      return; // Exit early
    }

    if (changePasswordBtn) {
      event.preventDefault();
      event.stopPropagation();
      openPasswordChangeModal();
      return; // Exit early
    }

    if (userMenuBtn) {
      handleToggleDropdown(event, userMenuBtn);
    }
    // Theme toggle now handled by themeManager.js via data-theme-toggle attribute
    // No need for duplicate handling here
  });

  // CRITICAL FIX: Add global document listener for logout button
  // This ensures logout works even when dropdown is moved to document.body
  document.addEventListener('click', (event) => {
    const logoutBtn = event.target.closest('#logoutBtn');
    if (logoutBtn) {
      event.preventDefault();
      event.stopPropagation();
      handleLogout();
    }
  }, true); // Use capture phase to intercept before other handlers
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
  // First, move dropdown to body to escape header constraints
  document.body.appendChild(dropdown);
  
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

  // After the transition ends, clean up inline styles and move back to original container
  const onTransitionEnd = () => {
    clearDropdownPosition(dropdown);
    
    // Move back to userMenuContainer
    const userMenuContainer = document.getElementById('userMenuContainer');
    if (userMenuContainer) {
      userMenuContainer.appendChild(dropdown);
    }
    
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
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user'); // Also clear potentially stale user data
      }
    } catch (error) {
      console.error('Error fetching user data for session validation:', error);
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

// Expose updateThemeMenuText globally so theme manager can access it
window.updateThemeMenuText = updateThemeMenuText;

// Function to update mobile auth links - DISABLED: Mobile nav should only contain navigation links
function updateMobileAuthLinks() {
    // Mobile navigation should only contain navigation links, not user auth functions
    // User authentication is handled through the header user menu dropdown
    return;
}
// Make sure setupMobileAuthClickHandlers can be called by navigation.js if it's responsible for main link injection
window.NEXUS.setupMobileAuthClickHandlers = updateMobileAuthLinks;
window.NEXUS.updateMobileAuthLinks = updateMobileAuthLinks;

// Password Change Modal Functions
function openPasswordChangeModal() {
  // Check if modal already exists
  let modal = document.getElementById('passwordChangeModal');
  if (!modal) {
    modal = createPasswordChangeModal();
    document.body.appendChild(modal);
  }

  // Clear form fields
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPasswordChange').value = '';
  document.getElementById('confirmPasswordChange').value = '';

  // Hide any previous feedback
  const feedback = document.getElementById('passwordChangeFeedback');
  if (feedback) {
    feedback.style.display = 'none';
  }

  // Show modal
  modal.classList.add('active');

  // Focus on first field
  setTimeout(() => {
    document.getElementById('currentPassword')?.focus();
  }, 100);

  // Close any open user dropdown
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && dropdown.classList.contains('active')) {
    closeDropdown(dropdown);
  }
}

function createPasswordChangeModal() {
  const modal = document.createElement('div');
  modal.id = 'passwordChangeModal';
  modal.className = 'password-change-modal';

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="modal-close" id="closePasswordModal" aria-label="Close modal">
        <i class="fas fa-times"></i>
      </button>
      <h2><i class="fas fa-key"></i> Change Your Password</h2>
      <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
        Update your password to keep your account secure.
      </p>
      <form id="passwordChangeForm">
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input type="password" id="currentPassword" required autocomplete="current-password">
        </div>
        <div class="form-group">
          <label for="newPasswordChange">New Password</label>
          <input type="password" id="newPasswordChange" required minlength="6" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="confirmPasswordChange">Confirm New Password</label>
          <input type="password" id="confirmPasswordChange" required minlength="6" autocomplete="new-password">
        </div>
        <button type="submit" class="btn-submit" id="passwordChangeSubmit">Update Password</button>
      </form>
      <div id="passwordChangeFeedback" class="feedback"></div>
    </div>

    <style>
      .password-change-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .password-change-modal.active {
        display: flex;
        opacity: 1;
      }

      .password-change-modal .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(5px);
      }

      .password-change-modal .modal-content {
        position: relative;
        background: var(--card-bg, #1a1a1a);
        padding: 2rem;
        border-radius: 12px;
        border: 2px solid var(--accent, #d4af37);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8);
        animation: modalSlideIn 0.3s ease;
      }

      @keyframes modalSlideIn {
        from {
          transform: translateY(-30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .password-change-modal .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: transparent;
        border: none;
        color: var(--text-color);
        font-size: 1.5rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .password-change-modal .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(90deg);
      }

      .password-change-modal h2 {
        font-family: 'Cinzel', serif;
        color: var(--accent, #d4af37);
        margin-bottom: 0.5rem;
        font-size: 1.8rem;
      }

      .password-change-modal .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
      }

      .password-change-modal .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text-color);
      }

      .password-change-modal .form-group input {
        width: 100%;
        padding: 0.75rem;
        background: var(--bg-color, #0a0a0a);
        border: 1px solid var(--border-color, #333);
        border-radius: 6px;
        color: var(--text-color, #e0e0e0);
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.3s ease;
      }

      .password-change-modal .form-group input:focus {
        outline: none;
        border-color: var(--accent, #d4af37);
      }

      .password-change-modal .btn-submit {
        width: 100%;
        padding: 1rem;
        background: var(--accent, #d4af37);
        color: #000;
        border: none;
        border-radius: 6px;
        font-size: 1.1rem;
        font-weight: 600;
        font-family: 'Cinzel', serif;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .password-change-modal .btn-submit:hover:not(:disabled) {
        background: var(--accent-hover, #b8941f);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
      }

      .password-change-modal .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .password-change-modal .feedback {
        margin-top: 1rem;
        padding: 0.75rem;
        border-radius: 6px;
        text-align: center;
        display: none;
      }

      .password-change-modal .feedback.error {
        background: rgba(244, 67, 54, 0.2);
        border: 1px solid #f44336;
        color: #f44336;
        display: block;
      }

      .password-change-modal .feedback.success {
        background: rgba(76, 175, 80, 0.2);
        border: 1px solid #4caf50;
        color: #4caf50;
        display: block;
      }
    </style>
  `;

  // Set up event listeners
  setupPasswordChangeModalEvents(modal);

  return modal;
}

function setupPasswordChangeModalEvents(modal) {
  // Close button
  const closeBtn = modal.querySelector('#closePasswordModal');
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close on overlay click
  const overlay = modal.querySelector('.modal-overlay');
  overlay.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });

  // Form submission
  const form = modal.querySelector('#passwordChangeForm');
  form.addEventListener('submit', handlePasswordChangeSubmit);
}

async function handlePasswordChangeSubmit(e) {
  e.preventDefault();

  const API_BASE_URL = window.NEXUS_CONFIG.API_BASE_URL;
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPasswordChange').value;
  const confirmPassword = document.getElementById('confirmPasswordChange').value;
  const feedback = document.getElementById('passwordChangeFeedback');
  const submitBtn = document.getElementById('passwordChangeSubmit');

  // Hide previous feedback
  feedback.style.display = 'none';
  feedback.className = 'feedback';

  // Validate passwords
  if (newPassword.length < 6) {
    feedback.className = 'feedback error';
    feedback.textContent = 'New password must be at least 6 characters';
    feedback.style.display = 'block';
    return;
  }

  if (newPassword !== confirmPassword) {
    feedback.className = 'feedback error';
    feedback.textContent = 'New passwords do not match';
    feedback.style.display = 'block';
    return;
  }

  if (currentPassword === newPassword) {
    feedback.className = 'feedback error';
    feedback.textContent = 'New password must be different from current password';
    feedback.style.display = 'block';
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating Password...';

  try {
    const token = localStorage.getItem('sessionToken');

    if (!token) {
      throw new Error('You must be logged in to change your password');
    }

    const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }

    // Success
    feedback.className = 'feedback success';
    feedback.textContent = 'Password updated successfully!';
    feedback.style.display = 'block';

    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPasswordChange').value = '';
    document.getElementById('confirmPasswordChange').value = '';

    // Close modal after 2 seconds
    setTimeout(() => {
      const modal = document.getElementById('passwordChangeModal');
      if (modal) {
        modal.classList.remove('active');
      }
    }, 2000);

  } catch (error) {
    console.error('[Password Change Error]:', error);
    feedback.className = 'feedback error';
    feedback.textContent = error.message || 'Failed to change password';
    feedback.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Update Password';
  }
}