/* ==========================================================================
   HealthFlo — main.js (advanced)
   - Persona router (no scroll), role bubble spring, Flubber morph
   - Scroll spy, smooth anchors, typing effect
   - Ripple + press feedback, Android-style
   - Cities marquee (news-ticker style, pause on hover)
   - Particles / starfield + HDR grid twinkle
   - OTP demo, eligibility estimator, co-pay calc, copy
   - Theme studio persistence + keyboard focus ring
   - Performance: passive listeners, rAF batching, idle hydration
   ========================================================================== */

/* -----------------------------------------
   Tiny helpers
------------------------------------------ */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const ls = {
  get: (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const runIdle = (cb, opts) => {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(cb, opts);
  } else {
    const delay = opts && typeof opts.timeout === 'number' ? opts.timeout : 1;
    setTimeout(cb, delay);
  }
};

/* -----------------------------------------
   Keyboard focus ring (a11y)
------------------------------------------ */
(() => {
  let using = false;
  on(window, 'keydown', (e) => { if (e.key === 'Tab') { using = true; document.body.classList.add('using-keyboard'); } }, { passive: true });
  on(window, 'mousedown', () => { if (using) { using = false; document.body.classList.remove('using-keyboard'); } }, { passive: true });
})();

/* -----------------------------------------
   Theme Studio (persist)
------------------------------------------ */
(() => {
  const wrap = $('.theme');
  if (!wrap) return;
  const panel = $('.theme__panel', wrap);
  const toggle = $('.theme__toggle', wrap);
  const btns = $$('.tbtn', panel);
  const saved = ls.get('hf-theme', 'night');

  function apply(name) {
    document.body.classList.remove('theme--day','theme--aurora','theme--clinic','theme--contrast','theme--apple');
    if (name !== 'night') document.body.classList.add(`theme--${name}`);
    btns.forEach(b => b.classList.toggle('is-active', b.dataset.theme === name));
    ls.set('hf-theme', name);
  }

  apply(saved);
  on(toggle, 'click', () => wrap.setAttribute('aria-expanded', String(wrap.getAttribute('aria-expanded') !== 'true')));
  btns.forEach(b => on(b, 'click', () => {
    apply(b.dataset.theme);
    wrap.setAttribute('aria-expanded', 'false');
  }));
  on(document, 'click', (e) => { if (!wrap.contains(e.target)) wrap.setAttribute('aria-expanded','false'); });
})();

/* -----------------------------------------
   Scroll spy (update nav active state)
------------------------------------------ */
const spy = (() => {
  const links = $$('.nav__links a[href^="#"]');
  const map = new Map(links.map(a => [a.getAttribute('href'), a]));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = `#${entry.target.id}`;
      const link = map.get(id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });

  function mount() {
    map.forEach((_a, hash) => {
      const sec = document.querySelector(hash);
      if (sec) obs.observe(sec);
    });
  }
  requestIdleCallback ? requestIdleCallback(mount) : setTimeout(mount, 1);
  return { mount };
})();

