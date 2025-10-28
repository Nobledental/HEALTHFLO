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
  const PERSONA_KEY = 'hf:persona';
  const PERSONAS = new Set(['patient', 'hospital', 'insurer', 'employer']);

  function applyPersona(persona) {
    if (!PERSONAS.has(persona)) return;
    body.setAttribute('data-persona', persona);
    storage.setItem(PERSONA_KEY, persona);

    // Gate via data-visible-for="a,b" or data-persona="a"
    $$('[data-visible-for]').forEach((el) => {
      const list = (el.getAttribute('data-visible-for') || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      const show = list.includes(persona);
      if (!show && !el.hasAttribute('hidden')) el.setAttribute('hidden', '');
      if (show && el.hasAttribute('hidden')) el.removeAttribute('hidden');
    });
    $$('[data-persona]').forEach((el) => {
      // Only treat as content section if it's not a button/link
      const isControl = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.closest('.persona-switch');
      if (isControl) return;
      const show = el.getAttribute('data-persona') === persona;
      if (!show && !el.hasAttribute('hidden')) el.setAttribute('hidden', '');
      if (show && el.hasAttribute('hidden')) el.removeAttribute('hidden');
    });

    // Update current state on persona buttons (non-breaking)
    $$('button[data-persona]').forEach((btn) => {
      const isActive = btn.getAttribute('data-persona') === persona;
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    dispatch('persona:change', { persona });
    hydrate();
  }
  function initPersona() {
    const saved = storage.getItem(PERSONA_KEY);
    applyPersona(saved || body.getAttribute('data-persona') || 'patient');

    // Bind to all controls
    $$('button[data-persona], [data-action="set-persona"]').forEach((btn) => {
      btn.addEventListener('click', () => applyPersona(btn.getAttribute('data-persona')));
    });
  }

  // ---------- Content Hydrator (#hf-data JSON) ----
  function getDeep(obj, path) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }
  function hydrate() {
    const node = $('#hf-data');
    if (!node) return;
    let data = {};
    try { data = JSON.parse(node.textContent || '{}'); } catch {}
    const persona = body.getAttribute('data-persona') || 'patient';

    // hooks: [data-hf="a.b"], [data-hf-html="a.b"] supports {persona}
    $$('[data-hf], [data-hf-html]').forEach((el) => {
      const key = (el.getAttribute('data-hf') || el.getAttribute('data-hf-html') || '')
        .replace('{persona}', persona);
      const val = getDeep(data, key);
      if (val == null) return;
      if (el.hasAttribute('data-hf-html')) el.innerHTML = String(val);
      else el.textContent = String(val);
    });
  }

  // ---------- Copilot Modal + FAB ----
  const Copilot = (() => {
    const fab = $('#hf-copilot-fab');
    const modal = $('#hf-copilot');
    if (!fab || !modal) return { open: () => {}, close: () => {}, addMsg: () => {} };

    let open = false;
    let lastFocus = null;

    const closeBtn = modal.querySelector('.copilot-close');
    const form = modal.querySelector('.copilot-form');
    const input = modal.querySelector('.copilot-input');
    const thread = modal.querySelector('.copilot-thread');

    function show() {
      if (open) return;
      open = true;
      lastFocus = doc.activeElement;
      modal.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      trapFocus(modal);
      input && input.focus();
      dispatch('copilot:open');
    }
    function hide() {
      if (!open) return;
      open = false;
      modal.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
      releaseFocus();
      lastFocus && lastFocus.focus && lastFocus.focus();
      dispatch('copilot:close');
    }

    fab && fab.addEventListener('click', show);
    closeBtn && closeBtn.addEventListener('click', hide);
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) hide(); });

    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = (new FormData(form).get('q') || '').toString().trim();
      if (!q) return;
      form.reset();
      addMsg('user', q);
      dispatch('copilot:ask', { q });
    });

    function addMsg(role, text) {
      const el = doc.createElement('div');
      el.className = `msg msg-${role}`;
      el.textContent = text;
      thread.appendChild(el);
      thread.scrollTop = thread.scrollHeight;
    }

    return { open: show, close: hide, addMsg };
  })();

  // ---------- Focus trap helpers ----
  let focusTrapActive = null;
  function trapFocus(el) {
    focusTrapActive = el;
    el.addEventListener('keydown', handleTrap, true);
    const focusable = getFocusable(el);
    if (focusable[0]) focusable[0].focus();
  }
  function releaseFocus() {
    if (!focusTrapActive) return;
    focusTrapActive.removeEventListener('keydown', handleTrap, true);
    focusTrapActive = null;
  }
  function handleTrap(e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(focusTrapActive);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function getFocusable(root) {
    return $$('[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])', root)
      .filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  }

  // ---------- Bootstrap ----
  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
  }

  ready(() => {
    initTheme();
    initPersona();
    hydrate();
    registerSW();
  });
})();
