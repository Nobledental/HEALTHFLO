/*
 * HealthFlo AI Insights Engine – Combined (Part 1A + 1B)
 * ------------------------------------------------------
 * - Config, KPI simulation, delta calc, custom events
 * - Auto-refresh, sparkline history
 * - Auto-open drawer when user scrolls near insights
 */

(function () {
  "use strict";

  /* ==================== CONFIG ==================== */
  const CONFIG = {
    refreshInterval: 7000, // 7s default; user can change with slider in drawer
    deltaSensitivity: 5,   // % change considered significant
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

  /* ==================== STATE ==================== */
  const KPI_STATE = [];
  const initKPIState = () => {
    const now = new Date().toISOString();
    [
      { group: "hospital", items: CONFIG.hospitalKPIs },
      { group: "patient", items: CONFIG.patientKPIs },
    ].forEach(({ group, items }) => {
      items.forEach((kpi) => {
        const initialValue = generateRandomValue(kpi.range);
        KPI_STATE.push({
          category: group,
          name: kpi.name,
          unit: kpi.unit,
          value: initialValue,
          previous: initialValue,
          delta: 0,
          trend: "stable",
          sparkline: Array(CONFIG.sparklinePoints).fill(initialValue),
          timestamp: now,
        });
      });
    });
  };

  const generateRandomValue = ([min, max]) => {
    const base = Math.random() * (max - min) + min;
    const volatility = (Math.random() - 0.5) * (max - min) * 0.05;
    return parseFloat((base + volatility).toFixed(1));
  };

  const calculateDelta = (previous, current) => {
    const delta = ((current - previous) / previous) * 100;
    let trend = "stable";
    if (delta > CONFIG.deltaSensitivity) trend = "up";
    else if (delta < -CONFIG.deltaSensitivity) trend = "down";
    return { delta: parseFloat(delta.toFixed(1)), trend };
  };

  const getRangeForKPI = (category, name) => {
    const list = category === "hospital" ? CONFIG.hospitalKPIs : CONFIG.patientKPIs;
    const match = list.find((k) => k.name === name);
    return match ? match.range : [0, 100];
  };

  const dispatchKPIUpdate = (kpi) => {
    window.dispatchEvent(new CustomEvent("hf:kpiUpdate", {
      detail: {
        category: kpi.category,
        name: kpi.name,
        unit: kpi.unit,
        value: kpi.value,
        previous: kpi.previous,
        delta: kpi.delta,
        trend: kpi.trend,
        sparkline: [...kpi.sparkline],
        timestamp: kpi.timestamp,
      },
    }));
  };

  const updateKPIs = () => {
    const now = new Date().toISOString();
    KPI_STATE.forEach((kpi) => {
      const newValue = generateRandomValue(getRangeForKPI(kpi.category, kpi.name));
      const { delta, trend } = calculateDelta(kpi.value, newValue);

      kpi.sparkline.push(newValue);
      if (kpi.sparkline.length > CONFIG.sparklinePoints) kpi.sparkline.shift();

      kpi.previous = kpi.value;
      kpi.value = newValue;
      kpi.delta = delta;
      kpi.trend = trend;
      kpi.timestamp = now;

      dispatchKPIUpdate(kpi);
    });
  };

  /* ==================== LOOP & BOOT ==================== */
  const generateInitialSparkline = (value, points) => {
    const spark = []; let v = value;
    for (let i = 0; i < points; i++) { v += (Math.random() - 0.5) * 2; spark.push(parseFloat(v.toFixed(1))); }
    return spark;
  };

  const startRefreshCycle = () => {
    setInterval(() => {
      window.dispatchEvent(new CustomEvent("hf:refreshStart", { detail: { time: Date.now() } }));
      updateKPIs();
      window.dispatchEvent(new CustomEvent("hf:refreshComplete", { detail: { time: Date.now() } }));
    }, CONFIG.refreshInterval);
  };

  const setupScrollTrigger = () => {
    let started = false;
    const openDrawerOnce = () => {
      const drawerEl = document.querySelector('.hf-ai-insights__drawer');
      const host = document.querySelector('.hf-ai-insights');
      if (!drawerEl || !host) return;
      host.classList.add('open');
      // animate in
      if (window.gsap) {
        gsap.to(drawerEl, { right: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.hf-insight-card', { opacity: 0, y: 30, duration: 0.7, stagger: 0.08, ease: 'power2.out', delay: 0.15 });
      } else {
        drawerEl.style.right = '0';
      }
    };

    const startIfNeeded = () => {
      if (started) return;
      if (window.scrollY > 300) {
        started = true;
        console.info("[HealthFloInsights] KPI simulation started 🚀");
        startRefreshCycle();
        openDrawerOnce();
        window.removeEventListener("scroll", startIfNeeded);
      }
    };
    window.addEventListener("scroll", startIfNeeded, { passive: true });
  };

  window.addEventListener("hf:forceRefresh", () => updateKPIs());
  window.addEventListener("hf:getKPIState", () => {
    window.dispatchEvent(new CustomEvent("hf:kpiState", { detail: KPI_STATE || [] }));
  });

  const boot = () => {
    initKPIState();

    // seed sparkline and dispatch initial snapshot
    KPI_STATE.forEach((kpi) => {
      if (!kpi.sparkline || kpi.sparkline.length === 0) {
        kpi.sparkline = generateInitialSparkline(kpi.value, CONFIG.sparklinePoints);
      }
      dispatchKPIUpdate(kpi);
    });

    // speed slider sync
    const speedSlider = document.getElementById('hf-refresh-speed');
    if (speedSlider) {
      const saved = parseInt(localStorage.getItem('hf-refresh-speed'), 10);
      if (saved) {
        CONFIG.refreshInterval = saved;
        speedSlider.value = saved <= 5000 ? 1 : saved <= 15000 ? 2 : 3;
      }
      speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        CONFIG.refreshInterval = (val === 1) ? 5000 : (val === 2) ? 15000 : 30000;
        localStorage.setItem('hf-refresh-speed', CONFIG.refreshInterval);
        window.dispatchEvent(new CustomEvent('hf:refreshSpeedChanged', { detail: CONFIG.refreshInterval }));
      });
    }

    setupScrollTrigger();

    console.info("[HealthFloInsights] Engine initialized ✅ – waiting for scroll to start simulation");
  };

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
