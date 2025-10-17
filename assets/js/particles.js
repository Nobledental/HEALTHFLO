/* ==========================================================================
   HealthFlo – Particles Engine (Micro-Cell • Nebula • Data-Stream)
   Upgraded production build — brand-tuned, theme-aware, performant, accessible.

   ✅ Pure Canvas2D, no deps
   ✅ Theme aware (light/dark) + reduced-motion respectful
   ✅ Quality presets + runtime API (setMode, setSpeed, setQuality, pause/resume/destroy)
   ✅ Auto-binds to #hero-animation and pauses when off-screen / tab hidden
   ✅ Pointer “attractor” (subtle) + click to cycle modes

   API:
     window.HealthFloParticles.init({ quality?: 'low'|'medium'|'high', mode?: string, speed?: number })
     window.HealthFloParticles.setMode('micro-cell'|'nebula-flow'|'data-stream')
     window.HealthFloParticles.setSpeed(multiplier:number)           // 0.3 .. 2.5
     window.HealthFloParticles.setQuality('low'|'medium'|'high')
     window.HealthFloParticles.pause()
     window.HealthFloParticles.resume()
     window.HealthFloParticles.destroy()
   ========================================================================== */

window.HealthFloParticles = (function () {
  'use strict';

  /* ---------------------------------------
   * Config / palette
   * ------------------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Brand palette — Deep Indigo & Emerald + Sky/Aqua accents
  const COLORS = {
    indigo: (a=1)=>`rgba(43,47,119,${a})`,
    emerald:(a=1)=>`rgba(16,185,129,${a})`,
    aqua:   (a=1)=>`rgba(94,234,212,${a})`,
    sky:    (a=1)=>`rgba(56,189,248,${a})`,
    ink:    (a=1)=>`rgba(15,23,42,${a})`,
    white:  (a=1)=>`rgba(255,255,255,${a})`,
    night:  (a=1)=>`rgba(2,6,23,${a})`
  };

  const QUALITY = {
    low:    { particles: 42,  linkDist: 90,  streams: 28,  density: 0.7,  trail: 0.10 },
    medium: { particles: 92,  linkDist: 120, streams: 64,  density: 1.0,  trail: 0.07 },
    high:   { particles: 148, linkDist: 150, streams: 96,  density: 1.25, trail: 0.05 }
  };

  // Utils
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand  = (a, b) => a + Math.random() * (b - a);

  const isDark = () => (document.documentElement.getAttribute('data-theme') === 'dark');

  /* ---------------------------------------
   * Particle System
   * ------------------------------------- */
  class ParticleSystem {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.quality = (opts.quality || 'medium');
      this.mode = (opts.mode || 'micro-cell'); // 'micro-cell' | 'nebula-flow' | 'data-stream'
      this.speed = clamp(opts.speed || 1, 0.3, 2.5);

      this.running = false;
      this.visible = true; // IO visibility
      this.frame = 0;
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.pointer = { x: null, y: null, active: false };

      this._bindAccessibility();
      this.resize(true);
      this._build();
      this._bindInteractions();
      this._bindLifecycle();
    }

    preset() { return QUALITY[this.quality] || QUALITY.medium; }

    /* ---------- Lifecycle ---------- */
    start() {
      if (this.running) return;
      this.running = true;
      this._loop();
    }
    pause() { this.running = false; }
    resume() { if (!this.running) { this.running = true; this._loop(); } }
    destroy() {
      this.pause();
      this._teardownInteractions();
      this.nodes = this.particles = this.streams = this.flow = null;
      this.clear(true);
    }

    _loop() {
      if (!this.running) return;
      if (this.visible) this.render();
      requestAnimationFrame(() => this._loop());
    }

    _bindLifecycle() {
      // Pause when tab hidden
      this._onVis = () => { document.hidden ? this.pause() : this.resume(); };
      document.addEventListener('visibilitychange', this._onVis);

      // Pause when off-screen (IntersectionObserver)
      if ('IntersectionObserver' in window) {
        this._io = new IntersectionObserver((ents) => {
          ents.forEach(e => { this.visible = e.isIntersecting; });
        }, { rootMargin: '0px', threshold: 0.01 });
        this._io.observe(this.canvas);
      }

      // Observe size changes (ResizeObserver)
      if ('ResizeObserver' in window) {
        this._ro = new ResizeObserver(() => this.resize());
        this._ro.observe(this.canvas);
      }

      // Theme changes (MutationObserver on data-theme)
      this._mo = new MutationObserver(() => this._themeChanged());
      this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    _bindAccessibility() {
      // Respect reduced motion immediately
      if (prefersReduced) this.pause();
    }

    _themeChanged() {
      // Just clear so trails adapt to bg
      this.clear(true);
    }

    /* ---------- Sizing ---------- */
    resize(force = false) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return; // hidden
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      if (!force && dpr === this.dpr && this.canvas.width === Math.floor(rect.width * dpr) && this.canvas.height === Math.floor(rect.height * dpr)) return;

      this.dpr = dpr;
      this.canvas.width  = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.w = rect.width;  // CSS px
      this.h = rect.height; // CSS px
      this.clear(true);
    }

    /* ---------- Build per-mode buffers ---------- */
    _build() {
      const p = this.preset();
      const ww = this.w || this.canvas.getBoundingClientRect().width || 600;
      const hh = this.h || this.canvas.getBoundingClientRect().height || 180;

      // reset
      this.nodes = null; this.particles = null; this.streams = null; this.flow = null;
      this.clear(true);

      if (this.mode === 'micro-cell') {
        const base = p.particles * (ww * hh) / (900 * 500) * p.density;
        const count = clamp(Math.round(base), 28, 240);
        this.nodes = new Array(count).fill(0).map(() => ({
          x: rand(0, ww),
          y: rand(0, hh),
          vx: rand(-0.25, 0.25),
          vy: rand(-0.22, 0.22),
          r: rand(1, 2.2)
        }));
      } else if (this.mode === 'nebula-flow') {
        const base = 180 * (ww * hh) / (1100 * 700) * p.density;
        this.particles = new Array(clamp(Math.round(base), 90, 360)).fill(0).map(() => ({
          x: rand(0, ww), y: rand(0, hh),
          life: rand(40, 160), maxLife: rand(140, 280)
        }));
        this.flow = { t: Math.random() * 1000 };
      } else { // data-stream
        const cols = clamp(Math.round((p.streams * (ww / 1024)) * p.density), 16, 140);
        this.streams = new Array(cols).fill(0).map((_, i) => ({
          x: (i + 0.5) * (ww / cols),
          y: rand(-hh, 0),
          speed: rand(40, 120),
          gap: rand(16, 28),
          len: rand(60, 140)
        }));
        this._lastTs = performance.now();
      }
    }

    /* ---------- Interactions ---------- */
    _bindInteractions() {
      // Pointer attractor (micro-cell only; very subtle)
      this._onMove = (e) => {
        const r = this.canvas.getBoundingClientRect();
        this.pointer.x = e.clientX - r.left;
        this.pointer.y = e.clientY - r.top;
        this.pointer.active = true;
      };
      this._onLeave = () => { this.pointer.active = false; };

      this.canvas.addEventListener('pointermove', this._onMove);
      this.canvas.addEventListener('pointerleave', this._onLeave);

      // Click to cycle modes
      this._onClick = () => {
        const order = ['micro-cell', 'nebula-flow', 'data-stream'];
        const idx = order.indexOf(this.mode);
        this.setMode(order[(idx + 1) % order.length]);
      };
      this.canvas.addEventListener('click', this._onClick);
    }
    _teardownInteractions() {
      this.canvas.removeEventListener('pointermove', this._onMove);
      this.canvas.removeEventListener('pointerleave', this._onLeave);
      this.canvas.removeEventListener('click', this._onClick);
      document.removeEventListener('visibilitychange', this._onVis);
      this._io && this._io.disconnect();
      this._ro && this._ro.disconnect();
      this._mo && this._mo.disconnect();
    }

    /* ---------- API setters ---------- */
    setMode(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      this._build();
    }
    setSpeed(mult) { this.speed = clamp(mult, 0.3, 2.5); }
    setQuality(q) {
      if (!QUALITY[q] || q === this.quality) return;
      this.quality = q;
      this._build();
    }

    /* ---------- Render ---------- */
    render() {
      if (!this.ctx || !this.w || !this.h) return;
      this.frame++;

      // Trail clear (theme-aware)
      const fade = this.preset().trail;
      this.ctx.fillStyle = isDark() ? COLORS.night(fade) : COLORS.white(fade);
      this.ctx.fillRect(0, 0, this.w, this.h);

      if (this.mode === 'micro-cell') return this._renderMicroCell();
      if (this.mode === 'nebula-flow') return this._renderNebulaFlow();
      return this._renderDataStream();
    }

    _renderMicroCell() {
      const { nodes } = this;
      if (!nodes) return;
      const linkDist = this.preset().linkDist;
      const px = this.pointer.x, py = this.pointer.y;

      // Motion + pointer attractor
      for (const n of nodes) {
        if (this.pointer.active) {
          const dx = px - n.x, dy = py - n.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < (linkDist * linkDist)) {
            const d = Math.sqrt(d2) || 1;
            // small pull towards pointer
            n.vx += (dx / d) * 0.002 * this.speed;
            n.vy += (dy / d) * 0.002 * this.speed;
          }
        }
        n.x += n.vx * this.speed;
        n.y += n.vy * this.speed;
        if (n.x < 0 || n.x > this.w) n.vx *= -1;
        if (n.y < 0 || n.y > this.h) n.vy *= -1;
      }

      // Draw nodes (brand tint)
      for (const n of nodes) {
        this.ctx.beginPath();
        this.ctx.fillStyle = COLORS.indigo(0.22);
        this.ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Soft proximity links (indigo → aqua → emerald)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < linkDist * linkDist) {
            const d = Math.sqrt(d2);
            const t = 1 - d / linkDist;
            const grd = this.ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grd.addColorStop(0.0, COLORS.indigo(0.10 * t));
            grd.addColorStop(0.5, COLORS.aqua(0.18 * t));
            grd.addColorStop(1.0, COLORS.emerald(0.18 * t));
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
      const pts = this.particles; if (!pts) return;
      // evolve field
      this.flow.t += 0.6 * this.speed;

      for (const p of pts) {
        const angle = this._noiseAngle(p.x, p.y, this.flow.t);
        p.x += Math.cos(angle) * 0.7 * this.speed;
        p.y += Math.sin(angle) * 0.7 * this.speed;

        // wrap
        if (p.x < 0) p.x = this.w; else if (p.x > this.w) p.x = 0;
        if (p.y < 0) p.y = this.h; else if (p.y > this.h) p.y = 0;

        // draw short trail segment
        this.ctx.beginPath();
        this.ctx.strokeStyle = (Math.random() < 0.12) ? COLORS.aqua(0.08) : COLORS.ink(0.06);
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - Math.cos(angle) * 6, p.y - Math.sin(angle) * 6);
        this.ctx.stroke();

        if (--p.life < 0) {
          p.x = rand(0, this.w); p.y = rand(0, this.h);
          p.life = rand(40, 160); p.maxLife = rand(140, 280);
        }
      }
    }

    _renderDataStream() {
      const streams = this.streams; if (!streams) return;

      // subtle grid (theme aware)
      this.ctx.save();
      this.ctx.globalAlpha = isDark() ? 0.08 : 0.06;
      this.ctx.strokeStyle = COLORS.indigo(1);
      this.ctx.lineWidth = 1;
      const gap = 48;
      for (let x = 0; x < this.w; x += gap) {
        this.ctx.beginPath(); this.ctx.moveTo(x + 0.5, 0); this.ctx.lineTo(x + 0.5, this.h); this.ctx.stroke();
      }
      this.ctx.restore();

      const now = performance.now();
      const dt = clamp((now - (this._lastTs || now)) / 1000, 0, 0.05);
      this._lastTs = now;

      for (const s of streams) {
        s.y += s.speed * dt * this.speed;
        if (s.y - s.len > this.h) {
          s.y = -rand(0, this.h * 0.5);
          s.speed = rand(40, 120);
          s.gap = rand(16, 28);
          s.len = rand(60, 140);
        }

        const y0 = s.y - s.len, y1 = s.y;
        const grd = this.ctx.createLinearGradient(s.x, y0, s.x, y1);
        grd.addColorStop(0,   (isDark()? COLORS.night(0) : COLORS.white(0)));
        grd.addColorStop(0.5, COLORS.sky(0.24));
        grd.addColorStop(1,   COLORS.emerald(0));
        this.ctx.strokeStyle = grd;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath(); this.ctx.moveTo(s.x, y0); this.ctx.lineTo(s.x, y1); this.ctx.stroke();

        // telemetry ticks
        for (let y = y0; y < y1; y += s.gap) {
          this.ctx.beginPath();
          this.ctx.fillStyle = COLORS.indigo(0.2);
          this.ctx.arc(s.x, y, 1.3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    /* ---------- Helpers ---------- */

    // Smooth-ish pseudo-noise -> angle
    _noiseAngle(x, y, t) {
      const scale = 36;
      const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
      const n00 = this._hash(gx, gy, t);
      const n10 = this._hash(gx + 1, gy, t);
      const n01 = this._hash(gx, gy + 1, t);
      const n11 = this._hash(gx + 1, gy + 1, t);
      const u = (x / scale) - gx, v = (y / scale) - gy;
      const nx0 = n00 * (1 - u) + n10 * u;
      const nx1 = n01 * (1 - u) + n11 * u;
      const n = nx0 * (1 - v) + nx1 * v;
      return n * Math.PI * 2;
    }

    _hash(x, y, t) {
      const s = Math.sin(x * 127.1 + y * 311.7 + t * 0.001) * 43758.5453;
      return s - Math.floor(s);
    }

    clear(hard=false) {
      if (!this.ctx) return;
      if (hard) {
        this.ctx.clearRect(0, 0, this.w || this.canvas.width, this.h || this.canvas.height);
        return;
      }
      // (Soft clear handled in render with theme-aware fill)
    }
  }

  /* ---------------------------------------
   * Singleton wrapper
   * ------------------------------------- */
  let system = null;

  function init(opts = {}) {
    if (prefersReduced) return;
    const cfg = (window.HealthFlo && window.HealthFlo.config) || {};
    if (cfg.particlesEnabled === false) return;

    const canvas = document.getElementById('hero-animation');
    if (!canvas) return;

    system?.destroy();
    system = new ParticleSystem(canvas, {
      quality: (opts.quality || cfg.animationQuality || 'medium'),
      mode: (opts.mode || 'micro-cell'),
      speed: clamp(opts.speed || 1, 0.3, 2.5),
    });

    system.start();

    // Public events (compat with your existing hooks)
    window.addEventListener('hf:particlesEnable', () => system?.resume());
    window.addEventListener('hf:particlesDisable', () => system?.pause());
    window.addEventListener('hf:configChanged', (e) => {
      const next = e.detail || {};
      if (!system) return;
      if (typeof next.animationQuality === 'string') system.setQuality(next.animationQuality);
      if (typeof next.particlesEnabled === 'boolean') next.particlesEnabled ? system.resume() : system.pause();
    });
    window.addEventListener('hf:resize', () => system?.resize());
    window.addEventListener('resize', () => system?.resize());
  }

  function setMode(m)   { system?.setMode(m); }
  function setSpeed(v)  { system?.setSpeed(v); }
  function setQuality(q){ system?.setQuality(q); }
  function pause()      { system?.pause(); }
  function resume()     { system?.resume(); }
  function destroy()    { system?.destroy(); system = null; }

  return { init, setMode, setSpeed, setQuality, pause, resume, destroy };
})();
