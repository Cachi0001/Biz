// Service Worker for SabiOps PWA
const CACHE_NAME = 'sabiops-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sabiops.jpg',
  '/assets/index.css',
  '/assets/index.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/sabiops.jpg',
    badge: '/sabiops.jpg',
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SabiOps Notification', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Open the app and navigate to a specific page if provided
  const urlToOpen = event.notification.data.action_url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there is already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});