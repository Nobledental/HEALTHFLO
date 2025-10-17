/* ==========================================================================
   HealthFlo – Cinematic Motion System (GSAP)
   Core: GSAP + ScrollTrigger + MotionPathPlugin (free)
   Notes:
   - This file gracefully degrades when GSAP is not available.
   - We DO NOT require paid plugins. SplitText/ScrollSmoother/Flip are simulated.
   - Respects `HealthFlo.config.animationsEnabled` and reduced-motion.
   CDN (recommended in index.html before this file):
     <!-- GSAP Core -->
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>
     <!-- ScrollTrigger -->
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" defer></script>
     <!-- MotionPathPlugin -->
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/MotionPathPlugin.min.js" defer></script>
   ========================================================================== */

window.HealthFloAnimations = (function () {
  'use strict';

  const hasGSAP = typeof window.gsap !== 'undefined';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Safe access to config
  const cfg = () => (window.HealthFlo && window.HealthFlo.config) ? window.HealthFlo.config : {
    animationsEnabled: true,
    animationQuality: 'medium'
  };

  // Utility shorthands
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s));

  // Simulated SplitText (free, lightweight)
  // Splits a heading into <span class="char">…</span> nodes (idempotent)
  function splitText(element) {
    if (!element || element.dataset.split === '1') return;
    const text = element.textContent;
    element.setAttribute('aria-label', text);
    element.textContent = '';
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
    element.appendChild(frag);
    element.dataset.split = '1';
  }

  // 3D hover tilt using GSAP quickTo (smoother than CSS)
  function attachTilt(cards, maxRotate = 6) {
    cards.forEach((card) => {
      const qtRotX = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
      const qtRotY = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });
      const qtZ = gsap.quickTo(card, 'z', { duration: 0.4, ease: 'power2.out' });

      card.style.transformStyle = 'preserve-3d';
      card.style.perspective = '1000px';
      card.addEventListener('pointermove', (ev) => {
        const r = card.getBoundingClientRect();
        const rx = ((ev.clientY - r.top) / r.height) * 2 - 1; // -1..1
        const ry = ((ev.clientX - r.left) / r.width) * 2 - 1;
        qtRotX(-rx * maxRotate);
        qtRotY(ry * maxRotate);
        qtZ(10);
      });
      card.addEventListener('pointerleave', () => {
        qtRotX(0); qtRotY(0); qtZ(0);
      });
    });
  }

  // Counter animation using GSAP (snap to integers)
  function animateCounters() {
    $$('.gsap-counter strong').forEach((el) => {
      if (el.dataset.animated === '1') return;
      const raw = el.dataset.target || el.textContent;
      const suffix = el.dataset.suffix || el.textContent.replace(/^[\d.,\s]+/, '');
      const prefix = el.dataset.prefix || el.textContent.replace(/[\d.,\s]+$/, '');
      const target = Number(String(raw).replace(/[^\d.]/g, '')) || 0;

      el.dataset.animated = '1';
      gsap.fromTo(el, { innerText: 0 }, {
        innerText: target,
        duration: 1.6,
        ease: 'power1.out',
        snap: { innerText: 1 },
        onUpdate() {
          el.textContent = `${prefix}${Math.floor(el.innerText).toLocaleString()}${suffix}`;
        }
      });
    });
  }

  // Scroll reveal for generic elements
  function revealOnScroll() {
    const items = $$('.gsap-reveal');
    if (!items.length) return;

    items.forEach((el) => {
      gsap.fromTo(el,
        { y: 22, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Stagger lists (cards, etc.)
    $$('.gsap-stagger').forEach((el) => {
      gsap.from(el, {
        y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.12,
        scrollTrigger: { trigger: el.parentElement, start: 'top 80%' }
      });
    });

    // Directional steps
    $$('.gsap-scroll').forEach((el, i) => {
      gsap.from(el, {
        x: i % 2 === 0 ? -24 : 24, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });
  }

  // Hero entrance + subtle parallax float for canvas
  function heroMotion() {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.eyebrow', { y: 14, opacity: 0, duration: 0.45 })
      .from('.headline', { y: 26, opacity: 0, duration: 0.6 }, '-=0.15')
      .from('.subtext', { y: 16, opacity: 0, duration: 0.55 }, '-=0.2')
      .from('.cta-group a', { y: 14, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.15')
      .from('.hero-metrics div', { y: 16, opacity: 0, duration: 0.55, stagger: 0.08 }, '-=0.1');

    // Split headline characters (fallback SplitText)
    const h = $('.headline');
    if (h) {
      splitText(h);
      gsap.fromTo(h.querySelectorAll('.char'),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.02 }
      );
    }

    // Canvas float (hero animation layer)
    const canvas = $('#hero-animation');
    if (canvas) {
      gsap.to(canvas, { yPercent: -4, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }
  }

  // Audience panel transitions + floating cards
  function audiencePanels() {
    const section = $('.audience-showcase');
    if (!section) return;
    const tabs = $$('.audience-tab', section);
    const panels = $$('.audience-panel', section);

    const floatCard = (card, i) => {
      return gsap.to(card, { y: '+=8', duration: 4 + i * 0.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
    };

    let floats = [];
    const killFloats = () => { floats.forEach((t) => t.kill()); floats = []; };

    const animatePanel = (panel) => {
      gsap.from(panel.querySelector('.audience-panel__content'), {
        opacity: 0, y: 22, duration: 0.6, ease: 'power2.out'
      });
      const cards = $$('.audience-card', panel);
      cards.forEach((card, i) => {
        const dir = card.dataset.motion;
        const fromX = dir === 'left' ? -24 : dir === 'right' ? 24 : 0;
        gsap.fromTo(card, { x: fromX, y: 18, opacity: 0 }, {
          x: 0, y: 0, opacity: 1, duration: 0.65, ease: 'power2.out', delay: i * 0.08
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
    };

    // Initialize current active
    const initial = tabs.find((t) => t.classList.contains('active')) || tabs[0];
    if (initial) activate(initial.dataset.target);

    // Bind tabs
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        activate(tab.dataset.target);
      });
    });
  }

  // Metrics counters on view
  function metricsCounters() {
    const grid = $('.metrics-grid');
    if (!grid) return;

    gsap.from(grid, {
      opacity: 0, y: 20, duration: 0.6, ease: 'power2.out',
      scrollTrigger: {
        trigger: grid, start: 'top 85%',
        once: true,
        onEnter: () => animateCounters()
      }
    });
  }

  // Timeline reveal
  function timelineReveal() {
    const steps = $$('.timeline .step');
    steps.forEach((step, i) => {
      gsap.from(step, {
        opacity: 0, y: 18, duration: 0.55, ease: 'power2.out', delay: i * 0.05,
        scrollTrigger: { trigger: step, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
  }

  // Testimonials carousel dots (fade between blockquotes)
  function testimonials() {
    const wrap = $('.testimonial-carousel');
    if (!wrap) return;
    const quotes = $$('blockquote', wrap);
    if (!quotes.length) return;

    // Build dots
    let dotsWrap = wrap.nextElementSibling;
    if (!dotsWrap || !dotsWrap.classList.contains('carousel-controls')) {
      dotsWrap = document.createElement('div');
      dotsWrap.className = 'carousel-controls';
      wrap.after(dotsWrap);
    }

    const dots = quotes.map((_q, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      b.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      dotsWrap.appendChild(b);
      b.addEventListener('click', () => show(i));
      return b;
    });

    let current = 0;
    function show(idx) {
      quotes.forEach((q, i) => q.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      current = idx;
    }
    show(current);

    // Auto-advance
    setInterval(() => show((current + 1) % quotes.length), 6000);
  }

  // MotionPath micro detail (subtle accent sweep behind hero SVG)
  // Creates a small circle that moves along a rounded rect path to add “alive” feel.
  function heroMotionPathSweep() {
    const svg = document.querySelector('#hero svg, .hero-slab svg');
    if (!svg) return;

    const marker = document.createElementNS('http://www.w3.org/2000/svg','circle');
    marker.setAttribute('r', '3.5');
    marker.setAttribute('fill', '#21ce7e'); // emerald accent
    marker.setAttribute('opacity', '0.85');
    svg.appendChild(marker);

    const w = svg.viewBox.baseVal.width || 460;
    const h = svg.viewBox.baseVal.height || 360;
    const pad = 22;

    // Rounded rectangle path string
    const d = `
      M ${pad} ${pad + 20}
      h ${w - pad * 2}
      a 20 20 0 0 1 20 20
      v ${h - pad * 2 - 40}
      a 20 20 0 0 1 -20 20
      h -${w - pad * 2}
      a 20 20 0 0 1 -20 -20
      v -${h - pad * 2 - 40}
      a 20 20 0 0 1 20 -20
      Z
    `;

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'none');
    svg.appendChild(path);

    gsap.registerPlugin(MotionPathPlugin);

    gsap.to(marker, {
      duration: 10,
      repeat: -1,
      ease: 'sine.inOut',
      motionPath: {
        path,
        align: path,
        autoRotate: false,
        alignOrigin: [0.5, 0.5],
        start: 0.1,
        end: 0.9
      },
      opacity: 0.15,
      yoyo: true
    });
  }

  // Quality-aware toggles
  function applyQuality() {
    const q = cfg().animationQuality;
    // Example hooks: you can downscale counts/durations based on quality.
    // High: more stagger & duration; Low: faster + fewer elements
    const body = document.body;
    body.dataset.animQuality = q; // allows CSS or other modules to adapt
  }

  // Init runner
  function init() {
    if (!hasGSAP || prefersReduced || !cfg().animationsEnabled) return;

    // Register ScrollTrigger
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    applyQuality();
    heroMotion();
    heroMotionPathSweep();
    revealOnScroll();
    metricsCounters();
    timelineReveal();
    testimonials();

    // 3D Tilt on cards
    const tiltCards = [
      ...$$('.feature-card'),
      ...$$('.audience-card'),
    ];
    if (tiltCards.length) attachTilt(tiltCards, 5);

    // Section-head sticky subtle reveal (if present)
    $$('.section-head.sticky').forEach((head) => {
      gsap.from(head, {
        opacity: 0, y: -8, duration: 0.4, ease: 'power2.out',
        scrollTrigger: { trigger: head, start: 'top top', toggleActions: 'play none none none' }
      });
    });
  }

  return { init };
})();
