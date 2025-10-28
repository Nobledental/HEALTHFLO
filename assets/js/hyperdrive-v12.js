/*
HealthFlo HYPERDRIVE v12 — Core (no visual changes)
- Theme engine (white/dark/matte/cosmic) with persistence
- Persona router (patient/hospital/insurer/employer) with gated sections
- Content hydrator via #hf-data JSON (optional)
- Copilot modal + FAB wiring with a11y focus trap
- Analytics hooks (dataLayer)
- Performance-safe bootstrap + PWA registration
*/
(function () {
const doc = document;
const win = window;
const html = doc.documentElement;
const body = doc.body;
const $ = (s, r = doc) => r.querySelector(s);
const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));


// ---------- Analytics ----
const dataLayer = (win.dataLayer = win.dataLayer || []);
const track = (event, props = {}) => {
try { dataLayer.push({ event, ...props, timestamp: Date.now() }); } catch {}
};


// ---------- Storage shim ----
const storage = (() => {
try {
const k = '__hf__';
localStorage.setItem(k, '1');
localStorage.removeItem(k);
return localStorage;
} catch {
return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}
})();


// ---------- Event bus ----
function dispatch(type, detail = {}) {
const ev = `hf:${type}`;
doc.dispatchEvent(new CustomEvent(ev, { detail }));
track(ev, detail);
}


// ---------- Theme Engine ----
const THEME_KEY = 'hf:theme';
const THEMES = new Set(['white', 'dark', 'matte', 'cosmic']);


function getSystemTheme() {
return win.matchMedia && win.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'white';
}
function applyTheme(theme) {
if (!THEMES.has(theme)) return;
html.setAttribute('data-theme', theme);
storage.setItem(THEME_KEY, theme);
// Update pressed state on theme buttons (non-breaking)
$$('button[data-theme]').forEach((btn) => {
const isActive = btn.getAttribute('data-theme') === theme;
if (isActive) btn.setAttribute('aria-pressed', 'true');
else btn.removeAttribute('aria-pressed');
});
dispatch('theme:change', { theme });
}
function initTheme() {
const saved = storage.getItem(THEME_KEY);
applyTheme(saved || html.getAttribute('data-theme') || getSystemTheme());
$$('[data-theme]').forEach((btn) => {
btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme')));
});
}


// ---------- Persona Router ----
})();
