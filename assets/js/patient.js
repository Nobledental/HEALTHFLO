/* HealthFlo — patient.js (persona-only enhancements)
   - Enrich typing lines (merges with existing)
   - Packages: per-city filter chips + animated refresh
   - Subtle ethical nudge on "Try now" CTA (stops after first view)
   - Indian phone formatting + OTP auto-advance
   - Eligibility: one-tap copy to clipboard
   - Android-like glass ripple on product cards
   - Lighter particle motion for patient persona
*/
(() => {
  "use strict";

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, { passive: true });

  // ---------- 1) Typing enrichment ----------
  const typeEl = $('#typeTarget');
  if (typeEl) {
    const extra = [
      "Find NABH partners near you.",
      "0% EMI options at checkout.",
      "WhatsApp updates on claim progress.",
      "Port your policy with guided help."
    ];
    try {
      const base = JSON.parse(typeEl.dataset.typing || "[]");
      const merged = [...new Set([...base, ...extra])];
      typeEl.dataset.typing = JSON.stringify(merged);

      // Ask the shared typewriter (main.js) to restart if it supports events
      document.dispatchEvent(new CustomEvent('hf:typing:restart', { detail: { id: '#typeTarget' } }));

      // Fallback local typewriter if main.js didn't take over in 800ms
      setTimeout(() => {
        if (!typeEl.hasAttribute('data-typing-managed')) {
          localType(typeEl, merged, 28, 1400);
        }
      }, 800);
    } catch {
      // If parsing failed, run local typewriter on our extra set
      localType(typeEl, extra, 28, 1400);
    }
  }

  function localType(el, lines, speed = 28, hold = 1400) {
    let i = 0, p = 0, dir = 1, timer;
    el.setAttribute('data-typing-managed', 'local');
    function step() {
      const text = lines[i];
      p += dir;
      el.textContent = text.slice(0, p);
      if (dir > 0 && p === text.length) {
        dir = 0;
        timer = setTimeout(() => { dir = -1; timer = setTimeout(step, speed); }, hold);
        return;
      }
      if (dir < 0 && p === 0) {
        i = (i + 1) % lines.length; dir = 1;
      }
      timer = setTimeout(step, speed);
    }
    step();
  }

  // ---------- 2) Packages per-city filter (with animated rebuild) ----------
  const pkgSec = $('#packages');
  if (pkgSec) {
    const cities = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Pune"];
    const data = {
      Delhi: [
        { t: "ACL Reconstruction", n: "Single AC • Day-care possible", p: "₹1.6L – ₹2.3L" },
        { t: "C-Section", n: "NABH • 3D scans optional", p: "₹68k – ₹1.2L" },
        { t: "Gallbladder", n: "Laparoscopic • Day-care", p: "₹48k – ₹95k" }
      ],
      Mumbai: [
        { t: "Cataract", n: "Mono/Multifocal options", p: "₹28k – ₹55k" },
        { t: "Knee Arthroscopy", n: "Sports injuries", p: "₹85k – ₹1.6L" },
        { t: "Angiography", n: "Day-care", p: "₹14k – ₹24k" }
      ],
      Bengaluru: [
        { t: "Appendectomy", n: "Laparoscopic", p: "₹45k – ₹95k" },
        { t: "Hernia Repair", n: "Mesh • Day-care possible", p: "₹40k – ₹1.1L" },
        { t: "Cataract", n: "Mono/Multifocal", p: "₹26k – ₹52k" }
      ],
      Hyderabad: [
        { t: "Angiography", n: "Day-care", p: "₹12k – ₹22k" },
        { t: "Tonsillectomy", n: "Pediatric friendly", p: "₹30k – ₹65k" },
        { t: "Hysterectomy", n: "Lapro/Open", p: "₹75k – ₹1.4L" }
      ],
      Chennai: [
        { t: "CABG (indicative)", n: "NABH cardiac centers", p: "₹2.0L – ₹3.6L" },
        { t: "Cataract", n: "Mono/Multifocal", p: "₹25k – ₹50k" },
        { t: "Gallbladder", n: "Laparoscopic", p: "₹42k – ₹90k" }
      ],
      Pune: [
        { t: "ACL Reconstruction", n: "Sports clinic", p: "₹1.3L – ₹2.1L" },
        { t: "Hernia Repair", n: "Mesh", p: "₹38k – ₹85k" },
        { t: "Appendectomy", n: "Laparoscopic", p: "₹44k – ₹88k" }
      ]
    };

    // Build chips toolbar
    const title = pkgSec.querySelector('h3');
    const bar = document.createElement('div');
    bar.className = 'chips';
    bar.setAttribute('role', 'tablist');
    bar.innerHTML = cities.map((c, idx) =>
      `<button class="chip chip--btn${idx===0?' active':''}" role="tab" aria-selected="${idx===0?'true':'false'}" data-city="${c}">${c}</button>`
    ).join('');
    title.insertAdjacentElement('afterend', bar);

    const grid = pkgSec.querySelector('.product-grid');
    const render = (city) => {
      const items = data[city] || [];
      // animate out
      grid.animate([{opacity:1, transform:'translateY(0px)'}, {opacity:0, transform:'translateY(6px)'}], {duration:180, easing:'ease-out'})
        .finished.then(() => {
          grid.innerHTML = items.map(({t,n,p}) => `
            <article class="product">
              <h4>${t} (${city})</h4>
              <p class="muted">Indicative: ${p} • ${n}</p>
            </article>
          `).join('');
          grid.animate([{opacity:0, transform:'translateY(6px)'}, {opacity:1, transform:'translateY(0px)'}], {duration:220, easing:'ease-out'});
        });
    };

    // Wire chips
    $$('.chip', bar).forEach(ch => {
      on(ch, 'click', () => {
        $$('.chip', bar).forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
        ch.classList.add('active'); ch.setAttribute('aria-selected','true');
        render(ch.dataset.city);
      });
    });

    // Initial render
    render(cities[0]);
  }

  // ---------- 3) Ethical CTA nudge (stops after first view) ----------
  const tryBtn = $('#p-products a.product__cta[href="#patient-elig"]') || $('#p-products a[href="#patient-elig"]');
  if (tryBtn && 'IntersectionObserver' in window) {
    const controller = new AbortController();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const anim = tryBtn.animate(
            [{ transform:'translateY(0)', boxShadow:'none' },
             { transform:'translateY(-2px)', boxShadow:'0 10px 26px rgba(120,240,255,.25)' },
             { transform:'translateY(0)', boxShadow:'none' }],
            { duration: 900, iterations: 3, easing:'cubic-bezier(.2,.8,.2,1)' }
          );
          anim.finished.finally(() => { obs.disconnect(); controller.abort(); });
        }
      });
    }, { threshold: 0.6 });
    obs.observe(tryBtn);
  }

  // ---------- 4) Indian phone formatting + OTP helpers ----------
  const phone = $('#phone');
  if (phone) {
    on(phone, 'blur', () => {
      const digits = (phone.value || '').replace(/\D/g,'');
      let out = digits;
      if (digits.startsWith('0')) out = digits.slice(1);
      if (!out.startsWith('91') && out.length >= 10) out = '91' + out.slice(-10);
      // +91 98xxx xxxxx pattern
      const pretty = '+'
        + out.replace(/^(\d{2})(\d{5})(\d{5}).*$/, (_m,a,b,c) => `${a} ${b} ${c}`)
              .replace(/^(\d{2})(\d{4})(\d{4}).*$/, (_m,a,b,c) => `${a} ${b} ${c}`);
      if (pretty.length > 4) phone.value = pretty;
    });
  }
  const otp = $$('.otp-i');
  if (otp.length) {
    otp.forEach((i, idx) => {
      i.addEventListener('input', () => {
        i.value = i.value.replace(/\D/g,'').slice(0,1);
        if (i.value && otp[idx+1]) otp[idx+1].focus();
      }, { passive: false });
      i.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !i.value && otp[idx-1]) otp[idx-1].focus();
      });
    });
  }

  // ---------- 5) Eligibility: copy result ----------
  const copyBtn = $('#elig-copy');
  const eligOut = $('.elig-result');
  if (copyBtn && eligOut && navigator.clipboard) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(eligOut.textContent.trim());
        toast('Copied eligibility summary ✓');
      } catch {
        toast('Copy failed');
      }
    });
  }

  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg;
    t.classList.add('in');
    setTimeout(() => t.classList.remove('in'), 1600);
  }

  // ---------- 6) Android-like ripple on product cards ----------
  const cards = $$('.product.tilt, .product');
  cards.forEach(card => {
    card.style.position = card.style.position || 'relative';
    card.addEventListener('pointerdown', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const d = Math.max(r.width, r.height);
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute; left:${x - d/2}px; top:${y - d/2}px;
        width:${d}px; height:${d}px; border-radius:50%;
        background: radial-gradient(circle at center, rgba(255,255,255,.25), rgba(255,255,255,0) 60%);
        pointer-events:none; transform:scale(.2); opacity:.8; filter:blur(0.4px);
      `;
      card.appendChild(ripple);
      ripple.animate(
        [{ transform:'scale(.2)', opacity:.8 }, { transform:'scale(1.1)', opacity:0 }],
        { duration: 520, easing:'cubic-bezier(.2,.8,.2,1)' }
      ).finished.finally(() => ripple.remove());
    }, { passive: true });
  });

  // ---------- 7) Softer particle config for patient ----------
  document.dispatchEvent(new CustomEvent('hf:particles:config', {
    detail: { density: 0.65, drift: 0.7 } // lighter & calmer
  }));
})();
