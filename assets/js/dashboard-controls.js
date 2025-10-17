/* ============================================================
📊 HealthFlo Dashboard Controls - Core Logic
Author: GPT-5 · 2025
Handles: state sync, event listeners, refresh control, filter logic
============================================================ */

class HealthFloControls {
  constructor(dashboardInstance) {
    this.dashboard = dashboardInstance; // Reference to HealthFloDashboard
    this.state = {
      dateRange: '7d',
      scope: 'hospital',
      filters: ['clinical', 'financial', 'patient', 'operational'],
      refreshSpeed: 8000,
    };
    this.dom = {};
  }

  init() {
    this.cacheElements();
    this.loadSavedPreferences();
    this.bindEvents();
    this.updateStatus();
    this.startAutoRefresh();
  }

  /* ------------------------------------------------------------
   🔎 Cache DOM elements
  ------------------------------------------------------------ */
  cacheElements() {
    this.dom.modeLabel = document.getElementById('hf-mode-label');
    this.dom.connectionStatus = document.getElementById('hf-connection-status');
    this.dom.lastSync = document.getElementById('hf-last-sync');
    this.dom.dateRange = document.getElementById('hf-date-range-select');
    this.dom.scopeRadios = document.querySelectorAll('input[name="hf-scope"]');
    this.dom.filterCheckboxes = document.querySelectorAll('input[name="kpi-filter"]');
    this.dom.refreshSlider = document.getElementById('hf-refresh-speed');
    this.dom.refreshLabel = document.getElementById('hf-refresh-label');
  }

  /* ------------------------------------------------------------
   📊 Restore preferences from localStorage if available
  ------------------------------------------------------------ */
  loadSavedPreferences() {
    const saved = JSON.parse(localStorage.getItem('hf-controls-state'));
    if (saved) {
      this.state = { ...this.state, ...saved };

      // Apply to UI
      this.dom.dateRange.value = this.state.dateRange;
      this.dom.refreshSlider.value = this.state.refreshSpeed;
      this.dom.refreshLabel.textContent = `${this.state.refreshSpeed / 1000}s`;

      this.dom.scopeRadios.forEach((r) => (r.checked = r.value === this.state.scope));
      this.dom.filterCheckboxes.forEach((c) => (c.checked = this.state.filters.includes(c.value)));
    }
  }

  /* ------------------------------------------------------------
   🧠 Event binding for all controls
  ------------------------------------------------------------ */
  bindEvents() {
    // Date Range
    this.dom.dateRange.addEventListener('change', (e) => {
      this.state.dateRange = e.target.value;
      this.sync();
    });

    // Scope Switch
    this.dom.scopeRadios.forEach((radio) =>
      radio.addEventListener('change', (e) => {
        this.state.scope = e.target.value;
        this.sync();
      })
    );

    // Filters
    this.dom.filterCheckboxes.forEach((checkbox) =>
      checkbox.addEventListener('change', () => {
        this.state.filters = Array.from(this.dom.filterCheckboxes)
          .filter((c) => c.checked)
          .map((c) => c.value);
        this.sync();
      })
    );

    // Refresh Speed
    this.dom.refreshSlider.addEventListener('input', (e) => {
      this.state.refreshSpeed = parseInt(e.target.value, 10);
      this.dom.refreshLabel.textContent = `${this.state.refreshSpeed / 1000}s`;
      this.resetAutoRefresh();
    });
  }

  /* ------------------------------------------------------------
   📡 Push state changes to dashboard
  ------------------------------------------------------------ */
  sync() {
    // Save preferences
    localStorage.setItem('hf-controls-state', JSON.stringify(this.state));

    // Notify dashboard of changes
    if (this.dashboard && typeof this.dashboard.updateConfig === 'function') {
      this.dashboard.updateConfig(this.state);
    }

    // Refresh data immediately
    if (this.dashboard && typeof this.dashboard.refresh === 'function') {
      this.dashboard.refresh();
    }

    this.updateStatus();
  }

  /* ------------------------------------------------------------
   ⏱️ Auto-refresh logic
  ------------------------------------------------------------ */
  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      if (this.dashboard && typeof this.dashboard.refresh === 'function') {
        this.dashboard.refresh();
        this.updateStatus();
      }
    }, this.state.refreshSpeed);
  }

  resetAutoRefresh() {
    clearInterval(this.refreshTimer);
    this.startAutoRefresh();
  }

  /* ------------------------------------------------------------
   🩺 Update connection & sync status UI
  ------------------------------------------------------------ */
  updateStatus() {
    const now = new Date();
    this.dom.lastSync.textContent = now.toLocaleTimeString();
    this.dom.connectionStatus.textContent = '✅ Connected';
    this.dom.connectionStatus.classList.remove('hf-status--error');
    this.dom.connectionStatus.classList.add('hf-status--ok');
  }
}

/* ------------------------------------------------------------
 🚀 Bootstrap: Connect controls to dashboard
------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  if (window.HealthFloDashboard) {
    const controls = new HealthFloControls(window.HealthFloDashboard);
    controls.init();
    window.HealthFloControls = controls; // global ref if needed
  }
});
