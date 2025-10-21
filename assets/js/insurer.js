/* HealthFlo — insurer.js (persona-only enhancements)
   - Typing enrichment for insurer hero
   - Discount simulator (live) + tiny chart
   - Listing wizard: richer JSON + copy
   - Ops webhook sample copy
   - Android-like ripples
   - Persona particle tuning (precise, low drift)
*/
(() => {
  "use strict";
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt||{ passive:true });

  // ---------- 1) Enrich typing lines ----------
  const typeEl = $('#typeTarget');
  if (typeEl) {
    const extra = [
      "Structured listings with room eligibility.",
      "City campaigns & partner discounts.",
      "Cashless Ops APIs with audit trails.",
      "IRDAI-aware copy & disclosures."
    ];
    try {
      const base = JSON.parse(typeEl.dataset.typing || "[]");
      const merged = [...new Set([...base, ...extra])];
      typeEl.dataset.typing = JSON.stringify(merged);
      document.dispatchEvent(new CustomEvent('hf:typing:restart', { detail:{ id:'#typeTarget' }}));
      setTimeout(()=>{ if(!typeEl.hasAttribute('data-typing-managed')) localType(typeEl, merged); }, 700);
    } catch {
      localType(typeEl, extra);
    }
  }
  function localType(el, lines, speed=24, hold=1200){
    let i=0,p=0,dir=1;
    el.setAttribute('data-typing-managed','local');
    (function step(){
      const t = lines[i]; p+=dir; el.textContent = t.slice(0,p);
      if (dir>0 && p===t.length){ dir=0; return setTimeout(()=>{ dir=-1; step(); }, hold); }
      if (dir<0 && p===0){ i=(i+1)%lines.length; dir=1; }
      setTimeout(step, speed);
    })();
  }

  // ---------- 2) Discount simulator ----------
  const base = $('#ds-base'), disc = $('#ds-disc'), out = $('#ds-out');
  const chart = $('#ds-chart');
  if (base && disc && out) {
    function sim(){
      const b = Math.max(0, Number(base.value||0));
      const d = Math.max(0, Number(disc.value||0));
      const lift = 1 + (d/100)*0.8; // heuristic
      const cvr = b * lift;
      out.innerHTML = `Expected CVR: <b>${cvr.toFixed(2)}%</b> (lift ×${lift.toFixed(2)})`;
      drawChart(cvr, lift);
    }
    on(base,'input', sim, {passive:false});
    on(disc,'input', sim, {passive:false});
    sim();

    function drawChart(cvr, lift){
      if (!chart) return;
      const c = chart.getContext('2d');
      const W = chart.width, H = chart.height;
      c.clearRect(0,0,W,H);
      // axis
      c.strokeStyle = 'rgba(255,255,255,.18)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(24, H-18); c.lineTo(W-10, H-18); c.stroke();
      // bars
      const w = 32;
      const x1 = 48, x2 = x1 + 64;
      const h1 = Math.max(8, (Math.min(10, Number(base.value||0))/10) * (H-40));
      const h2 = Math.max(8, (Math.min(10, cvr/10)) * (H-40));
      const y = H-18;
      // base bar
      c.fillStyle = 'rgba(120,240,255,.35)'; c.fillRect(x1, y-h1, w, h1);
      // new bar
      c.fillStyle = 'rgba(124,92,255,.55)'; c.fillRect(x2, y-h2, w, h2);
      // labels
      c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '12px system-ui, -apple-system';
      c.fillText('Base', x1-2, y+12);
      c.fillText('New', x2, y+12);
      c.fillText(`×${lift.toFixed(2)}`, x2-4, y-h2-6);
    }
  }

  // ---------- 3) Listing wizard: richer JSON + copy ----------
  const name = $('#wiz-name'), sum = $('#wiz-sum'), room = $('#wiz-room'), opd = $('#wiz-opd'), outJson = $('#wiz-json');
  const btn = $('#wiz-build');
  if (name && sum && room && opd && outJson && btn) {
    on(btn,'click', ()=>{
      const obj = {
        plan: (name.value||'Unnamed Plan').trim(),
        sum_insured_lakh: Number(sum.value||10),
        room_eligibility: (room.value||'Single AC').trim(),
        opd: opd.value === 'Yes',
        network_strength: 'city-weighted',
        disclosure: 'Pricing indicative; final underwriter decision applies',
        schema_version: '1.1',
        created_at: new Date().toISOString()
      };
      outJson.textContent = JSON.stringify(obj,null,2);
      toast('Listing JSON built');
    });
  }

  // Copy webhook sample
  const pre = $('#api-json'), copy = $('#api-copy');
  if (pre && copy) {
    on(copy,'click', async ()=>{
      try { await navigator.clipboard.writeText(pre.textContent); copy.textContent='Copied!'; setTimeout(()=>copy.textContent='Copy JSON',1200); }
      catch { copy.textContent='Copy failed'; setTimeout(()=>copy.textContent='Copy JSON',1200); }
    });
  }

  // ---------- 4) Android-like ripples ----------
  const cards = $$('.product, .ai-card, .result');
  cards.forEach(card=>{
    card.style.position = card.style.position || 'relative';
    on(card,'pointerdown',(e)=>{
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const d = Math.max(r.width,r.height);
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute;left:${x-d/2}px;top:${y-d/2}px;width:${d}px;height:${d}px;border-radius:50%;
        background: radial-gradient(circle at center, rgba(255,255,255,.20), rgba(255,255,255,0) 60%);
        pointer-events:none; transform:scale(.2); opacity:.85; mix-blend-mode:screen;`;
      card.appendChild(ripple);
      ripple.animate([{transform:'scale(.2)',opacity:.85},{transform:'scale(1.1)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.finally(()=>ripple.remove());
    });
  });

  // ---------- 5) Persona particles ----------
  document.dispatchEvent(new CustomEvent('hf:particles:config', {
    detail: { density: 0.8, drift: 0.25 }
  }));

  // ---------- Toast helper ----------
  function toast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg; t.classList.add('in');
    setTimeout(()=>t.classList.remove('in'),1600);
  }
})();
