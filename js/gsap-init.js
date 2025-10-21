/* =========================================================
   HealthFlo — GSAP / Motion System
   - Hero intros + section reveals (ScrollTrigger)
   - Persona morph (SVG path) using Flubber (no paid plugins)
   - Role bubble spring + orbs parallax
   - Gentle performance-minded defaults
   ========================================================= */

(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined') return;

  // Register optional plugin
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* -------------------------------------------
     Base easing + defaults
  ------------------------------------------- */
  gsap.defaults({
    ease: 'power2.out',
    duration: 0.6
  });

  /* -------------------------------------------
     HERO INTRO (first paint)
  ------------------------------------------- */
  if (!prefersReduced) {
    const tl = gsap.timeline();
    tl.from('.brand', { y: -14, opacity: 0, duration: .45 })
      .from('.nav__links a', { y: -10, opacity: 0, stagger: .05, duration: .32 }, '-=.2')
      .from('.role-tabs', { y: 10, opacity: 0, duration: .45 }, '-=.1')
      .from('#hero-title', { y: 12, opacity: 0 }, '-=.1')
      .from('#hero-sub', { y: 12, opacity: 0 }, '-=.3')
      .from('.hero__cta .btn', { y: 10, opacity: 0, stagger: .06, duration: .35 }, '-=.2')
      .from('.persona-stage', { y: 14, opacity: 0, duration: .5 }, '-=.2');
  }

  /* -------------------------------------------
     SCROLLTRIGGER — cards & sections
  ------------------------------------------- */
  if (!prefersReduced && window.ScrollTrigger) {
    gsap.utils.toArray('.card, .product, .ai-card, .panel').forEach(el => {
      gsap.from(el, {
        y: 18, opacity: 0, duration: .5,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
  }

  /* -------------------------------------------
     PARALLAX ORBS (pointer)
  ------------------------------------------- */
  (() => {
    const left = $('.orb-left');
    const right = $('.orb-right');
    if (!left || !right || prefersReduced) return;

    let raf;
    window.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth; const h = window.innerHeight;
        const x = (e.clientX - w/2) / w;
        const y = (e.clientY - h/2) / h;
        gsap.to(left,  { x: x * -30, y: y * -18, duration: .6, overwrite: true });
        gsap.to(right, { x: x *  38, y: y *  24, duration: .6, overwrite: true });
      });
    });
  })();

  /* -------------------------------------------
     ROLE BUBBLE subtle spring (resize-safe)
  ------------------------------------------- */
  (() => {
    const bubble = $('#roleBubble');
    if (!bubble || prefersReduced) return;

    // micro spring when tabs hovered
    $$('.role-tab').forEach(tab => {
      on(tab, 'mouseenter', () => {
        gsap.to(bubble, { scale: 1.01, duration: .22, ease: 'power1.out' });
      });
      on(tab, 'mouseleave', () => {
        gsap.to(bubble, { scale: 1.0, duration: .25, ease: 'power2.out' });
      });
    });

    // keep bubble "breathing" via CSS class from main.js
    // (nothing more needed here)
  })();

  /* -------------------------------------------
     PERSONA MORPH (Flubber — no MorphSVG needed)
     - Morphs #morphPath between three shapes
     - Updates gradient fill + caption
  ------------------------------------------- */
  (() => {
    const svg  = $('#morphSvg');
    const path = $('#morphPath');
    const label = $('#morphLabel');
    if (!svg || !path || typeof flubber === 'undefined') return;

    // Three friendly rounded shapes (badge, tile, shield-ish)
    const SHAPES = {
      patient:
        'M12 20a12 12 0 0 1 12-12h16a12 12 0 0 1 12 12v24a12 12 0 0 1-12 12H24A12 12 0 0 1 12 44V20z',
      hospital:
        'M10 18a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v10a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V18z M14 40a10 10 0 0 0 10 10h16a10 10 0 0 0 10-10v4a10 10 0 0 1-10 10H24A10 10 0 0 1 14 44V40z',
      insurer:
        'M12 24c0-8 10-12 20-12s20 4 20 12v12c0 12-10 18-20 22-10-4-20-10-20-22V24z'
    };

    const GRAD = {
      patient:  'url(#gradPatient)',
      hospital: 'url(#gradHospital)',
      insurer:  'url(#gradInsurer)'
    };

    function currentMode(){
      const b = document.body;
      if (b.classList.contains('mode--hospital')) return 'hospital';
      if (b.classList.contains('mode--insurer'))  return 'insurer';
      return 'patient';
    }

    let anim;
    function morphTo(mode){
      const from = path.getAttribute('d');
      const to   = SHAPES[mode] || SHAPES.patient;
      if (!from || !to || from === to) return;

      // Interpolator
      let interp;
      try {
        interp = flubber.interpolate(from, to, { maxSegmentLength: 3 });
      } catch {
        // fallback: snap
        path.setAttribute('d', to);
        path.setAttribute('fill', GRAD[mode] || GRAD.patient);
        label.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        return;
      }

      // Kill any previous tween
      if (anim) anim.kill();

      const state = { t: 0 };
      anim = gsap.to(state, {
        t: 1,
        duration: prefersReduced ? 0.001 : 0.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          path.setAttribute('d', interp(state.t));
        },
        onStart: () => {
          // subtle scale pulse
          gsap.fromTo(svg, { scale: .995 }, { scale: 1, duration: .6, transformOrigin: 'center', ease: 'power2.out' });
          path.setAttribute('fill', GRAD[mode] || GRAD.patient);
          label.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        }
      });
    }

    // Initial morph based on body class
    morphTo(currentMode());

    // Hook role-tabs clicks (does not affect main.js logic)
    $$('.role-tab').forEach(btn => {
      on(btn, 'click', () => morphTo(btn.dataset.persona));
    });

    // On theme or resize we don’t need remorph; shapes are static.
  })();

  /* -------------------------------------------
     MARQUEE bump on persona switch (optional delight)
  ------------------------------------------- */
  (() => {
    const marqueeTrack = document.querySelector('.marquee .track');
    if (!marqueeTrack || prefersReduced) return;

    $$('.role-tab').forEach(btn => {
      on(btn, 'click', () => {
        gsap.fromTo(marqueeTrack, { x: 6 }, { x: 0, duration: .35, ease: 'power2.out' });
      });
    });
  })();

})();
