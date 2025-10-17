/* ==========================================================================
   HealthFlo – Particles Engine (Micro-Cell • Nebula • Data-Stream)
   Purpose: Premium, subtle, white-background friendly motion layer that
            complements the Tech-Luxury brand.

   ✅ No external libs required (pure Canvas2D, requestAnimationFrame)
   ✅ Respects user config (quality, enable/disable) and reduced-motion
   ✅ Config-driven + runtime API (setMode, setSpeed, pause/resume, destroy)
   ✅ Auto-binds to #hero-animation <canvas> from index.html

   Modes:
     - "micro-cell"  : soft particle field + proximity links (premium, subtle)
     - "nebula-flow" : slow fluid drift (luxury ambiance)
     - "data-stream" : vertical streams / telemetry ticks (SaaS vibe)

   Events:
     - window.dispatchEvent(new CustomEvent('hf:particlesEnable'))
     - window.dispatchEvent(new CustomEvent('hf:particlesDisable'))
     - window.addEventListener('hf:configChanged', e => { ... })
     - window.addEventListener('hf:resize', () => system.resize())

   API:
     window.HealthFloParticles.init({ quality?: 'low'|'medium'|'high', mode?: string })
     window.HealthFloParticles.setMode('micro-cell'|'nebula-flow'|'data-stream')
     window.HealthFloParticles.setSpeed(multiplier:number)  // e.g., 0.7 .. 2.0
     window.HealthFloParticles.pause()
     window.HealthFloParticles.resume()
     window.HealthFloParticles.destroy()
   ========================================================================== */

