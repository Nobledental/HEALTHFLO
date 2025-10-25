/* =========================================================
   HealthFlo — App JS
   Works with the provided HTML and unified CSS (healthflo.css)
   ========================================================= */

/* ------------------ Utilities ------------------ */
const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
});
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const debounce = (fn, ms=220) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

function toast(msg, ms=2400){
  const t = qs('#toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('is-show');
  setTimeout(()=>t.classList.remove('is-show'), ms);
}

function copyText(txt){
  return navigator.clipboard?.writeText(txt)
    .then(()=>true)
    .catch(()=>false);
}

/* ------------------ Data Generation ------------------ */
const CITIES = [
  'Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Pune',
  'Kolkata','Ahmedabad','Jaipur','Chandigarh','Lucknow','Indore'
];

const AREAS = [
  'Andheri West','Powai','Gachibowli','Banjara Hills','Koramangala','HSR Layout',
  'DLF Phase 3','Saket','Viman Nagar','Alwarpet','T Nagar','Park Street',
  'Bodakdev','Vastrapur','Vaishali Nagar','C-Scheme','Kalyani Nagar','Bandra East'
];

const SPECIALTIES = [
  'Cardiology','Orthopaedics','Neurology','Oncology','Gastroenterology',
  'ENT','Urology','Obstetrics & Gynaecology','Paediatrics','General Surgery',
];

const CORE_SERVICES = [
  'OPD','IPD','Emergency','24x7 Pharmacy','Lab','Home Visit','Cashless','Teleconsult'
];

const FACILITY_POOL = [
  'ICU','NICU','PICU','Modular OT','Cath Lab','MRI 3T','CT 128-slice',
  'Ambulance 24×7','Blood Bank','In-house Pharmacy','Cafeteria','Valet Parking',
  'Private Rooms','Wi-Fi','Wheelchair Access','Day Care'
];

const PKG_BY_SPEC = {
  'Cardiology': [
    { t:'Coronary Angiography', p:[12000, 18000] },
    { t:'Angioplasty (DES)', p:[120000, 180000] },
    { t:'CABG (Bypass Surgery)', p:[250000, 420000] },
  ],
  'Orthopaedics': [
    { t:'Total Knee Replacement', p:[180000, 280000] },
    { t:'ACL Reconstruction', p:[85000, 140000] },
    { t:'Hip Replacement', p:[220000, 340000] },
  ],
  'Neurology': [
    { t:'Brain MRI + Neuro Consult', p:[6000, 12000] },
    { t:'Stroke Package (72h)', p:[80000, 160000] },
    { t:'Spine Decompression', p:[140000, 240000] },
  ],
  'Oncology': [
    { t:'Chemotherapy Cycle', p:[18000, 42000] },
    { t:'Radiation (IMRT) 15 Fr', p:[120000, 220000] },
    { t:'Breast Conservation Surgery', p:[180000, 320000] },
  ],
  'Gastroenterology': [
    { t:'Laparoscopic Cholecystectomy', p:[65000, 110000] },
    { t:'Endoscopy + Biopsy', p:[4500, 12000] },
    { t:'ERCP', p:[55000, 90000] },
  ],
  'ENT': [
    { t:'Septoplasty', p:[45000, 90000] },
    { t:'Tonsillectomy', p:[35000, 70000] },
    { t:'FESS', p:[70000, 120000] },
  ],
  'Urology': [
    { t:'TURP', p:[70000, 120000] },
    { t:'PCNL', p:[90000, 160000] },
    { t:'URS + Lithotripsy', p:[65000, 110000] },
  ],
  'Obstetrics & Gynaecology': [
    { t:'Normal Delivery', p:[45000, 80000] },
    { t:'C-Section', p:[70000, 120000] },
    { t:'Laparoscopic Hysterectomy', p:[120000, 220000] },
  ],
  'Paediatrics': [
    { t:'Well Baby Package (1y)', p:[10000, 24000] },
    { t:'NICU Care (per day)', p:[8000, 16000] },
    { t:'Paediatric Surgery Day Care', p:[60000, 120000] },
  ],
  'General Surgery': [
    { t:'Hernia Repair (Lap)', p:[80000, 140000] },
    { t:'Appendectomy (Lap)', p:[65000, 110000] },
    { t:'Haemorrhoids (Stapler)', p:[70000, 120000] },
  ],
};

const DOCTOR_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Kabir',
  'Diya', 'Anaya', 'Aadhya', 'Myra', 'Kiara', 'Sara', 'Navya',
  'Rohan', 'Vihaan', 'Prisha', 'Ira', 'Aryan', 'Advait', 'Anika', 'Aanya'
];

