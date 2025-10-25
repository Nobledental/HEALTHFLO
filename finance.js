/* =========================================================
   HealthFlo — Finance / EMI Assistance
   - Card effects + dropzones
   - Eligibility (zero-interest requires active policy)
   - EMI estimate
   - WhatsApp handoff (details table)
   - Success modal & reset
   ========================================================= */

const qs = (s, el=document)=>el.querySelector(s);
const qsa = (s, el=document)=>[...el.querySelectorAll(s)];
const toast=(msg,ms=2200)=>{ const t=qs('#toast'); if(!t) return; t.textContent=msg; t.classList.add('is-show'); setTimeout(()=>t.classList.remove('is-show'),ms); };

const form = qs('#finForm');
const fullName = qs('#fullName');
const regMobile = qs('#regMobile');
const regEmail = qs('#regEmail');
const aadhaarNum = qs('#aadhaarNum');
const panNum = qs('#panNum');
const policyType = qs('#policyType');

const sameAsPermanent = qs('#sameAsPermanent');
const currentBlock = qs('#currentBlock');
const addr = {
  p1: qs('#pAddr1'), p2: qs('#pAddr2'), pc: qs('#pCity'), ps: qs('#pState'), pp: qs('#pPin'),
  c1: qs('#cAddr1'), c2: qs('#cAddr2'), cc: qs('#cCity'), cs: qs('#cState'), cp: qs('#cPin'),
};

const aadhaarFiles = qs('#aadhaarFiles');
const panFile      = qs('#panFile');
const bankFiles    = qs('#bankFiles');
const policyFile   = qs('#policyFile');

const listAadhaar = qs('#listAadhaar');
const listPAN     = qs('#listPAN');
const listBank    = qs('#listBank');
const listPolicy  = qs('#listPolicy');

const prefZero = qs('#prefZero');
const prefStd  = qs('#prefStd');
const loanAmt  = qs('#loanAmt');
const tenure   = qs('#tenure');
const rate     = qs('#rate');
const rateLbl  = qs('#rateLbl');
const emiOut   = qs('#emiOut');

const consentCibil = qs('#consentCibil');
const consentTerms = qs('#consentTerms');
const inlineSuccess = qs('#inlineSuccess');

/* Success modal */
const sModal = qs('#successModal');
const sWhen  = qs('#sWhen');
const sRef   = qs('#sRef');
const sChoice= qs('#sChoice');
const sEmi   = qs('#sEmi');
const sClose = qs('#sClose');

/* WhatsApp number (E.164, change if needed) */
const WHATSAPP_E164 = '91861425342'; // e.g., +91 861425342x -> 91861425342

/* Theme toggle */
qs('#themeToggle')?.addEventListener('click', ()=>{
  const root=document.documentElement;
  const next= root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
});

/* Show/Hide current address block */
function updateCurrentBlock(){
  if(sameAsPermanent.checked){
    currentBlock.style.display='none';
    // Clear current address fields
    ['c1','c2','cc','cs','cp'].forEach(k=> addr[k].value='');
  }else{
    currentBlock.style.display='';
  }
}
sameAsPermanent.addEventListener('change', updateCurrentBlock);
updateCurrentBlock();

/* Dropzone file list preview */
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
aadhaarFiles.addEventListener('change', ()=>listFiles(aadhaarFiles, listAadhaar));
panFile.addEventListener('change',     ()=>listFiles(panFile, listPAN));
bankFiles.addEventListener('change',   ()=>listFiles(bankFiles, listBank));
policyFile.addEventListener('change',  ()=>listFiles(policyFile, listPolicy));

