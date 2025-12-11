// Cache name
const cacheName = 'pwa-cache-v3.12';

// Files to cache
const filesToCache = [
 // '/',
  '/index.html',
  'https://pricealerts.github.io/js.min.js',
  'https://pricealerts.github.io/style/style.css',
  '/offline.html'
];


	self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
            .catch(async() => {
                // إذا فشل الاتصال بالإنترنت، نحاول البحث في الكاش
                return caches.match(event.request).then(response => {
                    if (response) {
                        return response;
                    }
                    
                    // إذا لم نجد الملف في الكاش، نتأكد هل الطلب هو "تصفح صفحة"؟
                    // إذا نعم، نعيد صفحة عدم الاتصال. أما إذا كان صورة أو ملف آخر، فلا نعيد شيئاً
                    if (event.request.mode === 'navigate') {
                        return caches.match("/offline.html");
                    }
                });
            })
    );
});

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(filesToCache))
      .then(() => self.skipWaiting())
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
