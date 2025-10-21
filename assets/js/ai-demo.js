/* =========================================================
   HealthFlo — AI Demo / Delight Layer
   - Particle canvas (premium neon starfield)
   - Persona-driven micro-animations (icon re-draw, chip bounce)
   - Optional Lottie hero blob (if lottie-web present)
   - Body class observer to react to persona changes
   - Safe on low-power devices (reduced motion aware)
   ========================================================= */

(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------
     1) Particle Canvas: neon starfield / pixel grid vibe
     Target: <canvas id="particles" class="particle-layer">
  ------------------------------------------- */
  const Particles = (() => {
    const canvas = $('#particles');
    if (!canvas) return { start(){}, stop(){} };

    const ctx = canvas.getContext('2d');
    let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap DPR for perf
    let W = 0, H = 0, RAF = null;
    let stars = [];
    const STAR_COUNT = 120; // tuned for perf

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.floor(r.width * DPR);
      H = Math.floor(r.height * DPR);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      // rebuild
      stars = buildStars(STAR_COUNT);
    }

    function buildStars(n){
      const arr = new Array(n).fill(0).map(() => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 0.6 + 0.4, // depth
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.6 + 0.6
      }));
      return arr;
    }

    function tint(){
      // pull persona accent for glow
      const cs = getComputedStyle(document.body);
      const p1 = cs.getPropertyValue('--p1').trim() || '#78f0ff';
      const p2 = cs.getPropertyValue('--p2').trim() || '#7c5cff';
      return { p1, p2 };
    }

    function draw(){
      const { p1, p2 } = tint();
      ctx.clearRect(0,0,W,H);

      // faint pixel grid (4K android feel)
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;

      const step = Math.round(24 * DPR);
      for (let x = 0; x < W; x += step){
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step){
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      }
      ctx.restore();

      // stars
      for (let i=0; i<stars.length; i++){
        const s = stars[i];
        s.x += s.vx * s.z;
        s.y += s.vy * s.z;

        // wrap
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H;
        if (s.y > H) s.y = 0;

        // glow
        ctx.shadowBlur = 8 * s.z;
        ctx.shadowColor = i % 2 ? p1 : p2;
        ctx.fillStyle = i % 2 ? p1 : p2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.z, 0, Math.PI*2);
        ctx.fill();
      }

      RAF = requestAnimationFrame(draw);
    }

    function start(){
      if (prefersReduced) return;
      stop();
      resize();
      draw();
    }
    function stop(){
      if (RAF) cancelAnimationFrame(RAF);
      RAF = null;
    }

    // resize observer
    const ro = new ResizeObserver(() => {
      if (!prefersReduced){
        resize();
      }
    });
    ro.observe(canvas);

    return { start, stop };
  })();

  /* -------------------------------------------
     2) Persona micro-animations
     - Restart icon line-draw on role change
     - Bounce chips gently for feedback
  ------------------------------------------- */
  function restartRoleIcons(){
    const groups = $$('.role-tab .draw, .role-tab .draw-slow');
    groups.forEach(g => {
      g.classList.remove('draw','draw-slow');
      // force reflow to restart animation
      void g.getBBox?.();
      g.classList.add('draw');
    });
  }

  function bounceHeroChips(){
    const chips = $$('#hero-chips .chip');
    chips.forEach((c,i) => {
      c.style.willChange = 'transform';
      c.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-3px)' },
          { transform: 'translateY(0)' }
        ],
        { duration: 360, delay: i*40, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    });
  }

  /* -------------------------------------------
     3) Optional Lottie Hero Blob
     - Place a container with data-lottie="hero" to enable
     - Requires lottie-web. If missing, we silently skip.
  ------------------------------------------- */
  async function tryLottieHero(){
    const target = document.querySelector('[data-lottie="hero"]');
    if (!target || !window.lottie) return;

    try {
      const anim = window.lottie.loadAnimation({
        container: target,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/lottie/hero-blob.json'
      });
      // Subtle speed & color adjustments can be made here
      anim.setSpeed(1);
    } catch (e){
      console.info('Lottie hero skipped:', e);
    }
  }

  /* -------------------------------------------
     4) Body class observer (persona changes)
     - We react to .mode--patient / .mode--hospital / .mode--insurer
  ------------------------------------------- */
  function currentModeFromBody(){
    const b = document.body;
    if (b.classList.contains('mode--hospital')) return 'hospital';
    if (b.classList.contains('mode--insurer'))  return 'insurer';
    return 'patient';
  }

  let lastMode = currentModeFromBody();
  const mo = new MutationObserver(() => {
    const now = currentModeFromBody();
    if (now !== lastMode){
      lastMode = now;
      restartRoleIcons();
      bounceHeroChips();
    }
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* -------------------------------------------
     5) Kick things off
  ------------------------------------------- */
  if (!prefersReduced){
    Particles.start();
    tryLottieHero();
  }

  // expose for debugging if needed
  window.HFAnimations = {
    particles: Particles,
    restartRoleIcons,
    bounceHeroChips
  };
})();
