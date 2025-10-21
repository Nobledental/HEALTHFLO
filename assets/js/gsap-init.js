/* =========================================================
   HealthFlo — gsap-init.js
   Entrances, card stagger, pointer parallax for orbs
   ========================================================= */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap) return;

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ defaults: { ease:'power2.out', duration:.45 } });
  if (document.querySelector('.nav')) {
    tl.from('.nav', { y:-18, opacity:0 });
  }
  const heroTabs = gsap.utils.toArray('.role-tabs .role-tab');
  if (heroTabs.length) {
    tl.from(heroTabs, { y:14, opacity:0, stagger:.06, duration:.4 }, '-=0.2');
  }
  if (document.querySelector('.status-pill')) {
    tl.from('.status-pill', { y:10, opacity:0, duration:.32 }, '-=0.25');
  }
  const heroItems = gsap.utils.toArray('.hero__grid > *');
  if (heroItems.length) {
    tl.from(heroItems, { y:22, opacity:0, stagger:.08, duration:.5 }, '-=0.2');
  }
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