const LANG_SETS = [
  ['English','Hindi'], ['English','Hindi','Marathi'],
  ['English','Kannada','Hindi'], ['English','Telugu','Hindi'],
  ['English','Tamil','Hindi'], ['English','Bengali','Hindi'],
  ['English','Gujarati','Hindi'], ['English','Punjabi','Hindi']
];

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const pickUnique = (arr, n) => {
  const pool = [...arr]; const out = [];
  while(out.length < Math.min(n, pool.length)){
    const i = rand(pool.length); out.push(pool.splice(i,1)[0]);
  }
  return out;
};

function makeDoctors(specialties, city, count=6, seed=1){
  const docs = [];
  for(let i=0;i<count;i++){
    const sp = i < specialties.length ? specialties[i] : pick(specialties);
    const name = `Dr. ${pick(DOCTOR_NAMES)} ${String.fromCharCode(65 + (i%20))}`;
    const exp = clamp(2 + rand(23), 2, 25);
    const fee = 300 + rand(700);
    const langs = pick(LANG_SETS);
    const id = `doc-${seed}-${i}`;
    docs.push({
      id, name, speciality: sp, experience: exp, fee,
      languages: langs.join(', '),
      avatar: `https://picsum.photos/seed/${id}/128/128`,
      bio: `${name} is a ${sp} specialist with ${exp}+ years of experience. Expertise in evidence-based care, patient education and minimally invasive techniques.`,
      slots: makeSlots()
    });
  }
  return docs;
}

function makeSlots(){
  const base = ['09:30 AM','10:15 AM','11:00 AM','11:45 AM','12:30 PM','02:30 PM','03:15 PM','04:00 PM','05:15 PM','06:00 PM'];
  return pickUnique(base, 6);
}

function makePackages(specs, seed=1){
  const pkgs = [];
  const set = pickUnique(specs, Math.min(3, specs.length));
  set.forEach((sp, idx)=>{
    const options = PKG_BY_SPEC[sp] || [];
    pickUnique(options, 2 + rand(2)).forEach((o, j)=>{
      const [lo, hi] = o.p;
      const price = Math.round(lo + Math.random() * (hi - lo));
      pkgs.push({
        id: `pkg-${seed}-${idx}-${j}`,
        title: `${o.t}`,
        price,
        inclusions: `Pre-op evaluation • Procedure • Ward/OT charges • ${rand(2)?'2':'3'}–${rand(2)?'4':'5'} days stay • Basic meds`
      });
    });
  });
  return pkgs;
}

function makeServices(seed=1){
  const combo = pickUnique(CORE_SERVICES, 6 + rand(2)); // 6–7 services
  const map = {
    'OPD': { icon:'🩺', meta:'Mon–Sat • 9 AM – 7 PM', action:'Book OPD' },
    'IPD': { icon:'🛏️', meta:'150+ beds • Private & Shared', action:'Plan Admission' },
    'Emergency': { icon:'🚑', meta:'24×7 Trauma & ER', action:'Call ER' },
    '24x7 Pharmacy': { icon:'💊', meta:'In-house + Delivery', action:'Order Medicines' },
    'Lab': { icon:'🧪', meta:'Pathology • Radiology', action:'Book Test' },
    'Home Visit': { icon:'🏠', meta:'Nurse & Phlebotomy', action:'Request Visit' },
    'Cashless': { icon:'💳', meta:'20+ Insurers', action:'Check Network' },
    'Teleconsult': { icon:'📱', meta:'Video/Audio', action:'Start Call' },
  };
  return combo.map(k => ({ key:k, ...map[k] }));
}

