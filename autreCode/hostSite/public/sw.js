// Cache name
const cacheName = 'pwa-cache-v2.5';

// Files to cache
const filesToCache = [
  '/',
  '/index.html',
  '/js.min.js',
  '/style/style.css',
  '/offline.html'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(filesToCache))
      .then(() => self.skipWaiting())
  );
});

// Fetch with offline fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(async () => {
        const response = await caches.match(event.request);
        return response || caches.match('/offline.html');
      })
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== cacheName) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
