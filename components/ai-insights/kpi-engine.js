/*!
 * HealthFlo KPI Engine (Simulated)
 * ----------------------------------------------------------
 * - IIFE, zero deps
 * - Dispatches CustomEvents: 'hf:kpiUpdate', 'hf:refreshStart', 'hf:refreshComplete'
 * - Config-driven hospital & patient KPIs with realistic ranges
 * - Adjustable speed (5s / 15s / 30s) via window.HealthFloKPI.setSpeed()
 * - Pause on tab hidden to save CPU; resumes on focus
 * - Safe to disable via window.HealthFloKPI.disable()
 * - Updates DOM (IDs must exist) + broadcasts payload for dashboards
 */

(() => {
  const DOC = document;
  const WIN = window;

  // ------------------------ Utilities ------------------------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const rndInt = (min, max) => Math.floor(rnd(min, max + 1));
  const pct = (num, denom) => (denom === 0 ? 0 : (num / denom) * 100);
  const formatInt = (n) => n.toLocaleString();
  const formatPct = (n, digits = 0) => `${n.toFixed(digits)}%`;
  const formatSec = (n) => `${Math.max(1, Math.round(n))}s`;

  // Badge helper: places a compact delta badge beside KPI text.
  const applyDeltaBadge = (el, delta) => {
    if (!el) return;
    const isUp = delta > 0;
    const isDown = delta < 0;
    const clsUp = 'hf-delta-up';
    const clsDown = 'hf-delta-down';
    const clsStable = 'hf-delta-stable';
    el.classList.remove(clsUp, clsDown, clsStable);
    el.classList.add(isUp ? clsUp : isDown ? clsDown : clsStable);
    el.textContent =
      (isUp ? '▲ +' : isDown ? '▼ ' : '• ') +
      (Math.abs(delta) >= 1 ? delta.toFixed(1) : delta.toFixed(2)) +
      '%';
  };

  // ------------------------ Config ------------------------
  const CONFIG = {
    enabled: true,                // can be toggled off by user
    speedMs: 15000,               // default "Standard" 15s. Options: 5000, 15000, 30000
    minSpeedMs: 3000,             // guard rails
    maxSpeedMs: 60000,
    // Hospital-centric & Patient-centric KPIs (10+)
    kpis: {
      hospital: {
        admissions: { id: 'kpi-admissions', type: 'int', baseline: 480, drift: [ -15, 22 ], bounds: [ 380, 820 ], deltaId: 'kpi-admissions-delta' },
        approvalRate: { id: 'kpi-approval', type: 'pct', baseline: 92, drift: [ -1.4, 1.6 ], bounds: [ 82, 98 ], deltaId: 'kpi-approval-delta' },
        preauthTime: { id: 'kpi-preauth', type: 'sec', baseline: 45, drift: [ -6, 4 ], bounds: [ 22, 78 ], deltaId: 'kpi-preauth-delta', invertGood: true },
        denialRate: { id: null, type: 'pct', baseline: 6.2, drift: [ -1.2, 1.0 ], bounds: [ 2.5, 12.5 ], invertGood: true },
        arDays: { id: null, type: 'int', baseline: 51, drift: [ -5, 4 ], bounds: [ 38, 72 ], invertGood: true },
      },
      patient: {
        satisfaction: { id: 'kpi-satisfaction', type: 'pct', baseline: 86, drift: [ -2.5, 3.5 ], bounds: [ 72, 95 ], deltaId: 'kpi-satisfaction-delta' },
        waitTime: { id: null, type: 'min', baseline: 18, drift: [ -4, 3 ], bounds: [ 8, 36 ], invertGood: true },
        nps: { id: null, type: 'int', baseline: 62, drift: [ -5, 7 ], bounds: [ 30, 85 ] },
        whatsappOpenRate: { id: null, type: 'pct', baseline: 61, drift: [ -4, 5 ], bounds: [ 40, 85 ] },
        adoptionRate: { id: null, type: 'pct', baseline: 54, drift: [ -3, 4.5 ], bounds: [ 35, 82 ] },
      }
    }
  };

  // Create a working state with previous cycle snapshot for deltas.
  const STATE = {
    timer: null,
    speedMs: CONFIG.speedMs,
    visible: true,
    lastPayload: null,
    snapshot: null
  };

  // ------------------------ Core Simulation ------------------------
  const stepValue = (current, [minDrift, maxDrift], [minBound, maxBound]) => {
    const step = rnd(minDrift, maxDrift);
    const next = clamp(current + step, minBound, maxBound);
    return next;
  };

  const computeDeltaPct = (prev, current, invertGood = false) => {
    if (prev === null || prev === undefined) return 0;
    const change = prev === 0 ? 0 : ((current - prev) / Math.abs(prev)) * 100;
    // If "lower is better" metric, invert sign for badge semantics
    return invertGood ? -change : change;
  };

  const formatByType = (type, value) => {
    switch (type) {
      case 'int': return formatInt(Math.round(value));
      case 'pct': return formatPct(value, value >= 10 ? 0 : 1);
      case 'sec': return formatSec(value);
      case 'min': return `${Math.max(1, Math.round(value))}m`;
      default: return String(value);
    }
  };

  const readBaseline = (cfg) => {
    // Initialize "current" from baseline with a small random jitter to feel alive
    return cfg.baseline + rnd(-1, 1);
  };

  const initStateFromConfig = () => {
    const current = {};
    const { hospital, patient } = CONFIG.kpis;

    current.hospital = {};
    for (const key in hospital) {
      const c = hospital[key];
      current.hospital[key] = readBaseline(c);
    }

    current.patient = {};
    for (const key in patient) {
      const c = patient[key];
      current.patient[key] = readBaseline(c);
    }

    return current;
  };

  const nextFrame = (prevState) => {
    const next = { hospital: {}, patient: {} };

    // Progress hospital KPIs
    for (const key in CONFIG.kpis.hospital) {
      const c = CONFIG.kpis.hospital[key];
      next.hospital[key] = stepValue(prevState.hospital[key], c.drift, c.bounds);
    }

    // Progress patient KPIs
    for (const key in CONFIG.kpis.patient) {
      const c = CONFIG.kpis.patient[key];
      next.patient[key] = stepValue(prevState.patient[key], c.drift, c.bounds);
    }

    return next;
  };

  const updateDOMForKPI = (cfg, currentVal, prevVal) => {
    if (!cfg.id) return; // Some KPIs are broadcast-only (not shown in DOM)
    const node = DOC.getElementById(cfg.id);
    if (!node) return;

    // Write main value
    node.textContent = formatByType(cfg.type, currentVal);

    // Delta beside metric label
    if (cfg.deltaId) {
      const deltaEl = DOC.getElementById(cfg.deltaId);
      if (deltaEl) {
        const delta = computeDeltaPct(prevVal, currentVal, !!cfg.invertGood);
        applyDeltaBadge(deltaEl, delta);
      }
    }
  };

  const broadcast = (payload) => {
    // Payload consumers: drawer, narrative, charts, etc.
    DOC.dispatchEvent(new CustomEvent('hf:kpiUpdate', { detail: payload }));
  };

  // ------------------------ Engine Lifecycle ------------------------
  const tick = () => {
    if (!CONFIG.enabled) return;

    DOC.dispatchEvent(new CustomEvent('hf:refreshStart'));

    const prev = STATE.snapshot || STATE.lastPayload;
    const next = nextFrame(prev || STATE.lastPayload);
    const payload = {
      ts: Date.now(),
      hospital: { ...next.hospital },
      patient: { ...next.patient }
    };

    // Update DOM metrics that exist on current page
    // Hospital
    for (const k in CONFIG.kpis.hospital) {
      const cfg = CONFIG.kpis.hospital[k];
      const prevVal = prev ? prev.hospital[k] : null;
      updateDOMForKPI(cfg, next.hospital[k], prevVal);
    }
    // Patient
    for (const k in CONFIG.kpis.patient) {
      const cfg = CONFIG.kpis.patient[k];
      const prevVal = prev ? prev.patient[k] : null;
      updateDOMForKPI(cfg, next.patient[k], prevVal);
    }

    STATE.lastPayload = payload;
    broadcast(payload);

    DOC.dispatchEvent(new CustomEvent('hf:refreshComplete', { detail: { ts: payload.ts } }));
    // Keep the previous frame to compute deltas
    STATE.snapshot = next;
  };

  const start = () => {
    stop();
    if (!CONFIG.enabled) return;
    // Seed if first run
    if (!STATE.lastPayload) {
      const init = initStateFromConfig();
      STATE.lastPayload = { ts: Date.now(), ...init };
      STATE.snapshot = init;
      // Initial DOM write
      for (const group of ['hospital', 'patient']) {
        for (const k in CONFIG.kpis[group]) {
          const cfg = CONFIG.kpis[group][k];
          updateDOMForKPI(cfg, init[group][k], null);
        }
      }
      broadcast(STATE.lastPayload);
    }
    // Begin interval
    STATE.timer = setInterval(tick, STATE.speedMs);
  };

  const stop = () => {
    if (STATE.timer) clearInterval(STATE.timer);
    STATE.timer = null;
  };

  // Pause on hidden tab to save cycles
  const handleVisibility = () => {
    const isVisible = !DOC.hidden;
    STATE.visible = isVisible;
    if (isVisible) start();
    else stop();
  };

  // ------------------------ Public API ------------------------
  const API = {
    /** Change refresh speed: accepts ‘1’ (fast 5s), ‘2’ (15s), ‘3’ (30s) or a custom ms */
    setSpeed(input) {
      let ms = 15000;
      if (typeof input === 'number') ms = input;
      else {
        // slider positions -> ms
        if (String(input) === '1') ms = 5000;
        else if (String(input) === '3') ms = 30000;
      }
      ms = clamp(ms, CONFIG.minSpeedMs, CONFIG.maxSpeedMs);
      STATE.speedMs = ms;
      // restart timer with new speed
      if (STATE.visible && CONFIG.enabled) start();
      return ms;
    },
    /** Enable/disable engine */
    setEnabled(flag) {
      CONFIG.enabled = !!flag;
      if (!CONFIG.enabled) stop(); else start();
      return CONFIG.enabled;
    },
    /** Soft disable requested by the user */
    disable() { return this.setEnabled(false); },
    enable() { return this.setEnabled(true); },
    /** Force a single refresh now */
    refreshNow() { tick(); },
    /** Read the last payload */
    getSnapshot() { return STATE.lastPayload; },
    /** Update a KPI baseline at runtime (e.g., when wiring to a real API) */
    setBaseline(group, key, value) {
      const cfg = CONFIG.kpis[group]?.[key];
      if (!cfg) return false;
      cfg.baseline = Number(value) || cfg.baseline;
      // nudge current state immediately
      if (STATE.lastPayload?.[group]?.[key] != null) {
        STATE.lastPayload[group][key] = cfg.baseline;
      }
      return true;
    }
  };

  // Expose API
  WIN.HealthFloKPI = API;

  // ------------------------ Boot ------------------------
  // Respect prior user preference (if someone disabled it before)
  const savedPref = WIN.localStorage.getItem('hf-kpi-enabled');
  if (savedPref !== null) {
    CONFIG.enabled = savedPref === 'true';
  }

  // Start once DOM is ready; attach visibility listener
  DOC.addEventListener('visibilitychange', handleVisibility);
  if (DOC.readyState === 'loading') {
    DOC.addEventListener('DOMContentLoaded', () => {
      if (CONFIG.enabled) start();
    });
  } else {
    if (CONFIG.enabled) start();
  }

  // Listen for external preference changes (optional)
  DOC.addEventListener('hf:kpiSetEnabled', (e) => {
    const { enabled } = e.detail || {};
    API.setEnabled(!!enabled);
    try { WIN.localStorage.setItem('hf-kpi-enabled', String(!!enabled)); } catch {}
  });

  DOC.addEventListener('hf:kpiSetSpeed', (e) => {
    const { speed } = e.detail || {};
    API.setSpeed(speed);
  });

})();
