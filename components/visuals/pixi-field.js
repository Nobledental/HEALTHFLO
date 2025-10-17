/*!
 * HealthFlo Pixi Field (Micro-Cell, Nebula Flow, Data Stream)
 * -----------------------------------------------------------
 * Option B – GSAP + Pixi.js decorative system
 * - Zero hard dependency at runtime: safely no-op if PIXI is missing
 * - Auto-inits on <canvas id="pixi-field"> when present
 * - 3 visual modes (configurable): 'microCell' | 'nebulaFlow' | 'dataStream'
 * - Adaptive resolution & low-power throttling (page hidden / low FPS)
 * - Public API on window.HealthFloPixi:
 *      enable(), disable(), setMode('microCell'|'nebulaFlow'|'dataStream'),
 *      setDensity(0.2..1.5), setSpeed(0.2..2), resize()
 * - Respects prefers-reduced-motion (disables)
 *
 * CDN (add near end of <body> before this file if you want visuals):
 *   <!-- PixiJS v7 -->
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.js" defer></script>
 */

(() => {
  const DOC = document;
  const WIN = window;

  // Guard: user may choose not to load Pixi to keep site free/lean
  const hasPIXI = () => typeof WIN.PIXI !== 'undefined';
  const hasGSAP = () => typeof WIN.gsap !== 'undefined';
  const prefersReducedMotion = WIN.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Early exit if user prefers less motion
  if (prefersReducedMotion) {
    WIN.HealthFloPixi = {
      enable(){}, disable(){}, setMode(){}, setDensity(){}, setSpeed(){}, resize(){}
    };
    return;
  }

  // Find canvas
  const canvas = DOC.getElementById('pixi-field');
  if (!canvas) {
    // Expose noop API so other modules don’t fail if canvas missing
    WIN.HealthFloPixi = {
      enable(){}, disable(){}, setMode(){}, setDensity(){}, setSpeed(){}, resize(){}
    };
    return;
  }

  // Runtime config (safe defaults)
  const CFG = {
    enabled: true,
    mode: 'microCell',  // 'microCell' | 'nebulaFlow' | 'dataStream'
    // Density/speed are multipliers that scale per-mode baselines
    density: 1.0,       // 0.2..1.5
    speed: 1.0,         // 0.2..2
    maxParticles: 260,  // hard cap (per mode baseline scaled by density)
    // Rendering scale for HiDPI without burning GPU
    resolution: Math.min(1.5, WIN.devicePixelRatio || 1),
    // Auto-throttle if FPS drops below this for a while
    minFPS: 28,
  };

  // Internal state
  const STATE = {
    app: null,
    container: null,
    ticker: null,
    particles: [],
    lastFpsCheck: performance.now(),
    lowFpsSamples: 0,
  };

  // Utilities
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const rgba = (r,g,b,a=1)=>`rgba(${r},${g},${b},${a})`;

  // Palette (Hybrid Tech-Luxury)
  const palette = {
    indigo: 0x4c6ef5, // primary
    mint:   0x2dd4bf, // secondary
    slate:  0x94a3b8,
    sky:    0x38bdf8,
    emerald:0x10b981,
    // subtle white glints
    frost:  0xf1f5f9
  };

  // Initialize PIXI app
  const boot = () => {
    if (!hasPIXI()) return; // no-op if Pixi not loaded
    const PIXI = WIN.PIXI;

    STATE.app = new PIXI.Application({
      view: canvas,
      resizeTo: canvas.parentElement || WIN, // responsive
      antialias: true,
      backgroundAlpha: 0,
      resolution: CFG.resolution,
      powerPreference: 'high-performance',
      autoDensity: true,
    });

    STATE.container = new PIXI.Container();
    STATE.app.stage.addChild(STATE.container);

    // Start with current mode
    buildMode(CFG.mode);

    // Per-frame loop
    STATE.app.ticker.add(update);
    STATE.ticker = STATE.app.ticker;

    // Handle visibility (pause to save battery)
    DOC.addEventListener('visibilitychange', handleVisibility);
    WIN.addEventListener('resize', debounce(resize, 120));
  };

  const destroy = () => {
    if (!STATE.app) return;
    DOC.removeEventListener('visibilitychange', handleVisibility);
    WIN.removeEventListener('resize', debounce(resize, 120));
    STATE.app.destroy(true, { children: true, texture: true, baseTexture: true });
    STATE.app = null;
    STATE.container = null;
    STATE.particles = [];
  };

  const enable = () => {
    if (CFG.enabled) return;
    CFG.enabled = true;
    if (!STATE.app && hasPIXI()) boot();
    if (STATE.ticker) STATE.ticker.start();
  };

  const disable = () => {
    CFG.enabled = false;
    if (STATE.ticker) STATE.ticker.stop();
  };

  const setMode = (mode) => {
    if (!hasPIXI()) return CFG.mode;
    const next = ['microCell','nebulaFlow','dataStream'].includes(mode) ? mode : CFG.mode;
    CFG.mode = next;
    buildMode(next);
    return CFG.mode;
  };

  const setDensity = (d) => {
    CFG.density = clamp(Number(d) || 1, 0.2, 1.5);
    buildMode(CFG.mode); // rebuild population
    return CFG.density;
  };

  const setSpeed = (s) => {
    CFG.speed = clamp(Number(s) || 1, 0.2, 2);
    // speed influences update step, no rebuild needed
    return CFG.speed;
  };

  const resize = () => {
    if (!STATE.app) return;
    // Pixi auto-resizes due to resizeTo, but we may tweak particle bounds
    const { width, height } = STATE.app.renderer;
    STATE.particles.forEach(p => {
      // Keep within viewport bounds
      p.x = (p.x + width) % width;
      p.y = (p.y + height) % height;
    });
  };

  const handleVisibility = () => {
    if (DOC.hidden) disable(); else enable();
  };

  const debounce = (fn, ms) => {
    let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
  };

  // Build a mode (clears and repopulates particles)
  const buildMode = (mode) => {
    if (!STATE.container) return;
    const PIXI = WIN.PIXI;

    // Clear
    STATE.container.removeChildren();
    STATE.particles.length = 0;

    const { renderer } = STATE.app;
    const W = renderer.width;
    const H = renderer.height;

    if (mode === 'microCell') {
      // Glowing micro-cells drifting & repelling each other softly
      const baseCount = Math.min(CFG.maxParticles, Math.floor(90 * CFG.density));
      for (let i = 0; i < baseCount; i++) {
        const g = new PIXI.Graphics();
        const r = rnd(1.2, 2.4);
        const c = (i % 3 === 0) ? palette.mint : (i % 5 === 0 ? palette.sky : palette.indigo);
        g.beginFill(c, 0.8).drawCircle(0,0,r).endFill();
        g.filters = [];
        const s = new PIXI.Sprite(renderer.generateTexture(g));
        s.x = rnd(0, W);
        s.y = rnd(0, H);
        s.alpha = rnd(0.3, 0.9);
        s.vx = rnd(-0.15, 0.15);
        s.vy = rnd(-0.15, 0.15);
        s.twinkle = rnd(0.3, 1);
        STATE.container.addChild(s);
        STATE.particles.push(s);
      }
      // Subtle linkage lines layer (using Graphics once per frame)
      STATE.linkLayer = new PIXI.Graphics();
      STATE.container.addChild(STATE.linkLayer);

    } else if (mode === 'nebulaFlow') {
      // Soft foggy blobs drifting (premium, no neon)
      const baseCount = Math.min(CFG.maxParticles, Math.floor(22 * CFG.density));
      for (let i = 0; i < baseCount; i++) {
        const g = new PIXI.Graphics();
        const rx = rnd(60, 160), ry = rnd(40, 120);
        const color = (i % 2 === 0) ? palette.indigo : palette.mint;
        g.beginFill(color, 0.14).drawEllipse(0,0,rx,ry).endFill();
        const s = new PIXI.Sprite(renderer.generateTexture(g));
        s.x = rnd(0, W);
        s.y = rnd(0, H);
        s.alpha = rnd(0.18, 0.35);
        s.vx = rnd(-0.12, 0.12);
        s.vy = rnd(-0.08, 0.08);
        s.rot = rnd(-0.001, 0.001);
        STATE.container.addChild(s);
        STATE.particles.push(s);
      }

    } else { // dataStream
      // Thin streams flowing diagonally (data vibe)
      const baseCount = Math.min(CFG.maxParticles, Math.floor(120 * CFG.density));
      for (let i = 0; i < baseCount; i++) {
        const g = new PIXI.Graphics();
        const len = rnd(18, 42);
        g.lineStyle(rnd(0.6, 1.2), (i % 4 === 0) ? palette.sky : palette.slate, rnd(0.35, 0.65))
         .moveTo(0,0).lineTo(len, 0);
        const s = new PIXI.Sprite(renderer.generateTexture(g));
        s.x = rnd(0, W);
        s.y = rnd(0, H);
        s.alpha = rnd(0.45, 0.85);
        const sp = rnd(0.4, 1.2);
        s.vx = sp; s.vy = -sp * rnd(0.35, 0.85);
        s.rotation = rnd(-0.25, -0.4); // tilt up-left
        STATE.container.addChild(s);
        STATE.particles.push(s);
      }
    }
  };

  // Per-frame update
  const update = (delta) => {
    if (!CFG.enabled) return;
    const { renderer } = STATE.app;
    const W = renderer.width;
    const H = renderer.height;

    // FPS monitoring & auto-throttle
    const now = performance.now();
    if (now - STATE.lastFpsCheck > 1200) {
      const fps = STATE.app.ticker.FPS || 60;
      if (fps < CFG.minFPS) STATE.lowFpsSamples++;
      else STATE.lowFpsSamples = Math.max(0, STATE.lowFpsSamples - 1);
      // If sustained low FPS, reduce density (softly) and rebuild
      if (STATE.lowFpsSamples >= 3) {
        CFG.density = clamp(CFG.density * 0.85, 0.25, 1.0);
        buildMode(CFG.mode);
        STATE.lowFpsSamples = 0;
      }
      STATE.lastFpsCheck = now;
    }

    const speedScale = CFG.speed * (delta || 1);

    if (CFG.mode === 'microCell') {
      // drift + soft wrap + twinkle
      const link = STATE.linkLayer;
      link?.clear();
      const pts = [];
      STATE.particles.forEach(p => {
        p.x += p.vx * speedScale;
        p.y += p.vy * speedScale;
        if (p.x < -5) p.x = W + 5; else if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5; else if (p.y > H + 5) p.y = -5;
        // twinkle
        p.alpha += Math.sin(now * 0.001 * p.twinkle) * 0.003;
        p.alpha = clamp(p.alpha, 0.22, 0.95);
        pts.push(p);
      });
      // draw sparse connections
      if (link) {
        link.lineStyle(0.6, palette.slate, 0.15);
        for (let i = 0; i < pts.length; i += 3) {
          const a = pts[i], b = pts[(i + 9) % pts.length];
          if (!a || !b) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist2 = dx*dx + dy*dy;
          if (dist2 < 120*120) {
            link.moveTo(a.x, a.y); link.lineTo(b.x, b.y);
          }
        }
      }

    } else if (CFG.mode === 'nebulaFlow') {
      // slow float + rotate
      STATE.particles.forEach(p => {
        p.x += p.vx * speedScale * 0.6;
        p.y += p.vy * speedScale * 0.6;
        p.rotation += p.rot * speedScale;
        // wrap softly
        if (p.x < -180) p.x = W + 180; else if (p.x > W + 180) p.x = -180;
        if (p.y < -140) p.y = H + 140; else if (p.y > H + 140) p.y = -140;
      });

    } else { // dataStream
      STATE.particles.forEach(p => {
        p.x += p.vx * speedScale * 1.2;
        p.y += p.vy * speedScale * 1.2;
        // wrap diagonally
        if (p.x > W + 40) { p.x = -40; p.y = rnd(0, H); }
        if (p.y < -40) { p.y = H + 40; p.x = rnd(0, W); }
      });
    }
  };

  // Public API
  const API = { enable, disable, setMode, setDensity, setSpeed, resize };

  // Expose immediately (even before boot) so callers can configure first
  WIN.HealthFloPixi = API;

  // Boot if PIXI available now; otherwise wait a bit (defer attr)
  const tryBoot = () => { if (hasPIXI()) boot(); };
  if (DOC.readyState === 'loading') {
    DOC.addEventListener('DOMContentLoaded', tryBoot);
  } else { tryBoot(); }

  // If PIXI loads later (defer), poll briefly for readiness
  let pixiPolls = 0;
  const poll = setInterval(() => {
    if (STATE.app || !CFG.enabled) { clearInterval(poll); return; }
    if (hasPIXI()) { clearInterval(poll); boot(); }
    if (++pixiPolls > 20) clearInterval(poll); // stop after ~2s
  }, 100);

  // Convenience: allow quick switches using custom events
  DOC.addEventListener('hf:pixiSetMode', (e) => setMode(e.detail?.mode));
  DOC.addEventListener('hf:pixiToggle', () => (CFG.enabled ? disable() : enable()));

  // Optional: integrate with KPI cadence (slightly pulse on refresh)
  DOC.addEventListener('hf:refreshComplete', () => {
    if (!hasGSAP() || !STATE.container) return;
    WIN.gsap.fromTo(STATE.container.scale, { x: 1.0, y: 1.0 }, {
      x: 1.015, y: 1.015, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut'
    });
  });

})();
