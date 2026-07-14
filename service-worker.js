// Service Worker untuk Laju Akademik PWA
const CACHE_NAME = 'laju-akademik-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/walikelas.html',
  '/manifest.json'
];

// Install: cache aset statis
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first untuk aset statis, network-first untuk Firebase
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase & Gemini: selalu dari network (data realtime)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('generativelanguage.googleapis.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Aset statis: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache response baru jika sukses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback ke index.html
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
