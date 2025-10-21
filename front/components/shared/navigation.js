// navigation.js - Handles the consistent navigation bar across the site

function getRelativePath(currentPath) {
    // Determine the relative path prefix based on current page location
    if (currentPath === '/' || currentPath.endsWith('/index.html') || !currentPath.includes('/')) {
        return './'; // Root level
    } else if (currentPath.startsWith('/souls/')) {
        return '../'; // souls directory
    } else if (currentPath.startsWith('/pages/')) {
        return '../'; // pages directory
    } else if (currentPath.startsWith('/admin/')) {
        return '../'; // admin directory
    }
    return './'; // fallback
}

function generateCompleteHeaderHTML(currentPath) {
    const relativePath = getRelativePath(currentPath);
    const mainNavHTML = generateNavLinksHTML(currentPath, 'main');
    const mobileNavHTML = generateNavLinksHTML(currentPath, 'mobile');

    return `
        <div class="logo">
            <a href="/">
                <i class="fas fa-infinity"></i>
                <div class="title-stack">
                    <div class="full-title">
                        <span class="title-line-one">Immortal</span>
                        <span class="title-line-two">Nexus</span>
                    </div>
                    <h1 class="short-title">IN</h1>
                </div>
            </a>
        </div>
        <nav class="main-nav">
            <ul>
                ${mainNavHTML}
            </ul>
        </nav>
        <div class="header-controls">
            <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Toggle navigation">
                <i class="fas fa-bars"></i>
            </button>
            <div class="user-menu" id="userMenuContainer"></div>
            <div class="header-auth-buttons" id="headerAuthButtonsContainer" style="display: none;"></div>
        </div>

        <!-- Mobile Navigation -->
        <div class="mobile-overlay" id="mobileOverlay"></div>
        <nav class="mobile-nav" id="mobileNav">
            <div class="sidebar-header">
                <h2>Eternal Navigation</h2>
                <button class="close-sidebar" id="closeMobileNav" aria-label="Close mobile navigation">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <ul class="mobile-nav-list">
                ${mobileNavHTML}
            </ul>
        </nav>
    `;
}

function generateNavLinksHTML(currentPath, navType = 'main') {
    // Normalize currentPath for local file testing (ends with / or /index.html)
    const isHomePageLocal = currentPath.endsWith('/index.html') || currentPath.endsWith('/');
    const normalizedCurrentPath = isHomePageLocal && currentPath.includes('/Nexus/index.html') ? '/' : currentPath; // Simplify if it's the full local path to index

    const allLinks = [
        { href: "/", icon: "fas fa-home", text: "Home" },
        { href: "/lander.html", icon: "fas fa-fire", text: "Eternal Hearth" },
        { href: "/pages/news.html", icon: "fas fa-newspaper", text: "Boundless Chronicles" },
        { href: "/pages/mindmap.html", icon: "fas fa-project-diagram", text: "Infinite Nexus" },
        { href: "/souls", icon: "fas fa-users", text: "Eternal Souls" },
        { href: "/pages/blog.html", icon: "fas fa-scroll", text: "Soul Scrolls" },
        { href: "/pages/messageboard.html", icon: "fas fa-comments", text: "Echoes Unbound" },
        { href: "/pages/debate.html", icon: "fas fa-gavel", text: "Clash of Immortals" },
        { href: "/pages/celestial-commons.html", icon: "fas fa-star", text: "Celestial Commons" },
        { href: "/pages/archive.html", icon: "fas fa-vault", text: "Timeless Vault" }
    ];

    let linksToRender = allLinks;

    if (navType === 'main') {
        // For main navigation:
        // 1. Remove "Home" if on the homepage (normalized path)
        // 2. Always remove "Eternal Hearth"
        linksToRender = allLinks.filter(link => {
            if (link.text === "Home" && (normalizedCurrentPath === "/" || normalizedCurrentPath === "/index.html")) {
                return false; // Exclude Home on homepage
            }
            if (link.text === "Eternal Hearth") {
                return false; // Always exclude Eternal Hearth from main nav
            }
            return true;
        });
    } else if (navType === 'mobile') {
        // For mobile navigation:
        // 1. Remove "Home" if on the homepage (normalized path)  
        // 2. Always remove "Eternal Hearth" (available in user dropdown)
        linksToRender = allLinks.filter(link => {
            if (link.text === "Home" && (normalizedCurrentPath === "/" || normalizedCurrentPath === "/index.html")) {
                return false; // Exclude Home on homepage
            }
            if (link.text === "Eternal Hearth") {
                return false; // Always exclude Eternal Hearth from mobile nav
            }
            return true;
        });
    }
    // For any other navType, we use allLinks by default

    const finalHTML = linksToRender.map(link => {
        const isActive = normalizedCurrentPath === link.href || 
                       (link.href !== "/" && normalizedCurrentPath.startsWith(link.href)) || 
                       (link.href.endsWith('.html') && normalizedCurrentPath.endsWith(link.href));
        
        let linkText = link.text;
        if (navType === 'main' && link.text.includes(' ')) {
            linkText = link.text.replace(' ', '<br>');
        }

        const linkContent = navType === 'main' 
            ? `<i class="${link.icon}"></i><span>${linkText}</span>` 
            : `<i class="${link.icon}"></i> ${link.text}`;
        const linkHTML = `<li><a href="${link.href}" class="${isActive ? 'active' : ''}">${linkContent}</a></li>`;
        return linkHTML;
    }).join('');
    
    return finalHTML;
}

