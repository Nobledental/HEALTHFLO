/* =========================================================
   HealthFlo — gsap-init.js
   Entrances, card stagger, pointer parallax for orbs
   ========================================================= */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap) return;

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  gsap.from('.site-top', {y:-16, opacity:0, duration:.45, ease:'power2.out'});
  gsap.from('.role .role-btn', {y:10, opacity:0, duration:.4, ease:'power2.out', stagger:.06, delay:.05});
  gsap.from('.status', {y:8, opacity:0, duration:.35, ease:'power2.out', delay:.1});
  gsap.from('.hero .grid > *', {y:18, opacity:0, duration:.45, ease:'power2.out', stagger:.08, delay:.12});

  gsap.utils.toArray('.card, .product').forEach(el=>{
    gsap.from(el, {y:18, opacity:0, duration:.5, ease:'power2.out', scrollTrigger:{ trigger: el, start:'top 88%' }});
  });

  window.addEventListener('pointermove', (e)=>{
    const { innerWidth:w, innerHeight:h } = window;
    const x = (e.clientX - w/2)/w, y = (e.clientY - h/2)/h;
    gsap.to('.orb-left',  { x: x*-30, y: y*-20, duration:.6, overwrite:true });
    gsap.to('.orb-right', { x: x* 40, y: y* 26, duration:.6, overwrite:true });
  }, { passive:true });
})();
