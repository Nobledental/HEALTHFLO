/* =========================================================
   HealthFlo — main.js (advanced medical UX)
   ========================================================= */

const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const app = document.body;

/* Keyboard focus ring */
(() => {
  let k=false;
  on(window,'keydown',e=>{if(e.key==='Tab'){k=true; app.classList.add('using-keyboard');}});
  on(window,'mousedown',()=>{ if(k){k=false; app.classList.remove('using-keyboard'); }});
})();

/* Theme Studio */
(() => {
  const wrap  = $('.theme');
  if (!wrap) return;
  const panel = $('.theme__panel', wrap);
  const btns  = $$('.tbtn', panel);
  const saved = localStorage.getItem('hf-theme') || 'night';

  function apply(name){
    app.classList.remove('theme--day','theme--clinic','theme--contrast','theme--ios','theme--medical');
    if (name !== 'night') app.classList.add(`theme--${name}`);
    btns.forEach(b => b.classList.toggle('is-active', b.dataset.theme === name));
    localStorage.setItem('hf-theme', name);
  }
  apply(saved);

  on($('.theme__toggle', wrap), 'click', () => {
    wrap.setAttribute('aria-expanded', wrap.getAttribute('aria-expanded') !== 'true');
  }, {passive:true});

  btns.forEach(b => on(b, 'click', () => {
    apply(b.dataset.theme);
    wrap.setAttribute('aria-expanded','false');
  }, {passive:true}));

  on(document,'click',e=>{ if(!wrap.contains(e.target)) wrap.setAttribute('aria-expanded','false'); });
})();

