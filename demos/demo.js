/* =========================================================
   HealthFlo Demos — Interactions (vanilla JS)
   - Ripple, tabs, bottom nav, FAB, sheet, toast
   - Helpers for counters and formatters
========================================================= */
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* Ripple */
  function attachRipple(el) {
    el.addEventListener('pointerdown', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--rx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--ry', `${((e.clientY - r.top) / r.height) * 100}%`);
      el.setAttribute('data-pressed', 'true');
    });
    ['pointerup','pointerleave','pointercancel','blur'].forEach(ev =>
      el.addEventListener(ev, () => el.removeAttribute('data-pressed')));
  }
  $$('.md-ripple').forEach(attachRipple);

  /* Tabs / Segments */
  $$('.segments').forEach(seg => {
    seg.querySelectorAll('.segment').forEach(btn => {
      btn.addEventListener('click', () => {
        seg.querySelectorAll('.segment').forEach(x => x.setAttribute('aria-pressed','false'));
        btn.setAttribute('aria-pressed','true');
        const pane = btn.getAttribute('data-pane');
        const root = seg.closest('.demo-app');
        root?.querySelectorAll('[data-pane]').forEach(p => p.hidden = (p.getAttribute('data-pane') !== pane));
      });
    });
  });

  /* Bottom nav */
  $$('.bottom-bar .nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const target = btn.getAttribute('data-target');
      document.querySelectorAll('[data-screen]').forEach(s => s.hidden = (s.getAttribute('data-screen') !== target));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* Sheet */
  const sheet = $('.sheet');
  const openSheetBtns = $$('[data-open-sheet]');
  const closeSheetBtns = $$('[data-close-sheet]');
  openSheetBtns.forEach(b => b.addEventListener('click', () => sheet?.classList.add('in')));
  closeSheetBtns.forEach(b => b.addEventListener('click', () => sheet?.classList.remove('in')));

  /* Toast */
  function toast(msg='Done', ms=1400) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  window.HFToast = toast;

  /* Counters */
  function easeCount(el, to, dur=900, fmt=(v)=>v.toString()) {
    const start = performance.now(), from = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  window.HFCount = easeCount;

  /* Format helpers */
  window.HF = {
    inr(n) { return n.toLocaleString('en-IN'); },
    pct(n, d=2){ return (n*100).toFixed(d)+'%'; }
  };

  /* Back to home */
  $$('.back-home').forEach(b => {
    b.addEventListener('click', () => {
      location.href = '../index.html#p=' + (document.body.getAttribute('data-persona') || 'hospital');
    });
  });
})();

/* ===== Demo Pages: extra simulations (append to main.js) ===== */
(() => {
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
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
  const setText = (el, v) => { if (el) el.textContent = v; };

  $$('.demo-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const sim = tile.dataset.sim;

      // Empanelment coverage & ETA
      if (sim === 'empanel') {
        const countEl = tile.querySelector('[data-out="count"]');
        const etaEl   = tile.querySelector('[data-out="eta"]');
        // Demo constants
        const baseTPAs = 20 + Math.floor(Math.random()*5); // 20–24
        const etaDays  = 7 + Math.floor(Math.random()*4);  // 7–10 days
        setText(countEl, '—'); setText(etaEl, '—');
        setTimeout(() => easeCount(countEl, baseTPAs, 800), 160);
        setTimeout(() => easeCount(etaEl, etaDays, 900), 220);
      }

      // Empanelment SLA checklist
      if (sim === 'empanel-sla') {
        const docsEl = tile.querySelector('[data-out="docs"]');
        const slaEl  = tile.querySelector('[data-out="sla"]');
        const docs = 18 + Math.floor(Math.random()*5);    // 18–22 docs gathered
        const sla  = 88 + Math.floor(Math.random()*7);    // 88–94% on-time
        setText(docsEl, '—'); setText(slaEl, '—');
        setTimeout(() => easeCount(docsEl, docs, 800), 120);
        setTimeout(() => setText(slaEl, `${sla}%`), 260);
      }

      // Denials: drop & recovery
      if (sim === 'denials') {
        const dropEl = tile.querySelector('[data-out="drop"]');
        const recEl  = tile.querySelector('[data-out="recovery"]');
        const baselineClaims = 1200;               // demo baseline over 90 days
        const avgBill        = 45000;              // ₹
        const denialRate     = 0.21;               // 21%
        const dropPct        = 18 + Math.floor(Math.random()*12); // 18–29%
        const recovered = Math.round(baselineClaims * avgBill * denialRate * (dropPct/100) * 0.35);
        setText(dropEl, '—'); setText(recEl, '—');
        setTimeout(() => setText(dropEl, `−${dropPct}%`), 160);
        setTimeout(() => easeCount(recEl, recovered, 1100, v => v.toLocaleString('en-IN')), 260);
      }

      // Denial rules impact
      if (sim === 'denial-rules') {
        const rulesEl  = tile.querySelector('[data-out="rules"]');
        const impactEl = tile.querySelector('[data-out="impact"]');
        const rules  = 6 + Math.floor(Math.random()*5);  // 6–10 recurring rules
        const impact = 8 + Math.floor(Math.random()*7);  // 8–14% TAT gain
        setText(rulesEl, '—'); setText(impactEl, '—');
        setTimeout(() => easeCount(rulesEl, rules, 700), 140);
        setTimeout(() => setText(impactEl, `+${impact}%`), 260);
      }

      // Starter pack projection
      if (sim === 'starter') {
        const daysEl  = tile.querySelector('[data-out="days"]');
        const casesEl = tile.querySelector('[data-out="cases"]');
        const days  = 7 + Math.floor(Math.random()*4);     // 7–10 days
        const cases = 45 + Math.floor(Math.random()*35);   // 45–79 cases / mo
        setText(daysEl, '—'); setText(casesEl, '—');
        setTimeout(() => easeCount(daysEl, days, 800), 120);
        setTimeout(() => easeCount(casesEl, cases, 900), 240);
      }

      // Clinic: appointments growth & no-show reduction
      if (sim === 'clinic-apps') {
        const appsEl   = tile.querySelector('[data-out="apps"]');
        const noshowEl = tile.querySelector('[data-out="noshow"]');
        const base = 220, lift = 0.12 + Math.random()*0.14;  // +12–26%
        const apps = Math.round(base * (1 + lift));
        const nosh = 6 + Math.floor(Math.random()*6);        // 6–11% reduction
        setText(appsEl, '—'); setText(noshowEl, '—');
        setTimeout(() => easeCount(appsEl, apps, 800, v=>v.toLocaleString('en-IN')), 140);
        setTimeout(() => setText(noshowEl, `−${nosh}%`), 260);
      }

      // EMI calculator (0% demo math)
      if (sim === 'emi') {
        const amt = parseInt(tile.dataset.amount || '60000', 10);
        const mon = parseInt(tile.dataset.months || '9', 10);
        const emiEl = tile.querySelector('[data-out="emi"]');
        const totEl = tile.querySelector('[data-out="total"]');
        const emi  = Math.round(amt / mon);
        const tot  = amt;
        setText(emiEl, '—'); setText(totEl, '—');
        setTimeout(() => easeCount(emiEl, emi, 700, v=>v.toLocaleString('en-IN')), 140);
        setTimeout(() => setText(totEl, `₹${tot.toLocaleString('en-IN')}`), 260);
      }
    });
  });
})();
