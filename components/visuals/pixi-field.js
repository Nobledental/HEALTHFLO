/*!
 * HealthFlo Pixi Field (Micro-Cell • Nebula Flow • Data Stream)
 * UPGRADED — theme-aware, battery-friendly, defensive, buttery smooth.
 * -------------------------------------------------------------------
 * Option B – GSAP + Pixi.js decorative system (still zero hard dependency)
 *
 * Highlights:
 *  • Graceful no-op if PIXI is missing or user prefers reduced motion
 *  • Theme-aware tints (auto reacts to [data-theme="dark"])
 *  • Visibility & intersection-aware pausing (tab hidden or off-screen)
 *  • Auto-throttle on low FPS; adaptive resolution to save battery
 *  • Pointer attractor (subtle) + click-to-cycle modes
 *  • Public API:
 *        enable(), disable(), destroy(),
 *        setMode('microCell'|'nebulaFlow'|'dataStream'),
 *        setDensity(0.2..1.5), setSpeed(0.2..2), setResolution(0.75..2),
 *        resize()
 *
 * CDN (add near end of <body> before this file if you want visuals):
 *   <!-- PixiJS v7 -->
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.js" defer></script>
 */

(() => {
  const DOC = document;
  const WIN = window;

  // Guards
  const hasPIXI = () => typeof WIN.PIXI !== 'undefined';
  const hasGSAP  = () => typeof WIN.gsap  !== 'undefined';
  const prefersReduced = WIN.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // No-op API (exported even when disabled) so other modules won’t break
  const noopAPI = {
    enable(){}, disable(){}, destroy(){},
    setMode(){}, setDensity(){}, setSpeed(){}, setResolution(){},
    resize(){},
  };

  if (prefersReduced) {
    WIN.HealthFloPixi = noopAPI;
    return;
  }

  // Canvas host (optional; safe if absent)
  const canvas = DOC.getElementById('pixi-field');
  if (!canvas) {
    WIN.HealthFloPixi = noopAPI;
    return;
  }

  // Runtime config
  const CFG = {
    enabled: true,
    mode: 'microCell',         // 'microCell' | 'nebulaFlow' | 'dataStream'
    density: 1.0,              // 0.2..1.5
    speed: 1.0,                // 0.2..2
    maxParticles: 280,         // hard cap per mode
    resolution: Math.min(1.75, Math.max(0.75, WIN.devicePixelRatio || 1)),
    minFPS: 28,                // low-FPS guard threshold
    fpsWindowMs: 1200,         // how often to assess FPS
    lowFpsStrikesForThrottle: 3,
    attractorStrength: 0.015,  // pointer attractor (microCell only)
  };

  // Internal state
  const STATE = {
    app: null,
    container: null,
    linkLayer: null,
    particles: [],
    ticker: null,
    lastFpsCheck: performance.now(),
    lowFpsStrikes: 0,
    visible: true,
    observer: null,
    resizeObs: null,
    themeObs: null,
    pointer: { active:false, x:0, y:0 },
    dpRatio: WIN.devicePixelRatio || 1,
  };

  // Palette (light/dark aware)
  const isDark = () => DOC.documentElement.getAttribute('data-theme') === 'dark';
  const colors = {
    get indigo() { return 0x4c6ef5; },
    get mint()   { return 0x2dd4bf; },
    get sky()    { return 0x38bdf8; },
    get emerald(){ return 0x10b981; },
    get slate()  { return isDark() ? 0x94a3b8 : 0x64748b; },
    get frost()  { return isDark() ? 0x334155 : 0xf1f5f9; },
  };

  // Utils
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => Math.random() * (b - a) + a;
  const debounce = (fn, ms) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  /* ---------------------------------------
   * Boot / Destroy
   * ------------------------------------- */
  const boot = () => {
    if (!hasPIXI()) return;

    const PIXI = WIN.PIXI;
    STATE.app = new PIXI.Application({
      view: canvas,
      resizeTo: canvas.parentElement || WIN,
      antialias: true,
      backgroundAlpha: 0,
      resolution: CFG.resolution,
      powerPreference: 'high-performance',
      autoDensity: true,
      sharedTicker: false,
    });

    STATE.container = new PIXI.Container();
    STATE.app.stage.addChild(STATE.container);

    // Interactivity
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click', cycleMode);

    // Lifecycle
    DOC.addEventListener('visibilitychange', onVisibility);
    WIN.addEventListener('resize', onWindowResize, { passive: true });

    // Off-screen pause (IntersectionObserver)
    if ('IntersectionObserver' in WIN) {
      STATE.observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { STATE.visible = e.isIntersecting; });
      }, { root: null, threshold: 0.01 });
      STATE.observer.observe(canvas);
    }

    // ResizeObserver for precision bounds
    if ('ResizeObserver' in WIN) {
      STATE.resizeObs = new ResizeObserver(debounce(resize, 80));
      STATE.resizeObs.observe(canvas);
    }

    // Watch theme flips
    STATE.themeObs = new MutationObserver(() => {
      // Nudge visuals to adapt (rebuild lightweight)
      buildMode(CFG.mode, /*preservePositions*/ true);
    });
    STATE.themeObs.observe(DOC.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // DevicePixelRatio changes (zoom / screens)
    WIN.matchMedia?.(`(resolution: ${STATE.dpRatio}dppx)`)?.addEventListener?.('change', () => {
      // Force a resolution update on next tick
      setResolution(WIN.devicePixelRatio || 1);
    });

    // Populate + start
    buildMode(CFG.mode);
    STATE.app.ticker.add(tick);
    STATE.ticker = STATE.app.ticker;
  };

  const destroy = () => {
    if (!STATE.app) return;
    // Unbind listeners
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('click', cycleMode);
    DOC.removeEventListener('visibilitychange', onVisibility);
    WIN.removeEventListener('resize', onWindowResize);
    STATE.observer?.disconnect(); STATE.observer = null;
    STATE.resizeObs?.disconnect(); STATE.resizeObs = null;
    STATE.themeObs?.disconnect(); STATE.themeObs = null;

    // Tear down Pixi
    STATE.app.destroy(true, { children: true, texture: true, baseTexture: true });
    STATE.app = null;
    STATE.container = null;
    STATE.linkLayer = null;
    STATE.particles.length = 0;
    STATE.ticker = null;
  };

  /* ---------------------------------------
   * Build Modes
   * ------------------------------------- */
  function buildMode(mode, preservePositions = false) {
    if (!STATE.app) return;
    const PIXI = WIN.PIXI;
    const { renderer } = STATE.app;

    // Clear stage
    STATE.container.removeChildren();
    STATE.particles.length = 0;
    STATE.linkLayer = null;

    const W = renderer.width;
    const H = renderer.height;

    if (mode === 'microCell') {
      // Glowing micro-cells with optional pointer attraction and soft link layer
      const count = Math.min(CFG.maxParticles, Math.floor(100 * CFG.density));
      for (let i = 0; i < count; i++) {
        const g = new PIXI.Graphics();
        const r = rnd(1.1, 2.2);
        const c = (i % 5 === 0) ? colors.sky : (i % 3 === 0 ? colors.mint : colors.indigo);
        g.beginFill(c, 0.85).drawCircle(0, 0, r).endFill();
        const s = new PIXI.Sprite(renderer.generateTexture(g));
        if (!preservePositions) {
          s.x = rnd(0, W); s.y = rnd(0, H);
        } else {
          s.x = (s.x || rnd(0, W)) % W; s.y = (s.y || rnd(0, H)) % H;
        }
        s.alpha = rnd(0.35, 0.9);
        s.vx = rnd(-0.18, 0.18);
        s.vy = rnd(-0.18, 0.18);
        s.tw = rnd(0.35, 1.1); // twinkle
        STATE.container.addChild(s);
        STATE.particles.push(s);
      }
      STATE.linkLayer = new PIXI.Graphics();
      STATE.container.addChild(STATE.linkLayer);
    }

    else if (mode === 'nebulaFlow') {
      // Soft ellipses, slow drift & subtle rotation (luxury ambience)
      const count = Math.min(CFG.maxParticles, Math.floor(26 * CFG.density));
      for (let i = 0; i < count; i++) {
        const g = new PIXI.Graphics();
        const rx = rnd(60, 160), ry = rnd(40, 120);
        const col = (i % 2 === 0) ? colors.indigo : colors.mint;
        g.beginFill(col, 0.14).drawEllipse(0, 0, rx, ry).endFill();
        const s = new PIXI.Sprite(renderer.generateTexture(g));
        s.x = rnd(0, W); s.y = rnd(0, H);
        s.alpha = rnd(0.16, 0.32);
        s.vx = rnd(-0.12, 0.12);
        s.vy = rnd(-0.08, 0.08);
        s.rot = rnd(-0.001, 0.001);
        STATE.container.addChild(s);
        STATE.particles.push(s);
      }
    }

    else { // dataStream
      // Thin diagonal telemetry lines (data-forward vibe)
      const count = Math.min(CFG.maxParticles, Math.floor(140 * CFG.density));
      for (let i = 0; i < count; i++) {
        const g = new PIXI.Graphics();
        const len = rnd(16, 44);
        g.lineStyle(rnd(0.6, 1.2), (i % 4 === 0) ? colors.sky : colors.slate, rnd(0.35, 0.65))
         .moveTo(0, 0).lineTo(len, 0);
        const s = new PIXI.Sprite(renderer.generateTexture(g));
        s.x = rnd(0, W); s.y = rnd(0, H);
        const sp = rnd(0.5, 1.25);
        s.vx = sp; s.vy = -sp * rnd(0.35, 0.9);
        s.rotation = rnd(-0.38, -0.22);
        s.alpha = rnd(0.45, 0.85);
        STATE.container.addChild(s);
        STATE.particles.push(s);
      }
    }
  }

  /* ---------------------------------------
   * Tick / Update
   * ------------------------------------- */
  function tick(delta=1) {
    if (!CFG.enabled || !STATE.visible) return;
    if (!STATE.app) return;

    const { renderer } = STATE.app;
    const W = renderer.width, H = renderer.height;

    // FPS monitor → throttle density when sustained low FPS
    const now = performance.now();
    if (now - STATE.lastFpsCheck > CFG.fpsWindowMs) {
      const fps = STATE.app.ticker.FPS || 60;
      if (fps < CFG.minFPS) STATE.lowFpsStrikes++;
      else STATE.lowFpsStrikes = Math.max(0, STATE.lowFpsStrikes - 1);

      if (STATE.lowFpsStrikes >= CFG.lowFpsStrikesForThrottle) {
        CFG.density = clamp(CFG.density * 0.85, 0.25, 1.0);
        buildMode(CFG.mode, /*preserve*/ true);
        STATE.lowFpsStrikes = 0;
      }
      STATE.lastFpsCheck = now;
    }

    const scale = CFG.speed * delta;

    if (CFG.mode === 'microCell') {
      const L = STATE.linkLayer;
      L?.clear();
      // link color based on theme
      const linkColor = colors.slate;
      L?.lineStyle(0.6, linkColor, isDark() ? 0.22 : 0.15);

      const pts = STATE.particles;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // Pointer attractor (very subtle)
        if (STATE.pointer.active) {
          const dx = STATE.pointer.x - p.x;
          const dy = STATE.pointer.y - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          const pull = CFG.attractorStrength * (1 - Math.min(1, dist / 180));
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }

        p.x += p.vx * scale;
        p.y += p.vy * scale;
        if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
        if (p.y < -6) p.y = H + 6; else if (p.y > H + 6) p.y = -6;
        // twinkle
        p.alpha = clamp(p.alpha + Math.sin(now * 0.001 * p.tw) * 0.002, 0.22, 0.95);
      }

      // Sparse connections (every few points)
      if (L) {
        for (let i = 0; i < pts.length; i += 3) {
          const a = pts[i], b = pts[(i + 9) % pts.length];
          if (!a || !b) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          if (dx*dx + dy*dy < 120*120) {
            L.moveTo(a.x, a.y); L.lineTo(b.x, b.y);
          }
        }
      }
    }

    else if (CFG.mode === 'nebulaFlow') {
      STATE.particles.forEach(p => {
        p.x += p.vx * scale * 0.6;
        p.y += p.vy * scale * 0.6;
        p.rotation += p.rot * scale;
        // soft wrap
        if (p.x < -200) p.x = W + 200; else if (p.x > W + 200) p.x = -200;
        if (p.y < -160) p.y = H + 160; else if (p.y > H + 160) p.y = -160;
      });
    }

    else { // dataStream
      STATE.particles.forEach(p => {
        p.x += p.vx * scale * 1.2;
        p.y += p.vy * scale * 1.2;
        if (p.x > W + 50) { p.x = -50; p.y = rnd(0, H); }
        if (p.y < -50) { p.y = H + 50; p.x = rnd(0, W); }
      });
    }
  }

  /* ---------------------------------------
   * Interactions / Events
   * ------------------------------------- */
  function onPointerMove(e) {
    const r = canvas.getBoundingClientRect();
    STATE.pointer.x = (e.clientX - r.left) * (STATE.app?.renderer?.resolution || 1);
    STATE.pointer.y = (e.clientY - r.top)  * (STATE.app?.renderer?.resolution || 1);
    STATE.pointer.active = true;
  }
  function onPointerLeave() { STATE.pointer.active = false; }

  function cycleMode() {
    const order = ['microCell','nebulaFlow','dataStream'];
    const i = order.indexOf(CFG.mode);
    setMode(order[(i + 1) % order.length]);
    // micro pulse on change (if GSAP present)
    if (hasGSAP() && STATE.container) {
      WIN.gsap.fromTo(STATE.container.scale, { x: 1, y: 1 }, { x: 1.02, y: 1.02, duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    }
  }

  function onVisibility() {
    DOC.hidden ? disable() : enable();
  }

  const onWindowResize = debounce(() => {
    resize();
  }, 80);

  /* ---------------------------------------
   * Public API
   * ------------------------------------- */
  function enable() {
    if (CFG.enabled) return;
    CFG.enabled = true;
    if (!STATE.app && hasPIXI()) boot();
    STATE.ticker?.start();
  }

  function disable() {
    if (!CFG.enabled) return;
    CFG.enabled = false;
    STATE.ticker?.stop();
  }

  function setMode(mode) {
    const next = ['microCell','nebulaFlow','dataStream'].includes(mode) ? mode : CFG.mode;
    if (next === CFG.mode) return CFG.mode;
    CFG.mode = next;
    buildMode(next);
    return CFG.mode;
  }

  function setDensity(d) {
    CFG.density = clamp(Number(d) || 1, 0.2, 1.5);
    buildMode(CFG.mode, /*preserve*/ true);
    return CFG.density;
  }

  function setSpeed(s) {
    CFG.speed = clamp(Number(s) || 1, 0.2, 2);
    return CFG.speed;
  }

  function setResolution(r) {
    const next = clamp(Number(r) || 1, 0.75, 2);
    if (!STATE.app) { CFG.resolution = next; return next; }
    const renderer = STATE.app.renderer;
    if (renderer.resolution === next) return next;
    CFG.resolution = next;
    renderer.resolution = next;
    renderer.resize(renderer.width, renderer.height); // force reflow
    buildMode(CFG.mode, /*preserve*/ true);
    return next;
  }

  function resize() {
    if (!STATE.app) return;
    // Pixi auto-resizes due to resizeTo; keep particles within bounds
    const { width:W, height:H } = STATE.app.renderer;
    STATE.particles.forEach(p => {
      p.x = (p.x + W) % W;
      p.y = (p.y + H) % H;
    });
  }

  // Hook custom events (optional external control)
  DOC.addEventListener('hf:pixiSetMode', (e) => setMode(e.detail?.mode));
  DOC.addEventListener('hf:pixiToggle', () => (CFG.enabled ? disable() : enable()));
  DOC.addEventListener('hf:particlesEnable', enable);
  DOC.addEventListener('hf:particlesDisable', disable);
  DOC.addEventListener('hf:configChanged', (e) => {
    const next = e.detail || {};
    if (typeof next.animationQuality === 'string') {
      // map quality → density/resolution suggestion
      if (next.animationQuality === 'low')  { setDensity(0.6); setResolution(1.0); }
      if (next.animationQuality === 'medium') { setDensity(1.0); setResolution(Math.min(1.5, WIN.devicePixelRatio||1)); }
      if (next.animationQuality === 'high') { setDensity(1.25); setResolution(Math.min(1.75, WIN.devicePixelRatio||1.25)); }
    }
    if (typeof next.particlesEnabled === 'boolean') next.particlesEnabled ? enable() : disable();
  });

  // KPI pulse integration (optional)
  DOC.addEventListener('hf:refreshComplete', () => {
    if (!hasGSAP() || !STATE.container) return;
    WIN.gsap.fromTo(STATE.container.scale, { x: 1, y: 1 }, { x: 1.015, y: 1.015, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut' });
  });

  // Export API
  WIN.HealthFloPixi = {
    enable, disable, destroy, setMode, setDensity, setSpeed, setResolution, resize
  };

  // Boot now (or shortly after if PIXI deferred)
  const tryBoot = () => { if (!STATE.app && hasPIXI() && CFG.enabled) boot(); };
  if (DOC.readyState === 'loading') {
    DOC.addEventListener('DOMContentLoaded', tryBoot);
  } else {
    tryBoot();
  }

  // If Pixi is deferred, poll briefly
  let polls = 0;
  const poll = setInterval(() => {
    if (STATE.app || !CFG.enabled) return clearInterval(poll);
    if (hasPIXI()) { clearInterval(poll); boot(); }
    if (++polls > 25) clearInterval(poll); // ~2.5s
  }, 100);
})();
