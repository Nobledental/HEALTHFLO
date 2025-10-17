/* ==========================================================================
   HealthFloDashboard – Live KPI Module (Upgraded Production)
   --------------------------------------------------------------------------
   What’s new vs your previous /assets/js/dashboard.js
   • Perf: pauses when offscreen/tab hidden; IntersectionObserver-driven ticks
   • Robust: MutationObserver auto-binds new .metric cards; ResizeObserver redraws
   • API+: add destroy(), rebind(), setFormatter(), setSchema(), freeze(key)
   • A11y: per-card aria-live politeness & reduced-motion fidelity
   • Options via data-attrs (on #metrics or body): data-cadence, data-quality
   • Better units/formatting, Indian locale currency, compact K/M suffix
   • Deterministic jitter with seeded PRNG (stable, natural motion)
   • Graceful fallback if markup is partial; zero external deps

   Public API:
     window.HealthFloDashboard.init({ autoUpdateMs?, quality?, selector? })
     window.HealthFloDashboard.pause()
     window.HealthFloDashboard.resume()
     window.HealthFloDashboard.setCadence(ms)
     window.HealthFloDashboard.setQuality('low'|'medium'|'high')
     window.HealthFloDashboard.updateKPI(key, value)
     window.HealthFloDashboard.getState()
     window.HealthFloDashboard.setFormatter(fn)        // (value, unit, key) => string
     window.HealthFloDashboard.setSchema(partialObj)   // override defaults per key
     window.HealthFloDashboard.freeze(key, bool=true)  // stop auto-jitter for a key
     window.HealthFloDashboard.rebind()                // rescan DOM & (re)wire cards
     window.HealthFloDashboard.destroy()               // remove observers/timers

   Custom Events:
     'hf:kpi:tick'        detail: { key, value, prev, delta }
     'hf:kpi:patched'     detail: { key, value }
     'hf:dashboard:paused'
     'hf:dashboard:resumed'

   Dependencies: none. GSAP not needed.
   ========================================================================== */

