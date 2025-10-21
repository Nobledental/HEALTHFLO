/* OTP mini flow + copy helpers + co-pay */
(function(){
  const wrap = document; // works on index or persona pages

  const sendBtn = wrap.querySelector('.js-send-otp');
  const verifyBtn = wrap.querySelector('.js-verify-otp');
  const otpWrap = wrap.querySelector('.otp-wrap');
  const status = wrap.querySelector('#otpStatus,#p-otpStatus');

  if(sendBtn){
    sendBtn.addEventListener('click', ()=>{
      otpWrap?.classList.remove('hidden');
      status && (status.textContent = 'OTP sent. Enter 4 digits.');
      const first = wrap.querySelector('.otp .otp-i'); first && first.focus();
    });
  }
  if(verifyBtn){
    verifyBtn.addEventListener('click', ()=>{
      status && (status.textContent = 'Phone verified ✓');
    });
  }

  // Eligibility estimator (light heuristic)
  function est(spec, sum){
    const base = { general:.8, dental:.6, ophthalmology:.72, ivf:.55, orthopedics:.66, cardiac:.62, oncology:.5 };
    const b = base[String(spec).toLowerCase()] ?? .6;
    const s = parseInt(sum,10)||5;
    const adj = s>20 ? -0.1 : s>10 ? -0.05 : 0.02;
    const val = Math.min(.92, Math.max(.3, b+adj));
    return Math.round(val*100);
  }

  function wire(prefix=''){
    const el = id => wrap.querySelector(`#${prefix}${id}`);
    const ins=el('elig-ins'), city=el('elig-city'), spec=el('elig-spec'), sum=el('elig-sum');
    const out = el('elig-out') || document.querySelector('.elig-result');
    const copyBtn = el('elig-copy') || document.querySelector('#p-elig-copy');

    function render(){
      if(!ins||!city||!spec||!sum||!out) return;
      const pct = est(spec.value, sum.value);
      out.innerHTML = `<strong>Likely eligible: ${pct}%</strong> — ${spec.value}, ₹${sum.value}L, ${city.value} (${ins.value||'Any'})`;
    }
    [ins,city,spec,sum].forEach(x=> x&&x.addEventListener('change',render));
    render();

    // Co-pay
    const bill = el('co-bill') || document.querySelector('#p-co-bill');
    const rate = el('co-rate') || document.querySelector('#p-co-rate');
    const coOut = el('co-out') || document.querySelector('#p-co-out');
    function copay(){
      const b = Number(bill?.value||0), r = Math.min(100, Math.max(0, Number(rate?.value||0)));
      if(!b){ coOut && (coOut.textContent='Enter bill to estimate co-pay.'); return; }
      const cop = Math.round(b * (r/100));
      coOut && (coOut.innerHTML = `Estimated co-pay: <b>₹${cop.toLocaleString('en-IN')}</b>. Insurer: <b>₹${(b-cop).toLocaleString('en-IN')}</b>.`);
    }
    bill && bill.addEventListener('input',copay); rate && rate.addEventListener('input',copay);

    copyBtn && copyBtn.addEventListener('click', async ()=>{
      try {
        await navigator.clipboard.writeText(out.textContent.trim());
        const t = document.getElementById('toast'); t.textContent='Copied ✓'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1200);
      } catch {}
    });
  }

  wire('');    // index
  wire('p-');  // patient page
})();
