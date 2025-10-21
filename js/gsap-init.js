if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap){
  const {gsap} = window;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  gsap.from('.brand', {y:-10, opacity:0, duration:.45, ease:'power2.out'});
  gsap.from('.nav__links a', {y:-8, opacity:0, duration:.35, stagger:.05, ease:'power2.out'});
  gsap.from('.role-tab', {y:10, opacity:0, duration:.35, stagger:.06, ease:'power2.out'});
  gsap.from('.chips .chip', {y:10, opacity:0, duration:.35, stagger:.04, ease:'power2.out'});

  gsap.utils.toArray('.card, .product').forEach(el=>{
    gsap.from(el, {y:20, opacity:0, duration:.55, ease:'power2.out', scrollTrigger:{trigger:el, start:'top 85%'}});
  });
}
