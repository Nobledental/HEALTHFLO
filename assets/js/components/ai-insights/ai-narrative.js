/* ==========================================================================
   HealthFloInsights – Advisory Narrative Drawer (Standalone, IIFE)
   --------------------------------------------------------------------------
   Purpose
   - Produces an AI-style executive narrative above your KPI dashboard.
   - Pulls live context from HealthFloDashboard.getState() (hospital + patient KPIs).
   - Generates concise, strategic insights across 5 tabs:
       1) Executive Summary  2) Clinical  3) Operations  4) Patient Experience  5) Financial
   - Auto-refreshes every 7s (configurable), with speed control in the UI.
   - Auto-opens when user scrolls to metrics (once), sticky and dismissible.
   - Fully accessible (aria-*), keyboard-focus friendly, reduced-motion aware.
   - Zero dependencies (works with or without GSAP); minimal CSS injected.

   Public API (window.HealthFloInsights)
     • init(options?: {
         autoOpenOnScroll?: boolean, // default true
         refreshMs?: number,         // default 7000
         reducedMotion?: boolean,    // default uses media query
         enabled?: boolean,          // default true (can be toggled at runtime)
       })
     • open(), close(), toggle()
     • setCadence(ms:number)
     • disable(), enable()
     • refreshNow()                  // force-generate a new narrative
     • getState()                    // introspect component status

   Custom Events
     • 'hf:insights:open'
     • 'hf:insights:close'
     • 'hf:insights:update'  detail: { tab, html, ts }
     • 'hf:insights:enable'  / 'hf:insights:disable'

   Interop
     • Listens to 'hf:dashboard:paused'/'hf:dashboard:resumed' to mirror state (optional)
     • Respects global window.HealthFlo.config if provided:
         - { insightsEnabled?: boolean, insightsRefreshMs?: number }

   Notes
     • All copy is synthetic, “executive tone”, slightly optimistic but plausible.
     • Replace the generator rules with your domain logic or API later.
   ========================================================================== */

