/* =========================================================
   HealthFlo — Reimbursement Page JS
   - Risk logic (>15 days = High Risk)
   - WhatsApp share with text table
   - Success modal + auto close + form clear
   ========================================================= */

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];
const toast = (msg,ms=2200)=>{ const t=qs('#toast'); if(!t) return; t.textContent=msg; t.classList.add('is-show'); setTimeout(()=>t.classList.remove('is-show'),ms); };

const WHATSAPP_E164 = '91861425342'; // target number (+91 861425342)

const form = qs('#rbForm');
const patientName = qs('#patientName');
const policyType = qs('#policyType');
const dischargeDate = qs('#dischargeDate');
const notes = qs('#notes');

const riskBadge = qs('#riskBadge');
const inlineSuccess = qs('#inlineSuccess');

const sModal = qs('#successModal');
const sWhen = qs('#sWhen');
const sRef = qs('#sRef');
const sClose = qs('#sClose');

/* Theme toggle */
qs('#themeToggle')?.addEventListener('click', ()=>{
  const root=document.documentElement;
  const next = root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
});

/* Risk evaluation */
function calcRisk(dateStr){
  if(!dateStr) return { risk:'—', cls:'', days:null };
  const d = new Date(dateStr);
  if(Number.isNaN(+d)) return { risk:'Invalid date', cls:'risk-high', days:null };

  const now = new Date();
  // Zero out time for date-only difference
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((n0 - d0) / 86400000); // today minus discharge

  if(diffDays < 0){
    return { risk: 'Invalid (future date)', cls:'risk-high', days:diffDays };
  }
  if(diffDays > 15){
    return { risk: `High Risk (${diffDays} days)`, cls:'risk-high', days:diffDays };
  }
  return { risk: `Normal (${diffDays} days)`, cls:'risk-ok', days:diffDays };
}

function updateRiskUI(){
  const { risk, cls } = calcRisk(dischargeDate.value);
  riskBadge.classList.remove('risk-ok','risk-high');
  if(cls) riskBadge.classList.add(cls);
  riskBadge.textContent = `Risk: ${risk}`;
}

dischargeDate.addEventListener('change', updateRiskUI);
updateRiskUI();

/* Helpers */
function nowStamp(){
  const d = new Date();
  return {
    readable: d.toLocaleString([], { dateStyle:'medium', timeStyle:'short' }),
    iso: d.toISOString()
  };
}
function genRef(){
  const d=new Date();
  const pad=n=>n.toString().padStart(2,'0');
  return `${d.getFullYear().toString().slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function buildWhatsAppTable({pName,pType,dDate,riskTxt,stampTxt,ref,notesTxt}){
  // ASCII table for WhatsApp (monospace look; WA will send plain text)
  const lines = [
    '*HealthFlo — Reimbursement Request*',
    '',
    '```',
    '+----------------------+--------------------------------+',
    '| Field                | Value                          |',
    '+----------------------+--------------------------------+',
    `| Patient Name         | ${truncate(pName,30).padEnd(30)}|`,
    `| Policy Type          | ${truncate(pType,30).padEnd(30)}|`,
    `| Discharge Date       | ${truncate(dDate,30).padEnd(30)}|`,
    `| Risk                 | ${truncate(riskTxt,30).padEnd(30)}|`,
    `| Submitted At         | ${truncate(stampTxt,30).padEnd(30)}|`,
    `| Reference            | ${truncate(ref,30).padEnd(30)}|`,
    '+----------------------+--------------------------------+',
    '```',
  ];
  if(notesTxt){
    lines.push('', '*Notes:*', notesTxt);
  }
  lines.push('', '_We’ll coordinate in the background so you can rest._');
  return encodeURIComponent(lines.join('\n'));
}
function truncate(v, n){ v = String(v||''); return (v.length>n)? (v.slice(0,n-1)+'…'):v; }

/* Modal helpers */
function openSuccessModal(stampTxt, ref){
  sWhen.textContent = stampTxt;
  sRef.textContent = ref;
  sModal.setAttribute('aria-hidden','false');
  // Auto close after 3s
  setTimeout(()=> closeSuccessModal(), 3000);
}
function closeSuccessModal(){
  sModal.setAttribute('aria-hidden','true');
}
sClose.addEventListener('click', closeSuccessModal);
sModal.addEventListener('click', (e)=>{ if(e.target===sModal || e.target.classList.contains('s-modal__backdrop')) closeSuccessModal(); });

/* Submit */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  inlineSuccess.classList.remove('is-show');

  // Basic validation
  if(!patientName.value.trim()){ toast('Please enter patient name.'); patientName.focus(); return; }
  if(!policyType.value){ toast('Please select policy type.'); policyType.focus(); return; }
  if(!dischargeDate.value){ toast('Please select date of discharge.'); dischargeDate.focus(); return; }

  const riskInfo = calcRisk(dischargeDate.value);
  updateRiskUI();

  const stamp = nowStamp();
  const ref = genRef();

  const payload = {
    pName: patientName.value.trim(),
    pType: policyType.value,
    dDate: dischargeDate.value,
    riskTxt: riskInfo.risk,
    stampTxt: stamp.readable,
    ref,
    notesTxt: notes.value.trim()
  };

  const text = buildWhatsAppTable(payload);
  const wurl = `https://api.whatsapp.com/send?phone=${WHATSAPP_E164}&text=${text}`;
  window.open(wurl, '_blank');

  inlineSuccess.textContent = 'Your request is submitted successfully.';
  inlineSuccess.classList.add('is-show');
  openSuccessModal(stamp.readable, ref);
  toast('Opening WhatsApp…');

  // Clear the form after showing modal/WA
  form.reset();
  updateRiskUI();
});