/* -----------------------------------------
   Role tabs + persona router (no page jump)
------------------------------------------ */
const router = (() => {
  const tabs = $$('.role-tab');
  const bubble = $('#roleBubble');
  const title = $('#hero-title');
  const sub   = $('#hero-sub');
  const chips = $('#hero-chips');
  const cta   = $('#hero-cta');
  const morphPath = $('#morphPath');
  const morphLabel = $('#morphLabel');
  const scopes = {
    patient: $('#p-scope'),
    hospital: $('#h-scope'),
    insurer: $('#i-scope')
  };

  const SHAPES = {
    patient: 'M12 20a12 12 0 0 1 12-12h16a12 12 0 0 1 12 12v24a12 12 0 0 1-12 12H24A12 12 0 0 1 12 44V20z',
    hospital: 'M10 24a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v18c0 8-8 14-22 20-14-6-22-12-22-20V24z',
    insurer: 'M8 22c0-9 12-14 24-14s24 5 24 14v14c0 14-12 21-24 26C20 57 8 50 8 36V22z'
  };
  const GRAD = {
    patient: 'url(#gradPatient)',
    hospital: 'url(#gradHospital)',
    insurer: 'url(#gradInsurer)'
  };
  const PHRASES = {
    patient: [
      'Instant cashless checks in India 🇮🇳',
      'Transparent packages by city',
      '0% EMI on approved care',
      'ABHA-ready journeys'
    ],
    hospital: [
      'RCM: cashless + reimbursements',
      'Denial management & recovery',
      'Insurance desk & pre-auth SOPs',
      'TPA SLAs & TAT heatmaps'
    ],
    insurer: [
      'Structured listings & network views',
      'City campaigns + preferred pricing',
      'Cashless Ops webhooks & panel',
      'Fraud signals & anomalies'
    ]
  };

  function setBubbleTo(el) {
    if (!bubble || !el) return;
    const p = el.parentElement.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = r.left - p.left + (r.width - bubble.offsetWidth) / 2;
    bubble.style.transform = `translateX(${Math.round(x)}px) translateY(-50%)`;
    bubble.style.width = `${Math.max(140, r.width)}px`;
    bubble.style.height = `${Math.max(56, r.height)}px`;
  }

  function morphTo(kind) {
    if (!window.flubber || !morphPath) return;
    const from = morphPath.getAttribute('d');
    const to   = SHAPES[kind] || SHAPES.patient;
    if (from === to) return;
    const interp = flubber.interpolate(from, to, { maxSegmentLength: 2 });
    const start = performance.now();
    const dur = prefersReduced ? 0 : 620;

    function step(t) {
      const k = Math.min(1, (t - start) / dur);
      morphPath.setAttribute('d', interp(k));
      if (k < 1) requestAnimationFrame(step);
    }
    morphPath.setAttribute('fill', GRAD[kind] || GRAD.patient);
    requestAnimationFrame(step);
    morphLabel.textContent = kind[0].toUpperCase() + kind.slice(1);
  }

  function typing(lines) {
    if (!sub) return;
    // typing like texting
    let i = 0, ch = 0, dir = 1;
    let current = lines[0] || '';
    function tick() {
      ch += dir;
      sub.textContent = current.slice(0, ch);
      if (dir > 0 && ch >= current.length) {
        dir = 0;
        setTimeout(() => { dir = -1; }, 1300);
      } else if (dir < 0 && ch <= 0) {
        i = (i + 1) % lines.length;
        current = lines[i];
        dir = 1;
      }
      if (!prefersReduced) requestAnimationFrame(tick);
    }
    tick();
  }

  function activate(kind) {
    // body class for persona accents
    document.body.classList.remove('mode--patient','mode--hospital','mode--insurer');
    document.body.classList.add(`mode--${kind}`);

    // tabs state + bubble
    tabs.forEach(t => {
      const active = t.dataset.persona === kind;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      if (active) setBubbleTo(t);
    });

    // scopes
    Object.entries(scopes).forEach(([k, el]) => el && el.classList.toggle('is-active', k === kind));

    // hero content & CTA
    if (title) {
      title.textContent = (
        kind === 'patient' ? 'Find, book & pay for care — cashless first.' :
        kind === 'hospital' ? 'RCM platform for hospitals — cashless to reimbursements.' :
        'Distribution & ops for insurers — structured listings & cashless APIs.'
      );
    }
    if (chips) {
      chips.innerHTML = '';
      PHRASES[kind].slice(0,3).forEach(txt => {
        const span = document.createElement('span');
        span.className = 'chip';
        span.textContent = txt;
        chips.appendChild(span);
      });
    }
    if (cta) {
      cta.textContent = kind === 'patient' ? 'Start as Patient' :
                        kind === 'hospital' ? 'Start as Hospital' : 'Start as Insurer';
      cta.href = kind === 'patient' ? '#p-scope' : kind === 'hospital' ? '#h-scope' : '#i-scope';
    }

    morphTo(kind);
    typing(PHRASES[kind]);
    ls.set('hf-persona', kind);
  }

  // public API
  function set(kind) { activate(kind); }
  const saved = ls.get('hf-persona', 'patient');
  requestIdleCallback ? requestIdleCallback(() => activate(saved)) : setTimeout(() => activate(saved), 1);

  // events
  tabs.forEach(t => on(t, 'click', (e) => {
    e.preventDefault(); // STOP page scrolling
    set(t.dataset.persona);
  }, { passive: false }));

  // track bubble on resize
  on(window, 'resize', () => {
    const active = $('.role-tab.is-active');
    if (active) setBubbleTo(active);
  }, { passive: true });

  return { set };
})();

