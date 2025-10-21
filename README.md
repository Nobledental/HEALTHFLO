# HealthFlo Landing (Premium)

## Dev
- Static site, no build step. Open `index.html` or use a static server (e.g. `npx serve`).

## File map
- html: `index.html`, `patient.html`, `hospital.html`, `insurer.html`
- css: `css/main.css`, `css/animations.css`
- js: `js/main.js`, `js/forms.js`, `js/gsap-init.js`, `js/three-hero.js`, `js/ai-demo.js`
- media: `img/*`, `assets/icons/*`, `lottie/hero-blob.json`
- meta: `robots.txt`, `sitemap.xml`, `service-worker.js`

## Deploy to GitHub Pages
1. Create repo and push files.
2. In **Settings → Pages**, set **Source** to `main` branch `/ (root)`.
3. Optional: register Service Worker by adding:
   ```html
   <script>
     if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');
   </script>
