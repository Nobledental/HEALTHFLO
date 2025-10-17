/**
 * HealthFlo Hospitals – Ultra-Dynamic Cinematic Engine (Part 1A)
 * Requires:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollSmoother.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/SplitText.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.js"></script>
 */

class HealthFloCore {
  static initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;
    window.addEventListener('load', () => {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 800);
    });
  }

  static initTheme() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    const setTheme = (theme) => {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('hf-theme', theme);
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    };
    const saved = localStorage.getItem('hf-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
    toggle.addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  static initSmoothScroll() {
    if (typeof ScrollSmoother === 'undefined') return;
    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.3,
      effects: true,
    });
  }

  static initNav() {
    const header = document.querySelector('.header');
    const toggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
      });
    }

    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        toggle.setAttribute(
          'aria-expanded',
          navLinks.classList.contains('open').toString()
        );
      });
      navLinks.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => navLinks.classList.remove('open'))
      );
    }
  }
}

/* =========================
   HERO ANIMATION MODULE
========================= */
class HeroAnimation {
  static init() {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') return;

    const headline = document.querySelector('.hero-content h1');
    if (headline) {
      const split = new SplitText(headline, { type: 'chars' });
      gsap.from(split.chars, {
        opacity: 0,
        y: 50,
        stagger: 0.03,
        duration: 1.2,
        ease: 'power3.out',
      });
    }

    gsap.from('.hero-content .subtext', {
      opacity: 0,
      y: 30,
      duration: 1,
      delay: 0.4,
      ease: 'power2.out',
    });

    gsap.from('.cta-group a', {
      opacity: 0,
      y: 25,
      stagger: 0.1,
      duration: 0.8,
      delay: 0.6,
      ease: 'back.out(1.7)',
    });

    // Parallax motion on scroll
    gsap.to('.hero-showcase', {
      yPercent: -8,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}

/* =========================
   PIXI.JS BACKGROUND ENGINE
========================= */
class ParticleScene {
  constructor(canvasSelector) {
    this.app = null;
    this.particles = [];
    this.container = null;
    this.selector = canvasSelector;
  }

  init() {
    const canvas = document.querySelector(this.selector);
    if (!canvas || typeof PIXI === 'undefined') return;

    this.app = new PIXI.Application({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      view: canvas,
    });

    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // Create ~120 micro-particles
    for (let i = 0; i < 120; i++) {
      const g = new PIXI.Graphics();
      const radius = Math.random() * 3 + 1.2;
      g.beginFill(0x4c6ef5, Math.random() * 0.45 + 0.2);
      g.drawCircle(0, 0, radius);
      g.endFill();

      g.x = Math.random() * window.innerWidth;
      g.y = Math.random() * window.innerHeight;
      g.vx = (Math.random() - 0.5) * 0.4;
      g.vy = (Math.random() - 0.5) * 0.4;

      this.container.addChild(g);
      this.particles.push(g);
    }

    this.app.ticker.add(this.animate.bind(this));
    window.addEventListener('resize', () => this.onResize());
  }

  animate() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = window.innerWidth;
      if (p.x > window.innerWidth) p.x = 0;
      if (p.y < 0) p.y = window.innerHeight;
      if (p.y > window.innerHeight) p.y = 0;
    }
  }

  onResize() {
    this.particles.forEach((p) => {
      if (p.x > window.innerWidth) p.x = window.innerWidth * Math.random();
      if (p.y > window.innerHeight) p.y = window.innerHeight * Math.random();
    });
  }
}

/* =========================
   INITIALIZATION
========================= */
document.addEventListener('DOMContentLoaded', () => {
  HealthFloCore.initPreloader();
  HealthFloCore.initTheme();
  HealthFloCore.initSmoothScroll();
  HealthFloCore.initNav();

  HeroAnimation.init();

  const particleScene = new ParticleScene('#hero-particle-canvas');
  particleScene.init();
});

/* ================================================================
   📊 HealthFloDashboard v1.0 — Part 3-A-1A
   Config-driven, accessible, API-ready KPI Dashboard Module
   Author: HealthFlo Engineering
   ================================================================= */

/**
 * HealthFloDashboard
 * - Handles rendering of KPI cards, updating values, formatting, and accessibility
 * - Works in Demo Mode (simulated data) or Live Mode (ready for API integration)
 * - Designed for hospitals and patients: 10+6 grouped KPIs with sparklines
 */
class HealthFloDashboard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error("Dashboard container not found.");