function injectCompleteHeader() {
    const headerElement = document.querySelector('header');
    const currentPath = window.location.pathname;

    if (headerElement) {
        const headerHTML = generateCompleteHeaderHTML(currentPath);
        headerElement.innerHTML = headerHTML;
        
        // Check computed styles with delay to ensure CSS is loaded
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(headerElement);

            // Force a re-render if header appears to have no height
            if (computedStyle.height === '0px' || computedStyle.display === 'none') {
                console.warn('Header appears to be hidden! Forcing visibility...');
                headerElement.style.display = 'flex';
                headerElement.style.visibility = 'visible';
                headerElement.style.minHeight = '60px';
                // DON'T set inline background - let CSS theme rules handle it!
                // headerElement.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
                headerElement.style.borderBottom = '2px solid #ff5e78';
                headerElement.style.position = 'sticky';
                headerElement.style.top = '0';
                headerElement.style.zIndex = '2500';
            }

        // FORCE GRID LAYOUT ON MOBILE TO PREVENT USER MENU SPILLING
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 900;
        const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const devicePixelRatio = window.devicePixelRatio || 1;

        if (isMobile || isRealMobile) {
            headerElement.style.display = 'grid';
            headerElement.style.gridTemplateColumns = 'auto 1fr auto';
            headerElement.style.alignItems = 'center';
            headerElement.style.justifyContent = 'space-between';
            headerElement.style.flexWrap = 'nowrap';
            
            // MOBILE DEVICE SPECIFIC DEBUGGING
            headerElement.style.minWidth = '0';
            headerElement.style.width = '100%';
            headerElement.style.position = 'relative';
            
            // Force header-controls to right side
            const headerControls = headerElement.querySelector('.header-controls');
            if (headerControls) {
                headerControls.style.gridColumn = '3';
                headerControls.style.justifySelf = 'end';
                headerControls.style.display = 'inline-flex';
                headerControls.style.alignItems = 'center';
                headerControls.style.gap = '0.5rem';
                headerControls.style.flexWrap = 'nowrap';
                
                // MOBILE DEVICE SPECIFIC
                headerControls.style.minWidth = '100px';
                headerControls.style.width = 'auto';
                headerControls.style.height = 'auto';
                headerControls.style.position = 'relative';
                headerControls.style.top = '0';
                headerControls.style.left = '0';
                headerControls.style.right = '0';
                headerControls.style.bottom = '0';
                headerControls.style.transform = 'none';
                headerControls.style.float = 'none';
            }

            // Force logo to left side
            const logo = headerElement.querySelector('.logo');
            if (logo) {
                logo.style.gridColumn = '1';
                logo.style.minWidth = '80px';
                logo.style.flexShrink = '0';
                logo.style.position = 'relative';
            }

            // Force user menu to stay inline
            const userMenu = headerElement.querySelector('.user-menu');
            if (userMenu) {
                userMenu.style.display = 'inline-flex';
                userMenu.style.alignItems = 'center';
                userMenu.style.flexShrink = '0';
                userMenu.style.verticalAlign = 'top';
                userMenu.style.position = 'relative';
                userMenu.style.top = '0';
                userMenu.style.left = '0';
                userMenu.style.right = '0';
                userMenu.style.bottom = '0';
                userMenu.style.transform = 'none';
                userMenu.style.float = 'none';
            }
            
            // MOBILE NAV TOGGLE
            const mobileToggle = headerElement.querySelector('.mobile-nav-toggle');
            if (mobileToggle) {
                mobileToggle.style.display = 'inline-flex';
                mobileToggle.style.alignItems = 'center';
                mobileToggle.style.justifyContent = 'center';
                mobileToggle.style.verticalAlign = 'top';
                mobileToggle.style.position = 'relative';
                mobileToggle.style.top = '0';
                mobileToggle.style.left = '0';
                mobileToggle.style.right = '0';
                mobileToggle.style.bottom = '0';
                mobileToggle.style.transform = 'none';
                mobileToggle.style.float = 'none';
            }
            
            // FORCE WEBKIT COMPLIANCE FOR FAIRPHONE
            document.body.style.webkitTextSizeAdjust = '100%';
            document.body.style.mozTextSizeAdjust = '100%';
            document.body.style.msTextSizeAdjust = '100%';
            document.body.style.textSizeAdjust = '100%';
        }
        }, 500);
        
        // Re-setup mobile navigation events after injecting new HTML
        setupMobileNavEvents();
        
        // Ensure user menu is initialized after header injection
        setTimeout(() => {
            if (window.NEXUS && window.NEXUS.initUserMenu) {
                window.NEXUS.initUserMenu();
            }
        }, 100);
    } else {
        console.error('No header element found!');
    }
}