/* -----------------------------------------
   Scope product cards (persona highlights)
------------------------------------------ */
(() => {
  const DATA = {
    patient: [
      {
        tag: 'Cashless 30s',
        tone: 'patient',
        title: 'Check eligibility instantly',
        copy: 'OTP consent, ABHA-ready checks before you travel.',
        points: [
          'Works with Care, HDFC ERGO, Niva Bupa & more',
          'Predicts co-pay, documents, and room eligibility'
        ]
      },
      {
        tag: 'Transparent pricing',
        tone: 'patient',
        title: 'Browse packages by city',
        copy: 'Fixed-price surgery bundles across trusted hospitals.',
        points: [
          'Compare inclusions & room types',
          '0% EMI on approved treatments'
        ]
      },
      {
        tag: 'Patient protect',
        tone: 'patient',
        title: 'Concierge & reimbursements',
        copy: 'Track discharge tasks and upload bills till settlement.',
        points: [
          'Realtime WhatsApp updates',
          'Escalation desk for complex claims'
        ]
      }
    ],
    hospital: [
      {
        tag: 'RCM suite',
        tone: 'hospital',
        title: 'Cashless desk workflows',
        copy: 'Digital pre-auth, task boards, and document guardrails to cut denials.',
        points: [
          'Escalations with TAT & SLA heatmaps',
          'Specimen signatures & audit trails built-in'
        ]
      },
      {
        tag: 'Packages',
        tone: 'hospital',
        title: 'Publish tariffs effortlessly',
        copy: 'Structured package builder with insurer-friendly exports.',
        points: [
          'Sync to HealthFlo marketplace',
          'Room eligibility + add-on matrices'
        ]
      },
      {
        tag: 'Recovery',
        tone: 'hospital',
        title: 'Denial to recovery automation',
        copy: 'Queue follow-ups, attach evidence, and nudge TPAs till closure.',
        points: [
          'Auto reminders with templates',
          'Central MIS across facilities'
        ]
      }
    ],
    insurer: [
      {
        tag: 'Distribution',
        tone: 'insurer',
        title: 'Structured plan listings',
        copy: 'Expose specialty benefits with IRDAI-aware copy & disclaimers.',
        points: [
          'Target by city, specialty & hospital tier',
          'Self-serve revisions via JSON wizard'
        ]
      },
      {
        tag: 'Ops',
        tone: 'insurer',
        title: 'Cashless ops webhooks',
        copy: 'Realtime pre-auth, enhancement, and discharge signals for your stack.',
        points: [
          'Attach documents & status codes',
          'Sandbox + sample payloads'
        ]
      },
      {
        tag: 'Intelligence',
        tone: 'insurer',
        title: 'Network & campaign insights',
        copy: 'Benchmark utilisation and spot anomalies early.',
        points: [
          'Compare LOS & rejection rates',
          'Fraud guard with outlier detection'
        ]
      }
    ]
  };

  const grids = $$('[data-products]');
  if (!grids.length) return;

  grids.forEach((grid) => {
    const key = grid.dataset.products;
    const items = DATA[key];
    if (!items || !items.length) return;

    grid.innerHTML = items.map((item) => {
      const pillClass = item.tone ? `pill pill--${item.tone}` : 'pill';
      const pill = item.tag ? `<span class="${pillClass}">${item.tag}</span>` : '';
      const body = item.copy ? `<p>${item.copy}</p>` : '';
      const bullets = Array.isArray(item.points) && item.points.length
        ? `<ul class="ticks ticks--compact">${item.points.map(point => `<li>${point}</li>`).join('')}</ul>`
        : '';
      return `<article class="product">${pill}<h3>${item.title}</h3>${body}${bullets}</article>`;
    }).join('');
  });
})();

