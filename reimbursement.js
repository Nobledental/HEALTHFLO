/* =========================================================
   HealthFlo — Reimbursement Page JS
   - Risk logic (>15 days = High Risk)
   - WhatsApp share with text table
   - Success modal + Payment QR (₹100) + copy/open UPI
   ========================================================= */

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];
const toast = (msg,ms=2200)=>{ const t=qs('#toast'); if(!t) return; t.textContent=msg; t.classList.add('is-show'); setTimeout(()=>t.classList.remove('is-show'),ms); };

/* ====== CONFIG: Payment ====== */
const UPI_ID   = 'healthflo@upi';          // <-- change to your real UPI VPA
const UPI_NAME = 'HealthFlo Services';     // payee name
const AMOUNT   = 100;                      // ₹100
const UPI_NOTE_BASE = 'Reimbursement Service'; // note prefix

/* ====== WhatsApp target ====== */
const WHATSAPP_E164 = '91861425342'; // target number (+91 861425342)

/* ====== DOM ====== */
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

const qrImg = qs('#qrImg');
const upiNameEl = qs('#upiName');
const upiIdEl = qs('#upiId');
const upiNoteEl = qs('#upiNote');
const btnOpenUPI = qs('#btnOpenUPI');
const btnCopyLink = qs('#btnCopyLink');
const btnCopyId = qs('#btnCopyId');

/* Theme toggle */
qs('#themeToggle')?.addEventListener('click', ()=>{
  const root=document.documentElement;
  const next = root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
});

/* ===== Risk evaluation ===== */
function calcRisk(dateStr){
  if(!dateStr) return { risk:'—', cls:'', days:null };
  const d = new Date(dateStr);
  if(Number.isNaN(+d)) return { risk:'Invalid date', cls:'risk-high', days:null };

  const now = new Date();
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((n0 - d0) / 86400000);

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

/* ===== Helpers ===== */
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
function truncate(v, n){ v = String(v||''); return (v.length>n)? (v.slice(0,n-1)+'…'):v; }

/* WhatsApp payload */
function buildWhatsAppTable({pName,pType,dDate,riskTxt,stampTxt,ref,notesTxt}){
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

/* ===== Success Modal helpers ===== */
function openSuccessModal(){
  sModal.setAttribute('aria-hidden','false');
}
function closeSuccessModal(){
  sModal.setAttribute('aria-hidden','true');
}
sClose.addEventListener('click', closeSuccessModal);
sModal.addEventListener('click', (e)=>{
  if(e.target===sModal || e.target.classList.contains('s-modal__backdrop')) closeSuccessModal();
});

/* ===== Payment links + QR ===== */
function buildUpiIntent(ref){
  const note = `${UPI_NOTE_BASE} ${ref}`;
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${AMOUNT}&cu=INR&tn=${encodeURIComponent(note)}`;
}
function setPaymentBlock(ref){
  const upiIntent = buildUpiIntent(ref);
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiIntent)}&size=220&margin=2`;
  qrImg.src = qrUrl;
  upiNameEl.textContent = UPI_NAME;
  upiIdEl.textContent = UPI_ID;
  upiNoteEl.textContent = `${UPI_NOTE_BASE}`;

  btnOpenUPI.setAttribute('href', upiIntent);
  btnCopyLink.onclick = async ()=>{
    try{
      await navigator.clipboard.writeText(upiIntent);
      toast('UPI link copied');
    }catch{ toast('Copy failed'); }
  };
  btnCopyId.onclick = async ()=>{
    try{
      await navigator.clipboard.writeText(UPI_ID);
      toast('UPI ID copied');
    }catch{ toast('Copy failed'); }
  };
}

/* ===== Submit ===== */
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

  // WhatsApp share
  const text = buildWhatsAppTable(payload);
  const wurl = `https://api.whatsapp.com/send?phone=${WHATSAPP_E164}&text=${text}`;
  window.open(wurl, '_blank');

  // Success + Payment
  sWhen.textContent = stamp.readable;
  sRef.textContent = ref;
  setPaymentBlock(ref);
  openSuccessModal();

  inlineSuccess.textContent = 'Your request is submitted successfully.';
  inlineSuccess.classList.add('is-show');
  toast('Opening WhatsApp…');

  // Clear the form
  form.reset();
  updateRiskUI();
});

/* Misc */
qs('#themeToggle')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.currentTarget.click(); }});
