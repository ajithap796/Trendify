// Trendify Invoicer — Service Worker
// Bumps CACHE_NAME whenever you change any file in this folder, so
// returning clients pick up the new version instead of a stale cache.
const CACHE_NAME = 'trendify-invoicer-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

// Cache the app shell as soon as the service worker installs.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Drop any old caches from a previous version of the app.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for everything (app shell + the CDN libraries the app
// loads), falling back to the network, and quietly re-caching whatever
// the network returns so the offline copy stays reasonably fresh.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => cachedResponse); // offline and not cached: fail gracefully

      return cachedResponse || networkFetch;
    })
  );
});
