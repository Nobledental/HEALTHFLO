/**
 * HealthFlo — Main Application Bundle
 * Single-file, production-ready. Hybrid Tech-Luxury tone.
 *
 * Includes:
 * - Core UX: preloader, sticky header, nav, theme, quick page nav, smooth anchors
 * - GSAP cinematic motion (ScrollTrigger, MotionPath, with guards for SplitText/Flip/ScrollSmoother)
 * - Hero Particles (Micro-Cell Field, Nebula Flow, Data Stream)
 * - KPI Dashboard (config-driven, hospital + patient KPIs, sparklines, live auto-update)
 * - Speed control + pause, localStorage persistence
 * - AI Insights Drawer (tabs, narratives, custom events, auto-open on scroll)
 * - Testimonials carousel, counters, audience showcase float, parallax tilts
 *
 * Notes:
 * - GSAP CDNs should be included in HTML; this file gracefully degrades if missing.
 * - All selectors are defensive; modules only init when corresponding DOM exists.
 * - No external APIs required (simulated data generators). Swap providers later.
 */

(() => {
  'use strict';

  /* -------------------------------------------------------------
   * Utilities
   * ------------------------------------------------------------- */
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const on = (el, evt, fn, opts) => el && el.addEventListener(evt, fn, opts || false);
  const raf = (fn) => window.requestAnimationFrame(fn);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const ls = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  };
  const hasGSAP = typeof window.gsap !== 'undefined';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------------
   * Preloader
   * ------------------------------------------------------------- */
  const initPreloader = () => {
    const pre = $('.preloader');
    if (!pre) return;
    window.addEventListener('load', () => {
      raf(() => {
        pre.classList.add('hidden');
        setTimeout(() => pre.remove(), 600);
      });
    });
  };

  /* -------------------------------------------------------------
   * Sticky header + nav
   * ------------------------------------------------------------- */
  const initHeader = () => {
    const header = $('.header');
    if (!header) return;
    const toggle = $('.mobile-nav-toggle');
    const links = $('.nav-links');

    const onScroll = () => {
      if (window.scrollY > 10) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
      on(toggle, 'click', () => {
        links.classList.toggle('open');
        const ex = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', (!ex).toString());
      });
      $$('.nav-links a').forEach(a => on(a, 'click', () => links.classList.remove('open')));
    }
  };

  /* -------------------------------------------------------------
   * Theme toggle
   * ------------------------------------------------------------- */
  const initTheme = () => {
    const btn = $('.theme-toggle');
    if (!btn) return;

    const setTheme = (t) => {
      document.documentElement.setAttribute('data-theme', t);
      ls.set('hf-theme', t);
      btn.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} mode`);
    };

    const saved = ls.get('hf-theme', null);
    const def = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(def);

    on(btn, 'click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
  };

  /* -------------------------------------------------------------
   * Quick Page Nav (sticky on desktop, collapsible on mobile)
   * ------------------------------------------------------------- */
  const initQuickPageNav = () => {
    const nav = $('.quick-page-nav');
    if (!nav) return;
    const toggle = $('.quick-page-nav__toggle', nav);
    const linksWrap = $('.quick-page-nav__links', nav);
    const links = $$('.quick-page-nav__links a', nav);
    const page = document.body.dataset.page;

    const mark = () => {
      links.forEach(l => {
        const active = l.dataset.page === page;
        l.classList.toggle('is-active', active);
        if (active) l.setAttribute('aria-current', 'page');
        else l.removeAttribute('aria-current');
      });
    };
    mark();

    const setOpen = (st) => {
      nav.dataset.open = st ? 'true' : 'false';
      toggle?.setAttribute('aria-expanded', String(!!st));
      linksWrap?.setAttribute('aria-hidden', st ? 'false' : 'true');
    };

    if (toggle) {
      setOpen(false);
      on(toggle, 'click', () => {
        const ex = toggle.getAttribute('aria-expanded') === 'true';
        setOpen(!ex);
        if (hasGSAP && !prefersReduced) {
          gsap.from(linksWrap, { opacity: 0, y: -10, duration: 0.35, ease: 'power2.out' });
        }
      });
    } else setOpen(true);

    links.forEach(a => on(a, 'click', () => { if (window.innerWidth <= 768) setOpen(false); }));

    const handleResize = () => {
      if (window.innerWidth > 1024) setOpen(true);
      else if (toggle) setOpen(false);
    };
    handleResize();
    window.addEventListener('resize', () => raf(handleResize));
  };

  /* -------------------------------------------------------------
   * Smooth anchors
   * ------------------------------------------------------------- */
  const initAnchors = () => {
    $$('a[href^="#"]').forEach(a => {
      on(a, 'click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  };

  /* -------------------------------------------------------------
   * GSAP Cinematic Motion
   * ------------------------------------------------------------- */
  const initGSAP = () => {
    if (!hasGSAP || prefersReduced) return;

    // Safely register plugins that may or may not exist (SplitText/Flip/ScrollSmoother are premium)
    const plugins = ['ScrollTrigger', 'MotionPathPlugin', 'Flip', 'ScrollSmoother', 'SplitText'];
    plugins.forEach(p => { try { if (gsap[p]) gsap.registerPlugin(gsap[p]); } catch {} });

    // Hero Intro
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.eyebrow', { y: 16, opacity: 0, duration: 0.5 })
      .from('.headline', { y: 28, opacity: 0, duration: 0.7 }, '-=0.2')
      .from('.subtext', { y: 18, opacity: 0, duration: 0.6 }, '-=0.25')
      .from('.cta-group a', { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.2')
      .from('.hero-metrics div', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.1');

    // Section title stagger (SplitText if available)
    $$('.section-head').forEach(head => {
      const title = $('h2', head);
      if (!title) return;
      if (gsap.SplitText) {
        const split = new gsap.SplitText(title, { type: 'chars' });
        gsap.from(split.chars, {
          opacity: 0, y: 12, duration: 0.5, stagger: 0.025, ease: 'power2.out',
          scrollTrigger: { trigger: head, start: 'top 85%' }
        });
      } else {
        gsap.from(title, { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: head, start: 'top 85%' } });
      }
    });

    // Generic reveals
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
      gsap.from(el, {
        y: 26, opacity: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    gsap.utils.toArray('.gsap-stagger').forEach(el => {
      gsap.from(el, {
        y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.15,
        scrollTrigger: { trigger: el.parentElement, start: 'top 80%' }
      });
    });
    gsap.utils.toArray('.gsap-scroll').forEach((el, i) => {
      gsap.from(el, {
        x: i % 2 === 0 ? -24 : 24, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });

    // Footer reveal
    const footer = $('.footer');
    if (footer) {
      gsap.from(footer, {
        opacity: 0, y: 40, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: footer, start: 'top 90%' }
      });
      const cols = $$('.footer-grid > div', footer);
      if (cols.length) {
        gsap.from(cols, {
          opacity: 0, y: 20, duration: 0.6, ease: 'power2.out', stagger: 0.12,
          scrollTrigger: { trigger: footer, start: 'top 88%' }
        });
      }
    }
  };

  /* -------------------------------------------------------------
   * Parallax Tilt (subtle 3D hover)
   * ------------------------------------------------------------- */
  const initParallaxTilt = () => {
    const tiltable = $$('.hover-tilt, .feature-card, .audience-card');
    if (!tiltable.length) return;

    const move = (e) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y - r.height / 2) / r.height) * -4;
      const ry = ((x - r.width / 2) / r.width) * 4;
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const reset = (e) => { e.currentTarget.style.transform = ''; };

    tiltable.forEach(el => {
      on(el, 'pointermove', move);
      on(el, 'pointerleave', reset);
    });
  };

  /* -------------------------------------------------------------
   * Geo Marquee (fallback CSS if GSAP not present)
   * ------------------------------------------------------------- */
  const initGeoMarquee = () => {
    const track = $('.geo-marquee__track');
    if (!track) return;
    if (!track.dataset.duplicated) {
      const items = $$('span', track);
      const frag = document.createDocumentFragment();
      items.forEach(i => frag.appendChild(i.cloneNode(true)));
      track.appendChild(frag);
      track.dataset.duplicated = 'true';
    }
    if (hasGSAP && !prefersReduced) {
      gsap.to(track, { xPercent: 14, duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true });
    } else {
      track.classList.add('geo-marquee__track--animated');
    }
  };

  /* -------------------------------------------------------------
   * Testimonials carousel (lightweight)
   * ------------------------------------------------------------- */
  const initTestimonials = () => {
    const wrap = $('.testimonial-carousel');
    if (!wrap) return;
    const slides = $$('blockquote', wrap);
    if (!slides.length) return;

    let cur = 0;
    const show = (i) => {
      slides.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none');
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    };

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'carousel-controls';
    const dots = slides.map((_s, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `carousel-dot${idx === 0 ? ' active' : ''}`;
      b.setAttribute('aria-label', `Show testimonial ${idx + 1}`);
      on(b, 'click', () => { cur = idx; show(cur); });
      dotsWrap.appendChild(b);
      return b;
    });
    wrap.after(dotsWrap);
    show(cur);

    setInterval(() => { cur = (cur + 1) % slides.length; show(cur); }, 6000);
  };

  /* -------------------------------------------------------------
   * Counters
   * ------------------------------------------------------------- */
  const initCounters = () => {
    const counters = $$('.gsap-counter strong');
    if (!counters.length) return;

    const parseNum = (t) => {
      const n = parseFloat(t.replace(/[^\d.]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const io = new IntersectionObserver((ents) => {
      ents.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.animated) return;
        el.dataset.animated = 'true';

        const raw = el.textContent.trim();
        const prefix = raw.match(/^[^\d]*/)?.[0] ?? '';
        const suffix = raw.match(/[^\d]*$/)?.[0] ?? '';
        const target = parseNum(el.dataset.target || raw);

        if (hasGSAP && !prefersReduced) {
          gsap.fromTo(el, { innerText: 0 }, {
            innerText: target, duration: 1.6, ease: 'power1.out', snap: { innerText: 1 },
            onUpdate() { el.textContent = `${prefix}${Math.floor(el.innerText).toLocaleString()}${suffix}`; }
          });
        } else {
          el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(el => {
      const raw = el.textContent.trim();
      el.dataset.prefix = raw.match(/^[^\d]*/)?.[0] ?? '';
      el.dataset.suffix = raw.match(/[^\d]*$/)?.[0] ?? '';
      el.dataset.target = parseNum(raw);
      el.textContent = `${el.dataset.prefix}0${el.dataset.suffix}`;
      io.observe(el);
    });
  };

  /* -------------------------------------------------------------
   * HERO Particles — Micro-Cell Field / Nebula Flow / Data Stream
   * ------------------------------------------------------------- */
  const initHeroParticles = () => {
    const c = document.getElementById('hero-animation');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, dpr, rafId, modeIdx = 0;
    const modes = ['microcell', 'nebula', 'datastream'];

    const state = {
      particles: [],
      t: 0,
      hue: 208, // blue-indigo base
    };

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = c.clientWidth || 600;
      h = Math.max(140, c.clientHeight || 180);
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const rand = (min, max) => Math.random() * (max - min) + min;

    const seed = () => {
      const count = Math.floor(Math.min(120, (w * h) / 5000));
      state.particles = Array.from({ length: count }).map(() => ({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.5, 0.5), vy: rand(-0.4, 0.4),
        r: rand(0.8, 2.4), a: rand(0.3, 0.8)
      }));
    };

    const drawMicroCells = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `hsla(${state.hue}, 85%, 60%, 0.08)`;
      ctx.fillRect(0, 0, w, h);

      state.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${state.hue}, 70%, 45%, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // connection lines
      ctx.lineWidth = 1;
      for (let i = 0; i < state.particles.length; i++) {
        for (let j = i + 1; j < state.particles.length; j++) {
          const a = state.particles[i], b = state.particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 60) {
            ctx.strokeStyle = `hsla(${state.hue}, 80%, 50%, ${0.12 * (1 - dist / 60)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
    };

    const drawNebula = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `hsla(${state.hue}, 85%, 98%, 0.5)`;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      state.particles.forEach((p, idx) => {
        const angle = Math.sin((state.t + idx) * 0.002) * Math.PI;
        p.x += Math.cos(angle) * 0.4 + p.vx * 0.5;
        p.y += Math.sin(angle) * 0.4 + p.vy * 0.5;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 24);
        g.addColorStop(0, `hsla(${state.hue}, 80%, 55%, 0.25)`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    const drawDataStream = () => {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(0, 0, w, h);

      const lanes = 6;
      for (let i = 0; i < lanes; i++) {
        const y = (h / (lanes + 1)) * (i + 1) + Math.sin((state.t * 0.002) + i) * 6;
        ctx.strokeStyle = `hsla(${state.hue + i * 8}, 70%, 50%, 0.22)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 24) {
          const ny = y + Math.sin((x * 0.02) + state.t * 0.008 + i) * 6;
          ctx.lineTo(x, ny);
        }
        ctx.stroke();
      }
    };

    const loop = () => {
      state.t += 1;
      if (modes[modeIdx] === 'microcell') drawMicroCells();
      else if (modes[modeIdx] === 'nebula') drawNebula();
      else drawDataStream();
      rafId = requestAnimationFrame(loop);
    };

    const rotateMode = () => {
      modeIdx = (modeIdx + 1) % modes.length;
    };

    on(c, 'click', rotateMode);
    window.addEventListener('resize', resize);
    resize();
    loop();
  };

  /* -------------------------------------------------------------
   * KPI Dashboard Module (config-driven, grouped)
   * - 10 KPIs + patient-centric
   * - Sparklines beside numbers
   * - Live auto update w/ speed slider (every 7s default)
   * - Custom events: hf:kpiUpdate
   * ------------------------------------------------------------- */
  class HealthFloDashboard {
    /**
     * @param {HTMLElement} host container element with .kpi-row or target child
     * @param {Object} options { speedMs, auto, data, storageKey }
     */
    constructor(host, options = {}) {
      this.host = host;
      this.row = $('.kpi-row', host) || host;
      this.speedMs = ls.get('hf-kpi-speed', options.speedMs ?? 7000);
      this.auto = ls.get('hf-kpi-auto', options.auto ?? true);
      this.storageKey = options.storageKey || 'hf-kpi';
      this.timer = null;
      this.cards = [];

      this.config = options.data || this.defaultConfig();
      this.init();
    }

    defaultConfig() {
      // Hospital-centric + Patient-centric groups (10+ KPIs)
      return {
        groups: [
          {
            label: 'Hospital Ops',
            items: [
              { id: 'hospitals', label: 'Hospitals Orchestrated', value: 570, unit: '', range: [520, 650], trend: 'up' },
              { id: 'claims', label: 'Claims Accelerated', value: 150000, unit: '', range: [120000, 180000], trend: 'up' },
              { id: 'preauth', label: 'Avg Pre-Auth Time', value: 45, unit: 's', range: [38, 55], trend: 'down' },
              { id: 'recovery', label: 'Claim Recovery Rate', value: 98, unit: '%', range: [95, 99.5], trend: 'up' },
              { id: 'ar', label: 'AR Days', value: 28, unit: 'd', range: [22, 35], trend: 'down' },
            ]
          },
          {
            label: 'Patient Experience',
            items: [
              { id: 'satisfaction', label: 'Satisfaction (CSAT)', value: 91, unit: '%', range: [86, 96], trend: 'up' },
              { id: 'whatsapp', label: 'WhatsApp Resolved', value: 12400, unit: '', range: [8000, 18000], trend: 'up' },
              { id: 'financing', label: 'Zero-Interest Approvals', value: 7400, unit: '', range: [5200, 9800], trend: 'up' },
              { id: 'ttf', label: 'Time-To-First-Update', value: 7, unit: 'min', range: [5, 12], trend: 'down' },
              { id: 'nps', label: 'NPS', value: 68, unit: '', range: [55, 78], trend: 'up' },
            ]
          }
        ]
      };
    }

    init() {
      if (!this.row) return;
      this.render();
      this.bindSpeedControls();
      if (this.auto) this.start();
    }

    render() {
      this.row.innerHTML = '';
      this.cards = [];
      this.config.groups.forEach(group => {
        group.items.forEach(kpi => {
          const card = document.createElement('div');
          card.className = 'healthflo-kpi';
          card.setAttribute('data-kpi-id', kpi.id);

          card.innerHTML = `
            <div class="healthflo-kpi__label" aria-live="polite">${kpi.label}</div>
            <div class="healthflo-kpi__value-row">
              <div class="healthflo-kpi__value" data-field="value">${this.fmt(kpi.value)}</div>
              <div class="healthflo-kpi__unit" data-field="unit">${kpi.unit || ''}</div>
              <div class="healthflo-kpi__delta ${this.deltaClass(kpi.trend)}" data-field="delta">+0%</div>
            </div>
            <div class="healthflo-kpi__spark" data-spark></div>
          `;
          this.row.appendChild(card);
          const sparkEl = $('[data-spark]', card);
          this.drawSpark(sparkEl, this.makeSeries(kpi));
          this.cards.push({ id: kpi.id, el: card, data: kpi });
        });
      });
    }

    fmt(n) {
      if (typeof n !== 'number') return n;
      if (n >= 1000) return n.toLocaleString();
      return String(n);
    }

    deltaClass(trend) {
      if (trend === 'up') return '--up';
      if (trend === 'down') return '--down';
      return '--stable';
    }

    // Generate sparkline data (simulate last 24 points around value & range)
    makeSeries(kpi, points = 24) {
      const base = kpi.value;
      const [minR, maxR] = kpi.range || [base * 0.9, base * 1.1];
      const series = [];
      for (let i = 0; i < points; i++) {
        const noise = (Math.random() - 0.5) * (maxR - minR) * 0.04;
        const drift = (Math.sin((i / points) * Math.PI * 2) * (maxR - minR) * 0.02);
        const v = clamp(base + noise + drift, minR, maxR);
        series.push(v);
      }
      return series;
    }

    // Draw a tiny sparkline as inline SVG
    drawSpark(host, series) {
      if (!host) return;
      const w = host.clientWidth || 160;
      const h = host.clientHeight || 32;
      const min = Math.min(...series);
      const max = Math.max(...series);
      const norm = (v) => (h - 4) - ((v - min) / (max - min || 1)) * (h - 8);

      const step = (w - 8) / (series.length - 1);
      const points = series.map((v, i) => `${(i * step + 4).toFixed(2)},${norm(v).toFixed(2)}`).join(' ');

      host.innerHTML = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
          <polyline points="${points}" fill="none" stroke="url(#g)" stroke-width="2" stroke-linecap="round" />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#4c6ef5"/>
              <stop offset="100%" stop-color="#2dd4bf"/>
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Randomly update KPI value within realistic ranges, slightly impressive
    mutate(kpi) {
      const [minR, maxR] = kpi.range || [kpi.value * 0.9, kpi.value * 1.1];
      const variance = (maxR - minR) * 0.06;
      let delta = (Math.random() - 0.4) * variance; // slightly biased upward
      if (kpi.trend === 'down') delta = -Math.abs(delta) * 0.7;
      if (kpi.trend === 'up') delta = Math.abs(delta);

      let next = clamp(kpi.value + delta, minR, maxR);
      // round elegantly
      if (kpi.value > 1000) next = Math.round(next / 50) * 50;
      else if (kpi.value > 100) next = Math.round(next / 5) * 5;
      else next = Math.round(next * 10) / 10;

      const diff = ((next - kpi.value) / (kpi.value || 1)) * 100;
      kpi.value = next;
      return diff;
    }

    updateOnce() {
      this.cards.forEach(card => {
        const diff = this.mutate(card.data);
        const valueEl = $('[data-field="value"]', card.el);
        const unitEl = $('[data-field="unit"]', card.el);
        const deltaEl = $('[data-field="delta"]', card.el);
        const sparkEl = $('[data-spark]', card.el);

        // Animate number (GSAP or instant)
        const toVal = card.data.value;
        if (hasGSAP && !prefersReduced) {
          gsap.to(valueEl, {
            duration: 0.8,
            innerText: toVal,
            snap: { innerText: 1 },
            ease: 'power1.out',
            onUpdate() {
              valueEl.textContent = this.fmt(Math.floor(valueEl.innerText));
            }
          });
        } else {
          valueEl.textContent = this.fmt(toVal);
        }

        // Delta badge
        const cls = diff > 0 ? '--up' : diff < 0 ? '--down' : '--stable';
        deltaEl.classList.remove('--up', '--down', '--stable');
        deltaEl.classList.add(cls);
        const sign = diff > 0 ? '+' : diff < 0 ? '' : '±';
        deltaEl.textContent = `${sign}${Math.abs(diff).toFixed(1)}%`;

        // Sparkline
        this.drawSpark(sparkEl, this.makeSeries(card.data));

        // Event
        document.dispatchEvent(new CustomEvent('hf:kpiUpdate', {
          detail: { id: card.id, value: card.data.value, deltaPct: diff }
        }));
      });
    }

    start() {
      this.stop();
      this.timer = setInterval(() => this.updateOnce(), this.speedMs);
    }

    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }

    setSpeed(ms) {
      this.speedMs = clamp(ms, 2000, 20000);
      ls.set('hf-kpi-speed', this.speedMs);
      if (this.timer) this.start();
    }

    setAuto(on) {
      this.auto = !!on;
      ls.set('hf-kpi-auto', this.auto);
      if (this.auto) this.start(); else this.stop();
    }

    bindSpeedControls() {
      // If a global control exists above the dashboard (recommended)
      const speedRange = document.getElementById('hf-speed-range');
      const speedToggle = document.getElementById('hf-auto-toggle');
      const speedLabel = document.getElementById('hf-speed-label');

      if (speedRange) {
        speedRange.value = String(this.speedMs);
        speedLabel && (speedLabel.textContent = `${Math.round(this.speedMs / 1000)}s`);
        on(speedRange, 'input', () => {
          const v = parseInt(speedRange.value, 10) || 7000;
          this.setSpeed(v);
          speedLabel && (speedLabel.textContent = `${Math.round(v / 1000)}s`);
        });
      }
      if (speedToggle) {
        speedToggle.checked = !!this.auto;
        on(speedToggle, 'change', () => this.setAuto(speedToggle.checked));
      }
    }
  }

  /* -------------------------------------------------------------
   * AI Insights Drawer (Standalone component)
   * - Tabs: Executive, Hospital, Patient, Actions
   * - Narrative templates (context-aware)
   * - Auto-open on scroll
   * - Custom events: hf:insightShown
   * ------------------------------------------------------------- */
  class HealthFloInsights {
    /**
     * @param {HTMLElement} root .hf-ai-insights host (optional; creates if absent)
     * @param {Object} options { autoOpenOffset, intervalMs }
     */
    constructor(root, options = {}) {
      this.root = root || this.createDOM();
      this.drawer = $('.hf-ai-insights__drawer', this.root);
      this.trigger = $('.hf-ai-insights__trigger', this.root);
      this.tabs = $$('.hf-tab', this.root);
      this.panels = $$('.hf-tabpanel', this.root);
      this.speedRange = $('#hf-insights-speed', this.root);
      this.speedLabel = $('#hf-insights-speed-label', this.root);

      this.intervalMs = ls.get('hf-insights-speed', options.intervalMs ?? 7000);
      this.autoOpenOffset = options.autoOpenOffset ?? 480; // px scrolled
      this.timer = null;

      this.narratives = this.getTemplates();
      this.init();
    }

    createDOM() {
      const wrapper = document.createElement('div');
      wrapper.className = 'hf-ai-insights';
      wrapper.innerHTML = `
        <button class="hf-ai-insights__trigger" type="button" aria-controls="hf-ai-drawer" aria-expanded="false">
          AI Insights
        </button>
        <aside class="hf-ai-insights__drawer" id="hf-ai-drawer" aria-hidden="true" role="dialog" aria-label="AI Insights Drawer">
          <header class="hf-ai-insights__header">
            <h2>AI-Powered Healthcare Insights</h2>
            <button class="hf-ai-insights__close" type="button" aria-label="Close">×</button>
          </header>
          <nav class="hf-ai-insights__tabs" role="tablist">
            <button class="hf-tab active" role="tab" aria-selected="true" aria-controls="tab-exec">Executive</button>
            <button class="hf-tab" role="tab" aria-selected="false" aria-controls="tab-hosp">Hospital</button>
            <button class="hf-tab" role="tab" aria-selected="false" aria-controls="tab-patient">Patient</button>
            <button class="hf-tab" role="tab" aria-selected="false" aria-controls="tab-actions">Actions</button>
          </nav>
          <div class="hf-ai-insights__panels">
            <section id="tab-exec" class="hf-tabpanel" role="tabpanel">
              <div class="hf-executive-summary">
                <h3>Executive Summary</h3>
                <p id="hf-exec-text">Loading executive narrative…</p>
              </div>
              <div class="hf-speed-control">
                <label for="hf-insights-speed">Update speed <span id="hf-insights-speed-label"></span></label>
                <input type="range" id="hf-insights-speed" min="3000" max="20000" step="500" />
                <div class="hf-speed-labels"><span>Faster</span><span>Slower</span></div>
              </div>
              <div class="hf-insights-wrapper" id="hf-exec-cards"></div>
            </section>
            <section id="tab-hosp" class="hf-tabpanel" role="tabpanel" hidden>
              <div class="hf-insights-wrapper" id="hf-hosp-cards"></div>
            </section>
            <section id="tab-patient" class="hf-tabpanel" role="tabpanel" hidden>
              <div class="hf-insights-wrapper" id="hf-patient-cards"></div>
            </section>
            <section id="tab-actions" class="hf-tabpanel" role="tabpanel" hidden>
              <div class="hf-insights-wrapper" id="hf-actions-cards"></div>
            </section>
          </div>
        </aside>
      `;
      document.body.appendChild(wrapper);
      return wrapper;
    }

    getTemplates() {
      // Context-aware templates using plausible/ambitious ranges
      return {
        executive: [
          (k) => `Cash velocity improved by <strong>${k.cashVelocity}%</strong> as pre-auth automation holds under <strong>${k.preauth}s</strong>. High-risk denials fell below <strong>${k.highRiskDenials}%</strong>, keeping projections on track.`,
          (k) => `AR stability maintained with days outstanding at <strong>${k.arDays}d</strong>. Claim recovery sustains at <strong>${k.recovery}%</strong> while NPS trends to <strong>${k.nps}</strong>.`,
          (k) => `Patient comms scaled: <strong>${k.whatsapp.toLocaleString()}</strong> WhatsApp resolutions, TTFA down to <strong>${k.ttfa}m</strong>.`
        ],
        hospital: (k) => [
          { title: 'Denial Radar', change: 'positive', text: `High-risk denials trending down to ${k.highRiskDenials}% with auto-appeals engaged on ${k.autoAppeals}% of flagged claims.` },
          { title: 'Cashless Engine', change: 'positive', text: `Average pre-auth ${k.preauth}s; payor SLA adherence improved ${k.slaGain}% WoW.` },
          { title: 'AR Intelligence', change: 'neutral', text: `AR at ${k.arDays} days; watch list triggered for 3 payors with aging > 45 days.` }
        ],
        patient: (k) => [
          { title: 'Concierge Responsiveness', change: 'positive', text: `Time-to-first-update at ${k.ttfa} minutes; multilingual onboarding completion at ${k.onboard}% .` },
          { title: 'Financing Uptake', change: 'positive', text: `${k.financing.toLocaleString()} zero-interest approvals this cycle.` },
          { title: 'Experience Score', change: 'positive', text: `NPS steady at ${k.nps}; CSAT ${k.csat}% across inpatient flows.` }
        ],
        actions: (k) => [
          { title: 'Action • Denial Studio', bullets: [
            'Auto-launch appeals for top 3 payors (next 24h).',
            'Batch-resubmit clean claims > ₹50K with SLA variance > 12h.',
            'Escalate LOS outliers to clinical coders with root-cause hints.'
          ]},
          { title: 'Action • Patient Concierge', bullets: [
            'Enable Friday staffing flex for WhatsApp peak (5-8pm).',
            'Proactive finance offers for orthopedic & cardiac bundles.',
            'Trigger bedside script for consent/document gaps.'
          ]}
        ]
      };
    }

    // Pseudo metrics (shared with KPI spirit)
    makeK() {
      return {
        cashVelocity: Math.round(8 + Math.random() * 6),         // 8–14%
        preauth: Math.round(40 + Math.random() * 12),             // 40–52s
        highRiskDenials: (3 + Math.random() * 2).toFixed(1),      // 3.0–5.0%
        arDays: Math.round(24 + Math.random() * 8),               // 24–32
        recovery: (96 + Math.random() * 3).toFixed(1),            // 96–99%
        nps: Math.round(62 + Math.random() * 10),                 // 62–72
        whatsapp: Math.round(10500 + Math.random() * 4500),       // 10.5k–15k
        ttfa: Math.round(6 + Math.random() * 4),                  // 6–10 min
        autoAppeals: Math.round(70 + Math.random() * 15),         // 70–85%
        slaGain: Math.round(4 + Math.random() * 6),               // 4–10%
        onboard: Math.round(82 + Math.random() * 10),             // 82–92%
        financing: Math.round(6200 + Math.random() * 2600),       // 6.2k–8.8k
        csat: Math.round(88 + Math.random() * 6)                  // 88–94%
      };
    }

    open() {
      this.root.classList.add('open');
      this.drawer.setAttribute('aria-hidden', 'false');
      this.trigger.setAttribute('aria-expanded', 'true');
    }
    close() {
      this.root.classList.remove('open');
      this.drawer.setAttribute('aria-hidden', 'true');
      this.trigger.setAttribute('aria-expanded', 'false');
    }
    toggle() { this.root.classList.contains('open') ? this.close() : this.open(); }

    init() {
      on($('.hf-ai-insights__close', this.root), 'click', () => this.close());
      on(this.trigger, 'click', () => this.toggle());
      // Tabs
      this.tabs.forEach((t, idx) => on(t, 'click', () => this.activateTab(idx)));
      // Speed control
      if (this.speedRange) {
        this.speedRange.value = String(this.intervalMs);
        if (this.speedLabel) this.speedLabel.textContent = `${Math.round(this.intervalMs/1000)}s`;
        on(this.speedRange, 'input', () => {
          this.intervalMs = parseInt(this.speedRange.value, 10) || 7000;
          ls.set('hf-insights-speed', this.intervalMs);
          if (this.timer) { clearInterval(this.timer); this.cycle(); }
          if (this.speedLabel) this.speedLabel.textContent = `${Math.round(this.intervalMs/1000)}s`;
        });
      }
      // Populate initial content
      this.renderAll();
      // Auto-open on scroll
      const onScroll = () => {
        if (window.scrollY > this.autoOpenOffset) {
          this.open();
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      // Start cycling narratives
      this.cycle();
    }

    activateTab(i) {
      this.tabs.forEach((t, idx) => {
        const active = idx === i;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
        this.panels[idx].toggleAttribute('hidden', !active);
      });
    }

    cycle() {
      const tick = () => {
        this.renderAll();
        document.dispatchEvent(new CustomEvent('hf:insightShown', { detail: { at: Date.now() } }));
      };
      tick();
      this.timer = setInterval(tick, this.intervalMs);
    }

    renderAll() {
      const k = this.makeK();
      // Executive
      const execText = $('#hf-exec-text', this.root);
      const execCards = $('#hf-exec-cards', this.root);
      if (execText && execCards) {
        const tpls = this.narratives.executive;
        execText.innerHTML = tpls.map(fn => fn(k)).join(' ');
        execCards.innerHTML = '';
        // Add two punchy cards
        const cards = [
          { title: 'Revenue Lens', change: 'positive', text: `Cash velocity +${k.cashVelocity}% with < ${k.preauth}s pre-auth.` },
          { title: 'Risk Posture', change: 'positive', text: `High-risk denials at ${k.highRiskDenials}% — appeals automation steady.` }
        ];
        cards.forEach(c => execCards.appendChild(this.cardNode(c)));
      }

      // Hospital
      const hosp = this.narratives.hospital(k);
      const hospWrap = $('#hf-hosp-cards', this.root);
      if (hospWrap) {
        hospWrap.innerHTML = '';
        hosp.forEach(c => hospWrap.appendChild(this.cardNode(c)));
      }

      // Patient
      const patient = this.narratives.patient(k);
      const patientWrap = $('#hf-patient-cards', this.root);
      if (patientWrap) {
        patientWrap.innerHTML = '';
        patient.forEach(c => patientWrap.appendChild(this.cardNode(c)));
      }

      // Actions
      const actions = this.narratives.actions(k);
      const actionsWrap = $('#hf-actions-cards', this.root);
      if (actionsWrap) {
        actionsWrap.innerHTML = '';
        actions.forEach(block => {
          const el = document.createElement('article');
          el.className = 'hf-insight-card';
          el.innerHTML = `
            <header>
              <h3>${block.title}</h3>
            </header>
            <ul class="hf-actions">
              ${block.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          `;
          actionsWrap.appendChild(el);
        });
      }
    }

    cardNode({ title, change = 'neutral', text }) {
      const el = document.createElement('article');
      el.className = 'hf-insight-card';
      el.innerHTML = `
        <header>
          <h3>${title}</h3>
          <span class="hf-insight-change ${change}">${change}</span>
        </header>
        <p class="hf-insight-text">${text}</p>
      `;
      return el;
    }
  }

  /* -------------------------------------------------------------
   * Audience Showcase floating cards (subtle bob)
   * ------------------------------------------------------------- */
  const initAudienceShowcase = () => {
    const section = $('.audience-showcase');
    if (!section) return;
    const tabs = $$('.audience-tab', section);
    const panels = $$('.audience-panel', section);
    const tweenMap = new Map();

    const reset = () => { if (!hasGSAP) return; tweenMap.forEach(t => t?.kill()); tweenMap.clear(); };

    const animatePanel = (panel) => {
      if (!hasGSAP || prefersReduced) return;
      gsap.from($('.audience-panel__content', panel), { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' });
      $$('.audience-card', panel).forEach((card, i) => {
        const dir = card.dataset.motion;
        const fromX = dir === 'left' ? -28 : dir === 'right' ? 28 : 0;
        gsap.fromTo(card, { x: fromX, y: 24, opacity: 0 }, {
          x: 0, y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: i * 0.08
        });
        const t = gsap.to(card, { y: '+=8', duration: 4 + i * 0.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        tweenMap.set(card, t);
      });
    };

    const activate = (id) => {
      reset();
      panels.forEach(p => {
        const active = p.id === id;
        p.classList.toggle('active', active);
        p.toggleAttribute('hidden', !active);
        if (active) animatePanel(p);
      });
    };

    tabs.forEach(tab => on(tab, 'click', () => {
      if (tab.classList.contains('active')) return;
      tabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      activate(tab.dataset.target);
    }));

    const initial = tabs.find(t => t.classList.contains('active')) || tabs[0];
    if (initial) {
      initial.setAttribute('aria-selected', 'true');
      activate(initial.dataset.target);
    }
  };

  /* -------------------------------------------------------------
   * App Boot
   * ------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initHeader();
    initTheme();
    initQuickPageNav();
    initAnchors();
    initGSAP();
    initParallaxTilt();
    initGeoMarquee();
    initTestimonials();
    initCounters();
    initHeroParticles();
    initAudienceShowcase();

    // KPI Dashboard — auto-detect container (place before or inside metrics section)
    const kpiHost = document.querySelector('[data-hf-kpi-host]') || document.querySelector('.kpi-strip');
    if (kpiHost) {
      // Optional controls (above dashboard): add these IDs in HTML if you'd like:
      // <input id="hf-speed-range" type="range" ... />
      // <input id="hf-auto-toggle" type="checkbox" ... />
      window.HealthFloDashboard = new HealthFloDashboard(kpiHost, {
        speedMs: 7000,  // default every 7s (user can adjust)
        auto: true
      });
    }

    // AI Insights Drawer — single reusable component
    window.HealthFloInsights = new HealthFloInsights(null, {
      intervalMs: 7000,        // matches KPI default (user adjustable)
      autoOpenOffset: 520      // auto open after some scroll
    });

    // Example: listen to custom events and sync narrative state with KPIs if desired
    document.addEventListener('hf:kpiUpdate', (e) => {
      // e.detail = { id, value, deltaPct }
      // In a future integration, you could feed these into Insights.
      // console.debug('KPI update', e.detail);
    });
    document.addEventListener('hf:insightShown', (e) => {
      // console.debug('Insight cycled', e.detail.at);
    });
  });
})();
