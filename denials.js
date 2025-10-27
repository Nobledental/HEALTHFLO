/* =========================================================
   HealthFlo — Claim Denial Review (Glass / Pastel Blue)
   denials.js
   ========================================================= */

(function () {
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const toast = (msg, ms=2200) => { const t=qs('#toast'); t.textContent=msg; t.classList.add('is-show'); setTimeout(()=>t.classList.remove('is-show'), ms); };
  const fmtKB = n => ${Math.round(n/1024).toLocaleString()} KB;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const LS_KEY = 'hf_denials_intakes';

  // Theme toggle (remember choice)
  const themeBtn = qs('#themeToggle');
  const htmlEl = document.documentElement;
  const savedTheme = localStorage.getItem('hf_theme');
  if (savedTheme) htmlEl.setAttribute('data-theme', savedTheme);
  if (!savedTheme) htmlEl.setAttribute('data-theme', 'light');
  themeBtn?.addEventListener('click', () => {
    const cur = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', cur);
    localStorage.setItem('hf_theme', cur);
  });

  // Minimal ripple helper
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.ripple, .btn, .pressable');
    if (!el) return;
    el.classList.remove('press-zoom'); void el.offsetWidth; el.classList.add('press-zoom');
    const rect = el.getBoundingClientRect();
    const s = Math.max(rect.width, rect.height);
    const r = document.createElement('span');
    r.className = 'md-ripple';
    r.style.width = r.style.height = s + 'px';
    r.style.left = (e.clientX - rect.left - s/2) + 'px';
    r.style.top  = (e.clientY - rect.top  - s/2) + 'px';
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once:true });
  });

  // Drag & drop enhancers
  qsa('.drop').forEach(zone => {
    const input = qs(#${zone.dataset.for});
    const note = qs(#${zone.dataset.for.replace('File','')}Note) || zone.nextElementSibling;

    function setNote(file) {
      if (!note) return;
      if (!file) note.textContent = '';
      else note.textContent = ${file.name} — ${fmtKB(file.size)};
    }

    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (f) setNote(f);
    });

    zone.addEventListener('dragover', (e)=>{ e.preventDefault(); zone.classList.add('is-over'); });
    zone.addEventListener('dragleave', ()=> zone.classList.remove('is-over'));
    zone.addEventListener('drop', (e)=>{
      e.preventDefault();
      zone.classList.remove('is-over');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) {
        input.files = e.dataTransfer.files;
        setNote(f);
      }
    });
  });

  // Support → show call block
  const callBlock = qs('#callBlock');
  qsa('input[name="needSupport"]').forEach(r => r.addEventListener('change', () => {
    callBlock.style.display = r.value === 'Yes' && r.checked ? '' : 'none';
  }));

  // Validation helpers
  function okPhone(v){ return /^[6-9]\d{9}$/.test((v||'').trim()); }
  function okFile(file){ return file && file.size <= MAX_SIZE && /^(application\/pdf|image\/)/.test(file.type); }

  // Submit handling
  const form = qs('#denialForm');
  const successBox = qs('#successBox');
  const caseIdEl = qs('#caseId');
  const waShare = qs('#waShare');
  const submitAnother = qs('#submitAnother');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const policy = qs('#policyFile').files[0];
    const denial = qs('#denialFile').files[0];
    const remarks = qs('#remarks').value.trim();
    const mobile = qs('#mobile').value.trim();
    const needSupport = (new FormData(form).get('needSupport')) || 'No';
    const callOk = (new FormData(form).get('callOk')) || 'No';
    const callTime = qs('#callTime').value;
    const consent = qs('#consent').checked;

    // Validation
    if (!policy) return toast('Please attach your policy copy.');
    if (!denial) return toast('Please attach the denial letter.');
    if (!okFile(policy) || !okFile(denial)) return toast('Each file must be PDF/JPG/PNG and ≤ 10MB.');
    if (!remarks) return toast('Please add your remarks.');
    if (!okPhone(mobile)) return toast('Enter a valid 10-digit mobile.');
    if (!consent) return toast('Please allow us to contact you.');

    // Create lightweight intake record
    const intakeId = 'HF-DR-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const rec = {
      id: intakeId,
      created: new Date().toISOString(),
      mobile, remarks, needSupport, callOk, callTime,
      files: {
        policy: { name: policy.name, size: policy.size, type: policy.type },
        denial: { name: denial.name, size: denial.size, type: denial.type }
      }
    };

    // Persist locally
    let bag = [];
    try { bag = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch {}
    bag.unshift(rec);
    localStorage.setItem(LS_KEY, JSON.stringify(bag));

    // Success UI
    caseIdEl.textContent = intakeId;
    successBox.style.display = '';
    toast('Submitted — we will reach out soon.');

    // Optional WhatsApp handoff (files can't be sent this way)
    const lines = [
      'Claim Denial Review',
      ID: ${intakeId},
      Mobile: ${mobile},
      Need Analyst Support: ${needSupport},
      Feasible for Call: ${callOk}${callTime ? ' @ '+callTime : ''},
      '',
      'Remarks:',
      remarks,
      '',
      Policy file: ${policy.name} (${fmtKB(policy.size)}),
      Denial file: ${denial.name} (${fmtKB(denial.size)})
    ];
    waShare.href = 'https://wa.me/?text=' + encodeURIComponent(lines.join('\n'));

    // Reset form (keep success visible)
    form.reset();
    callBlock.style.display = 'none';
    qsa('.file-note').forEach(n => n.textContent = '');
  });

  submitAnother.addEventListener('click', () => {
    successBox.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
