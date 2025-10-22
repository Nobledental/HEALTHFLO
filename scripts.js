/* =========================
   HealthFlo — Futuristic Landing v2
   Adds: Cosmos theme, Apple-like slider, bigger choose cards,
   neon nav hover (CSS), blinking logo (CSS), AI guide, mode switching, etc.
   ========================= */

(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  /* NAV TOGGLE */
  const toggler = qs('.nav__toggle');
  const menu = qs('#nav-menu');
  if (toggler && menu) {
    toggler.addEventListener('click', () => {
      const exp = toggler.getAttribute('aria-expanded') === 'true';
      toggler.setAttribute('aria-expanded', String(!exp));
      menu.dataset.open = (!exp).toString();
    });
    qsa('#nav-menu a').forEach(a => a.addEventListener('click', () => {
      toggler.setAttribute('aria-expanded','false'); delete menu.dataset.open;
    }));
  }

  /* THEME SWITCHER (moved far right) */
  const themeBtns = qsa('.theme-switch .pill');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.body.classList.remove('theme-care','theme-neon','theme-dawn','theme-cosmos');
      document.body.classList.add(btn.dataset.theme);
    });
  });

  /* SCROLL REVEAL */
  (function(){
    const els = qsa('[data-animate]');
    if(!('IntersectionObserver' in window) || !els.length) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ e.target.setAttribute('data-animate','in'); io.unobserve(e.target); }
      });
    },{threshold:.2});
    els.forEach(el=>io.observe(el));
  })();

  /* TYPED LINE */
  (function(){
    const el = qs('.typed'); if(!el) return;
    const lines = [
      'We connect hospitals, patients, and insurers so cashless care just works.',
      'Compare policies, explore packages, and book care with confidence.',
      'Hospitals get faster approvals and predictable cash-in.'
    ];
    let li = 0, ti = 0, del = 34, back = false;
    const caret = qs('.typed-caret');

    function tick(){
      const text = lines[li];
      el.textContent = back ? text.slice(0, ti--) : text.slice(0, ti++);
      if(!back && ti > text.length + 6){ back = true; del = 12; }
      if(back && ti <= 0){ back = false; li = (li+1)%lines.length; del = 34; }
      setTimeout(tick, del);
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      el.textContent = lines[0];
      if (caret) caret.style.display='none';
    } else { tick(); }
  })();

  /* COUNT UP METRICS */
  (function(){
    const nums = qsa('[data-count]'); if (!nums.length) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const el = e.target; io.unobserve(el);
        const to = +el.dataset.count; const D = 1100; const t0 = performance.now();
        (function run(t){
          const k = Math.min(1,(t - t0)/D);
          const ease = k < .5 ? 2*k*k : -1 + (4 - 2*k)*k;
          el.textContent = Math.round(to * ease).toLocaleString('en-IN');
          if (k<1) requestAnimationFrame(run);
        })(t0);
      });
    },{threshold:.5});
    nums.forEach(n=>io.observe(n));
  })();

  /* BLINK SEQUENCE for Choose Visit (Patient → Hospital → Insurer loop) */
  (function(){
    const cards = [
      qs('.choose__card--patient'),
      qs('.choose__card--hospital'),
      qs('.choose__card--insurer')
    ].filter(Boolean);
    if (!cards.length) return;
    let i = 0;
    function loop(){
      if (document.body.dataset.mode !== 'intro') return;
      cards.forEach(c=>c.classList.remove('blink'));
      cards[i].classList.add('blink');
      i = (i + 1) % cards.length;
      setTimeout(loop, 1400);
    }
    loop();
  })();

  /* MODE SWITCHING (show only selected audience) */
  qsa('.choose__card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      const target = card.dataset.target; // patient | hospital | insurer
      if (!target) return;
      e.preventDefault();
      document.body.dataset.mode = target;
      qsa('.choose__card').forEach(c=>c.classList.remove('blink'));
      card.classList.add('blink');
      const panelId = target === 'patient' ? '#patients' : target === 'hospital' ? '#hospitals' : '#insurers';
      ['#patients','#hospitals','#insurers'].forEach(id=>{
        const p = qs(id); if (p) p.hidden = (id !== panelId);
      });
      const el = qs(panelId);
      if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  /* APPLE-LIKE SLIDER (scroll-snap + arrow buttons) */
  qsa('[data-slider]').forEach(slider=>{
    const track = slider.querySelector('.slider__track');
    const prev = slider.querySelector('.slider__btn.prev');
    const next = slider.querySelector('.slider__btn.next');
    if (!track) return;

    function slide(dir){
      const cardWidth = track.querySelector('.slide')?.getBoundingClientRect().width || 320;
      track.scrollBy({left: dir * (cardWidth + 14), behavior:'smooth'});
    }
    prev?.addEventListener('click', ()=>slide(-1));
    next?.addEventListener('click', ()=>slide(1));
  });

  /* Coverage upload (mock) */
  (function(){
    const dz = document.getElementById('policy-drop');
    const fi = document.getElementById('policy-file');
    const out = document.getElementById('coverage-results');
    const list = document.getElementById('coverage-checklist');
    if(!dz || !fi) return;
    const parse = (name)=>[
      `Policy: ${name}`,
      'Sum insured: ₹5–20L (plan dependent)',
      'Room rent limit: ₹4,000/day (upgrade possible)',
      'Co-pay: None (< 55y); 10% (55+)',
      'Waiting: 1–3 yrs (PED typical 3 yrs)',
      'Day-care: 500+ procedures covered',
      'Common exclusions: Cosmetic, experimental, non-medical items'
    ];
    function show(name){
      list.innerHTML = '';
      parse(name).forEach(t=>{ const li=document.createElement('li'); li.textContent=t; list.appendChild(li); });
      out.hidden=false; out.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    dz.addEventListener('click',()=>fi.click());
    ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,(e)=>{e.preventDefault(); dz.style.borderColor='var(--tone)';}));
    ;['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,()=> dz.style.borderColor='color-mix(in srgb, var(--tone) 35%, #DCE7FF)'));
    dz.addEventListener('drop',(e)=>{ e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) show(f.name); });
    fi.addEventListener('change',()=>{ const f=fi.files?.[0]; if(f) show(f.name); });
  })();

  /* ROI calculator */
  (function(){
    const form = document.getElementById('roi-form'); if(!form) return;
    const outCash = document.getElementById('roi-cashin');
    const outDen  = document.getElementById('roi-denial');

    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const d = new FormData(form);
      const claims = +d.get('claims') || 0;
      const bill   = +d.get('bill')   || 0;
      const denial = +d.get('denial') || 12;

      const base = claims * bill;
      const newDenial = Math.max(0, denial * 0.4);
      const denialDrop = Math.max(0, denial - newDenial);
      const recovered = base * (denial / 100) * 0.5;
      const speedGain = base * 0.03;
      const cashIn90 = Math.round((recovered + speedGain) / 3);

      outCash.textContent = '₹ ' + cashIn90.toLocaleString('en-IN');
      outDen.textContent  = denialDrop.toFixed(1) + '%';
      qs('#hospitals .roi').scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  })();

  /* AI Guide button (placeholder) */
  const guide = qs('.aiguide');
  guide?.addEventListener('click', () => {
    alert('Hi! I can help you compare policies, estimate ROI, or find the right package. (Hook me to your chat later!)');
  });

})();
