/* ==========================================================================
   HealthFlo Service Worker (Prod)
   App Shell + Smart Caching v1.2.0
   - HTML: network-first (+ Navigation Preload, timeout fallback)
   - CSS/JS: stale-while-revalidate (no-cache on errors/opaque)
   - Images/Fonts: cache-first + soft TTL eviction
   - JSON: network-first (short TTL bucket)
   - Versioned precache; BroadcastChannel + postMessage lifecycle hooks
   ========================================================================== */

const SW_VERSION = 'v1.2.0';
const PREFIX = 'healthflo';
const PRECACHE = `${PREFIX}-precache-${SW_VERSION}`;
const RUNTIME = `${PREFIX}-runtime`;
const ASSETS = {
  cssjs: `${RUNTIME}-cssjs`,
  assets: `${RUNTIME}-assets`,
  data: `${RUNTIME}-data`,
};
const OFFLINE_FALLBACK_HTML = '/index.html'; // ensure available in PRECACHE

// Precache: prefer local copies; external CDNs may be opaque
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/animations.js',
  '/assets/js/particles.js',
  '/assets/js/dashboard.js',
  '/assets/js/components/ai-insights/ai-narrative.js',
];

// ---------------- Utilities ----------------
const bc = 'BroadcastChannel' in self ? new BroadcastChannel('hf-sw') : null;
const post = (msg) => {
  bc?.postMessage(msg);
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients =>
    clients.forEach(c => c.postMessage(msg))
  );
};

// Normalize cache keys (ignore common busting params)
const IGNORED_PARAMS = new Set(['v', 'ver', 'version', 'cachebust', 'utm_source', 'utm_medium', 'utm_campaign']);
const normalize = (request) => {
  try {
    const url = new URL(request.url);
    // only normalize same-origin
    if (url.origin === location.origin) {
      [...url.searchParams.keys()].forEach(k => { if (IGNORED_PARAMS.has(k)) url.searchParams.delete(k); });
      return new Request(url.toString(), { method: request.method, headers: request.headers, mode: request.mode, credentials: request.credentials, redirect: request.redirect });
    }
  } catch {}
  return request;
};

// Don’t cache error/opaque responses unless explicitly allowed
const okToCache = (res, { allowOpaque = false } = {}) =>
  res && (res.ok || (allowOpaque && res.type === 'opaque'));

// Stamp a cache time so we can evict by age later
const withTimestamp = async (response) => {
  const headers = new Headers(response.headers);
  headers.set('x-sw-cached-at', String(Date.now()));
  const body = await response.clone().blob();
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
};

// Soft TTL eviction (best-effort)
async function evictByAge(cacheName, ttlSeconds) {
  const cache = await caches.open(cacheName);
  const reqs = await cache.keys();
  const now = Date.now();
  await Promise.all(reqs.map(async (req) => {
    const res = await cache.match(req);
    const ts = Number(res?.headers.get('x-sw-cached-at') || 0);
    if (ts && (now - ts) / 1000 > ttlSeconds) {
      await cache.delete(req).catch(() => {});
    }
  }));
}

// A tiny network race helper (timeout in ms)
const fetchWithTimeout = (request, { timeout = 4500 } = {}) =>
  new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), timeout);
    fetch(request).then((r) => { clearTimeout(id); resolve(r); })
                  .catch((e) => { clearTimeout(id); reject(e); });
  });

// Cache put wrapper with timestamp + guard
async function put(cacheName, request, response, opts = {}) {
  if (!okToCache(response, opts)) return response;
  const cache = await caches.open(cacheName);
  try {
    const tsRes = await withTimestamp(response);
    await cache.put(request, tsRes.clone());
    return tsRes;
  } catch { return response; }
}

