// Immortal Nexus Analytics Tracker
// Comprehensive visitor and engagement tracking system

(function() {
    'use strict';
    
    const NEXUSAnalytics = {
        apiBaseUrl: window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api',
        visitorId: null,
        sessionId: null,
        startTime: Date.now(),
        
        init() {
            // Initialize visitor and session IDs
            this.visitorId = this.getOrCreateVisitorId();
            this.sessionId = this.createSessionId();
            
            // Track initial visit
            this.trackVisit();
            
            // Track initial page view
            this.trackPageView();
            
            // Setup engagement tracking
            this.setupEngagementTracking();
            
            // Track page unload time
            window.addEventListener('beforeunload', () => {
                this.trackSessionEnd();
            });
        },
        
        getOrCreateVisitorId() {
            let visitorId = localStorage.getItem('nexus_visitor_id');
            if (!visitorId) {
                visitorId = this.generateId();
                localStorage.setItem('nexus_visitor_id', visitorId);
            }
            return visitorId;
        },
        
        createSessionId() {
            return this.generateId();
        },
        
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        getVisitorDetails() {
            const ua = navigator.userAgent;
            return {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                user_agent: ua,
                device_type: this.getDeviceType(ua),
                browser: this.getBrowser(ua),
                language: navigator.language,
                screen_resolution: `${screen.width}x${screen.height}`,
                timezone_offset: new Date().getTimezoneOffset()
            };
        },
        
        getDeviceType(ua) {
            if (/mobile/i.test(ua)) return 'Mobile';
            if (/tablet/i.test(ua)) return 'Tablet';
            return 'Desktop';
        },
        
        getBrowser(ua) {
            if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
            if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
            if (/firefox/i.test(ua)) return 'Firefox';
            if (/edge/i.test(ua)) return 'Edge';
            if (/opera|opr/i.test(ua)) return 'Opera';
            return 'Other';
        },
        
        getReferrerCategory() {
            const referrer = document.referrer;
            if (!referrer) return 'Direct';
            
            const url = new URL(referrer);
            const hostname = url.hostname;
            
            // Check if it's from the same site
            if (hostname === window.location.hostname) return 'Internal';
            
            // Check for search engines
            if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\./i.test(hostname)) return 'Search';
            
            // Check for social media
            if (/facebook\.|twitter\.|instagram\.|linkedin\.|reddit\./i.test(hostname)) return 'Social';
            
            return 'External';
        },
        
        getSearchQuery() {
            const referrer = document.referrer;
            if (!referrer) return null;
            
            try {
                const url = new URL(referrer);
                // Google search query
                if (url.hostname.includes('google')) {
                    return url.searchParams.get('q') || url.searchParams.get('query');
                }
                // Bing search query
                if (url.hostname.includes('bing')) {
                    return url.searchParams.get('q');
                }
                // DuckDuckGo search query
                if (url.hostname.includes('duckduckgo')) {
                    return url.searchParams.get('q');
                }
            } catch (e) {
                // Invalid URL
            }
            
            return null;
        },
        
        async trackVisit() {
            try {
                await fetch(`${this.apiBaseUrl}/analytics/visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visitor_details: this.getVisitorDetails(),
                        timestamp: Date.now()
                    })
                });
            } catch (error) {
                console.error('Failed to track visit:', error);
            }
        },
        
        async trackPageView() {
            try {
                await fetch(`${this.apiBaseUrl}/analytics/page`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visitor_details: this.getVisitorDetails(),
                        url: window.location.pathname,
                        title: document.title,
                        referrer: document.referrer,
                        referrer_category: this.getReferrerCategory(),
                        search_query: this.getSearchQuery(),
                        timestamp: Date.now()
                    })
                });
            } catch (error) {
                console.error('Failed to track page view:', error);
            }
        },
        
        async trackEngagement(action, targetId, targetType, additionalData = {}) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                await fetch(`${this.apiBaseUrl}/analytics/engagement`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visitor_details: this.getVisitorDetails(),
                        action,
                        target_id: targetId,
                        target_type: targetType,
                        user_id: user._id || null,
                        additional_data: additionalData,
                        timestamp: Date.now()
                    })
                });
            } catch (error) {
                console.error('Failed to track engagement:', error);
            }
        },
        
        setupEngagementTracking() {
            // Track clicks on important elements
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button, .clickable');
                if (target) {
                    const action = target.dataset.analyticsAction || 'click';
                    const targetId = target.dataset.analyticsId || target.id || 'unknown';
                    const targetType = target.dataset.analyticsType || 'element';
                    
                    // Don't track internal navigation clicks
                    if (target.tagName === 'A' && target.hostname === window.location.hostname) {
                        return;
                    }
                    
                    this.trackEngagement(action, targetId, targetType);
                }
            });
        },
        
        trackSessionEnd() {
            const sessionDuration = Date.now() - this.startTime;
            // Send session duration data (using sendBeacon for reliability)
            const data = JSON.stringify({
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                duration: sessionDuration,
                timestamp: Date.now()
            });
            
            if (navigator.sendBeacon) {
                navigator.sendBeacon(`${this.apiBaseUrl}/analytics/session-end`, data);
            }
        }
    };
    
    // Initialize analytics when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NEXUSAnalytics.init());
    } else {
        NEXUSAnalytics.init();
    }
    
    // Expose to global scope for manual tracking
    window.NEXUSAnalytics = NEXUSAnalytics;
})();