window.HealthFloParticles = (function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Palette — Deep Indigo & Emerald + Sky/Aqua accents (no neon)
  const COLORS = {
    indigo: 'rgba(43,47,119,',     // tail alpha
    emerald: 'rgba(29,191,115,',
    aqua: 'rgba(94,234,212,',
    sky: 'rgba(56,189,248,',
    ink: 'rgba(15,23,42,'          // for ultra-subtle graphite
  };

  // Quality presets influence particle count + link radius + render budget
  const QUALITY_PRESETS = {
    low:    { particles: 48,  linkDist: 90,  streams: 36,  density: 0.7,  trail: 0.08 },
    medium: { particles: 92,  linkDist: 120, streams: 64,  density: 1.0,  trail: 0.06 },
    high:   { particles: 140, linkDist: 145, streams: 96,  density: 1.25, trail: 0.05 }
  };

  // Utilities
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand  = (a, b) => a + Math.random() * (b - a);

  class ParticleSystem {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.mode = opts.mode || 'micro-cell';
      this.quality = (opts.quality || 'medium');
      this.speed = clamp(opts.speed || 1, 0.3, 2.5);
      this.running = false;

      // Internal state
      this.frame = 0;
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.resize();

      // Build mode-specific buffers
      this._build();
    }

    _preset() { return QUALITY_PRESETS[this.quality] || QUALITY_PRESETS.medium; }

    resize() {
      const { canvas, dpr } = this;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      this.w = canvas.width; this.h = canvas.height;
      if (this.ctx) this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.ctx) this.ctx.scale(dpr, dpr);
      this._requestRebuild = true;
    }

    setMode(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      this._build();
    }

    setSpeed(mult) {
      this.speed = clamp(mult, 0.3, 2.5);
    }

    setQuality(q) {
      if (q === this.quality) return;
      this.quality = q;
      this._build();
    }

    _build() {
      const p = this._preset();
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;

      // Common clear
      this.clear(true);

      // Allocate per-mode buffers
      if (this.mode === 'micro-cell') {
        const count = Math.round(p.particles * (width * height) / (800 * 480) * p.density);
        this.nodes = new Array(clamp(count, 24, 220)).fill(0).map(() => ({
          x: rand(0, width), y: rand(0, height),
          vx: rand(-0.24, 0.24), vy: rand(-0.24, 0.24),
          r: rand(1, 2.2)
        }));
      } else if (this.mode === 'nebula-flow') {
        // Semi-procedural flow field — lightweight value noise
        const cols = Math.ceil(width / 28);
        const rows = Math.ceil(height / 28);
        this.flow = { cols, rows, t: Math.random() * 1000 };
        this.particles = new Array(Math.round(180 * (width * height) / (1000 * 700) * p.density))
          .fill(0).map(() => ({
            x: rand(0, width), y: rand(0, height),
            life: rand(30, 140), maxLife: rand(120, 260)
          }));
      } else if (this.mode === 'data-stream') {
        // Vertical telemetry columns with soft ticks
        const cols = Math.round((p.streams * (width / 1024)) * p.density);
        this.streams = new Array(clamp(cols, 16, 140)).fill(0).map((_, i) => ({
          x: (i + 0.5) * (width / cols),
          y: rand(-height, 0),
          speed: rand(40, 120), // px/s
          gap: rand(16, 28),
          len: rand(60, 140)
        }));
        this.lastTs = performance.now();
      }
    }

    // Lightweight hash for value noise
    _hash(x, y, t) {
      const s = Math.sin(x * 127.1 + y * 311.7 + t * 0.001) * 43758.5453;
      return s - Math.floor(s);
    }

    // Clear with subtle trail fade (premium)
    clear(hard = false) {
      const { ctx } = this;
      const rect = this.canvas.getBoundingClientRect();
      if (hard) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        return;
      }
      // Soft fade to create trails (white bg friendly)
      const alpha = this._preset().trail;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this._loop();
    }

    pause() { this.running = false; }
    resume() { if (!this.running) { this.running = true; this._loop(); } }

    destroy() {
      this.running = false;
      this.nodes = null; this.particles = null; this.streams = null; this.flow = null;
      this.clear(true);
    }

    _loop() {
      if (!this.running) return;
      this.frame++;
      this.render();
      requestAnimationFrame(() => this._loop());
    }

    render() {
      const { ctx, mode } = this;
      if (!ctx) return;

      // Trail fade except micro-cell link lines which redraw
      this.clear(mode === 'micro-cell' ? true : false);

      if (mode === 'micro-cell') return this._renderMicroCell();
      if (mode === 'nebula-flow') return this._renderNebulaFlow();
      if (mode === 'data-stream') return this._renderDataStream();
    }

    _renderMicroCell() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      const { nodes } = this;
      if (!nodes) return;
      const p = this._preset();
      const linkDist = p.linkDist;

      // Move + bounce
      for (const n of nodes) {
        n.x += n.vx * this.speed;
        n.y += n.vy * this.speed;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      // Draw nodes
      for (const n of nodes) {
        this.ctx.beginPath();
        this.ctx.fillStyle = COLORS.indigo + '0.25)';
        this.ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Proximity links (very soft gradient)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const d = Math.sqrt(d2);
            const t = 1 - d / linkDist;
            const grd = this.ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grd.addColorStop(0, COLORS.emerald + (0.14 * t).toFixed(3) + ')');
            grd.addColorStop(1, COLORS.sky + (0.14 * t).toFixed(3) + ')');
            this.ctx.strokeStyle = grd;
            this.ctx.lineWidth = Math.max(0.6, 1.2 * t);
            this.ctx.beginPath();
            this.ctx.moveTo(a.x, a.y);
            this.ctx.lineTo(b.x, b.y);
            this.ctx.stroke();
          }
        }
      }
    }

    _renderNebulaFlow() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      const { particles, flow } = this;
      if (!particles || !flow) return;

      flow.t += 0.6 * this.speed; // evolve field slowly

      for (const p of particles) {
        // Compute pseudo-noise angle from 4 nearby hashes
        const gx = Math.floor(p.x / 36), gy = Math.floor(p.y / 36);
        const n00 = this._hash(gx, gy, flow.t);
        const n10 = this._hash(gx + 1, gy, flow.t);
        const n01 = this._hash(gx, gy + 1, flow.t);
        const n11 = this._hash(gx + 1, gy + 1, flow.t);
        const u = p.x / 36 - gx, v = p.y / 36 - gy;
        const nx0 = n00 * (1 - u) + n10 * u;
        const nx1 = n01 * (1 - u) + n11 * u;
        const n  = nx0 * (1 - v) + nx1 * v;

        const angle = n * Math.PI * 2;
        p.x += Math.cos(angle) * 0.7 * this.speed;
        p.y += Math.sin(angle) * 0.7 * this.speed;

        // Wrap
        if (p.x < 0) p.x = width; else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height; else if (p.y > height) p.y = 0;

        // Fade stroke (ink/aqua mix)
        this.ctx.beginPath();
        this.ctx.strokeStyle = COLORS.ink + '0.06)';
        if (Math.random() < 0.08) this.ctx.strokeStyle = COLORS.aqua + '0.06)';
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - Math.cos(angle) * 6, p.y - Math.sin(angle) * 6);
        this.ctx.stroke();

        // life cycle (occasional reposition to keep field fresh)
        if (--p.life < 0) {
          p.x = rand(0, width); p.y = rand(0, height);
          p.life = rand(30, 140); p.maxLife = rand(120, 260);
        }
      }
    }

    _renderDataStream() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      const { streams } = this;
      if (!streams) return;

      const now = performance.now();
      const dt = clamp((now - (this.lastTs || now)) / 1000, 0, 0.05);
      this.lastTs = now;

      // soft grid lines (very subtle)
      this.ctx.save();
      this.ctx.globalAlpha = 0.06;
      this.ctx.strokeStyle = COLORS.indigo + '1)';
      this.ctx.lineWidth = 1;
      const gridGap = 48;
      for (let x = 0; x < width; x += gridGap) {
        this.ctx.beginPath(); this.ctx.moveTo(x + 0.5, 0); this.ctx.lineTo(x + 0.5, height); this.ctx.stroke();
      }
      this.ctx.restore();

      // streams
      for (const s of streams) {
        s.y += s.speed * dt * this.speed;
        if (s.y - s.len > height) {
          s.y = -rand(0, height * 0.5);
          s.speed = rand(40, 120);
          s.gap = rand(16, 28);
          s.len = rand(60, 140);
        }

        // vertical line segment
        const y0 = s.y - s.len, y1 = s.y;
        const grd = this.ctx.createLinearGradient(s.x, y0, s.x, y1);
        grd.addColorStop(0, COLORS.sky + '0)');
        grd.addColorStop(0.6, COLORS.aqua + '0.22)');
        grd.addColorStop(1, COLORS.emerald + '0)');
        this.ctx.strokeStyle = grd;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(s.x, y0);
        this.ctx.lineTo(s.x, y1);
        this.ctx.stroke();

        // ticks (telemetry dots)
        for (let y = y0; y < y1; y += s.gap) {
          this.ctx.beginPath();
          this.ctx.fillStyle = COLORS.indigo + '0.18)';
          this.ctx.arc(s.x, y, 1.3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  // Singleton holder
  let system = null;

  function init(userOpts = {}) {
    if (prefersReduced) return; // Respect accessibility
    const cfg = (window.HealthFlo && window.HealthFlo.config) || {};
    if (cfg.particlesEnabled === false) return;

    // Bind to hero canvas by default
    const canvas = document.getElementById('hero-animation');
    if (!canvas) return;

    // Create system
    system = new ParticleSystem(canvas, {
      quality: userOpts.quality || cfg.animationQuality || 'medium',
      mode: userOpts.mode || 'micro-cell',
      speed: clamp(userOpts.speed || 1, 0.3, 2.5)
    });

    // Start loop
    system.start();

    // Resize hooks
    window.addEventListener('resize', () => system && system.resize());
    window.addEventListener('hf:resize', () => system && system.resize());

    // Enable/Disable hooks
    window.addEventListener('hf:particlesEnable', () => {
      if (!system) {
        init(userOpts);
      } else {
        system.resume();
      }
    });

    window.addEventListener('hf:particlesDisable', () => {
      if (system) system.pause();
    });

    // React to global config changes (quality / enable toggles)
    window.addEventListener('hf:configChanged', (e) => {
      const next = e.detail || {};
      if (!system) return;
      if (typeof next.animationQuality === 'string') {
        system.setQuality(next.animationQuality);
      }
      if (next.particlesEnabled === false) {
        system.pause();
      } else if (next.particlesEnabled === true) {
        system.resume();
      }
    });
  }

  // Public API
  function setMode(mode) { if (system) system.setMode(mode); }
  function setSpeed(mult) { if (system) system.setSpeed(mult); }
  function pause() { if (system) system.pause(); }
  function resume() { if (system) system.resume(); }
  function destroy() { if (system) { system.destroy(); system = null; } }

  return { init, setMode, setSpeed, pause, resume, destroy };
})();
