const V = 'hf-v1';
const CORE = [
  '/', '/index.html',
  '/css/main.css','/css/animations.css',
  '/js/main.js','/js/forms.js','/js/gsap-init.js','/js/three-hero.js',
  '/img/hero-static.svg'
];
self.addEventListener('install', e=> e.waitUntil(caches.open(V).then(c=> c.addAll(CORE))));
self.addEventListener('activate', e=> e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==V&&caches.delete(k))))));
self.addEventListener('fetch', e=>{
  const {request:r} = e; if(r.method!=='GET') return;
  e.respondWith(caches.match(r).then(res=> res || fetch(r).then(resp=> {
    if(resp.ok){ const copy = resp.clone(); caches.open(V).then(c=> c.put(r, copy)); }
    return resp;
  })));
});