/* -----------------------------------------
   Smooth anchors (respect sticky header)
------------------------------------------ */
(() => {
  const header = $('.nav');
  const offset = () => (header ? header.offsetHeight + 10 : 0);

  function smoothTo(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - offset();
    window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  const anchors = $$('a[href^="#"], [data-go^="#"]');
  anchors.forEach(el => {
    on(el, 'click', (e) => {
      const persona = el.dataset.personaLink;
      if (persona) {
        e.preventDefault();
        router.set(persona);
        return;
      }
      const hash = el.dataset.go || (el.tagName === 'A' ? el.getAttribute('href') : '');
      if (!hash || hash.length < 2) return;
      e.preventDefault();
      smoothTo(hash);
    });
  });
})();

/* -----------------------------------------
   Ripple / press feedback (Android micro)
------------------------------------------ */
(() => {
  const pressables = $$('.btn, .chip, .pill, .product, .seg-btn, .tab');
  pressables.forEach(el => {
    el.classList.add('pressable', 'ripple');
    on(el, 'pointerdown', (e) => {
      el.classList.add('press');
      // place the ripple origin
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      el.style.setProperty('--rx', `${x}px`);
      el.style.setProperty('--ry', `${y}px`);
      el.classList.add('is-pressing');
    });
    ['pointerup','pointercancel','pointerleave','blur'].forEach(type => {
      on(el, type, () => { el.classList.remove('press', 'is-pressing'); }, { passive: true });
    });
  });
})();

/* -----------------------------------------
   Hero metric counters
------------------------------------------ */
(() => {
  const cards = $$('.metric-card[data-count]');
  if (!cards.length) return;

  cards.forEach(card => {
    const suffix = $('.metric-card__suffix', card);
    if (suffix && card.dataset.suffix) suffix.textContent = card.dataset.suffix;
  });

  if (prefersReduced) {
    cards.forEach(card => {
      const target = Number(card.dataset.count || 0);
      const out = $('[data-count-output]', card);
      if (out) out.textContent = target.toLocaleString('en-IN');
    });
    return;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animate(card) {
    if (card.dataset.counted) return;
    card.dataset.counted = '1';
    card.classList.add('is-animated');
    const target = Number(card.dataset.count || 0);
    const out = $('[data-count-output]', card);
    if (!out) return;
    const start = performance.now();
    const duration = 1200;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOut(t);
      const value = Math.round(target * eased);
      out.textContent = value.toLocaleString('en-IN');
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        out.textContent = target.toLocaleString('en-IN');
      }
    }

    requestAnimationFrame(frame);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.55 });

  cards.forEach(card => obs.observe(card));
})();

/* -----------------------------------------
   Hero metric counters
------------------------------------------ */
(() => {
  const cards = $$('.metric-card[data-count]');
  if (!cards.length) return;

  cards.forEach(card => {
    const suffix = $('.metric-card__suffix', card);
    if (suffix && card.dataset.suffix) suffix.textContent = card.dataset.suffix;
  });

  if (prefersReduced) {
    cards.forEach(card => {
      const target = Number(card.dataset.count || 0);
      const out = $('[data-count-output]', card);
      if (out) out.textContent = target.toLocaleString('en-IN');
    });
    return;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animate(card) {
    if (card.dataset.counted) return;
    card.dataset.counted = '1';
    card.classList.add('is-animated');
    const target = Number(card.dataset.count || 0);
    const out = $('[data-count-output]', card);
    if (!out) return;
    const start = performance.now();
    const duration = 1200;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOut(t);
      const value = Math.round(target * eased);
      out.textContent = value.toLocaleString('en-IN');
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        out.textContent = target.toLocaleString('en-IN');
      }
    }

    requestAnimationFrame(frame);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.55 });

  cards.forEach(card => obs.observe(card));
})();

