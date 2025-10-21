/* HealthFlo — hospital.js (persona-only enhancements)
   - Typing enrichment for hospital hero
   - KPI tickers (TAT, Denials, AR days) with smooth spring easing
   - Specialty chips -> dynamic RCM checklist + copy
   - WhatsApp Intake Link Generator polish
   - Android-like ripple on cards
   - Persona particle tuning (denser, calmer drift)
   - Marquee pause on hover (if present)
*/
(() => {
  "use strict";
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt||{ passive:true });

  // ---------- 1) Enrich typing lines (merge + fallback) ----------
  const typeEl = $('#typeTarget');
  if (typeEl) {
    const extra = [
      "Reduce denials with pre-auth SOPs.",
      "24×7 escalation desk & TAT heatmaps.",
      "Digital insurance desk with audit trails.",
      "Cashless + reimbursement, streamlined."
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
  function localType(el, lines, speed=26, hold=1300){
    let i=0,p=0,dir=1;
    el.setAttribute('data-typing-managed','local');
    (function step(){
      const t = lines[i]; p+=dir; el.textContent = t.slice(0,p);
      if (dir>0 && p===t.length){ dir=0; return setTimeout(()=>{ dir=-1; step(); }, hold); }
      if (dir<0 && p===0){ i=(i+1)%lines.length; dir=1; }
      setTimeout(step, speed);
    })();
  }

  // ---------- 2) KPI tickers (spring-eased counters) ----------
  const kpis = $$('[data-kpi]');
  if (kpis.length) {
    const spring = (t) => 1 - Math.pow(1 - t, 3); // gentle cubic spring
    kpis.forEach(el => {
      const target = Number(el.dataset.kpi||0);
      const prefix = el.dataset.prefix||'';
      const suffix = el.dataset.suffix||'';
      const dur = Number(el.dataset.dur||900);
      let t0;
      function tick(ts){
        if(!t0) t0 = ts;
        const p = Math.min(1, (ts-t0)/dur);
        const v = Math.round(target * spring(p));
        el.textContent = prefix + v.toLocaleString('en-IN') + suffix;
        if (p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // ---------- 3) Specialty chips -> RCM checklist + copy ----------
  const checklistWrap = $('#rcm-checklist') || $('#tpa-out');
  if (checklistWrap) {
    const root = checklistWrap.closest('.card') || document;
    const specBar = document.createElement('div');
    specBar.className = 'chips';
    const specs = ["Cardiac","Orthopedics","Ophthalmology","Oncology","IVF","General"];
    specBar.innerHTML = specs.map((s,i)=>`<button class="chip chip--btn${i? '':' active'}" role="tab" aria-selected="${i? 'false':'true'}" data-spec="${s}">${s}</button>`).join('');
    checklistWrap.insertAdjacentElement('beforebegin', specBar);

    const COPY_ID = 'rcm-copy';
    const copyBtn = document.createElement('button');
    copyBtn.id = COPY_ID; copyBtn.className = 'btn btn--ghost';
    copyBtn.textContent = 'Copy checklist';
    checklistWrap.insertAdjacentElement('afterend', copyBtn);

    const LISTS = {
      Default: [
        'PAN, GST, Cancelled cheque',
        'Hospital registration & bed strength proof',
        'Tariff & package list for key procedures',
        'Treating doctor registration + sign specimen',
        'Pre-auth SOPs + escalation matrix',
        'Cashless desk POC + 24×7 contacts',
        'MIS reporting emails + TAT SLA matrix',
        'Firewall allowlist for APIs (if any)'
      ],
      Cardiac: [
        'Cathlab credentials & device vendor list',
        'Pre-auth clinical template (STEMI/UA/NSTEMI)',
        'CCU bed mapping + monitoring logs'
      ],
      Orthopedics: [
        'Implant catalog & rate cards',
        'Injury/trauma documentation set',
        'Post-op rehab SOP'
      ],
      Ophthalmology: [
        'Lens catalog (mono/multifocal) with rates',
        'Pre-op biometric form template'
      ],
      Oncology: [
        'Tumor board notes & chemo cycle templates',
        'Drug formulary + prior auth matrix'
      ],
      IVF: [
        'ART registration certificate',
        'Consent bundles & chain-of-custody SOPs'
      ]
    };

    function build(spec="General"){
      const base = [...LISTS.Default];
      if (LISTS[spec]) base.push(...LISTS[spec]);
      const html = `<b>${spec}</b> checklist:<ul class="checklist">${base.map(i=>`<li>${i}</li>`).join('')}</ul>`;
      // smooth swap
      checklistWrap.animate([{opacity:1, transform:'translateY(0)'},{opacity:0.0, transform:'translateY(6px)'}], {duration:160, easing:'ease-out'})
      .finished.then(()=>{
        checklistWrap.innerHTML = html;
        checklistWrap.animate([{opacity:0, transform:'translateY(6px)'},{opacity:1, transform:'translateY(0)'}], {duration:200, easing:'ease-out'});
      });
    }
    build("Cardiac"); // first one visible

    $$('.chip', specBar).forEach(ch=>{
      on(ch,'click',()=>{
        $$('.chip',specBar).forEach(x=>{ x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
        ch.classList.add('active'); ch.setAttribute('aria-selected','true');
        build(ch.dataset.spec);
      });
    });

    on($('#'+COPY_ID),'click', async ()=>{
      try {
        await navigator.clipboard.writeText(checklistWrap.textContent.trim());
        toast('Checklist copied ✓');
      } catch { toast('Copy failed'); }
    });
  }

  // ---------- 4) WhatsApp Intake Link Generator polish ----------
  const hname = $('#wa-hname'), hspec = $('#wa-spec'), out = $('#wa-link'), open = $('#wa-open');
  const genBtn = $('#wa-make');
  if (hname && hspec && out && open && genBtn) {
    const gen = ()=>{
      const name = (hname.value||'Your Hospital').trim();
      const spec = (hspec.value||'General').trim();
      const msg = encodeURIComponent(`Hi, I want to book ${spec} appointment at ${name} via HealthFlo cashless.`);
      const url = `https://wa.me/?text=${msg}`;
      out.value = url; open.href = url;
    };
    on(genBtn,'click', gen);
  }

  // ---------- 5) Android-like ripple on product cards ----------
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
        background: radial-gradient(circle at center, rgba(255,255,255,.18), rgba(255,255,255,0) 60%);
        pointer-events:none; transform:scale(.2); opacity:.85; mix-blend-mode:screen;`;
      card.appendChild(ripple);
      ripple.animate([{transform:'scale(.2)',opacity:.85},{transform:'scale(1.1)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.finally(()=>ripple.remove());
    });
  });

  // ---------- 6) Persona particles (denser, slower drift) ----------
  document.dispatchEvent(new CustomEvent('hf:particles:config', {
    detail: { density: 0.9, drift: 0.4 }
  }));

  // ---------- 7) Locations marquee pause ----------
  const mq = $('#loc-slider') || $('.geo-marquee__track');
  if (mq) {
    on(mq,'mouseenter', ()=> mq.style.animationPlayState = 'paused');
    on(mq,'mouseleave', ()=> mq.style.animationPlayState = 'running');
  }

  // ---------- Toast helper ----------
  function toast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg; t.classList.add('in');
    setTimeout(()=>t.classList.remove('in'),1600);
  }
})();
