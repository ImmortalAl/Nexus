// authModal.js - Handles the Soul Modal for authentication

// Constants are now in config.js and accessed via window.NEXUS_CONFIG
// const API_BASE_URL = 'https://nexus-ytrg.onrender.com/api'; // REMOVED

// Create and inject the Soul Modal
function injectSoulModal() {
  // Check if modal already exists
  if (document.getElementById('soulModal')) {
    return; // Modal already exists, don't create duplicate
  }
  
  // Create modal element directly
  const modalDiv = document.createElement('div');
  modalDiv.id = 'soulModal';
  modalDiv.className = 'soul-modal';
  modalDiv.setAttribute('aria-modal', 'true');
  modalDiv.setAttribute('role', 'dialog');
  modalDiv.setAttribute('tabindex', '-1');
  modalDiv.style.cssText = 'z-index: 99999 !important;'; // Ensure highest z-index
  
  modalDiv.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" aria-label="Close">&times;</button>
      <h2 id="soulModalTitle">Enter the Sanctuary</h2>
      <form id="soulLoginForm" autocomplete="on">
        <label>
          <span>Soul Identifier (Username)</span>
          <input type="text" name="username" required autocomplete="username" />
        </label>
        <label>
          <span>Ethereal Key (Password)</span>
          <input type="password" name="password" required autocomplete="current-password" />
        </label>
        <label id="confirmPasswordField" style="display: none;">
          <span>Confirm Ethereal Key</span>
          <input type="password" name="confirmPassword" autocomplete="new-password" />
        </label>
        <div class="ethereal-recovery-link" id="forgotPasswordLink" style="text-align: center; margin: 1rem 0 1.5rem 0; padding: 1rem; background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; transition: all 0.3s ease;">
          <a href="/request-reset.html" id="forgotPasswordBtn" style="color: var(--accent, #d4af37); text-decoration: none; font-weight: 600; font-size: 0.95em; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease;">
            <i class="fas fa-key" style="font-size: 1.1em; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);"></i>
            <span>Lost Your Ethereal Key? Reclaim Your Passage</span>
            <i class="fas fa-arrow-right" style="font-size: 0.9em; opacity: 0.7;"></i>
          </a>
        </div>
        <style>
          .ethereal-recovery-link:hover {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
            border-color: rgba(212, 175, 55, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
          }
          .ethereal-recovery-link:hover a {
            text-shadow: 0 0 15px rgba(212, 175, 55, 0.6);
          }
          .ethereal-recovery-link:hover .fa-arrow-right {
            opacity: 1;
            transform: translateX(3px);
          }
          @media (max-width: 768px) {
            .ethereal-recovery-link a span {
              font-size: 0.85em;
            }
          }
        </style>
        <button type="submit" class="modal-btn" id="soulModalSubmit">Transcend</button>
      </form>
      <div class="modal-feedback" id="modalFeedback"></div>
      <p class="modal-toggle-view" id="modalToggleView">
        New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>
      </p>
    </div>
  `;
  
  // Append directly to body
  document.body.appendChild(modalDiv);
  
  // Get modal elements
  soulModal = document.getElementById('soulModal');
  soulModalTitle = document.getElementById('soulModalTitle');
  soulLoginForm = document.getElementById('soulLoginForm');
  soulModalSubmit = document.getElementById('soulModalSubmit');
  modalFeedback = document.getElementById('modalFeedback');
  confirmPasswordField = document.getElementById('confirmPasswordField');
  modalToggleView = document.getElementById('modalToggleView');
}

// Modal elements references
let soulModal, soulModalTitle, soulLoginForm, soulModalSubmit, modalFeedback, confirmPasswordField, modalToggleView, forgotPasswordLink;

// Link texts
const switchToRegisterLinkHTML = 'New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>';
const switchToLoginLinkHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now</a>';

// Set modal view (login, register, or forgot-password)
function setSoulModalView(mode) {
  if (!soulModal || !soulLoginForm || !soulModalTitle || !confirmPasswordField || !soulModalSubmit || !modalToggleView) {
    // Modal elements missing - return silently as this may be expected on some pages
    return;
  }

  soulLoginForm.reset();
  if (modalFeedback) modalFeedback.textContent = '';
  soulModal.dataset.mode = mode;

  // Get forgot password link element
  if (!forgotPasswordLink) forgotPasswordLink = document.getElementById('forgotPasswordLink');

  if (mode === 'register') {
    soulModalTitle.textContent = 'Claim Your Immortality';
    confirmPasswordField.style.display = 'block';
    soulModalSubmit.textContent = 'Begin Your Eternity';
    modalToggleView.innerHTML = switchToLoginLinkHTML;
    if (forgotPasswordLink) forgotPasswordLink.style.display = 'none'; // Hide forgot password in register mode
    // Ensure confirm password input is required for registration
    const confirmPasswordInput = confirmPasswordField.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) confirmPasswordInput.required = true;
  } else if (mode === 'forgot-password') {
    soulModalTitle.textContent = 'Request Password Reset';
    confirmPasswordField.style.display = 'none';
    soulModalSubmit.textContent = 'Submit Request';
    modalToggleView.innerHTML = switchToLoginLinkHTML;
    if (forgotPasswordLink) forgotPasswordLink.style.display = 'none'; // Hide forgot password link

    // Change password field label
    const passwordLabel = soulLoginForm.querySelector('label:has(input[name="password"]) span');
    if (passwordLabel) {
      passwordLabel.textContent = 'Soul Identifier (Username)';
    }
    // Hide password field in forgot password mode
    const passwordField = soulLoginForm.querySelector('label:has(input[name="password"])');
    if (passwordField) passwordField.style.display = 'none';

    const confirmPasswordInput = confirmPasswordField.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) confirmPasswordInput.required = false;
  } else { // Default to login
    soulModalTitle.textContent = 'Enter the Sanctuary';
    confirmPasswordField.style.display = 'none';
    soulModalSubmit.textContent = 'Transcend';
    modalToggleView.innerHTML = switchToRegisterLinkHTML;
    if (forgotPasswordLink) forgotPasswordLink.style.display = 'block'; // Show forgot password in login mode

    // Restore password field if it was hidden
    const passwordField = soulLoginForm.querySelector('label:has(input[name="password"])');
    if (passwordField) passwordField.style.display = 'block';

    // Ensure confirm password input is NOT required for login
    const confirmPasswordInput = confirmPasswordField.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) confirmPasswordInput.required = false;
  }
}

// Open the Soul Modal
function openSoulModal(mode = 'login') {
  if (!soulModal) {
    console.error('[Auth Modal] openSoulModal: soulModal element not found!');
    return;
  }
  
  setSoulModalView(mode);
  soulModal.classList.add('active');
  soulModal.style.display = 'flex'; // Ensure modal is displayed
  soulModal.style.zIndex = '99999'; // Force highest z-index
  soulModal.style.opacity = '1'; // Force opacity
  soulModal.style.visibility = 'visible'; // Force visibility
  document.body.style.overflow = 'hidden'; // Prevent background scroll
  
  const usernameInput = soulModal.querySelector('input[name="username"]');
  if (usernameInput) {
    setTimeout(() => usernameInput.focus(), 100); // Delay focus for animation
  }
}

// Close the Soul Modal
function closeSoulModal() {
  if (!soulModal) {
    console.error('[Auth Modal] closeSoulModal: soulModal element not found!');
    return;
  }
  
  soulModal.classList.remove('active');
  setTimeout(() => {
    soulModal.style.display = 'none'; // Hide after animation
  }, 300);
  document.body.style.removeProperty('overflow'); // Restore background scroll
  
  if (modalFeedback) modalFeedback.textContent = '';
  if (soulLoginForm) soulLoginForm.reset();
}

// Handle form submission for login/register/forgot-password
async function handleSoulModalSubmit(event) {
  event.preventDefault();
  const API_BASE_URL = window.NEXUS_CONFIG.API_BASE_URL; // Use from config

  if (!soulLoginForm || !modalFeedback || !soulModalSubmit || !soulModal) return;

  modalFeedback.textContent = '';
  modalFeedback.className = 'modal-feedback'; // Reset class

  const username = soulLoginForm.username.value.trim();
  const password = soulLoginForm.password?.value;
  const mode = soulModal.dataset.mode || 'login';

  // Handle forgot password mode separately
  if (mode === 'forgot-password') {
    if (!username) {
      modalFeedback.textContent = 'Soul Identifier (Username) is required.';
      modalFeedback.classList.add('error');
      return;
    }

    soulModalSubmit.disabled = true;
    soulModalSubmit.textContent = 'Submitting...';
    modalFeedback.textContent = 'Processing your request...';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (!response.ok) {
        modalFeedback.textContent = data.error || `Error: ${response.status}`;
        modalFeedback.classList.add('error');
        return;
      }

      modalFeedback.textContent = data.message || 'Password reset request submitted. An administrator will review your request shortly.';
      modalFeedback.classList.add('success');

      setTimeout(() => {
        setSoulModalView('login');
      }, 3000);

    } catch (error) {
      console.error('[Forgot Password Error]:', error);
      modalFeedback.textContent = 'An unexpected error occurred. Please try again.';
      modalFeedback.classList.add('error');
    } finally {
      soulModalSubmit.disabled = false;
      soulModalSubmit.textContent = 'Submit Request';
    }
    return;
  }

  if (!username || !password) {
    modalFeedback.textContent = 'Soul Identifier and Ethereal Key are required.';
    modalFeedback.classList.add('error');
    return;
  }

  let url = '';
  let payload = { username, password };
  
  if (mode === 'register') {
    const confirmPasswordInput = soulLoginForm.confirmPassword;
    if (!confirmPasswordInput) {
      modalFeedback.textContent = 'Confirm password field missing.';
      modalFeedback.classList.add('error');
      return;
    }
    
    const confirmPassword = confirmPasswordInput.value;
    if (password !== confirmPassword) {
      modalFeedback.textContent = 'Ethereal Keys do not align.';
      modalFeedback.classList.add('error');
      return;
    }
    
    url = `${API_BASE_URL}/auth/signup`;
  } else {
    url = `${API_BASE_URL}/auth/login`;
  }
  
  soulModalSubmit.disabled = true;
  soulModalSubmit.textContent = mode === 'register' ? 'Forging...' : 'Transcending...';
  modalFeedback.textContent = 'Processing...';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      let errorMessage = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, use the status-based message
      }
      modalFeedback.textContent = errorMessage;
      modalFeedback.classList.add('error');
      return; // Exit early for HTTP errors
    }
    
    const data = await response.json();
    
    if (mode === 'login') {
      if (data.token) {
        localStorage.setItem('sessionToken', data.token);
        
        // Fetch user data after login
        const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Handle failure to fetch user data
          localStorage.removeItem('user');
        }
        
        modalFeedback.textContent = 'Sanctuary access granted.';
        modalFeedback.classList.add('success');
        
        // After successful login or registration, optionally update user display
        if (window.NEXUS && window.NEXUS.updateUserMenu) {
          window.NEXUS.updateUserMenu();
        }
        
        // Close the modal
        setTimeout(() => {
          closeSoulModal();
          window.location.reload();
        }, 1500);
      } else {
        modalFeedback.textContent = data.message || 'Token not received. Entry denied.';
        modalFeedback.classList.add('error');
      }
    } else { // Register
      // Registration successful - handle like login since backend returns token and user
      if (data.token) {
        localStorage.setItem('sessionToken', data.token);
        
        // Store user data if provided
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        modalFeedback.textContent = 'Eternity claimed! Welcome to the Sanctuary.';
        modalFeedback.classList.add('success');
        
        // Update user display
        if (window.NEXUS && window.NEXUS.updateUserMenu) {
          window.NEXUS.updateUserMenu();
        }
        
        // Close the modal and refresh page
        setTimeout(() => {
          closeSoulModal();
          window.location.reload();
        }, 1500);
      } else {
        // Fallback if no token (shouldn't happen with current backend)
        modalFeedback.textContent = data.message || 'Eternity claimed! Please enter the Sanctuary now.';
        modalFeedback.classList.add('success');
        
        setTimeout(() => {
          setSoulModalView('login');
          soulModalSubmit.disabled = false;
          soulModalSubmit.textContent = 'Transcend';
          modalFeedback.textContent = 'Please login with your new credentials.';
          modalFeedback.className = 'modal-feedback';
        }, 2000);
        
        return; // Skip re-enabling button below
      }
    }
  } catch (error) {
    console.error(`[Auth Modal Error - ${mode}]:`, error);
    
    // Handle different types of network errors
    let errorMessage = 'An unexpected disturbance occurred.';
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network connection failed. Please check your internet connection.';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Cross-origin request blocked. Please try again.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage = 'Network error occurred. Please try again.';
    }
    
    modalFeedback.textContent = errorMessage;
    modalFeedback.classList.add('error');
  } finally {
    if (mode !== 'register' || !modalFeedback.classList.contains('success')) {
      soulModalSubmit.disabled = false;
      soulModalSubmit.textContent = mode === 'register' ? 'Begin Your Eternity' : 'Transcend';
    }
  }
}

// Setup modal event listeners
function setupSoulModalEvents() {
  // Get modal elements if not already assigned
  if (!soulModal) soulModal = document.getElementById('soulModal');
  if (!soulModalTitle) soulModalTitle = document.getElementById('soulModalTitle');
  if (!soulLoginForm) soulLoginForm = document.getElementById('soulLoginForm');
  if (!soulModalSubmit) soulModalSubmit = document.getElementById('soulModalSubmit');
  if (!modalFeedback) modalFeedback = document.getElementById('modalFeedback');
  if (!confirmPasswordField) confirmPasswordField = document.getElementById('confirmPasswordField');
  if (!modalToggleView) modalToggleView = document.getElementById('modalToggleView');
  
  if (!soulModal || !soulLoginForm) {
    // Elements not found - this may be expected on pages that don't need authentication
    // Log at debug level instead of error to avoid console noise
    return;
  }
  
  // Close button event
  const closeButton = soulModal.querySelector('.close-modal');
  if (closeButton) {
    closeButton.addEventListener('click', closeSoulModal);
  }
  
  // Close on click outside
  soulModal.addEventListener('click', (event) => {
    if (event.target === soulModal) {
      closeSoulModal();
    }
  });
  
  // Toggle between login/register
  modalToggleView.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      event.preventDefault();

      if (event.target.id === 'switchToRegisterLink') {
        setSoulModalView('register');
      } else if (event.target.id === 'switchToLoginLink') {
        setSoulModalView('login');
      }
    }
  });

  // Forgot password link - now redirects to /request-reset.html
  // No event handler needed - native link behavior
  
  // Form submission
  soulLoginForm.addEventListener('submit', handleSoulModalSubmit);

  // Escape key handler for closing modal
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && soulModal && soulModal.classList.contains('active')) {
      closeSoulModal();
    }
  });
}

// Initialize auth modal
function initAuthModal() {
  injectSoulModal();
  setupSoulModalEvents();
}

// Export functions
window.NEXUS = window.NEXUS || {};
window.NEXUS.initAuthModal = initAuthModal;
window.NEXUS.openSoulModal = openSoulModal;
window.NEXUS.closeSoulModal = closeSoulModal;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthModal);
} else {
  // DOM is already loaded
  initAuthModal();
} 