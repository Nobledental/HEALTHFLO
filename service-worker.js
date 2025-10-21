const VERSION = 'v5';
const PRECACHE = `hf-precache-${VERSION}`;
const RUNTIME  = `hf-runtime-${VERSION}`;

const SCOPE_ROOT = new URL('./', self.location);
const PRECACHE_PATHS = [
  './', './index.html', './patient.html', './hospital.html', './insurer.html',
  './assets/css/main.css',
  './assets/js/main.js',
  './assets/img/hero-static.svg',
  './lottie/hero-blob.json'
];
const PRECACHE_URLS = PRECACHE_PATHS.map((path) => new URL(path, SCOPE_ROOT).toString());
const INDEX_URL = new URL('./index.html', SCOPE_ROOT).toString();

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![PRECACHE, RUNTIME].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations: network-first
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const runtime = await caches.open(RUNTIME);
        runtime.put(request, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(PRECACHE);
        return (await cache.match(request)) || (await cache.match(INDEX_URL)) || Response.error();
      }
    })());
    return;
  }
  
  // CSS/JS: stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      const fetching = fetch(request).then(res => { cache.put(request, res.clone()); return res; }).catch(()=>null);
      return cached || fetching || fetch(request);
    })());
    return;
  }

  // Images/Lottie: cache-first
  if (request.destination === 'image' || request.url.endsWith('.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        cache.put(request, res.clone());
        return res;
      } catch { return fetch(request); }
    })());
    return;
  }

  // Default
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const res = await fetch(request);
      cache.put(request, res.clone());
      return res;
    } catch { return Response.error(); }
  })());
});