function makeFacilities(){
  return pickUnique(FACILITY_POOL, 8 + rand(4));
}

function makeAbout(name, city){
  return `${name} is a multi-speciality centre in ${city} focused on transparent, evidence-based care. Our team follows international protocols, powered by modern OTs, critical care and 24×7 support services.`;
}

/* Build 26 hospitals across cities */
function buildHospitals(){
  const baseNames = [
    'Apex Care Hospital', 'Nova Multispeciality', 'Lifeline MedCenter', 'Prime Heart & Neuro',
    'Sunrise SuperCare', 'Zenith Health City', 'Harmony Hospitals', 'TruLife Clinic',
    'Evergreen Health', 'Beacon Specialty', 'Regency Hospitals', 'CureWell Medical',
    'TrustCare Multispeciality'
  ];
  const all = [];
  let idx = 1;
  for(const city of CITIES){
    const perCity = 2; // 12*2 = 24; plus a couple extra below
    for(let i=0;i<perCity;i++){
      const name = `${pick(baseNames)} — ${i%2 ? 'East' : 'West'}`;
      const area = pick(AREAS);
      const specs = pickUnique(SPECIALTIES, 4 + rand(3)); // 4–6 specialities
      const services = makeServices(idx);
      const doctors = makeDoctors(specs, city, 6 + rand(3), idx);
      const packages = makePackages(specs, idx);
      const facilities = makeFacilities();
      const rating = (4 + Math.random() * .9).toFixed(1);
      const id = `h-${idx}`;
      all.push({
        id, name, city, area, rating,
        image: `https://picsum.photos/seed/hosp-${idx}/960/640`,
        logo:  `https://picsum.photos/seed/logo-${idx}/128/128`,
        services, specialties: specs, doctors, packages, facilities,
        about: makeAbout(name, city),
        contact: {
          address: `${Math.floor(10+Math.random()*90)} ${area}, ${city}`,
          phone: `+91-${9000000000 + rand(999999999)}`.replace(/(\d{2})(\d{5})(\d{5})/,'$1-$2-$3'),
          hours: `Mon–Sat: 08:00–20:00\nSun: 09:00–14:00`,
          // lat/lng not mandatory; we can search by address
        },
        pills: pickUnique(['NABH', 'Cashless', '24×7', 'ISO 9001'], 2 + rand(2))
      });
      idx++;
      if(all.length >= 26) break;
    }
    if(all.length >= 26) break;
  }
  // Add a couple extra to ensure 26+
  while(all.length < 26){
    const city = pick(CITIES);
    const name = `HealthFlo Partner — ${city}`;
    const area = pick(AREAS);
    const specs = pickUnique(SPECIALTIES, 5);
    const services = makeServices(idx);
    const doctors = makeDoctors(specs, city, 7, idx);
    const packages = makePackages(specs, idx);
    const facilities = makeFacilities();
    const rating = (4 + Math.random() * .9).toFixed(1);
    const id = `h-${idx}`;
    all.push({
      id, name, city, area, rating,
      image: `https://picsum.photos/seed/hosp-${idx}/960/640`,
      logo:  `https://picsum.photos/seed/logo-${idx}/128/128`,
      services, specialties: specs, doctors, packages, facilities,
      about: makeAbout(name, city),
      contact: {
        address: `${Math.floor(10+Math.random()*90)} ${area}, ${city}`,
        phone: `+91-${9000000000 + rand(999999999)}`.replace(/(\d{2})(\d{5})(\d{5})/,'$1-$2-$3'),
        hours: `Mon–Sat: 08:00–20:00\nSun: 09:00–14:00`,
      },
      pills: pickUnique(['NABH', 'Cashless', '24×7', 'ISO 9001'], 2)
    });
    idx++;
  }
  return all;
}

/* ------------------ State ------------------ */
const STATE = {
  hospitals: [],
  filtered: [],
  query: '',
  tag: '',          // chip filter: 'OPD', 'IPD', etc
  city: '',
  specialty: '',
  favs: new Set(),
};

