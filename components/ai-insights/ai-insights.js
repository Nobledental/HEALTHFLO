/*
 * HealthFlo AI Insights Engine — Compact + Robust (v1.2)
 * - Single interval (auto-reschedules on speed change)
 * - Visibility throttling + reduced-motion respect
 * - IntersectionObserver auto-open (no layout impact)
 * - Backward-compatible events + small public API
 * - Defensive guards; no globals leaked
 */

(function () {
  "use strict";

  /** ========= CONFIG (safe defaults; can be patched via API) ========= */
  const CONFIG = {
    refreshInterval: 7000,     // ms
    deltaSensitivity: 5,       // %
    sparklinePoints: 10,
    narrativeTone: "advisory-strategic",
    colorPalette: { up: "#16a34a", down: "#dc2626", stable: "#64748b" },
    hospitalKPIs: [
      { name: "Admissions", unit: "patients", range: [420, 550] },
      { name: "Occupancy Rate", unit: "%", range: [78, 96] },
      { name: "Claim Approval Rate", unit: "%", range: [88, 98] },
      { name: "Denial Recovery Rate", unit: "%", range: [84, 97] },
      { name: "Avg Pre-Auth Time", unit: "s", range: [38, 52] }
    ],
    patientKPIs: [
      { name: "Satisfaction Score", unit: "%", range: [82, 96] },
      { name: "Readmission Rate", unit: "%", range: [4, 11] },
      { name: "Avg Wait Time", unit: "min", range: [18, 35] },
      { name: "Net Promoter Score", unit: "NPS", range: [70, 92] },
      { name: "Engagement Rate", unit: "%", range: [72, 94] }
    ]
  };

  /** ========= ENV & GUARDS ========= */
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s));

  /** ========= STATE ========= */
  const KPI_STATE = [];
  let intervalId = null;
  let started = false;
  let io = null;

  /** ========= HELPERS ========= */
  const randIn = ([min, max]) => {
    const base = Math.random() * (max - min) + min;
    const vol = (Math.random() - 0.5) * (max - min) * 0.05;
    return +((base + vol).toFixed(1));
  };

  const deltaInfo = (prev, cur) => {
    const d = prev === 0 ? 0 : ((cur - prev) / prev) * 100;
    const pct = +d.toFixed(1);
    return {
      delta: pct,
      trend: pct > CONFIG.deltaSensitivity ? "up" : (pct < -CONFIG.deltaSensitivity ? "down" : "stable")
    };
  };

  const rangeFor = (cat, name) => {
    const list = cat === "hospital" ? CONFIG.hospitalKPIs : CONFIG.patientKPIs;
    return (list.find(k => k.name === name) || {}).range || [0, 100];
  };

  const emit = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));

  /** ========= INITIALIZE KPI STATE ========= */
  const initKPIState = () => {
    const now = new Date().toISOString();
    const seed = (group, items) => items.forEach(kpi => {
      const v = randIn(kpi.range);
      KPI_STATE.push({
        category: group, name: kpi.name, unit: kpi.unit,
        value: v, previous: v, delta: 0, trend: "stable",
        sparkline: Array(CONFIG.sparklinePoints).fill(v),
        timestamp: now
      });
    });
    seed("hospital", CONFIG.hospitalKPIs);
    seed("patient", CONFIG.patientKPIs);
  };

  const seedSparkline = (value, n) => {
    const arr = [];
    let v = value;
    for (let i = 0; i < n; i++) { v += (Math.random() - 0.5) * 2; arr.push(+v.toFixed(1)); }
    return arr;
  };

  /** ========= CORE UPDATE ========= */
  const tick = () => {
    const now = new Date().toISOString();
    emit("hf:refreshStart", { time: Date.now() });

    KPI_STATE.forEach(kpi => {
      const nextVal = randIn(rangeFor(kpi.category, kpi.name));
      const { delta, trend } = deltaInfo(kpi.value, nextVal);

      kpi.sparkline.push(nextVal);
      if (kpi.sparkline.length > CONFIG.sparklinePoints) kpi.sparkline.shift();

      kpi.previous = kpi.value;
      kpi.value = nextVal;
      kpi.delta = delta;
      kpi.trend = trend;
      kpi.timestamp = now;

      emit("hf:kpiUpdate", {
        category: kpi.category,
        name: kpi.name,
        unit: kpi.unit,
        value: kpi.value,
        previous: kpi.previous,
        delta: kpi.delta,
        trend: kpi.trend,
        sparkline: [...kpi.sparkline],
        timestamp: kpi.timestamp
      });
    });

    emit("hf:refreshComplete", { time: Date.now() });
  };

  /** ========= INTERVAL CONTROL ========= */
  const startLoop = () => {
    stopLoop();
    intervalId = setInterval(tick, CONFIG.refreshInterval);
  };
  const stopLoop = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  };

  /** ========= AUTO OPEN (OVERLAY-ONLY) =========
   * Uses IntersectionObserver against the *drawer trigger* or the
   * drawer itself — whichever appears in DOM. No layout occupied.
   */
  const autoOpenOnce = () => {
    const host = $(".hf-ai-insights");
    const drawer = $(".hf-ai-insights__drawer");
    if (!host || !drawer) return;

    host.classList.add("open");
    if (window.gsap && !prefersReduced) {
      gsap.to(drawer, { right: 0, duration: 0.5, ease: "power3.out" });
      gsap.from(".hf-insight-card", { opacity: 0, y: 24, duration: 0.55, stagger: 0.06, ease: "power2.out", delay: 0.1 });
    } else {
      drawer.style.right = "0";
    }
  };

  const setupObserverAutoOpen = () => {
    if (io) return;
    const target = $(".hf-ai-insights__trigger") || $(".hf-ai-insights__drawer");
    if (!target) return;

    io = new IntersectionObserver((entries) => {
      if (!entries[0] || !entries[0].isIntersecting) return;
      if (!started) {
        started = true;
        startLoop();
        autoOpenOnce();
      }
      io.disconnect();
      io = null;
    }, { rootMargin: "200px 0px -20% 0px", threshold: 0 });
    io.observe(target);
  };

  /** ========= SPEED SLIDER (non-intrusive) =========
   * Accepts either absolute ms (min 3000..max 20000) OR 1/2/3 discrete.
   * Reflects back to label if present.
   */
  const bindSpeedSlider = () => {
    const slider = document.getElementById("hf-refresh-speed");
    const label = document.getElementById("hf-refresh-label");
    if (!slider) return;

    // Restore saved interval
    const saved = parseInt(localStorage.getItem("hf-refresh-speed"), 10);
    if (!Number.isNaN(saved)) CONFIG.refreshInterval = saved;

    // If slider is discrete (1/2/3), map to ms; otherwise use raw value
    const mapToMs = (val) => {
      const v = Number(val);
      if (slider.step && Number(slider.step) >= 1 && Number(slider.max) <= 5) {
        return v === 1 ? 5000 : v === 2 ? 15000 : 30000;
      }
      return clamp(v, 3000, 20000);
    };
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    // Initialize UI
    const initVal = slider.value ? mapToMs(slider.value) : CONFIG.refreshInterval;
    CONFIG.refreshInterval = initVal;
    if (label) label.textContent = `${Math.round(CONFIG.refreshInterval / 1000)}s`;

    slider.addEventListener("input", (e) => {
      CONFIG.refreshInterval = mapToMs(e.target.value);
      localStorage.setItem("hf-refresh-speed", CONFIG.refreshInterval);
      if (label) label.textContent = `${Math.round(CONFIG.refreshInterval / 1000)}s`;
      if (intervalId) startLoop(); // reschedule
      emit("hf:refreshSpeedChanged", CONFIG.refreshInterval);
    });
  };

  /** ========= VISIBILITY THROTTLING ========= */
  const handleVisibility = () => {
    if (!started) return;
    if (document.hidden) stopLoop();
    else startLoop();
  };

  /** ========= PUBLIC API ========= */
  const API = {
    /** Force one update tick immediately */
    updateNow() { tick(); },

    /** Set refresh interval (ms) and reschedule if running */
    setRefreshInterval(ms) {
      const v = Math.max(1000, Number(ms) || CONFIG.refreshInterval);
      CONFIG.refreshInterval = v;
      localStorage.setItem("hf-refresh-speed", v);
      if (intervalId) startLoop();
      emit("hf:refreshSpeedChanged", v);
      return v;
    },

    /** Adjust delta sensitivity (%) */
    setDeltaSensitivity(pct) {
      CONFIG.deltaSensitivity = Math.max(0, Number(pct) || CONFIG.deltaSensitivity);
      return CONFIG.deltaSensitivity;
    },

    /** Pause/resume simulation loop */
    pause() { stopLoop(); emit("hf:dashboard:paused", {}); },
    resume() { if (!intervalId) startLoop(); emit("hf:dashboard:resumed", {}); },

    /** Read-only snapshot */
    getState() {
      return {
        running: !!intervalId,
        refreshInterval: CONFIG.refreshInterval,
        deltaSensitivity: CONFIG.deltaSensitivity,
        points: CONFIG.sparklinePoints,
        kpis: KPI_STATE.map(k => ({ ...k, sparkline: [...k.sparkline] }))
      };
    }
  };

  /** ========= BOOT ========= */
  const boot = () => {
    if (prefersReduced) {
      // Seed once & emit snapshot; no auto loop
      initKPIState();
      KPI_STATE.forEach(k => {
        if (!k.sparkline?.length) k.sparkline = seedSparkline(k.value, CONFIG.sparklinePoints);
        emit("hf:kpiUpdate", { ...k, sparkline: [...k.sparkline] });
      });
      console.info("[HealthFloInsights] Reduced-motion respected — live updates paused.");
      window.HealthFloInsightsEngine = API;
      return;
    }

    initKPIState();
    KPI_STATE.forEach(k => {
      if (!k.sparkline?.length) k.sparkline = seedSparkline(k.value, CONFIG.sparklinePoints);
      emit("hf:kpiUpdate", { ...k, sparkline: [...k.sparkline] });
    });

    // Speed control (non-blocking)
    bindSpeedSlider();

    // Start only when the trigger/drawer comes near viewport
    setupObserverAutoOpen();

    // Compatibility events
    window.addEventListener("hf:forceRefresh", () => tick());
    window.addEventListener("hf:getKPIState", () => emit("hf:kpiState", KPI_STATE || []));

    // Visibility throttling
    document.addEventListener("visibilitychange", handleVisibility, { passive: true });

    console.info("[HealthFloInsights] Engine initialized ✅ — waiting for observer to start simulation");
    window.HealthFloInsightsEngine = API;
  };

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
