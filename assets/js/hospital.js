/* =========================================================
   HealthFlo — hospital.js
   - RCM checklist generator
   - WhatsApp Intake link
   ========================================================= */

(function rcmChecklist(){
  const out = document.getElementById('rcm-checklist');
  if (!out) return;
  const items = [
    'TPA matrix & SLAs (with escalation contacts)',
    'Pre-auth SOPs + document templates',
    'TAT heatmaps (preauth/settlement)',
    'Denial management + recovery ledger',
    'Insurance desk audit trail (sign/specimen)',
    'MIS dashboards & monthly review',
  ];
  out.innerHTML = `<ul class="muted" style="display:grid; gap:.4rem">${items.map(i=>`<li>• ${i}</li>`).join('')}</ul>`;
})();

(function waIntake(){
  const name = document.getElementById('wa-hname');
  const spec = document.getElementById('wa-spec');
  const out = document.getElementById('wa-link');
  const btn = document.getElementById('wa-make');
  const open = document.getElementById('wa-open');

  function gen(){
    const n = (name.value||'Your Hospital').trim();
    const s = (spec.value||'General').trim();
    const msg = encodeURIComponent(`Hi, I want to book ${s} appointment at ${n} via HealthFlo cashless.`);
    const url = `https://wa.me/?text=${msg}`;
    out.value = url; open.href = url;
  }
  btn?.addEventListener('click', gen);
})();