/* ------------------ Rendering: Grid ------------------ */
function renderGrid(list){
  const grid = qs('#hospitalGrid');
  const tpl = qs('#tpl-hospital-card');
  grid.innerHTML = '';
  if(!list.length){
    grid.innerHTML = `<div class="metric" style="grid-column:1/-1">No hospitals matched your filters.</div>`;
    updateMetrics(list);
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach(h => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = h.id;
    const img = qs('figure img', node);
    img.src = h.image; img.alt = `${h.name} photo`;

    qs('.card-title', node).textContent = h.name;
    qs('.card-city', node).textContent = `${h.city}`;

    const sub = qs('.card-sub', node);
    sub.textContent = `${h.specialties.slice(0,3).join(', ')} • ` +
      h.services.slice(0,3).map(s=>s.key).join(', ') + (h.services.length>3?'…':'');

    const badgesWrap = qs('.card-badges', node);
    badgesWrap.innerHTML = '';
    h.services.slice(0,5).forEach(s=>{
      const b = document.createElement('span');
      b.className = 'badge'; b.textContent = s.key;
      badgesWrap.appendChild(b);
    });

    const viewBtn = qs('.btn-view', node);
    const enqBtn  = qs('.btn-enquire', node);

    viewBtn.addEventListener('click', () => openHospital(h.id));
    enqBtn.addEventListener('click', () => {
      openHospital(h.id, 'packages');
      toast('Tell us your treatment & preferred dates. We’ll get back with quotes.');
    });

    frag.appendChild(node);
  });

  grid.appendChild(frag);
  updateMetrics(list);
}

function updateMetrics(list){
  const hosp = qs('#metricHospitals'); if(hosp) hosp.textContent = `${list.length}+`;
  const docs = list.reduce((n,h)=>n + (h.doctors?.length || 0), 0);
  const pkgs = list.reduce((n,h)=>n + (h.packages?.length || 0), 0);
  const mD = qs('#metricDoctors'); if(mD) mD.textContent = `${docs}+`;
  const mP = qs('#metricPackages'); if(mP) mP.textContent = `${pkgs}+`;
}

/* ------------------ Filtering ------------------ */
function applyFilters(){
  const { hospitals, query, tag, city, specialty } = STATE;
  const q = query.trim().toLowerCase();

  let list = hospitals.filter(h => {
    // City filter
    if(city && h.city !== city) return false;
    // Specialty filter
    if(specialty && !h.specialties.includes(specialty)) return false;
    // Tag / chip
    if(tag && !h.services.some(s => s.key === tag)) return false;
    // Search query
    if(q){
      const hay = [
        h.name, h.city, h.area,
        ...h.specialties,
        ...h.doctors.map(d => d.name),
      ].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  STATE.filtered = list;
  renderGrid(list);
}

/* ------------------ Modal: Hospital ------------------ */
const HOSPITAL_MODAL = {
  root: qs('#hospitalModal'),
  sheet: qs('#hospitalModal .hf-sheet'),
  closeBtn: qs('#hospitalClose'),
  tabs: qsa('.hf-tab'),
  panels: qsa('.hf-panel'),
  currentId: null,
};

function bindModalGlobal(){
  // Close by clicking backdrop (outside sheet)
  HOSPITAL_MODAL.root.addEventListener('click', (e)=>{
    if(e.target === HOSPITAL_MODAL.root) closeHospital();
  });
  // Close by button
  HOSPITAL_MODAL.closeBtn.addEventListener('click', closeHospital);
  // Escape to close
  document.addEventListener('keydown', (e)=> {
    if(e.key === 'Escape'){
      if(qs('#doctorModal')?.classList.contains('is-open')) closeDoctor();
      else if(HOSPITAL_MODAL.root.classList.contains('is-open')) closeHospital();
    }
  });

  // Tabs
  HOSPITAL_MODAL.tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      activateTab(tab.dataset.tab);
    });
  });

  // Footer actions (delegated listeners set on open to use specific hospital)
}

