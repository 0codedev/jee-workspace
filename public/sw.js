// ============================================================================
// JEE Dashboard v2 Service Worker (PWA Offline Engine)
// Caches App Shell, KaTeX Math Engine, Fonts & Compiled Assets
// ============================================================================

const CACHE_NAME = 'jee-dashboard-v2-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg'
];

// External CDN dependencies (KaTeX math rendering)
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
];

// Install Event - Precache Core Shell & CDN Math Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache static assets
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.warn('[PWA] Failed to precache some static assets:', err);
      }

      // Precache CDN assets
      for (const url of CDN_ASSETS) {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (res && res.ok) {
            await cache.put(url, res);
          }
        } catch (e) {
          console.warn(`[PWA] Could not precache CDN url ${url}:`, e);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean Up Outdated Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Dynamic Cache-First / Network-First Strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and chrome-extension / API queries
  if (req.method !== 'GET') return;
  if (url.protocol.startsWith('chrome-extension')) return;

  // 1. Navigation requests (HTML pages) -> Network first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html');
          return cachedShell || caches.match('/');
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts, KaTeX CDN) -> Cache First with Network Background Refresh
  const isStaticAsset = 
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.hostname === 'cdn.jsdelivr.net' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) {
          // Fetch in background to update cache for next time
          fetch(req).then((networkRes) => {
            if (networkRes && networkRes.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
            }
          }).catch(() => {/* Ignore background network errors */});
          return cachedRes;
        }

        // Not in cache, fetch from network and cache
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 3. Default: Network with Cache Fallback
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.ok && req.url.startsWith(self.location.origin)) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});

// Listen for message to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
