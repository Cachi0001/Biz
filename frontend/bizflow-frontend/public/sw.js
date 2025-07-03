/**
 * Service Worker for Bizflow SME Nigeria
 * Handles push notifications and offline functionality
 */

const CACHE_NAME = 'bizflow-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Bizflow Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'bizflow-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Customize notification based on type
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'sale':
        notificationData.icon = '/icon-sale.png';
        notificationData.badge = '/badge-sale.png';
        notificationData.tag = 'sale-notification';
        break;
      case 'low_stock':
        notificationData.icon = '/icon-warning.png';
        notificationData.badge = '/badge-warning.png';
        notificationData.tag = 'stock-notification';
        notificationData.requireInteraction = true;
        break;
      case 'payment':
        notificationData.icon = '/icon-payment.png';
        notificationData.badge = '/badge-payment.png';
        notificationData.tag = 'payment-notification';
        break;
      case 'trial':
        notificationData.icon = '/icon-trial.png';
        notificationData.badge = '/badge-trial.png';
        notificationData.tag = 'trial-notification';
        notificationData.requireInteraction = true;
        break;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data
          });
          return;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData.length > 0) {
      // Sync offline data with server
      for (const item of offlineData) {
        try {
          await syncDataItem(item);
          await removeOfflineData(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
        }
      }

      // Notify user of successful sync
      self.registration.showNotification('Bizflow - Sync Complete', {
        body: `${offlineData.length} items synced successfully`,
        icon: '/icon-sync.png',
        tag: 'sync-notification'
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineData() {
  // Implementation would get data from IndexedDB
  // For now, return empty array
  return [];
}

async function syncDataItem(item) {
  // Implementation would sync individual items with server
  console.log('Syncing item:', item);
}

async function removeOfflineData(itemId) {
  // Implementation would remove synced item from offline storage
  console.log('Removing offline item:', itemId);
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});