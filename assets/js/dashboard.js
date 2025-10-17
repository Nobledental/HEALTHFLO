/* ==========================================================================
   HealthFloDashboard – Live KPI Module (Production)
   --------------------------------------------------------------------------
   Purpose:
     - Powers hospital + patient-centric KPIs with tasteful, premium motion.
     - Adds inline sparklines beside the numbers (Canvas, no external libs).
     - Auto-updates values on a cadence (default 7s) with realistic deltas.
     - Works out-of-the-box with your existing #metrics markup.
     - Fully config-driven + accessible (polite ARIA announcements).

   How it works:
     • Scans #metrics .metric blocks. Each block must contain:
         <div class="metric">
           <strong data-kpi="hospitals_automated" data-unit=""></strong>
           <span>Hospitals Automated</span>
         </div>
       If data-kpi is missing, the module will infer a key from the label text.

     • For each KPI it:
         - Creates a right-aligned sparkline canvas (retina-aware).
         - Tracks a rolling window of data points.
         - Animates to new value every tick (default 7s).
         - Applies up/down trend badge beside the number.

   Public API:
     window.HealthFloDashboard.init({ autoUpdateMs?: number, quality?: 'low'|'medium'|'high' })
     window.HealthFloDashboard.pause()
     window.HealthFloDashboard.resume()
     window.HealthFloDashboard.setCadence(ms:number)
     window.HealthFloDashboard.setQuality('low'|'medium'|'high')
     window.HealthFloDashboard.updateKPI(key:string, value:number) // manual override
     window.HealthFloDashboard.getState() // debug snapshot

   Custom Events:
     - 'hf:kpi:tick'          detail: { key, value, prev, delta }
     - 'hf:kpi:patched'       detail: { key, value }
     - 'hf:dashboard:paused'
     - 'hf:dashboard:resumed'

   Notes:
     - Zero dependencies. GSAP is NOT required here.
     - Respects reduced motion (no transitions on numbers).
     - Premium palette: Deep Indigo & Emerald, Sky & Aqua accents (no neon).
   ========================================================================== */