window.HealthFloDashboard = (() => {
  'use strict';

  /* ----------------------------------------
   * CONFIG & PRESETS
   * -------------------------------------- */
  const QUALITY = {
    low:    { history: 24, lineWidth: 1,   height: 24, smooth: 0.25 },
    medium: { history: 36, lineWidth: 1.5, height: 28, smooth: 0.36 },
    high:   { history: 48, lineWidth: 2,   height: 32, smooth: 0.45 }
  };

  const COLORS = {
    text: '#0b0f1a',
    muted: '#475569',
    indigo: '#2b2f77',
    emerald: '#10b981',
    red: '#ef4444',
    ink06: 'rgba(15,23,42,0.06)'
  };

  // Default synthetic schema (tweak or override with setSchema)
  const DEFAULT_SCHEMA = {
    hospitals_automated:     { label: 'Hospitals Automated',      unit: '',  min: 520, max: 680, start: 570 },
    patients_assisted:       { label: 'Patients Assisted',        unit: '',  min: 120_000, max: 240_000, start: 150_000 },
    preauth_time:            { label: 'Average Pre-Auth Time',    unit: 's', min: 28, max: 64, start: 45 },
    claim_recovery_rate:     { label: 'Claim Recovery Rate',      unit: '%', min: 93, max: 99, start: 98 },
    ar_days:                 { label: 'AR Days',                   unit: '',  min: 22, max: 35, start: 28 },
    denial_rate:             { label: 'Denial Rate',              unit: '%', min: 3.2, max: 8.5, start: 5.1 },
    cash_collected_30d:      { label: 'Cash Collected (30d)',     unit: '₹', min: 7.5e7, max: 2.4e8, start: 1.2e8 },
    zero_interest_uptake:    { label: 'Zero-Interest Uptake',     unit: '%', min: 12, max: 42, start: 28 },
    nps:                     { label: 'Patient NPS',              unit: '',  min: 60, max: 92, start: 84 },
    los_reduction:           { label: 'LoS Reduction',            unit: '%', min: 3, max: 14, start: 9 },
    // Patient-centric
    whatsapp_response_time:  { label: 'WhatsApp Response Time',   unit: 's', min: 6, max: 24, start: 12 },
    patient_escalations_res: { label: 'Escalations Resolved',     unit: '%', min: 76, max: 98, start: 92 },
    finance_approval_rate:   { label: 'Finance Approval Rate',    unit: '%', min: 48, max: 86, start: 73 },
    bedside_updates:         { label: 'Bedside Updates / Day',    unit: '',  min: 1200, max: 4800, start: 2600 }
  };

  // Utilities
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const throttle = (fn, wait = 120) => { let t = 0; return (...a) => { const n = Date.now(); if (n - t >= wait) { t = n; fn(...a); } }; };
  const debounce = (fn, wait = 200) => { let to; return (...a) => { clearTimeout(to); to = setTimeout(() => fn(...a), wait); }; };

  // Derive a key from text
  const deriveKey = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

  // Seeded PRNG (stable jitter per key)
  const makePRNG = (seed = 1337) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Default formatter; can be overridden
  let customFormatter = null;
  const format = (value, unit, key) => {
    if (typeof customFormatter === 'function') return customFormatter(value, unit, key);

    if (unit === '%')  return `${Math.round(value)}%`;
    if (unit === 's')  return `${Math.round(value)}s`;
    if (unit === '₹') {
      try { return '₹' + Math.round(value).toLocaleString('en-IN'); }
      catch { return '₹' + Math.round(value); }
    }
    // Compact K/M/B for large ints
    const n = Number(value);
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e4) try { return n.toLocaleString('en-IN'); } catch { return String(Math.round(n)); }
    return String(Math.round(n));
  };

  // Random in realistic band, biased toward previous value
  const jitterToward = (rand, prev, min, max, damp = 0.7) => {
    const target = min + rand() * (max - min);
    return prev * damp + target * (1 - damp);
  };

  /* ----------------------------------------
   * MODELS
   * -------------------------------------- */
  class KPI {
    constructor(key, label, unit, quality, startValue, rng) {
      this.key = key;
      this.label = label;
      this.unit = unit;
      this.quality = quality;
      this.rng = rng || makePRNG(hashString(key));
      this.history = [];
      this.value = startValue ?? 0;
      this.prev = this.value;
      this.window = QUALITY[this.quality]?.history || QUALITY.medium.history;
      this.frozen = false;
    }
    push(v) {
      this.prev = this.value;
      this.value = v;
      this.history.push(v);
      if (this.history.length > this.window) this.history.shift();
    }
    trend() {
      const d = this.value - this.prev;
      return { delta: d, dir: d === 0 ? 'flat' : d > 0 ? 'up' : 'down' };
    }
  }

  class Sparkline {
    constructor(hostEl, quality, accent = COLORS.emerald) {
      this.host = hostEl;
      this.accent = accent;
      this.quality = quality;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'hf-sparkline';
      this.host.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.resize();
    }
    resize() {
      const rect = this.host.getBoundingClientRect();
      const h = QUALITY[this.quality]?.height || QUALITY.medium.height;
      const w = Math.max(120, Math.min(220, rect.width || 180));
      this.cssW = w; this.cssH = h;
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    draw(values) {
      if (!values || values.length < 2) return;
      const ctx = this.ctx, W = this.cssW, H = this.cssH;
      ctx.clearRect(0, 0, W, H);

      // baseline
      ctx.strokeStyle = COLORS.ink06;
      ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(0, H - 0.5); ctx.lineTo(W, H - 0.5); ctx.stroke();

      const min = Math.min(...values), max = Math.max(...values);
      const range = (max - min) || 1;
      const step = W / (values.length - 1);
      const lw = QUALITY[this.quality]?.lineWidth || 1.5;

      ctx.strokeStyle = this.accent; ctx.lineWidth = lw; ctx.beginPath();
      values.forEach((v, i) => {
        const x = i * step;
        const y = H - ((v - min) / range) * (H - 2) - 1;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // endpoint
      const last = values[values.length - 1];
      const x = (values.length - 1) * step;
      const y = H - ((last - min) / range) * (H - 2) - 1;
      ctx.fillStyle = this.accent; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  class MetricCard {
    constructor(el, quality) {
      this.el = el;
      this.labelEl = el.querySelector('span');
      this.valueEl = el.querySelector('strong');
      this.badgeEl = document.createElement('em');
      this.badgeEl.className = 'hf-trend';
      this.badgeEl.setAttribute('aria-hidden', 'true');
      this.valueEl.after(this.badgeEl);

      // Sparkline
      this.sparkHost = document.createElement('div');
      this.sparkHost.className = 'hf-spark-host';
      this.el.appendChild(this.sparkHost);
      this.spark = new Sparkline(this.sparkHost, quality);
      this.quality = quality;

      // Key & unit
      const labelText = (this.valueEl.dataset.kpiLabel || this.labelEl?.textContent || '').trim();
      const explicitKey = this.valueEl.dataset.kpi;
      this.key = explicitKey || deriveKey(labelText || 'kpi');

      const explicitUnit = this.valueEl.dataset.suffix || this.valueEl.dataset.unit || '';
      this.unit = explicitUnit;

      // ARIA live region
      this.announce = document.createElement('span');
      this.announce.className = 'visually-hidden';
      this.announce.setAttribute('aria-live', 'polite');
      this.el.appendChild(this.announce);
    }
    mountSpark(vals) { this.spark.draw(vals); }
    resize() { this.spark.resize(); }
    renderValue(v, unit, reduceMotion) {
      const out = format(v, unit, this.key);
      if (reduceMotion) { this.valueEl.textContent = out; return; }
      // lightweight number tween
      const prevN = parseFloat(String(this.valueEl.textContent).replace(/[^\d.-]/g, '')) || 0;
      const to = Number(v);
      const start = performance.now(), dur = 420, d = to - prevN;
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        const cur = prevN + d * e;
        this.valueEl.textContent = format(cur, unit, this.key);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    renderBadge(dir, delta, unit) {
      if (dir === 'flat' || Math.abs(delta) < 0.0001) {
        this.badgeEl.textContent = ''; this.badgeEl.className = 'hf-trend'; return;
      }
      const sign = dir === 'up' ? '+' : '−';
      const txt = unit === '%' || unit === 's'
        ? `${sign}${Math.abs(delta).toFixed(0)}${unit}`
        : `${sign}${format(Math.abs(delta), unit, this.key).replace(/^₹/, '')}`;
      this.badgeEl.textContent = txt;
      this.badgeEl.className = `hf-trend ${dir}`;
    }
    announcePolite(label, v, unit) { this.announce.textContent = `${label} ${format(v, unit, this.key)}`; }
  }

  /* ----------------------------------------
   * CONTROLLER
   * -------------------------------------- */
  const C = {
    running: false,
    cadence: 7000,
    quality: 'medium',
    selector: '#metrics .metrics-grid, .metrics .metrics-grid',
    schema: { ...DEFAULT_SCHEMA },
    kpis: new Map(),     // key -> KPI
    cards: new Map(),    // key -> MetricCard
    timer: null,
    io: null,            // IntersectionObserver (container)
    ro: null,            // ResizeObserver
    mo: null,            // MutationObserver (metric add/remove)
    visible: true,       // doc visibility
    formattingFn: null,

    init(opts = {}) {
      // Data attr defaults
      const root = $('#metrics') || document.body;
      const attrCadence = Number(root?.dataset?.cadence || document.body.dataset.cadence) || null;
      const attrQuality = (root?.dataset?.quality || document.body.dataset.quality) || null;

      this.cadence = Math.max(1500, Number(opts.autoUpdateMs ?? attrCadence ?? this.cadence));
      this.quality = QUALITY[opts.quality ?? attrQuality] ? (opts.quality ?? attrQuality) : this.quality;
      this.selector = opts.selector || this.selector;

      const count = this._bindDom();
      if (!count) return 0;

      // Observers
      this._bindVisibility();
      this._bindIntersection();
      this._bindResize();
      this._bindMutation();

      this.running = true;
      this._startLoop();
      return count;
    },

    _bindDom() {
      const container = $(this.selector);
      if (!container) return 0;

      // collect .metric blocks (ignore ones already bound)
      const blocks = $$('.metric', container).filter(m => !m.dataset.hfBound);
      blocks.forEach((el) => {
        el.dataset.hfBound = 'true';
        const card = new MetricCard(el, this.quality);

        // choose schema
        let key = card.key;
        let s = this.schema[key];
        if (!s) {
          const label = (card.labelEl?.textContent || '').trim() || key;
          key = deriveKey(label);
          s = this.schema[key] || { label, unit: card.unit || '', min: 10, max: 100, start: 42 };
        }
        if (!card.unit && s.unit) card.unit = s.unit;

        const kpi = new KPI(
          key,
          s.label,
          card.unit,
          this.quality,
          s.start,
          makePRNG(hashString(key))
        );

        // Warm up history
        for (let i = 0; i < QUALITY[this.quality].history; i++) {
          const seed = jitterToward(kpi.rng, kpi.value, s.min, s.max, 0.88);
          kpi.push(seed);
        }

        this.kpis.set(key, kpi);
        this.cards.set(key, card);

        // First paint
        card.renderValue(kpi.value, kpi.unit, prefersReduced);
        card.renderBadge('flat', 0, kpi.unit);
        card.mountSpark(kpi.history);
        card.announcePolite(kpi.label, kpi.value, kpi.unit);
      });

      return this.cards.size;
    },

    _bindVisibility() {
      document.addEventListener('visibilitychange', () => {
        this.visible = !document.hidden;
        if (!this.visible) this.pause();
        else if (this.visible) this.resume();
      });
    },

    _bindIntersection() {
      const container = $(this.selector);
      if (!container) return;
      this.io?.disconnect();
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((ent) => {
          if (ent.target !== container) return;
          if (ent.isIntersecting && this.running) this._startLoop();
          else this._stopLoop();
        });
      }, { threshold: 0.05 });
      this.io.observe(container);
    },

    _bindResize() {
      const container = $(this.selector);
      if (!container) return;
      this.ro?.disconnect();
      if ('ResizeObserver' in window) {
        this.ro = new ResizeObserver(debounce(() => {
          this.cards.forEach(c => c.resize());
          // immediate spark redraw (no value change)
          this.kpis.forEach((k, key) => this.cards.get(key)?.mountSpark(k.history));
        }, 100));
        this.ro.observe(container);
      } else {
        window.addEventListener('resize', throttle(() => {
          this.cards.forEach(c => c.resize());
          this.kpis.forEach((k, key) => this.cards.get(key)?.mountSpark(k.history));
        }, 120), { passive: true });
      }
    },

    _bindMutation() {
      const container = $(this.selector);
      if (!container) return;
      this.mo?.disconnect();
      this.mo = new MutationObserver(debounce(() => this.rebind(), 60));
      this.mo.observe(container, { childList: true, subtree: true });
    },

    _tick() {
      if (!this.running) return;
      this.kpis.forEach((kpi, key) => {
        const s = this.schema[key] || { min: Math.min(...kpi.history), max: Math.max(...kpi.history) };
        const next = kpi.frozen ? kpi.value : jitterToward(kpi.rng, kpi.value, s.min, s.max, 0.72);
        kpi.push(next);

        const card = this.cards.get(key);
        if (!card) return;
        const { delta, dir } = kpi.trend();
        card.renderValue(kpi.value, kpi.unit, prefersReduced);
        card.renderBadge(dir, delta, kpi.unit);
        card.mountSpark(kpi.history);
        card.announcePolite(kpi.label, kpi.value, kpi.unit);

        window.dispatchEvent(new CustomEvent('hf:kpi:tick', { detail: { key, value: kpi.value, prev: kpi.prev, delta } }));
      });
    },

    _startLoop() {
      this._stopLoop();
      this.timer = setInterval(() => this._tick(), this.cadence);
    },
    _stopLoop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    },

    /* ---------- Public API ---------- */
    pause() {
      if (!this.running) return;
      this._stopLoop();
      this.running = false;
      window.dispatchEvent(new CustomEvent('hf:dashboard:paused'));
    },
    resume() {
      if (this.running) return;
      this.running = true;
      this._startLoop();
      window.dispatchEvent(new CustomEvent('hf:dashboard:resumed'));
    },
    setCadence(ms) {
      this.cadence = Math.max(1000, Number(ms) || this.cadence);
      if (this.running) this._startLoop();
    },
    setQuality(q) {
      if (!QUALITY[q]) return;
      this.quality = q;
      // Update windows + redraw
      this.cards.forEach((card, key) => {
        card.quality = q;
        card.resize();
        const kpi = this.kpis.get(key);
        if (!kpi) return;
        kpi.quality = q;
        kpi.window = QUALITY[q].history;
        while (kpi.history.length > kpi.window) kpi.history.shift();
        card.mountSpark(kpi.history);
      });
    },
    updateKPI(key, value) {
      const kpi = this.kpis.get(key);
      const card = this.cards.get(key);
      if (!kpi || !card) return false;
      kpi.push(Number(value));
      const { delta, dir } = kpi.trend();
      card.renderValue(kpi.value, kpi.unit, prefersReduced);
      card.renderBadge(dir, delta, kpi.unit);
      card.mountSpark(kpi.history);
      card.announcePolite(kpi.label, kpi.value, kpi.unit);
      window.dispatchEvent(new CustomEvent('hf:kpi:patched', { detail: { key, value: kpi.value } }));
      return true;
    },
    freeze(key, bool = true) {
      const k = this.kpis.get(key);
      if (k) k.frozen = !!bool;
    },
    setFormatter(fn) {
      if (typeof fn === 'function') customFormatter = fn;
    },
    setSchema(partial) {
      if (!partial || typeof partial !== 'object') return;
      this.schema = { ...this.schema, ...partial };
    },
    rebind() {
      // Re-scan and bind newly added metric cards
      this._bindDom();
    },
    destroy() {
      this.pause();
      this._stopLoop();
      this.io?.disconnect(); this.io = null;
      this.ro?.disconnect(); this.ro = null;
      this.mo?.disconnect(); this.mo = null;
      // Do not remove DOM; keep cards visible/static
    },
    getState() {
      const obj = {};
      this.kpis.forEach((k, key) => { obj[key] = { value: k.value, unit: k.unit, frozen: !!k.frozen, history: [...k.history] }; });
      return { cadence: this.cadence, quality: this.quality, running: this.running, kpis: obj };
    }
  };

  /* ----------------------------------------
   * LIGHT CSS (spark host + badges)
   * -------------------------------------- */
  (function injectCSS(){
    if (document.getElementById('hf-dashboard-inline-css')) return;
    const css = `
      .metric { position: relative; }
      .metric strong { display: inline-flex; align-items: center; gap: .5rem; }
      .metric .hf-trend {
        font-style: normal; font-weight: 700; font-size: .95rem; line-height: 1;
        padding: .2rem .5rem; border-radius: 999px; background: rgba(43,47,119,0.06); color: ${COLORS.indigo};
      }
      .metric .hf-trend.up   { background: rgba(16,185,129,0.12); color: ${COLORS.emerald}; }
      .metric .hf-trend.down { background: rgba(239,68,68,0.10); color: ${COLORS.red}; }
      .metric .hf-spark-host { position: absolute; top: .9rem; right: .9rem; width: 44%; max-width: 200px; pointer-events: none; }
      canvas.hf-sparkline { display: block; }
      @media (max-width: 640px){ .metric .hf-spark-host { display: none; } }
    `.trim();
    const style = document.createElement('style');
    style.id = 'hf-dashboard-inline-css';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  /* ----------------------------------------
   * Helpers
   * -------------------------------------- */
  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* ----------------------------------------
   * Auto-init (optional): if #metrics exists
   * -------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const metrics = document.getElementById('metrics');
    if (!metrics) return;
    // Respect data attributes if present
    const autoMs = Number(metrics.dataset.cadence || document.body.dataset.cadence) || undefined;
    const qual = metrics.dataset.quality || document.body.dataset.quality || undefined;
    C.init({ autoUpdateMs: autoMs, quality: qual });
  });

  return C;
})();
