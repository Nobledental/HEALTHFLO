/*
 * HealthFlo AI Insights Engine – Part 1A
 * --------------------------------------
 * 📊 Core config, data simulation, delta calculation, and custom event dispatcher.
 * Designed for modular integration into the HealthFlo dashboard and AI narrative systems.
 * Author: HealthFlo Engineering
 * Version: 1.0.0
 * 
 * HOW IT WORKS:
 * - Config object defines refresh intervals, KPI names, thresholds, colors, etc.
 * - A simulation engine generates realistic-but-impressive KPI values.
 * - Delta detection calculates percentage change & trend direction.
 * - Custom `hf:kpiUpdate` events are dispatched every cycle with rich payloads.
 */

(function () {
  "use strict";

  /* ============================================================
     🔧 CONFIGURATION
     ============================================================ */
  const CONFIG = {
    refreshInterval: 7000, // ⏱ Refresh every 7 seconds
    deltaSensitivity: 5,   // 📊 % change considered significant
    sparklinePoints: 10,   // 📈 Number of historical points stored for charts
    narrativeTone: "advisory-strategic",
    colorPalette: {
      up: "#16a34a",      // Emerald green
      down: "#dc2626",    // Red
      stable: "#64748b",  // Muted slate
    },
    hospitalKPIs: [
      { name: "Admissions", unit: "patients", range: [420, 550] },
      { name: "Occupancy Rate", unit: "%", range: [78, 96] },
      { name: "Claim Approval Rate", unit: "%", range: [88, 98] },
      { name: "Denial Recovery Rate", unit: "%", range: [84, 97] },
      { name: "Avg Pre-Auth Time", unit: "s", range: [38, 52] },
    ],
    patientKPIs: [
      { name: "Satisfaction Score", unit: "%", range: [82, 96] },
      { name: "Readmission Rate", unit: "%", range: [4, 11] },
      { name: "Avg Wait Time", unit: "min", range: [18, 35] },
      { name: "Net Promoter Score", unit: "NPS", range: [70, 92] },
      { name: "Engagement Rate", unit: "%", range: [72, 94] },
    ],
  };

  /* ============================================================
     🧠 KPI REGISTRY
     - Internal state storing latest and historical KPI values.
     ============================================================ */
  const KPI_STATE = [];

  const initKPIState = () => {
    const now = new Date().toISOString();
    const categories = [
      { group: "hospital", items: CONFIG.hospitalKPIs },
      { group: "patient", items: CONFIG.patientKPIs },
    ];

    categories.forEach(({ group, items }) => {
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

  /* ============================================================
     🔢 RANDOM VALUE GENERATOR
     - Produces realistic but slightly impressive simulated values.
     ============================================================ */
  const generateRandomValue = ([min, max]) => {
    const base = Math.random() * (max - min) + min;
    // Add subtle volatility
    const volatility = (Math.random() - 0.5) * (max - min) * 0.05;
    return parseFloat((base + volatility).toFixed(1));
  };

  /* ============================================================
     📈 DELTA CALCULATION
     - Determines change %, direction, and trend status.
     ============================================================ */
  const calculateDelta = (previous, current) => {
    const delta = ((current - previous) / previous) * 100;
    let trend = "stable";
    if (delta > CONFIG.deltaSensitivity) trend = "up";
    else if (delta < -CONFIG.deltaSensitivity) trend = "down";
    return { delta: parseFloat(delta.toFixed(1)), trend };
  };

  /* ============================================================
     🔁 KPI UPDATE CYCLE
     - Generates new KPI values, updates history, computes deltas.
     ============================================================ */
  const updateKPIs = () => {
    const now = new Date().toISOString();

    KPI_STATE.forEach((kpi) => {
      const newValue = generateRandomValue(
        getRangeForKPI(kpi.category, kpi.name)
      );
      const { delta, trend } = calculateDelta(kpi.value, newValue);

      // Push new value into sparkline history
      kpi.sparkline.push(newValue);
      if (kpi.sparkline.length > CONFIG.sparklinePoints)
        kpi.sparkline.shift();

      // Update state
      kpi.previous = kpi.value;
      kpi.value = newValue;
      kpi.delta = delta;
      kpi.trend = trend;
      kpi.timestamp = now;

      // Dispatch event for each KPI
      dispatchKPIUpdate(kpi);
    });
  };

  /* ============================================================
     🧭 UTILITY – Get Range for KPI by Name
     ============================================================ */
  const getRangeForKPI = (category, name) => {
    const list =
      category === "hospital" ? CONFIG.hospitalKPIs : CONFIG.patientKPIs;
    const match = list.find((k) => k.name === name);
    return match ? match.range : [0, 100];
  };

  /* ============================================================
     📣 DISPATCHER – Emit Custom KPI Events
     ============================================================ */
  const dispatchKPIUpdate = (kpi) => {
    const event = new CustomEvent("hf:kpiUpdate", {
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
    });
    window.dispatchEvent(event);
  };

  /* ============================================================
     🚀 INITIALIZATION
     ============================================================ */
  initKPIState();

  // Expose state for debugging (optional)
  window.addEventListener("hf:debug", () => console.table(KPI_STATE));

  // Export initial state event for dashboard to load defaults
  KPI_STATE.forEach(dispatchKPIUpdate);

  // Part 1B (next) → Auto-refresh loop + sparkline generator orchestration

})();

/*
 * HealthFlo AI Insights Engine – Part 1B
 * --------------------------------------
 * 🔁 Auto-refresh loop, sparkline utilities, orchestration layer.
 * Completes the base layer of the AI KPI engine before UI + narrative modules.
 */

(function () {
  "use strict";

  /* ============================================================
     🧠 SPARKLINE UTILITY – Generate Seed History
     ============================================================ */
  const generateInitialSparkline = (value, points) => {
    // Builds a gentle slope around the initial value
    const spark = [];
    let v = value;
    for (let i = 0; i < points; i++) {
      v += (Math.random() - 0.5) * 2; // subtle variation
      spark.push(parseFloat(v.toFixed(1)));
    }
    return spark;
  };

  /* ============================================================
     🔄 AUTO-REFRESH LOOP
     - Ticks every CONFIG.refreshInterval ms.
     - Generates new KPI values, updates sparkline, dispatches events.
     ============================================================ */
  const startRefreshCycle = () => {
    setInterval(() => {
      // Custom event: refresh starting
      window.dispatchEvent(
        new CustomEvent("hf:refreshStart", { detail: { time: Date.now() } })
      );

      // Update KPIs (function from Part 1A)
      if (typeof updateKPIs === "function") {
        updateKPIs();
      } else {
        console.warn(
          "[HealthFloInsights] updateKPIs() not found. Ensure Part 1A is loaded."
        );
      }

      // Custom event: refresh complete
      window.dispatchEvent(
        new CustomEvent("hf:refreshComplete", { detail: { time: Date.now() } })
      );
    }, CONFIG.refreshInterval);
  };

  /* ============================================================
     🧭 SCROLL-TRIGGERED INITIALIZATION
     - Ensures simulation only starts when user scrolls near dashboard.
     ============================================================ */
  const setupScrollTrigger = () => {
    let started = false;
    const startIfNeeded = () => {
      if (started) return;
      if (window.scrollY > 300) {
        started = true;
        console.info("[HealthFloInsights] KPI simulation started 🚀");
        startRefreshCycle();
        window.removeEventListener("scroll", startIfNeeded);
      }
    };
    window.addEventListener("scroll", startIfNeeded, { passive: true });
  };

  /* ============================================================
     📣 ADDITIONAL EVENTS
     - Allows other modules to request state or force refresh.
     ============================================================ */
  window.addEventListener("hf:forceRefresh", () => {
    console.info("[HealthFloInsights] Manual refresh triggered 🔁");
    if (typeof updateKPIs === "function") updateKPIs();
  });

  window.addEventListener("hf:getKPIState", () => {
    window.dispatchEvent(
      new CustomEvent("hf:kpiState", { detail: KPI_STATE || [] })
    );
  });

  /* ============================================================
     🧪 DIAGNOSTICS – Useful for development & testing
     ============================================================ */
  const diagnosticLog = () => {
    console.groupCollapsed("📊 [HealthFloInsights] KPI Snapshot");
    console.table(KPI_STATE);
    console.groupEnd();
  };
  window.addEventListener("hf:log", diagnosticLog);

  /* ============================================================
     🚀 BOOT SEQUENCE
     - Seeds sparkline history
     - Registers scroll-triggered refresh
     ============================================================ */
  const boot = () => {
    if (Array.isArray(KPI_STATE)) {
      KPI_STATE.forEach((kpi) => {
        if (!kpi.sparkline || kpi.sparkline.length === 0) {
          kpi.sparkline = generateInitialSparkline(
            kpi.value,
            CONFIG.sparklinePoints
          );
        }
      });
    }

    // Dispatch initial snapshot
    KPI_STATE.forEach((kpi) => dispatchKPIUpdate(kpi));

    // Wait for scroll to start simulation
    setupScrollTrigger();

    console.info(
      "[HealthFloInsights] Engine initialized ✅ – waiting for scroll to start simulation"
    );
  };

  // Fire boot sequence on DOM ready
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);

})();
