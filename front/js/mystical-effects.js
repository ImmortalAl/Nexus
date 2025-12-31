/**
 * IMMORTAL NEXUS - MYSTICAL EFFECTS
 * Lightweight particle system for cosmic atmosphere
 */

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        particles: {
            count: window.innerWidth < 768 ? 15 : 30, // Fewer on mobile
            speed: 0.3,
            size: { min: 1, max: 3 },
            opacity: { min: 0.3, max: 0.8 }
        },
        shootingStars: {
            enabled: window.innerWidth >= 768, // Desktop only
            interval: 8000, // Every 8 seconds
            duration: 1500
        }
    };

    // ===== FLOATING PARTICLES =====

    class MysticalParticle {
        constructor(container) {
            this.container = container;
            this.element = document.createElement('div');
            this.element.className = 'mystical-particle';

            // Random starting position
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;

            // Random velocity
            this.vx = (Math.random() - 0.5) * CONFIG.particles.speed;
            this.vy = (Math.random() - 0.5) * CONFIG.particles.speed;

            // Random size and opacity
            const size = CONFIG.particles.size.min +
                        Math.random() * (CONFIG.particles.size.max - CONFIG.particles.size.min);
            const opacity = CONFIG.particles.opacity.min +
                           Math.random() * (CONFIG.particles.opacity.max - CONFIG.particles.opacity.min);

            // Style the particle
            this.element.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(255, 94, 120, ${opacity}), transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 5;
                left: ${this.x}px;
                top: ${this.y}px;
                box-shadow: 0 0 ${size * 2}px rgba(255, 94, 120, ${opacity * 0.5});
            `;

            this.container.appendChild(this.element);
        }

        update() {
            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Wrap around screen edges
            if (this.x < 0) this.x = window.innerWidth;
            if (this.x > window.innerWidth) this.x = 0;
            if (this.y < 0) this.y = window.innerHeight;
            if (this.y > window.innerHeight) this.y = 0;

            // Apply new position
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }

        destroy() {
            this.element.remove();
        }
    }

    // ===== SHOOTING STAR =====

    function createShootingStar() {
        const star = document.createElement('div');
        star.className = 'shooting-star';

        // Random starting position (top right quadrant)
        const startX = window.innerWidth * (0.5 + Math.random() * 0.5);
        const startY = window.innerHeight * Math.random() * 0.3;

        // Calculate end position (diagonal down-left)
        const endX = startX - (300 + Math.random() * 200);
        const endY = startY + (200 + Math.random() * 150);

        star.style.cssText = `
            position: fixed;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 5;
            left: ${startX}px;
            top: ${startY}px;
            box-shadow:
                0 0 4px 2px rgba(255, 255, 255, 0.8),
                0 0 8px 4px rgba(255, 94, 120, 0.4);
        `;

        document.body.appendChild(star);

        // Animate the shooting star
        const duration = CONFIG.shootingStars.duration;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentX = startX + (endX - startX) * eased;
            const currentY = startY + (endY - startY) * eased;
            const opacity = 1 - progress;

            star.style.left = currentX + 'px';
            star.style.top = currentY + 'px';
            star.style.opacity = opacity;

            // Add tail effect
            const tailLength = 60 * (1 - progress);
            star.style.boxShadow = `
                0 0 4px 2px rgba(255, 255, 255, ${opacity * 0.8}),
                ${-tailLength}px ${tailLength * 0.6}px ${tailLength}px 0 rgba(255, 255, 255, ${opacity * 0.3}),
                0 0 8px 4px rgba(255, 94, 120, ${opacity * 0.4})
            `;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                star.remove();
            }
        }

        requestAnimationFrame(animate);
    }

    // ===== CONSTELLATION LINES (on scroll) =====

    function addConstellationLines() {
        // Find all soul cards or feature cards
        const cards = document.querySelectorAll('.soul-card, .feature-card');

        if (cards.length < 2) return; // Need at least 2 cards

        // Create SVG overlay
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'constellation-overlay');
        svg.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        document.body.appendChild(svg);

        // Create lines between adjacent visible cards
        function updateLines() {
            svg.innerHTML = ''; // Clear existing lines

            const visibleCards = Array.from(cards).filter(card => {
                const rect = card.getBoundingClientRect();
                return rect.top < window.innerHeight && rect.bottom > 0;
            });

            for (let i = 0; i < visibleCards.length - 1; i++) {
                const card1 = visibleCards[i].getBoundingClientRect();
                const card2 = visibleCards[i + 1].getBoundingClientRect();

                const x1 = card1.left + card1.width / 2;
                const y1 = card1.top + card1.height / 2;
                const x2 = card2.left + card2.width / 2;
                const y2 = card2.top + card2.height / 2;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', 'rgba(255, 94, 120, 0.2)');
                line.setAttribute('stroke-width', '1');
                line.setAttribute('stroke-dasharray', '5,5');

                svg.appendChild(line);
            }
        }

        // Update on scroll (throttled)
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateLines, 100);
        });

        // Initial update
        updateLines();
    }

    // ===== MYSTICAL CURSOR TRAIL (Desktop only) =====

    function initCursorTrail() {
        if (window.innerWidth < 768) return; // Skip on mobile

        const trail = [];
        const trailLength = 8;

        document.addEventListener('mousemove', function(e) {
            // Add new point
            trail.push({ x: e.clientX, y: e.clientY, opacity: 1 });

            // Limit trail length
            if (trail.length > trailLength) {
                trail.shift();
            }

            // Create/update trail elements
            trail.forEach((point, index) => {
                let dot = document.querySelector(`.cursor-trail-${index}`);

                if (!dot) {
                    dot = document.createElement('div');
                    dot.className = `cursor-trail-${index}`;
                    dot.style.cssText = `
                        position: fixed;
                        width: 4px;
                        height: 4px;
                        background: rgba(255, 94, 120, ${point.opacity});
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 9999;
                        transition: opacity 0.3s ease;
                    `;
                    document.body.appendChild(dot);
                }

                const opacity = (index / trailLength) * 0.5;
                dot.style.left = point.x + 'px';
                dot.style.top = point.y + 'px';
                dot.style.opacity = opacity;
            });
        });
    }

    // ===== INITIALIZATION =====

    function init() {
        console.log('✨ Initializing Immortal Nexus mystical effects...');

        // Create particle container
        const particleContainer = document.createElement('div');
        particleContainer.className = 'mystical-particles-container';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            overflow: hidden;
        `;
        document.body.appendChild(particleContainer);

        // Create particles
        const particles = [];
        for (let i = 0; i < CONFIG.particles.count; i++) {
            particles.push(new MysticalParticle(particleContainer));
        }

        // Animate particles
        function animateParticles() {
            particles.forEach(particle => particle.update());
            requestAnimationFrame(animateParticles);
        }
        animateParticles();

        // Shooting stars (desktop only)
        if (CONFIG.shootingStars.enabled) {
            setInterval(createShootingStar, CONFIG.shootingStars.interval);

            // Create first one after 3 seconds
            setTimeout(createShootingStar, 3000);
        }

        // Constellation lines (if cards exist)
        setTimeout(addConstellationLines, 1000);

        // Cursor trail (desktop only)
        initCursorTrail();

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                // Adjust particle count if screen size changed significantly
                const newCount = window.innerWidth < 768 ? 15 : 30;

                if (newCount < particles.length) {
                    // Remove excess particles
                    while (particles.length > newCount) {
                        const particle = particles.pop();
                        particle.destroy();
                    }
                } else if (newCount > particles.length) {
                    // Add more particles
                    while (particles.length < newCount) {
                        particles.push(new MysticalParticle(particleContainer));
                    }
                }
            }, 500);
        });

        console.log('✨ Mystical effects initialized');
    }

    // ===== PERFORMANCE CHECK =====

    // Only initialize if user hasn't requested reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('⚡ Reduced motion preferred, skipping mystical effects');
        return;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
