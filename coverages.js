/* =========================================================
   HealthFlo — Coverages Page JS (Advanced Retail/Corporate)
   ========================================================= */

const qs=(s,el=document)=>el.querySelector(s);
const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
function toast(msg,ms=2200){ const t=qs('#toast'); if(!t) return; t.textContent=msg; t.classList.add('is-show'); setTimeout(()=>t.classList.remove('is-show'),ms); }

/* Theme & Density */
(function initThemeDensity(){
  const root=document.documentElement;
  const saved=localStorage.getItem('hf-theme');
  root.setAttribute('data-theme', saved || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
  qs('#themeToggle')?.addEventListener('click',()=>{
    const cur=root.getAttribute('data-theme'); const next=cur==='dark'?'light':'dark';
    root.setAttribute('data-theme', next); localStorage.setItem('hf-theme', next);
  });

  const dsel=qs('#densitySelect'), dsaved=localStorage.getItem('hf-density')||'compact';
  setDensity(dsaved); if(dsel){ dsel.value=dsaved; dsel.addEventListener('change',()=>{ setDensity(dsel.value); localStorage.setItem('hf-density', dsel.value); }); }
  function setDensity(v){
    document.body.classList.remove('density-compact','density-tight','density-comfortable');
    if(v==='compact') document.body.classList.add('density-compact');
    else if(v==='tight') document.body.classList.add('density-tight');
    else document.body.classList.add('density-comfortable');
  }
})();

/* WhatsApp target (E.164 digits only) */
const WHATSAPP_E164 = '91861425342';
/* Optional backend to forward docs via WhatsApp Business API */
const BACKEND_UPLOAD_URL = ''; // e.g. '/api/coverage-upload'

/* DOM refs */
const form = qs('#coverageForm');
const fileInput = qs('#files');
const fileList = qs('#fileList');
const successBox = qs('#formSuccess');

const retailWrap = qs('#retailWrap');
const corporateWrap = qs('#corporateWrap');
const phoneWrap = qs('#phoneWrap');
const medTeamChk = qs('#needMedTeam');

const sModal = qs('#successModal');
const sWhen = qs('#sWhen');
const sRef = qs('#sRef');
const sClose = qs('#sClose');

/* Policy toggling (Retail vs Corporate) */
qsa('input[name="policyType"]').forEach(r=>r.addEventListener('change', handlePolicyToggle));
function handlePolicyToggle(){
  const val = (qs('input[name="policyType"]:checked')?.value)||'';
  const isRetail = val==='Retail';

  retailWrap.hidden = !isRetail;
  corporateWrap.hidden = isRetail;

  // Show insurer/policy fields appropriate to type (keep UI compact)
  qsa('.hf-when-retail').forEach(el => el.style.display = isRetail ? '' : 'none');

  // Med-team phone: For Retail, we use Primary Insured phone, so hide; Corporate: show if checked.
  updatePhoneVisibility();

  // Field requirements dynamically
  qs('#primaryName').required = isRetail;
  qs('#primaryPhone').required = isRetail;

  // For Corporate, insurer/policy live in #insurer/#policyNo; For Retail, in #insurerCommon/#policyNoCommon
  if(isRetail){
    qs('#insurer')?.removeAttribute('required');
    qs('#policyNo')?.removeAttribute('required');
    qs('#insurerCommon').setAttribute('required', 'true');
    qs('#policyNoCommon').setAttribute('required', 'true');
  }else{
    qs('#insurerCommon')?.removeAttribute('required');
    qs('#policyNoCommon')?.removeAttribute('required');
    qs('#insurer').setAttribute('required', 'true');
    qs('#policyNo').setAttribute('required', 'true');
  }
}

/* Phone visibility depends on policy + medTeam */
medTeamChk.addEventListener('change', updatePhoneVisibility);
function updatePhoneVisibility(){
  const val = (qs('input[name="policyType"]:checked')?.value)||'';
  const isRetail = val==='Retail';
  const needCall = medTeamChk.checked;
  phoneWrap.hidden = isRetail || !needCall;     // hide for retail; show only for corporate + medTeam
  // Require corporate phone if visible
  qs('#phone').required = (!phoneWrap.hidden);
}

/* Files list & remove */
fileInput.addEventListener('change', renderFiles);
function renderFiles(){
  fileList.innerHTML = '';
  const max = 10;
  const files = [...fileInput.files].slice(0, max);
  files.forEach((f, idx)=>{
    const pill = document.createElement('span');
    pill.className = 'hf-pill-file';
    pill.innerHTML = `<span>📎</span><span>${f.name}</span>`;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.setAttribute('aria-label','Remove file'); btn.textContent='✕';
    btn.addEventListener('click', ()=>{
      const dt = new DataTransfer();
      [...fileInput.files].forEach((ff,i)=>{ if(i!==idx) dt.items.add(ff); });
      fileInput.files = dt.files; renderFiles();
    });
    pill.appendChild(btn);
    fileList.appendChild(pill);
  });
  if(files.length===0){
    const hint = document.createElement('div');
    hint.className='hf-hint';
    hint.textContent='No files selected yet.';
    fileList.appendChild(hint);
  }
}
renderFiles();

/* Helpers */
function nowStamp(){
  const d = new Date();
  const readable = d.toLocaleString([], { dateStyle:'medium', timeStyle:'short' });
  const iso = d.toISOString();
  return { readable, iso };
}
function genRef(){
  // Simple short ref: YYMMDD-HHMMSS
  const d=new Date();
  const pad=n=>n.toString().padStart(2,'0');
  return `${d.getFullYear().toString().slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function getFormDataObj(){
  const valType = (qs('input[name="policyType"]:checked')?.value)||'';
  const isRetail = valType==='Retail';

  // Gather insurer/policy from correct inputs
  const insurer = isRetail ? qs('#insurerCommon').value.trim() : qs('#insurer').value.trim();
  const policyNo = isRetail ? qs('#policyNoCommon').value.trim() : qs('#policyNo').value.trim();

  return {
    policyType: valType,
    isRetail,
    primaryName: qs('#primaryName')?.value.trim() || '',
    primaryPhone: qs('#primaryPhone')?.value.trim() || '',

    insurer,
    policyNo,
    employeeId: isRetail ? '' : (qs('#employeeId')?.value.trim()||''),

    memberName: qs('#memberName').value.trim(),
    relation: qs('#relation').value,

    needCoverage: qs('#needCoverage').checked,
    needMedTeam: qs('#needMedTeam').checked,
    needAdmission: qs('#needAdmission').checked,
    needPackages: qs('#needPackages').checked,

    phone: qs('#phone').value.trim(),
    bestTime: qs('#bestTime').value,

    treatment: qs('#treatment').value.trim(),
    hospitalPref: qs('#hospitalPref').value.trim(),
  };
}
function buildWhatsAppText(fd, uploadedLinks, stamp, ref){
  const yesNo = v => v ? 'Yes' : 'No';
  const lines = [
    '*Coverage Check Request — HealthFlo*',
    '',
    `*Request time:* ${stamp.readable}`,
    `*Ref:* ${ref}`,
    '',
    `*Policy type:* ${fd.policyType || '-'}`,
    `*Insurer:* ${fd.insurer || '-'}`,
    `*Policy No:* ${fd.policyNo || '-'}`,
    fd.isRetail ? `*Primary insured:* ${fd.primaryName || '-'} • ${fd.primaryPhone || '-'}` : '',
    (!fd.isRetail && fd.employeeId) ? `*Employee ID:* ${fd.employeeId}` : '',
    `*Member:* ${fd.memberName || '-'} (${fd.relation||'-'})`,
    '',
    '*Requests:*',
    `• Coverage details: ${yesNo(fd.needCoverage)}`,
    `• Medical team callback: ${yesNo(fd.needMedTeam)}${fd.isRetail ? ' (call primary insured)' : ''}`,
    `• Plan admission/treatment: ${yesNo(fd.needAdmission)}`,
    `• Explore packages: ${yesNo(fd.needPackages)}`,
    (!fd.isRetail && fd.needMedTeam) ? `*Contact:* ${fd.phone || '-'} (${fd.bestTime||'Anytime'})` : '',
    '',
    '*Planned treatment / concern:*',
    fd.treatment || '-',
    '',
    '*Preferred hospital / city:*',
    fd.hospitalPref || '-',
    '',
    fd.isRetail ? '_Note: Details to be shared with the primary insured only._' : '_Corporate: We will contact your mobile number for assistance._',
    '',
    uploadedLinks?.length ? '*Documents:*' : '',
    ...(uploadedLinks||[]).map(u=>`• ${u}`)
  ].filter(Boolean);
  return encodeURIComponent(lines.join('\n'));
}

/* Success Modal controls */
function openSuccessModal(stampTxt, ref){
  sWhen.textContent = stampTxt;
  sRef.textContent = ref;
  sModal.setAttribute('aria-hidden','false');
}
function closeSuccessModal(){
  sModal.setAttribute('aria-hidden','true');
}
sClose.addEventListener('click', closeSuccessModal);
sModal.addEventListener('click', (e)=>{ if(e.target===sModal || e.target.classList.contains('s-modal__backdrop')) closeSuccessModal(); });

/* Submit handler */
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  successBox.classList.remove('is-show');

  // Validate: policy selection
  const policyType = qs('input[name="policyType"]:checked')?.value;
  if(!policyType){ toast('Choose Retail or Corporate policy.'); return; }

  const isRetail = policyType==='Retail';

  // Retail required fields
  if(isRetail){
    if(!qs('#primaryName').value.trim()){ toast('Please enter primary insured full name.'); return; }
    if(!qs('#primaryPhone').value.trim()){ toast('Please enter primary insured contact number.'); return; }
    if(!qs('#insurerCommon').value.trim()){ toast('Please enter Insurer name.'); return; }
    if(!qs('#policyNoCommon').value.trim()){ toast('Please enter Policy number.'); return; }
  }else{
    if(!qs('#insurer').value.trim()){ toast('Please enter Insurer name.'); return; }
    if(!qs('#policyNo').value.trim()){ toast('Please enter Policy number.'); return; }
  }

  // Common required
  if(!qs('#memberName').value.trim()){ toast('Please enter Patient/Member name.'); return; }
  if(!qs('#relation').value){ toast('Please choose relation.'); return; }
  if(!qs('#consent').checked){ toast('Please accept consent to proceed.'); return; }

  // Corporate + Med team => phone required
  if(!isRetail && qs('#needMedTeam').checked && !qs('#phone').value.trim()){
    toast('Add a phone number for the medical team to call.');
    return;
  }

  const obj = getFormDataObj();
  const stamp = nowStamp();
  const ref = genRef();

  // (Optional) upload files to backend (to forward via WhatsApp Business API)
  let uploadedLinks = [];
  if(BACKEND_UPLOAD_URL){
    try{
      const fd = new FormData();
      Object.entries(obj).forEach(([k,v])=>fd.append(k, v));
      [...fileInput.files].forEach(f=>fd.append('files', f));
      const res = await fetch(BACKEND_UPLOAD_URL, { method:'POST', body:fd });
      if(!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      uploadedLinks = Array.isArray(json.fileUrls) ? json.fileUrls : [];
    }catch(err){
      console.warn('Backend upload failed:', err);
      toast('Uploaded without documents (backend not configured).');
    }
  }

  // Open WhatsApp with text (note: file attachments require a backend; we send links if any)
  const text = buildWhatsAppText(obj, uploadedLinks, stamp, ref);
  const wurl = `https://api.whatsapp.com/send?phone=${WHATSAPP_E164}&text=${text}`;
  window.open(wurl, '_blank');

  // Success feedback
  successBox.classList.add('is-show');
  toast('Opening WhatsApp with your details…');

  // Show success modal with timestamp + ref
  openSuccessModal(stamp.readable, ref);

  // Clear form contents
  form.reset();
  renderFiles();

  // Reset visibility/requirements
  retailWrap.hidden = true;
  corporateWrap.hidden = true;
  phoneWrap.hidden = true;
  qs('#primaryName').required = false;
  qs('#primaryPhone').required = false;
  qs('#phone').required = false;
});

/* Initialize default UI */
handlePolicyToggle();
updatePhoneVisibility();
