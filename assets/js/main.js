/*!
 * HealthFlo – Main Orchestrator
 * -------------------------------------------------------------
 * Boots GSAP (if present), wires the Hospital/Patient toggle,
 * provides a free, simulated KPI Engine (HealthFloKPI) ready to
 * swap with a real API later, and coordinates system-wide events.
 *
 * Safe-by-default:
 * - Runs without GSAP/PIXI (progressive enhancement)
 * - Respects prefers-reduced-motion
 * - Shares speed/enable prefs with AI Insights drawer
 *
 * Emits (for other modules):
 *   'hf:refreshStart' / 'hf:refreshComplete'
 *   'hf:kpiUpdate' (granular per KPI)
 *
 * Depends on (optional):
 *   components/dashboard/dashboard.js   (sparklines)
 *   components/ai-insights/ai-insights.js (drawer & speed/pause UI)
 *   components/ai-insights/ai-narrative.js (narrative)
 *   components/visuals/pixi-field.js   (decorative field)
 */

(() => {
  const DOC = document;
  const WIN = window;

  // ---------------- Feature flags ----------------
  const HAS_GSAP = typeof WIN.gsap !== 'undefined';
  const prefersReducedMotion = WIN.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Mark JS-enabled for CSS guards
  DOC.documentElement.classList.remove('no-js');

  // ---------------- Header behavior ----------------
  const header = DOC.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 6) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------------- Hero animation (subtle) ----------------
  const hero = DOC.querySelector('.hero h1');
  if (hero && HAS_GSAP && !prefersReducedMotion && WIN.SplitText) {
    try {
      const split = new WIN.SplitText(hero, { type: 'chars,words' });
      WIN.gsap.from(split.chars, {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.02,
        ease: 'power2.out'
      });
    } catch { /* no-op */ }
  }

  // ---------------- Hospital/Patient quick toggle ----------------
  const quickToggle = DOC.querySelector('.quick-toggle');
  if (quickToggle) {
    const btns = Array.from(quickToggle.querySelectorAll('button'));
    const panels = {
      hospitals: DOC.getElementById('audience-hospitals'),
      patients: DOC.getElementById('audience-patients')
    };
    const setActive = (key) => {
      btns.forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === key)));
      if (panels.hospitals && panels.patients) {
        const showHosp = key === 'hospitals';
        panels.hospitals.hidden = !showHosp;
        panels.patients.hidden = showHosp;
      }
      DOC.dispatchEvent(new CustomEvent('hf:viewSwitch', { detail: { view: key } }));
    };
    btns.forEach(b => b.addEventListener('click', () => setActive(b.dataset.view)));
    // default
    const initial = btns.find(b => b.getAttribute('aria-selected') === 'true')?.dataset.view || 'hospitals';
    setActive(initial);
  }

  // ============================================================
  //  KPI ENGINE (Simulated, Free) – HealthFloKPI
  //  Ready to replace with live API. Shares prefs with Insights:
  //   - localStorage 'hf-kpi-speed' : '1'|'2'|'3' (fast/standard/slow)
  //   - localStorage 'hf-kpi-enabled' : 'true'|'false'
  //  Exposes:
  //    getSnapshot(), setSpeed(level), setEnabled(bool)
  // ============================================================
  const HF_KPI = (() => {
    // Config (hospital-centric + patient-centric KPIs)
    const CFG = {
      // base ranges (realistic, slightly impressive)
      ranges: {
        admissions:        [420,  560],  // patients/day
        approvalRate:      [88,   98],   // %
        preauthTime:       [38,   52],   // seconds (lower better)
        denialRate:        [5,    12],   // %
        arDays:            [48,   62],   // days (lower better)
        satisfaction:      [84,   96],   // %
        waitTime:          [18,   32],   // minutes (lower better)
        nps:               [72,   92],   // points
        whatsappOpenRate:  [64,   86],   // %
        adoptionRate:      [62,   88]    // %
      },
      // refresh cadence from speed level
      speedToMs(level){
        if (String(level) === '1') return 5000;   // Fast
        if (String(level) === '3') return 30000;  // Slow
        return 15000;                              // Standard
      }
    };

    // Load prefs (shared)
    const getPref = (k, d) => {
      try { const v = localStorage.getItem(k); return v == null ? d : v; }
      catch { return d; }
    };
    const setPref = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

    let enabled = getPref('hf-kpi-enabled', 'true') !== 'false';
    let speedLevel = getPref('hf-kpi-speed', '2'); // '1'|'2'|'3'
    let intervalMs = CFG.speedToMs(speedLevel);
    let timer = null;

    // Internal state snapshot
    const SNAP = {
      hospital: {
        admissions: 520,
        approvalRate: 93,
        preauthTime: 44,
        denialRate: 7.2,
        arDays: 55
      },
      patient: {
        satisfaction: 90,
        waitTime: 24,
        nps: 82,
        whatsappOpenRate: 74,
        adoptionRate: 70
      }
    };

    // Random nudges within range (with gentle momentum)
    const jitter = (v, [min, max], intensity = 0.06) => {
      const span = max - min;
      const delta = (Math.random() - 0.5) * span * intensity;
      let next = v + delta;
      if (next < min) next = min + Math.random() * (span * 0.1);
      if (next > max) next = max - Math.random() * (span * 0.1);
      return +next.toFixed(1);
    };

    const refresh = () => {
      // announce start
      DOC.dispatchEvent(new CustomEvent('hf:refreshStart', { detail: { at: Date.now() }}));

      // compute next values
      // hospital
      SNAP.hospital.admissions     = jitter(SNAP.hospital.admissions,    CFG.ranges.admissions, 0.07);
      SNAP.hospital.approvalRate   = jitter(SNAP.hospital.approvalRate,  CFG.ranges.approvalRate, 0.05);
      SNAP.hospital.preauthTime    = jitter(SNAP.hospital.preauthTime,   CFG.ranges.preauthTime, 0.05);
      SNAP.hospital.denialRate     = jitter(SNAP.hospital.denialRate,    CFG.ranges.denialRate, 0.06);
      SNAP.hospital.arDays         = jitter(SNAP.hospital.arDays,        CFG.ranges.arDays, 0.04);

      // patient
      SNAP.patient.satisfaction    = jitter(SNAP.patient.satisfaction,   CFG.ranges.satisfaction, 0.05);
      SNAP.patient.waitTime        = jitter(SNAP.patient.waitTime,       CFG.ranges.waitTime, 0.05);
      SNAP.patient.nps             = jitter(SNAP.patient.nps,            CFG.ranges.nps, 0.05);
      SNAP.patient.whatsappOpenRate= jitter(SNAP.patient.whatsappOpenRate, CFG.ranges.whatsappOpenRate, 0.06);
      SNAP.patient.adoptionRate    = jitter(SNAP.patient.adoptionRate,   CFG.ranges.adoptionRate, 0.06);

      // push granular events (so listeners can consume per KPI)
      const emit = (category, name, value, unit='') => {
        WIN.dispatchEvent(new CustomEvent('hf:kpiUpdate', {
          detail: { category, name, value, unit, timestamp: new Date().toISOString() }
        }));
      };

      emit('hospital', 'Admissions', SNAP.hospital.admissions, 'patients');
      emit('hospital', 'Claim Approval Rate', SNAP.hospital.approvalRate, '%');
      emit('hospital', 'Avg Pre-Auth Time', SNAP.hospital.preauthTime, 's');
      emit('hospital', 'Denial Rate', SNAP.hospital.denialRate, '%');
      emit('hospital', 'AR Days', SNAP.hospital.arDays, 'days');

      emit('patient', 'Satisfaction Score', SNAP.patient.satisfaction, '%');
      emit('patient', 'Avg Wait Time', SNAP.patient.waitTime, 'min');
      emit('patient', 'Net Promoter Score', SNAP.patient.nps, 'NPS');
      emit('patient', 'WhatsApp Open Rate', SNAP.patient.whatsappOpenRate, '%');
      emit('patient', 'Adoption Rate', SNAP.patient.adoptionRate, '%');

      // announce complete (dashboard/narrative will resync)
      DOC.dispatchEvent(new CustomEvent('hf:refreshComplete', { detail: { at: Date.now() }}));
    };

    const start = () => {
      stop();
      if (!enabled) return;
      timer = setInterval(refresh, intervalMs);
    };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };

    // Public API
    const api = {
      getSnapshot(){ return JSON.parse(JSON.stringify(SNAP)); },
      setSpeed(level){
        speedLevel = String(level ?? '2');
        setPref('hf-kpi-speed', speedLevel);
        intervalMs = CFG.speedToMs(speedLevel);
        start(); // restart with new cadence
      },
      setEnabled(flag){
        enabled = !!flag;
        setPref('hf-kpi-enabled', String(enabled));
        if (enabled) start(); else stop();
      }
    };

    // Listen to drawer’s speed & enable controls (if present)
    DOC.addEventListener('hf:insightsSpeed', (e) => {
      if (e?.detail?.level) api.setSpeed(e.detail.level);
    });
    DOC.addEventListener('hf:kpiSetEnabled', (e) => {
      api.setEnabled(!!e.detail?.enabled);
    });

    // Boot after DOM ready; do an immediate first refresh to seed UI
    const boot = () => { refresh(); start(); };
    if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot);
    else boot();

    return api;
  })();

  // Expose globally so other modules can read snapshots
  WIN.HealthFloKPI = WIN.HealthFloKPI || HF_KPI;

  // ---------------- Inline numbers (fallback writer) ----------------
  // If index.html contains #kpi-* elements, keep them updated with latest values.
  const NODES = {
    admissions:   DOC.getElementById('kpi-admissions'),
    approval:     DOC.getElementById('kpi-approval'),
    preauth:      DOC.getElementById('kpi-preauth'),
    satisfaction: DOC.getElementById('kpi-satisfaction')
  };
  const fmtInt = (n)=>Number(Math.round(n)).toLocaleString();
  const fmtPct = (n)=>`${Number(n).toFixed(n>=10?0:1)}%`;
  const fmtSec = (n)=>`${Math.max(1,Math.round(n))}s`;

  const writeInline = () => {
    const s = WIN.HealthFloKPI.getSnapshot();
    if (NODES.admissions && s.hospital.admissions != null)   NODES.admissions.textContent   = fmtInt(s.hospital.admissions);
    if (NODES.approval && s.hospital.approvalRate != null)   NODES.approval.textContent     = fmtPct(s.hospital.approvalRate);
    if (NODES.preauth && s.hospital.preauthTime != null)     NODES.preauth.textContent      = fmtSec(s.hospital.preauthTime);
    if (NODES.satisfaction && s.patient.satisfaction != null)NODES.satisfaction.textContent = fmtPct(s.patient.satisfaction);
  };

  // Update numbers after each batch completes
  DOC.addEventListener('hf:refreshComplete', writeInline);
  // Seed immediately
  if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', writeInline);
  else writeInline();

  // ---------------- Toolbar demo wiring (optional) ----------------
  const toolbar = DOC.querySelector('.hf-toolbar');
  if (toolbar) {
    const speedSeg = toolbar.querySelector('[data-speed-seg]');
    const visSeg   = toolbar.querySelector('[data-vis-seg]');
    if (speedSeg) {
      speedSeg.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-speed]');
        if (!btn) return;
        speedSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed','false'));
        btn.setAttribute('aria-pressed','true');
        const lvl = btn.getAttribute('data-speed'); // '1'|'2'|'3'
        // Inform both KPI & Insights drawer listeners
        DOC.dispatchEvent(new CustomEvent('hf:insightsSpeed', { detail: { level: lvl }}));
      });
    }
    if (visSeg) {
      visSeg.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-mode]');
        if (!btn) return;
        visSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed','false'));
        btn.setAttribute('aria-pressed','true');
        DOC.dispatchEvent(new CustomEvent('hf:pixiSetMode', { detail: { mode: btn.getAttribute('data-mode') }}));
      });
    }
  }
})();
