/* ==========================================================================
   HealthFlo – Cinematic Motion System (GSAP) • Upgraded Production Build
   Core: GSAP + ScrollTrigger + MotionPathPlugin (free)
   Optional: SplitText/ScrollSmoother/Flip (premium) — safely ignored if absent
   Behavior:
   • Auto-inits when DOM & GSAP are ready (with fallback polling if CDNs are slow)
   • Respects reduced motion + HealthFlo.config.animationsEnabled
   • Quality-aware (data-anim-quality on <body>) and route-safe refreshes
   • Audience tabs reflow ScrollTrigger; counters, reveals, hover tilt, hero path sweep
   • Plays nicely with KPI/Insights custom events (soft highlights)
   CDN (place before this file):
     <!-- GSAP Core -->
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>
     <!-- ScrollTrigger -->
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" defer></script>
     <!-- MotionPathPlugin -->
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/MotionPathPlugin.min.js" defer></script>
   ========================================================================== */

window.HealthFloAnimations = (function () {
  'use strict';

  /* ---------------------------------------
   * Guards & Config
   * ------------------------------------- */
  const hasGSAP = () => typeof window.gsap !== 'undefined';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cfg = () => (window.HealthFlo && window.HealthFlo.config) ? window.HealthFlo.config : {
    animationsEnabled: true,
    animationQuality: 'medium'
  };

  // Shorthands
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts || false);
  const debounce = (fn, ms=150) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

  // Quality tag for CSS hooks
  const applyQuality = () => {
    const q = (cfg().animationQuality || 'medium').toLowerCase();
    document.body.dataset.animQuality = q; // e.g., low|medium|high
  };

  /* ---------------------------------------
   * Split helpers (free simulation of SplitText)
   * ------------------------------------- */
  function splitChars(el) {
    if (!el || el.dataset.hfSplitChars === '1') return;
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(14px)';
      span.textContent = ch;
      frag.appendChild(span);
    }
    el.appendChild(frag);
    el.dataset.hfSplitChars = '1';
  }

  function splitWords(el) {
    if (!el || el.dataset.hfSplitWords === '1') return;
    const words = el.textContent.split(/(\s+)/);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    words.forEach(w => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(10px)';
      span.textContent = w;
      frag.appendChild(span);
    });
    el.appendChild(frag);
    el.dataset.hfSplitWords = '1';
  }

  /* ---------------------------------------
   * Features
   * ------------------------------------- */

  // 3D hover tilt (GSAP quickTo for butter-smooth)
  function attachTilt(cards, maxRotate = 6) {
    const gs = window.gsap;
    cards.forEach((card) => {
      card.style.transformStyle = 'preserve-3d';
      card.style.perspective = '1000px';
      const rotX = gs.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
      const rotY = gs.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });
      const z = gs.quickTo(card, 'z', { duration: 0.4, ease: 'power2.out' });

      on(card, 'pointermove', (ev) => {
        const r = card.getBoundingClientRect();
        const rx = ((ev.clientY - r.top) / r.height) * 2 - 1; // -1..1
        const ry = ((ev.clientX - r.left) / r.width) * 2 - 1;
        rotX(-rx * maxRotate);
        rotY(ry * maxRotate);
        z(12);
      });
      on(card, 'pointerleave', () => { rotX(0); rotY(0); z(0); });
    });
  }

  // Counter animation
  function animateCounters() {
    const gs = window.gsap;
    $$('.gsap-counter strong').forEach((el) => {
      if (el.dataset.animated === '1') return;
      const raw = el.dataset.target || el.textContent;
      const suffix = el.dataset.suffix || el.textContent.replace(/^[\d.,\s]+/, '');
      const prefix = el.dataset.prefix || el.textContent.replace(/[\d.,\s]+$/, '');
      const target = Number(String(raw).replace(/[^\d.]/g, '')) || 0;

      el.dataset.animated = '1';
      gs.fromTo(el, { innerText: 0 }, {
        innerText: target,
        duration: 1.4,
        ease: 'power1.out',
        snap: { innerText: 1 },
        onUpdate() { el.textContent = `${prefix}${Math.floor(el.innerText).toLocaleString()}${suffix}`; }
      });
    });
  }

  // Generic reveal/stagger/steps
  function revealOnScroll() {
    const gs = window.gsap;
    const st = window.ScrollTrigger;

    $$('.section-head h2').forEach(h => {
      // Prefer words for section titles (cleaner look)
      splitWords(h);
      gs.fromTo(h.querySelectorAll('.word'),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.03,
          scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none none' } }
      );
    });

    $$('.gsap-reveal').forEach((el) => {
      gs.fromTo(el, { y: 22, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.65, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
      });
    });

    $$('.gsap-stagger').forEach((el) => {
      gs.from(el, {
        y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.12,
        scrollTrigger: { trigger: el.parentElement, start: 'top 80%' }
      });
    });

    $$('.gsap-scroll').forEach((el, i) => {
      gs.from(el, {
        x: i % 2 === 0 ? -24 : 24, opacity: 0, duration: 0.58, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });
  }

  // Hero entrance + canvas float
  function heroMotion() {
    const gs = window.gsap;
    const tl = gs.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.eyebrow', { y: 14, opacity: 0, duration: 0.4 })
      .from('.headline', { y: 24, opacity: 0, duration: 0.55 }, '-=0.15')
      .from('.subtext', { y: 16, opacity: 0, duration: 0.5 }, '-=0.18')
      .from('.cta-group a', { y: 14, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.1')
      .from('.hero-metrics div', { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.1');

    const h = $('.headline');
    if (h) {
      splitChars(h);
      gs.fromTo(h.querySelectorAll('.char'),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.02 }
      );
    }

    const canvas = $('#hero-animation');
    if (canvas) gs.to(canvas, { yPercent: -4, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }

  // MotionPath micro-accent (emerald sweep along rounded rect)
  function heroMotionPathSweep() {
    const gs = window.gsap;
    if (!window.MotionPathPlugin) return;
    gs.registerPlugin(MotionPathPlugin);

    const svg = document.querySelector('#hero svg, .hero-slab svg');
    if (!svg) return;

    const marker = document.createElementNS('http://www.w3.org/2000/svg','circle');
    marker.setAttribute('r', '3.5');
    marker.setAttribute('fill', '#10b981'); // emerald
    marker.setAttribute('opacity', '0.85');
    svg.appendChild(marker);

    const vb = svg.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : 460;
    const h = vb && vb.height ? vb.height : 360;
    const pad = 22;

    const d = `
      M ${pad} ${pad + 20}
      h ${w - pad * 2}
      a 20 20 0 0 1 20 20
      v ${h - pad * 2 - 40}
      a 20 20 0 0 1 -20 20
      h -${w - pad * 2}
      a 20 20 0 0 1 -20 -20
      v -${h - pad * 2 - 40}
      a 20 20 0 0 1 20 -20 Z
    `;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'none');
    svg.appendChild(path);

    gs.to(marker, {
      duration: 10, repeat: -1, ease: 'sine.inOut', yoyo: true, opacity: 0.18,
      motionPath: { path, align: path, autoRotate: false, alignOrigin: [0.5, 0.5], start: 0.08, end: 0.92 }
    });
  }

  // Audience tabs + floating cards + ScrollTrigger refresh
  function audiencePanels() {
    const gs = window.gsap;
    const section = $('.audience-showcase');
    if (!section) return;
    const tabs = $$('.audience-tab', section);
    const panels = $$('.audience-panel', section);

    const floatCard = (card, i) =>
      gs.to(card, { y: '+=8', duration: 4 + i * 0.2, ease: 'sine.inOut', repeat: -1, yoyo: true });

    let floats = [];
    const killFloats = () => { floats.forEach(t => t.kill()); floats = []; };

    const animatePanel = (panel) => {
      gs.from(panel.querySelector('.audience-panel__content'), {
        opacity: 0, y: 22, duration: 0.55, ease: 'power2.out'
      });
      const cards = $$('.audience-card', panel);
      cards.forEach((card, i) => {
        const dir = card.dataset.motion;
        const fromX = dir === 'left' ? -24 : dir === 'right' ? 24 : 0;
        gs.fromTo(card, { x: fromX, y: 18, opacity: 0 }, {
          x: 0, y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: i * 0.08
        });
        floats.push(floatCard(card, i));
      });
    };

    const activate = (id) => {
      killFloats();
      panels.forEach((p) => {
        const on = p.id === id;
        p.classList.toggle('active', on);
        p.toggleAttribute('hidden', !on);
        if (on) animatePanel(p);
      });
      // Refresh ScrollTrigger after DOM visibility changes
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };

    const initial = tabs.find(t => t.classList.contains('active')) || tabs[0];
    if (initial) activate(initial.dataset.target);

    tabs.forEach((tab) => on(tab, 'click', () => {
      if (tab.classList.contains('active')) return;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      activate(tab.dataset.target);
    }));
  }

  // Metrics entrance + counters
  function metricsCounters() {
    const gs = window.gsap;
    const grid = $('.metrics-grid');
    if (!grid) return;
    gs.from(grid, {
      opacity: 0, y: 20, duration: 0.55, ease: 'power2.out',
      scrollTrigger: { trigger: grid, start: 'top 85%', once: true, onEnter: animateCounters }
    });
  }

  // Timeline steps
  function timelineReveal() {
    const gs = window.gsap;
    $$('.timeline .step').forEach((step, i) => {
      gs.from(step, {
        opacity: 0, y: 18, duration: 0.5, ease: 'power2.out', delay: i * 0.04,
        scrollTrigger: { trigger: step, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
  }

  // Testimonials dots (fade between blockquotes)
  function testimonials() {
    const gs = window.gsap;
    const wrap = $('.testimonial-carousel');
    if (!wrap) return;
    const quotes = $$('blockquote', wrap);
    if (!quotes.length) return;

    let dotsWrap = wrap.nextElementSibling;
    if (!dotsWrap || !dotsWrap.classList.contains('carousel-controls')) {
      dotsWrap = document.createElement('div');
      dotsWrap.className = 'carousel-controls';
      wrap.after(dotsWrap);
    }

    const show = (idx) => {
      quotes.forEach((q, i) => q.style.display = i === idx ? 'block' : 'none');
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      // subtle fade
      gs.fromTo(quotes[idx], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' });
    };

    const dots = quotes.map((_q, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      b.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      on(b, 'click', () => { current = i; show(current); });
      dotsWrap.appendChild(b);
      return b;
    });

    let current = 0;
    show(current);
    setInterval(() => { current = (current + 1) % quotes.length; show(current); }, 6000);
  }

  // Optional smoother (if user included premium plugin) — guarded
  function tryScrollSmoother() {
    try {
      if (window.ScrollSmoother && cfg().animationQuality === 'high') {
        const smoother = window.ScrollSmoother.create({ smooth: 0.9, effects: true });
        // Expose for debugging
        window.HealthFlo = window.HealthFlo || {};
        window.HealthFlo.smoother = smoother;
      }
    } catch { /* ignore */ }
  }

  /* ---------------------------------------
   * Soft Sync with other modules (optional)
   * ------------------------------------- */
  function hookKPIEvents() {
    const gs = window.gsap;
    on(window, 'hf:kpi:tick', (e) => {
      const { key } = e.detail || {};
      // Soft flash the matching metric card (if visible)
      const card = document.querySelector(`.metric strong[data-kpi="${key}"]`);
      if (!card) return;
      gs.fromTo(card, { scale: 1 }, { scale: 1.015, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out' });
    });

    on(window, 'hf:insightShown', () => {
      const badge = document.querySelector('.hf-ai-insights__trigger');
      if (!badge) return;
      gs.fromTo(badge, { y: 0 }, { y: -2, duration: 0.2, yoyo: true, repeat: 1, ease: 'power1.out' });
    });
  }

  /* ---------------------------------------
   * Lifecycle
   * ------------------------------------- */
  let started = false;

  function start() {
    if (started) return;
    if (!hasGSAP() || prefersReduced || !cfg().animationsEnabled) return;
    started = true;

    const gs = window.gsap;
    if (window.ScrollTrigger) gs.registerPlugin(ScrollTrigger);
    applyQuality();

    // Run features
    heroMotion();
    heroMotionPathSweep();
    revealOnScroll();
    metricsCounters();
    timelineReveal();
    testimonials();
    tryScrollSmoother();
    hookKPIEvents();

    // 3D tilt on cards
    const tiltCards = [ ...$$('.feature-card'), ...$$('.audience-card') ];
    if (tiltCards.length) attachTilt(tiltCards, 5);

    // Audience after main reveals
    audiencePanels();

    // Refresh on font load / resize for layout stability
    const refresh = debounce(() => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 120);
    on(window, 'resize', refresh);
    document.fonts && document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', refresh);
  }

  function stop() {
    if (!started) return;
    started = false;
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(t => t.kill());
    }
    // We intentionally keep element states where they are; next start() rebuilds.
  }

  function refresh() {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  /* ---------------------------------------
   * Auto-boot: wait for DOM & GSAP (defensive)
   * ------------------------------------- */
  function bootWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootWhenReady, { once: true });
      return;
    }
    // If GSAP not ready yet (CDN defer), poll a few times gracefully
    if (!hasGSAP()) {
      let tries = 0;
      const id = setInterval(() => {
        tries++;
        if (hasGSAP()) { clearInterval(id); start(); }
        else if (tries > 40) { clearInterval(id); /* give up silently */ }
      }, 100);
      return;
    }
    start();
  }
  bootWhenReady();

  // Public API
  return { start, stop, refresh };
})();
