/*!
 * HealthFlo KPI Engine (Simulated) — v2.3 compact
 * - Zero deps, IIFE
 * - Events: 'hf:kpiUpdate', 'hf:refreshStart', 'hf:refreshComplete'
 * - rAF-batched DOM writes; visibility & pagehide throttling
 * - Reduced-motion: slower cadence, no number “ticking”
 * - Public API: window.HealthFloKPI (setSpeed, setEnabled/enable/disable,
 *              refreshNow, getSnapshot, setBaseline, setBounds, setDrift, getConfig)
 */

(() => {
  const DOC = document;
  const WIN = window;
  const prefersReduced = WIN.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

  /* ------------------------ Utilities ------------------------ */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const pct = (num, denom) => (denom === 0 ? 0 : (num / denom) * 100);
  const toNumber = (v, fb=0) => Number.isFinite(+v) ? +v : fb;

  const formatInt = (n) => {
    try { return Math.round(n).toLocaleString('en-IN'); }
    catch { return String(Math.round(n)); }
  };
  const formatPct = (n, digits = 0) => `${(+n).toFixed(digits)}%`;
  const formatSec = (n) => `${Math.max(1, Math.round(n))}s`;
  const formatMin = (n) => `${Math.max(1, Math.round(n))}m`;

  // Badge helper: compact delta beside KPI text
  const applyDeltaBadge = (el, delta) => {
    if (!el) return;
    const isUp = delta > 0, isDown = delta < 0;
    el.classList.remove('hf-delta-up', 'hf-delta-down', 'hf-delta-stable');
    el.classList.add(isUp ? 'hf-delta-up' : isDown ? 'hf-delta-down' : 'hf-delta-stable');
    const mag = Math.abs(delta);
    el.textContent = (isUp ? '▲ +' : isDown ? '▼ ' : '• ')
      + (mag >= 1 ? mag.toFixed(1) : mag.toFixed(2)) + '%';
  };

  /* ------------------------ Config ------------------------ */
  const CONFIG = {
    enabled: true,
    // default 15s, persisted, slowed if prefers-reduced
    speedMs: 15000,
    minSpeedMs: 3000,
    maxSpeedMs: 60000,
    kpis: {
      hospital: {
        admissions:   { id: 'kpi-admissions',   type: 'int', baseline: 480, drift: [ -15, 22 ], bounds: [ 380, 820 ], deltaId: 'kpi-admissions-delta' },
        approvalRate: { id: 'kpi-approval',     type: 'pct', baseline: 92,  drift: [ -1.4, 1.6 ], bounds: [ 82, 98 ],  deltaId: 'kpi-approval-delta' },
        preauthTime:  { id: 'kpi-preauth',      type: 'sec', baseline: 45,  drift: [ -6, 4 ],    bounds: [ 22, 78 ],  deltaId: 'kpi-preauth-delta', invertGood: true },
        denialRate:   { id: null,               type: 'pct', baseline: 6.2, drift: [ -1.2, 1.0 ], bounds:[ 2.5, 12.5 ], invertGood: true },
        arDays:       { id: null,               type: 'int', baseline: 51,  drift: [ -5, 4 ],     bounds:[ 38, 72 ],   invertGood: true },
      },
      patient: {
        satisfaction:     { id: 'kpi-satisfaction', type: 'pct', baseline: 86, drift: [ -2.5, 3.5 ], bounds:[ 72, 95 ], deltaId: 'kpi-satisfaction-delta' },
        waitTime:         { id: null,               type: 'min', baseline: 18, drift: [ -4, 3 ],     bounds:[ 8, 36 ],  invertGood: true },
        nps:              { id: null,               type: 'int', baseline: 62, drift: [ -5, 7 ],     bounds:[ 30, 85 ] },
        whatsappOpenRate: { id: null,               type: 'pct', baseline: 61, drift: [ -4, 5 ],     bounds:[ 40, 85 ] },
        adoptionRate:     { id: null,               type: 'pct', baseline: 54, drift: [ -3, 4.5 ],   bounds:[ 35, 82 ] },
      }
    }
  };

  // Persisted speed & enabled
  try {
    const savedEnabled = localStorage.getItem('hf-kpi-enabled');
    const savedSpeed = localStorage.getItem('hf-kpi-speed');
    if (savedEnabled != null) CONFIG.enabled = (savedEnabled === 'true');
    if (savedSpeed != null) CONFIG.speedMs = clamp(+savedSpeed || CONFIG.speedMs, CONFIG.minSpeedMs, CONFIG.maxSpeedMs);
  } catch {}

  if (prefersReduced) {
    // slow the cadence to be gentler by default
    CONFIG.speedMs = Math.max(CONFIG.speedMs, 20000);
  }

  /* ------------------------ Engine State ------------------------ */
  const STATE = {
    timer: null,
    speedMs: CONFIG.speedMs,
    visible: true,
    lastPayload: null,
    snapshot: null,
    writeQueue: [] // [{node, text}], [{badgeEl, delta}]
  };

  /* ------------------------ Core Simulation ------------------------ */
  const stepValue = (current, [minDrift, maxDrift], [minBound, maxBound]) => {
    const step = rnd(minDrift, maxDrift);
    const next = clamp(current + step, minBound, maxBound);
    return Number.isFinite(next) ? next : current;
  };

  const computeDeltaPct = (prev, current, invertGood = false) => {
    if (!(Number.isFinite(prev) && Number.isFinite(current))) return 0;
    const change = pct(current - prev, Math.abs(prev));
    return invertGood ? -change : change;
  };

  const formatByType = (type, value) => {
    switch (type) {
      case 'int': return formatInt(value);
      case 'pct': return formatPct(value, value >= 10 ? 0 : 1);
      case 'sec': return formatSec(value);
      case 'min': return formatMin(value);
      default: return String(value);
    }
  };

  const readBaseline = (cfg) => toNumber(cfg.baseline, 0) + rnd(-1, 1);

  const initStateFromConfig = () => {
    const current = { hospital: {}, patient: {} };
    for (const key in CONFIG.kpis.hospital) current.hospital[key] = readBaseline(CONFIG.kpis.hospital[key]);
    for (const key in CONFIG.kpis.patient)  current.patient[key]  = readBaseline(CONFIG.kpis.patient[key]);
    return current;
  };

  const nextFrame = (prev) => {
    const next = { hospital: {}, patient: {} };
    for (const k in CONFIG.kpis.hospital) {
      const c = CONFIG.kpis.hospital[k];
      next.hospital[k] = stepValue(prev.hospital[k], c.drift, c.bounds);
    }
    for (const k in CONFIG.kpis.patient) {
      const c = CONFIG.kpis.patient[k];
      next.patient[k] = stepValue(prev.patient[k], c.drift, c.bounds);
    }
    return next;
  };

  /* ------------------------ DOM Writes (batched) ------------------------ */
  const queueWrite = (node, text) => { if (node) STATE.writeQueue.push({ node, text }); };
  const queueBadge = (el, delta) => { if (el) STATE.writeQueue.push({ badgeEl: el, delta }); };

  const flushWrites = () => {
    if (!STATE.writeQueue.length) return;
    const batch = STATE.writeQueue.splice(0);
    requestAnimationFrame(() => {
      for (const item of batch) {
        if (item.node) { item.node.textContent = item.text; }
        else if (item.badgeEl) { applyDeltaBadge(item.badgeEl, item.delta); }
      }
    });
  };

  const updateDOMForKPI = (cfg, currentVal, prevVal) => {
    if (!cfg?.id) return; // broadcast-only KPI
    const node = DOC.getElementById(cfg.id);
    if (!node) return;

    // Write main value (no animated “counting”—accessibility-friendly)
    queueWrite(node, formatByType(cfg.type, currentVal));

    // Delta beside metric label
    if (cfg.deltaId) {
      const deltaEl = DOC.getElementById(cfg.deltaId);
      if (deltaEl) {
        const delta = computeDeltaPct(prevVal, currentVal, !!cfg.invertGood);
        queueBadge(deltaEl, delta);
      }
    }
  };

  const broadcast = (payload) => {
    DOC.dispatchEvent(new CustomEvent('hf:kpiUpdate', { detail: payload }));
  };

  /* ------------------------ Tick & Loop ------------------------ */
  const tick = () => {
    if (!CONFIG.enabled) return;

    DOC.dispatchEvent(new CustomEvent('hf:refreshStart'));

    const prev = STATE.snapshot || STATE.lastPayload;
    const base = prev || STATE.lastPayload || { hospital: initStateFromConfig().hospital, patient: initStateFromConfig().patient };
    const next = nextFrame(base);

    const payload = { ts: Date.now(), hospital: { ...next.hospital }, patient: { ...next.patient } };

    // DOM updates (queued)
    for (const k in CONFIG.kpis.hospital) {
      const cfg = CONFIG.kpis.hospital[k];
      const prevVal = prev?.hospital?.[k] ?? null;
      updateDOMForKPI(cfg, next.hospital[k], prevVal);
    }
    for (const k in CONFIG.kpis.patient) {
      const cfg = CONFIG.kpis.patient[k];
      const prevVal = prev?.patient?.[k] ?? null;
      updateDOMForKPI(cfg, next.patient[k], prevVal);
    }
    flushWrites();

    STATE.lastPayload = payload;
    DOC.dispatchEvent(new CustomEvent('hf:refreshComplete', { detail: { ts: payload.ts } }));
    broadcast(payload);
    STATE.snapshot = next;
  };

  const start = () => {
    stop();
    if (!CONFIG.enabled) return;
    // Seed first run
    if (!STATE.lastPayload) {
      const init = initStateFromConfig();
      STATE.lastPayload = { ts: Date.now(), ...init };
      STATE.snapshot = init;
      // Initial DOM paint
      for (const g of ['hospital', 'patient']) {
        for (const k in CONFIG.kpis[g]) {
          const cfg = CONFIG.kpis[g][k];
          updateDOMForKPI(cfg, init[g][k], null);
        }
      }
      flushWrites();
      broadcast(STATE.lastPayload);
    }
    STATE.timer = setInterval(tick, STATE.speedMs);
  };

  const stop = () => { if (STATE.timer) clearInterval(STATE.timer); STATE.timer = null; };

  /* ------------------------ Visibility & Lifecycle ------------------------ */
  const handleVisibility = () => {
    STATE.visible = !DOC.hidden;
    if (STATE.visible) start(); else stop();
  };
  const handlePageHide = () => stop();
  const handlePageShow = () => { if (CONFIG.enabled) start(); };

  DOC.addEventListener('visibilitychange', handleVisibility, { passive: true });
  WIN.addEventListener('pagehide', handlePageHide, { passive: true });
  WIN.addEventListener('pageshow', handlePageShow, { passive: true });

  if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', () => { if (CONFIG.enabled) start(); });
  else if (CONFIG.enabled) start();

  /* ------------------------ Public API ------------------------ */
  const API = {
    /** Change refresh speed: accepts 1 (5s), 2 (15s), 3 (30s) or a custom ms */
    setSpeed(input) {
      let ms;
      if (typeof input === 'number') ms = input;
      else if (String(input) === '1') ms = 5000;
      else if (String(input) === '3') ms = 30000;
      else ms = 15000;

      ms = clamp(ms, CONFIG.minSpeedMs, CONFIG.maxSpeedMs);
      STATE.speedMs = ms;
      CONFIG.speedMs = ms;
      try { localStorage.setItem('hf-kpi-speed', String(ms)); } catch {}
      if (STATE.visible && CONFIG.enabled) start(); // reschedule
      DOC.dispatchEvent(new CustomEvent('hf:kpiSpeedChanged', { detail: { ms } }));
      return ms;
    },
    /** Enable/disable engine */
    setEnabled(flag) {
      CONFIG.enabled = !!flag;
      try { localStorage.setItem('hf-kpi-enabled', String(CONFIG.enabled)); } catch {}
      if (!CONFIG.enabled) stop(); else start();
      DOC.dispatchEvent(new CustomEvent('hf:kpiToggled', { detail: { enabled: CONFIG.enabled } }));
      return CONFIG.enabled;
    },
    disable() { return this.setEnabled(false); },
    enable() { return this.setEnabled(true); },
    /** Force a single refresh now */
    refreshNow() { tick(); },
    /** Read the last payload */
    getSnapshot() { return STATE.lastPayload; },
    /** Update a KPI baseline at runtime (e.g., when wiring to a real API) */
    setBaseline(group, key, value) {
      const cfg = CONFIG.kpis[group]?.[key]; if (!cfg) return false;
      cfg.baseline = toNumber(value, cfg.baseline);
      if (STATE.lastPayload?.[group]?.[key] != null) STATE.lastPayload[group][key] = cfg.baseline;
      return true;
    },
    /** Optionally adjust bounds/drift on the fly */
    setBounds(group, key, bounds) {
      const cfg = CONFIG.kpis[group]?.[key]; if (!cfg || !Array.isArray(bounds) || bounds.length !== 2) return false;
      cfg.bounds = [toNumber(bounds[0], cfg.bounds[0]), toNumber(bounds[1], cfg.bounds[1])];
      return true;
    },
    setDrift(group, key, drift) {
      const cfg = CONFIG.kpis[group]?.[key]; if (!cfg || !Array.isArray(drift) || drift.length !== 2) return false;
      cfg.drift = [toNumber(drift[0], cfg.drift[0]), toNumber(drift[1], cfg.drift[1])];
      return true;
    },
    /** Inspect current config (read-only) */
    getConfig() { return JSON.parse(JSON.stringify(CONFIG)); }
  };

  // Expose API
  WIN.HealthFloKPI = API;

  /* ------------------------ External Controls ------------------------ */
  DOC.addEventListener('hf:kpiSetEnabled', (e) => {
    const { enabled } = e.detail || {};
    API.setEnabled(!!enabled);
  });
  DOC.addEventListener('hf:kpiSetSpeed', (e) => {
    const { speed } = e.detail || {};
    API.setSpeed(speed);
  });

  // Optional: listen to your drawer slider (1/2/3) if present
  const speedSlider = DOC.getElementById('hf-refresh-speed');
  const speedLabel  = DOC.getElementById('hf-refresh-label');
  if (speedSlider) {
    // If slider uses 3000..20000, map to ms directly; if 1/2/3, route via API logic
    const isDiscrete = speedSlider.min === '1' && speedSlider.max === '3';
    const setFromSlider = (val) => {
      const ms = isDiscrete ? API.setSpeed(val) : API.setSpeed(+val);
      if (speedLabel) speedLabel.textContent = `${Math.round(ms/1000)}s`;
    };
    // Initialize from persisted
    setFromSlider(STATE.speedMs);
    speedSlider.addEventListener('input', (e) => setFromSlider(e.target.value));
  }
})();
