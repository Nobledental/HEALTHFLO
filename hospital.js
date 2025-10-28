/* =========================================================
   HealthFlo — Premium JS
   - Persona switching + deep link (#p=hospital|clinic)
   - Android ripple, tilt, sheen, magnetic hover
   - Minimal typewriter on scroll
   - Demo tiles: animated numbers
   - Smart "Open demo page" routing (toast if missing)
   - Scroll progress + reveal on scroll
   - PWA register + install prompt
   - Quick Settings: Motion / Contrast / Density (persist)
========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* Scroll progress */
  const bar = $('.scroll-bar');
  const updateProgress = () => {
    const h = document.documentElement;
    const sc = h.scrollTop || document.body.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (sc / max) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
  };
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  $$('[data-animate]').forEach(el => io.observe(el));

  /* Minimal typewriter on headings */
  const typer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.typed === '1') return;
      el.dataset.typed = '1';
      const full = el.textContent.trim();
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i >= full.length) return;
        el.textContent += full[i++];
        const ch = el.textContent.slice(-1);
        setTimeout(tick, (ch === '.' || ch === '—' || ch === ',') ? 95 : 26);
      };
      tick();
    });
  }, { threshold: 0.6 });
  $$('[data-typer]').forEach(el => typer.observe(el));

  /* Persona switch (+ URL + localStorage) */
  const personaCards = $$('.persona-card');
  const personaViews = $$('.persona-view');
  const backbar = $('#backbar');
  const KEY = '__hf_p__';

  function toast(msg = 'Done', ms = 1600) {
    const wrap = $('.toast-wrap'); if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'md-surface elevation-2';
    t.style.cssText = 'position:fixed;right:16px;bottom:16px;padding:10px 14px;border-radius:12px;z-index:70;background:#fff;border:1px solid var(--border)';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  function setActiveCard(targetPersona){
    personaCards.forEach(btn => {
      const isActive = btn.dataset.persona === targetPersona;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('is-active', isActive); // blink + zoom
    });
  }

  function showPersona(p) {
    document.documentElement.setAttribute('data-persona', p);
    setActiveCard(p);

    personaViews.forEach(v => v.hidden = (v.getAttribute('data-show-for') !== p));
    backbar.hidden = !(p === 'hospital' || p === 'clinic');

    $('#solutions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    localStorage.setItem(KEY, p);
    const url = new URL(location.href); url.hash = `#p=${p}`; history.replaceState(null, '', url);

    // Stagger card entrance
    requestAnimationFrame(() => {
      $$(`.persona-view[data-show-for="${p}"] .card`).forEach((card, idx) => {
        card.style.transform = 'translateY(18px)'; card.style.opacity = '0';
        setTimeout(() => {
          card.style.transition = 'transform .38s cubic-bezier(.22,1,.36,1), opacity .38s';
          card.style.transform = 'translateY(0)'; card.style.opacity = '1';
        }, 50 + idx * 40);
      });
    });
  }

  function backHome() {
    document.documentElement.setAttribute('data-persona', 'none');
    personaViews.forEach(v => v.hidden = true);
    backbar.hidden = true;
    $('#overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    localStorage.removeItem(KEY);
    history.replaceState(null, '', location.pathname + location.search);
    personaCards.forEach(btn => { btn.setAttribute('aria-pressed', 'false'); btn.classList.remove('is-active'); });
  }

  personaCards.forEach(btn => {
    const persona = btn.dataset.persona;
    btn.addEventListener('click', () => showPersona(persona));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPersona(persona); }
    });
  });
  $('#back-home')?.addEventListener('click', backHome);

  // Init from hash / localStorage
  (function initPersonaFromURL() {
    const m = location.hash.match(/#p=(hospital|clinic)/);
    const saved = localStorage.getItem(KEY);
    const p = m?.[1] || saved || 'none';
    if (p !== 'none') showPersona(p); else setActiveCard('');
  })();

  /* Smooth anchors */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id && id.length > 1 ? $(id) : null;
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* Android ripple */
  function attachRipple(el) {
    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--rx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--ry', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      el.setAttribute('data-pressed', 'true');
      if (el.classList.contains('btn-pulse')) {
        el.classList.add('is-active');
        setTimeout(()=> el.classList.remove('is-active'), 800);
      }
    });
    ['pointerup','pointerleave','pointercancel','blur'].forEach(ev =>
      el.addEventListener(ev, () => el.removeAttribute('data-pressed')));
  }
  $$('.md-ripple').forEach(attachRipple);

  /* Tilt + sheen + magnet */
  function attachTilt(el) {
    let raf = 0; const max = 6;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const tiltX = (py - 0.5) * -2 * max;
      const tiltY = (px - 0.5) *  2 * max;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--tiltX', `${tiltX.toFixed(2)}deg`);
        el.style.setProperty('--tiltY', `${tiltY.toFixed(2)}deg`);
      });
    }
    function onLeave(){ cancelAnimationFrame(raf); el.style.setProperty('--tiltX','0deg'); el.style.setProperty('--tiltY','0deg'); }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('blur', onLeave);
  }
  function attachSheen(el) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--sx', x + '%'); el.style.setProperty('--sy', y + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--sx', '-20%'); el.style.setProperty('--sy', '-20%'); });
  }
  function attachMagnet(el, strength = 10) {
    let raf = 0;
    function move(e) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const dx = (e.clientX - cx) / r.width, dy = (e.clientY - cy) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `translate(${dx*strength}px, ${dy*strength}px)`; });
    }
    function leave(){ cancelAnimationFrame(raf); el.style.transform = ''; }
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    el.addEventListener('blur', leave);
  }
  $$('[data-tilt]').forEach(attachTilt);
  $$('[data-sheen]').forEach(attachSheen);
  $$('.magnet').forEach(el => attachMagnet(el, 8));

  /* DEMOS — animated numbers (client-only) */
  const easeCount = (el, to, dur = 900, fmt = (v)=>v.toString()) => {
    const start = performance.now(), from = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $$('.demo-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const kind = tile.dataset.sim;
      if (kind === 'cashless') {
        const tatOut = tile.querySelector('[data-out="tat"]');
        const depOut = tile.querySelector('[data-out="deposit"]');
        tatOut.textContent = '—'; depOut.textContent = '—';
        setTimeout(()=> tatOut.textContent = '2.5 h', 220);
        easeCount(depOut, 180 * 85000 * 0.12, 1200, (v)=>v.toLocaleString('en-IN'));
      }
      if (kind === 'billing') {
        const factorOut = tile.querySelector('[data-out="factor"]');
        const npOut = tile.querySelector('[data-out="npay"]');
        const bill = 90000, rent = 3000, baseRoomPct = 0.3, cap = rent * 5;
        const assumedRoom = bill * baseRoomPct;
        const factor = Math.min(1, cap / Math.max(assumedRoom, 1));
        factorOut.textContent = '—'; npOut.textContent = '—';
        setTimeout(()=> factorOut.textContent = factor.toFixed(2), 220);
        easeCount(npOut, Math.round(bill * (1 - factor) * 0.15), 1000, (v)=>v.toLocaleString('en-IN'));
      }
      if (kind === 'emr') {
        tile.querySelector('[data-out="status"]').textContent = 'Checking…';
        setTimeout(()=> { tile.querySelector('[data-out="status"]').textContent = '⚠️ Conflict — Do not prescribe'; }, 600);
        tile.querySelector('[data-out="hint"]').textContent = 'penicillin × amoxicillin';
      }
      if (kind === 'clinic') {
        const appsOut = tile.querySelector('[data-out="apps"]');
        const revOut = tile.querySelector('[data-out="rev"]');
        const apps = Math.round(220 * 1.18);
        const rev = apps * 150;
        appsOut.textContent = '—'; revOut.textContent = '—';
        easeCount(appsOut, apps, 800, (v)=>v.toLocaleString('en-IN'));
        setTimeout(()=> easeCount(revOut, rev, 900, (v)=>v.toLocaleString('en-IN')), 120);
      }
    });
  });

  /* "Open demo page" smart routing */
  $$('.route[href]').forEach(a => {
    a.addEventListener('click', async (e) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      try {
        const res = await fetch(href, { method: 'HEAD', cache: 'no-cache' });
        if (res.ok) { location.href = href; }
        else { toast('Demo page coming soon.'); }
      } catch { toast('Demo page coming soon.'); }
    });
  });

  /* Quick Settings */
  const root = document.documentElement;
  const MOTION_KEY = '__hf_motion__';
  const CONTRAST_KEY = '__hf_contrast__';
  const DENSITY_KEY = '__hf_density__';
  const qsMotion = $('#qs-motion');
  const qsContrast = $('#qs-contrast');
  const qsDensity = $('#qs-density');

  function applySetting(k, v) {
    if (k === 'motion') root.setAttribute('data-motion', v);
    if (k === 'contrast') root.setAttribute('data-contrast', v);
    if (k === 'density') root.setAttribute('data-density', v);
  }
  function loadSettings() {
    const m = localStorage.getItem(MOTION_KEY) || 'on';
    const c = localStorage.getItem(CONTRAST_KEY) || 'normal';
    const d = localStorage.getItem(DENSITY_KEY) || 'comfortable';
    applySetting('motion', m); applySetting('contrast', c); applySetting('density', d);
    if (qsMotion) qsMotion.textContent = `Motion: ${m === 'on' ? 'On' : 'Off'}`;
    if (qsContrast) qsContrast.textContent = `Contrast: ${c === 'high' ? 'High' : 'Normal'}`;
    if (qsDensity) qsDensity.textContent = `Density: ${d === 'compact' ? 'Compact' : 'Comfy'}`;
  }
  loadSettings();

  qsMotion?.addEventListener('click', () => {
    const now = root.getAttribute('data-motion') === 'on' ? 'off' : 'on';
    applySetting('motion', now);
    localStorage.setItem(MOTION_KEY, now);
    qsMotion.textContent = `Motion: ${now === 'on' ? 'On' : 'Off'}`;
  });
  qsContrast?.addEventListener('click', () => {
    const now = root.getAttribute('data-contrast') === 'high' ? 'normal' : 'high';
    applySetting('contrast', now);
    localStorage.setItem(CONTRAST_KEY, now);
    qsContrast.textContent = `Contrast: ${now === 'high' ? 'High' : 'Normal'}`;
  });
  qsDensity?.addEventListener('click', () => {
    const now = root.getAttribute('data-density') === 'compact' ? 'comfortable' : 'compact';
    applySetting('density', now);
    localStorage.setItem(DENSITY_KEY, now);
    qsDensity.textContent = `Density: ${now === 'compact' ? 'Compact' : 'Comfy'}`;
  });

  /* PWA */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
  let deferredPrompt = null;
  const installBtn = $('#qs-install');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });
  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  /* Utility: observe new nodes for interactions */
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        if (n.classList.contains('md-ripple')) attachRipple(n);
        if (n.classList.contains('magnet')) attachMagnet(n, 8);
        if (n.hasAttribute('data-tilt')) attachTilt(n);
        if (n.hasAttribute('data-sheen')) attachSheen(n);
        n.querySelectorAll?.('.md-ripple').forEach(attachRipple);
        n.querySelectorAll?.('.magnet').forEach(el => attachMagnet(el, 8));
        n.querySelectorAll?.('[data-tilt]').forEach(attachTilt);
        n.querySelectorAll?.('[data-sheen]').forEach(attachSheen);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
