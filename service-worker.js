/* ==========================================================================
   HealthFlo Service Worker (Production-Ready)
   Strategy: App Shell + Smart Caching
   - HTML: network-first (fallback to cache/offline)
   - CSS/JS: stale-while-revalidate
   - Images/Fonts: cache-first with expiration
   - JSON/data: network-first with short cache
   - Versioned precache for critical shell
   - BroadcastChannel + postMessage for lifecycle control
   ========================================================================== */

const SW_VERSION = 'v1.0.0';
const PREFIX = 'healthflo';
const PRECACHE = `${PREFIX}-precache-${SW_VERSION}`;
const RUNTIME = `${PREFIX}-runtime`;
const OFFLINE_FALLBACK_HTML = '/index.html'; // ensure index.html is available

// 🎯 Files you want immediately cached for offline app-shell
const PRECACHE_URLS = [
  '/',                 // redirect to /index.html on many hosts
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/animations.js',
  '/assets/js/particles.js',
  '/assets/js/dashboard.js',
  '/assets/js/components/ai-insights/ai-narrative.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/MotionPathPlugin.min.js',
];

/* ------------------------------------------
 * 📣 Helpers
 * ----------------------------------------*/
const bc = 'BroadcastChannel' in self ? new BroadcastChannel('hf-sw') : null;

function post(msg) {
  if (bc) bc.postMessage(msg);
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clis) => {
    clis.forEach((client) => client.postMessage(msg));
  });
}

async function putInCache(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  try {
    await cache.put(request, response.clone());
  } catch (e) {
    // Might fail for opaque responses or quota; ignore
  }
  return response;
}

async function cacheFirst(request, cacheName = RUNTIME, maxAgeSeconds = 30 * 24 * 60 * 60) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Apply simple "freshness" header guard
    const date = new Date(response.headers.get('date') || Date.now());
    const age = (Date.now() - date.getTime()) / 1000;
    if (age < maxAgeSeconds) await cache.put(request, response.clone());
    return response;
  } catch (err) {
    // Last resort: offline fallback for navigation
    if (request.mode === 'navigate') {
      return (await caches.match(OFFLINE_FALLBACK_HTML)) || Response.error();
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName = RUNTIME) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone()).catch(() => {});
      return networkResponse;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || (await caches.match(OFFLINE_FALLBACK_HTML)) || Response.error();
}

async function networkFirst(request, cacheName = RUNTIME) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || (await caches.match(OFFLINE_FALLBACK_HTML)) || Response.error();
  }
}

/* ------------------------------------------
 * 🧩 Install – Precache core shell
 * ----------------------------------------*/
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting(); // Activate immediately
      post({ type: 'SW_INSTALLED', version: SW_VERSION });
    })()
  );
});

/* ------------------------------------------
 * ♻️ Activate – Clean old caches
 * ----------------------------------------*/
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![PRECACHE, RUNTIME].includes(k) && k.startsWith(PREFIX))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
      post({ type: 'SW_ACTIVATED', version: SW_VERSION });
    })()
  );
});

/* ------------------------------------------
 * 🚦 Fetch – Route-based strategies
 * ----------------------------------------*/
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET, dev tools, or cross-origin POSTs etc.
  if (request.method !== 'GET') return;

  // HTML navigations: network-first to keep content fresh
  if (request.mode === 'navigate' || (request.destination === '' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(networkFirst(request, RUNTIME));
    return;
  }

  // CSS & JS: stale-while-revalidate for fast page loads
  if (request.destination === 'style' || request.destination === 'script' || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }

  // Images & Fonts: cache-first with long expiration
  if (['image', 'font'].includes(request.destination) || /\.(png|jpg|jpeg|gif|svg|webp|woff2?)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, `${RUNTIME}-assets`, 60 * 24 * 60 * 60)); // 60 days
    return;
  }

  // JSON/Data: network-first with short cache
  if (request.destination === 'document' || request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(networkFirst(request, `${RUNTIME}-data`));
    return;
  }

  // Default: try SWR
  event.respondWith(staleWhileRevalidate(request, RUNTIME));
});

/* ------------------------------------------
 * 🔁 Manual SW lifecycle control (optional)
 * ----------------------------------------*/
// Allow pages to trigger skipWaiting/claim via postMessage
self.addEventListener('message', async (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') {
    await self.skipWaiting();
    post({ type: 'SW_SKIPPED_WAITING', version: SW_VERSION });
  }
  if (type === 'CLIENTS_CLAIM') {
    await self.clients.claim();
    post({ type: 'SW_CLAIMED_CLIENTS', version: SW_VERSION });
  }
});

/* ------------------------------------------
 * 🧪 Offline fallback response (optional)
 * ----------------------------------------*/
// If you want a bespoke offline page, uncomment below and add to PRECACHE_URLS.
// self.addEventListener('fetch', (event) => {
//   if (event.request.mode === 'navigate') {
//     event.respondWith(
//       fetch(event.request).catch(async () => (await caches.open(PRECACHE)).match('/offline.html'))
//     );
//   }
// });

/* ------------------------------------------
 * 🧭 Version log
 * ----------------------------------------*/
console.info(`[HealthFlo][SW] Registered ${SW_VERSION}`);
