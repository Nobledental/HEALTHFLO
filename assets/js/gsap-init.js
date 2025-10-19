/* ==========================================================
   HealthFlo — Cinematic Animations (GSAP + ScrollTrigger + Lenis)
   - Orbit draw/rotate
   - Fade-up scroll reveals
   - Pathway connector scroll draw
   - Metrics counters
   - H2 gradient underlines (auto-injected)
   - AI tab crossfades
   - Accordion height tweens
   - Smooth scrolling via Lenis (if loaded)
   All effects respect prefers-reduced-motion.
   ========================================================== */

(function () {
  const hasGSAP = !!window.gsap;
  const hasST = !!(window.gsap && window.gsap.ScrollTrigger);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------
   * 1) HERO ORBITS
   * ----------------------------- */
  if (hasGSAP) {
    const orbitSvg = document.querySelector('.hf-hero-orbit');
    if (orbitSvg && !prefersReduced) {
      const orbits = orbitSvg.querySelectorAll('.orbit');
      orbits.forEach((o, i) => {
        const len = (o.getTotalLength && o.getTotalLength()) || 2000;
        o.style.strokeDasharray = `${len}`;
        o.style.strokeDashoffset = `${len}`;
        gsap.to(o, { strokeDashoffset: 0, duration: 2 + i * 0.5, ease: "power2.out", delay: 0.4 + i * 0.2 });

        gsap.to(o, {
          rotation: i % 2 ? -360 : 360,
          transformOrigin: "800px 450px",
          repeat: -1,
          duration: 120 + i * 30,
          ease: "none"
        });
      });

      orbitSvg.querySelectorAll('.node').forEach((n, i) => {
        gsap.to(n, {
          x: (i % 2 ? 14 : -12),
          y: (i % 2 ? -10 : 14),
          duration: 6 + i,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
      });
    }
  }

  /* -----------------------------
   * 2) FADE-UP REVEALS
   * ----------------------------- */
  if (hasGSAP && hasST && !prefersReduced) {
    gsap.utils.toArray('.fade-up').forEach(el => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" }
      });
    });
  } else {
    // No GSAP or reduced motion: show content immediately
    document.querySelectorAll('.fade-up').forEach(el => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  /* -----------------------------
   * 3) PATHWAY CONNECTOR DRAW
   * ----------------------------- */
  if (hasGSAP && hasST && !prefersReduced) {
    const p = document.getElementById('hf-path');
    if (p) {
      const total = (p.getTotalLength && p.getTotalLength()) || 1800;
      p.style.strokeDasharray = total;
      p.style.strokeDashoffset = total;
      gsap.to(p, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: { trigger: "#hf-scroll-path", start: "top 80%", end: "bottom 30%", scrub: true }
      });
    }
  } else {
    const p = document.getElementById('hf-path');
    if (p) p.style.strokeDashoffset = 0;
  }

  /* -----------------------------
   * 4) METRIC COUNTERS
   * ----------------------------- */
  if (hasGSAP) {
    const counters = document.querySelectorAll('.metric[data-count]');
    counters.forEach(box => {
      const valueEl = box.querySelector('.metric__value');
      if (!valueEl) return;
      const target = parseInt(box.getAttribute('data-count'), 10) || 0;

      if (prefersReduced || !hasST) {
        valueEl.textContent = target.toLocaleString('en-IN');
        return;
        }

      gsap.fromTo(
        { val: 0 },
        {
          val: target,
          duration: 1.6,
          ease: "power1.out",
          onUpdate: function () {
            valueEl.textContent = Math.round(this.targets()[0].val).toLocaleString('en-IN');
          },
          scrollTrigger: { trigger: box, start: "top 80%" }
        }
      );
    });
  }

  /* -----------------------------
   * 5) AUTO UNDERLINES FOR H2
   * ----------------------------- */
  (function underlineH2() {
    const headers = document.querySelectorAll('h2');
    headers.forEach(h => {
      if (h.querySelector('.u-underline')) return;
      const text = h.innerHTML;
      h.innerHTML = `<span class="u-underline"><span>${text}</span>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hf-grad-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4f9cff"/>
              <stop offset="100%" stop-color="#38f9d7"/>
            </linearGradient>
          </defs>
          <path d="M2 7 C 20 2, 80 2, 98 7" />
        </svg>
      </span>`;

      const path = h.querySelector('.u-underline path');
      const len = (path.getTotalLength && path.getTotalLength()) || 300;
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;

      if (hasGSAP && hasST && !prefersReduced) {
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: h, start: "top 85%" }
        });
      } else {
        path.style.strokeDashoffset = 0;
      }
    });
  })();

  /* -----------------------------
   * 6) AI TABS (crossfade)
   * ----------------------------- */
  (function tabs() {
    const tabs = document.querySelectorAll('.ai-tabs__tab');
    const panels = document.querySelectorAll('.ai-panel');

    function activate(btn) {
      const id = btn.getAttribute('aria-controls');
      tabs.forEach(b => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'));
      panels.forEach(p => {
        const active = p.id === id;
        p.hidden = !active;
        p.classList.toggle('is-active', active);
      });
      if (hasGSAP && !prefersReduced) {
        const panel = document.getElementById(id);
        gsap.fromTo(panel, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" });
      }
    }

    tabs.forEach(btn => btn.addEventListener('click', () => activate(btn)));
  })();

  /* -----------------------------
   * 7) ACCORDIONS (height tween)
   * ----------------------------- */
  (function accordions() {
    const accs = document.querySelectorAll('[data-accordion]');
    accs.forEach(acc => {
      const trigger = acc.querySelector('.accordion__trigger');
      const content = acc.querySelector('.accordion__content');
      if (!trigger || !content) return;

      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', (!expanded).toString());
        content.hidden = expanded;

        if (hasGSAP && !prefersReduced && !expanded) {
          gsap.fromTo(content, { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.35, ease: "power2.out" });
        }
      });
    });
  })();

  /* -----------------------------
   * 8) SWITCHBOARD smooth-jump
   * ----------------------------- */
  (function switchboard() {
    const buttons = document.querySelectorAll('.switch-card[data-target]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  })();

  /* -----------------------------
   * 9) Lenis smooth scroll (if present)
   * ----------------------------- */
  if (window.Lenis && !prefersReduced) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
})();