window.HealthFloDashboard = (() => {
  'use strict';

  /* ----------------------------------------
   * CONFIG & PRESETS
   * -------------------------------------- */
  const DEFAULT_CADENCE = (() => {
    const cfg = window.HealthFlo?.config;
    return (cfg && typeof cfg.kpiAutoUpdateMs === 'number') ? cfg.kpiAutoUpdateMs : 7000;
  })();

  const QUALITY = {
    low:    { history: 24, lineWidth: 1,  height: 24,  smooth: 0.25 },
    medium: { history: 36, lineWidth: 1.5,height: 28,  smooth: 0.36 },
    high:   { history: 48, lineWidth: 2,  height: 32,  smooth: 0.45 }
  };

  const COLORS = {
    text: '#0b0f1a',
    muted: '#475569',
    indigo: '#2b2f77',
    emerald: '#1dbf73',
    aqua: '#5eead4',
    sky: '#38bdf8',
    ink06: 'rgba(15,23,42,0.06)'
  };

  // Realistic baseline ranges (slightly impressive; adjustable)
  // Note: These are “synthetic defaults” for demo. Replace with API data later.
  const KPI_SCHEMA = {
    hospitals_automated:     { label: 'Hospitals Automated',      unit: '',   min: 520, max: 680, start: 570 },
    patients_assisted:       { label: 'Patients Assisted',        unit: '',   min: 120_000, max: 240_000, start: 150_000 },
    preauth_time:            { label: 'Average Pre-Auth Time',    unit: 's',  min: 28, max: 64, start: 45 },
    claim_recovery_rate:     { label: 'Claim Recovery Rate',      unit: '%',  min: 93, max: 99, start: 98 },
    ar_days:                 { label: 'AR Days',                   unit: '',   min: 26, max: 45, start: 34 },
    denial_rate:             { label: 'Denial Rate',              unit: '%',  min: 3.2, max: 8.5, start: 5.1 },
    cash_collected_30d:      { label: 'Cash Collected (30d)',     unit: '₹',  min: 7.5e7, max: 2.4e8, start: 1.2e8 }, // ₹
    zero_interest_uptake:    { label: 'Zero-Interest Uptake',     unit: '%',  min: 12, max: 42, start: 28 },
    nps:                     { label: 'Patient NPS',              unit: '',   min: 60, max: 92, start: 84 },
    los_reduction:           { label: 'LoS Reduction',            unit: '%',  min: 3, max: 14, start: 9 },

    // Patient-centric (added)
    whatsapp_response_time:  { label: 'WhatsApp Response Time',   unit: 's',  min: 6, max: 24, start: 12 },
    patient_escalations_res: { label: 'Escalations Resolved',     unit: '%',  min: 76, max: 98, start: 92 },
    finance_approval_rate:   { label: 'Finance Approval Rate',    unit: '%',  min: 48, max: 86, start: 73 },
    bedside_updates:         { label: 'Bedside Updates / Day',    unit: '',   min: 1200, max: 4800, start: 2600 },
  };

  // If an element lacks data-kpi, we’ll derive a key from its <span> label
  const deriveKey = (label) => label.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

  // Helpers
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Number formatting by unit
  const format = (value, unit) => {
    if (unit === '%')  return `${Number(value).toFixed(0)}%`;
    if (unit === 's')  return `${Number(value).toFixed(0)}s`;
    if (unit === '₹')  { // Indian locale formatting
      try { return '₹' + Number(value).toLocaleString('en-IN'); }
      catch { return '₹' + Math.round(value); }
    }
    // Default: compact formatting for big ints
    if (Number(value) >= 10_000) {
      try { return Number(value).toLocaleString('en-IN'); }
      catch { return String(Math.round(value)); }
    }
    return String(Math.round(value));
  };

  // Random in realistic range with slight bias toward last value
  const jitter = (prev, min, max, damp = 0.6) => {
    const target = min + Math.random() * (max - min);
    return prev * damp + target * (1 - damp);
  };

  // State per KPI
  class KPI {
    constructor(key, label, unit, quality, startValue) {
      this.key = key; this.label = label; this.unit = unit;
      this.quality = quality;
      this.history = [];
      this.value = startValue ?? 0;
      this.prev = this.value;
      this.window = QUALITY[this.quality]?.history || QUALITY.medium.history;
    }

    push(value) {
      this.prev = this.value;
      this.value = value;
      this.history.push(this.value);
      if (this.history.length > this.window) this.history.shift();
    }

    trend() {
      const d = this.value - this.prev;
      return { delta: d, dir: d === 0 ? 'flat' : d > 0 ? 'up' : 'down' };
    }
  }

  // Sparkline renderer
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
      const w = Math.max(120, Math.min(200, rect.width * 0.55));
      this.cssW = w; this.cssH = h;
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    draw(values) {
      if (!values || values.length < 2) return;
      const ctx = this.ctx;
      const W = this.cssW, H = this.cssH;
      ctx.clearRect(0, 0, W, H);

      // Grid baseline (subtle)
      ctx.strokeStyle = COLORS.ink06;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H - 0.5); ctx.lineTo(W, H - 0.5); ctx.stroke();

      const min = Math.min(...values), max = Math.max(...values);
      const range = (max - min) || 1;

      const lw = QUALITY[this.quality]?.lineWidth || 1.5;
      ctx.lineWidth = lw;
      ctx.strokeStyle = this.accent;
      ctx.beginPath();

      const step = W / (values.length - 1);
      values.forEach((v, i) => {
        const x = i * step;
        const y = H - ((v - min) / range) * (H - 2) - 1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Last point dot
      const lastX = (values.length - 1) * step;
      const lastY = H - ((values[values.length - 1] - min) / range) * (H - 2) - 1;
      ctx.fillStyle = this.accent;
      ctx.beginPath(); ctx.arc(lastX, lastY, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // DOM adapter for a metric card
  class MetricCard {
    constructor(el, quality) {
      this.el = el;
      this.labelEl = el.querySelector('span');
      this.valueEl = el.querySelector('strong');
      this.badgeEl = document.createElement('em');
      this.badgeEl.className = 'hf-trend';
      this.badgeEl.setAttribute('aria-hidden', 'true');
      this.valueEl.after(this.badgeEl);

      // Sparkline host
      this.sparkHost = document.createElement('div');
      this.sparkHost.className = 'hf-spark-host';
      this.el.appendChild(this.sparkHost);

      this.spark = new Sparkline(this.sparkHost, quality);
      this.quality = quality;

      // Derive key/unit
      const labelText = (this.valueEl.dataset.kpiLabel || this.labelEl?.textContent || '').trim();
      const explicitKey = this.valueEl.dataset.kpi;
      this.key = explicitKey || deriveKey(labelText);
      const explicitUnit = this.valueEl.dataset.suffix || this.valueEl.dataset.unit || '';
      this.unit = explicitUnit;

      // ARIA for polite updates
      this.announce = document.createElement('span');
      this.announce.className = 'visually-hidden';
      this.announce.setAttribute('aria-live', 'polite');
      this.el.appendChild(this.announce);
    }

    mountSpark(values) { this.spark.draw(values); }
    resize() { this.spark.resize(); }

    renderValue(value, unit, reduced = false) {
      const formatted = format(value, unit);
      if (reduced) {
        this.valueEl.textContent = formatted;
        return;
      }
      // Count-up (lightweight manual tween)
      const prevRaw = Number(String(this.valueEl.textContent).replace(/[^\d.]/g, '')) || 0;
      const start = performance.now();
      const dur = 480;
      const delta = value - prevRaw;

      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = prevRaw + delta * eased;
        this.valueEl.textContent = format(cur, unit);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    renderBadge(dir, delta, unit) {
      if (dir === 'flat' || Math.abs(delta) < 0.0001) {
        this.badgeEl.textContent = '';
        this.badgeEl.className = 'hf-trend';
        return;
      }
      const sign = dir === 'up' ? '+' : '−';
      const txt = unit === '%' || unit === 's'
        ? `${sign}${Math.abs(delta).toFixed(0)}${unit}`
        : `${sign}${format(Math.abs(delta), unit).replace(/^₹/, '')}`;

      this.badgeEl.textContent = txt;
      this.badgeEl.className = `hf-trend ${dir}`;
    }

    politeAnnounce(label, value, unit) {
      this.announce.textContent = `${label} ${format(value, unit)}`;
    }
  }

  /* ----------------------------------------
   * DASHBOARD CONTROLLER
   * -------------------------------------- */
  const Dashboard = {
    running: false,
    cadence: DEFAULT_CADENCE,
    quality: 'medium',
    kpis: new Map(),     // key -> KPI
    cards: new Map(),    // key -> MetricCard
    timer: null,

    // Bootstrap DOM
    _bindDom() {
      const container = $('#metrics .metrics-grid, .metrics .metrics-grid');
      if (!container) return 0;

      const blocks = $$('.metric', container);
      blocks.forEach((el) => {
        const card = new MetricCard(el, this.quality);

        // Determine key + schema
        let key = card.key;
        let schema = KPI_SCHEMA[key];
        if (!schema) {
          // Try to match by label text
          const label = (card.labelEl?.textContent || '').trim();
          key = deriveKey(label);
          schema = KPI_SCHEMA[key] || { label, unit: card.unit || '', min: 10, max: 100, start: 42 };
        }

        // If unit unspecified in DOM, use schema
        if (!card.unit && schema.unit) card.unit = schema.unit;

        const kpi = new KPI(key, schema.label, card.unit, this.quality, schema.start);
        // Seed with initial history near start value
        for (let i = 0; i < QUALITY[this.quality].history; i++) {
          const seed = jitter(kpi.value, schema.min, schema.max, 0.85);
          kpi.push(seed);
        }

        this.kpis.set(key, kpi);
        this.cards.set(key, card);

        // First render
        card.renderValue(kpi.value, kpi.unit, prefersReduced);
        card.renderBadge('flat', 0, kpi.unit);
        card.mountSpark(kpi.history);
        card.politeAnnounce(kpi.label, kpi.value, kpi.unit);
      });

      // Resize binding
      const onResize = () => this.cards.forEach((c) => c.resize());
      window.addEventListener('resize', onResize);
      window.addEventListener('hf:resize', onResize);
      return this.cards.size;
    },

    // One tick: update all KPIs with new realistic value
    _tick() {
      this.kpis.forEach((kpi, key) => {
        const schema = KPI_SCHEMA[key] || { min: Math.min(...kpi.history), max: Math.max(...kpi.history) };
        const next = jitter(kpi.value, schema.min, schema.max, 0.72);
        kpi.push(next);

        const card = this.cards.get(key);
        if (!card) return;
        const { delta, dir } = kpi.trend();

        card.renderValue(kpi.value, kpi.unit, prefersReduced);
        card.renderBadge(dir, delta, kpi.unit);
        card.mountSpark(kpi.history);
        card.politeAnnounce(kpi.label, kpi.value, kpi.unit);

        window.dispatchEvent(new CustomEvent('hf:kpi:tick', {
          detail: { key, value: kpi.value, prev: kpi.prev, delta }
        }));
      });
    },

    _startLoop() {
      if (this.timer) clearInterval(this.timer);
      if (!this.running) return;
      this.timer = setInterval(() => this._tick(), this.cadence);
    },

    /* ---------- Public API ---------- */
    init(opts = {}) {
      this.cadence = Math.max(1500, Number(opts.autoUpdateMs || DEFAULT_CADENCE));
      this.quality = (opts.quality && QUALITY[opts.quality]) ? opts.quality : 'medium';
      const count = this._bindDom();
      this.running = count > 0;

      if (this.running) {
        this._startLoop();
      }

      // React to global config updates
      window.addEventListener('hf:configChanged', (e) => {
        const c = e.detail || {};
        if (typeof c.kpiAutoUpdateMs === 'number') this.setCadence(c.kpiAutoUpdateMs);
      });

      return count;
    },

    pause() {
      if (!this.running) return;
      this.running = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      window.dispatchEvent(new CustomEvent('hf:dashboard:paused'));
    },

    resume() {
      if (this.running) return;
      this.running = true;
      this._startLoop();
      window.dispatchEvent(new CustomEvent('hf:dashboard:resumed'));
    },

    setCadence(ms) {
      this.cadence = Math.max(1000, Number(ms) || DEFAULT_CADENCE);
      if (this.running) this._startLoop();
    },

    setQuality(q) {
      if (!QUALITY[q]) return;
      this.quality = q;

      // Rebuild sparklines & windows
      this.cards.forEach((card, key) => {
        card.quality = q;
        card.resize();
        const kpi = this.kpis.get(key);
        if (!kpi) return;
        kpi.quality = q;
        kpi.window = QUALITY[q].history;
        // Trim or pad history to fit new window
        while (kpi.history.length > kpi.window) kpi.history.shift();
        // No padding needed; next ticks will fill.
        card.mountSpark(kpi.history);
      });
    },

    updateKPI(key, value) {
      const kpi = this.kpis.get(key);
      const card = this.cards.get(key);
      if (!kpi || !card) return false;
      kpi.push(Number(value));
      card.renderValue(kpi.value, kpi.unit, prefersReduced);
      card.renderBadge(kpi.trend().dir, kpi.value - kpi.prev, kpi.unit);
      card.mountSpark(kpi.history);
      card.politeAnnounce(kpi.label, kpi.value, kpi.unit);
      window.dispatchEvent(new CustomEvent('hf:kpi:patched', { detail: { key, value: kpi.value } }));
      return true;
    },

    getState() {
      const obj = {};
      this.kpis.forEach((k, key) => { obj[key] = { value: k.value, unit: k.unit, history: [...k.history] }; });
      return { cadence: this.cadence, quality: this.quality, running: this.running, kpis: obj };
    }
  };

  /* ----------------------------------------
   * LIGHT CSS HOOKS (only for sparkline/badges)
   * -------------------------------------- */
  (function injectMinimalCSS(){
    if (document.getElementById('hf-dashboard-inline-css')) return;
    const css = `
      .metric {
        position: relative;
      }
      .metric strong {
        display: inline-flex;
        align-items: center;
        gap: .5rem;
      }
      .metric .hf-trend {
        font-style: normal;
        font-weight: 700;
        font-size: .95rem;
        line-height: 1;
        padding: .2rem .5rem;
        border-radius: 999px;
        background: rgba(43,47,119,0.06);
        color: ${COLORS.indigo};
      }
      .metric .hf-trend.up {
        background: rgba(29,191,115,0.12);
        color: ${COLORS.emerald};
      }
      .metric .hf-trend.down {
        background: rgba(239,68,68,0.10);
        color: #ef4444;
      }
      .metric .hf-spark-host {
        position: absolute;
        top: .9rem;
        right: .9rem;
        width: 44%;
        max-width: 180px;
        pointer-events: none;
      }
      canvas.hf-sparkline { display: block; }
      @media (max-width: 640px) {
        .metric .hf-spark-host { display: none; }
      }
      /* Fallback reveal when GSAP absent */
      .gsap-reveal.is-visible { opacity: 1 !important; transform: none !important; }
    `.trim();
    const style = document.createElement('style');
    style.id = 'hf-dashboard-inline-css';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  return Dashboard;
})();
