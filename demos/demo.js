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
