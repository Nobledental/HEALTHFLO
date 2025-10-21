/* =========================================================
   HealthFlo — patient.js
   - Packages list
   - OTP mock flow
   - Eligibility estimator + copay calc + copy
   ========================================================= */

const PACKAGES = [
  { name:'Cataract (Mono)', city:'Delhi', from:23000, notes:['NABH partner','Day-care ready'] },
  { name:'ACL Reconstruction', city:'Mumbai', from:68000, notes:['Standard implants','Ward/Single AC'] },
  { name:'Angiography', city:'Bengaluru', from:14000, notes:['Day-care','Cashless friendly'] },
  { name:'Cesarean Delivery', city:'Hyderabad', from:52000, notes:['OT & NICU standby','GST extra'] },
];

(function renderPackages(){
  const grid = document.getElementById('pkgGrid');
  if (!grid) return;
  grid.innerHTML = PACKAGES.map(p => `
    <article class="product tilt">
      <h4>${p.name}</h4>
      <p class="muted">${p.city} • From ₹${p.from.toLocaleString('en-IN')}</p>
      <ul class="muted" style="margin-top:.4rem">${p.notes.map(n=>`<li>• ${n}</li>`).join('')}</ul>
    </article>
  `).join('');
})();

// Tilt microfx
(() => {
  document.querySelectorAll('.tilt').forEach(card=>{
    let af;
    card.addEventListener('mousemove', (e)=>{
      const b = card.getBoundingClientRect();
      const px = (e.clientX - b.left)/b.width - .5;
      const py = (e.clientY - b.top)/b.height - .5;
      cancelAnimationFrame(af);
      af = requestAnimationFrame(()=> card.style.transform = `translateY(-4px) rotateX(${py*-6}deg) rotateY(${px*8}deg)`);
    }, { passive:true });
    card.addEventListener('mouseleave', ()=>{ cancelAnimationFrame(af); card.style.transform = ''; });
  });
})();

// OTP mock
(() => {
  const btnSend = document.querySelector('.js-send-otp');
  const btnVerify = document.querySelector('.js-verify-otp');
  const wrap = document.querySelector('.otp-wrap');
  const status = document.getElementById('otpStatus');

  let code = '';
  function gen(){ return String(Math.floor(1000 + Math.random()*9000)); }

  btnSend?.addEventListener('click', ()=>{
    const phone = document.getElementById('phone')?.value?.replace(/\D/g,'') || '';
    if (phone.length < 10){ status.textContent = 'Enter a valid phone number.'; return; }
    code = gen();
    wrap?.classList.remove('hidden');
    status.textContent = 'OTP sent. Please enter the 4 digits.';
    document.querySelector('.otp .otp-i')?.focus();
  });

  btnVerify?.addEventListener('click', ()=>{
    const entered = [...document.querySelectorAll('.otp .otp-i')].map(i=>i.value).join('');
    if (entered.length < 4){ status.textContent = 'Enter all digits.'; return; }
    if (entered === code){ status.textContent = 'Phone verified ✓'; status.style.color = '#22c55e'; }
    else { status.textContent = 'Incorrect code, try again.'; status.style.color = '#ef4444'; }
  });
})();

// Eligibility + co-pay
(() => {
  const ins = document.getElementById('elig-ins');
  const city = document.getElementById('elig-city');
  const spec = document.getElementById('elig-spec');
  const sum = document.getElementById('elig-sum');
  const out = document.getElementById('eligRes');
  const copyBtn = document.getElementById('elig-copy');

  function estimate(specialty, si){
    const base = { general:.8, dental:.6, ophthalmology:.72, ivf:.55, orthopedics:.66, cardiac:.62, oncology:.5 };
    const b = base[String(specialty).toLowerCase()] ?? .6;
    const s = parseInt(si,10)||5;
    const adj = s>20 ? -0.1 : s>10 ? -0.05 : 0.02;
    const val = Math.min(.92, Math.max(.3, b+adj));
    return Math.round(val*100);
  }
  function render(){
    const pct = estimate(spec.value, sum.value);
    out.textContent = `Likely eligible: ${pct}% — ${spec.value} in ${city.value}, sum insured ₹${sum.value}L (${ins.value}).`;
  }
  [ins,city,spec,sum].forEach(el => el?.addEventListener('change', render, { passive:true }));
  render();

  copyBtn?.addEventListener('click', async ()=>{
    try { await navigator.clipboard.writeText(out.textContent||''); toast('Eligibility text copied'); }
    catch { toast('Copy failed'); }
  });

  const bill = document.getElementById('co-bill');
  const rate = document.getElementById('co-rate');
  const coOut = document.getElementById('co-out');
  function copay(){
    const b = Number(bill.value||0), r = Math.min(100, Math.max(0, Number(rate.value||0)));
    if(!b){ coOut.textContent='Enter bill to estimate co-pay.'; return; }
    const cop = Math.round(b * (r/100));
    coOut.innerHTML = `Estimated co-pay: <b>₹${cop.toLocaleString('en-IN')}</b>. Net payable by insurer: <b>₹${(b-cop).toLocaleString('en-IN')}</b>.`;
  }
  bill?.addEventListener('input', copay);
  rate?.addEventListener('input', copay);
})();

// Toast helper
function toast(msg){
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('in');
  clearTimeout(t._h); t._h = setTimeout(()=> t.classList.remove('in'), 1400);
}
