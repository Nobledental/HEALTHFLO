/*!
 * HealthFloDashboard (Standalone, IIFE)
 * ----------------------------------------------------------
 * Purpose:
 *  - Attach compact inline SPARKLINES beside KPI numbers
 *  - Listen to KPI Engine events and keep charts in sync
 *  - Zero deps; optional GSAP count-up polish if available
 *  - Accessible labels + robust DOM auto-detection
 *
 * Works with:
 *  - window.HealthFloKPI (for grouped snapshots)
 *  - 'hf:kpiUpdate' granular events (compat layer)
 *
 * Author: HealthFlo • 2025
 */

(() => {
  const DOC = document;
  const WIN = window;
  const HAS_GSAP = typeof WIN.gsap !== 'undefined';

  // --- Settings -------------------------------------------------
  const CFG = {
    sparkWidth: 90,
    sparkHeight: 26,
    sparkPadding: 2,
    points: 24, // history length per KPI
    // premium, non-neon palette (Hybrid Tech-Luxury)
    colors: {
      lineUp: '#106d5b',     // deep emerald
      lineDown: '#475569',   // slate
      fillUp: 'rgba(16,109,91,0.18)',
      fillDown: 'rgba(71,85,105,0.18)'
    },
    // Mapping DOM -> KPI keys (fallback if dataset is missing)
    // id => { group:'hospital'|'patient', key:'approvalRate'|... }
    domMap: {
      'kpi-admissions':   { group: 'hospital', key: 'admissions', type: 'int' },
      'kpi-approval':     { group: 'hospital', key: 'approvalRate', type: 'pct', goodHigh:true },
      'kpi-preauth':      { group: 'hospital', key: 'preauthTime', type: 'sec', goodLow:true },
      'kpi-satisfaction': { group: 'patient',  key: 'satisfaction', type: 'pct', goodHigh:true }
    }
  };

  // --- Utils ----------------------------------------------------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fmtInt = (n) => Number(Math.round(n)).toLocaleString();
  const fmtPct = (n) => `${Number(n).toFixed(n >= 10 ? 0 : 1)}%`;
  const fmtSec = (n) => `${Math.max(1, Math.round(n))}s`;
  const fmtByType = (type, v) => {
    if (type === 'pct') return fmtPct(v);
    if (type === 'sec') return fmtSec(v);
    return fmtInt(v);
  };

  // --- Sparkline factory ---------------------------------------
  function createSparkline(where) {
    const w = CFG.sparkWidth, h = CFG.sparkHeight, pad = CFG.sparkPadding;
    const svg = DOC.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('class', 'hf-spark');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-hidden', 'true');

    const pathFill = DOC.createElementNS(svg.namespaceURI, 'path');
    const pathLine = DOC.createElementNS(svg.namespaceURI, 'path');
    pathFill.setAttribute('class', 'hf-spark__fill');
    pathLine.setAttribute('class', 'hf-spark__line');

    svg.appendChild(pathFill);
    svg.appendChild(pathLine);
    where.appendChild(svg);

    const update = (values = [], trend = 'stable') => {
      if (!values.length) return;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;

      const step = (w - pad * 2) / (values.length - 1);
      const points = values.map((v, i) => {
        const x = pad + i * step;
        // Invert Y so higher values go up
        const y = pad + (h - pad * 2) * (1 - (v - min) / span);
        return [x, y];
      });

      // Build line
      const d = points.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
      pathLine.setAttribute('d', d);

      // Build fill down to bottom
      const fillD = d + ` L ${points[points.length - 1][0]} ${h - pad} L ${points[0][0]} ${h - pad} Z`;
      pathFill.setAttribute('d', fillD);

      // Colors by trend
      const up = trend === 'up';
      pathLine.setAttribute('stroke', up ? CFG.colors.lineUp : CFG.colors.lineDown);
      pathFill.setAttribute('fill',   up ? CFG.colors.fillUp : CFG.colors.fillDown);

      if (HAS_GSAP) {
        WIN.gsap.fromTo(pathLine, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
        WIN.gsap.fromTo(pathFill, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
      }
    };

    return { svg, update };
  }

  // --- Registry & DOM attachment --------------------------------
  const REG = new Map(); // id -> {hist:[], update(), type, labelEl}
  const ensureAttachment = (numEl, meta) => {
    const id = numEl.id || meta?.id;
    if (!id || REG.has(id)) return;

    // Create a wrapper to place sparkline beside the number
    let wrapper = numEl.closest('.hf-kpi__value');
    if (!wrapper) {
      // Create gently if structure not present
      wrapper = DOC.createElement('span');
      wrapper.className = 'hf-kpi__value';
      numEl.after(wrapper);
      wrapper.appendChild(numEl);
    }

    // Sparkline container (right side of number)
    const sparkHost = DOC.createElement('span');
    sparkHost.className = 'hf-kpi__spark';
    wrapper.appendChild(sparkHost);

    const spark = createSparkline(sparkHost);

    // Optional label area for aria-live updates
    const live = DOC.createElement('span');
    live.className = 'hf-kpi__live sr-only';
    live.setAttribute('aria-live', 'polite');
    wrapper.appendChild(live);

    REG.set(id, {
      hist: [],
      update: spark.update,
      type: meta?.type || 'int',
      group: meta?.group || 'hospital',
      key: meta?.key,
      liveEl: live,
      numEl
    });
  };

  // --- Ingest from grouped snapshot (HealthFloKPI) ---------------
  const readFromEngine = () => {
    const snap = WIN.HealthFloKPI?.getSnapshot?.();
    if (!snap) return null;
    return {
      hospital: { ...snap.hospital },
      patient:  { ...snap.patient }
    };
  };

  // --- Apply a value into registry + DOM ------------------------
  const pushValue = (id, v, trend) => {
    const item = REG.get(id);
    if (!item) return;

    // Build history
    if (typeof v === 'number' && isFinite(v)) {
      item.hist.push(v);
      if (item.hist.length > CFG.points) item.hist.shift();
    }

    // Update sparkline
    item.update(item.hist, trend);

    // Optional: animate the number if we control it (we usually let KPI Engine write the value)
    // Here, we only do a gentle opacity pop for polish.
    if (HAS_GSAP && item.numEl) {
      WIN.gsap.fromTo(item.numEl, { opacity: 0.6 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
    }

    // Update aria-live
    if (item.liveEl) {
      item.liveEl.textContent = `Updated ${id.replace('kpi-','').replace('-',' ')} ${fmtByType(item.type, v)} (${trend})`;
    }
  };

  // --- Compute trend from last two samples ----------------------
  const trendFromHist = (arr, goodLow = false, goodHigh = false) => {
    if (!arr || arr.length < 2) return 'stable';
    const a = arr[arr.length - 2], b = arr[arr.length - 1];
    if (!isFinite(a) || !isFinite(b)) return 'stable';
    const rising = b > a;
    // If lower is better, invert "up" semantics
    if (goodLow) return rising ? 'down' : (b < a ? 'up' : 'stable');
    if (goodHigh) return rising ? 'up' : (b < a ? 'down' : 'stable');
    // neutral
    return rising ? 'up' : (b < a ? 'down' : 'stable');
  };

  // --- Wire DOM (auto-detect KPIs) ------------------------------
  const scan = () => {
    // 1) Prefer explicit mapping via CFG.domMap
    Object.entries(CFG.domMap).forEach(([id, meta]) => {
      const el = DOC.getElementById(id);
      if (el) ensureAttachment(el, { id, ...meta });
    });

    // 2) Also attach to any element with data-kpi-group + data-kpi-key
    DOC.querySelectorAll('[data-kpi-group][data-kpi-key]').forEach((el) => {
      const id = el.id || `${el.getAttribute('data-kpi-group')}-${el.getAttribute('data-kpi-key')}`;
      ensureAttachment(el, {
        id,
        group: el.getAttribute('data-kpi-group'),
        key: el.getAttribute('data-kpi-key'),
        type: el.getAttribute('data-kpi-type') || 'int'
      });
    });
  };

  // --- Handle granular hf:kpiUpdate events ----------------------
  const nameKey = (name) => String(name || '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/(rate|score|time)$/,'');
  const granularIngest = (detail) => {
    // Try to map event into a known DOM id
    const g = (detail.category === 'patient') ? 'patient' : 'hospital';
    const keyNorm = nameKey(detail.name);

    for (const [id, meta] of Object.entries(CFG.domMap)) {
      const compare = String(meta.key || '').toLowerCase();
      if (meta.group === g && keyNorm.includes(compare.toLowerCase())) {
        const regItem = REG.get(id);
        if (regItem) {
          regItem.hist.push(detail.value);
          if (regItem.hist.length > CFG.points) regItem.hist.shift();
          const trend = trendFromHist(regItem.hist, !!meta.goodLow, !!meta.goodHigh);
          pushValue(id, detail.value, trend);
        }
      }
    }
  };

  // --- Periodic sync from grouped snapshot ----------------------
  const syncFromSnapshot = () => {
    const s = readFromEngine();
    if (!s) return;

    // For each registered KPI, pull value from snapshot
    REG.forEach((item, id) => {
      const { group, key } = item;
      const v = s[group]?.[key];
      if (typeof v !== 'number' || !isFinite(v)) return;
      item.hist.push(v);
      if (item.hist.length > CFG.points) item.hist.shift();

      // Determine "good" direction from CFG.domMap declaration
      const meta = CFG.domMap[id] || {};
      const trend = trendFromHist(item.hist, !!meta.goodLow, !!meta.goodHigh);
      pushValue(id, v, trend);
    });
  };

  // --- Public API -----------------------------------------------
  const API = {
    refresh() { syncFromSnapshot(); },
    attachTo(id, opts = {}) {
      const el = DOC.getElementById(id);
      if (!el) return false;
      ensureAttachment(el, { id, ...opts });
      return true;
    },
    // For debugging: dump histories
    dump() {
      const out = {};
      REG.forEach((r, id) => out[id] = [...r.hist]);
      return out;
    }
  };
  WIN.HealthFloDashboard = API;

  // --- Boot -----------------------------------------------------
  const boot = () => {
    scan();
    // Initial sync (if KPI Engine is already seeded)
    syncFromSnapshot();
  };

  if (DOC.readyState === 'loading') {
    DOC.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // --- Event wiring ---------------------------------------------
  // 1) On each KPI batch complete, resync everything
  DOC.addEventListener('hf:refreshComplete', () => syncFromSnapshot());
  // 2) Also ingest granular updates if present
  WIN.addEventListener('hf:kpiUpdate', (e) => granularIngest(e.detail || {}));

})();
