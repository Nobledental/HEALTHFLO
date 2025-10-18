/* ==========================================================================
   HealthFlo — Upgraded Main JS (no design changes)
   ========================================================================== */

(() => {
  "use strict";

  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const on = (el, ev, cb, opts) => el && el.addEventListener(ev, cb, opts);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* 0) Year + keyboard focus helper */
  on(document, "DOMContentLoaded", () => {
    const yearEl = qs("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });
  on(window, "keydown", (e) => {
    if (e.key === "Tab") document.body.classList.add("user-is-tabbing");
  });

  /* 1) Mobile nav toggle */
  const navToggle = qs('.nav__toggle');
  const navList   = qs('#primary-navigation');

  if (navToggle && navList) {
    on(navToggle, 'click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('nav__list--open');
    });

    // close menu when clicking a link (mobile)
    qsa('#primary-navigation a').forEach(a => {
      on(a, 'click', () => {
        if (navList.classList.contains('nav__list--open')) {
          navList.classList.remove('nav__list--open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* 2) Smooth in-page anchor scroll with header offset */
  function getHeaderOffset() {
    const header = qs('.site-header');
    return header ? (header.getBoundingClientRect().height + 8) : 0;
  }
  qsa('a[href^="#"]').forEach((a) => {
    on(a, "click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = qs(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* 3) Header shadow on scroll */
  const header = qs('.site-header');
  if (header) {
    const headerSentinel = document.createElement('div');
    headerSentinel.setAttribute('aria-hidden', 'true');
    header.before(headerSentinel);
    const io = new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }, { rootMargin: `-${(header.offsetHeight || 80)}px 0px 0px 0px` });
    io.observe(headerSentinel);
  }

  /* 4) Scroll animations [data-animate][data-animate-delay] */
  const animatedElements = qsa('[data-animate]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.getAttribute('data-animate-delay');
          if (delay) el.style.transitionDelay = `${parseInt(delay, 10)}ms`;
          el.classList.add('is-visible');
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    animatedElements.forEach(el => observer.observe(el));
  } else {
    animatedElements.forEach(el => el.classList.add('is-visible'));
  }

  /* 5) Counter animation for highlight metrics */
  const counters = qsa('.highlight__value');
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count || '0');
        const suffix = el.dataset.suffix ?? '';
        const duration = 1400;
        const start = performance.now();

        function format(value, max) {
          // keep "k" only for big numbers; respect your original labels
          if (max >= 1000) {
            const k = value / 1000;
            const round = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
            return `${round}k${suffix}`;
          }
          return `${Math.floor(value)}${suffix}`;
        }

        function tick(now) {
          const t = clamp((now - start) / duration, 0, 1);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
          el.textContent = format(target * eased, target);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(c => counterObserver.observe(c));
  }

  /* 6) Partners marquee: duplicate children for seamless loop */
  const marquee = qs('[data-marquee]');
  if (marquee) {
    // duplicate until width exceeds 2x container to ensure continuous loop
    const items = [...marquee.children];
    const maxDupes = 3; // safety
    let dupes = 0;
    const ensureSeamless = () => {
      if (dupes >= maxDupes) return;
      const totalWidth = [...marquee.children].reduce((w, el) => w + el.getBoundingClientRect().width, 0);
      if (totalWidth < marquee.parentElement.getBoundingClientRect().width * 2) {
        items.forEach(node => marquee.appendChild(node.cloneNode(true)));
        dupes++;
        ensureSeamless();
      }
    };
    // run after fonts paint
    requestAnimationFrame(() => setTimeout(ensureSeamless, 50));
  }

  /* 7) Canvas nebula animation (reduced-motion aware) */
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = qs('.hero__nebula');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function resize() {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createParticles();
    }

    function createParticles() {
      const count = Math.min(120, Math.floor(width / 16));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.6,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.1
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // soft gradient glow
      const gradient = ctx.createRadialGradient(width * 0.3, height * 0.2, 0, width * 0.3, height * 0.2, width * 0.8);
      gradient.addColorStop(0, 'rgba(79, 156, 255, 0.25)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(140, 199, 255, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > width)  p.speedX *= -1;
        if (p.y < 0 || p.y > height) p.speedY *= -1;
      });

      requestAnimationFrame(draw);
    }

    on(window, 'resize', resize);
    resize();
    draw();
  } else if (canvas && reduceMotion) {
    // keep a subtle static gradient without animation
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const g = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.2, 0, canvas.width * 0.3, canvas.height * 0.2, canvas.width * 0.8);
    g.addColorStop(0, 'rgba(79, 156, 255, 0.18)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* 8) Minor form niceties */
  const form = qs('.cta__form');
  if (form) {
    on(form, 'submit', () => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        const prev = btn.textContent;
        btn.textContent = 'Submitting...';
        setTimeout(() => { btn.disabled = false; btn.textContent = prev; }, 6000);
      }
    });
  }
})();

/* =========================================================
   HealthFlo — App JS (safe vanilla)
   - Matches your finalized HTML/CSS
   - Progressive enhancement, a11y, and reduced-motion aware
   ========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------
   * 0) DOM READY / PRELOADER
   * --------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const preloader = $('.preloader');
    if (preloader) requestAnimationFrame(() => preloader.classList.add('hidden'));

    // current year
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // init all modules
    headerScroll();
    mobileNav();
    themeToggle();
    inViewAnimations();
    audienceTabs();
    testimonialCarousel();
    kpiControls();
    heroCanvas();
  });

  /* ---------------------------
   * 1) Sticky header shadow
   * --------------------------- */
  function headerScroll() {
    const header = $('.header');
    if (!header) return;
    const toggle = () => header.classList.toggle('scrolled', window.scrollY > 4);
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
  }

  /* ---------------------------
   * 2) Mobile nav toggle
   * --------------------------- */
  function mobileNav() {
    const btn = $('.mobile-nav-toggle');
    const menu = $('.nav-links');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });

    // close on link click (mobile)
    $$('.nav-links a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('open'))
    );
  }

  /* ---------------------------
   * 3) Theme toggle + persist
   * --------------------------- */
  function themeToggle() {
    const btn = $('.theme-toggle');
    if (!btn) return;

    // load saved theme
    const stored = localStorage.getItem('hf-theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);

    btn.addEventListener('click', () => {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('hf-theme', next);
    });
  }

  /* ---------------------------------------
   * 4) Reveal on scroll [data-animate]
   * --------------------------------------- */
  function inViewAnimations() {
    const items = $$('[data-animate]');
    if (!items.length) return;

    if (prefersReduced) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

    items.forEach(el => io.observe(el));
  }

  /* ---------------------------------------
   * 5) Audience tabs (Hospitals / Patients)
   * --------------------------------------- */
  function audienceTabs() {
    const group = $('.audience-toggle');
    const panels = $$('.audience-panel');
    if (!group || !panels.length) return;

    const tabs = $$('.audience-tab', group);
    const show = (id) => {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.target === id));
      panels.forEach(p => {
        const active = p.id === id;
        p.toggleAttribute('hidden', !active);
        if (active) p.classList.add('active');
      });
    };

    tabs.forEach(btn => {
      btn.addEventListener('click', () => show(btn.dataset.target));
      btn.addEventListener('keydown', (e) => {
        // left/right arrow support
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const idx = tabs.indexOf ? tabs.indexOf(btn) : tabs.findIndex(b => b === btn);
          const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
          tabs[next].focus();
          show(tabs[next].dataset.target);
        }
      });
    });

    // set initial (first active or fallback)
    const firstActive = tabs.find(t => t.classList.contains('active')) || tabs[0];
    if (firstActive) show(firstActive.dataset.target);
  }

  /* ---------------------------------------
   * 6) Testimonial carousel (dots + auto)
   * --------------------------------------- */
  function testimonialCarousel() {
    const wrap = $('.testimonial-carousel');
    if (!wrap) return;

    const slides = $$('blockquote', wrap);
    const dots = $$('.carousel-dot', wrap);
    if (!slides.length) return;

    let idx = Math.max(slides.findIndex(s => s.classList.contains('active')), 0);
    const set = (i) => {
      slides.forEach((s, si) => s.classList.toggle('active', si === i));
      dots.forEach?.((d, di) => d.classList.toggle('active', di === i));
      idx = i;
    };

    dots.forEach?.((d, di) => d.addEventListener('click', () => set(di)));
    if (!prefersReduced) {
      let t = setInterval(() => set((idx + 1) % slides.length), 5500);
      wrap.addEventListener('mouseenter', () => clearInterval(t));
      wrap.addEventListener('mouseleave', () => (t = setInterval(() => set((idx + 1) % slides.length), 5500)));
    }
  }

  /* ---------------------------------------
   * 7) KPI controls (speed + auto-update)
   *    - You can wire real data here later.
   * --------------------------------------- */
  function kpiControls() {
    const host = $('[data-hf-kpi-host]');
    if (!host) return;

    const range = $('#hf-speed-range');
    const speedLabel = $('#hf-speed-label');
    const autoToggle = $('#hf-auto-toggle');
    const values = $$('.healthflo-kpi__value', host);

    let interval = Number(range?.value || 6000);
    let timer = null;

    const randDelta = () => (Math.random() * 2 - 1).toFixed(2); // -1.00 .. 1.00

    const tick = () => {
      // toy update: nudge numbers for visual vitality (remove if you feed real data)
      values.forEach(v => {
        const raw = v.textContent.trim();
        // handle formats like "00:47", "98%", or plain numbers
        if (/^\d{2}:\d{2}$/.test(raw)) {
          // time mm:ss → randomly add/sub a second
          const [m, s] = raw.split(':').map(Number);
          const total = Math.max(0, m * 60 + s + (Math.random() > 0.5 ? 1 : -1));
          const mm = String(Math.floor(total / 60)).padStart(2, '0');
          const ss = String(total % 60).padStart(2, '0');
          v.textContent = `${mm}:${ss}`;
        } else if (/%$/.test(raw)) {
          const n = parseFloat(raw);
          if (!isNaN(n)) v.textContent = `${Math.max(0, Math.min(100, n + Number(randDelta()))).toFixed(0)}%`;
        } else {
          const n = parseFloat(raw.replace(/[^\d.-]/g, ''));
          if (!isNaN(n)) v.textContent = String(Math.max(0, n + Number(randDelta())));
        }
      });
    };

    const start = () => {
      stop();
      if (prefersReduced || autoToggle?.checked === false) return;
      timer = setInterval(tick, interval);
    };
    const stop = () => timer && (clearInterval(timer), (timer = null));

    if (range && speedLabel) {
      const setSpeed = (ms) => {
        interval = Number(ms);
        speedLabel.textContent = `${Math.round(interval / 1000)}s`;
        start();
      };
      setSpeed(range.value);
      range.addEventListener('input', (e) => setSpeed(e.target.value));
    }

    if (autoToggle) {
      autoToggle.addEventListener('change', () => (autoToggle.checked ? start() : stop()));
    }

    start();
  }

  /* ---------------------------------------
   * 8) Hero canvas (light particles)
   * --------------------------------------- */
  function heroCanvas() {
    const canvas = $('#hero-animation');
    if (!canvas || prefersReduced) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let w = (canvas.width = canvas.clientWidth);
    let h = (canvas.height = Math.max(180, canvas.clientHeight || 200));

    const dots = Array.from({ length: 48 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35
    }));

    const lineDist = 110;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // points
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--indigo').trim() || '#2b2f77';
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      });

      // connections
      const gradA = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim() || '#38bdf8';
      const gradB = getComputedStyle(document.documentElement).getPropertyValue('--aqua').trim() || '#5eead4';
      dots.forEach((a, i) => {
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < lineDist) {
            const alpha = 1 - d / lineDist;
            const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            g.addColorStop(0, `${gradA}${alphaToHex(alpha * 0.6)}`);
            g.addColorStop(1, `${gradB}${alphaToHex(alpha * 0.6)}`);
            ctx.strokeStyle = g;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      });

      raf = requestAnimationFrame(draw);
    }

    function alphaToHex(a) {
      // clamp 0..1 → 00..FF
      const v = Math.max(0, Math.min(255, Math.round(a * 255)));
      return v.toString(16).padStart(2, '0');
    }

    let raf = requestAnimationFrame(draw);

    const onResize = () => {
      w = canvas.width = canvas.clientWidth;
      h = canvas.height = Math.max(180, canvas.clientHeight || 200);
    };
    window.addEventListener('resize', onResize);

    // pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { raf = requestAnimationFrame(draw); }
    });
  }
})();