function activateTab(key){
  HOSPITAL_MODAL.tabs.forEach(t=>{
    const on = t.dataset.tab === key;
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  HOSPITAL_MODAL.panels.forEach(p=>{
    p.classList.toggle('is-active', p.id === `panel-${key}`);
  });
}

function openHospital(id, tabKey){
  const h = STATE.hospitals.find(x => x.id === id);
  if(!h) return;

  HOSPITAL_MODAL.currentId = id;

  // Header
  qs('#hospitalLogo').src = h.logo;
  qs('#hospitalLogo').alt = `${h.name} logo`;
  qs('#hospitalTitle').textContent = h.name;
  qs('#hospitalAreaTxt').textContent = `${h.city} • ${h.area}`;
  qs('#hospitalRating').textContent = `⭐ ${h.rating}`;

  const pills = qs('#hospitalPills'); pills.innerHTML = '';
  h.pills.forEach(p=>{
    const el = document.createElement('span');
    el.className = 'hf-pill'; el.textContent = p;
    pills.appendChild(el);
  });

  // Panels content
  renderServices(h);
  renderPackages(h);
  renderDoctors(h);
  renderAbout(h);
  renderContact(h);

  // Footer actions
  bindFooterActions(h);

  // Share / Fav
  qs('#btnShare').onclick = async () => {
    const shareData = {
      title: h.name,
      text: `Check ${h.name} on HealthFlo — ${h.city}.`,
      url: location.href.split('#')[0] + `#${h.id}`
    };
    if(navigator.share){
      try { await navigator.share(shareData); } catch(e){}
    }else{
      const ok = await copyText(shareData.url);
      toast(ok ? 'Link copied to clipboard' : 'Copy failed. Press Ctrl/Cmd+C');
    }
  };
  qs('#btnFav').onclick = () => {
    if(STATE.favs.has(h.id)){
      STATE.favs.delete(h.id); toast('Removed from Saved');
    } else {
      STATE.favs.add(h.id); toast('Saved to your list');
    }
  };

  // Open
  HOSPITAL_MODAL.root.classList.add('is-open');
  // focus a safe element
  setTimeout(()=> qs('#hospitalClose').focus(), 0);

  // Change tab if requested
  if(tabKey) activateTab(tabKey); else activateTab('services');
}

function closeHospital(){
  HOSPITAL_MODAL.root.classList.remove('is-open');
  HOSPITAL_MODAL.currentId = null;
}

/* Services */
function renderServices(h){
  const wrap = qs('#servicesGrid');
  const tpl  = qs('#tpl-service-item');
  wrap.innerHTML = '';
  h.services.forEach(s=>{
    const n = tpl.content.firstElementChild.cloneNode(true);
    qs('.hf-service__icon', n).textContent = s.icon || '🏥';
    qs('.hf-service__title', n).textContent = s.key;
    qs('.hf-service__meta', n).textContent  = s.meta || '';
    const btn = qs('.svc-action', n);
    btn.textContent = s.action || 'View';
    btn.addEventListener('click', ()=>{
      if(s.key === 'OPD')      toast('OPD booking: pick specialty & preferred doctor.');
      else if(s.key === 'IPD') toast('IPD: our coordinator will call you to plan admission.');
      else if(s.key === 'Emergency') window.open('tel:108', '_self');
      else if(s.key.includes('Pharmacy')) toast('Pharmacy: enter prescription for delivery.');
      else if(s.key === 'Lab') toast('Choose test • Lab visit or Home sample.');
      else if(s.key === 'Home Visit') toast('Share location & preferred slot.');
      else toast(`${s.key} — we’ll assist you shortly.`);
    });
    wrap.appendChild(n);
  });
}

/* Packages */
function renderPackages(h){
  const wrap = qs('#packagesList');
  const tpl  = qs('#tpl-package-item');
  wrap.innerHTML = '';

  if(!h.packages?.length){
    wrap.innerHTML = `<div class="metric">No packages listed. Tap “Enquire” to request a quote.</div>`;
    return;
  }

  h.packages.forEach(p=>{
    const n = tpl.content.firstElementChild.cloneNode(true);
    qs('.hf-package__title', n).textContent = p.title;
    qs('.hf-package__meta',  n).textContent = p.inclusions;
    qs('.hf-price', n).textContent = INR.format(p.price);
    qs('.pkg-action', n).addEventListener('click', ()=>{
      toast(`Enquiry sent for “${p.title}”. Our team will reach out.`);
    });
    wrap.appendChild(n);
  });
}

/* Doctors */
function renderDoctors(h){
  const wrap = qs('#doctorList');
  const tpl  = qs('#tpl-doctor-card');
  wrap.innerHTML = '';

  h.doctors.forEach(d=>{
    const n = tpl.content.firstElementChild.cloneNode(true);
    n.dataset.docId = d.id;
    qs('img', n).src = d.avatar;
    qs('img', n).alt = d.name;
    qs('.hf-doc__name', n).textContent = d.name;
    qs('.hf-doc__sub',  n).textContent = `${d.speciality} • ${d.experience} yrs`;

    qs('.doc-chat', n).addEventListener('click', ()=>{
      toast(`Chat request sent to ${d.name}.`);
    });
    qs('.doc-view', n).addEventListener('click', ()=>{
      openDoctor(h, d);
    });

    wrap.appendChild(n);
  });
}

/* About / Facilities */
function renderAbout(h){
  qs('#aboutText').textContent = h.about || '';
  const fac = qs('#facilityChips'); fac.innerHTML = '';
  h.facilities.forEach(f=>{
    const c = document.createElement('span');
    c.className = 'hf-chip';
    c.textContent = f;
    fac.appendChild(c);
  });
}

/* Contact */
function renderContact(h){
  qs('#contactAddress').textContent = `${h.contact.address}\n${h.contact.phone}`;
  qs('#openHours').textContent = h.contact.hours || '—';

  qs('#btnGetDirections').onclick = ()=>{
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.contact.address)}`;
    window.open(url, '_blank');
  };
  qs('#btnCall').onclick = ()=> window.open(`tel:${h.contact.phone.replace(/[^\d+]/g,'')}`, '_self');
  qs('#btnChat').onclick = ()=> toast('Support will connect you with the hospital shortly.');
}

/* Footer CTA binding */
function bindFooterActions(h){
  qs('#btnBookOPD').onclick   = ()=> toast('OPD booking flow started.');
  qs('#btnBookIPD').onclick   = ()=> toast('IPD admission enquiry submitted.');
  qs('#btnEnquirePkg').onclick= ()=> toast('Tell us your treatment; we’ll share packages and estimates.');
  qs('#btnPharmacy').onclick  = ()=> toast('Pharmacy delivery: upload prescription to proceed.');
  qs('#btnLab').onclick       = ()=> toast('Select tests and choose lab visit or home sample.');
}

/* ------------------ Nested Modal: Doctor ------------------ */
const DOCTOR_MODAL = {
  root: qs('#doctorModal'),
  card: qs('#doctorModal .hf-nested__card'),
  closeBtn: qs('#doctorClose'),
  ctx: { hospital: null, doctor: null },
};

function bindDoctorGlobal(){
  DOCTOR_MODAL.root.addEventListener('click', (e)=>{
    if(e.target === DOCTOR_MODAL.root) closeDoctor();
  });
  DOCTOR_MODAL.closeBtn.addEventListener('click', closeDoctor);
}

function openDoctor(h, d){
  DOCTOR_MODAL.ctx = { hospital: h, doctor: d };
  qs('#doctorAvatar').src = d.avatar;
  qs('#doctorAvatar').alt = d.name;
  qs('#doctorName').textContent = d.name;
  qs('#doctorSub').textContent  = `${d.speciality} • ${d.experience} yrs`;

  const facts = qs('#doctorFacts'); facts.innerHTML = '';
  [
    `Languages: ${d.languages}`,
    `Consultation Fee: ${INR.format(d.fee)}`,
    `Hospital: ${h.name}, ${h.city}`
  ].forEach(x=>{
    const pill = document.createElement('span');
    pill.className = 'hf-pill'; pill.textContent = x;
    facts.appendChild(pill);
  });

  qs('#doctorBio').textContent = d.bio || '';

  const slots = qs('#doctorSlots'); slots.innerHTML = '';
  d.slots.forEach((s, i)=>{
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'hf-slot';
    chip.textContent = s;
    chip.addEventListener('click', ()=>{
      qsa('.hf-slot', slots).forEach(x=>x.classList.remove('is-selected'));
      chip.classList.add('is-selected');
    });
    slots.appendChild(chip);
  });

  qs('#btnDoctorChat').onclick = ()=> toast(`Chat request sent to ${d.name}.`);
  qs('#btnDoctorBook').onclick = ()=>{
    const pick = qs('.hf-slot.is-selected');
    if(!pick) toast('Choose a slot to continue.');
    else toast(`Booked ${d.name} • ${pick.textContent}`);
  };

  DOCTOR_MODAL.root.classList.add('is-open');
  setTimeout(()=> DOCTOR_MODAL.closeBtn.focus(), 0);
}

function closeDoctor(){
  DOCTOR_MODAL.root.classList.remove('is-open');
  DOCTOR_MODAL.ctx = { hospital:null, doctor:null };
}

/* ------------------ Header Controls ------------------ */
function initTheme(){
  const root = document.documentElement;
  const saved = localStorage.getItem('hf-theme');
  if(saved){
    root.setAttribute('data-theme', saved);
  }else{
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  qs('#themeToggle').addEventListener('click', ()=>{
    const cur = root.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('hf-theme', next);
  });
}

function initDensity(){
  const body = document.body;
  const sel = qs('#densitySelect');
  const saved = localStorage.getItem('hf-density') || 'compact';
  setDensity(saved);
  sel.value = saved;

  sel.addEventListener('change', ()=>{
    setDensity(sel.value);
    localStorage.setItem('hf-density', sel.value);
  });

  function setDensity(v){
    body.classList.remove('density-compact','density-tight','density-comfortable');
    if(v === 'compact') body.classList.add('density-compact');
    else if(v === 'tight') body.classList.add('density-tight');
    else body.classList.add('density-comfortable');
  }
}

/* ------------------ Filters & Search ------------------ */
function initFilters(){
  const search = qs('#searchInput');
  const citySel = qs('#cityFilter');
  const specSel = qs('#specialtyFilter');
  const chips = qsa('.chip');

  // Chips
  chips.forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const key = chip.dataset.filter || '';
      // toggle
      if(STATE.tag === key){
        STATE.tag = '';
        chips.forEach(c=>c.classList.remove('is-active'));
      }else{
        STATE.tag = key;
        chips.forEach(c=>c.classList.toggle('is-active', c===chip));
      }
      applyFilters();
    });
  });

  // City & Specialty
  citySel.addEventListener('change', ()=>{
    STATE.city = citySel.value || '';
    applyFilters();
  });
  specSel.addEventListener('change', ()=>{
    STATE.specialty = specSel.value || '';
    applyFilters();
  });

  // Search
  const onQuery = debounce(()=>{
    STATE.query = search.value;
    applyFilters();
  }, 220);
  search.addEventListener('input', onQuery);
}

/* ------------------ FABs ------------------ */
function initFABs(){
  const wa = qs('#fabWA');
  const sup = qs('#fabSupport');

  const txt = encodeURIComponent('Hi HealthFlo, I need help with a treatment package.');
  wa.href = `https://wa.me/?text=${txt}`;
  sup.addEventListener('click', ()=> toast('Support will reach out on chat shortly.'));
}

/* ------------------ Boot ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Prepare data
  STATE.hospitals = buildHospitals();
  STATE.filtered  = STATE.hospitals.slice();

  // Render grid
  renderGrid(STATE.filtered);

  // Bind UI
  bindModalGlobal();
  bindDoctorGlobal();
  initTheme();
  initDensity();
  initFilters();
  initFABs();

  // Open hospital if hash present
  const hash = location.hash.slice(1);
  if(hash){
    const found = STATE.hospitals.find(h=>h.id===hash);
    if(found){ setTimeout(()=> openHospital(found.id), 300); }
  }
});