/* Scroll Spy */
(() => {
  const nav = $('.nav__links'); if (!nav) return;
  const links = $$('a[href^="#"]', nav).filter(a => a.getAttribute('href').length > 1);
  const sections = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const id = entry.target.id;
      const link = nav.querySelector(`a[href="#${id}"]`);
      if (!link) return;
      if (entry.isIntersecting){
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-42% 0px -55% 0px', threshold: 0.01 });

  sections.forEach(sec => obs.observe(sec));
})();

/* Persona Tabs (no unwanted page scroll) + bubble motion */
(() => {
  const tabs = $$('.role-tab');
  const bubble = $('#roleBubble');
  const scopes = { patient: $('#p-scope'), hospital: $('#h-scope'), insurer: $('#i-scope') };
  const heroTitle = $('#hero-title');
  const heroCTA   = $('#hero-cta');
  const morphLbl  = $('#morphLabel');

  const TITLES = {
    patient:'Find, book & pay for care — cashless first.',
    hospital:'RCM, OPD & cashless enablement — built with hospitals.',
    insurer:'Structured distribution & cashless ops for insurers.'
  };
  const CTAS = {
    patient:'#p-scope',
    hospital:'#h-scope',
    insurer:'#i-scope'
  };

  function placeBubble(el){
    const r = el.getBoundingClientRect();
    const p = el.parentElement.getBoundingClientRect();
    const x = r.left - p.left;
    bubble.style.transform = `translate(${x - 10}px, -50%)`;
    bubble.style.width = `${r.width + 20}px`;
  }

  function setPersona(p, el){
    Object.entries(scopes).forEach(([k,sec])=> sec?.classList.toggle('is-active', k===p));
    tabs.forEach(t => {
      const active = t.dataset.persona === p;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    app.classList.remove('mode--patient','mode--hospital','mode--insurer');
    app.classList.add(`mode--${p}`);
    heroTitle.textContent = TITLES[p];
    heroCTA.setAttribute('href', CTAS[p]);
    morphLbl.textContent = p.replace(/^\w/, m=>m.toUpperCase());

    if (el) placeBubble(el);
  }

  tabs.forEach(t => on(t,'click', (e) => {
    e.preventDefault(); // stop hash scroll
    setPersona(t.dataset.persona, t);
  }));

  // initial bubble placement
  const active = $('.role-tab.is-active') || tabs[0];
  if (active) placeBubble(active);
  window.addEventListener('resize', () => {
    const live = $('.role-tab.is-active'); if (live) placeBubble(live);
  }, {passive:true});
})();

/* Typing line (persona-aware phrases) */
(() => {
  const el = $('#hero-sub'); if (!el) return;
  const persona =
    app.classList.contains('mode--patient')  ? 'patient'  :
    app.classList.contains('mode--hospital') ? 'hospital' : 'insurer';

  const PHRASES = {
    patient: [
      'Instant cashless checks at network hospitals.',
      'Transparent packages with taxes & add-ons visible.',
      '0% EMI available for approved treatments.',
      'ABHA linking (optional).'
    ],
    hospital: [
      'RCM suite: cashless, reimbursements, recovery, denials.',
      'Insurance desk with pre-auth SOPs & escalation.',
      'TPA matrix & SLAs with TAT heatmaps.',
      'OPD + billing + package builder.'
    ],
    insurer: [
      'Structured plan listings with network clarity.',
      'Partner discounts with guardrails & attribution.',
      'Cashless ops APIs with audit & anomaly checks.',
      'Campaign insights to lift conversions.'
    ]
  };
  const words = PHRASES[persona] || PHRASES.insurer;
  let i = 0, typing = true, t = 0;

  function tick(){
    const target = words[i % words.length];
    if (typing){
      t++;
      el.textContent = target.slice(0, t);
      if (t === target.length){
        typing = false;
        setTimeout(tick, 1400);
        return;
      }
      setTimeout(tick, 22 + Math.random()*40);
    } else {
      t--;
      el.textContent = target.slice(0, t);
      if (t <= 0){
        typing = true; i++; setTimeout(tick, 240); return;
      }
      setTimeout(tick, 18 + Math.random()*24);
    }
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) tick();
})();

/* Android-style Particle Grid */
(() => {
  const c = $('#particles'); if (!c) return;
  const mrm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const ctx = c.getContext('2d');

  function resize(){
    c.width  = c.clientWidth  * DPR;
    c.height = c.clientHeight * DPR;
  }
  resize(); on(window,'resize', resize, {passive:true});

  const dots = [];
  function seed(){
    dots.length = 0;
    const cols = Math.round(c.width / (44*DPR));
    const rows = Math.round(c.height / (36*DPR));
    for (let y = 0; y <= rows; y++){
      for (let x = 0; x <= cols; x++){
        dots.push({
          x: Math.floor((x + (y%2?0.5:0))*44*DPR),
          y: Math.floor(y*36*DPR),
          p: Math.random()*Math.PI*2,
          a: 0.35 + Math.random()*0.4
        });
      }
    }
  }
  seed();

  let t = 0;
  function draw(){
    if (mrm) return;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.strokeStyle = 'rgba(140,180,255,.05)';
    ctx.lineWidth = 1;
    for (let y=0; y<c.height; y+=36*DPR){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke(); }
    for (let x=0; x<c.width; x+=44*DPR){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke(); }
    dots.forEach(d => {
      const glow = 0.25 + 0.25*Math.sin(t*0.06 + d.p);
      ctx.fillStyle = `rgba(120,240,255,${(d.a*glow).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, 1.2*DPR, 0, Math.PI*2); ctx.fill();
    });
    t++; requestAnimationFrame(draw);
  }
  draw();
})();

/* Marquee hover pause (CSS handles pause) — ensure wide content */
(() => {
  const track = $('#cityTrack'); if (!track) return;
  // If content is too small, clone labels to fill
  if (track.scrollWidth < track.clientWidth * 2){
    track.innerHTML = track.innerHTML + track.innerHTML;
  }
})();

/* Tilt cards */
(() => {
  const items = $$('.tilt');
  items.forEach(card=>{
    let raf;
    function move(e){
      const b = card.getBoundingClientRect();
      const px = (e.clientX - b.left)/b.width - .5;
      const py = (e.clientY - b.top)/b.height - .5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        card.style.transform = `translateY(-4px) rotateX(${py*-8}deg) rotateY(${px*8}deg)`;
      });
    }
    function leave(){ cancelAnimationFrame(raf); card.style.transform = ''; }
    on(card,'mousemove',move,{passive:true}); on(card,'mouseleave',leave,{passive:true});
  });
})();

/* Chips deep-links */
(() => {
  $$('.chip--btn[data-go]').forEach(ch => {
    on(ch,'click', () => {
      const go = ch.getAttribute('data-go');
      const q  = ch.getAttribute('data-q');
      if (q){
        const input = $('#ask-patient') || document.querySelector('.intent__row .input');
        if (input) input.value = q;
      }
      if (go){
        const el = document.querySelector(go);
        if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
  // Footer persona links -> dedicated page
  $$('a[data-persona-link]').forEach(a => {
    on(a,'click', (e) => {
      // let anchor navigate normally
    }, {passive:true});
  });
})();

/* AI mini assistant (client-only heuristic) */
(() => {
  const form = $('#aiForm'); const input = $('#aiInput'); const line = $('#aiLine');
  if (!form || !input || !line) return;

  const HINTS = [
    { k:/\b(mumbai|bombay)\b.*(cataract|eye)/i, msg:'For cataract in Mumbai, we’ll show NABH partners with transparent package pricing.' },
    { k:/\b(bengaluru|bangalore)\b.*(knee|ortho)/i, msg:'Orthopedics in Bengaluru: compare single AC vs room cap & co-pay hints before pre-auth.' },
    { k:/\b(delhi)\b.*(cardiac|heart)/i, msg:'Cardiac in Delhi: we’ll check cashless pre-auth readiness and insurer network fit.' }
  ];
  function reply(txt){
    const hit = HINTS.find(h => h.k.test(txt));
    line.textContent = hit ? hit.msg : 'Got it — I’ll route you to cashless checks and matching network partners.';
  }
  on(form,'submit',(e)=>{
    e.preventDefault();
    const v = (input.value||'').trim();
    if (!v) { line.textContent = 'Tell me city + treatment (e.g., Chennai IVF)…'; return; }
    reply(v);
  });
})();

/* OTP + Eligibility + Co-pay */
(() => {
  const phone = $('#phone'); if(!phone) return;
  const btnSend = $('.js-send-otp');
  const btnVerify = $('.js-verify-otp');
  const otpWrap = $('.otp-wrap');
  const inputs = $$('.otp-i');
  const status = $('#otpStatus');
  let code = '';
  const gen = () => String(Math.floor(1000 + Math.random()*9000));

  on(btnSend,'click',()=>{
    const digits = (phone.value||'').replace(/\D/g,'');
    if(digits.length < 10){ status.textContent = 'Enter a valid phone number.'; return; }
    code = gen();
    status.textContent = 'OTP sent. Please enter the 4 digits.';
    otpWrap.classList.remove('hidden'); inputs[0].focus();
  });
  inputs.forEach((i,idx)=>{
    on(i,'input', ()=>{ i.value=i.value.replace(/\D/g,'').slice(0,1); if(i.value && inputs[idx+1]) inputs[idx+1].focus(); });
    on(i,'keydown', e=>{ if(e.key==='Backspace' && !i.value && inputs[idx-1]) inputs[idx-1].focus(); });
  });
  on(btnVerify,'click', ()=>{
    const entered = inputs.map(x=>x.value).join('');
    if(entered.length<4){ status.textContent='Enter all digits.'; return; }
    if(entered===code){ status.textContent='Phone verified ✓'; status.style.color='#22c55e'; }
    else { status.textContent='Incorrect code, try again.'; status.style.color='#ef4444'; }
  });

  // Eligibility
  const selects = { ins: $('#elig-ins'), city: $('#elig-city'), spec: $('#elig-spec'), sum: $('#elig-sum') };
  const out = $('.elig-result');
  function estimate(spec, sum){
    const base = { general:.8, dental:.6, ophthalmology:.72, ivf:.55, orthopedics:.66, cardiac:.62, oncology:.5 };
    const b = base[String(spec).toLowerCase()] ?? .6;
    const s = parseInt(sum,10)||5;
    const adj = s>20 ? -0.1 : s>10 ? -0.05 : 0.02;
    const val = Math.min(.92, Math.max(.3, b+adj));
    return Math.round(val*100);
  }
  function render(){
    const ins = selects.ins.value || 'Any';
    const city = selects.city.value;
    const spec = selects.spec.value;
    const sum = selects.sum.value;
    const pct = estimate(spec, sum);
    out.innerHTML = `<strong>Likely eligible: ${pct}%</strong> — for ${spec} with ₹${sum}L cover in ${city}. <em>${ins}</em>`;
  }
  Object.values(selects).forEach(el=> on(el,'change', render, {passive:true}));
  render();
  on($('#elig-copy'),'click', async ()=>{
    try { await navigator.clipboard.writeText(out.textContent.trim()); showToast('Eligibility summary copied'); }
    catch {}
  });

  // Co-pay
  const bill = $('#co-bill'), rate = $('#co-rate'), coOut = $('#co-out');
  function copay(){
    const b = Number(bill.value||0), r = Math.min(100, Math.max(0, Number(rate.value||0)));
    if(!b){ coOut.textContent='Enter bill to estimate co-pay.'; return; }
    const cop = Math.round(b * (r/100));
    coOut.innerHTML = `Estimated co-pay: <b>₹${cop.toLocaleString('en-IN')}</b>. Net payable by insurer: <b>₹${(b-cop).toLocaleString('en-IN')}</b>.`;
  }
  on(bill,'input', copay); on(rate,'input', copay);
})();

/* Toast */
function showToast(msg){
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(()=>{ t.style.opacity = '0'; }, 1600);
}

/* GSAP entrances & orb parallax */
(() => {
  if (!window.gsap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { gsap } = window;

  gsap.from('.card, .product, .geo-marquee', {
    y: 16, opacity: 0, duration: .55, ease: 'power2.out', stagger: .06,
    scrollTrigger: { trigger: '.card, .product, .geo-marquee', start: 'top 85%' }
  });

  window.addEventListener('pointermove', (e)=>{
    const { innerWidth:w, innerHeight:h } = window;
    const x = (e.clientX - w/2)/w, y = (e.clientY - h/2)/h;
    gsap.to('.orb-left',  { x: x*-30, y: y*-20, duration:.6, overwrite:true });
    gsap.to('.orb-right', { x: x* 40, y: y* 26, duration:.6, overwrite:true });
  }, {passive:true});
})();

/* Service Worker */
(() => {
  if ('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
    }, {once:true});
  }
})();
