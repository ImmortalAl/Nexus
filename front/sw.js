// Nexus Service Worker - PWA Core Functionality
// Enhanced with better caching, offline support, and performance
const CACHE_VERSION = 'nexus-v1.4.0'; // Fixed IndexedDB init, added offline.html, improved API detection
const STATIC_CACHE = `nexus-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `nexus-dynamic-${CACHE_VERSION}`;
const API_CACHE = `nexus-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `nexus-images-${CACHE_VERSION}`;
const FONT_CACHE = `nexus-fonts-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/lander.html',
  '/offline.html', // Offline fallback page
  '/pages/scrolls.html',
  '/pages/celestial-commons.html',
  '/pages/news.html',
  '/pages/messageboard.html',
  '/souls/index.html',
  '/css/main.css', // Consolidated stylesheet
  '/components/shared/config.js',
  '/components/shared/nexus-core.js',
  '/js/nexus-avatar-system.js',
  '/favicon.svg',
  '/favicon.ico',
  '/assets/images/default.jpg'
];

// API endpoints to cache with strategies
const API_CACHE_STRATEGIES = {
  '/api/users/online': { strategy: 'networkFirst', ttl: 30000 }, // 30 seconds
  '/api/users/me': { strategy: 'networkFirst', ttl: 300000 },    // 5 minutes
  '/api/blogs': { strategy: 'staleWhileRevalidate', ttl: 600000 }, // 10 minutes
  '/api/chronicles': { strategy: 'staleWhileRevalidate', ttl: 600000 }
};

// Background sync tags
const SYNC_TAGS = {
  MESSAGE_SEND: 'message-send',
  BLOG_POST: 'blog-post',
  CHRONICLE_SUBMIT: 'chronicle-submit',
  STATUS_UPDATE: 'status-update',
  LIKE_ACTION: 'like-action'
};

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[Nexus SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('nexus-') &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE &&
                cacheName !== IMAGE_CACHE &&
                cacheName !== FONT_CACHE) {
              console.log('[Nexus SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Nexus SW] Service Worker activated, taking control');
        return self.clients.claim(); // Take control of all pages immediately
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  // TODO: SW runs in worker context - can't access window.NEXUS_CONFIG
  // For now, check if URL is for API (either same-origin /api/ or known API domain)
  const isApiRequest = url.pathname.startsWith('/api/') ||
                       url.hostname.includes('nexus-ytrg.onrender.com') ||
                       url.hostname.includes('onrender.com'); // Catch any Render API calls

  if (isApiRequest) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle images
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(handleImage(request));
    return;
  }

  // Handle fonts
  if (request.destination === 'font' || /\.(woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(handleFont(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle dynamic content (HTML pages, CSS, JS)
  event.respondWith(handleDynamicContent(request));
});

// API request handler with different strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const strategy = getApiStrategy(endpoint);
  
  try {
    switch (strategy.type) {
      case 'networkFirst':
        return await networkFirst(request, API_CACHE, strategy.ttl);
      case 'cacheFirst':
        return await cacheFirst(request, API_CACHE, strategy.ttl);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request, API_CACHE);
      default:
        return await networkOnly(request);
    }
  } catch (error) {
    console.error('[Nexus SW] API request failed:', error);
    return await getCachedResponse(request, API_CACHE) || 
           new Response(JSON.stringify({ error: 'Offline - cached data unavailable' }), {
             status: 503,
             headers: { 'Content-Type': 'application/json' }
           });
  }
}

// Static asset handler
async function handleStaticAsset(request) {
  try {
    return await cacheFirst(request, STATIC_CACHE);
  } catch (error) {
    console.error('[Nexus SW] Static asset request failed:', error);
    return new Response('Offline - asset unavailable', { status: 503 });
  }
}

// Dynamic content handler
async function handleDynamicContent(request) {
  try {
    return await staleWhileRevalidate(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error('[Nexus SW] Dynamic content request failed:', error);

    // For HTML pages, return offline page if available
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('You are offline', {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Offline - content unavailable', { status: 503 });
  }
}

// Image handler - cache first with long TTL
async function handleImage(request) {
  try {
    return await cacheFirst(request, IMAGE_CACHE, 604800000); // 7 days
  } catch (error) {
    console.error('[Nexus SW] Image request failed:', error);
    // Return placeholder image or empty response
    return new Response('', { status: 503, statusText: 'Image unavailable' });
  }
}

// Font handler - cache first with very long TTL (fonts rarely change)
async function handleFont(request) {
  try {
    return await cacheFirst(request, FONT_CACHE, 2592000000); // 30 days
  } catch (error) {
    console.error('[Nexus SW] Font request failed:', error);
    return new Response('', { status: 503, statusText: 'Font unavailable' });
  }
}

// Caching strategies implementation
async function networkFirst(request, cacheName, ttl = 300000) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse(request, response.clone(), cacheName, ttl);
    }
    return response;
  } catch (error) {
    return await getCachedResponse(request, cacheName) || 
           Promise.reject(error);
  }
}

async function cacheFirst(request, cacheName, ttl = 86400000) {
  const cachedResponse = await getCachedResponse(request, cacheName);
  
  if (cachedResponse && !isCacheExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse(request, response.clone(), cacheName, ttl);
    }
    return response;
  } catch (error) {
    return cachedResponse || Promise.reject(error);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = getCachedResponse(request, cacheName);
  
  const networkResponse = fetch(request)
    .then(response => {
      if (response.ok) {
        cacheResponse(request, response.clone(), cacheName);
      }
      return response;
    })
    .catch(() => null);
  
  return (await cachedResponse) || (await networkResponse) || 
         new Response('Offline - content unavailable', { status: 503 });
}

async function networkOnly(request) {
  return await fetch(request);
}

// Helper functions
function getApiStrategy(endpoint) {
  for (const [pattern, config] of Object.entries(API_CACHE_STRATEGIES)) {
    if (endpoint.includes(pattern)) {
      return { type: config.strategy, ttl: config.ttl };
    }
  }
  return { type: 'networkOnly', ttl: 0 };
}

async function cacheResponse(request, response, cacheName, ttl = 86400000) {
  const cache = await caches.open(cacheName);
  const responseToCache = response.clone();
  
  // Add timestamp for TTL
  const headers = new Headers(responseToCache.headers);
  headers.append('sw-cached-at', Date.now().toString());
  headers.append('sw-ttl', ttl.toString());
  
  const cachedResponse = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headers
  });
  
  await cache.put(request, cachedResponse);
}

async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName);
  return await cache.match(request);
}

function isCacheExpired(response, ttl) {
  const cachedAt = response.headers.get('sw-cached-at');
  const cacheTtl = response.headers.get('sw-ttl');
  
  if (!cachedAt) return true;
  
  const age = Date.now() - parseInt(cachedAt);
  const maxAge = cacheTtl ? parseInt(cacheTtl) : ttl;
  
  return age > maxAge;
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
  switch (event.tag) {
    case SYNC_TAGS.MESSAGE_SEND:
      event.waitUntil(syncMessages());
      break;
    case SYNC_TAGS.BLOG_POST:
      event.waitUntil(syncBlogPosts());
      break;
    case SYNC_TAGS.CHRONICLE_SUBMIT:
      event.waitUntil(syncChronicleSubmissions());
      break;
    case SYNC_TAGS.STATUS_UPDATE:
      event.waitUntil(syncStatusUpdates());
      break;
    case SYNC_TAGS.LIKE_ACTION:
      event.waitUntil(syncLikeActions());
      break;
  }
});

// Push notification handler
self.addEventListener('push', event => {
  let notificationData = {
    title: 'Nexus Notification',
    body: 'You have a new update',
    icon: '/favicon.svg',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'nexus-notification'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[Nexus SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/assets/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/assets/icons/dismiss-icon.png'
        }
      ],
      data: notificationData.data || {}
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.navigate(urlToOpen);
              return;
            }
          }
          // Open new window if app not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Sync functions for offline actions
// TODO: These use hardcoded /api/ paths - assumes API is same-origin
// If API moves to different domain, these will break
async function syncMessages() {
  try {
    const pendingMessages = await getStoredData('pendingMessages');
    for (const message of pendingMessages) {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${message.token}`
        },
        body: JSON.stringify(message.data)
      });
    }
    await clearStoredData('pendingMessages');
  } catch (error) {
    console.error('[Nexus SW] Failed to sync messages:', error);
  }
}