/* -----------------------------------------
   Cities we serve — marquee banner
------------------------------------------ */
(() => {
  // Works with either legacy #loc-slider or new .geo-marquee structure
  const host = $('#locations');
  if (!host) return;

  const CITIES = ['Delhi','Mumbai','Bengaluru','Hyderabad','Chennai','Pune','Ahmedabad','Kolkata','Jaipur','Lucknow','Surat','Indore'];

  let marquee = host.querySelector('.geo-marquee');
  if (!marquee) {
    marquee = document.createElement('div');
    marquee.className = 'geo-marquee';
    marquee.innerHTML = `<div class="geo-marquee__track" role="marquee"></div>`;
    host.appendChild(marquee);
  }

  const track = $('.geo-marquee__track', marquee);
  track.innerHTML = '';
  const unit = (name) => `<span>• ${name} • Cashless Supported</span>`;
  // duplicate to fill
  const items = [...CITIES, ...CITIES, ...CITIES].map(unit).join('');
  track.innerHTML = items;

  marquee.style.setProperty('--marquee-speed', prefersReduced ? '0s' : '24s');
  // Pause on hover handled by CSS; also pause on focus
  on(marquee, 'focusin', () => track.style.animationPlayState = 'paused');
  on(marquee, 'focusout', () => track.style.animationPlayState = '');
})();

/* -----------------------------------------
   Particles / starfield (HDR-ish)
------------------------------------------ */
(() => {
  const canvas = $('#particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  const stars = [];
  const COUNT = 80;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);
  }
  function spawn() {
    stars.length = 0;
    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        s: Math.random() * 0.25 + 0.05, // speed
        hue: 180 + Math.random() * 120
      });
    }
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(st => {
      st.x -= st.s;
      if (st.x < -8) st.x = w + 8;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${st.hue}, 90%, 70%, .55)`;
      ctx.shadowColor = `hsla(${st.hue}, 90%, 60%, .6)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  resize(); spawn(); tick();
  on(window, 'resize', resize, { passive: true });
})();

/* -----------------------------------------
   OTP demo + eligibility + co-pay
------------------------------------------ */
(() => {
  const root = $('#patient-elig');
  if (!root) return;
  const phone = $('#phone', root);
  const send  = $('.js-send-otp', root);
  const verify= $('.js-verify-otp', root);
  const otpWrap = $('.otp-wrap', root);
  const inputs = $$('.otp-i', root);
  const status = $('#otpStatus', root);

  let code = '';
  function gen() { return String(Math.floor(1000 + Math.random()*9000)); }

  on(send, 'click', () => {
    const digits = (phone.value || '').replace(/\D/g, '');
    if (digits.length < 10) { status.textContent = 'Enter a valid phone number.'; return; }
    code = gen();
    status.textContent = 'OTP sent. Please enter the 4 digits.';
    otpWrap.classList.remove('hidden');
    inputs[0].focus();
  });

  inputs.forEach((i, idx) => {
    on(i, 'input', () => {
      i.value = i.value.replace(/\D/g,'').slice(0,1);
      if (i.value && inputs[idx+1]) inputs[idx+1].focus();
    });
    on(i, 'keydown', (e) => {
      if (e.key === 'Backspace' && !i.value && inputs[idx-1]) inputs[idx-1].focus();
    });
  });

  on(verify, 'click', () => {
    const entered = inputs.map(x => x.value).join('');
    if (entered.length < 4) { status.textContent = 'Enter all digits.'; return; }
    if (entered === code) {
      status.textContent = 'Phone verified ✓';
      status.classList.add('ok');
      toast('Phone verified ✓');
    } else {
      status.textContent = 'Incorrect code, try again.';
    }
  });

  // Eligibility + Co-pay
  const selects = {
    ins:  $('#elig-ins',  root),
    city: $('#elig-city', root),
    spec: $('#elig-spec', root),
    sum:  $('#elig-sum',  root)
  };
  const out = $('.elig-result', root);
  const copyBtn = $('#elig-copy', root);

  function estimate(spec, sum) {
    const base = { general:.8, dental:.6, ophthalmology:.72, ivf:.55, orthopedics:.66, cardiac:.62, oncology:.5 };
    const b = base[String(spec).toLowerCase()] ?? .6;
    const s = parseInt(sum, 10) || 5;
    const adj = s>20 ? -0.1 : s>10 ? -0.05 : 0.02;
    const val = Math.min(.92, Math.max(.3, b + adj));
    return Math.round(val * 100);
  }
  function renderElig() {
    const ins  = selects.ins.value || 'Any';
    const city = selects.city.value;
    const spec = selects.spec.value;
    const sum  = selects.sum.value;
    const pct  = estimate(spec, sum);
    out.innerHTML = `<strong>Likely eligible: ${pct}%</strong> — for ${spec} with ₹${sum}L cover in ${city}. <em>${ins}</em>`;
  }
  Object.values(selects).forEach(el => on(el, 'change', renderElig, { passive: true }));
  renderElig();

  on(copyBtn, 'click', async () => {
    try {
      await navigator.clipboard.writeText(out.textContent.trim());
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => copyBtn.textContent = 'Copy', 1200);
    } catch {
      copyBtn.textContent = 'Copy failed';
      setTimeout(() => copyBtn.textContent = 'Copy', 1200);
    }
  });

  const bill = $('#co-bill', root), rate = $('#co-rate', root), coOut = $('#co-out', root);
  function copay() {
    const b = Number(bill.value || 0), r = Math.min(100, Math.max(0, Number(rate.value || 0)));
    if (!b) { coOut.textContent = 'Enter bill to estimate co-pay.'; return; }
    const cop = Math.round(b * (r / 100));
    coOut.innerHTML = `Estimated co-pay: <b>₹${cop.toLocaleString('en-IN')}</b>. Net payable by insurer: <b>₹${(b - cop).toLocaleString('en-IN')}</b>.`;
  }
  on(bill, 'input', copay); on(rate, 'input', copay);
})();