/* EMI logic */
function parseAmt(){ return Math.max(0, parseInt(loanAmt.value.replace(/[^\d]/g,''),10) || 0); }
function parseTen(){ return Math.max(1, parseInt(tenure.value,10) || 1); }
function apr(){ return parseFloat(rate.value)||0; }
function emiCalc(P, months, aprPct){
  if(P<=0 || months<=0) return 0;
  const r = (aprPct/100)/12;
  if(r===0) return P / months;
  const num = P*r*Math.pow(1+r, months);
  const den = Math.pow(1+r, months) - 1;
  return num/den;
}
function updateEMI(){
  rateLbl.textContent = `${apr()}%`;
  const P = parseAmt();
  const n = parseTen();
  const zSelected = prefZero.checked;
  let est = 0;
  if(zSelected){
    // zero interest 3 months only -> if tenure not 3, still show dividing into n months without interest
    const months = n;
    est = P>0 ? P / months : 0;
  }else{
    est = emiCalc(P, parseTen(), apr());
  }
  emiOut.textContent = est>0 ? `₹${Math.round(est).toLocaleString()}/mo` : '—';
}
[loanAmt,tenure,rate,prefZero,prefStd].forEach(el=>el.addEventListener('input', updateEMI));
updateEMI();

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
  return `FIN-${d.getFullYear().toString().slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function maskPAN(p){ if(!p) return ''; p = p.toUpperCase(); return p.replace(/^([A-Z]{3})[A-Z]\d{4}([A-Z])$/, (_,a,z)=>`${a}X****${z}`) || p; }
function maskAadhaar(a){ if(!a) return ''; const s=a.replace(/\s+/g,''); return s.length>=4 ? `XXXX-XXXX-${s.slice(-4)}` : s; }
function shortAddr(a1,a2,city,state,pin){
  const parts=[a1,a2,city,state,pin].map(x=>String(x||'').trim()).filter(Boolean);
  return parts.join(', ').slice(0,60);
}
function fileNames(input){
  const files = input?.files || [];
  return [...files].map(f=>f.name).join(', ');
}
function truncate(v, n){ v = String(v||''); return (v.length>n)? (v.slice(0,n-1)+'…'):v; }

/* Eligibility hint */
function eligibleZero(){
  // basic rule: zero-interest allowed only if policyType is not empty (any policy) and tenure <= 3 preferred.
  const hasPolicy = policyType.value !== '';
  return hasPolicy;
}

/* WhatsApp payload */
function buildWhatsAppText(ref, stamp, emiSel, emiEst){
  const P = parseAmt();
  const n = parseTen();
  const rows = [
    '*HealthFlo — Finance/EMI Request*',
    '',
    '```',
    '+--------------------------+--------------------------------+',
    '| Field                    | Value                          |',
    '+--------------------------+--------------------------------+',
    `| Name                     | ${truncate(fullName.value,30).padEnd(30)}|`,
    `| Mobile                   | ${truncate(regMobile.value,30).padEnd(30)}|`,
    `| Email                    | ${truncate(regEmail.value,30).padEnd(30)}|`,
    `| PAN                      | ${truncate(maskPAN(panNum.value),30).padEnd(30)}|`,
    `| Aadhaar (masked)         | ${truncate(maskAadhaar(aadhaarNum.value),30).padEnd(30)}|`,
    `| Policy Type              | ${truncate(policyType.value||'—',30).padEnd(30)}|`,
    `| Loan Amount (₹)          | ${truncate(P.toLocaleString()||'—',30).padEnd(30)}|`,
    `| Tenure (months)          | ${String(n).padEnd(30)}|`,
    `| Preference               | ${truncate(emiSel,30).padEnd(30)}|`,
    `| Est. EMI                 | ${truncate(emiEst,30).padEnd(30)}|`,
    `| Submitted At             | ${truncate(stamp.readable,30).padEnd(30)}|`,
    `| Reference                | ${truncate(ref,30).padEnd(30)}|`,
    '+--------------------------+--------------------------------+',
    '```',
    '',
    '*Permanent Address:*',
    shortAddr(addr.p1.value, addr.p2.value, addr.pc.value, addr.ps.value, addr.pp.value),
  ];
  if(!sameAsPermanent.checked){
    rows.push('', '*Current Address:*',
      shortAddr(addr.c1.value, addr.c2.value, addr.cc.value, addr.cs.value, addr.cp.value)
    );
  }
  const docLines = [];
  const aa = fileNames(aadhaarFiles); if(aa) docLines.push(`Aadhaar: ${aa}`);
  const pf = fileNames(panFile);      if(pf) docLines.push(`PAN: ${pf}`);
  const bs = fileNames(bankFiles);    if(bs) docLines.push(`Bank: ${bs}`);
  const pc = fileNames(policyFile);   if(pc) docLines.push(`Policy: ${pc}`);
  if(docLines.length){
    rows.push('', '*Docs uploaded (filenames)*:', ...docLines);
  }
  rows.push('', '_We will run CIBIL verification and contact you shortly._');

  return encodeURIComponent(rows.join('\n'));
}

