/* ============================================================
 🧠 HealthFlo Narrative Engine v3.3
 + Optional Voice Narration (SpeechSynthesis API)
 ============================================================ */

(function () {
  'use strict';

  const CONFIG = {
    refreshInterval: 7000,
    exaggerationFactor: 1.12,
    containerId: 'hf-ai-insights',
    narrativeCount: 5,
    narrationEnabled: false, // ✅ default OFF
    narrationRate: 1.0 // 0.8 = slow, 1.0 = normal, 1.3 = fast
  };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatPct = (val) => `${val > 0 ? '+' : ''}${val}%`;

  const TEMPLATES = {
    clinical: [
      (v) => `Clinical efficiency improved ${formatPct(v)} this week.`,
      (v) => `Procedural success rates climbed ${formatPct(v)}.`,
      (v) => `Recovery speed rose ${formatPct(v)}, suggesting better follow-up.`,
    ],
    patient: [
      (v) => `Patient satisfaction surged ${formatPct(v)}.`,
      (v) => `${formatPct(v)} boost in digital engagement shows portal adoption.`,
      (v) => `Appointment adherence improved ${formatPct(v)}.`,
    ],
    operational: [
      (v) => `Bed occupancy improved ${formatPct(v)}.`,
      (v) => `Workflow efficiency jumped ${formatPct(v)}.`,
      (v) => `ER throughput improved ${formatPct(v)}.`,
    ],
    financial: [
      (v) => `Revenue per patient increased ${formatPct(v)}.`,
      (v) => `Claim approvals rose ${formatPct(v)}.`,
      (v) => `Cost per admission decreased ${formatPct(v)}.`,
    ],
    strategic: [
      (v) => `Patient loyalty trending ${formatPct(v)} ahead.`,
      (v) => `Referral traffic jumped ${formatPct(v)}.`,
      (v) => `Partnership impact grew ${formatPct(v)}.`,
    ],
  };

  const generateInsight = () => {
    const category = choose(Object.keys(TEMPLATES));
    const value = Math.round(rand(3, 18) * CONFIG.exaggerationFactor);
    return {
      category,
      narrative: choose(TEMPLATES[category])(value),
      timestamp: new Date().toISOString(),
    };
  };

  const generateBatch = () => Array.from({ length: CONFIG.narrativeCount }, generateInsight);

  const renderInsights = (insights) => {
    const container = document.getElementById(CONFIG.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="hf-insights-controls">
        <label>
          <input type="checkbox" id="narration-toggle" ${CONFIG.narrationEnabled ? 'checked' : ''}>
          🔊 Enable Narration
        </label>
        <label>
          Speed: <input type="range" id="narration-speed" min="0.8" max="1.5" step="0.1" value="${CONFIG.narrationRate}">
        </label>
      </div>
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

    // Add click event
    container.querySelectorAll('.hf-insight-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('hf:insightClick', {
          detail: { category: card.dataset.category, text: card.querySelector('.hf-insight-text').innerText }
        }));
      });
    });

    // Handle narration toggle
    document.getElementById('narration-toggle').addEventListener('change', (e) => {
      CONFIG.narrationEnabled = e.target.checked;
    });

    // Handle narration speed
    document.getElementById('narration-speed').addEventListener('input', (e) => {
      CONFIG.narrationRate = parseFloat(e.target.value);
    });
  };

  const narrateInsights = (insights) => {
    if (!CONFIG.narrationEnabled || !window.speechSynthesis) return;

    const text = insights.map((i) => i.narrative).join(' ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = CONFIG.narrationRate;
    speechSynthesis.cancel(); // stop previous narration
    speechSynthesis.speak(utterance);
  };

  const updateInsights = () => {
    const batch = generateBatch();
    renderInsights(batch);
    narrateInsights(batch);
    document.dispatchEvent(new CustomEvent('hf:insightGenerated', { detail: batch }));
  };

  const init = () => {
    if (!document.getElementById(CONFIG.containerId)) {
      console.warn(`[HealthFloInsights] Container #${CONFIG.containerId} not found`);
      return;
    }
    updateInsights();
    setInterval(updateInsights, CONFIG.refreshInterval);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