/* -----------------------------------------
   Journey progress meters
------------------------------------------ */
  const steps = $$('.journey__step[data-progress]');
  if (!steps.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));

  function paint(step, instant = false) {
    if (step.dataset.progressDone) return;
    step.dataset.progressDone = '1';
    step.classList.add('is-animated');
    const target = clamp(step.dataset.progress);
    const bar = $('.journey__meter span', step);
    const value = $('[data-value]', step);
    if (instant || prefersReduced) {
      if (bar) bar.style.width = `${target}%`;
      if (value) value.textContent = target;
      return;
    }
    const start = performance.now();
    const duration = 1100;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOut(t);
      const current = Math.round(target * eased);
      if (bar) bar.style.width = `${current}%`;
      if (value) value.textContent = current;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        if (bar) bar.style.width = `${target}%`;
        if (value) value.textContent = target;
      }
    }

    requestAnimationFrame(frame);
  }

  if (prefersReduced) {
    steps.forEach(step => paint(step, true));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        paint(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5, rootMargin: '0px 0px -10% 0px' });

  steps.forEach(step => observer.observe(step));
})();


/* -----------------------------------------
   Toast utility
------------------------------------------ */
function toast(msg) {
  const node = $('#toast'); if (!node) return;
  node.textContent = msg;
  node.classList.add('in');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => node.classList.remove('in'), 1800);
}

/* -----------------------------------------
   Smart LCP swap (if you use hero-static)
------------------------------------------ */
(() => {
  const heroImg = $('#heroLCP');
  if (!heroImg) return;
  const src = heroImg.dataset.src;
  if (!src) return;
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => { heroImg.src = src; heroImg.classList.add('loaded'); };
  im.src = src;
})();

/* -----------------------------------------
   Minor GSAP hooks (if gsap-init.js present)
------------------------------------------ */
(() => {
  if (!window.gsap || prefersReduced) return;
  // reveal on scroll for [data-animate]
  const items = $$('[data-animate]');
  const reveal = (el) => el.classList.add('is-visible');
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    items.forEach(el => {
      gsap.fromTo(el, { y: 18, opacity: 0 }, {
        y: 0, opacity: 1, duration: .6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
  } else {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(el => io.observe(el));
  }
})();

/* -----------------------------------------
   Defensive: prevent accidental jumps on hashchange
------------------------------------------ */
on(window, 'hashchange', (e) => {
  const hash = location.hash;
  const persona = ['#p-scope','#h-scope','#i-scope'];
  if (persona.includes(hash)) {
    e.preventDefault?.();
    history.replaceState(null, '', ' ');
  }
}, { passive: false });

/* -----------------------------------------
   End
------------------------------------------ */
