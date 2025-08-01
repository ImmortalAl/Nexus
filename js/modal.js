// Modal Management System
// Handles opening, closing, and interaction with modals

document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal system initialized');
    
    // Get modal elements
    const modal = document.getElementById('soulModal');
    const openButtons = document.querySelectorAll('#loginButton, #signupButton, #heroLoginButton, #heroSignupButton');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Open modal function
    function openModal() {
        console.log('Opening modal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            // Force extremely high z-index to test
            modal.style.zIndex = '2000000';
            
            // Add test overlay to verify modal appears above everything
            createTestOverlay();
        }
    }
    
    // Close modal function
    function closeModal() {
        console.log('Closing modal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            removeTestOverlay();
        }
    }
    
    // Create test overlay with high z-index to test modal layering
    function createTestOverlay() {
        const testOverlay = document.createElement('div');
        testOverlay.id = 'testOverlay';
        testOverlay.className = 'test-overlay';
        testOverlay.innerHTML = 'High z-index test element<br><small>Modal should appear ABOVE this</small>';
        testOverlay.style.zIndex = '999999';
        document.body.appendChild(testOverlay);
    }
    
    function removeTestOverlay() {
        const testOverlay = document.getElementById('testOverlay');
        if (testOverlay) {
            testOverlay.remove();
        }
    }
    
    // Add click event listeners to open buttons
    openButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Open button clicked:', button.id);
            openModal();
        });
    });
    
    // Add click event listeners to close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Close button clicked');
            closeModal();
        });
    });
    
    // Close modal when clicking outside content
    modal?.addEventListener('click', function(e) {
        if (e.target === modal) {
            console.log('Clicked outside modal content');
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            console.log('Escape key pressed');
            closeModal();
        }
    });
    
    // Form submission handler
    const authForm = document.getElementById('authForm');
    authForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        alert('Form submitted! (This is just a test)');
        closeModal();
    });
    
    console.log('Modal event listeners attached');
});