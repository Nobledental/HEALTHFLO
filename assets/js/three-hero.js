/* =========================================================
   HealthFlo — WebGL Hero (Three.js optional)
   - Neon/HDR “4K Android” glass grid via shader
   - Persona-accents from CSS vars (--p1, --p2)
   - Dynamic script load for Three.js (no blocking)
   - Pauses on hidden tab & reduced motion
   - Plays nicely with the particle canvas (stops it)
   ========================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // Respect OS setting

  const container = document.querySelector('.persona-stage');
  if (!container) return;

  let renderer, scene, camera, mesh, raf = null, startTS = 0;
  let THREE_ = null;

  // Insert a holder so we can position absolutely under SVG morph
  const holder = document.createElement('div');
  holder.id = 'hf-hero-gl';
  Object.assign(holder.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '0', // under morph SVG/content in .persona-stage
    pointerEvents: 'none'
  });
  container.prepend(holder);

  // Load three.js from CDN if not present
  function loadThree() {
    return new Promise((resolve, reject) => {
      if (window.THREE) return resolve(window.THREE);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
      s.async = true;
      s.onload = () => resolve(window.THREE);
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  function cssToRgbArray(css) {
    // Accepts hex or rgb/rgba
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = css.trim();
    const rgba = ctx.fillStyle; // normalized to rgb(a)
    const m = rgba.match(/\d+(\.\d+)?/g) || [120,240,255];
    const r = (Number(m[0])||120)/255, g = (Number(m[1])||240)/255, b = (Number(m[2])||255)/255;
    return [r,g,b];
  }

  function currentPersonaColors() {
    const cs = getComputedStyle(document.body);
    const c1 = cs.getPropertyValue('--p1') || '#78f0ff';
    const c2 = cs.getPropertyValue('--p2') || '#7c5cff';
    return { c1: cssToRgbArray(c1), c2: cssToRgbArray(c2) };
  }

  function buildShaderMat(THREE) {
    const { c1, c2 } = currentPersonaColors();
    const uniforms = {
      u_time:    { value: 0 },
      u_res:     { value: [holder.clientWidth, holder.clientHeight] },
      u_color1:  { value: c1 },
      u_color2:  { value: c2 },
      u_opacity: { value: 0.85 }
    };

    // Fullscreen neon grid + soft radial aurora + scanlines
    const vert = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform float u_time;
      uniform vec2  u_res;
      uniform vec3  u_color1;
      uniform vec3  u_color2;
      uniform float u_opacity;

      // smooth min
      float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }

      void main() {
        vec2 uv = vUv;
        // maintain aspect in shader space for nice circles
        float aspect = u_res.x / max(u_res.y, 1.0);
        vec2 p = (uv - 0.5);
        p.x *= aspect;

        // gradient between persona colors
        float t = 0.5 + 0.5 * sin(u_time * 0.15);
        vec3 grad = mix(u_color1, u_color2, smoothstep(0.0, 1.0, uv.y * 0.9 + 0.05 * sin(u_time*0.4)));

        // aurora rings
        float r = length(p);
        float ring = 0.22 / (1.0 + 20.0 * pow(abs(r - (0.35 + 0.05*sin(u_time*0.25))), 2.0));
        vec3 aurora = grad * ring * 1.4;

        // neon grid (OKLab-like weighting by simple power)
        vec2 g = uv * vec2(26.0*aspect, 26.0);
        vec2 line = abs(fract(g - 0.5) - 0.5) / fwidth(g);
        float grid = 1.0 - min(min(line.x, line.y), 1.0);
        grid = pow(grid, 0.55); // soften
        float scan = 0.5 + 0.5 * sin((uv.y + u_time*0.12) * 120.0);
        grid *= 0.18 + 0.16*scan;

        // soft vignette
        float vig = smoothstep(0.98, 0.4, r);

        // combine
        vec3 col = grad * 0.18 + aurora + grid * grad;
        col += 0.06 * vec3(0.8, 0.95, 1.0) * vig;

        // HDR-ish pop
        col = pow(col, vec3(0.95));

        gl_FragColor = vec4(col, u_opacity);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true
    });
  }

  function resize() {
    const w = Math.max(1, holder.clientWidth);
    const h = Math.max(1, holder.clientHeight);

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); // cap DPR
    renderer.setSize(w, h, false);

    mesh.material.uniforms.u_res.value = [w, h];
  }

  function loop(ts) {
    if (!startTS) startTS = ts;
    const t = (ts - startTS) / 1000;

    mesh.material.uniforms.u_time.value = t;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }

  function buildScene(THREE) {
    // renderer
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    holder.appendChild(renderer.domElement);

    // scene & camera (fullscreen quad)
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // mesh
    const mat = buildShaderMat(THREE);
    const geo = new THREE.PlaneGeometry(2, 2, 1, 1);
    mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // init sizes
    resize();

    // pointer parallax (subtle: adjust opacity on hover)
    holder.addEventListener('pointermove', (e) => {
      const r = holder.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      const o = 0.78 + Math.min(0.06, Math.sqrt(nx*nx + ny*ny));
      mesh.material.uniforms.u_opacity.value = o;
    });

    // persona color re-tint on body class change
    const mo = new MutationObserver(() => {
      const { c1, c2 } = currentPersonaColors();
      mesh.material.uniforms.u_color1.value = c1;
      mesh.material.uniforms.u_color2.value = c2;
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // resize
    window.addEventListener('resize', resize);

    // Visibility pause/resume
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf), raf = null;
      } else {
        if (!raf) raf = requestAnimationFrame(loop);
      }
    });
  }

  async function start() {
    try {
      THREE_ = await loadThree();
    } catch {
      // Fallback: keep particles
      console.info('Three.js failed to load; keeping particle background.');
      return;
    }

    // If particles were running, stop them (avoid double load)
    try { window.HFAnimations?.particles?.stop?.(); } catch {}

    buildScene(THREE_);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (renderer) {
      renderer.dispose?.();
      holder.remove();
    }
    // Optionally resume particles
    try { window.HFAnimations?.particles?.start?.(); } catch {}
  }

  // Public API for debugging
  window.HFHeroGL = { start, stop };

  // Auto-start after idle to not compete with LCP
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => start(), { timeout: 2000 });
  } else {
    setTimeout(start, 900);
  }
})();
