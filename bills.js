/* =========================================================
   HealthFlo — Bills / Coverage Check
   - Upload policy/discharge/bill + phone
   - 15-day risk flag on discharge date
   - WhatsApp handoff with details table
   - Quick WhatsApp / Call
   - Success modal & reset
   ========================================================= */

const qs = (s, el=document)=>el.querySelector(s);
const toast=(msg,ms=2200)=>{ const t=qs('#toast'); if(!t) return; t.textContent=msg; t.classList.add('is-show'); setTimeout(()=>t.classList.remove('is-show'),ms); };

/* Constants — update if your numbers change */
const WHATSAPP_E164 = '91861425342';   // e.g., +91 861425342x  (E.164 without '+')
const CALL_NUMBER   = '+91861425342';  // tel: link

/* Theme toggle */
qs('#themeToggle')?.addEventListener('click', ()=>{
  const root=document.documentElement;
  const next= root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
});

/* Quick actions */
const waQuick = qs('#waQuick');
const callQuick = qs('#callQuick');
const fabWA = qs('#fabWA');
const fabCall = qs('#fabCall');
function setQuickLinks(defaultMsg='Hi, I need a coverage eligibility check.'){
  const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_E164}&text=${encodeURIComponent(defaultMsg)}`;
  waQuick.setAttribute('href', url);
  fabWA.setAttribute('href', url);
  const tel = `tel:${CALL_NUMBER}`;
  callQuick.setAttribute('href', tel);
  fabCall.setAttribute('href', tel);
}
setQuickLinks();

/* Form elements */
const form = qs('#covForm');
const pName = qs('#pName');
const phone = qs('#phone');
const policyType = qs('#policyType');
const hospital = qs('#hospital');
const dischargeDate = qs('#dischargeDate');
const riskNote = qs('#riskNote');

const policyFile = qs('#policyFile');
const dischargeFile = qs('#dischargeFile');
const billFile = qs('#billFile');

const listPolicy = qs('#listPolicy');
const listDischarge = qs('#listDischarge');
const listBill = qs('#listBill');

const consent = qs('#consent');
const inlineSuccess = qs('#inlineSuccess');

/* Success modal */
const sModal = qs('#successModal');
const sWhen  = qs('#sWhen');
const sRef   = qs('#sRef');
const sWA    = qs('#sWA');
const sClose = qs('#sClose');

/* Helpers */
function nowStamp(){
  const d=new Date();
  return {
    readable: d.toLocaleString([], { dateStyle:'medium', timeStyle:'short' }),
    iso: d.toISOString()
  };
}
function genRef(){
  const d=new Date(); const pad=n=>n.toString().padStart(2,'0');
  return `BILL-${d.getFullYear().toString().slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function isMobile(v){ return /^\d{10}$/.test(v); }
function daysBetween(a,b){ const ms = 24*60*60*1000; return Math.floor((b-a)/ms); }
function fileNames(input){ const f = input?.files || []; return [...f].map(x=>x.name).join(', '); }
function listFiles(input, ul){
  ul.innerHTML='';
  const files = input.files || [];
  if(!files.length){ return; }
  [...files].forEach(f=>{
    const li=document.createElement('li');
    li.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
    ul.appendChild(li);
  });
}

/* File previews */
policyFile.addEventListener('change', ()=>listFiles(policyFile, listPolicy));
dischargeFile.addEventListener('change', ()=>listFiles(dischargeFile, listDischarge));
billFile.addEventListener('change', ()=>listFiles(billFile, listBill));

/* Risk note based on discharge date */
dischargeDate.addEventListener('change', ()=>{
  if(!dischargeDate.value){ riskNote.hidden = true; return; }
  const d = new Date(dischargeDate.value);
  const today = new Date();
  const diff = daysBetween(d, today);
  riskNote.hidden = !(diff > 15);
});

/* Build WhatsApp message */
function buildWhatsAppText(ref, stamp){
  const rows = [
    '*HealthFlo — Coverage Eligibility Check*',
    '',
    '```',
    '+--------------------------+--------------------------------+',
    '| Field                    | Value                          |',
    '+--------------------------+--------------------------------+',
    `| Patient Name             | ${(pName.value||'—').padEnd(30)}|`,
    `| Phone                    | ${phone.value.padEnd(30)}|`,
    `| Policy Type              | ${(policyType.value||'—').padEnd(30)}|`,
    `| Hospital                 | ${(hospital.value||'—').slice(0,30).padEnd(30)}|`,
    `| Discharge Date           | ${(dischargeDate.value||'—').padEnd(30)}|`,
    `| Submitted At             | ${stamp.readable.padEnd(30)}|`,
    `| Reference                | ${ref.padEnd(30)}|`,
    '+--------------------------+--------------------------------+',
    '```',
  ];

  const docs = [];
  const pf = fileNames(policyFile);     if(pf) docs.push(`Policy: ${pf}`);
  const df = fileNames(dischargeFile);  if(df) docs.push(`Discharge: ${df}`);
  const bf = fileNames(billFile);       if(bf) docs.push(`Bill: ${bf}`);
  if(docs.length){
    rows.push('', '*Docs uploaded (filenames)*:', ...docs);
  }
  rows.push('', '_Note: Attach the files in WhatsApp if prompted._');

  return encodeURIComponent(rows.join('\n'));
}

/* Modal controls */
function openSuccess(){ sModal.setAttribute('aria-hidden','false'); }
function closeSuccess(){ sModal.setAttribute('aria-hidden','true'); }
sClose.addEventListener('click', closeSuccess);
sModal.addEventListener('click', (e)=>{ if(e.target===sModal || e.target.classList.contains('s-modal__backdrop')) closeSuccess(); });

/* Submit handling */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  inlineSuccess.classList.remove('is-show');

  if(!isMobile(phone.value)){ toast('Enter a valid 10-digit phone number.'); phone.focus(); return; }
  if(!policyType.value){ toast('Select policy type.'); policyType.focus(); return; }
  if(!policyFile.files.length){ toast('Please upload policy copy.'); policyFile.focus(); return; }
  if(!dischargeFile.files.length){ toast('Please upload discharge summary.'); dischargeFile.focus(); return; }
  if(!billFile.files.length){ toast('Please upload final bill.'); billFile.focus(); return; }
  if(!consent.checked){ toast('Please agree to be contacted.'); consent.focus(); return; }

  const stamp = nowStamp();
  const ref   = genRef();

  // Build WhatsApp URL
  const text = buildWhatsAppText(ref, stamp);
  const wurl = `https://api.whatsapp.com/send?phone=${WHATSAPP_E164}&text=${text}`;

  // Open WhatsApp (also set in success modal)
  sWA.setAttribute('href', wurl);
  window.open(wurl, '_blank');

  // Success modal info
  sWhen.textContent = stamp.readable;
  sRef.textContent  = ref;
  openSuccess();

  inlineSuccess.textContent='Request submitted successfully.';
  inlineSuccess.classList.add('is-show');

  // Reset form + UI
  form.reset();
  [listPolicy,listDischarge,listBill].forEach(ul=>ul.innerHTML='');
  riskNote.hidden = true;

  // Update quick link with contextual default
  setQuickLinks(`Hi, this is ${pName.value||'a patient'}. I submitted coverage docs (Ref: ${ref}). Please review.`);
});

/* Accessibility nicety for theme toggle */
qs('#themeToggle')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.currentTarget.click(); }});