async function syncBlogPosts() {
  try {
    const pendingPosts = await getStoredData('pendingBlogPosts');
    for (const post of pendingPosts) {
      await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${post.token}`
        },
        body: JSON.stringify(post.data)
      });
    }
    await clearStoredData('pendingBlogPosts');
  } catch (error) {
    console.error('[Nexus SW] Failed to sync blog posts:', error);
  }
}

async function syncChronicleSubmissions() {
  try {
    const pendingSubmissions = await getStoredData('pendingChronicleSubmissions');
    for (const submission of pendingSubmissions) {
      await fetch('/api/chronicles/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${submission.token}`
        },
        body: JSON.stringify(submission.data)
      });
    }
    await clearStoredData('pendingChronicleSubmissions');
  } catch (error) {
    console.error('[Nexus SW] Failed to sync chronicle submissions:', error);
  }
}

async function syncStatusUpdates() {
  try {
    const pendingUpdates = await getStoredData('pendingStatusUpdates');
    for (const update of pendingUpdates) {
      await fetch(`/api/users/${update.userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${update.token}`
        },
        body: JSON.stringify(update.data)
      });
    }
    await clearStoredData('pendingStatusUpdates');
  } catch (error) {
    console.error('[Nexus SW] Failed to sync status updates:', error);
  }
}

async function syncLikeActions() {
  try {
    const pendingLikes = await getStoredData('pendingLikeActions');
    for (const like of pendingLikes) {
      await fetch(`/api/blogs/${like.postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${like.token}`
        },
        body: JSON.stringify(like.data)
      });
    }
    await clearStoredData('pendingLikeActions');
  } catch (error) {
    console.error('[Nexus SW] Failed to sync like actions:', error);
  }
}

// IndexedDB helpers for offline storage
async function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexus-offline-storage', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores for offline data if they don't exist
      const stores = [
        'pendingMessages',
        'pendingBlogPosts',
        'pendingChronicleSubmissions',
        'pendingStatusUpdates',
        'pendingLikeActions'
      ];

      stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexus-offline-storage', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };

    request.onerror = () => reject(request.error);
  });
}

async function clearStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexus-offline-storage', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
    };

    request.onerror = () => reject(request.error);
  });
}