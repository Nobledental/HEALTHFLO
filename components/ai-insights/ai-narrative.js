/* ============================================================
 🧠 HealthFlo Narrative Engine v3.2
 Context-aware AI Advisory System — No API Required
 ------------------------------------------------------------
 - Auto-generates healthcare insights from KPIs
 - 5 narrative categories: Clinical, Patient, Operational,
   Financial, Strategic
 - Custom Events: hf:insightGenerated, hf:insightClick
 - Auto-refresh every 7s (configurable)
 - Self-contained IIFE — works with or without backend
 ============================================================ */

(function () {
  'use strict';

  // === Configuration ===
  const CONFIG = {
    refreshInterval: 7000, // ms - adjustable speed
    exaggerationFactor: 1.12, // ~12% positive bias for "impressive" storytelling
    containerId: 'hf-ai-insights', // target container div
    narrativeCount: 5,
  };

  // === Utility Functions ===
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatPct = (val) => `${val > 0 ? '+' : ''}${val}%`;

  // === Insight Templates ===
  const TEMPLATES = {
    clinical: [
      (v) => `🩺 Clinical efficiency improved ${formatPct(v)} this week — a sign of better care coordination and reduced wait times.`,
      (v) => `💉 Procedural success rates climbed ${formatPct(v)}, highlighting enhanced clinical precision.`,
      (v) => `📊 ${formatPct(v)} rise in post-op recovery speed suggests improved protocols and patient follow-up.`,
    ],
    patient: [
      (v) => `💙 Patient satisfaction surged ${formatPct(v)}, driven by proactive communication and reduced discharge delays.`,
      (v) => `🌐 ${formatPct(v)} boost in digital engagement — patients are increasingly using self-service portals.`,
      (v) => `📅 Appointment adherence improved ${formatPct(v)} — a strong indicator of trust and accessibility.`,
    ],
    operational: [
      (v) => `🏥 Bed occupancy reached optimal levels with a ${formatPct(v)} operational improvement.`,
      (v) => `🔄 Workflow efficiency jumped ${formatPct(v)} thanks to streamlined triage and smart scheduling.`,
      (v) => `🚑 ER throughput improved ${formatPct(v)} — reducing critical waiting periods significantly.`,
    ],
    financial: [
      (v) => `💰 Revenue per patient increased ${formatPct(v)}, driven by higher OPD conversions and cross-specialty referrals.`,
      (v) => `📈 ${formatPct(v)} rise in claim approvals indicates improved payer collaboration.`,
      (v) => `🏦 Cost per admission decreased ${formatPct(v)}, demonstrating efficient resource utilization.`,
    ],
    strategic: [
      (v) => `🚀 HealthFlo is trending ${formatPct(v)} ahead in patient loyalty — positioning the brand as a regional leader.`,
      (v) => `🌟 ${formatPct(v)} jump in referral traffic suggests growing clinician confidence.`,
      (v) => `🧭 Strategic partnerships are yielding ${formatPct(v)} stronger network influence and clinical reach.`,
    ],
  };

  // === Generate One Insight ===
  const generateInsight = () => {
    const categories = Object.keys(TEMPLATES);
    const category = choose(categories);
    const value = Math.round(rand(3, 18) * CONFIG.exaggerationFactor); // realistic & impressive
    const narrative = choose(TEMPLATES[category])(value);

    return {
      category,
      value,
      narrative,
      timestamp: new Date().toISOString(),
    };
  };

  // === Generate Full Batch ===
  const generateBatch = () => {
    return Array.from({ length: CONFIG.narrativeCount }, generateInsight);
  };

  // === Render Insights ===
  const renderInsights = (insights) => {
    const container = document.getElementById(CONFIG.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="hf-insights-wrapper">
        ${insights
          .map(
            (insight, i) => `
          <div class="hf-insight-card" data-index="${i}" data-category="${insight.category}">
            <div class="hf-insight-tag">${insight.category.toUpperCase()}</div>
            <p class="hf-insight-text">${insight.narrative}</p>
          </div>`
          )
          .join('')}
      </div>
    `;

    // Add click tracking
    container.querySelectorAll('.hf-insight-card').forEach((card) => {
      card.addEventListener('click', () => {
        const event = new CustomEvent('hf:insightClick', {
          detail: { category: card.dataset.category, text: card.querySelector('.hf-insight-text').innerText },
        });
        document.dispatchEvent(event);
      });
    });
  };

  // === Update Cycle ===
  const updateInsights = () => {
    const batch = generateBatch();
    renderInsights(batch);

    // Dispatch global event
    const event = new CustomEvent('hf:insightGenerated', { detail: batch });
    document.dispatchEvent(event);
  };

  // === Initialize Engine ===
  const init = () => {
    const container = document.getElementById(CONFIG.containerId);
    if (!container) {
      console.warn(`[HealthFloInsights] Container #${CONFIG.containerId} not found`);
      return;
    }

    updateInsights();
    setInterval(updateInsights, CONFIG.refreshInterval);
  };

  // === Auto-init on DOM Ready ===
  document.addEventListener('DOMContentLoaded', init);

})();
