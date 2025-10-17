/*!
 * HealthFlo Narrative Engine (Standalone, IIFE)
 * ----------------------------------------------------------
 * Purpose:
 *  - Turns live KPI telemetry into executive-grade narratives.
 *  - Renders an Executive Summary + advisory cards in #insights.
 *  - Context-aware templates (5 lenses): Executive, Finance (CFO),
 *    Operations (COO), Clinical (CMO), Patient Experience.
 *
 * Design:
 *  - Zero deps; uses GSAP if present (optional) for reveal.
 *  - Listens to 'hf:kpiUpdate' (from KPI Engine) and aggregates.
 *  - Emits 'hf:narrativeUpdate' with synthesized storyline.
 *  - Configurable cadence; respects KPI pause state.
 *  - Can be disabled by user: localStorage 'hf-narrative-enabled' = 'false'.
 *
 * Author: HealthFlo Engineering • 2025
 */

(() => {
  const DOC = document;
  const WIN = window;

  // --------------- Config ---------------
  const CFG = {
    rootSelector: '#insights',
    execSummaryMaxBullets: 3,
    minUpdateGapMs: 2500,          // debounce narrative recompute
    animate: true,                 // uses GSAP if available
    tone: 'advisory-strategic',    // text voice
    enableKey: 'hf-narrative-enabled',
    // thresholds for language grading (feel "impressive but realistic")
    thresholds: {
      approvalGood: 90,
      satisfactionGood: 85,
      preauthFast: 50,    // seconds (lower is better)
      denialLow: 8,       // %
      arDaysGood: 55,     // days (lower is better)
      waitTimeGood: 20    // minutes (lower is better)
    }
  };

  // --------------- State ---------------
  const STATE = {
    enabled: true,
    lastUpdateTs: 0,
    // live snapshot from KPI engine (we use the richer KPI Engine if present)
    snapshot: null,
    // lightweight rollup for narrative
    rollup: {
      hospital: {},
      patient: {}
    }
  };

  // --------------- Utils ---------------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fmtPct = (n) => `${Number(n).toFixed(n >= 10 ? 0 : 1)}%`;
  const fmtInt = (n) => Number(Math.round(n)).toLocaleString();
  const fmtSec = (n) => `${Math.max(1, Math.round(n))}s`;
  const fmtMin = (n) => `${Math.max(1, Math.round(n))}m`;
  const pick = (o, k, d=null) => (o && k in o ? o[k] : d);

  const hasGSAP = () => typeof WIN.gsap !== 'undefined';

  const animateReveal = (nodes) => {
    if (!CFG.animate || !hasGSAP()) return;
    WIN.gsap.from(nodes, {
      opacity: 0,
      y: 18,
      duration: 0.6,
      stagger: 0.06,
      ease: 'power2.out'
    });
  };

  const now = () => Date.now();

  // --------------- DOM boot ---------------
  const root = DOC.querySelector(CFG.rootSelector);
  if (!root) return;

  // helper: create element with class & html
  const el = (tag, cls, html) => {
    const n = DOC.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // Ensures container scaffolding exists (exec summary + insights wrapper)
  const ensureScaffold = () => {
    root.classList.add('hf-ai-narrative-root');
    if (!root.querySelector('.hf-executive-summary')) {
      root.appendChild(el('article', 'hf-executive-summary', `
        <h3>Executive Summary</h3>
        <ul class="hf-exec-bullets" role="list"></ul>
      `));
    }
    if (!root.querySelector('.hf-insights-wrapper')) {
      root.appendChild(el('div', 'hf-insights-wrapper', ''));
    }
  };

  ensureScaffold();

  const $summaryList = root.querySelector('.hf-exec-bullets');
  const $insightsWrap = root.querySelector('.hf-insights-wrapper');

  // --------------- Data ingestion paths ---------------
  // Prefer full KPI Engine snapshot for richer semantics
  const readFromKPIEngine = () => {
    const s = WIN.HealthFloKPI?.getSnapshot?.();
    if (!s) return null;
    return {
      hospital: {
        admissions: pick(s.hospital, 'admissions'),
        approvalRate: pick(s.hospital, 'approvalRate'),
        preauthTime: pick(s.hospital, 'preauthTime'),
        denialRate: pick(s.hospital, 'denialRate'),
        arDays: pick(s.hospital, 'arDays')
      },
      patient: {
        satisfaction: pick(s.patient, 'satisfaction'),
        waitTime: pick(s.patient, 'waitTime'),
        nps: pick(s.patient, 'nps'),
        whatsappOpenRate: pick(s.patient, 'whatsappOpenRate'),
        adoptionRate: pick(s.patient, 'adoptionRate')
      }
    };
  };

  // Also listen to granular hf:kpiUpdate (for compatibility with lighter sims)
  // Aggregate latest values per name/category
  const onKPIEvent = (detail) => {
    if (!detail || !detail.name) return;
    const grp = (detail.category === 'patient') ? 'patient' : 'hospital';
    const key = normalizeNameToKey(detail.name);
    STATE.rollup[grp][key] = detail.value;
    // Debounced narrative recompute
    scheduleRecompute();
  };

  const normalizeNameToKey = (name) => {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+(rate|score)$/g, '')  // coalesce suffixes
      .replace(/\s+/g, '');
  };

  // --------------- Narrative Templates (5 lenses) ---------------
  const TEMPLATES = {
    executive({ h, p, t }) {
      const bullets = [];

      if (h.approvalRate != null && h.preauthTime != null) {
        const fast = h.preauthTime <= t.preauthFast;
        const good = h.approvalRate >= t.approvalGood;
        if (good && fast) {
          bullets.push(`Approval efficiency is compounding: <b>${fmtPct(h.approvalRate)}</b> with pre-auth near <b>${fmtSec(h.preauthTime)}</b>.`);
        } else if (good) {
          bullets.push(`Claim approvals are resilient at <b>${fmtPct(h.approvalRate)}</b>; further gains possible via pre-auth acceleration.`);
        } else {
          bullets.push(`Approval throughput needs lift (<b>${fmtPct(h.approvalRate || 0)}</b>) — prioritize packet quality & eligibility automation.`);
        }
      }

      if (h.denialRate != null) {
        bullets.push(h.denialRate <= t.denialLow
          ? `Denials remain contained at <b>${fmtPct(h.denialRate)}</b> — expand autonomous appeals to secondary payors.`
          : `Denials at <b>${fmtPct(h.denialRate)}</b> — enable predictive flags earlier in coding.`);
      }

      if (p.satisfaction != null) {
        bullets.push(p.satisfaction >= t.satisfactionGood
          ? `Patient satisfaction is trending high at <b>${fmtPct(p.satisfaction)}</b>; scale concierge playbooks network-wide.`
          : `Satisfaction at <b>${fmtPct(p.satisfaction)}</b> — accelerate multilingual checklists and real-time updates.`);
      }

      return bullets.slice(0, CFG.execSummaryMaxBullets);
    },

    finance({ h, p, t }) {
      const cards = [];
      if (h.arDays != null) {
        const good = h.arDays <= t.arDaysGood;
        cards.push({
          tag: 'Finance',
          title: 'AR Days Outlook',
          change: good ? 'positive' : 'negative',
          body: good
            ? `AR days near <b>${fmtInt(h.arDays)}</b> — maintain momentum by routing denial-prone claims through the appeal studio.`
            : `AR days at <b>${fmtInt(h.arDays)}</b>. Introduce weekly recovery sprints and automate follow-ups beyond 24h.`,
          actions: ['Enable payor SLA radar', 'Schedule weekly CFO huddle']
        });
      }
      if (h.approvalRate != null) {
        const strong = h.approvalRate >= CFG.thresholds.approvalGood;
        cards.push({
          tag: 'Finance',
          title: 'Approval Yield',
          change: strong ? 'positive' : 'stable',
          body: strong
            ? `Approval yield at <b>${fmtPct(h.approvalRate)}</b>. Expand auto-preauth to OPD & day-care to amplify cash velocity.`
            : `Approval yield <b>${fmtPct(h.approvalRate)}</b>. Audit packet completeness to lift first-pass rates.`,
          actions: ['Auto-packet builder rollout', 'Second-line audit queue']
        });
      }
      return cards;
    },

    operations({ h, p, t }) {
      const cards = [];
      if (h.preauthTime != null) {
        const fast = h.preauthTime <= t.preauthFast;
        cards.push({
          tag: 'Operations',
          title: 'Pre-Auth Throughput',
          change: fast ? 'positive' : 'negative',
          body: fast
            ? `Pre-auth averages <b>${fmtSec(h.preauthTime)}</b>. Extend templates to high-variance specialties to stabilize peaks.`
            : `Pre-auth at <b>${fmtSec(h.preauthTime)}</b>. Triage slow payors and pre-validate documents at intake.`,
          actions: ['Template library by specialty', 'Pre-validate eligibility at intake']
        });
      }
      if (h.denialRate != null) {
        const low = h.denialRate <= t.denialLow;
        cards.push({
          tag: 'Operations',
          title: 'Denial Containment',
          change: low ? 'positive' : 'stable',
          body: low
            ? `Denials contained at <b>${fmtPct(h.denialRate)}</b>. Route coding anomalies to predictive checks pre-submission.`
            : `Denials at <b>${fmtPct(h.denialRate)}</b>. Introduce auto-appeals with evidence packs from EMR co-pilot.`,
          actions: ['Predictive coding checks', 'Auto-appeal with evidence packs']
        });
      }
      return cards;
    },

    clinical({ h, p, t }) {
      const cards = [];
      // Use patient NPS & satisfaction as proxies for clinical comms quality
      if (p.nps != null || p.satisfaction != null) {
        const s = p.satisfaction != null ? fmtPct(p.satisfaction) : '—';
        const n = p.nps != null ? fmtInt(p.nps) : '—';
        cards.push({
          tag: 'Clinical',
          title: 'Communication & Coding Integrity',
          change: (p.satisfaction >= t.satisfactionGood) ? 'positive' : 'stable',
          body: `Satisfaction at <b>${s}</b> and NPS <b>${n}</b>. Reinforce medical necessity narrations to reduce secondary queries.`,
          actions: ['EMR co-pilot templates', 'MD sign-off nudges']
        });
      }
      return cards;
    },

    patient({ h, p, t }) {
      const cards = [];
      if (p.waitTime != null) {
        const good = p.waitTime <= t.waitTimeGood;
        cards.push({
          tag: 'Patient',
          title: 'Waiting Experience',
          change: good ? 'positive' : 'negative',
          body: good
            ? `Average wait near <b>${fmtMin(p.waitTime)}</b>. Scale concierge kiosks to high-traffic units.`
            : `Waits around <b>${fmtMin(p.waitTime)}</b>. Add proactive wayfinding and queue transparency.`,
          actions: ['Concierge kiosk rollout', 'Queue transparency in app']
        });
      }
      if (p.whatsappOpenRate != null || p.adoptionRate != null) {
        const orate = p.whatsappOpenRate != null ? fmtPct(p.whatsappOpenRate) : '—';
        const adopt = p.adoptionRate != null ? fmtPct(p.adoptionRate) : '—';
        cards.push({
          tag: 'Patient',
          title: 'Digital Engagement',
          change: 'positive',
          body: `Messaging open rate <b>${orate}</b>, adoption <b>${adopt}</b>. Target caregivers with multilingual nudges.`,
          actions: ['Multilingual nudge library', 'Caregiver segmentation']
        });
      }
      return cards;
    }
  };

  // --------------- Narrative synthesis ---------------
  const synthesize = (snap) => {
    // Prefer KPI Engine structured snapshot; otherwise merge rollup guesses
    const h = {
      admissions: pick(snap?.hospital || STATE.rollup.hospital, 'admissions', null),
      approvalRate: pick(snap?.hospital || STATE.rollup.hospital, 'approvalRate', null),
      preauthTime: pick(snap?.hospital || STATE.rollup.hospital, 'preauthTime', null),
      denialRate: pick(snap?.hospital || STATE.rollup.hospital, 'denialRate', null),
      arDays: pick(snap?.hospital || STATE.rollup.hospital, 'arDays', null)
    };
    const p = {
      satisfaction: pick(snap?.patient || STATE.rollup.patient, 'satisfaction', null),
      waitTime: pick(snap?.patient || STATE.rollup.patient, 'waitTime', null),
      nps: pick(snap?.patient || STATE.rollup.patient, 'nps', null),
      whatsappOpenRate: pick(snap?.patient || STATE.rollup.patient, 'whatsappOpenRate', null),
      adoptionRate: pick(snap?.patient || STATE.rollup.patient, 'adoptionRate', null)
    };

    const t = CFG.thresholds;

    const summaryBullets = TEMPLATES.executive({ h, p, t });

    const cards = [
      ...TEMPLATES.finance({ h, p, t }),
      ...TEMPLATES.operations({ h, p, t }),
      ...TEMPLATES.clinical({ h, p, t }),
      ...TEMPLATES.patient({ h, p, t })
    ];

    return { summaryBullets, cards, h, p };
  };

  // --------------- Renderers ---------------
  const renderSummary = (bullets) => {
    $summaryList.innerHTML = '';
    bullets.forEach((b) => {
      const li = el('li', null, b);
      $summaryList.appendChild(li);
    });
  };

  const renderCards = (cards) => {
    $insightsWrap.innerHTML = '';
    cards.forEach((c, idx) => {
      const card = el('article', 'hf-insight-card');
      card.dataset.index = String(idx);
      card.innerHTML = `
        <span class="hf-insight-tag">${c.tag}</span>
        <header><h3>${c.title}</h3><span class="hf-insight-change ${c.change}">${c.change === 'positive' ? '↑' : c.change === 'negative' ? '↓' : '•'}</span></header>
        <p class="hf-insight-text">${c.body}</p>
        ${Array.isArray(c.actions) && c.actions.length ? `
          <ul class="hf-actions">
            ${c.actions.map(a => `<li>${a}</li>`).join('')}
          </ul>` : ''
      }`;
      $insightsWrap.appendChild(card);
    });
    animateReveal($insightsWrap.children);
  };

  // --------------- Debounced recompute ---------------
  let recomputeTimer = null;
  const scheduleRecompute = () => {
    if (!STATE.enabled) return;
    const elapsed = now() - STATE.lastUpdateTs;
    if (elapsed >= CFG.minUpdateGapMs) {
      // Compute immediately if quiet long enough
      doRecompute();
    } else {
      clearTimeout(recomputeTimer);
      recomputeTimer = setTimeout(doRecompute, CFG.minUpdateGapMs - elapsed);
    }
  };

  const doRecompute = () => {
    STATE.lastUpdateTs = now();
    const snap = readFromKPIEngine(); // may be null
    const out = synthesize(snap);
    renderSummary(out.summaryBullets);
    renderCards(out.cards);
    DOC.dispatchEvent(new CustomEvent('hf:narrativeUpdate', { detail: out }));
  };

  // --------------- Wiring ---------------
  // Live KPI events (granular)
  WIN.addEventListener('hf:kpiUpdate', (e) => onKPIEvent(e.detail));
  // Full refresh cycles (nice to recompute after batch)
  WIN.addEventListener('hf:refreshComplete', scheduleRecompute);

  // Respect pause/resume from Insights drawer
  WIN.addEventListener('hf:insightsPaused', (e) => {
    const enabled = !!e.detail?.enabled;
    // This event means KPI engine enabled state; when false, engine is paused.
    // We keep narrative enabled; but if KPI is paused, we slow down recomputes.
    CFG.minUpdateGapMs = enabled ? 2500 : 6000;
  });

  // Allow user to disable narrative persistently (optional control)
  try {
    const saved = WIN.localStorage.getItem(CFG.enableKey);
    if (saved !== null) STATE.enabled = saved === 'true';
  } catch {}

  DOC.addEventListener('hf:setNarrativeEnabled', (e) => {
    STATE.enabled = !!e.detail?.enabled;
    try { WIN.localStorage.setItem(CFG.enableKey, String(STATE.enabled)); } catch {}
    if (STATE.enabled) scheduleRecompute();
  });

  // Initial compute once DOM ready
  if (DOC.readyState === 'loading') {
    DOC.addEventListener('DOMContentLoaded', scheduleRecompute);
  } else {
    scheduleRecompute();
  }

  // Announce readiness
  DOC.dispatchEvent(new CustomEvent('hf:narrativeReady'));
})();
