/* =========================================================
   HealthFlo — Core UI (persona, nav, typing, marquee, tilt)
   - Persona switch (NO page scroll)
   - Role bubble (springy) + theme studio
   - Scroll-spy (IntersectionObserver)
   - Typing effect (SMS/assistant vibe)
   - Cities “news” marquee (pauses on hover)
   - Reveal on view (.reveal/.enter-*)
   - Tilt micro-motion for cards
   - LCP preloading helpers
   - Accessibility: keyboard focus ring, reduced motion
   ========================================================= */

(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const ls = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set: (k,v) => localStorage.setItem(k, JSON.stringify(v))
  };
  const app = document.body;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------
     Keyboard focus ring (a11y)
  ------------------------------------------- */
  (() => {
    let using = false;
    on(window, 'keydown', e => {
      if (e.key === 'Tab' && !using) { using = true; app.classList.add('using-keyboard'); }
    });
    on(window, 'mousedown', () => {
      if (using) { using = false; app.classList.remove('using-keyboard'); }
    });
  })();

  /* -------------------------------------------
     Theme studio (persist)
  ------------------------------------------- */
  (() => {
    const wrap  = $('.theme'); if (!wrap) return;
    const panel = $('.theme__panel', wrap);
    const btns  = $$('.tbtn', panel);
    const saved = ls.get('hf-theme') || 'night';

    const apply = (name) => {
      app.classList.remove('theme--day','theme--aurora','theme--clinic','theme--contrast');
      if (name !== 'night') app.classList.add(`theme--${name}`);
      btns.forEach(b => b.classList.toggle('is-active', b.dataset.theme === name));
      ls.set('hf-theme', name);
    };
    apply(saved);

    on($('.theme__toggle', wrap), 'click', () => {
      const next = wrap.getAttribute('aria-expanded') !== 'true';
      wrap.setAttribute('aria-expanded', String(next));
    });

    btns.forEach(b => on(b, 'click', () => {
      apply(b.dataset.theme);
      wrap.setAttribute('aria-expanded', 'false');
    }));

    on(document, 'click', (e) => {
      if (!wrap.contains(e.target)) wrap.setAttribute('aria-expanded','false');
    });
  })();

  /* -------------------------------------------
     Persona switching (NO PAGE SCROLL)
     - Large role tabs + bubble
     - Scope sections (#p-scope, #h-scope, #i-scope)
     - Persist selection
  ------------------------------------------- */
  const Persona = (() => {
    const tabsWrap = $('.role-tabs');
    if (!tabsWrap) return null;

    const tabs  = $$('.role-tab', tabsWrap);
    const bubble = $('#roleBubble');
    const scopes = {
      patient:  $('#p-scope'),
      hospital: $('#h-scope'),
      insurer:  $('#i-scope')
    };
    const key = 'hf-persona';
    const start = (ls.get(key) || 'patient');

    function setMode(mode, opts={animate:true}) {
      // body mode class
      app.classList.remove('mode--patient','mode--hospital','mode--insurer');
      app.classList.add(`mode--${mode}`);

      // tabs state
      tabs.forEach(t => {
        const active = t.dataset.persona === mode;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });

      // move bubble
      moveBubbleTo(mode, opts.animate);

      // scopes
      Object.entries(scopes).forEach(([name, el]) => {
        if (!el) return;
        el.classList.toggle('is-active', name === mode);
      });

      // hero chips + text swap (optional persona copy hooks)
      swapPersonaCopy(mode);

      ls.set(key, mode);
    }

    function moveBubbleTo(mode, animate=true) {
      const target = tabs.find(t => t.dataset.persona === mode);
      if (!target || !bubble) return;

      const wrapRect = tabsWrap.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const x = rect.left - wrapRect.left + rect.width/2 - bubble.offsetWidth/2;

      // CSS transform via CSS custom props for gentle “breathing” keyframes
      bubble.style.setProperty('--bx', `${x}px`);
      bubble.style.setProperty('--by', `-50%`);
      if (!prefersReduced && animate) {
        bubble.classList.add('breathe'); // tiny breathing animation
      } else {
        bubble.classList.remove('breathe');
      }
      bubble.style.transform = `translate(${x}px, -50%)`;
      bubble.style.width = `${Math.max(140, rect.width)}px`;
      bubble.style.height = `${Math.max(56, rect.height)}px`;

      // gradient depends on persona
      const grads = {
        patient:  'linear-gradient(120deg,var(--p1),var(--p2))',
        hospital: 'linear-gradient(120deg,var(--p1),var(--p2))',
        insurer:  'linear-gradient(120deg,var(--p1),var(--p2))',
      };
      bubble.style.background = grads[app.classList.contains('mode--patient')?'patient':
                                   app.classList.contains('mode--hospital')?'hospital':'insurer'];
    }

    function swapPersonaCopy(mode) {
      // Hero headline/subtitle & chips — only if IDs exist
      const h1   = $('#hero-title');
      const sub  = $('#hero-sub');
      const chips = $('#hero-chips');
      if (!h1 || !sub || !chips) return;

      const data = {
        patient: {
          title: 'Find, book & pay for care — cashless first.',
          sub:   'Instant cashless checks, transparent packages, and 0% EMI for approved treatments. ABHA-ready.',
          chips: ['Cashless pre-auth','Transparent packages','0% EMI']
        },
        hospital: {
          title: 'RCM Suite for hospitals — fewer denials, faster cash flows.',
          sub:   'Cashless, reimbursements, recovery & denials. Insurance desk tools, SOPs & TAT heatmaps.',
          chips: ['RCM Suite','Claims tracking','TPA SLAs']
        },
        insurer: {
          title: 'List plans, run campaigns, and streamline cashless ops.',
          sub:   'IRDAI-aware listings, conversions by specialty, and pre-auth webhooks with audit logs.',
          chips: ['Structured listings','Network views','Ops webhooks']
        }
      };

      const pack = data[mode];
      h1.textContent = pack.title;
      sub.textContent = pack.sub;
      chips.innerHTML = pack.chips.map(c => `<span class="chip">${c}</span>`).join('');
    }

    // stop page scroll on persona click
    tabs.forEach(tab => {
      on(tab, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMode(tab.dataset.persona);
      });
    });

    // Footer quick links: <a data-persona-link="patient">
    $$('[data-persona-link]').forEach(a => {
      on(a, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const who = a.getAttribute('data-persona-link');
        setMode(who);
        // Optional: focus the section header for screen-readers
        const head = $(`#${who[0]}-title`) || $('#content');
        head?.focus?.();
      });
    });

    // On load & on resize (bubble positioning)
    window.addEventListener('resize', () => moveBubbleTo(ls.get(key) || 'patient', false));
    setMode(start, {animate:false});

    return { setMode };
  })();

  /* -------------------------------------------
     Smooth anchor scroll (but NOT persona tabs)
  ------------------------------------------- */
  $$('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    const target = href && href.length > 1 ? $(href) : null;
    if (!target) return;

    // Skip role tabs and persona links (handled above)
    if (a.closest('.role-tabs') || a.hasAttribute('data-persona-link')) return;

    on(a, 'click', (e) => {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* -------------------------------------------
     Scroll Spy (sections: hero, locations, content, trust, contact)
  ------------------------------------------- */
  (() => {
    const links = $$('.nav__links a[href^="#"]');
    if (!links.length || typeof IntersectionObserver === 'undefined') return;

    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('href');
      const sec = id && $(id);
      if (sec) map.set(sec, a);
    });

    const activate = (a) => {
      links.forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          const a = map.get(ent.target);
          if (a) activate(a);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });

    map.forEach((_, sec) => io.observe(sec));
  })();

  /* -------------------------------------------
     Typing effect (assistant / SMS vibe)
     - Looks for: [data-typewrite] or #hero-sub
  ------------------------------------------- */
  (() => {
    const el = $('[data-typewrite]') || $('#hero-sub');
    if (!el) return;

    const phrasesByMode = {
      patient: [
        'Checking network cashless…',
        'Finding transparent packages…',
        'Pre-auth tips ready. ✅',
        '0% EMI available for eligible cases.'
      ],
      hospital: [
        'Reconciling claims…',
        'Spotting denials early…',
        'TAT heatmap updated. ✅',
        'RCM playbooks at your desk.'
      ],
      insurer: [
        'Syncing pre-auth webhooks…',
        'Listing plans by specialty…',
        'Fraud signals calibrated. ✅',
        'Network view refreshed.'
      ]
    };

    function currentMode(){
      if (app.classList.contains('mode--hospital')) return 'hospital';
      if (app.classList.contains('mode--insurer'))  return 'insurer';
      return 'patient';
    }

    let idx = 0, running = false;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden','true');

    const tick = async () => {
      if (running) return;
      running = true;

      const list = phrasesByMode[currentMode()];
      idx = (idx + 1) % list.length;
      const text = list[idx];

      // type
      el.textContent = '';
      el.appendChild(cursor);
      for (let i = 0; i < text.length; i++){
        await sleep(16 + Math.random()*22);
        cursor.before(document.createTextNode(text[i]));
      }
      // hold then delete
      await sleep(1100);
      for (let i = 0; i < text.length; i++){
        await sleep(8 + Math.random()*18);
        const t = el.childNodes[0]?.textContent || '';
        el.childNodes[0].textContent = t.slice(0, -1);
      }
      running = false;
    };

    function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

    // loop
    if (!prefersReduced){
      setInterval(tick, 2200);
      tick();
    }
  })();

  /* -------------------------------------------
     “Cities we serve” marquee (news ticker)
     - Create if #locMarquee exists
  ------------------------------------------- */
  (() => {
    const wrap = $('#locMarquee') || $('#loc-slider')?.parentElement?.querySelector('.marquee');
    // Prefer #locMarquee. If not present, try converting old slider to marquee
    let marquee = $('#locMarquee');
    if (!marquee && wrap) marquee = wrap;

    if (!marquee) return;

    const track = marquee.querySelector('.track') || (() => {
      const t = document.createElement('div');
      t.className = 'track';
      marquee.appendChild(t);
      return t;
    })();

    const cities = [
      { name:'Delhi NCR', count: '120+ partners' },
      { name:'Mumbai', count: '90+ partners' },
      { name:'Bengaluru', count: '110+ partners' },
      { name:'Hyderabad', count: '70+ partners' },
      { name:'Chennai', count: '65+ partners' },
      { name:'Pune', count: '40+ partners' }
    ];

    function chip(c){ return `<span class="chip springy">${c.name} • ${c.count}</span>`; }
    // duplicate content for seamless loop
    track.innerHTML = (cities.map(chip).join('') + cities.map(chip).join(''));

    // Pause on focus for a11y
    on(marquee, 'focusin', () => { track.style.animationPlayState = 'paused'; });
    on(marquee, 'focusout', () => { track.style.animationPlayState = 'running'; });
  })();

  /* -------------------------------------------
     Reveal on view (CSS helpers toggled by IO)
  ------------------------------------------- */
  (() => {
    const items = $$('.reveal, .enter-fade, .enter-rise, [data-animate]');
    if (!items.length || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting){
          ent.target.classList.add('in');
          ent.target.removeAttribute('data-animate'); // optional cleanup
          io.unobserve(ent.target);
        }
      });
    }, { rootMargin:'-5% 0px -10% 0px', threshold:0.01 });

    items.forEach(el => io.observe(el));
  })();

  /* -------------------------------------------
     Tilt micro-interaction (cards with .tilt)
  ------------------------------------------- */
  (() => {
    const cards = $$('.tilt');
    if (!cards.length) return;

    cards.forEach(card => {
      let raf;
      function move(e){
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left)/b.width - .5;
        const py = (e.clientY - b.top)/b.height - .5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--ry', `${px*8}deg`);
          card.style.setProperty('--rx', `${py*-8}deg`);
        });
      }
      function leave(){
        cancelAnimationFrame(raf);
        card.style.setProperty('--ry','0deg');
        card.style.setProperty('--rx','0deg');
      }
      on(card, 'mousemove', move);
      on(card, 'mouseleave', leave);
    });
  })();

  /* -------------------------------------------
     LCP Preload helpers
     - Looks for [data-lcp="url"] or defaults to /assets/img/hero-static.svg
  ------------------------------------------- */
  (() => {
    const existing = document.querySelector('link[rel="preload"][as="image"][data-lcp]');
    if (existing) return;

    const target = document.querySelector('[data-lcp]')?.getAttribute('data-lcp') || 'assets/img/hero-static.svg';
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as  = 'image';
    link.href = target;
    link.setAttribute('data-lcp','');
    document.head.appendChild(link);
  })();

  /* -------------------------------------------
     Nav burger (mobile)
  ------------------------------------------- */
  (() => {
    const btn = $('.nav__toggle');
    const links = $('.nav__links');
    if (!btn || !links) return;

    on(btn, 'click', () => {
      const exp = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!exp));
      links.dataset.open = String(!exp);
    });

    // Close on click outside
    on(document, 'click', (e) => {
      if (!links.contains(e.target) && !btn.contains(e.target)) {
        btn.setAttribute('aria-expanded','false');
        delete links.dataset.open;
      }
    });
  })();

  /* -------------------------------------------
     Prevent default scroll jump for persona links
     (extra safety: if any anchor has data-nojump)
  ------------------------------------------- */
  $$('a[data-nojump]').forEach(a => {
    on(a, 'click', (e) => { e.preventDefault(); e.stopPropagation(); });
  });

})();