function injectNavigation() {
    // Check if we should inject complete header or just nav links
    const headerElement = document.querySelector('header');
    const hasHeaderContent = headerElement && headerElement.innerHTML.trim().length > 0;

    // If header is empty or has placeholder content, inject complete header
    if (!hasHeaderContent || headerElement.innerHTML.includes('<!-- SHARED_HEADER -->')) {
        injectCompleteHeader();
        return;
    }

    // Otherwise, fall back to old behavior (just inject nav links)
    const mainNavUls = document.querySelectorAll('nav.main-nav ul');
    const mobileNavList = document.querySelector('.mobile-nav-list'); // Target for mobile links
    const currentPath = window.location.pathname;

    if (mainNavUls.length > 0) {
        mainNavUls.forEach((mainNavUl) => {
            const linksHTML = generateNavLinksHTML(currentPath, 'main');
            mainNavUl.innerHTML = linksHTML;
        });
    }

    if (mobileNavList) {
        let mobileLinksHTML = generateNavLinksHTML(currentPath, 'mobile');
        mobileNavList.innerHTML = mobileLinksHTML;
    }
}


function setupMobileNavEvents() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNav = document.getElementById('mobileNav');
    const closeMobileNav = document.getElementById('closeMobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');


    if (mobileNavToggle && mobileNav && closeMobileNav && mobileOverlay) {
        
        mobileNavToggle.addEventListener('click', () => {
            mobileNav.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            
        });

        const closeMenu = () => {
            mobileNav.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.removeProperty('overflow'); // Restore background scroll
        };

        closeMobileNav.addEventListener('click', (e) => {
            closeMenu();
        });

        // Replace overlay click with document click that checks if click is outside nav
        document.addEventListener('click', (e) => {
            if (mobileNav.classList.contains('active')) {
                
                // Close menu if click is outside the nav and not the toggle button
                if (!mobileNav.contains(e.target) && !mobileNavToggle.contains(e.target) && e.target !== mobileNavToggle) {
                    closeMenu();
                }
            }
        });

        // Close mobile nav if a link inside it is clicked - this will be called initially and after auth links update
        setupMobileNavLinkHandlers();

    }
}

// Setup event handlers for mobile nav links (to close menu when clicked)
function setupMobileNavLinkHandlers() {
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) return;

    const closeMenu = () => {
        mobileNav.classList.remove('active');
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.style.removeProperty('overflow'); // Restore background scroll
    };

    // All links in mobile nav are navigation links - close menu when any is clicked
    const mobileNavLinks = mobileNav.querySelectorAll('.mobile-nav-list a');
    mobileNavLinks.forEach(link => {
        // Remove existing event listener if any
        link.removeEventListener('click', closeMenu);
        // Add new event listener
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
}


// Initialize navigation
function initNavigation() {
    // Allow navigation injection on admin pages now
    injectNavigation();
    setupMobileNavEvents();
}

// Expose to global NEXUS object
window.NEXUS = window.NEXUS || {};
window.NEXUS.initNavigation = initNavigation;
// Expose injectNavigation if other scripts need to refresh it, e.g., after login/logout
window.NEXUS.injectNavigation = injectNavigation;
// Expose injectCompleteHeader for direct header injection
window.NEXUS.injectCompleteHeader = injectCompleteHeader;
// Expose setupMobileNavLinkHandlers so it can be called after auth links are updated
window.NEXUS.setupMobileNavLinkHandlers = setupMobileNavLinkHandlers;

// Make sure to call initNavigation after the DOM is loaded,
// for example, from nexus-core.js or a DOMContentLoaded listener.
// For now, if no core script is orchestrating, call it directly for testing,
// but ideally this is called by a main script.
// document.addEventListener('DOMContentLoaded', initNavigation); // Example: direct call 