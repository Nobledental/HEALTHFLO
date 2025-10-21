/* =========================================================
   HealthFlo — Forms & Calculators
   - Lead OTP (client-side demo)
   - Eligibility estimator + Copy
   - Co-pay calculator
   - “What do you need?” quick intents
   - Small utilities (INR format, toast)
   ========================================================= */

(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* -------------------------------------------
     Toast helper
  ------------------------------------------- */
  const toastBox = $('#toast');
  function toast(msg, ok=true){
    if (!toastBox) return;
    toastBox.textContent = msg;
    toastBox.style.background = ok ? 'var(--toast-bg, rgba(12,16,35,.94))' : 'linear-gradient(180deg,#2a0d14,#17090d)';
    toastBox.classList.add('in');
    clearTimeout(toastBox.__t);
    toastBox.__t = setTimeout(()=> toastBox.classList.remove('in'), 2200);
  }

  /* -------------------------------------------
     INR helpers
  ------------------------------------------- */
  const fmtINR = (n) => {
    const v = Number(n||0);
    if (Number.isNaN(v)) return '₹0';
    return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  /* -------------------------------------------
     Lead OTP (demo only, in-browser)
     - No network; just simulates UX
  ------------------------------------------- */
  (() => {
    const phone = $('#phone');
    const btnSend = $('.js-send-otp');
    const btnVerify = $('.js-verify-otp');
    const wrap = $('.otp-wrap');
    const inputs = $$('.otp-i', wrap);
    const status = $('#otpStatus');

    if (!btnSend || !btnVerify) return;

    let code = '';

    function genCode(){ return String(Math.floor(1000 + Math.random()*9000)); }

    on(btnSend, 'click', () => {
      const digits = (phone?.value || '').replace(/\D/g, '');
      if (digits.length < 10){
        status.textContent = 'Enter a valid Indian mobile number.';
        status.style.color = '#ffd7d7';
        toast('Invalid phone number', false);
        return;
      }
      code = genCode();
      // Simulate network latency
      status.textContent = 'OTP sent. Please enter the 4 digits.';
      status.style.color = '';
      wrap?.classList.remove('hidden');
      inputs[0]?.focus();
      toast('OTP sent ✔');
      // NOTE: For demo you can log it in devtools: console.log('OTP:', code);
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

    on(btnVerify, 'click', () => {
      const entered = inputs.map(x=>x.value).join('');
      if (entered.length < 4){
        status.textContent = 'Enter all 4 digits.';
        status.style.color = '#ffd7d7';
        toast('Enter all digits', false);
        return;
      }
      if (entered === code){
        status.textContent = 'Phone verified ✓';
        status.style.color = '#22c55e';
        toast('Phone verified ✓');
        try { localStorage.setItem('hf-lead-verified', 'true'); } catch {}
      } else {
        status.textContent = 'Incorrect code, try again.';
        status.style.color = '#ef4444';
        toast('Incorrect code', false);
      }
    });
  })();

  /* -------------------------------------------
     Eligibility estimator (indicative only)
     - Selects: #elig-ins, #elig-city, #elig-spec, #elig-sum
     - Output:  .elig-result
     - Copy:    #elig-copy
  ------------------------------------------- */
  (() => {
    const box   = $('#patient-elig'); if (!box) return;
    const ins   = $('#elig-ins', box);
    const city  = $('#elig-city', box);
    const spec  = $('#elig-spec', box);
    const sum   = $('#elig-sum', box);
    const out   = $('.elig-result', box);
    const copyB = $('#elig-copy', box);

    const baseBySpec = {
      general: .78, dental: .62, ophthalmology: .70, ivf: .56,
      orthopedics: .66, cardiac: .61, oncology: .50
    };

    function estimate(specName, sumL){
      const b = baseBySpec[String(specName||'general').toLowerCase()] ?? .6;
      const s = parseInt(sumL || 5, 10);
      const adj = s > 20 ? -0.10 : s > 10 ? -0.05 : 0.02; // heuristic
      const val = Math.min(.92, Math.max(.30, b + adj));
      return Math.round(val * 100);
    }

    function render(){
      const p = estimate(spec?.value, sum?.value);
      const txt = `Likely eligible: ${p}% — for ${spec?.value} treatment with ₹${sum?.value}L cover in ${city?.value}. ${ins?.value || 'Any'}`;
      out.textContent = txt;
    }

    [ins, city, spec, sum].forEach(el => on(el, 'change', render));
    render();

    on(copyB, 'click', async () => {
      try {
        await navigator.clipboard.writeText(out.textContent.trim());
        toast('Copied ✓');
      } catch {
        toast('Copy failed', false);
      }
    });
  })();

  /* -------------------------------------------
     Co-pay calculator
     - Inputs: #co-bill, #co-rate
     - Output: #co-out
  ------------------------------------------- */
  (() => {
    const bill = $('#co-bill');
    const rate = $('#co-rate');
    const out  = $('#co-out');
    if (!bill || !rate || !out) return;

    function calc(){
      const b = Number(bill.value || 0);
      const r = Math.min(100, Math.max(0, Number(rate.value || 0)));
      if (!b){
        out.textContent = 'Enter bill to estimate co-pay.';
        return;
      }
      const co = Math.round(b * (r/100));
      const net = b - co;
      out.innerHTML = `Estimated co-pay: <b>${fmtINR(co)}</b>. Net payable by insurer: <b>${fmtINR(net)}</b>.`;
    }

    on(bill,'input', calc);
    on(rate,'input', calc);
    calc();
  })();

  /* -------------------------------------------
     “What do you need?” quick intents (Patient)
     - Input:  #ask-patient
     - Chips:  .chip--btn [data-go], [data-q]
  ------------------------------------------- */
  (() => {
    const input = $('#ask-patient');
    if (!input) return;
    const chips = $$('.chip--btn');

    chips.forEach(c => {
      on(c, 'click', (e) => {
        const q = c.getAttribute('data-q');
        if (q) input.value = q;
        const go = c.getAttribute('data-go');
        if (go){
          // gentle focus without scroll jump (keep page position)
          const tgt = document.querySelector(go);
          if (tgt){
            tgt.setAttribute('tabindex','-1');
            tgt.focus({ preventScroll: true });
            // If you want to scroll smoothly, uncomment:
            // tgt.scrollIntoView({ behavior:'smooth', block:'start' });
          }
        }
      });
    });

    on(input, 'keydown', (e) => {
      if (e.key === 'Enter'){
        const v = (input.value || '').toLowerCase();
        if (v.includes('policy') || v.includes('buy')){
          document.querySelector('#p-products')?.scrollIntoView({ behavior:'smooth' });
        } else if (v.includes('cashless') || v.includes('elig')){
          document.querySelector('#patient-elig')?.scrollIntoView({ behavior:'smooth' });
        } else {
          toast('Try: “cashless check” • “buy policy” • “package price”');
        }
      }
    });
  })();

})();