    // === Config ===
    this.options = {
      refreshInterval: options.refreshInterval || 8000,
      mode: options.mode || "demo", // 'demo' or 'live'
      apiEndpoint: options.apiEndpoint || null,
    };

    // === KPI Configuration ===
    // Each KPI card is defined with key metadata: id, label, type, unit, format
    this.kpis = [
      // 📊 HOSPITAL KPIs
      { id: "hospitals", label: "Hospitals Automated", type: "count", unit: "", category: "hospital" },
      { id: "claims", label: "Claims Processed", type: "count", unit: "", category: "hospital" },
      { id: "approvalTime", label: "Avg. Pre-Auth Time", type: "duration", unit: "s", category: "hospital" },
      { id: "recoveryRate", label: "Claim Recovery Rate", type: "percentage", unit: "%", category: "hospital" },
      { id: "denialsPrevented", label: "Denials Prevented", type: "count", unit: "", category: "hospital" },
      { id: "agingReduction", label: "A/R Aging Reduction", type: "percentage", unit: "%", category: "hospital" },
      { id: "avgAppealTime", label: "Avg. Appeal Resolution", type: "duration", unit: "days", category: "hospital" },
      { id: "autoPacket", label: "Packets Auto-Generated", type: "count", unit: "", category: "hospital" },
      { id: "payorCoverage", label: "Payor Coverage", type: "percentage", unit: "%", category: "hospital" },
      { id: "roi", label: "RCM ROI Growth", type: "percentage", unit: "%", category: "hospital" },

      // 🧑‍⚕️ PATIENT KPIs
      { id: "patientsAssisted", label: "Patients Assisted", type: "count", unit: "", category: "patient" },
      { id: "satisfaction", label: "Patient Satisfaction", type: "percentage", unit: "%", category: "patient" },
      { id: "chatResponse", label: "Avg. Concierge Response", type: "duration", unit: "min", category: "patient" },
      { id: "financingUsed", label: "Zero-Interest Plans", type: "count", unit: "", category: "patient" },
      { id: "multilingualOnboarding", label: "Multilingual Onboardings", type: "count", unit: "", category: "patient" },
      { id: "claimTrackerUsage", label: "Claim Tracker Engagement", type: "percentage", unit: "%", category: "patient" },
    ];

    // Internal state
    this.data = {};
    this.intervals = [];

