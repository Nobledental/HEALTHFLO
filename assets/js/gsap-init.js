(function () {
  if (typeof window === 'undefined' || !window.gsap) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.fade-up').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(window.ScrollTrigger);

  gsap.utils.toArray('.fade-up').forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 40 },
      {
        duration: 0.8,
        autoAlpha: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%'
        }
      }
    );
  });

  // Metric counters
  const metrics = gsap.utils.toArray('.metric');
  metrics.forEach((metric) => {
    const target = Number(metric.dataset.count || 0);
    const valueEl = metric.querySelector('.metric__value');
    if (!valueEl) return;
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: metric,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power1.out',
          onUpdate: () => {
            valueEl.textContent = target >= 1000 ? Math.round(obj.val).toLocaleString() : Math.round(obj.val);
          }
        });
      }
    });
  });
})();