window.HealthFloInsights = (function () {
  'use strict';

  /* ----------------------------------------
   * Internal utilities
   * -------------------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s, sc));

  // Light date formatter
  const fmtTime = (d = new Date()) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  // Get KPI snapshot safely
  function snapshotKPIs() {
    if (!window.HealthFloDashboard || !window.HealthFloDashboard.getState) return null;
    try { return window.HealthFloDashboard.getState(); } catch { return null; }
  }

  /* ----------------------------------------
   * Minimal CSS (injected once)
   * -------------------------------------- */
  (function injectCSS(){
    if (document.getElementById('hf-insights-inline-css')) return;
    const css = `
      .hf-insights {
        position: sticky;
        top: 76px; /* below header */
        z-index: 940;
        max-width: min(1240px, 94vw);
        margin: 0 auto 1.25rem auto;
        padding: 0 .75rem;
      }
      .hf-insights__wrap {
        border: 1px solid rgba(148,163,184,0.24);
        background: #ffffff;
        border-radius: 18px;
        box-shadow: 0 14px 40px rgba(15,23,42,0.12);
        overflow: hidden;
      }
      .hf-insights[hidden] { display: none !important; }

      .hf-insights__bar {
        display: flex; align-items: center; justify-content: space-between;
        padding: .8rem 1rem;
        background: linear-gradient(135deg, rgba(43,47,119,0.08), rgba(29,191,115,0.06));
        border-bottom: 1px solid rgba(148,163,184,0.18);
      }
      .hf-insights__title {
        display: inline-flex; align-items: center; gap: .6rem;
        font-weight: 800; letter-spacing: .02em; color: #2b2f77;
      }
      .hf-insights__title svg { width: 20px; height: 20px; }

      .hf-insights__controls {
        display: inline-flex; align-items: center; gap: .6rem;
      }
      .hf-insights__btn {
        border: 1px solid rgba(148,163,184,0.24);
        background: #fff; color: #0b0f1a;
        border-radius: 999px; padding: .45rem .7rem; font-weight: 600;
        cursor: pointer;
      }
      .hf-insights__btn:hover { box-shadow: 0 6px 16px rgba(15,23,42,0.12); }

      .hf-insights__speed {
        display: inline-flex; align-items: center; gap: .5rem;
        padding: .2rem .4rem; border-radius: 999px; background: rgba(43,47,119,0.06);
        color: #2b2f77; font-weight: 700;
      }
      .hf-insights__speed input[type="range"] {
        width: 120px;
        accent-color: #1dbf73;
      }

      .hf-insights__tabs {
        display: grid; grid-template-columns: repeat(5, 1fr);
        background: #ffffff;
      }
      .hf-insights__tab {
        appearance: none; border: 0; background: transparent; cursor: pointer;
        padding: .9rem 1rem; font-weight: 700; color: #475569;
        border-bottom: 2px solid transparent;
      }
      .hf-insights__tab[aria-selected="true"] {
        color: #2b2f77; border-bottom-color: #1dbf73;
        background: linear-gradient(135deg, rgba(56,189,248,0.08), rgba(94,234,212,0.08));
      }

      .hf-insights__panel {
        padding: 1.25rem 1.25rem 1.1rem 1.25rem;
        display: none;
      }
      .hf-insights__panel[aria-hidden="false"] { display: block; }

      .hf-insights__row {
        display: grid; gap: .65rem;
      }
      .hf-insights__lead {
        font-size: 1.02rem; color: #0b0f1a; line-height: 1.6;
      }
      .hf-insights__bullets {
        margin: .25rem 0 0 0; padding-left: 1.15rem; color: #475569;
      }
      .hf-insights__bullets li { list-style: disc; margin: .3rem 0; }

      .hf-insights__foot {
        padding: .75rem 1rem; color: #64748b; font-size: .9rem;
        display: flex; align-items: center; justify-content: space-between;
        border-top: 1px dashed rgba(148,163,184,0.24);
        background: #ffffff;
      }

      @media (max-width: 860px) {
        .hf-insights__tabs { grid-template-columns: repeat(3, 1fr); }
      }
      @media (max-width: 560px) {
        .hf-insights__tabs { grid-template-columns: repeat(2, 1fr); }
        .hf-insights__speed { display: none; }
      }
    `.trim();
    const style = document.createElement('style');
    style.id = 'hf-insights-inline-css';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  /* ----------------------------------------
   * DOM creation
   * -------------------------------------- */
  function createDrawer() {
    const wrap = document.createElement('section');
    wrap.className = 'hf-insights';
    wrap.setAttribute('aria-label', 'AI Advisory Insights');
    wrap.setAttribute('data-component', 'HealthFloInsights');

    wrap.innerHTML = `
      <div class="hf-insights__wrap">
        <div class="hf-insights__bar">
          <div class="hf-insights__title">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12c4-6 12-6 16 0" stroke="#2b2f77" stroke-width="2" stroke-linecap="round"/>
              <circle cx="18" cy="6" r="2" fill="#1dbf73"/>
            </svg>
            <span>AI-Powered Healthcare Insights</span>
          </div>
          <div class="hf-insights__controls">
            <span class="hf-insights__speed" title="Adjust update cadence">
              <span>Speed</span>
              <input class="hf-insights__range" type="range" min="0.5" max="2" step="0.1" value="1" />
            </span>
            <button class="hf-insights__btn" data-action="refresh" aria-label="Refresh insights now">Refresh</button>
            <button class="hf-insights__btn" data-action="close" aria-label="Hide insights">Hide</button>
          </div>
        </div>

        <div class="hf-insights__tabs" role="tablist" aria-label="Insight Categories">
          <button class="hf-insights__tab" role="tab" aria-selected="true"   aria-controls="hf-panel-exec" id="hf-tab-exec">Executive</button>
          <button class="hf-insights__tab" role="tab" aria-selected="false" aria-controls="hf-panel-clin" id="hf-tab-clin">Clinical</button>
          <button class="hf-insights__tab" role="tab" aria-selected="false" aria-controls="hf-panel-ops"  id="hf-tab-ops">Operations</button>
          <button class="hf-insights__tab" role="tab" aria-selected="false" aria-controls="hf-panel-px"   id="hf-tab-px">Patient Exp.</button>
          <button class="hf-insights__tab" role="tab" aria-selected="false" aria-controls="hf-panel-fin"  id="hf-tab-fin">Financial</button>
        </div>

        <div class="hf-insights__panel" id="hf-panel-exec" role="tabpanel" aria-labelledby="hf-tab-exec" aria-hidden="false"></div>
        <div class="hf-insights__panel" id="hf-panel-clin" role="tabpanel" aria-labelledby="hf-tab-clin" aria-hidden="true"></div>
        <div class="hf-insights__panel" id="hf-panel-ops"  role="tabpanel" aria-labelledby="hf-tab-ops"  aria-hidden="true"></div>
        <div class="hf-insights__panel" id="hf-panel-px"   role="tabpanel" aria-labelledby="hf-tab-px"   aria-hidden="true"></div>
        <div class="hf-insights__panel" id="hf-panel-fin"  role="tabpanel" aria-labelledby="hf-tab-fin"  aria-hidden="true"></div>

        <div class="hf-insights__foot">
          <span class="hf-insights__stamp" aria-live="polite">Updated • ${fmtTime()}</span>
          <button class="hf-insights__btn" data-action="disable">Disable Insights</button>
        </div>
      </div>
    `;
    return wrap;
  }

  /* ----------------------------------------
   * Narrative templates (context-aware)
   * -------------------------------------- */
  function buildContext(state) {
    // Flatten KPI map into easy object (key->value)
    const obj = {};
    if (!state || !state.kpis) return obj;
    Object.keys(state.kpis).forEach(k => { obj[k] = state.kpis[k].value; });
    return obj;
  }

  // Small helper to pick trend adjectives
  function trendWord(val, goodHigh = true, mild = false) {
    const hi = goodHigh ? ['surging', 'strong', 'elevated'] : ['elevated', 'cautious', 'tight'];
    const ok = goodHigh ? ['steady', 'healthy', 'resilient'] : ['stable', 'within guardrails', 'benign'];
    const lo = goodHigh ? ['softening', 'tempered', 'cooling'] : ['improving', 'easing', 'relaxing'];
    const x = Math.random();
    if (mild) return x > 0.5 ? ok[1] : ok[0];
    return val > 0.67 ? hi[Math.floor(x * hi.length)]
         : val > 0.33 ? ok[Math.floor(x * ok.length)]
                      : lo[Math.floor(x * lo.length)];
  }

  function pctScore(val, min, max, invert = false) {
    if (typeof val !== 'number') return 0.5;
    const t = clamp((val - min) / Math.max(1, max - min), 0, 1);
    return invert ? (1 - t) : t;
  }

  // Executive Summary
  function tplExecutive(K) {
    // Guard defaults
    const hospitals = K.hospitals_automated ?? 570;
    const patients  = K.patients_assisted ?? 150000;
    const preauth   = K.preauth_time ?? 45;
    const recovery  = K.claim_recovery_rate ?? 98;
    const cash30d   = K.cash_collected_30d ?? 120_000_000; // ₹
    const denial    = K.denial_rate ?? 5.1;

    const throughputScore = pctScore(hospitals, 520, 680);
    const liquidityScore  = pctScore(cash30d, 7.5e7, 2.4e8);
    const speedScore      = pctScore(preauth, 64, 28, true); // lower is better
    const qualityScore    = (pctScore(recovery, 93, 99) + pctScore(denial, 8.5, 3.2, true)) / 2;

    const headline = `Network momentum is ${trendWord((throughputScore + liquidityScore) / 2)} with healthy liquidity and fast pre-auths.`;

    const bullets = [
      `Throughput: ${Math.round(hospitals)} hospitals orchestrated; patient volume at ${patients.toLocaleString('en-IN')} and rising.`,
      `Speed: Pre-auth cycle ~ ${Math.round(preauth)}s; ${trendWord(speedScore)} payer response across key panels.`,
      `Yield: Claim recovery holding at ~${Math.round(recovery)}%; denial rate ~${denial.toFixed(1)}%.`,
      `Cash: ~₹${(cash30d).toLocaleString('en-IN')} collected in last 30 days; CFO forecast improving.`,
    ];

    return { headline, bullets };
  }

  // Clinical
  function tplClinical(K) {
    const nps     = K.nps ?? 84;
    const losRed  = K.los_reduction ?? 9;
    const respSec = K.whatsapp_response_time ?? 12;

    const careScore = (pctScore(nps, 60, 92) + pctScore(losRed, 3, 14)) / 2;
    const headline  = `Care signals ${trendWord(careScore)}: LOS trimmed and patient satisfaction resilient.`;

    const bullets = [
      `NPS ~ ${Math.round(nps)}, indicating strong bedside experience and clinician comms.`,
      `Length of Stay improved by ~${Math.round(losRed)}% in high-volume DRGs.`,
      `Coordinators respond within ~${Math.round(respSec)}s on WhatsApp for admissions and queries.`,
    ];
    return { headline, bullets };
  }

  // Operations
  function tplOperations(K) {
    const arDays = K.ar_days ?? 34;
    const denial = K.denial_rate ?? 5.1;
    const updates = K.bedside_updates ?? 2600;

    const opsScore = (pctScore(arDays, 45, 26, true) + pctScore(denial, 8.5, 3.2, true)) / 2;
    const headline = `Ops posture ${trendWord(opsScore)}: AR days and denial posture under active control.`;

    const bullets = [
      `AR Days at ~${Math.round(arDays)}; dunning & escalations are pacing to plan.`,
      `Denial radar steady at ~${denial.toFixed(1)}% with automated appeals live.`,
      `Bedside updates/day ~${Math.round(updates)}, ensuring up-to-the-minute status syncing.`,
    ];
    return { headline, bullets };
  }

  // Patient Experience
  function tplPX(K) {
    const nps      = K.nps ?? 84;
    const zeroAPR  = K.zero_interest_uptake ?? 28;
    const escRes   = K.patient_escalations_res ?? 92;

    const expScore = (pctScore(nps, 60, 92) + pctScore(escRes, 76, 98)) / 2;
    const headline = `Experience is ${trendWord(expScore)} with proactive comms and transparent financing.`;

    const bullets = [
      `Escalations resolved ~${Math.round(escRes)}% with concierge-grade handoffs.`,
      `Zero-interest plan uptake at ~${Math.round(zeroAPR)}%; families choosing transparent repayment.`,
      `Satisfaction remains high (NPS ~${Math.round(nps)}), boosted by live claim tracking.`,
    ];
    return { headline, bullets };
  }

  // Financial
  function tplFinancial(K) {
    const cash30d  = K.cash_collected_30d ?? 1.2e8;
    const recovery = K.claim_recovery_rate ?? 98;
    const finance  = K.finance_approval_rate ?? 73;

    const finScore = (pctScore(cash30d, 7.5e7, 2.4e8) + pctScore(recovery, 93, 99)) / 2;
    const headline = `Financial pulse ${trendWord(finScore)}: strong collections and reliable recovery rates.`;

    const bullets = [
      `Collections last 30d ~ ₹${cash30d.toLocaleString('en-IN')}; CFO outlook improving.`,
      `Claim recovery ~${Math.round(recovery)}% with steady appeal throughput.`,
      `Patient finance approvals ~${Math.round(finance)}% — supportive for discharge velocity.`,
    ];
    return { headline, bullets };
  }

  const TABS = [
    { id: 'exec', label: 'Executive', build: tplExecutive },
    { id: 'clin', label: 'Clinical',  build: tplClinical  },
    { id: 'ops',  label: 'Operations',build: tplOperations},
    { id: 'px',   label: 'Patient Exp.', build: tplPX   },
    { id: 'fin',  label: 'Financial', build: tplFinancial}
  ];

  /* ----------------------------------------
   * Controller
   * -------------------------------------- */
  const Insights = {
    el: null,
    running: false,
    enabled: true,
    refreshMs: 7000,
    timer: null,
    activeTab: 'exec',
    openedOnce: false,

    init(opts = {}) {
      const cfg = window.HealthFlo?.config || {};
      this.enabled   = (opts.enabled ?? cfg.insightsEnabled ?? true);
      this.refreshMs = clamp(Number(opts.refreshMs ?? cfg.insightsRefreshMs ?? 7000) || 7000, 1500, 20000);

      if (!this.enabled) return this;

      // create and insert before metrics section if present
      const before = document.getElementById('metrics') || document.querySelector('.metrics');
      this.el = createDrawer();
      if (before && before.parentNode) {
        before.parentNode.insertBefore(this.el, before);
      } else {
        // fallback to top of <main>
        const main = document.querySelector('main') || document.body;
        main.insertBefore(this.el, main.firstChild);
      }

      this._bind();
      this._renderAll();

      // Auto-open on scroll (once) unless disabled
      const autoScroll = (opts.autoOpenOnScroll !== false);
      if (autoScroll) this._setupAutoOpenObserver();

      // Start loop
      this.running = true;
      this._startLoop();
      return this;
    },

    _bind() {
      const tabs = $$('.hf-insights__tab', this.el);
      tabs.forEach(btn => {
        btn.addEventListener('click', () => this._setTab(btn.id.replace('hf-tab-','')));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const list = tabs;
            const idx = list.indexOf ? list.indexOf(btn) : Array.prototype.indexOf.call(list, btn);
            const dir = (e.key === 'ArrowRight') ? 1 : -1;
            const next = list[(idx + dir + list.length) % list.length];
            next.focus(); next.click();
          }
        });
      });

      this.el.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const a = target.getAttribute('data-action');
        if (a === 'close')  this.close();
        if (a === 'refresh') this.refreshNow();
        if (a === 'disable') this.disable();
      });

      const range = $('.hf-insights__range', this.el);
      range?.addEventListener('input', () => {
        const mult = clamp(Number(range.value) || 1, 0.5, 2);
        this.setCadence(Math.round(7000 / mult));
      });

      // Mirror dashboard events (optional)
      window.addEventListener('hf:dashboard:paused', () => this._stamp(`Dashboard paused • ${fmtTime()}`));
      window.addEventListener('hf:dashboard:resumed', () => this._stamp(`Dashboard resumed • ${fmtTime()}`));
    },

    _setupAutoOpenObserver() {
      const metrics = document.getElementById('metrics') || document.querySelector('.metrics');
      if (!metrics) return;
      const obs = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.openedOnce) {
            this.open(); this.openedOnce = true; obs.disconnect();
            break;
          }
        }
      }, { rootMargin: '0px 0px -60% 0px', threshold: 0.2 });
      obs.observe(metrics);
    },

    _setTab(id) {
      this.activeTab = id;
      const tabs = $$('.hf-insights__tab', this.el);
      const panels = $$('.hf-insights__panel', this.el);

      tabs.forEach(t => t.setAttribute('aria-selected', String(t.id === `hf-tab-${id}`)));
      panels.forEach(p => p.setAttribute('aria-hidden', String(p.id !== `hf-panel-${id}`)));
      // Emit event
      window.dispatchEvent(new CustomEvent('hf:insights:update', {
        detail: { tab: id, ts: Date.now(), html: $(`#hf-panel-${id}`, this.el)?.innerHTML || '' }
      }));
    },

    _stamp(text) {
      const stamp = $('.hf-insights__stamp', this.el);
      if (stamp) stamp.textContent = text;
    },

    _renderAll() {
      const state = snapshotKPIs();
      const K = buildContext(state);
      const entries = [
        ['exec', tplExecutive(K)],
        ['clin', tplClinical(K)],
        ['ops',  tplOperations(K)],
        ['px',   tplPX(K)],
        ['fin',  tplFinancial(K)]
      ];
      for (const [id, tpl] of entries) {
        const panel = $(`#hf-panel-${id}`, this.el);
        if (!panel) continue;
        panel.innerHTML = `
          <div class="hf-insights__row">
            <div class="hf-insights__lead">${tpl.headline}</div>
            <ul class="hf-insights__bullets">
              ${tpl.bullets.map(li => `<li>${li}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      this._stamp(`Updated • ${fmtTime()}`);
      // Keep current tab
      this._setTab(this.activeTab);
    },

    _startLoop() {
      if (this.timer) clearInterval(this.timer);
      if (!this.running) return;
      this.timer = setInterval(() => this._renderAll(), this.refreshMs);
    },

    /* ---------- Public API ---------- */
    open() {
      if (!this.el) return;
      this.el.hidden = false;
      window.dispatchEvent(new CustomEvent('hf:insights:open'));
    },

    close() {
      if (!this.el) return;
      this.el.hidden = true;
      window.dispatchEvent(new CustomEvent('hf:insights:close'));
    },

    toggle() {
      if (!this.el) return;
      this.el.hidden ? this.open() : this.close();
    },

    setCadence(ms) {
      this.refreshMs = clamp(Number(ms) || 7000, 1200, 30000);
      this._startLoop();
      this._stamp(`Cadence • ${(this.refreshMs/1000).toFixed(1)}s • ${fmtTime()}`);
    },

    disable() {
      this.enabled = false;
      if (this.timer) clearInterval(this.timer);
      this.close();
      window.dispatchEvent(new CustomEvent('hf:insights:disable'));
    },

    enable() {
      if (this.enabled) return;
      this.enabled = true;
      this.open();
      this.running = true;
      this._startLoop();
      window.dispatchEvent(new CustomEvent('hf:insights:enable'));
    },

    refreshNow() {
      this._renderAll();
    },

    getState() {
      return {
        enabled: this.enabled,
        running: this.running,
        refreshMs: this.refreshMs,
        activeTab: this.activeTab,
        opened: !this.el?.hidden
      };
    }
  };

  return Insights;
})();