/* Modal controls */
function openSuccess(){ sModal.setAttribute('aria-hidden','false'); }
function closeSuccess(){ sModal.setAttribute('aria-hidden','true'); }
sClose.addEventListener('click', closeSuccess);
sModal.addEventListener('click', (e)=>{ if(e.target===sModal || e.target.classList.contains('s-modal__backdrop')) closeSuccess(); });

/* Validation helpers */
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isMobile(v){ return /^\d{10}$/.test(v); }
function isPAN(v){ return /^[A-Z]{5}\d{4}[A-Z]$/i.test(v); }
function isPin(v){ return /^\d{6}$/.test(v); }

/* Submit */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  inlineSuccess.classList.remove('is-show');

  // Basic validations
  if(!fullName.value.trim()){ toast('Please enter full name.'); fullName.focus(); return; }
  if(!isMobile(regMobile.value)){ toast('Enter a valid 10-digit mobile.'); regMobile.focus(); return; }
  if(!isEmail(regEmail.value)){ toast('Enter a valid email.'); regEmail.focus(); return; }
  if(!isPAN(panNum.value)){ toast('Enter a valid PAN (ABCDE1234F).'); panNum.focus(); return; }
  if(!policyType.value){ toast('Select policy type.'); policyType.focus(); return; }

  // Permanent address checks
  if(!addr.p1.value.trim() || !addr.pc.value.trim() || !addr.ps.value.trim() || !isPin(addr.pp.value)){
    toast('Complete permanent address with 6-digit pincode.'); addr.p1.focus(); return;
  }
  // Current address if different
  if(!sameAsPermanent.checked){
    if(!addr.c1.value.trim() || !addr.cc.value.trim() || !addr.cs.value.trim() || !isPin(addr.cp.value)){
      toast('Complete current address with 6-digit pincode.'); addr.c1.focus(); return;
    }
  }

  // Loan
  const P = parseAmt();
  if(P<=0){ toast('Enter desired loan amount.'); loanAmt.focus(); return; }

  // Zero-interest eligibility note
  if(prefZero.checked && !eligibleZero()){
    toast('Zero-interest is for policy holders only. Please select Standard EMI or upload policy.');
    return;
  }

  const stamp = nowStamp();
  const ref   = genRef();

  // EMI compute and labels
  const zSel = prefZero.checked;
  const choiceLbl = zSel ? 'Zero-interest (3 months if selected tenure)' : `Standard EMI @ ${apr()}% APR`;
  const estEmi = zSel
    ? (P>0 ? Math.round(P/parseTen()).toLocaleString() : '—')
    : (Math.round(emiCalc(P, parseTen(), apr())).toLocaleString());

  // WhatsApp
  const text = buildWhatsAppText(ref, stamp, choiceLbl, estEmi ? `₹${estEmi}/mo` : '—');
  const wurl = `https://api.whatsapp.com/send?phone=${WHATSAPP_E164}&text=${text}`;
  window.open(wurl, '_blank');

  // Success modal
  sWhen.textContent = stamp.readable;
  sRef.textContent  = ref;
  sChoice.textContent = choiceLbl;
  sEmi.textContent = estEmi ? `₹${estEmi}/mo` : '—';
  openSuccess();

  inlineSuccess.textContent='Your request is submitted successfully.';
  inlineSuccess.classList.add('is-show');

  // Reset
  form.reset();
  updateCurrentBlock();
  // Clear file lists
  [listAadhaar,listPAN,listBank,listPolicy].forEach(ul=>ul.innerHTML='');
  updateEMI();
});

/* Accessibility nicety for theme toggle */
qs('#themeToggle')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.currentTarget.click(); }});
