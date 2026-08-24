const CACHE_NAME = 'trackcm-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/maestro',
  '/alumno',
  '/leaderboard',
  '/manifest.json',
  '/favicon.ico',
];

// Install Event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback for navigation / static files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET or API POST requests in Service Worker
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-First for API GETs, Cache-First for static assets, Network-First for pages
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );

    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback for document navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/') || caches.match('/maestro');
        }
      })
  );
});
