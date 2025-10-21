/* =========================================================
   HealthFlo — Main JS (Pro)
   - Theme studio (incl. iOS White/Matt theme)
   - Persona engine (no scroll on switch) + role bubble spring
   - Morph transitions (Flubber fallback; no Club GSAP needed)
   - Typing / "texting" effect per persona
   - Scroll-spy, smooth anchors, marquee "Cities we serve"
   - OTP + Eligibility + Co-pay estimator
   - Tilt micro-interactions and toasts
   - Android 4K screen effect helpers
   - Perf: reduced motion, idle scheduling, passive listeners
   ========================================================= */

(() => {
  /* --------------- tiny helpers --------------- */
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
  const ls = {
    get:k=>{ try{return JSON.parse(localStorage.getItem(k));}catch{return null;} },
    set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
  };
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------- focus-visible ring --------------- */
  (() => {
    let kb=false;
    on(window,'keydown',e=>{ if(e.key==='Tab'){ kb=true; document.body.classList.add('using-keyboard'); }}, {passive:true});
    on(window,'mousedown',()=>{ if(kb){ kb=false; document.body.classList.remove('using-keyboard'); }}, {passive:true});
  })();

  /* =====================================================
     THEME STUDIO
  ===================================================== */
  (() => {
    const wrap = $('.theme');
    if(!wrap) return;
    const tbtns = $$('.tbtn', wrap);
    const panel = $('.theme__panel', wrap);
    const saved = ls.get('hf-theme') || 'night';

    function applyTheme(name){
      const themes = ['night','day','aurora','clinic','contrast','ios'];
      themes.forEach(t => document.body.classList.remove(`theme--${t}`));
      if(name !== 'night') document.body.classList.add(`theme--${name}`);
      tbtns.forEach(b => b.classList.toggle('is-active', b.dataset.theme === name));
      ls.set('hf-theme', name);
    }

    applyTheme(saved);
    on($('.theme__toggle', wrap), 'click', () => {
      wrap.setAttribute('aria-expanded', wrap.getAttribute('aria-expanded') !== 'true');
    });
    tbtns.forEach(b => on(b,'click', () => { applyTheme(b.dataset.theme); wrap.setAttribute('aria-expanded','false'); }));
    on(document, 'click', (e) => { if(!wrap.contains(e.target)) wrap.setAttribute('aria-expanded','false'); }, {passive:true});
  })();

  /* =====================================================
     SCROLL-SPY + SMOOTH ANCHORS
  ===================================================== */
  (() => {
    // Smooth anchor (skip persona-links; those shouldn't scroll)
    $$('a[href^="#"]').forEach(a => {
      if (a.hasAttribute('data-persona-link')) return; // do not scroll for persona quick links
      on(a, 'click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (prefersReduced) { target.scrollIntoView(); return; }
        target.scrollIntoView({behavior:'smooth', block:'start', inline:'nearest'});
      });
    });

    // Scroll-spy
    const navLinks = $$('.nav__links a');
    const sections = ['#hero','#locations','#content','#trust','#contact']
      .map(id => $(id))
      .filter(Boolean);
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(ent => {
          if (ent.isIntersecting){
            const id = `#${ent.target.id}`;
            navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
          }
        });
      }, { root:null, threshold:0.4 });
      sections.forEach(s => io.observe(s));
    }
  })();

  /* =====================================================
     ROLE TABS / PERSONA ENGINE (No auto-scroll)
  ===================================================== */
  const Persona = (() => {
    const tabs = $$('.role-tab');
    const bubble = $('#roleBubble');
    const title = $('#hero-title');
    const sub   = $('#hero-sub');
    const chipsRow = $('#hero-chips');
    const cta   = $('#hero-cta');
    const path  = $('#morphPath');
    const label = $('#morphLabel');

    // Path presets (rounded badge-like shapes, friendly to flubber)
    const PATHS = {
      patient: 'M12 20a12 12 0 0 1 12-12h16a12 12 0 0 1 12 12v24a12 12 0 0 1-12 12H24A12 12 0 0 1 12 44V20z',
      hospital:'M10 24a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10H20A10 10 0 0 1 10 46V24z M28 20h4v10h10v4H32v10h-4V34H18v-4h10z',
      insurer: 'M12 24c0-8 10-12 20-12s20 4 20 12v12c0 12-10 18-20 22-10-4-20-10-20-22V24z'
    };

    // Persona content (India-market copy)
    const COPY = {
      patient: {
        h1: 'Find, book & pay for care — cashless first.',
        sub: ['Instant cashless checks', 'Transparent packages', '0% EMI (approved)', 'ABHA-ready flows'],
        cta: { text:'Start as Patient', href:'#p-scope' },
        chips: ['Cashless pre-auth','Transparent packages','0% EMI']
      },
      hospital: {
        h1: 'RCM for hospitals — cashless, reimbursements & denials.',
        sub: ['Pre-auth SOPs & TAT heatmaps', 'Insurance desk workflow', 'TPA escalation desk'],
        cta: { text:'Explore Hospital Suite', href:'#h-scope' },
        chips: ['RCM Suite','OPD & Billing','Get Listed']
      },
      insurer: {
        h1: 'Distribution & ops for India — structured listings & APIs.',
        sub: ['Plan schema & network view', 'Preferred discounts', 'Cashless Ops API + webhooks'],
        cta: { text:'Explore Insurer Tools', href:'#i-scope' },
        chips: ['Marketplace','Campaigns','Ops API']
      }
    };

    function moveBubbleTo(el){
      if(!bubble || !el) return;
      const p = el.parentElement.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const x = r.left - p.left;
      const w = r.width;
      bubble.style.transform = `translate(${Math.round(x)}px, -50%)`;
      bubble.style.width = `${Math.round(w)}px`;
    }

    function morphTo(key){
      if (!path) return;
      const to = PATHS[key] || PATHS.patient;
      try{
        if (window.flubber && typeof flubber.interpolate === 'function'){
          const from = path.getAttribute('d');
          const interp = flubber.interpolate(from, to, {maxSegmentLength:2});
          const dur = 500, start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start)/dur);
            path.setAttribute('d', interp(t));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        } else {
          // fallback: snap
          path.setAttribute('d', to);
        }
      } catch { path.setAttribute('d', to); }
      // gradient swap
      const grad = key === 'patient' ? 'gradPatient' : key === 'hospital' ? 'gradHospital' : 'gradInsurer';
      path.setAttribute('fill', `url(#${grad})`);
      label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    }

    function renderCopy(key){
      const c = COPY[key];
      if(!c) return;
      title.textContent = c.h1;
      cta.textContent = c.cta.text;
      cta.setAttribute('href', c.cta.href);

      // Build chips + typing phrases
      chipsRow.innerHTML = '';
      c.chips.forEach(txt => {
        const s = document.createElement('span');
        s.className = 'chip';
        s.textContent = txt;
        chipsRow.appendChild(s);
      });
      Typist.setPhrases(c.sub);
    }

    function setPersona(key, {persist=true, fromClickEl=null}={}){
      // modes on <body>
      document.body.classList.remove('mode--patient','mode--hospital','mode--insurer');
      document.body.classList.add(`mode--${key}`);

      // scopes toggle (no scroll!)
      const scopes = { patient: $('#p-scope'), hospital: $('#h-scope'), insurer: $('#i-scope') };
      Object.entries(scopes).forEach(([k, el]) => el?.classList.toggle('is-active', k === key));

      // tabs state
      tabs.forEach(t => {
        const active = t.dataset.persona === key;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
        if (active && fromClickEl) moveBubbleTo(t);
      });

      morphTo(key);
      renderCopy(key);
      if (persist) ls.set('hf-persona', key);
      // gently bounce chips
      try { window.HFAnimations?.bounceHeroChips?.(); } catch {}
    }

    // init bubble & persona from storage
    const def = ls.get('hf-persona') || 'patient';
    setPersona(def, {persist:false});
    // place bubble after paint
    requestAnimationFrame(() => {
      const active = $('.role-tab.is-active');
      if (active) moveBubbleTo(active);
    });
    // listeners
    tabs.forEach(t => on(t, 'click', (e) => {
      e.preventDefault(); // no anchor jump
      const key = t.dataset.persona;
      setPersona(key, {fromClickEl:t});
      // DO NOT scroll anywhere.
    }));

    // footer quick links (stop scroll)
    $$('[data-persona-link]').forEach(a => {
      on(a, 'click', (e) => {
        e.preventDefault();
        const key = a.getAttribute('data-persona-link');
        setPersona(key);
      });
    });

    // Expose
    return { set: setPersona, moveBubbleTo };
  })();

  /* =====================================================
     TYPING / "TEXTING" EFFECT (hero-sub)
  ===================================================== */
  const Typist = (() => {
    const el = $('#hero-sub');
    let phrases = ['Instant cashless checks', 'Transparent packages', '0% EMI (approved)'];
    let i = 0, pos = 0, deleting = false, raf = null, last = 0;

    function step(now){
      if (!el) return;
      const dt = now - last; if (dt < 16) { raf = requestAnimationFrame(step); return; }
      last = now;

      const full = phrases[i % phrases.length];
      const cur = el.textContent.replace(/\u00A0/g,' '); // normalize nbsp
      const target = deleting ? full.slice(0, Math.max(0,pos-1)) : full.slice(0, pos+1);
      if (cur !== target){
        el.classList.add('type-caret');
        el.textContent = target;
        pos = target.length;
      } else {
        // pause endpoints
        const pause = deleting ? 500 : 1200;
        if (!deleting && pos >= full.length) {
          deleting = true;
          setTimeout(()=>{}, pause);
        } else if (deleting && pos === 0){
          deleting = false; i++;
        }
      }

      // Variable speed for "human" texting feel
      const base = deleting ? 32 : 48;
      const jitter = Math.random()*24;
      setTimeout(()=> { raf = requestAnimationFrame(step); }, base + jitter);
    }

    function start(){ if (prefersReduced) return; if (!raf) raf = requestAnimationFrame(step); }
    function stop(){ if (raf) cancelAnimationFrame(raf); raf = null; }
    function setPhrases(arr){ phrases = Array.isArray(arr) && arr.length ? arr : phrases; i = 0; pos = 0; deleting=false; }

    start();
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    return { setPhrases, start, stop };
  })();

  /* =====================================================
     CITIES "RUNNING NEWS" MARQUEE
  ===================================================== */
  (() => {
    const container = $('#locations');
    if (!container) return;
    const old = $('#loc-slider', container);
    if (old) old.remove();

    // Build marquee
    const marquee = document.createElement('div');
    marquee.className = 'marquee';
    const track = document.createElement('div');
    track.className = 'track';
    marquee.appendChild(track);
    container.appendChild(marquee);

    const DATA = [
      {city:'Delhi',     stat:'160+ partners'},
      {city:'Mumbai',    stat:'140+ partners'},
      {city:'Bengaluru', stat:'120+ partners'},
      {city:'Hyderabad', stat:'100+ partners'},
      {city:'Chennai',   stat:'110+ partners'},
      {city:'Pune',      stat:'80+ partners'}
    ];
    function buildItems(){
      track.innerHTML = '';
      const list = [...DATA, ...DATA]; // repeat for seamless loop
      list.forEach(item => {
        const n = document.createElement('span');
        n.className = 'item';
        n.innerHTML = `<svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="currentColor" /></svg> ${item.city} • ${item.stat}`;
        track.appendChild(n);
      });
    }
    buildItems();
  })();

  /* =====================================================
     OTP + ELIGIBILITY + CO-PAY
  ===================================================== */
  (() => {
    // OTP
    const phone = $('#phone');
    const send  = $('.js-send-otp');
    const verify= $('.js-verify-otp');
    const otpWrap = $('.otp-wrap');
    const inputs = $$('.otp-i');
    const status = $('#otpStatus');
    let code = '';

    function gen(){ return String(Math.floor(1000 + Math.random()*9000)); }
    on(send, 'click', () => {
      if(!phone) return;
      const digits = (phone.value||'').replace(/\D/g,'');
      if (digits.length < 10){ status.textContent = 'Enter a valid phone number.'; return; }
      code = gen();
      status.textContent = 'OTP sent. Please enter the 4 digits.';
      otpWrap?.classList.remove('hidden');
      inputs[0]?.focus();
    });
    inputs.forEach((i,idx) => {
      on(i, 'input', () => { i.value = i.value.replace(/\D/g,'').slice(0,1); if(i.value && inputs[idx+1]) inputs[idx+1].focus(); });
      on(i, 'keydown', (e) => { if(e.key==='Backspace' && !i.value && inputs[idx-1]) inputs[idx-1].focus(); });
    });
    on(verify, 'click', () => {
      const entered = inputs.map(x=>x.value).join('');
      if (entered.length < 4){ status.textContent = 'Enter all digits.'; return; }
      if (entered === code){ status.textContent = 'Phone verified ✓'; status.style.color = '#22c55e'; toast('Phone verified'); }
      else { status.textContent = 'Incorrect code, try again.'; status.style.color = '#ef4444'; }
    });

    // Eligibility
    const root = $('#patient-elig');
    if(!root) return;
    const selects = {
      ins:  $('#elig-ins', root),
      city: $('#elig-city', root),
      spec: $('#elig-spec', root),
      sum:  $('#elig-sum', root)
    };
    const out  = $('.elig-result', root);
    const copy = $('#elig-copy', root);

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
      const city= selects.city.value;
      const spec= selects.spec.value;
      const sum = selects.sum.value;
      const pct = estimate(spec, sum);
      out.innerHTML = `<strong>Likely eligible: ${pct}%</strong> — for ${spec} with ₹${sum}L cover in ${city}. <em>${ins}</em>`;
    }
    Object.values(selects).forEach(el => on(el, 'change', render, {passive:true}));
    render();

    on(copy, 'click', async () => {
      try {
        await navigator.clipboard.writeText(out.textContent || '');
        toast('Eligibility copied');
      } catch { toast('Copy failed'); }
    });

    // Co-pay
    const bill = $('#co-bill'), rate = $('#co-rate'), coOut = $('#co-out');
    function copay(){
      const b = Number(bill.value||0), r = Math.min(100, Math.max(0, Number(rate.value||0)));
      if (!b){ coOut.textContent='Enter bill to estimate co-pay.'; return; }
      const cop = Math.round(b * (r/100));
      coOut.innerHTML = `Estimated co-pay: <b>₹${cop.toLocaleString('en-IN')}</b>. Net payable: <b>₹${(b-cop).toLocaleString('en-IN')}</b>.`;
    }
    on(bill,'input', copay); on(rate,'input', copay);
  })();

  /* =====================================================
     INTENT CHIPS (quick focus / prefill)
  ===================================================== */
  (() => {
    $$('.chip--btn').forEach(btn => {
      on(btn, 'click', () => {
        const go = btn.getAttribute('data-go');
        const q  = btn.getAttribute('data-q');
        if (q){ const i = $('#ask-patient'); if (i){ i.value = q; i.focus(); } }
        if (go){
          const t = $(go);
          if (t && !prefersReduced) t.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });
  })();

  /* =====================================================
     TILT (cards)
  ===================================================== */
  (() => {
    if (prefersReduced) return;
    const items = $$('.tilt');
    items.forEach(card=>{
      let raf;
      function move(e){
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left)/b.width - .5;
        const py = (e.clientY - b.top)/b.height - .5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=>{ card.style.transform = `translateY(-4px) rotateX(${py*-6}deg) rotateY(${px*6}deg)`; });
      }
      function leave(){ cancelAnimationFrame(raf); card.style.transform = ''; }
      on(card,'mousemove',move); on(card,'mouseleave',leave);
    });
  })();

  /* =====================================================
     TOAST
  ===================================================== */
  function toast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg;
    t.classList.add('in');
    setTimeout(()=> t.classList.remove('in'), 1800);
  }

  /* =====================================================
     ANDROID 4K SCREEN EFFECT
  ===================================================== */
  (() => {
    // If you want the hero to have Android neon grid,
    // add .android-grid to the .hero or a wrapper around persona stage in HTML.
    // Example toggle if needed:
    // document.querySelector('.hero')?.classList.add('android-grid');
  })();

  /* =====================================================
     PERF: defer heavy bits to idle
  ===================================================== */
  if ('requestIdleCallback' in window){
    requestIdleCallback(() => {
      // any future non-critical work can go here
    }, { timeout: 1500 });
  }

})();
