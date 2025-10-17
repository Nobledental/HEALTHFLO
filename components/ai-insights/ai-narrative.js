/*
 * 🧠 HealthFlo AI Narrative Engine v4.0 → v4.2 (compact & robust)
 * - Overlay-only (no main layout impact). Starts on proximity via IO.
 * - Single reschedulable interval; visibility throttling (pause on bg tab).
 * - Reduced-motion: renders once, no auto-refresh or speech.
 * - Narration prefs persisted; safe SpeechSynthesis usage.
 * - Public API: window.HealthFloNarrative
 *   { updateNow, setRefreshInterval, setNarration(enabled),
 *     setRate, setCount, pause, resume, getState }
 * - Backward-compatible events: hf:insightGenerated, hf:summaryGenerated, hf:insightClick
 */

(function () {
  'use strict';

  /* ================== CONFIG (patchable) ================== */
  const CONFIG = {
    refreshInterval: 7000,
    exaggerationFactor: 1.12,
    containerId: 'hf-ai-insights',
    narrativeCount: 5,
    narrationEnabled: false,
    narrationRate: 1.0,
    ioRootMargin: '200px 0px -20% 0px'
  };

  /* ================ ENV & PREFERENCES ================= */
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const ls = {
    g(k, d){ try{ const v = localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch{ return d; } },
    s(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
  };
  // Restore persisted prefs
  CONFIG.narrationEnabled = ls.g('hf-narration-enabled', CONFIG.narrationEnabled);
  CONFIG.narrationRate    = ls.g('hf-narration-rate',    CONFIG.narrationRate);
  CONFIG.refreshInterval  = ls.g('hf-narration-interval',CONFIG.refreshInterval);
  CONFIG.narrativeCount   = ls.g('hf-narration-count',   CONFIG.narrativeCount);

  /* ================== UTILITIES ================== */
  const $  = (s, sc=document)=>sc.querySelector(s);
  const $$ = (s, sc=document)=>Array.from(sc.querySelectorAll(s));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatPct = (val) => `${val > 0 ? '+' : ''}${val}%`;

  /* ================== TEMPLATES ================== */
  const TEMPLATES = {
    clinical: [
      (v) => `Clinical efficiency improved ${formatPct(v)} this week—reducing wait times and enhancing outcomes.`,
      (v) => `Procedural success rates climbed ${formatPct(v)}, highlighting surgical precision and care quality.`,
      (v) => `Post-op recovery accelerated ${formatPct(v)}, showing better care pathways.`
    ],
    patient: [
      (v) => `Patient satisfaction surged ${formatPct(v)}, driven by clearer communication and seamless care.`,
      (v) => `${formatPct(v)} boost in digital engagement indicates higher portal adoption.`,
      (v) => `Appointment adherence improved ${formatPct(v)}, reflecting greater patient trust.`
    ],
    operational: [
      (v) => `Bed occupancy approached target with a ${formatPct(v)} operational uplift.`,
      (v) => `Workflow efficiency rose ${formatPct(v)} via triage automation and smarter scheduling.`,
      (v) => `ER throughput improved ${formatPct(v)}, reducing critical wait times.`
    ],
    financial: [
      (v) => `Revenue per patient increased ${formatPct(v)} due to improved care mix and conversions.`,
      (v) => `Claim approvals grew ${formatPct(v)}, reflecting stronger payer collaboration.`,
      (v) => `Cost per admission declined ${formatPct(v)}, improving sustainability.`
    ],
    strategic: [
      (v) => `Patient loyalty is trending ${formatPct(v)} ahead—strengthening long-term retention.`,
      (v) => `Referral traffic jumped ${formatPct(v)}, signaling clinician confidence.`,
      (v) => `Partnerships delivered ${formatPct(v)} greater market influence.`
    ],
  };

  /* ================== ENGINE STATE ================== */
  let timer = null;
  let started = false;
  let io = null;

  /* ================== CORE GEN ================== */
  const generateInsight = () => {
    const category = choose(Object.keys(TEMPLATES));
    const value = Math.round(rand(3, 18) * CONFIG.exaggerationFactor);
    return {
      category,
      narrative: choose(TEMPLATES[category])(value),
      value,
      timestamp: new Date().toISOString(),
    };
  };

  const generateBatch = () =>
    Array.from({ length: CONFIG.narrativeCount }, generateInsight);

  const buildSummary = (insights) => {
    const counts = insights.reduce((acc, i) => (acc[i.category] = (acc[i.category] || 0) + 1, acc), {});
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'operational';

    let summary;
    if (top === 'clinical' || top === 'patient') {
      summary = `📈 Patient care momentum is strong—outcomes and satisfaction are rising, indicating sustained quality improvements.`;
    } else if (top === 'financial' || top === 'strategic') {
      summary = `🚀 Financial and strategic KPIs are trending up—growth remains solid with improving revenue efficiency.`;
    } else {
      summary = `⚙️ Operational performance is steady—positioning for scalable throughput across care delivery.`;
    }
    const highlight = choose(insights).narrative;
    return `${summary} Notably: ${highlight}`;
  };

  /* ================== RENDER ================== */
  const renderInsights = (insights, summary) => {
    const container = document.getElementById(CONFIG.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="hf-insights-controls">
        <label>
          <input type="checkbox" id="narration-toggle" ${CONFIG.narrationEnabled ? 'checked' : ''} />
          🔊 Enable Narration
        </label>
        <label>
          Speed: <input type="range" id="narration-speed" min="0.8" max="1.5" step="0.1" value="${CONFIG.narrationRate}">
        </label>
      </div>

      <div class="hf-executive-summary" id="hf-executive-summary" aria-live="polite">
        <h3>📊 AI Executive Summary</h3>
        <p>${summary}</p>
      </div>

      <div class="hf-insights-wrapper" role="list">
        ${insights.map((insight, i) => `
          <article class="hf-insight-card narrative" role="listitem" data-index="${i}" data-category="${insight.category}" tabindex="0">
            <div class="hf-insight-tag" aria-label="Category">${insight.category.toUpperCase()}</div>
            <p class="hf-insight-text">${insight.narrative}</p>
          </article>
        `).join('')}
      </div>
    `;

    // Click + keyboard activate
    container.querySelectorAll('.hf-insight-card').forEach((card) => {
      const fire = () => document.dispatchEvent(new CustomEvent('hf:insightClick', {
        detail: { category: card.dataset.category, text: card.querySelector('.hf-insight-text')?.innerText || '' }
      }));
      card.addEventListener('click', fire);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }});
    });

    // Controls
    const toggle = document.getElementById('narration-toggle');
    const speed = document.getElementById('narration-speed');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        CONFIG.narrationEnabled = !!e.target.checked;
        ls.s('hf-narration-enabled', CONFIG.narrationEnabled);
        if (!CONFIG.narrationEnabled && window.speechSynthesis) speechSynthesis.cancel();
      });
    }
    if (speed) {
      speed.addEventListener('input', (e) => {
        const r = parseFloat(e.target.value) || CONFIG.narrationRate;
        CONFIG.narrationRate = Math.max(0.5, Math.min(2, r));
        ls.s('hf-narration-rate', CONFIG.narrationRate);
      });
    }
  };

  /* ================== NARRATION ================== */
  const narrate = (summary, insights) => {
    if (!CONFIG.narrationEnabled || !window.speechSynthesis) return;
    // Avoid spamming utterances
    try { speechSynthesis.cancel(); } catch {}
    const text = `${summary} ${insights.map(i => i.narrative).join(' ')}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = CONFIG.narrationRate;
    try { speechSynthesis.speak(u); } catch {}
  };

  /* ================== UPDATE CYCLE ================== */
  const update = () => {
    const insights = generateBatch();
    const summary = buildSummary(insights);
    renderInsights(insights, summary);
    narrate(summary, insights);

    document.dispatchEvent(new CustomEvent('hf:insightGenerated', { detail: insights }));
    document.dispatchEvent(new CustomEvent('hf:summaryGenerated', { detail: summary }));
  };

  const startLoop = () => {
    stopLoop();
    timer = setInterval(update, CONFIG.refreshInterval);
  };
  const stopLoop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  /* ============== OVERLAY-ONLY AUTO-START ============== */
  const openDrawerOverlay = () => {
    const host = $('.hf-ai-insights');
    const drawer = $('.hf-ai-insights__drawer');
    if (!host || !drawer) return;
    host.classList.add('open');
    if (window.gsap && !prefersReduced) {
      gsap.to(drawer, { right: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('.hf-insight-card', { opacity: 0, y: 20, duration: 0.5, stagger: 0.06, ease: 'power2.out', delay: 0.08 });
    } else {
      drawer.style.right = '0';
    }
  };

  const setupObserver = () => {
    if (io) return;
    const target = $('.hf-ai-insights__trigger') || $('.hf-ai-insights__drawer');
    if (!target) return;
    io = new IntersectionObserver((ents) => {
      if (!ents[0]?.isIntersecting) return;
      if (!started) {
        started = true;
        update();             // render immediately
        if (!prefersReduced) startLoop();
        openDrawerOverlay();
      }
      io.disconnect(); io = null;
    }, { rootMargin: CONFIG.ioRootMargin, threshold: 0 });
    io.observe(target);
  };

  /* ============== VISIBILITY THROTTLING ============== */
  const handleVisibility = () => {
    if (!started || prefersReduced) return;
    if (document.hidden) { stopLoop(); if (window.speechSynthesis) speechSynthesis.cancel(); }
    else startLoop();
  };

  /* ================== PUBLIC API ================== */
  const API = {
    updateNow(){ update(); },
    setRefreshInterval(ms){
      const v = Math.max(2000, Number(ms) || CONFIG.refreshInterval);
      CONFIG.refreshInterval = v; ls.s('hf-narration-interval', v);
      if (timer) startLoop();
      return v;
    },
    setNarration(enabled){
      CONFIG.narrationEnabled = !!enabled; ls.s('hf-narration-enabled', CONFIG.narrationEnabled);
      if (!enabled && window.speechSynthesis) speechSynthesis.cancel();
      return CONFIG.narrationEnabled;
    },
    setRate(rate){
      CONFIG.narrationRate = Math.max(0.5, Math.min(2, Number(rate) || CONFIG.narrationRate));
      ls.s('hf-narration-rate', CONFIG.narrationRate);
      return CONFIG.narrationRate;
    },
    setCount(n){
      CONFIG.narrativeCount = Math.max(1, Math.min(10, Number(n) || CONFIG.narrativeCount));
      ls.s('hf-narration-count', CONFIG.narrativeCount);
      update();
      return CONFIG.narrativeCount;
    },
    pause(){ stopLoop(); },
    resume(){ if (!prefersReduced && !timer) startLoop(); },
    getState(){
      return {
        running: !!timer,
        refreshInterval: CONFIG.refreshInterval,
        narrativeCount: CONFIG.narrativeCount,
        narrationEnabled: CONFIG.narrationEnabled,
        narrationRate: CONFIG.narrationRate
      };
    }
  };

  /* ================== BOOT ================== */
  const boot = () => {
    const container = document.getElementById(CONFIG.containerId);
    if (!container) return console.warn(`[HealthFloNarrative] Container #${CONFIG.containerId} not found`);
    if (prefersReduced) {
      update(); // render once, no timers or speech
      console.info('[HealthFloNarrative] Reduced-motion detected — live updates paused.');
      window.HealthFloNarrative = API;
      return;
    }
    setupObserver();
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    window.HealthFloNarrative = API;
  };

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
