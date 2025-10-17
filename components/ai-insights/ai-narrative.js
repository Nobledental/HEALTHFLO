/* ============================================================
 🧠 HealthFlo AI Narrative Engine v4.0
 - Executive Summary (hybrid tone) + Insight Narratives
 - Auto-refresh every 7s (configurable)
 - Narration toggle + speed slider
 - Custom events: hf:insightGenerated, hf:summaryGenerated, hf:insightClick
 - Zero backend (simulated intelligence)
 ============================================================ */

(function () {
  'use strict';

  const CONFIG = {
    refreshInterval: 7000,
    exaggerationFactor: 1.12,
    containerId: 'hf-ai-insights',
    narrativeCount: 5,
    narrationEnabled: false,
    narrationRate: 1.0,
  };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatPct = (val) => `${val > 0 ? '+' : ''}${val}%`;

  const TEMPLATES = {
    clinical: [
      (v) => `Clinical efficiency improved ${formatPct(v)} this week — reducing wait times and enhancing patient outcomes.`,
      (v) => `Procedural success rates climbed ${formatPct(v)}, highlighting surgical precision and care quality.`,
      (v) => `Post-op recovery accelerated ${formatPct(v)}, showing improved patient pathways.`,
    ],
    patient: [
      (v) => `Patient satisfaction surged ${formatPct(v)}, driven by stronger communication and seamless care.`,
      (v) => `${formatPct(v)} boost in digital engagement indicates higher portal adoption.`,
      (v) => `Appointment adherence improved ${formatPct(v)}, reflecting greater patient trust.`,
    ],
    operational: [
      (v) => `Bed occupancy reached optimal levels with a ${formatPct(v)} operational uplift.`,
      (v) => `Workflow efficiency rose ${formatPct(v)} thanks to triage automation and smart scheduling.`,
      (v) => `ER throughput improved ${formatPct(v)}, reducing critical wait times.`,
    ],
    financial: [
      (v) => `Revenue per patient increased ${formatPct(v)} due to improved care mix and conversions.`,
      (v) => `Claim approvals grew ${formatPct(v)}, reflecting stronger payer collaboration.`,
      (v) => `Cost per admission declined ${formatPct(v)}, enhancing financial sustainability.`,
    ],
    strategic: [
      (v) => `Patient loyalty is trending ${formatPct(v)} ahead — strengthening long-term retention.`,
      (v) => `Referral traffic jumped ${formatPct(v)}, signaling clinician confidence.`,
      (v) => `Strategic partnerships are delivering ${formatPct(v)} greater market influence.`,
    ],
  };

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

  const generateBatch = () => Array.from({ length: CONFIG.narrativeCount }, generateInsight);

  const buildSummary = (insights) => {
    const counts = insights.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});
    const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    let summary = '';
    if (topCategory === 'clinical' || topCategory === 'patient') {
      summary = `📈 Strong momentum in patient care this cycle — clinical outcomes and satisfaction are rising, indicating sustained quality improvements.`;
    } else if (topCategory === 'financial' || topCategory === 'strategic') {
      summary = `🚀 Financial and strategic KPIs are trending positively — growth trajectory remains strong with expanding influence and revenue optimization.`;
    } else {
      summary = `⚙️ Operational performance shows steady progress — positioning HealthFlo for scalable growth across care delivery and patient engagement.`;
    }

    const highlight = choose(insights).narrative;
    summary += ` Notably: ${highlight.replace(/^[^–—-]+–/, '').trim()}`;
    return summary;
  };

  const renderInsights = (insights, summary) => {
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

      <div class="hf-executive-summary" id="hf-executive-summary">
        <h3>📊 AI Executive Summary</h3>
        <p>${summary}</p>
      </div>

      <div class="hf-insights-wrapper">
        ${insights.map((insight, i) => `
          <div class="hf-insight-card narrative" data-index="${i}" data-category="${insight.category}">
            <div class="hf-insight-tag">${insight.category.toUpperCase()}</div>
            <p class="hf-insight-text">${insight.narrative}</p>
          </div>`
        ).join('')}
      </div>
    `;

    container.querySelectorAll('.hf-insight-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('hf:insightClick', {
          detail: { category: card.dataset.category, text: card.querySelector('.hf-insight-text').innerText }
        }));
      });
    });

    document.getElementById('narration-toggle').addEventListener('change', (e) => {
      CONFIG.narrationEnabled = e.target.checked;
    });
    document.getElementById('narration-speed').addEventListener('input', (e) => {
      CONFIG.narrationRate = parseFloat(e.target.value);
    });
  };

  const narrate = (summary, insights) => {
    if (!CONFIG.narrationEnabled || !window.speechSynthesis) return;
    const text = `${summary} ${insights.map((i) => i.narrative).join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = CONFIG.narrationRate;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const update = () => {
    const insights = generateBatch();
    const summary = buildSummary(insights);
    renderInsights(insights, summary);
    narrate(summary, insights);

    document.dispatchEvent(new CustomEvent('hf:insightGenerated', { detail: insights }));
    document.dispatchEvent(new CustomEvent('hf:summaryGenerated', { detail: summary }));
  };

  const init = () => {
    if (!document.getElementById(CONFIG.containerId)) {
      console.warn(`[HealthFloInsights] Container #${CONFIG.containerId} not found`);
      return;
    }
    update();
    setInterval(update, CONFIG.refreshInterval);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