    // Initialize dashboard
    this.renderDashboard();
    this.loadData();
    this.startAutoUpdate();
  }

  /* ------------------------------------------------------------------
   🧠 Smart Formatters
   ------------------------------------------------------------------ */
  formatValue(value, type, unit) {
    if (value === null || value === undefined || isNaN(value)) return "--";

    switch (type) {
      case "currency":
        return `₹${value.toLocaleString("en-IN")}`;
      case "percentage":
        return `${value.toFixed(1)}${unit}`;
      case "duration":
        return `${value}${unit}`;
      case "count":
      default:
        return value.toLocaleString("en-IN");
    }
  }

  formatDelta(delta) {
    if (delta === 0) return `<span class="delta neutral">↔ 0%</span>`;
    const sign = delta > 0 ? "▲" : "▼";
    const cls = delta > 0 ? "positive" : "negative";
    return `<span class="delta ${cls}">${sign} ${Math.abs(delta).toFixed(1)}%</span>`;
  }

  /* ------------------------------------------------------------------
   🏗️ DOM Builder
   ------------------------------------------------------------------ */
  renderDashboard() {
    this.container.innerHTML = `
      <div class="hf-dashboard__header">
        <h2 class="hf-dashboard__title">HealthFlo Revenue Intelligence</h2>
        <div class="hf-dashboard__controls">
          <button id="modeToggle" aria-pressed="${this.options.mode === "demo"}" aria-label="Toggle Demo Mode">
            ${this.options.mode === "demo" ? "Demo Mode" : "Live Mode"}
          </button>
          <label for="speedControl">⏱️ Speed:</label>
          <input type="range" id="speedControl" min="4000" max="20000" step="1000" value="${this.options.refreshInterval}">
        </div>
      </div>

      <div class="hf-dashboard__groups">
        <section class="hf-dashboard__group" aria-labelledby="kpi-hospital">
          <h3 id="kpi-hospital">🏥 Hospital Performance</h3>
          <div class="hf-dashboard__grid" id="hospital-kpis"></div>
        </section>

        <section class="hf-dashboard__group" aria-labelledby="kpi-patient">
          <h3 id="kpi-patient">👨‍👩‍👧‍👦 Patient Experience</h3>
          <div class="hf-dashboard__grid" id="patient-kpis"></div>
        </section>
      </div>

      <div class="hf-dashboard__timestamp" role="status" aria-live="polite"></div>
    `;

    // Render cards
    this.kpis.forEach((kpi) => {
      const card = document.createElement("div");
      card.className = "hf-kpi-card";
      card.setAttribute("data-id", kpi.id);
      card.setAttribute("role", "group");
      card.setAttribute("aria-label", `${kpi.label} KPI`);

      card.innerHTML = `
        <div class="hf-kpi-card__label">${kpi.label}</div>
        <div class="hf-kpi-card__value" id="${kpi.id}-value">--</div>
        <div class="hf-kpi-card__delta" id="${kpi.id}-delta"></div>
        <canvas class="hf-kpi-sparkline" id="${kpi.id}-spark"></canvas>
      `;

      const targetGrid = kpi.category === "hospital" ? "#hospital-kpis" : "#patient-kpis";
      this.container.querySelector(targetGrid).appendChild(card);
    });

    // Attach listeners
    document.getElementById("modeToggle").addEventListener("click", () => this.toggleMode());
    document.getElementById("speedControl").addEventListener("input", (e) => this.updateSpeed(e.target.value));
  }

  /* ------------------------------------------------------------------
   🔄 Demo Data Generator / API Loader
   ------------------------------------------------------------------ */
  async loadData() {
    if (this.options.mode === "live" && this.options.apiEndpoint) {
      try {
        const res = await fetch(this.options.apiEndpoint);
        this.data = await res.json();
      } catch (e) {
        console.warn("Live API failed, falling back to demo data.");
        this.data = this.generateDemoData();
      }
    } else {
      this.data = this.generateDemoData();
    }
    this.updateDashboard();
  }

  generateDemoData() {
    const data = {};
    this.kpis.forEach((kpi) => {
      const base = Math.random() * 1000;
      const fluctuation = (Math.random() - 0.5) * 0.15;
      const delta = fluctuation * 100;

      data[kpi.id] = {
        value: Math.round(base * (1 + fluctuation)),
        delta: delta,
        history: Array.from({ length: 12 }, () => Math.round(base * (1 + (Math.random() - 0.5) * 0.2))),
      };
    });
    return data;
  }
}

/* ================================================================
   🧭 Experience Hub — handles tab state & demo toggles
   ================================================================ */
class ExperienceHub {
  static init(dashboardInstance) {
    this.dashboard = dashboardInstance;
    this.toggleButton = null;
    this.bindTabs();
    this.bindDemoToggle();
  }

  static bindTabs() {
    const tabs = document.querySelectorAll('.experience-tab');
    const panels = document.querySelectorAll('.experience-panel');
    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.experienceTarget;
        tabs.forEach((btn) => {
          btn.classList.toggle('active', btn === tab);
          btn.setAttribute('aria-selected', (btn === tab).toString());
        });

        panels.forEach((panel) => {
          const isMatch = panel.dataset.experience === target;
          panel.classList.toggle('active', isMatch);
          panel.toggleAttribute('hidden', !isMatch);
        });
      });
    });
  }

  static bindDemoToggle() {
    this.toggleButton = document.querySelector('[data-action="toggle-demo"]');
    if (!this.toggleButton || !this.dashboard) return;

    this.refreshDemoToggle();

    this.toggleButton.addEventListener('click', () => {
      this.dashboard.toggleMode();
      this.refreshDemoToggle();
    });
  }

  static refreshDemoToggle() {
    if (!this.toggleButton || !this.dashboard) return;
    const isDemo = this.dashboard.options.mode === 'demo';
    this.toggleButton.textContent = isDemo ? 'Switch to Live Preview' : 'Switch back to Demo Mode';
    this.toggleButton.setAttribute('aria-pressed', isDemo.toString());
  }
}

