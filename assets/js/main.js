/* ==========================================================================
   HealthFlo – Main Entry Script (Production)
   Purpose: Bootstraps UI, theming, navigation, accessibility helpers,
   config flags, and hands off to feature modules (animations, dashboard,
   particles, AI insights).
   ========================================================================== */

(() => {
  'use strict';

  /* ---------------------------------------
   * 0) GLOBAL CONFIG (editable & persisted)
   * ------------------------------------- */
  const DEFAULT_CONFIG = {
    // Core UX
    theme: 'auto',                 // 'light' | 'dark' | 'auto'
    animationsEnabled: true,       // user can opt-out; respected across modules
    animationQuality: 'medium',    // 'low' | 'medium' | 'high'
    narrationSpeed: 7,             // seconds between AI summary refreshes
    kpiAutoUpdateMs: 7000,         // live KPI update cadence (dashboard.js)
    // Feature toggles
    particlesEnabled: true,        // particles.js
    insightsAutoOpen: true,        // auto-open AI insights on first scroll
  };

  const STORAGE_KEY = 'hf-config-v1';

  const loadConfig = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const saved = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...saved };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  };

  const saveConfig = (cfg) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      window.dispatchEvent(new CustomEvent('hf:configChanged', { detail: cfg }));
    } catch {/* ignore quota */}
  };

  const HF = (window.HealthFlo = window.HealthFlo || {});
  HF.config = loadConfig();
  HF.updateConfig = (patch) => {
    HF.config = { ...HF.config, ...patch };
    saveConfig(HF.config);
  };

  /* ---------------------------------------
   * 1) UTILITIES
   * ------------------------------------- */
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const on = (el, evt, fn, opts) => el && el.addEventListener(evt, fn, opts);
  const debounce = (fn, ms = 200) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------
   * 2) PRELOADER
   * ------------------------------------- */
  const initPreloader = () => {
    const pre = $('.preloader');
    if (!pre) return;
    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        pre.classList.add('hidden');
        setTimeout(() => pre.remove(), 600);
      });
    });
  };

  /* ---------------------------------------
   * 3) THEME TOGGLE
   * - Respects OS preference when 'auto'
   * ------------------------------------- */
  const applyTheme = (mode) => {
    const root = document.documentElement;
    if (mode === 'auto') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', mode);
    }
  };

  const initTheme = () => {
    applyTheme(HF.config.theme);
    const btn = $('.theme-toggle');
    if (!btn) return;

    const nextMode = (cur) => (cur === 'light' ? 'dark' : cur === 'dark' ? 'auto' : 'light');

    const syncLabel = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      btn.setAttribute('aria-label', `Switch theme (current: ${cur})`);
      btn.textContent = cur === 'dark' ? '🌙' : cur === 'light' ? '☀️' : '🌓';
    };

    on(btn, 'click', () => {
      HF.updateConfig({ theme: nextMode(HF.config.theme) });
      applyTheme(HF.config.theme);
      syncLabel();
    });

    // Keep in sync if OS changes and user is in 'auto'
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    on(media, 'change', () => {
      if (HF.config.theme === 'auto') applyTheme('auto');
      syncLabel();
    });

    syncLabel();
  };

  /* ---------------------------------------
   * 4) NAVIGATION (mobile + sticky header)
   * ------------------------------------- */
  const initHeader = () => {
    const header = $('.header');
    const mobileToggle = $('.mobile-nav-toggle');
    const navLinks = $('.nav-links');

    // Sticky shadow
    const onScroll = () => {
      if (window.scrollY > 10) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    };
    on(window, 'scroll', onScroll, { passive: true }); onScroll();

    // Mobile menu
    if (mobileToggle && navLinks) {
      on(mobileToggle, 'click', () => {
        navLinks.classList.toggle('open');
        const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!expanded));
      });

      // Close on link click
      $$('.nav-links a').forEach((a) => on(a, 'click', () => navLinks.classList.remove('open')));
    }
  };

  /* ---------------------------------------
   * 5) SMOOTH ANCHORS (no jump)
   * ------------------------------------- */
  const initSmoothAnchors = () => {
    $$('a[href^="#"]').forEach((a) => {
      on(a, 'click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  };

  /* ---------------------------------------
   * 6) YEAR SYNC
   * ------------------------------------- */
  const syncYear = () => {
    const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
  };

  /* ---------------------------------------
   * 7) GEO MARQUEE (duplicate children once)
   * ------------------------------------- */
  const initGeoMarquee = () => {
    const track = $('.geo-marquee__track');
    if (!track || track.dataset.duplicated) return;
    const items = Array.from(track.children);
    const frag = document.createDocumentFragment();
    items.forEach((n) => frag.appendChild(n.cloneNode(true)));
    track.appendChild(frag);
    track.dataset.duplicated = 'true';
  };

  /* ---------------------------------------
   * 8) METRIC HOVER GLOW (pointer-reactive)
   * ------------------------------------- */
  const initMetricPointerGlow = () => {
    $$('.metric').forEach((card) => {
      on(card, 'pointermove', (ev) => {
        const rect = card.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * 100;
        const y = ((ev.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
      on(card, 'pointerenter', () => card.classList.add('add-glow'));
      on(card, 'pointerleave', () => card.classList.remove('add-glow'));
    });
  };

  /* ---------------------------------------
   * 9) ACCESSIBILITY: mark current nav link
   * ------------------------------------- */
  const markCurrentNav = () => {
    const page = document.body.dataset.page;
    $$('.nav-links a').forEach((a) => {
      const hash = a.getAttribute('href') || '';
      const matches = (hash.startsWith('#') && document.querySelector(hash)) ||
                      (page && a.dataset?.page === page);
      if (matches) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };

  /* ---------------------------------------
   * 10) USER CONTROLS VIA URL (optional)
   * - ?disableAnimations=1
   * - ?animationQuality=high|medium|low
   * - ?particles=0|1
   * - ?insightsAutoOpen=0|1
   * ------------------------------------- */
  const initUrlOverrides = () => {
    const p = new URLSearchParams(location.search);
    if (p.has('disableAnimations')) HF.updateConfig({ animationsEnabled: p.get('disableAnimations') !== '1' ? false : false });
    if (p.has('animationQuality'))  HF.updateConfig({ animationQuality: p.get('animationQuality') });
    if (p.has('particles'))         HF.updateConfig({ particlesEnabled: p.get('particles') === '1' });
    if (p.has('insightsAutoOpen'))  HF.updateConfig({ insightsAutoOpen: p.get('insightsAutoOpen') === '1' });
    if (p.has('narrationSpeed'))    HF.updateConfig({ narrationSpeed: Math.max(3, Number(p.get('narrationSpeed')) || DEFAULT_CONFIG.narrationSpeed) });
  };

  /* ---------------------------------------
   * 11) EXPOSE CONFIG TO OTHER MODULES
   * ------------------------------------- */
  const bootstrapModules = () => {
    // Animations (GSAP) – loaded via assets/js/animations.js
    if (window.HealthFloAnimations && HF.config.animationsEnabled && !prefersReduced) {
      try { window.HealthFloAnimations.init(); } catch {}
    }

    // Particles
    if (window.HealthFloParticles && HF.config.particlesEnabled && !prefersReduced) {
      try { window.HealthFloParticles.init({ quality: HF.config.animationQuality }); } catch {}
    }

    // Dashboard (sparklines + live updates)
    if (window.HealthFloDashboard) {
      try {
        window.HealthFloDashboard.init({
          autoUpdateMs: HF.config.kpiAutoUpdateMs,
          quality: HF.config.animationQuality
        });
      } catch {}
    }

    // AI Insights (narrative + executive summary)
    if (window.HealthFloInsights) {
      try {
        window.HealthFloInsights.init({
          autoOpenOnScroll: HF.config.insightsAutoOpen,
          narrationSpeed: HF.config.narrationSpeed,    // seconds
          animations: HF.config.animationsEnabled && !prefersReduced
        });
      } catch {}
    }
  };

  /* ---------------------------------------
   * 12) SETTINGS PANEL (hidden hook)
   * - For future: custom UI could bind to these.
   * ------------------------------------- */
  const initHiddenKeyboardToggles = () => {
    // Alt+Shift+A → toggle animations on/off
    on(document, 'keydown', (e) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyA') {
        HF.updateConfig({ animationsEnabled: !HF.config.animationsEnabled });
        alert(`Animations ${HF.config.animationsEnabled ? 'enabled' : 'disabled'}.`);
        // Let animations module respond to configChanged event
      }
    });
  };

  /* ---------------------------------------
   * 13) FALLBACK REVEAL if GSAP missing
   * ------------------------------------- */
  const initRevealFallback = () => {
    const els = $$('.gsap-reveal');
    if (!els.length) return;
    if (window.gsap) return; // animations.js will handle

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { threshold: 0.2 });

    els.forEach((el) => io.observe(el));
  };

  /* ---------------------------------------
   * 14) BOOT
   * ------------------------------------- */
  const init = () => {
    initUrlOverrides();
    initPreloader();
    initTheme();
    initHeader();
    initSmoothAnchors();
    initGeoMarquee();
    initMetricPointerGlow();
    markCurrentNav();
    syncYear();
    initHiddenKeyboardToggles();
    initRevealFallback();
    bootstrapModules();
  };

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Resize helpers (debounced)
  window.addEventListener('resize', debounce(() => {
    window.dispatchEvent(new CustomEvent('hf:resize'));
  }, 150));

})();
