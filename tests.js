/* =========================================================
   HealthFlo — Home Lab Tests
   Fixed & Validated JS (cards now render)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------------
     Utilities
  --------------------------------*/
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const fmtINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  const deg2rad = d => d * (Math.PI/180);
  const haversineKm = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = deg2rad(b.lat - a.lat);
    const dLon = deg2rad(b.lng - a.lng);
    const lat1 = deg2rad(a.lat);
    const lat2 = deg2rad(b.lat);
    const h = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLon/2) ** 2);
    return R * (2 * Math.asin(Math.sqrt(h)));
  };

  const toast = (msg, ms=2200) => {
    const t = qs('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-show');
    setTimeout(() => t.classList.remove('is-show'), ms);
  };

  /* -------------------------------
     Theme (default = light)
  --------------------------------*/
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

  /* -------------------------------
     Pleasant click sound + Ripple + Zoom
  --------------------------------*/
  const Sound = (() => {
    let ctx;
    const ensure = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
    const tap = () => {
      try {
        const ac = ensure();
        const now = ac.currentTime;

        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const noise = ac.createBufferSource();
        const nbuf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
        const data = nbuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.28, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        noise.buffer = nbuf;

        osc.connect(gain);
        noise.connect(gain);
        gain.connect(ac.destination);

        osc.start(now);
        noise.start(now + 0.004);
        osc.stop(now + 0.16);
        noise.stop(now + 0.12);
      } catch {}
    };
    return { tap };
  })();

  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.btn, .ripple, .pressable');
    if (!el) return;
    Sound.tap();

    // Zoom pulse
    el.classList.remove('press-zoom');
    void el.offsetWidth;
    el.classList.add('press-zoom');

    // Ripple
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'md-ripple';
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

  /* -------------------------------
     Data
  --------------------------------*/
  // (City coords reserved for future)
  const cityCoords = {
    Mumbai:{lat:19.076,lng:72.8777}, Delhi:{lat:28.6139,lng:77.2090},
    Bengaluru:{lat:12.9716,lng:77.5946}, Hyderabad:{lat:17.3850,lng:78.4867},
    Chennai:{lat:13.0827,lng:80.2707}, Pune:{lat:18.5204,lng:73.8567},
    Kolkata:{lat:22.5726,lng:88.3639}, Ahmedabad:{lat:23.0225,lng:72.5714},
    Jaipur:{lat:26.9124,lng:75.7873}, Lucknow:{lat:26.8467,lng:80.9462},
    Chandigarh:{lat:30.7333,lng:76.7794}, Indore:{lat:22.7196,lng:75.8577},
    Kochi:{lat:9.9312,lng:76.2673}, Surat:{lat:21.1702,lng:72.8311},
    Noida:{lat:28.5355,lng:77.3910}
  };

  const baseBlood = [
    { name: 'Complete Blood Count (CBC)', price: 350 },
    { name: 'Fasting Blood Sugar (FBS)', price: 180 },
    { name: 'Post-Prandial Blood Sugar (PPBS)', price: 200 },
    { name: 'HbA1c', price: 520 },
    { name: 'Lipid Profile', price: 900 },
    { name: 'Liver Function Test (LFT)', price: 950 },
    { name: 'Kidney Function Test (KFT)', price: 900 },
    { name: 'Vitamin D (25-OH)', price: 1200 },
    { name: 'Thyroid Profile (T3/T4/TSH)', price: 650 },
    { name: 'C-Reactive Protein (CRP)', price: 550 },
    { name: 'Urine Routine', price: 180 }
  ];
  const baseRad = [
    { name: 'X-Ray Chest PA', price: 450 },
    { name: 'Ultrasound Whole Abdomen', price: 1400 },
    { name: 'CT Brain (Plain)', price: 2500 },
    { name: 'MRI Knee', price: 5200 },
    { name: 'ECG', price: 300 },
    { name: '2D Echo', price: 1800 }
  ];
  const img = () =>
    `https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&auto=format&fit=crop&w=1200&h=675&crop=faces,edges`;

  const labs = [
    { id:'lab01', name:'Apollo Diagnostics', city:'Mumbai', area:'Andheri', lat:19.118, lng:72.846, phone:'+912241234567', homeVisit:true, homeFee:129, img:img() },
    { id:'lab02', name:'Thyrocare Centre', city:'Mumbai', area:'Powai', lat:19.118, lng:72.905, phone:'+912242345678', homeVisit:true, homeFee:99, img:img() },
    { id:'lab03', name:'SRL Diagnostics', city:'Delhi', area:'Dwarka', lat:28.592, lng:77.046, phone:'+911145678901', homeVisit:true, homeFee:149, img:img() },
    { id:'lab04', name:'Metropolis Lab', city:'Delhi', area:'Preet Vihar', lat:28.636, lng:77.289, phone:'+911123456789', homeVisit:true, homeFee:129, img:img() },
    { id:'lab05', name:'Dr. Lal PathLabs', city:'Bengaluru', area:'Jayanagar', lat:12.925, lng:77.593, phone:'+918023456701', homeVisit:true, homeFee:119, img:img() },
    { id:'lab06', name:'Vijaya Diagnostics', city:'Hyderabad', area:'Banjara Hills', lat:17.416, lng:78.448, phone:'+914040123456', homeVisit:true, homeFee:129, img:img() },
    { id:'lab07', name:'Aster Labs', city:'Bengaluru', area:'Whitefield', lat:12.969, lng:77.749, phone:'+918022223333', homeVisit:true, homeFee:149, img:img() },
    { id:'lab08', name:'Hitech Diagnostics', city:'Chennai', area:'T. Nagar', lat:13.041, lng:80.234, phone:'+914428765432', homeVisit:true, homeFee:109, img:img() },
    { id:'lab09', name:'Kokilaben Ambani Lab', city:'Mumbai', area:'Four Bungalows', lat:19.134, lng:72.833, phone:'+912261111111', homeVisit:false, homeFee:0, img:img() },
    { id:'lab10', name:'Max Lab', city:'Delhi', area:'Saket', lat:28.528, lng:77.219, phone:'+911149876543', homeVisit:true, homeFee:159, img:img() },
    // FIXED: removed malformed "homeVisit(false){...}" and kept a single valid property
    { id:'lab11', name:'Fortis Lab', city:'Noida', area:'Sector 62', lat:28.620, lng:77.363, phone:'+911202223344', homeVisit:true, homeFee:149, img:img() },
    { id:'lab12', name:'Medall Diagnostics', city:'Chennai', area:'Adyar', lat:13.006, lng:80.257, phone:'+914443211234', homeVisit:true, homeFee:119, img:img() },
    { id:'lab13', name:'Suburban Diagnostics', city:'Pune', area:'Aundh', lat:18.563, lng:73.807, phone:'+912040987654', homeVisit:true, homeFee:139, img:img() },
    { id:'lab14', name:'Oncquest Labs', city:'Jaipur', area:'C-Scheme', lat:26.913, lng:75.789, phone:'+911414567890', homeVisit:true, homeFee:149, img:img() },
    { id:'lab15', name:'Redcliffe Labs', city:'Lucknow', area:'Gomti Nagar', lat:26.853, lng:81.003, phone:'+915224567890', homeVisit:true, homeFee:119, img:img() },
    { id:'lab16', name:'Healthians', city:'Gurugram', area:'DLF Phase 3', lat:28.494, lng:77.097, phone:'+911244567890', homeVisit:true, homeFee:99, img:img() },
    { id:'lab17', name:'Diagno Labs', city:'Ahmedabad', area:'Navrangpura', lat:23.036, lng:72.558, phone:'+917926543210', homeVisit:true, homeFee:129, img:img() },
    { id:'lab18', name:'Aarthi Scans & Labs', city:'Kochi', area:'Vytilla', lat:9.967, lng:76.318, phone:'+914844445555', homeVisit:true, homeFee:109, img:img() }
  ].map((lab, idx) => {
    const mul = 0.92 + (idx % 5) * 0.03;
    lab.blood = baseBlood.map(t => ({ ...t, price: Math.round(t.price * mul) }));
    lab.radiology = baseRad.map(t => ({ ...t, price: Math.round(t.price * (1.0 + (idx % 4) * 0.05)) }));
    lab.about = `${lab.name} offers NABL-grade diagnostics with accurate reporting and friendly staff. Home collection ${lab.homeVisit ? 'available' : 'not available'}.`;
    return lab;
  });

  /* -------------------------------
     State
  --------------------------------*/
  let userLoc = null;
  let selections = {};
  const getSel = (labId) => (selections[labId] ||= { blood: new Set(), rad: new Set(), bloodHome: false });

  const profileKey = 'hf_profile';
  const loadProfile = () => { try { return JSON.parse(localStorage.getItem(profileKey)) || {}; } catch { return {}; } };
  const saveProfile = (p) => localStorage.setItem(profileKey, JSON.stringify(p));

  /* -------------------------------
     Elements
  --------------------------------*/
  const elGrid = qs('#labGrid');
  const tplCard = qs('#tpl-lab-card');
  const tplRow = qs('#tpl-test-row');

  const elSearch = qs('#searchInput');
  const elCity = qs('#cityFilter');
  const elType = qs('#typeFilter');
  const elHomeOnly = qs('#homeOnly');
  const elNearest = qs('#nearestToggle');
  const elLocate = qs('#btnLocate');
  const elSortHint = qs('#sortHint');
  const elKLabs = qs('#kLabs');

  // Modal elements
  const modal = qs('#labModal');
  const labClose = qs('#labClose');
  const labLogo = qs('#labLogo');
  const labTitle = qs('#labTitle');
  const labAreaTxt = qs('#labAreaTxt');
  const labHome = qs('#labHome');
  const labDistance = qs('#labDistance');
  const labCounts = qs('#labCounts');
  const labMap = qs('#labMap');
  const labCallBtn = qs('#labCallBtn');
  const labWABtn = qs('#labWABtn');
  const labAbout = qs('#labAbout');
  const labContact = qs('#labContact');

  // Tabs/panels
  const tabsWrap = qs('.tabs');
  const tabs = tabsWrap ? qsa('.tab', tabsWrap) : [];
  const panelBlood = qs('#panel-blood');
  const panelRad = qs('#panel-rad');
  const panelBook = qs('#panel-book');
  const panelAbout = qs('#panel-about');

  // Blood controls
  const bloodList = qs('#bloodList');
  const bloodSearch = qs('#bloodSearch');
  const bloodHomeToggle = qs('#bloodHomeToggle');
  const homeFeeTxt = qs('#homeFee');
  const btnBloodClear = qs('#btnBloodClear');
  const btnBloodWA = qs('#btnBloodWA');
  const bloodCount = qs('#bloodCount');
  const bloodTotal = qs('#bloodTotal');

  // Radiology controls
  const radList = qs('#radList');
  const radSearch = qs('#radSearch');
  const btnRadClear = qs('#btnRadClear'); // FIXED name
  const btnRadWA = qs('#btnRadWA');
  const radCount = qs('#radCount');
  const radTotal = qs('#radTotal');

  // Booking
  const modeVisit = qs('#modeVisit');
  const modeHome = qs('#modeHome');
  const modeHomeWrap = qs('#modeHomeWrap');
  const bookDate = qs('#bookDate');
  const bookTime = qs('#bookTime');
  const bookName = qs('#bookName');
  const bookPhone = qs('#bookPhone');
  const btnUseProfile = qs('#btnUseProfile');
  const bookSummary = qs('#bookSummary');
  const bookTotal = qs('#bookTotal');
  const btnBookConfirm = qs('#btnBookConfirm');

  // Inline profile
  const profileName = qs('#profileName');
  const profilePhone = qs('#profilePhone');
  const profileCity = qs('#profileCity');
  const profileSort = qs('#profileSort');
  const profileSave = qs('#profileSave');
  const profileClear = qs('#profileClear');

  /* -------------------------------
     Build cards grid
  --------------------------------*/
  function computeDistances() {
    if (!userLoc) {
      labs.forEach(l => l.distanceKm = null);
      return;
    }
    labs.forEach(l => {
      l.distanceKm = Number(haversineKm(userLoc, { lat: l.lat, lng: l.lng }).toFixed(1));
    });
  }

  function cardNode(lab) {
    const node = tplCard.content.firstElementChild.cloneNode(true);
    const imgEl = qs('img', node);
    const distEl = qs('.distance', node);
    const titleEl = qs('.title', node);
    const subEl = qs('.sub', node);
    const badgesEl = qs('.badges', node);
    const btnView = qs('.btn-view', node);
    const btnDir = qs('.btn-dir', node);
    const btnCall = qs('.btn-call', node);

    imgEl.src = lab.img;
    imgEl.alt = `${lab.name} — ${lab.area}, ${lab.city}`;
    titleEl.textContent = lab.name;
    subEl.textContent = `${lab.area} • ${lab.city}`;
    badgesEl.innerHTML = '';
    [
      lab.homeVisit ? 'Home visit' : 'In-lab only',
      `${lab.blood.length} blood`,
      `${lab.radiology.length} radiology`
    ].forEach(t => {
      const s = document.createElement('span');
      s.className = 'pill';
      s.textContent = t;
      badgesEl.appendChild(s);
    });

    distEl.textContent = lab.distanceKm != null ? `${lab.distanceKm} km` : '— km';
    btnDir.href = `https://www.google.com/maps?q=${encodeURIComponent(lab.name)}@${lab.lat},${lab.lng}`;
    btnCall.href = `tel:${lab.phone}`;

    const openIt = () => openModal(lab);
    node.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) return;
      openIt();
    });
    btnView.addEventListener('click', openIt);

    return node;
  }

  function filterLabs() {
    const q = (elSearch.value || '').trim().toLowerCase();
    const city = elCity.value;
    const type = elType.value;
    const homeOnly = elHomeOnly.checked;

    let out = labs.filter(l => {
      if (city && l.city !== city) return false;
      if (homeOnly && !l.homeVisit) return false;
      if (type === 'blood' && (!l.blood || !l.blood.length)) return false;
      if (type === 'radiology' && (!l.radiology || !l.radiology.length)) return false;
      if (q) {
        const inLab = [l.name, l.area, l.city].join(' ').toLowerCase().includes(q);
        const inTests = l.blood.some(t => t.name.toLowerCase().includes(q)) ||
                        l.radiology.some(t => t.name.toLowerCase().includes(q));
        if (!inLab && !inTests) return false;
      }
      return true;
    });

    if (elNearest.checked && userLoc) {
      out.sort((a,b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
      elSortHint.textContent = 'Sorted by nearest — using your current location.';
    } else {
      out.sort((a,b) => a.name.localeCompare(b.name));
      elSortHint.textContent = 'Sorted A–Z.';
    }
    return out;
  }

  function renderGrid() {
    computeDistances();
    const list = filterLabs();
    elGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach(l => frag.appendChild(cardNode(l)));
    elGrid.appendChild(frag);
    const k = qs('#kLabs');
    if (k) k.textContent = String(list.length);
  }

  /* -------------------------------
     Geolocation
  --------------------------------*/
  elLocate?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      toast('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        toast('Location set!');
        renderGrid();
      },
      () => { toast('Unable to get location.'); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });

  /* -------------------------------
     Modal
  --------------------------------*/
  let currentLab = null;

  function openModal(lab) {
    currentLab = lab;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    fillModal(lab);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    currentLab = null;
  }

  labClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  // Tabs
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('is-active'));
    t.classList.add('is-active');
    const tab = t.dataset.tab;
    [panelBlood, panelRad, panelBook, panelAbout].forEach(p => p.classList.remove('is-active'));
    if (tab === 'blood') panelBlood.classList.add('is-active');
    if (tab === 'radiology') panelRad.classList.add('is-active');
    if (tab === 'book') panelBook.classList.add('is-active');
    if (tab === 'about') panelAbout.classList.add('is-active');
  }));

  function fillModal(lab) {
    labLogo.src = lab.img;
    labLogo.alt = lab.name;
    labTitle.textContent = lab.name;
    labAreaTxt.textContent = `${lab.city}, ${lab.area}`;
    labHome.textContent = `Home visit • ${lab.homeVisit ? 'Yes' : 'No'}` + (lab.homeVisit ? ` (Fee ${fmtINR(lab.homeFee)})` : '');
    labDistance.textContent = lab.distanceKm != null ? `${lab.distanceKm} km` : '— km';
    labCounts.textContent = `${lab.blood.length} blood • ${lab.radiology.length} radiology`;
    labMap.href = `https://www.google.com/maps?q=${encodeURIComponent(lab.name)}@${lab.lat},${lab.lng}`;
    labCallBtn.href = `tel:${lab.phone}`;
    labWABtn.href = `https://wa.me/?text=${encodeURIComponent(`Hi, I’d like to enquire at ${lab.name} (${lab.area}, ${lab.city}).`)}`;
    labAbout.textContent = lab.about;
    labContact.textContent = `Phone: ${lab.phone}`;

    modeHomeWrap.style.display = lab.homeVisit ? '' : 'none';
    const sel = getSel(lab.id);
    bloodHomeToggle.checked = !!sel.bloodHome && lab.homeVisit;
    bloodHomeToggle.disabled = !lab.homeVisit;
    homeFeeTxt.textContent = lab.homeVisit ? `Home fee: ${fmtINR(lab.homeFee)}` : 'Home collection not available';

    buildTests(lab, 'blood');
    buildTests(lab, 'radiology');
    recalcTotals();
    updateBookingSummary();

    tabs.forEach(b => b.classList.remove('is-active'));
    if (tabs[0]) tabs[0].classList.add('is-active');
    [panelBlood, panelRad, panelBook, panelAbout].forEach(p => p.classList.remove('is-active'));
    panelBlood.classList.add('is-active');

    const now = new Date();
    const t = new Date(now.getTime() + 45 * 60000);
    const pad = n => String(n).padStart(2,'0');
    bookDate.value = `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`;
    const mins = Math.ceil(t.getMinutes()/15)*15;
    const tt = new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), mins);
    bookTime.value = `${pad(tt.getHours())}:${pad(tt.getMinutes())}`;
  }

  function buildTests(lab, kind) {
    const isBlood = kind === 'blood';
    const listEl = isBlood ? bloodList : radList;
    const sel = getSel(lab.id)[isBlood ? 'blood' : 'rad'];
    const tests = lab[kind];

    listEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    tests.forEach(t => {
      const row = tplRow.content.firstElementChild.cloneNode(true);
      const check = qs('.pick', row);
      const nameEl = qs('.tname', row);
      const priceEl = qs('.price', row);

      nameEl.textContent = t.name;
      priceEl.textContent = fmtINR(t.price);
      check.checked = sel.has(t.name);

      check.addEventListener('change', () => {
        if (check.checked) sel.add(t.name);
        else sel.delete(t.name);
        recalcTotals();
        updateBookingSummary();
      });

      frag.appendChild(row);
    });
    listEl.appendChild(frag);
  }

  const filterTests = (listEl, q) => {
    q = (q || '').trim().toLowerCase();
    qsa('.test', listEl).forEach(row => {
      const name = qs('.tname', row).textContent.toLowerCase();
      row.style.display = name.includes(q) ? '' : 'none';
    });
  };
  bloodSearch?.addEventListener('input', () => filterTests(bloodList, bloodSearch.value));
  radSearch?.addEventListener('input', () => filterTests(radList, radSearch.value));

  bloodHomeToggle?.addEventListener('change', () => {
    if (!currentLab) return;
    getSel(currentLab.id).bloodHome = !!bloodHomeToggle.checked;
    recalcTotals();
    updateBookingSummary();
  });

  btnBloodClear?.addEventListener('click', () => {
    if (!currentLab) return;
    getSel(currentLab.id).blood.clear();
    qsa('.pick', bloodList).forEach(c => (c.checked = false));
    recalcTotals();
    updateBookingSummary();
  });
  btnRadClear?.addEventListener('click', () => {
    if (!currentLab) return;
    getSel(currentLab.id).rad.clear();
    qsa('.pick', radList).forEach(c => (c.checked = false));
    recalcTotals();
    updateBookingSummary();
  });

  btnBloodWA?.addEventListener('click', () => {
    if (!currentLab) return;
    const sel = getSel(currentLab.id);
    const picks = currentLab.blood.filter(t => sel.blood.has(t.name));
    if (!picks.length) { toast('Select blood tests first.'); return; }
    const sum = picks.reduce((a,t) => a + t.price, 0) + (sel.bloodHome ? currentLab.homeFee : 0);
    const lines = [
      `Blood tests enquiry — ${currentLab.name} (${currentLab.area}, ${currentLab.city})`,
      `Selected (${picks.length}):`,
      ...picks.map(t => `• ${t.name} — ${fmtINR(t.price)}`),
      sel.bloodHome ? `Home collection fee — ${fmtINR(currentLab.homeFee)}` : '',
      `Total — ${fmtINR(sum)}`
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
  });
  btnRadWA?.addEventListener('click', () => {
    if (!currentLab) return;
    const sel = getSel(currentLab.id);
    const picks = currentLab.radiology.filter(t => sel.rad.has(t.name));
    if (!picks.length) { toast('Select radiology tests first.'); return; }
    const sum = picks.reduce((a,t) => a + t.price, 0);
    const lines = [
      `Radiology enquiry — ${currentLab.name} (${currentLab.area}, ${currentLab.city})`,
      `Selected (${picks.length}):`,
      ...picks.map(t => `• ${t.name} — ${fmtINR(t.price)}`),
      `Total — ${fmtINR(sum)}`,
      `Note: Please visit lab for radiology.`
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
  });

  function recalcTotals() {
    if (!currentLab) return;
    const sel = getSel(currentLab.id);
    const bloodSel = currentLab.blood.filter(t => sel.blood.has(t.name));
    const radSel   = currentLab.radiology.filter(t => sel.rad.has(t.name));
    const bSum = bloodSel.reduce((a,t)=>a+t.price,0) + (sel.bloodHome ? (currentLab.homeFee||0) : 0);
    const rSum = radSel.reduce((a,t)=>a+t.price,0);
    qs('#bloodCount').textContent = String(bloodSel.length);
    qs('#bloodTotal').textContent = fmtINR(bSum);
    qs('#radCount').textContent = String(radSel.length);
    qs('#radTotal').textContent = fmtINR(rSum);
  }

  function updateBookingSummary() {
    if (!currentLab) return;
    const sel = getSel(currentLab.id);
    const bPicks = currentLab.blood.filter(t => sel.blood.has(t.name));
    const rPicks = currentLab.radiology.filter(t => sel.rad.has(t.name));
    const bSum = bPicks.reduce((a,t)=>a+t.price,0) + (sel.bloodHome ? (currentLab.homeFee||0) : 0);
    const rSum = rPicks.reduce((a,t)=>a+t.price,0);
    const tot  = bSum + rSum;

    const lines = [];
    if (!bPicks.length && !rPicks.length) {
      qs('#bookSummary').textContent = 'No tests selected yet.';
    } else {
      if (bPicks.length) {
        lines.push(`Blood (${bPicks.length}):`);
        bPicks.forEach(t => lines.push(`• ${t.name} — ${fmtINR(t.price)}`));
        if (sel.bloodHome) lines.push(`• Home fee — ${fmtINR(currentLab.homeFee)}`);
      }
      if (rPicks.length) {
        lines.push(`Radiology (${rPicks.length}):`);
        rPicks.forEach(t => lines.push(`• ${t.name} — ${fmtINR(t.price)}`));
      }
      qs('#bookSummary').textContent = lines.join('\n');
    }
    qs('#bookTotal').textContent = fmtINR(tot);
  }

  // Profile
  const prof = loadProfile();
  profileName.value = prof.name || '';
  profilePhone.value = prof.phone || '';
  profileCity.value = prof.city || '';
  profileSort.value = prof.sort || 'nearest';

  qs('#btnUseProfile')?.addEventListener('click', () => {
    qs('#bookName').value = profileName.value || '';
    qs('#bookPhone').value = profilePhone.value || '';
    toast('Copied default profile to booking.');
  });

  profileSave?.addEventListener('click', () => {
    const p = {
      name: profileName.value.trim(),
      phone: profilePhone.value.trim(),
      city: profileCity.value,
      sort: profileSort.value
    };
    saveProfile(p);
    toast('Profile saved.');
  });
  profileClear?.addEventListener('click', () => {
    profileName.value = '';
    profilePhone.value = '';
    profileCity.value = '';
    profileSort.value = 'nearest';
    saveProfile({});
    toast('Profile cleared.');
  });

  qs('#btnBookConfirm')?.addEventListener('click', () => {
    if (!currentLab) return;
    const sel = getSel(currentLab.id);
    const name = (qs('#bookName').value || '').trim();
    const phone = (qs('#bookPhone').value || '').trim();
    const date = qs('#bookDate').value;
    const time = qs('#bookTime').value;

    const phoneOk = /^[6-9]\d{9}$/.test(phone);
    if (!name) { toast('Enter your name'); return; }
    if (!phoneOk) { toast('Enter a valid 10-digit mobile'); return; }

    const picksB = currentLab.blood.filter(t => sel.blood.has(t.name));
    const picksR = currentLab.radiology.filter(t => sel.rad.has(t.name));
    if (!picksB.length && !picksR.length) { toast('Select at least one test'); return; }
    if (!date || !time) { toast('Choose date & time'); return; }

    const tot = parseInt(qs('#bookTotal').textContent.replace(/[^\d]/g,'')) || 0;

    const lines = [
      `*Lab booking request*`,
      `${currentLab.name} — ${currentLab.area}, ${currentLab.city}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Mode: ${qs('#modeHome').checked ? 'Home visit' : 'Visit lab'}`,
      `Slot: ${date} ${time}`,
      '',
      picksB.length ? `Blood (${picksB.length}):\n${picksB.map(t => `• ${t.name} — ${fmtINR(t.price)}`).join('\n')}${sel.bloodHome ? `\n• Home fee — ${fmtINR(currentLab.homeFee)}` : ''}` : '',
      picksR.length ? `Radiology (${picksR.length}):\n${picksR.map(t => `• ${t.name} — ${fmtINR(t.price)}`).join('\n')}` : '',
      '',
      `Total: ${fmtINR(tot)}`
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
    toast('Opening WhatsApp…');
  });

  [qs('#modeVisit'), qs('#modeHome')].forEach(r => r?.addEventListener('change', updateBookingSummary));

  /* -------------------------------
     Filters / Search
  --------------------------------*/
  [elSearch, elCity, elType].forEach(el => el?.addEventListener('input', renderGrid));
  elHomeOnly?.addEventListener('change', renderGrid);
  elNearest?.addEventListener('change', renderGrid);

  const profCity = (loadProfile().city || '').trim();
  const profSort = (loadProfile().sort || '').trim();
  if (profCity && elCity) elCity.value = profCity;
  if (profSort && profSort !== 'nearest') elNearest.checked = false;

  /* -------------------------------
     Initial render
  --------------------------------*/
  renderGrid();
});