/* ================================================================
   📊 HealthFloDashboard v1.0 — Part 3-A-1B
   Live auto-updates, sparklines, timestamp refresh system
   ================================================================= */

HealthFloDashboard.prototype.updateDashboard = function () {
  const now = new Date().toLocaleTimeString();
  const timestamp = this.container.querySelector(".hf-dashboard__timestamp");
  timestamp.textContent = `📡 Last updated: ${now}`;

  this.kpis.forEach((kpi) => {
    const { value, delta } = this.data[kpi.id];
    const valueEl = document.getElementById(`${kpi.id}-value`);
    const deltaEl = document.getElementById(`${kpi.id}-delta`);

    // Animated number transitions
    if (typeof gsap !== "undefined") {
      gsap.to(valueEl, {
        duration: 1.2,
        textContent: this.formatValue(value, kpi.type, kpi.unit),
        snap: { textContent: 1 },
        ease: "power2.out",
      });
    } else {
      valueEl.textContent = this.formatValue(value, kpi.type, kpi.unit);
    }

    deltaEl.innerHTML = this.formatDelta(delta);

    // Draw sparkline
    this.renderSparkline(`${kpi.id}-spark`, this.data[kpi.id].history);
  });
};

/* ------------------------------------------------------------------
 📈 Sparkline Generator (Canvas)
------------------------------------------------------------------ */
HealthFloDashboard.prototype.renderSparkline = function (canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = (canvas.width = 120);
  const h = (canvas.height = 40);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const scaleX = w / (data.length - 1);
  const scaleY = (h - 10) / (max - min || 1);

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(0, h - (data[0] - min) * scaleY);

  for (let i = 1; i < data.length; i++) {
    const x = i * scaleX;
    const y = h - (data[i] - min) * scaleY;
    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = "#4c6ef5";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Fill gradient under line
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "rgba(76, 110, 245, 0.3)");
  gradient.addColorStop(1, "rgba(76, 110, 245, 0)");
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
};

/* ------------------------------------------------------------------
 🔁 Auto Refresh + Interval Handling
------------------------------------------------------------------ */
HealthFloDashboard.prototype.startAutoUpdate = function () {
  this.stopAutoUpdate();
  const interval = setInterval(() => this.loadData(), this.options.refreshInterval);
  this.intervals.push(interval);
};

HealthFloDashboard.prototype.stopAutoUpdate = function () {
  this.intervals.forEach(clearInterval);
  this.intervals = [];
};

/* ------------------------------------------------------------------
 🔀 Mode & Speed Controls
------------------------------------------------------------------ */
HealthFloDashboard.prototype.toggleMode = function () {
  this.options.mode = this.options.mode === "demo" ? "live" : "demo";
  document.getElementById("modeToggle").textContent =
    this.options.mode === "demo" ? "Demo Mode" : "Live Mode";
  this.loadData();
  if (typeof ExperienceHub !== "undefined" && ExperienceHub.refreshDemoToggle) {
    ExperienceHub.refreshDemoToggle();
  }
};

HealthFloDashboard.prototype.updateSpeed = function (newSpeed) {
  this.options.refreshInterval = parseInt(newSpeed, 10);
  this.startAutoUpdate();
};

/* ------------------------------------------------------------------
 🧪 Initialization on DOM ready
------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const dashboardContainer = document.getElementById("healthflo-dashboard");
  if (!dashboardContainer) return;
  
  const dashboard = new HealthFloDashboard("healthflo-dashboard", {
    mode: "demo",
    refreshInterval: 8000,
  });

  window.healthFloDashboard = dashboard;
  ExperienceHub.init(dashboard);
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.from("#healthflo-dashboard", {
      opacity: 0,
      y: 40,
      duration: 1.2,
      scrollTrigger: {
        trigger: "#healthflo-dashboard",
        start: "top 80%",
      },
    });
  }
});
