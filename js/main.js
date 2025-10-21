/* Utilities */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

/* Theme studio */
(() => {
  const wrap = $('.theme');
  if (!wrap) return;
  const panel = $('.theme__panel', wrap);
  const tbtns = $$('.tbtn', panel);
  const saved = localStorage.getItem('hf-theme') || 'night';
  const apply = (name) => {
    document.body.classList.remove('theme--day','theme--clinic','theme--contrast','theme--matte');
    if(name!=='night') document.body.classList.add(`theme--${name}`);
    tbtns.forEach(b=>b.classList.toggle('is-active', b.dataset.theme===name));
    localStorage.setItem('hf-theme', name);
  };
  apply(saved);
  on($('.theme__toggle', wrap),'click',()=> wrap.setAttribute('aria-expanded', wrap.getAttribute('aria-expanded')!=='true'));
  tbtns.forEach(b=> on(b,'click', ()=>{ apply(b.dataset.theme); wrap.setAttribute('aria-expanded','false'); }));
  on(document,'click',e=>{ if(!wrap.contains(e.target)) wrap.setAttribute('aria-expanded','false'); });
})();

/* Persona selector (no page scroll) */
(() => {
  const tabs = $$('.role-tab');
  const bubble = $('#roleBubble');
  const heroCTA = $('#hero-cta');
  const label = $('#morphLabel');

  function setMode(mode){
    document.body.classList.remove('mode--patient','mode--hospital','mode--insurer');
    document.body.classList.add(`mode--${mode}`);
    tabs.forEach(t=> t.classList.toggle('is-active', t.dataset.persona===mode));
    // swap visible product grid
    $$('[data-scope]').forEach(x => x.classList.add('hidden'));
    $(`[data-scope="${mode}"]`)?.classList.remove('hidden');
    label.textContent = mode[0].toUpperCase()+mode.slice(1);
    heroCTA.href = `${mode}.html`;
    showToast(`${label.textContent} view`);
  }

  function moveBubble(btn){
    const r = btn.getBoundingClientRect();
    const wrap = btn.parentElement.getBoundingClientRect();
    const x = r.left - wrap.left;
    bubble.style.transform = `translate(${x}px, -50%)`;
    bubble.style.width = `${r.width}px`;
  }

  tabs.forEach(btn=>{
    on(btn,'click', (e)=>{
      e.preventDefault(); // stop anchor scroll
      moveBubble(btn);
      setMode(btn.dataset.persona);
    });
    // initial pos after paint
    if(btn.classList.contains('is-active')) requestAnimationFrame(()=> moveBubble(btn));
  });

  window.addEventListener('resize', ()=> {
    const active = $('.role-tab.is-active'); active && moveBubble(active);
  });
})();

/* Typing effect (hero sub) */
(() => {
  const el = $('#typeSub'); if(!el) return;
  const arr = JSON.parse(el.getAttribute('data-typing')||'[]');
  let i=0, j=0, dir=1;
  function tick(){
    const t = arr[i]||'';
    j += dir;
    el.textContent = t.slice(0, j);
    if (j===t.length){ dir=-1; setTimeout(tick, 1400); }
    else if (j===0){ dir=1; i=(i+1)%arr.length; setTimeout(tick, 260); }
    else { setTimeout(tick, dir>0 ? 26 : 12); }
  }
  tick();
})();

/* Scroll-spy for header links */
(() => {
  const links = $$('.nav__links a');
  const ids = links.map(a=> a.getAttribute('href')).filter(h=> h.startsWith('#'));
  const map = ids.map(id => ({ id, el: $(id) })).filter(x=>x.el);
  const onScroll = () => {
    const y = window.scrollY + 120;
    let cur = null;
    map.forEach(({id,el})=> { const top = el.offsetTop; if(top<=y) cur = id; });
    links.forEach(a=> a.classList.toggle('active', a.getAttribute('href')===cur ));
  };
  on(window,'scroll',onScroll); on(window,'resize',onScroll); onScroll();
})();

/* Animated entrances (intersection) */
(() => {
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
  }, { rootMargin:'-10% 0px'});
  document.querySelectorAll('[data-animate]').forEach(el=> io.observe(el));
})();

/* Toast helper */
function showToast(msg){
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(showToast._t); showToast._t = setTimeout(()=> t.classList.remove('show'), 1400);
}