// Strategies
async function networkFirst(request, cacheName) {
  const req = normalize(request);
  const cache = await caches.open(cacheName);
  try {
    // Use Navigation Preload if available for navigations
    const preload = 'preloadResponse' in request ? await event.preloadResponse : null;
    const netRes = preload || await fetchWithTimeout(req);
    await put(cacheName, req, netRes.clone());
    return netRes;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (request.mode === 'navigate') return (await caches.match(OFFLINE_FALLBACK_HTML)) || Response.error();
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName, options = {}) {
  const req = normalize(request);
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  const networkPromise = fetch(req)
    .then(async (res) => { await put(cacheName, req, res.clone(), options); return res; })
    .catch(() => null);

  return cached || (await networkPromise) || (request.mode === 'navigate'
    ? (await caches.match(OFFLINE_FALLBACK_HTML)) || Response.error()
    : Response.error());
}

async function cacheFirst(request, cacheName, ttlSeconds, options = {}) {
  const req = normalize(request);
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req, { credentials: 'same-origin' });
    await put(cacheName, req, res.clone(), options);
    // schedule soft eviction (non-blocking)
    evictByAge(cacheName, ttlSeconds).catch(() => {});
    return res;
  } catch (e) {
    if (request.mode === 'navigate') {
      return (await caches.match(OFFLINE_FALLBACK_HTML)) || Response.error();
    }
    return Response.error();
  }
}

// ---------------- Install: precache shell ----------------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS);
      // Enable Navigation Preload for faster navigations
      await self.registration.navigationPreload?.enable();
    } finally {
      await self.skipWaiting();
      post({ type: 'SW_INSTALLED', version: SW_VERSION });
    }
  })());
});

// ---------------- Activate: clean old caches ----------------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(PREFIX) && ![PRECACHE, RUNTIME, ASSETS.cssjs, ASSETS.assets, ASSETS.data].includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
    post({ type: 'SW_ACTIVATED', version: SW_VERSION });
  })());
});

// ---------------- Fetch routing ----------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only GET
  if (request.method !== 'GET') return;

  // Same-origin HTML navigations → network-first (with preload/timeout)
  const isHTMLNav =
    request.mode === 'navigate' ||
    (request.destination === '' && request.headers.get('accept')?.includes('text/html'));

  if (isHTMLNav && url.origin === location.origin) {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
      } catch {}
      return networkFirst(request, RUNTIME);
    })());
    return;
  }

  // CSS/JS → SWR (same-origin only). For cross-origin, fall back to network (don’t cache opaque by default)
  if (
    (request.destination === 'style' || request.destination === 'script') ||
    url.pathname.endsWith('.css') || url.pathname.endsWith('.js')
  ) {
    if (url.origin === location.origin) {
      event.respondWith(staleWhileRevalidate(request, ASSETS.cssjs));
    } else {
      event.respondWith(fetch(request).catch(() => caches.match(request)));
    }
    return;
  }

  // Images/Fonts → cache-first with 60d TTL (cache same-origin; avoid growing third-party caches)
  if (['image', 'font'].includes(request.destination) || /\.(png|jpg|jpeg|gif|svg|webp|woff2?)$/i.test(url.pathname)) {
    if (url.origin === location.origin) {
      event.respondWith(cacheFirst(request, ASSETS.assets, 60 * 24 * 60 * 60));
    } else {
      event.respondWith(fetch(request).catch(() => caches.match(request)));
    }
    return;
  }

  // JSON/data → network-first into short-lived bucket (same-origin)
  const acceptsJSON = request.headers.get('accept')?.includes('application/json');
  if (acceptsJSON && url.origin === location.origin) {
    event.respondWith(networkFirst(request, ASSETS.data));
    return;
  }

  // Default → SWR for same-origin, network fallback otherwise
  if (url.origin === location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
  }
});

// ---------------- Messaging: lifecycle controls ----------------
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

// ---------------- Optional bespoke offline page ----------------
// To use, add '/offline.html' to PRECACHE_URLS and swap OFFLINE_FALLBACK_HTML above.
// self.addEventListener('fetch', (event) => {
//   if (event.request.mode === 'navigate') {
//     event.respondWith(fetch(event.request).catch(() => caches.open(PRECACHE).then(c => c.match('/offline.html'))));
//   }
// });

console.info(`[HealthFlo][SW] Registered ${SW_VERSION}`);
