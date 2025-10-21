/* =========================================================
   HealthFlo — Service Worker (v4)
   - Versioned precache for shell & critical assets
   - Runtime caching strategies by request type
   ========================================================= */

const VERSION = 'v4';
const PRECACHE = `hf-precache-${VERSION}`;
const RUNTIME  = `hf-runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',               // if you serve index.html at /
  '/index.html',
  '/patient.html',
  '/hospital.html',
  '/insurer.html',

  // CSS & JS (critical)
  '/assets/css/main.css',
  '/assets/js/main.js',

  // LCP & visuals
  '/assets/img/hero-static.svg',
  '/lottie/hero-blob.json',

  // You can add more icons/fonts as needed
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Cleanup old caches
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => ![PRECACHE, RUNTIME].includes(k))
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // 1) Navigation requests: network-first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const runtime = await caches.open(RUNTIME);
        runtime.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(PRECACHE);
        const match = await cache.match(url.pathname) || await cache.match('/index.html');
        return match || Response.error();
      }
    })());
    return;
  }

  // 2) CSS/JS: stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then(res => {
        cache.put(request, res.clone());
        return res;
      }).catch(()=>null);
      return cached || fetchPromise || fetch(request);
    })());
    return;
  }

  // 3) Images / Lottie: cache-first
  if (request.destination === 'image' || url.pathname.endsWith('.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        return fetch(request);
      }
    })());
    return;
  }

  // 4) Default: try cache, then network
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(request);
    return cached || fetch(request).then(res => {
      cache.put(request, res.clone());
      return res;
    }).catch(()=> Response.error());
  })());
});
