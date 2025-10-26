/* =========================================================
   HealthFlo — Medicines (Glass / Pastel Blue / Android vibe)
   meds.js — FIXED for your current HTML/CSS
   - Injects figure/img into med cards
   - Aligns IDs: medTitle / medNow / medMrp / medOff / medDesc
   - Removes references to missing nodes
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------------------
     Utilities
  --------------------------------------- */
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const fmtRs = (n) => '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const nowIso = () => new Date().toISOString();

  const deg2rad = d => d * (Math.PI/180);
  const haversineKm = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = deg2rad(b.lat - a.lat);
    const dLon = deg2rad(b.lng - a.lng);
    const lat1 = deg2rad(a.lat);
    const lat2 = deg2rad(b.lat);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*(Math.sin(dLon/2)**2);
    return R * (2 * Math.asin(Math.sqrt(h)));
  };

  const toast = (msg, ms=2200) => {
    const t = qs('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-show');
    setTimeout(() => t.classList.remove('is-show'), ms);
  };

  /* ---------------------------------------
     Theme toggle (default = light)
  --------------------------------------- */
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

  /* ---------------------------------------
     Soft glass click "pop"
  --------------------------------------- */
  const ClickSound = (() => {
    let ctx, master;
    const ensure = () => {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.35;
        master.connect(ctx.destination);
      }
      return ctx;
    };
    const pop = () => {
      try {
        const ac = ensure();
        const t0 = ac.currentTime;

        const o1 = ac.createOscillator();
        const g1 = ac.createGain();
        o1.type = 'sine';
        o1.frequency.setValueAtTime(320, t0);
        o1.frequency.exponentialRampToValueAtTime(540, t0 + 0.06);
        g1.gain.setValueAtTime(0.0001, t0);
        g1.gain.exponentialRampToValueAtTime(0.25, t0 + 0.012);
        g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
        o1.connect(g1).connect(master);
        o1.start(t0); o1.stop(t0 + 0.14);

        const o2 = ac.createOscillator();
        const g2 = ac.createGain();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(760, t0 + 0.005);
        o2.frequency.exponentialRampToValueAtTime(960, t0 + 0.07);
        g2.gain.setValueAtTime(0.0001, t0 + 0.005);
        g2.gain.exponentialRampToValueAtTime(0.12, t0 + 0.016);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
        o2.connect(g2).connect(master);
        o2.start(t0 + 0.005); o2.stop(t0 + 0.12);

        const nbuf = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate);
        const ch = nbuf.getChannelData(0);
        for (let i=0;i<ch.length;i++) ch[i] = (Math.random()*2-1) * (1 - i/ch.length) * 0.5;
        const noise = ac.createBufferSource();
        const ng = ac.createGain();
        ng.gain.value = 0.12;
        noise.buffer = nbuf;
        noise.connect(ng).connect(master);
        noise.start(t0); noise.stop(t0 + 0.04);
      } catch {}
    };
    return { pop };
  })();
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.btn, .ripple, .pressable')) ClickSound.pop();
  });

  /* ---------------------------------------
     Elements
  --------------------------------------- */
  const elMedGrid = qs("#medGrid");
  const elStoreGrid = qs("#storeGrid");
  const tplMed = qs("#tpl-med-card");
  const tplStore = qs("#tpl-store-card");

  // Filters
  const elSearch = qs("#searchInput");
  const elCond = qs("#conditionFilter");
  const elForm = qs("#formFilter");

  // Quick category chips
  qsa('#quickCats .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      elSearch.value = chip.dataset.q || '';
      renderMeds();
      window.scrollTo({ top: elMedGrid.offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Store filters
  const elDeliveryOnly = qs("#deliveryOnly");
  const elNearestToggle = qs("#nearestToggle");
  const elLocate = qs("#btnLocate");
  const elSortHint = qs("#sortHint");

  // KPIs
  const kMeds = qs("#kMeds");
  const kStores = qs("#kStores");

  // Med modal — IDs ALIGNED TO HTML
  const medModal      = qs("#medModal");
  const medClose      = qs("#medClose");
  const medGoCart     = qs("#medGoCart");

  const medTitleEl    = qs("#medTitle");      // was medBrandTitle
  const medCond       = qs("#medCond");
  const medFormEl     = qs("#medForm");
  const medRxEl       = qs("#medRx");

  const medImg        = qs("#medImg");

  const medBest       = qs("#medBest");
  const medBest2      = qs("#medBest2");
  const medNow        = qs("#medNow");        // was medPriceNow
  const medMrp        = qs("#medMrp");        // was medMRP
  const medOff        = qs("#medOff");        // was medOffPct

  const qtyMinus      = qs("#qtyMinus");
  const qtyPlus       = qs("#qtyPlus");
  const qtyValEl      = qs("#qtyVal");
  const qtyTxt        = qs("#qtyTxt");
  const medAdd        = qs("#medAdd");

  // returnTxt / expiryDate were removed in HTML → not used
  const deliverBy     = qs("#deliverBy");
  const stockNote     = qs("#stockNote");

  const sameAs        = qs("#sameAs");
  const containsComp  = qs("#containsComp");
  const subsGrid      = qs("#subsGrid");

  const medDesc       = qs("#medDesc");       // was medIntro
  const medMore       = qs("#medMore");

  const unlockAmt     = qs("#unlockAmt");
  const unlockBtn     = qs("#unlockBtn");

  const medSectionsWrap = qs("#medSections");
  const medQuickLinks = qs("#medQuickLinks");
  const medPanelsScroll = qs('.panels', medModal);

  // Store modal
  const storeModal    = qs("#storeModal");
  const storeClose    = qs("#storeClose");
  const storeLogo     = qs("#storeLogo");
  const storeTitle    = qs("#storeTitle");
  const storeAreaTxt  = qs("#storeAreaTxt");
  const storeDeliv    = qs("#storeDeliv");
  const storeDistance = qs("#storeDistance");
  const storeMap      = qs("#storeMap");
  const storeCall     = qs("#storeCall");
  const storeSearch   = qs("#storeSearch");
  const storeOffer    = qs("#storeOffer");
  const storeInv      = qs("#storeInv");
  const storeAbout    = qs("#storeAbout");
  const storeTabs     = qsa(".tabs .tab", qs("#storeModal"));

  // Cart sheet
  const cartOpen  = qs("#cartOpen");
  const cartSheet = qs("#cartSheet");
  const cartClose = qs("#cartClose");
  const selStore  = qs("#selStore");
  const fulPickup = qs("#fulPickup");
  const fulDelivery = qs("#fulDelivery");
  const btnClearCart = qs("#btnClearCart");
  const addrRow   = qs("#addrRow");
  const addrInput = qs("#addr");
  const userPhone = qs("#userPhone");
  const rxDate    = qs("#rxDate");
  const rxHint    = qs("#rxHint");
  const teleNo    = qs("#teleNo");
  const teleYes   = qs("#teleYes");
  const payMode   = qs("#payMode");
  const note      = qs("#note");
  const cartList  = qs("#cartList");
  const sumItems  = qs("#sumItems");
  const sumDeliv  = qs("#sumDeliv");
  const sumDisc   = qs("#sumDisc");
  const sumTotal  = qs("#sumTotal");
  const feeNote   = qs("#feeNote");
  const btnPlaceOrder = qs("#btnPlaceOrder");
  const cartCount = qs("#cartCount");

  // Premium & history & tracker
  const btnPremium = qs("#btnPremium");
  const orderHistoryOpen = qs("#orderHistoryOpen");
  const orderTrackerOpen = qs("#orderTrackerOpen");

  const trackerSheet = qs("#trackerSheet");
  const trackerClose = qs("#trackerClose");
  const trackerWA    = qs("#trackerWA");
  const trackOrderId = qs("#trackOrderId");
  const trackStore   = qs("#trackStore");
  const trackMode    = qs("#trackMode");
  const trackDistance= qs("#trackDistance");
  const trackStatus  = qs("#trackStatus");
  const trackPartner = qs("#trackPartner");
  const etaCountdown = qs("#etaCountdown");
  const trackTimeline= qs("#trackTimeline");
  const miniMap      = qs("#miniMap");
  const btnConfirmReceive = qs("#btnConfirmReceive");
  const btnReportIssue = qs("#btnReportIssue");

  // Issue modal
  const issueModal  = qs("#issueModal");
  const issueClose  = qs("#issueClose");
  const issueType   = qs("#issueType");
  const issueText   = qs("#issueText");
  const issuePhotos = qs("#issuePhotos");
  const issuePreview= qs("#issuePreview");
  const issueSubmit = qs("#issueSubmit");

  // History sheet
  const historySheet = qs("#historySheet");
  const historyClose = qs("#historyClose");
  const historyList  = qs("#historyList");

  /* ---------------------------------------
     State
  --------------------------------------- */
  let userLoc = null; // {lat, lng}
  let currentMed = null;
  let currentStore = null;
  let currentOrderId = localStorage.getItem('hf_current_order') || null;
  let premiumActive = JSON.parse(localStorage.getItem('hf_premium') || 'false');

  const LS_CART = 'hf_cart_v2';
  const LS_ORDERS = 'hf_orders_v2';

  let cart = loadCart();
  let orders = loadOrders();
  updateCartCount();

  /* ---------------------------------------
     Data
  --------------------------------------- */
  const img = (q, w=1200, h=900) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=${w}&h=${h}`;

  const meds = [
    { id:'m001', brand:'Azicip 500mg Tablet 3\'S', generic:'Azithromycin', strength:'500 mg', form:'Tablet', pack:'Strip of 3', cond:'Bacterial Infections', mrp:74.21, off:20, rx:true, img:img('photo-1582719478250-c89cae4dc85b') },
    { id:'m002', brand:'Azithral 500mg Tablet 5\'S', generic:'Azithromycin', strength:'500 mg', form:'Tablet', pack:'Strip of 5', cond:'Bacterial Infections', mrp:125.89, off:12, rx:true, img:img('photo-1582719478250-bb1b7f5e6b41') },
    { id:'m003', brand:'Azee 500mg Tablet 5\'S', generic:'Azithromycin', strength:'500 mg', form:'Tablet', pack:'Strip of 5', cond:'Bacterial Infections', mrp:123.68, off:12, rx:true, img:img('photo-1582719478185-2f0b1e09f4c4') },
    { id:'m004', brand:'Cefixime 200mg 10\'S', generic:'Cefixime', strength:'200 mg', form:'Tablet', pack:'Strip of 10', cond:'Bacterial Infections', mrp:148, off:13, rx:true, img:img('photo-1563213126-a4273aed2016') },
    { id:'m005', brand:'Amoxicillin-Clav 625 DUO 10\'S', generic:'Amoxicillin + Clavulanic Acid', strength:'500/125 mg', form:'Tablet', pack:'Strip of 10', cond:'Bacterial Infections', mrp:195.39, off:12, rx:true, img:img('photo-1612001616408-1e00d0b958e4') },
    { id:'m006', brand:'Metrogyl 400mg Tablet 15\'S', generic:'Metronidazole', strength:'400 mg', form:'Tablet', pack:'Strip of 15', cond:'Bacterial Infections', mrp:34.00, off:12, rx:true, img:img('photo-1586880244406-556ebe35f282') },

    { id:'m101', brand:'Dolo 650', generic:'Paracetamol', strength:'650 mg', form:'Tablet', pack:'Strip of 15', cond:'Pain Relief', mrp:34, off:15, rx:false, img:img('photo-1582719478422-476d3b1b6f2b') },
    { id:'m102', brand:'Crocin Advance', generic:'Paracetamol', strength:'500 mg', form:'Tablet', pack:'Strip of 15', cond:'Pain Relief', mrp:30, off:13, rx:false, img:img('photo-1584367369853-8f9b2b2ee9e8') },
    { id:'m103', brand:'Brufen 400', generic:'Ibuprofen', strength:'400 mg', form:'Tablet', pack:'Strip of 15', cond:'Pain Relief', mrp:48, off:13, rx:false, img:img('photo-1550534791-2677533605a1') },
    { id:'m104', brand:'Voveran SR 100', generic:'Diclofenac', strength:'100 mg', form:'Tablet', pack:'Strip of 10', cond:'Pain Relief', mrp:86, off:10, rx:true, img:img('photo-1582719478185-dfe7b3f4e921') },

    { id:'m201', brand:'Glycomet 500 SR', generic:'Metformin', strength:'500 mg', form:'Tablet', pack:'Strip of 10', cond:'Diabetes', mrp:41, off:10, rx:true, img:img('photo-1582719478347-c63a6b4ac5a0') },
    { id:'m202', brand:'Jardiance 10mg', generic:'Empagliflozin', strength:'10 mg', form:'Tablet', pack:'Strip of 10', cond:'Diabetes', mrp:596, off:8, rx:true, img:img('photo-1598986646512-6b5c8df1d440') },
    { id:'m203', brand:'Human Mixtard 30/70', generic:'Insulin (Isophane/Regular)', strength:'100 IU', form:'Injection', pack:'Vial 10 ml', cond:'Diabetes', mrp:172, off:5, rx:true, img:img('photo-1579154204601-01588f351e67') },

    { id:'m301', brand:'Atorva 10', generic:'Atorvastatin', strength:'10 mg', form:'Tablet', pack:'Strip of 15', cond:'High Cholesterol', mrp:79, off:10, rx:true, img:img('photo-1582719478450-4a1cbb94d3db') },

    { id:'m401', brand:'Foracort Inhaler 200', generic:'Formoterol + Budesonide', strength:'200 mcg', form:'Inhaler', pack:'1 unit', cond:'Asthma Copd', mrp:432, off:12, rx:true, img:img('photo-1559027615-5f25f7f0e2bd') },
    { id:'m402', brand:'Levolin 50mcg', generic:'Levosalbutamol', strength:'50 mcg', form:'Inhaler', pack:'1 unit', cond:'Asthma Copd', mrp:160, off:10, rx:true, img:img('photo-1556711905-4bd2a66b8692') },

    { id:'m501', brand:'Neurobion Forte', generic:'B1+B6+B12', strength:'—', form:'Tablet', pack:'Strip of 30', cond:'Vitamins', mrp:38, off:8, rx:false, img:img('photo-1586015555751-63b403d59b1f') },
    { id:'m502', brand:'Shelcal 500', generic:'Calcium + Vitamin D3', strength:'—', form:'Tablet', pack:'Strip of 15', cond:'Supplements', mrp:110, off:10, rx:false, img:img('photo-1612874746535-c81d6dc7463a') },
    { id:'m503', brand:'Feronia XT', generic:'Ferrous Ascorbate + Folic Acid', strength:'—', form:'Tablet', pack:'Strip of 10', cond:'Supplements', mrp:172, off:12, rx:false, img:img('photo-1604503468506-3df5bb7a64b8') },

    { id:'m601', brand:'Pan D', generic:'Pantoprazole + Domperidone', strength:'—', form:'Capsule', pack:'Strip of 15', cond:'Ulcer Reflux Flatulence', mrp:198, off:12, rx:true, img:img('photo-1600971987331-3a2d3d369f9a') },
    { id:'m602', brand:'Omeprazole 20mg', generic:'Omeprazole', strength:'20 mg', form:'Capsule', pack:'Strip of 15', cond:'Ulcer Reflux Flatulence', mrp:78, off:10, rx:false, img:img('photo-1544989164-31dc3c645987') },

    { id:'m701', brand:'Cetirizine 10mg', generic:'Cetirizine', strength:'10 mg', form:'Tablet', pack:'Strip of 10', cond:'Allergies', mrp:18, off:5, rx:false, img:img('photo-1615631972426-2a1a996a96f2') },
    { id:'m702', brand:'Montair LC', generic:'Montelukast + Levocetirizine', strength:'—', form:'Tablet', pack:'Strip of 10', cond:'Allergies', mrp:185, off:10, rx:true, img:img('photo-1516826957135-700dedea6984') },

    { id:'m703', brand:'ORS Powder', generic:'Sodium Chloride + Dextrose', strength:'—', form:'Sachet', pack:'4 x 21g', cond:'General', mrp:32, off:0, rx:false, img:img('photo-1556905055-8f358a7a47b2') },
    { id:'m704', brand:'Becosules', generic:'B-Complex with Vitamin C', strength:'—', form:'Capsule', pack:'Strip of 20', cond:'Vitamins', mrp:54, off:10, rx:false, img:img('photo-1584017911766-d451b3d1f53b') },
    { id:'m705', brand:'Calpol 250 Suspension', generic:'Paracetamol', strength:'250 mg/5ml', form:'Syrup', pack:'60 ml bottle', cond:'Fever', mrp:28, off:5, rx:false, img:img('photo-1553531888-42764ef8c5fd') },
  ];

  const stores = [
    { id:'s001', name:'Apollo Hospitals Pharmacy',   city:'Delhi', area:'Saket', lat:28.528, lng:77.219, phone:'+911149876543', delivery:true, pickup:true, offer:'5% off on Rx meds', img:img('photo-1586773860418-d37222d8fce3'), about:'Hospital-run licensed pharmacy with 24x7 counter and IP/OP integration.' },
    { id:'s002', name:'Fortis Hospital Pharmacy',    city:'Noida', area:'Sector 62', lat:28.620, lng:77.363, phone:'+911202223344', delivery:true, pickup:true, offer:'Free tele-consult if Rx > 60 days', img:img('photo-1576765608633-8403a3be3a3a'), about:'Accredited hospital pharmacy with stringent cold-chain and audit.' },
    { id:'s003', name:'Max Hospital Pharmacy',       city:'Delhi', area:'Vaishali', lat:28.648, lng:77.339, phone:'+911143210987', delivery:true, pickup:true, offer:'8% off on selected brands', img:img('photo-1564532199-5a9f74f3ec0b') },
    { id:'s004', name:'Kokilaben Hospital Pharmacy', city:'Mumbai', area:'Andheri', lat:19.134, lng:72.833, phone:'+912261111111', delivery:false,pickup:true, offer:'Pick-up express counter', img:img('photo-1587351026955-5b0e1a9b8e9a') },
  ];

  stores.forEach((st, i) => {
    st.inv = meds.map((m, idx) => {
      const inStock = (idx + i) % 7 !== 0;
      const mrp = m.mrp;
      const storeOff = m.off + ((idx+i)%3 ? 0 : 3);
      const price = Math.round((mrp * (100 - storeOff))/100 * 100) / 100;
      return { mid:m.id, price, off:storeOff, stock:inStock };
    });
  });

  /* ---------------------------------------
     Location / sort
  --------------------------------------- */
  function computeStoreDistances() {
    if (!userLoc) { stores.forEach(s => s.distanceKm = null); return; }
    stores.forEach(s => s.distanceKm = Number(haversineKm(userLoc, {lat:s.lat,lng:s.lng}).toFixed(1)));
  }

  elLocate?.addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        toast('Location set!');
        renderStores();
        updateCartSummary();
      },
      () => toast('Unable to get location.'),
      { enableHighAccuracy:true, timeout:8000, maximumAge:60000 }
    );
  });

  /* ---------------------------------------
     Render — Medicines
  --------------------------------------- */
  function medPrice(m) {
    const price = Math.round((m.mrp * (100 - (m.off||0))) / 100 * 100) / 100;
    return { price, off: m.off||0 };
  }

  function medCardNode(m) {
    const node = tplMed.content.firstElementChild.cloneNode(true);

    // Inject figure/img if template doesn't have it (your HTML omits it intentionally)
    let fig = qs('.media', node);
    let im  = qs('.media img', node);
    if (!fig) {
      fig = document.createElement('figure');
      fig.className = 'media';
      im = document.createElement('img');
      im.setAttribute('loading', 'lazy');
      im.setAttribute('decoding', 'async');
      fig.appendChild(im);
      node.insertBefore(fig, node.firstChild); // full-bleed on top
    }
    im.src = m.img; im.alt = `${m.brand} image`;

    const title = qs('.brandname', node);
    const generic = qs('.generic', node);
    const tags = qs('.tags', node);
    const now = qs('.now', node);
    const mrp = qs('.mrp', node);
    const off = qs('.off', node);
    const offer = qs('.offer', node);
    const btnView = qs('.btn-view', node);
    const btnAdd = qs('.btn-add', node);

    title.textContent = m.brand;
    generic.textContent = `${m.generic} • ${m.strength} • ${m.pack}`;
    tags.innerHTML = '';
    [m.cond, m.form, m.rx ? 'Rx' : 'OTC'].forEach(t => {
      const s = document.createElement('span');
      s.className = 'pill';
      s.textContent = t;
      tags.appendChild(s);
    });

    const { price, off:disc } = medPrice(m);
    now.textContent = fmtRs(price);
    mrp.textContent = fmtRs(m.mrp);
    off.textContent = disc ? `${disc}% OFF` : '—';
    offer.textContent = 'Popular deal';

    const open = () => openMedModal(m);
    btnView.textContent = 'View';
    btnView.addEventListener('click', open);
    im.addEventListener('click', open);

    btnAdd.addEventListener('click', () => {
      addToCart({ mid:m.id, qty:1 });
      toast('Added to cart');
    });

    return node;
  }

  function filterMeds() {
    const q = (elSearch.value || '').trim().toLowerCase();
    const c = elCond.value;
    const f = elForm.value;
    return meds.filter(m => {
      if (c && m.cond !== c) return false;
      if (f && m.form !== f) return false;
      if (q) {
        const hay = `${m.brand} ${m.generic} ${m.cond} ${m.form}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderMeds() {
    const list = filterMeds();
    elMedGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach(m => frag.appendChild(medCardNode(m)));
    elMedGrid.appendChild(frag);
    if (kMeds) kMeds.textContent = String(list.length);
  }
  [elSearch, elCond, elForm].forEach(el => el?.addEventListener('input', renderMeds));

  /* ---------------------------------------
     Render — Stores
  --------------------------------------- */
  function storeCardNode(s) {
    const node = tplStore.content.firstElementChild.cloneNode(true);
    const imgEl = qs('img', node);
    const distEl = qs('.distance', node);
    const titleEl = qs('.title', node);
    const subEl = qs('.sub', node);
    const badgesEl = qs('.badges', node);
    const btnView = qs('.btn-view', node);
    const btnDir = qs('.btn-dir', node);
    const btnCall = qs('.btn-call', node);

    imgEl.src = s.img;
    imgEl.alt = `${s.name} — ${s.area}, ${s.city}`;
    distEl.textContent = s.distanceKm != null ? `${s.distanceKm} km` : '— km';
    titleEl.textContent = s.name;
    subEl.textContent = `${s.area} • ${s.city}`;
    badgesEl.innerHTML = '';
    [
      s.delivery ? 'Delivery' : 'Pick-up only',
      s.offer
    ].forEach(t => {
      const sp = document.createElement('span');
      sp.className = 'pill';
      sp.textContent = t;
      badgesEl.appendChild(sp);
    });

    btnDir.href = `https://www.google.com/maps?q=${encodeURIComponent(s.name)}@${s.lat},${s.lng}`;
    btnCall.href = `tel:${s.phone}`;

    const open = () => openStoreModal(s);
    node.addEventListener('click', (e) => { if (e.target.closest('.btn')) return; open(); });
    btnView.addEventListener('click', open);

    return node;
  }

  function filterStores() {
    const deliver = elDeliveryOnly.checked;
    computeStoreDistances();
    let out = stores.filter(s => deliver ? s.delivery : true);
    if (elNearestToggle.checked && userLoc) {
      out.sort((a,b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
      elSortHint.textContent = 'Sorted by nearest — using your current location.';
    } else {
      out.sort((a,b) => a.name.localeCompare(b.name));
      elSortHint.textContent = 'Sorted A–Z.';
    }
    return out;
  }

  function renderStores() {
    const list = filterStores();
    elStoreGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach(s => frag.appendChild(storeCardNode(s)));
    elStoreGrid.appendChild(frag);
    if (kStores) kStores.textContent = String(list.length);
  }
  [elDeliveryOnly, elNearestToggle].forEach(el => el?.addEventListener('change', renderStores));

  /* ---------------------------------------
     Med Modal
  --------------------------------------- */
  let quickLinksObserver = null;

  function openMedModal(m) {
    currentMed = m;

    // Header
    if (medTitleEl) medTitleEl.textContent = m.brand;
    if (medCond)    medCond.textContent    = m.cond;
    if (medFormEl)  medFormEl.textContent  = m.form;
    if (medRxEl)    medRxEl.textContent    = m.rx ? 'Rx' : 'OTC';

    medImg.src = m.img;
    medImg.alt = `${m.brand} image`;
    medImg.onclick = () => {
      const z = medImg.style.transform === 'scale(1.6)';
      medImg.style.transform = z ? '' : 'scale(1.6)';
      medImg.style.cursor = z ? 'zoom-in' : 'zoom-out';
    };

    // Price
    const { price, off } = medPrice(m);
    if (medBest)  medBest.textContent  = fmtRs(price);
    if (medBest2) medBest2.textContent = fmtRs(price);
    if (medNow)   medNow.textContent   = fmtRs(price);
    if (medMrp)   medMrp.textContent   = fmtRs(m.mrp);
    if (medOff)   medOff.textContent   = off ? `${off}% OFF` : '—';

    if (qtyTxt) qtyTxt.textContent = m.pack || 'Pack';

    // Availability / ETA
    if (stockNote) stockNote.textContent = 'In stock';
    const eta = new Date(Date.now() + 2*24*60*60*1000);
    if (deliverBy) deliverBy.textContent = eta.toLocaleDateString(undefined, { weekday:'short', day:'2-digit', month:'short' });

    // Subs/contains
    if (sameAs)       sameAs.textContent       = `${m.generic} ${m.strength}`;
    if (containsComp) containsComp.textContent = m.generic;

    // Intro + bullets
    if (medDesc) medDesc.textContent = buildDescription(m);
    if (medMore) {
      medMore.innerHTML = '';
      [ `Form: ${m.form}`, `Strength: ${m.strength}`, `Pack: ${m.pack}`, `Type: ${m.rx ? 'Prescription (Rx)' : 'OTC'}` ]
        .forEach(t => { const li = document.createElement('li'); li.textContent = t; medMore.appendChild(li); });
    }

    // Substitutes
    subsGrid.innerHTML = '';
    const subs = meds.filter(x => x.id !== m.id && x.generic === m.generic && x.strength === m.strength).slice(0,6);
    const frag = document.createDocumentFragment();
    subs.forEach(s => frag.appendChild(medCardNode(s)));
    subsGrid.appendChild(frag);

    // Quantity
    let qty = 1;
    const setQty = (v) => { qty = clamp(v, 1, 99); qtyValEl.textContent = String(qty); };
    setQty(1);
    qtyMinus.onclick = () => setQty(qty - 1);
    qtyPlus.onclick  = () => setQty(qty + 1);

    medAdd.onclick = () => { addToCart({ mid:m.id, qty }); toast('Added to cart'); };
    medGoCart.onclick = () => openSheet(cartSheet);

    // Coupon helper
    const target = 750;
    const itemsTotal = cart.lines.reduce((a,l) => a + l.qty * lineUnitPrice(l), 0);
    const need = Math.max(0, target - itemsTotal);
    if (unlockAmt) unlockAmt.textContent = fmtRs(need);
    if (unlockBtn) unlockBtn.onclick = () => toast(need === 0 ? 'Coupon already unlockable!' : `Add ${fmtRs(need)} more to unlock coupon`);

    // Build accordion + quick links
    buildMedSections(m);

    // Active pill tracking in the modal scroll container
    if (quickLinksObserver) quickLinksObserver.disconnect();
    if (medPanelsScroll && medSectionsWrap) {
      const pills = qsa('.pill', medQuickLinks);
      const secEls = qsa('.acc-item', medSectionsWrap);
      quickLinksObserver = new IntersectionObserver((entries) => {
        const topMost = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!topMost) return;
        const id = topMost.target.id;
        pills.forEach(p => p.classList.toggle('is-active', p.dataset.target === id));
      }, { root: medPanelsScroll, threshold:[0.1, 0.25, 0.5, 0.75] });
      secEls.forEach(s => quickLinksObserver.observe(s));
    }

    openSheet(medModal);
  }

  medClose?.addEventListener('click', () => closeSheet(medModal));

  /* ---------------------------------------
     Store Modal
  --------------------------------------- */
  function openStoreModal(s) {
    currentStore = s;
    storeLogo.src = s.img;
    storeTitle.textContent = s.name;
    storeAreaTxt.textContent = `${s.city}, ${s.area}`;
    storeDeliv.textContent = `${s.delivery ? 'Delivery' : 'No delivery'} • ${s.pickup ? 'Pick-up' : 'No pick-up'}`;
    storeDistance.textContent = s.distanceKm != null ? `${s.distanceKm} km` : '— km';
    storeMap.href = `https://www.google.com/maps?q=${encodeURIComponent(s.name)}@${s.lat},${s.lng}`;
    storeCall.href = `tel:${s.phone}`;
    storeOffer.textContent = s.offer || '—';
    storeAbout.textContent = s.about || '—';

    buildStoreInv(s, storeSearch.value || '');

    storeSearch.oninput = () => buildStoreInv(s, storeSearch.value);
    storeTabs.forEach(tab => tab.addEventListener('click', () => {
      storeTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const which = tab.dataset.tab;
      qsa('#storeModal .panel').forEach(p => p.classList.remove('is-active'));
      qs(which === 'inv' ? '#panel-inv' : '#panel-about').classList.add('is-active');
    }));

    qs('#storeToCart').onclick = () => openSheet(cartSheet);

    openSheet(storeModal);
  }

  function buildStoreInv(s, q) {
    const needle = (q || '').trim().toLowerCase();
    const items = s.inv
      .map(it => ({ ...it, med: meds.find(m => m.id === it.mid) }))
      .filter(x => x.stock && (!needle || `${x.med.brand} ${x.med.generic} ${x.med.cond}`.toLowerCase().includes(needle)));

    storeInv.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(x => {
      const n = medCardNode(x.med);
      const priceEl = qs('.now', n);
      const mrpEl = qs('.mrp', n);
      const offEl = qs('.off', n);
      priceEl.textContent = fmtRs(x.price);
      mrpEl.textContent = fmtRs(x.med.mrp);
      offEl.textContent = x.off ? `${x.off}% OFF` : '—';

      const btnAdd = qs('.btn-add', n);
      btnAdd.onclick = () => {
        addToCart({ mid:x.med.id, qty:1, storeId:s.id, price:x.price });
        toast('Added to cart');
      };

      frag.appendChild(n);
    });
    storeInv.appendChild(frag);
  }
  storeClose?.addEventListener('click', () => closeSheet(storeModal));

  /* ---------------------------------------
     Cart
  --------------------------------------- */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(LS_CART)) || { lines:[], storeId:null, ful:'delivery', addr:'', phone:'', rxDate:'', tele:false, pay:'UPI', note:'' }; }
    catch { return { lines:[], storeId:null, ful:'delivery', addr:'', phone:'', rxDate:'', tele:false, pay:'UPI', note:'' }; }
  }
  function saveCart() { localStorage.setItem(LS_CART, JSON.stringify(cart)); updateCartCount(); }
  function updateCartCount() {
    const c = cart.lines.reduce((a,l) => a + l.qty, 0);
    if (cartCount) cartCount.textContent = String(c);
  }

  function addToCart({ mid, qty=1, storeId=null, price=null }) {
    const line = cart.lines.find(l => l.mid === mid && l.storeId === storeId);
    if (line) line.qty += qty;
    else cart.lines.push({ mid, qty, storeId, price });
    saveCart();
  }

  cartOpen?.addEventListener('click', () => { openSheet(cartSheet); fillCartUI(); });
  cartClose?.addEventListener('click', () => closeSheet(cartSheet));

  btnClearCart?.addEventListener('click', () => {
    cart.lines = [];
    saveCart();
    fillCartUI();
  });

  function fillCartUI() {
    selStore.innerHTML = '';
    const optNone = document.createElement('option');
    optNone.value = ''; optNone.textContent = '-- Select hospital pharmacy --';
    selStore.appendChild(optNone);
    stores.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id; o.textContent = `${s.name} (${s.area})${s.distanceKm!=null?` — ${s.distanceKm} km`:''}`;
      selStore.appendChild(o);
    });
    if (cart.storeId) selStore.value = cart.storeId;

    fulPickup.checked = cart.ful === 'pickup';
    fulDelivery.checked = cart.ful !== 'pickup';
    addrRow.style.display = fulDelivery.checked ? '' : 'none';

    addrInput.value = cart.addr || '';
    userPhone.value = cart.phone || '';
    rxDate.value = cart.rxDate || '';
    teleNo.checked = !cart.tele;
    teleYes.checked = !!cart.tele;
    payMode.value = cart.pay || 'UPI';
    note.value = cart.note || '';

    renderCartLines();
    updateCartSummary();
  }

  function renderCartLines() {
    cartList.innerHTML = '';
    const frag = document.createDocumentFragment();

    cart.lines.forEach((l, idx) => {
      const m = meds.find(x => x.id === l.mid);
      if (!m) return;

      const row = document.createElement('div');
      row.className = 'test';

      const left = document.createElement('div');
      left.innerHTML = `<strong>${m.brand}</strong><div class="muted small">${m.generic} • ${m.strength} • ${m.pack}${l.storeId ? ` • <em>(${stores.find(s=>s.id===l.storeId)?.name || '—'})</em>`:''}</div>`;

      const right = document.createElement('div');
      const price = lineUnitPrice(l);
      right.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div class="muted small">Qty</div>
          <button class="btn btn-ghost ripple pressable btn-sm" aria-label="Decrease">−</button>
          <strong>${l.qty}</strong>
          <button class="btn btn-ghost ripple pressable btn-sm" aria-label="Increase">+</button>
          <div style="width:12px"></div>
          <div class="price">${fmtRs(price * l.qty)}</div>
          <button class="btn btn-ghost ripple pressable btn-sm" aria-label="Remove">✕</button>
        </div>
      `;

      const [btnMinus, , btnPlus, , , btnRemove] = qsa('button', right);
      btnMinus.onclick = () => { l.qty = Math.max(1, l.qty-1); saveCart(); renderCartLines(); updateCartSummary(); };
      btnPlus.onclick  = () => { l.qty += 1; saveCart(); renderCartLines(); updateCartSummary(); };
      btnRemove.onclick= () => { cart.lines.splice(idx,1); saveCart(); renderCartLines(); updateCartSummary(); };

      row.appendChild(left); row.appendChild(right);
      frag.appendChild(row);
    });

    cartList.appendChild(frag);
  }

  function lineUnitPrice(l) {
    const m = meds.find(x => x.id === l.mid);
    if (!m) return 0;

    if (l.storeId && cart.storeId === l.storeId && (typeof l.price === 'number')) {
      return l.price;
    }
    if (cart.storeId) {
      const s = stores.find(s => s.id === cart.storeId);
      const it = s?.inv.find(x => x.mid === l.mid && x.stock);
      if (it) return it.price;
    }
    return medPrice(m).price;
  }

  selStore.onchange = () => { cart.storeId = selStore.value || null; saveCart(); renderCartLines(); updateCartSummary(); };
  [fulPickup, fulDelivery].forEach(r => r.addEventListener('change', () => {
    cart.ful = fulPickup.checked ? 'pickup' : 'delivery';
    addrRow.style.display = fulDelivery.checked ? '' : 'none';
    saveCart(); updateCartSummary();
  }));
  addrInput.oninput = () => { cart.addr = addrInput.value; saveCart(); };
  userPhone.oninput = () => { cart.phone = userPhone.value; saveCart(); };
  rxDate.onchange = () => { cart.rxDate = rxDate.value; saveCart(); updateCartSummary(); };
  teleNo.onchange = teleYes.onchange = () => { cart.tele = teleYes.checked; saveCart(); };
  payMode.onchange = () => { cart.pay = payMode.value; saveCart(); };
  note.oninput = () => { cart.note = note.value; saveCart(); };

  function deliveryFee(distanceKm) {
    const d = distanceKm ?? 0;
    const base = 24;
    const perKm = 6.5;
    const fee = Math.round(base + perKm * d);
    const capped = Math.min(fee, 109);

    if (premiumActive) {
      const effKm = Math.max(0, d - 4);
      const prem = Math.round(base * 0.5 + perKm * 0.6 * effKm);
      return Math.min(prem, 59);
    }
    return capped;
  }

  const RX_OLD_DAYS = 60;

  function updateCartSummary() {
    const itemsTotal = cart.lines.reduce((a,l) => a + l.qty * lineUnitPrice(l), 0);

    let dKm = null;
    if (cart.storeId && userLoc) {
      const s = stores.find(s => s.id === cart.storeId);
      dKm = s ? haversineKm(userLoc, {lat:s.lat,lng:s.lng}) : null;
      if (dKm != null) dKm = Number(dKm.toFixed(1));
    }
    const delivFee = cart.ful === 'pickup' ? 0 : deliveryFee(dKm ?? 0);
    const disc = premiumActive ? Math.round(itemsTotal * 0.05) : 0;

    sumItems.textContent = fmtRs(itemsTotal);
    sumDeliv.textContent = fmtRs(delivFee);
    sumDisc.textContent  = `−${fmtRs(disc)}`;
    sumTotal.textContent = fmtRs(itemsTotal + delivFee - disc);

    feeNote.textContent = cart.ful === 'pickup'
      ? 'Pick-up selected — no delivery fee.'
      : (dKm != null ? `Calculated on ${dKm} km distance${premiumActive ? ' (Premium applied)': ''}.` : `Turn on location and select a hospital pharmacy to estimate delivery fee.`);

    const hasRx = cart.lines.some(l => (meds.find(m=>m.id===l.mid)?.rx));
    if (!hasRx) {
      rxHint.textContent = 'No prescription-only items in cart.';
    } else if (cart.rxDate) {
      const days = Math.floor((Date.now() - new Date(cart.rxDate).getTime()) / (86400e3));
      if (days >= RX_OLD_DAYS) {
        rxHint.innerHTML = `Prescription is <strong>${days} days</strong> old — eligible for <strong>FREE tele-consult</strong>.`;
        if (!teleYes.checked) teleYes.checked = true, cart.tele = true, saveCart();
      } else {
        rxHint.textContent = `Prescription age: ${days} days. Tele-consult optional.`;
      }
    } else {
      rxHint.textContent = 'Add prescription date if you are ordering Rx items.';
    }
  }

  btnPlaceOrder?.addEventListener('click', () => {
    if (!cart.lines.length) { toast('Your cart is empty.'); return; }
    if (!cart.storeId) { toast('Select a hospital pharmacy.'); return; }

    if (cart.ful === 'delivery') {
      const okPhone = /^[6-9]\d{9}$/.test(cart.phone || '');
      if (!cart.addr.trim()) { toast('Enter delivery address.'); return; }
      if (!okPhone) { toast('Enter valid 10-digit mobile.'); return; }
    }

    const s = stores.find(x => x.id === cart.storeId);
    const dKm = userLoc ? Number(haversineKm(userLoc, {lat:s.lat,lng:s.lng}).toFixed(1)) : null;

    const orderId = 'HF' + Math.random().toString(36).slice(2,8).toUpperCase();
    const itemsTotal = cart.lines.reduce((a,l) => a + l.qty * lineUnitPrice(l), 0);
    const delivFee = cart.ful === 'delivery' ? deliveryFee(dKm ?? 0) : 0;
    const disc = premiumActive ? Math.round(itemsTotal * 0.05) : 0;
    const total = itemsTotal + delivFee - disc;

    const order = {
      id: orderId,
      created: nowIso(),
      storeId: cart.storeId,
      storeName: s.name,
      mode: cart.ful,
      distanceKm: dKm,
      addr: cart.addr,
      phone: cart.phone,
      rxDate: cart.rxDate || null,
      tele: cart.tele,
      pay: cart.pay,
      note: cart.note,
      premium: premiumActive,
      items: cart.lines.map(l => ({ mid:l.mid, qty:l.qty, unit: lineUnitPrice(l) })),
      sum: { items:itemsTotal, delivery:delivFee, discount:disc, total },
      status: 'Placed',
      partner: null,
      etaMin: null,
      timeline: [ { t: nowIso(), msg: 'Order placed' } ],
      issues: []
    };

    orders.unshift(order);
    saveOrders();
    currentOrderId = order.id;
    localStorage.setItem('hf_current_order', currentOrderId);

    cart.lines = [];
    saveCart();
    fillCartUI();
    closeSheet(cartSheet);

    simulateOrderFlow(order.id);
    openTracker(order.id);

    const wa = [
      `*New Medicine Order* (${order.id})`,
      `${order.storeName}`,
      `Mode: ${order.mode}`,
      order.addr ? `Address: ${order.addr}`: '',
      `Phone: ${order.phone || '—'}`,
      '',
      ...order.items.map(it => {
        const m = meds.find(x=>x.id===it.mid);
        return `• ${m?.brand || it.mid} x ${it.qty} — ${fmtRs(it.unit*it.qty)}`;
      }),
      '',
      `Delivery: ${fmtRs(delivFee)}`,
      `Discount: −${fmtRs(disc)}`,
      `*Total: ${fmtRs(total)}*`,
      '',
      `Note: ${order.note || '—'}`
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(wa)}`, '_blank');
  });

  function saveOrders() { localStorage.setItem(LS_ORDERS, JSON.stringify(orders)); }
  function loadOrders() {
    try { return JSON.parse(localStorage.getItem(LS_ORDERS)) || []; } catch { return []; }
  }

  /* ---------------------------------------
     Premium
  --------------------------------------- */
  btnPremium?.addEventListener('click', () => {
    premiumActive = !premiumActive;
    localStorage.setItem('hf_premium', JSON.stringify(premiumActive));
    toast(premiumActive ? 'Premium enabled — 5% off + cheaper delivery' : 'Premium disabled');
    updateCartSummary();
  });

  /* ---------------------------------------
     Tracker
  --------------------------------------- */
  orderTrackerOpen?.addEventListener('click', () => {
    if (!currentOrderId) { toast('No active order'); return; }
    openTracker(currentOrderId);
  });
  trackerClose?.addEventListener('click', () => closeSheet(trackerSheet));

  function openTracker(id) {
    const ord = orders.find(o => o.id === id);
    if (!ord) { toast('Order not found'); return; }

    trackOrderId.textContent = ord.id;
    trackStore.innerHTML = `<strong>${ord.storeName}</strong>`;
    trackMode.textContent = `Mode: ${ord.mode}`;
    trackDistance.textContent = ord.distanceKm != null ? `Distance: ${ord.distanceKm} km` : 'Distance: —';
    trackStatus.textContent = ord.status;
    trackPartner.textContent = ord.partner ? `Partner: ${ord.partner.name} (${ord.partner.phone})` : 'Partner: —';
    etaCountdown.textContent = ord.etaMin != null ? mmss(ord.etaMin*60) : '--:--';

    renderTimeline(ord);
    renderMiniMap(ord);

    btnConfirmReceive.disabled = ord.status !== 'Out for delivery' && ord.status !== 'Arriving';
    btnConfirmReceive.onclick = () => {
      addTimeline(ord, 'Delivery confirmed by customer');
      ord.status = 'Delivered';
      ord.etaMin = 0;
      saveOrders();
      openTracker(ord.id);
      toast('Thanks for confirming!');
    };
    btnReportIssue.onclick = () => openSheet(issueModal);

    trackerWA.href = `https://wa.me/?text=${encodeURIComponent('Help with order ' + ord.id)}`;

    openSheet(trackerSheet);
  }

  function renderTimeline(ord) {
    trackTimeline.innerHTML = '';
    const frag = document.createDocumentFragment();
    ord.timeline.forEach(ev => {
      const row = document.createElement('div');
      row.className = 'test';
      const dt = new Date(ev.t);
      row.innerHTML = `<div><strong>${ev.msg}</strong><div class="muted small">${dt.toLocaleString()}</div></div><div></div>`;
      frag.appendChild(row);
    });
    trackTimeline.appendChild(frag);
    trackStatus.textContent = ord.status;
    trackPartner.textContent = ord.partner ? `Partner: ${ord.partner.name} (${ord.partner.phone})` : 'Partner: —';
    etaCountdown.textContent = ord.etaMin != null ? mmss(ord.etaMin*60) : '--:--';
  }

  function addTimeline(ord, msg) {
    ord.timeline.unshift({ t: nowIso(), msg });
    saveOrders();
  }

  let etaTimer = null;
  function simulateOrderFlow(id) {
    const ord = orders.find(o => o.id === id);
    if (!ord) return;

    setTimeout(() => { addTimeline(ord, 'Order accepted by pharmacy'); ord.status = 'Accepted'; saveOrders(); if (trackerSheet.classList.contains('is-open')) openTracker(id); }, 1200);

    setTimeout(() => {
      ord.partner = { name: 'Ravi', phone: '+91-98xxx 12xxx' };
      addTimeline(ord, 'Delivery partner assigned');
      ord.status = ord.mode === 'pickup' ? 'Ready for pick-up' : 'Preparing';
      saveOrders();
      if (trackerSheet.classList.contains('is-open')) openTracker(id);
    }, 3000);

    const launch = 7000;
    setTimeout(() => {
      if (ord.mode === 'pickup') {
        addTimeline(ord, 'Ready at pharmacy counter');
        ord.status = 'Ready for pick-up';
        saveOrders();
        if (trackerSheet.classList.contains('is-open')) openTracker(id);
        return;
      }
      addTimeline(ord, 'Out for delivery');
      ord.status = 'Out for delivery';
      const km = ord.distanceKm ?? 4;
      ord.etaMin = clamp(Math.round(km / 0.6 + 6), 12, 50);
      saveOrders();
      startEtaCountdown(ord.id);
      if (trackerSheet.classList.contains('is-open')) openTracker(id);
    }, launch);
  }

  function startEtaCountdown(id) {
    if (etaTimer) clearInterval(etaTimer);
    etaTimer = setInterval(() => {
      const ord = orders.find(o => o.id === id);
      if (!ord || ord.etaMin == null) { clearInterval(etaTimer); return; }
      ord.etaMin = Math.max(0, ord.etaMin - 1/60);
      if (ord.etaMin <= 2 && ord.status !== 'Arriving') {
        ord.status = 'Arriving';
        addTimeline(ord, 'Partner arriving soon');
      }
      if (ord.etaMin <= 0) {
        ord.etaMin = 0;
        clearInterval(etaTimer);
      }
      saveOrders();
      if (trackerSheet.classList.contains('is-open')) openTracker(id);
    }, 1000);
  }

  function mmss(seconds) {
    const m = Math.floor(seconds/60);
    const s = Math.floor(seconds%60);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function renderMiniMap(ord) {
    const box = miniMap.getBoundingClientRect();
    const w = Math.max(300, Math.floor(box.width));
    const h = Math.max(160, Math.floor(box.height));
    const s = stores.find(x => x.id === ord.storeId);

    const sx = 60, sy = h/2;
    const ux = w-60, uy = h/2;

    const progress = ord.etaMin!=null ? clamp(1 - (ord.etaMin / clamp(Math.round(haversineKm(userLoc || {lat:0,lng:0}, {lat:s?.lat||0,lng:s?.lng||0})/0.6 + 6), 12, 50)), 0, 1) : 0;
    const rx = sx + (ux - sx) * progress;
    const ry = sy - 20*Math.sin(progress*Math.PI);

    miniMap.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e9f2ff"/><stop offset="100%" stop-color="#e6f0ff"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,.2)"/>
          </filter>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="url(#g)"/>
        <path d="M ${sx} ${sy} C ${sx+80} ${sy-40}, ${ux-80} ${sy+40}, ${ux} ${uy}" fill="none" stroke="#9cc3ff" stroke-width="6" opacity=".7"/>
        <circle cx="${sx}" cy="${sy}" r="10" fill="#1b77ff" filter="url(#shadow)"/>
        <circle cx="${rx}" cy="${ry}" r="8" fill="#14b384" stroke="#0c8e66" stroke-width="2"/>
        <rect x="${ux-8}" y="${uy-16}" width="16" height="16" rx="3" fill="#0c8e66" filter="url(#shadow)"/>
      </svg>
    `;
  }

  /* ---------------------------------------
     Issues / Complaint
  --------------------------------------- */
  issueClose?.addEventListener('click', () => closeSheet(issueModal));
  issuePhotos?.addEventListener('change', () => {
    issuePreview.innerHTML = '';
    const files = Array.from(issuePhotos.files || []);
    files.slice(0,6).forEach(f => {
      const url = URL.createObjectURL(f);
      const imgEl = document.createElement('img');
      imgEl.src = url; imgEl.alt = f.name;
      imgEl.style.width = '70px'; imgEl.style.height = '70px';
      imgEl.style.objectFit = 'cover'; imgEl.style.borderRadius = '8px';
      issuePreview.appendChild(imgEl);
    });
  });
  issueSubmit?.addEventListener('click', () => {
    if (!currentOrderId) { toast('No active order'); return; }
    const ord = orders.find(o => o.id === currentOrderId);
    if (!ord) { toast('Order not found'); return; }

    ord.issues.push({
      t: nowIso(),
      type: issueType.value,
      text: (issueText.value || '').trim(),
      photos: (issuePhotos.files ? Array.from(issuePhotos.files).map(f=>f.name) : [])
    });
    addTimeline(ord, `Issue reported: ${issueType.value}`);
    saveOrders();
    closeSheet(issueModal);
    openTracker(ord.id);
    toast('Issue submitted');
    issueText.value = '';
    issuePhotos.value = '';
    issuePreview.innerHTML = '';
  });

  /* ---------------------------------------
     History
  --------------------------------------- */
  orderHistoryOpen?.addEventListener('click', () => { openSheet(historySheet); renderHistory(); });
  historyClose?.addEventListener('click', () => closeSheet(historySheet));

  function renderHistory() {
    historyList.innerHTML = '';
    if (!orders.length) {
      historyList.innerHTML = `<div class="test"><div>No orders yet.</div><div></div></div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    orders.forEach(o => {
      const r = document.createElement('div');
      r.className = 'test';
      const dt = new Date(o.created).toLocaleString();
      r.innerHTML = `
        <div>
          <strong>${o.id}</strong>
          <div class="muted small">${dt} • ${o.storeName} • ${o.mode}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div class="muted small">${fmtRs(o.sum.total)}</div>
          <button class="btn btn-ghost ripple pressable btn-sm">View</button>
          <button class="btn btn-ghost ripple pressable btn-sm">Reorder</button>
          <a class="btn btn-ghost ripple pressable btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Regarding order '+o.id)}">WhatsApp</a>
        </div>
      `;
      const [btnView, btnReorder] = qsa('button', r);
      btnView.onclick = () => { currentOrderId = o.id; localStorage.setItem('hf_current_order', currentOrderId); openTracker(o.id); };
      btnReorder.onclick = () => {
        cart.lines = o.items.map(it => ({ mid: it.mid, qty: it.qty, storeId: o.storeId, price: it.unit }));
        cart.storeId = o.storeId;
        cart.ful = o.mode;
        saveCart();
        openSheet(cartSheet);
        fillCartUI();
        toast('Items copied to cart');
      };
      frag.appendChild(r);
    });
    historyList.appendChild(frag);
  }

  /* ---------------------------------------
     Modals / Sheets helpers
  --------------------------------------- */
  function openSheet(el) {
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
  }
  function closeSheet(el) {
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
  }
  [medModal, storeModal, cartSheet, trackerSheet, issueModal, historySheet].forEach(m =>
    m?.addEventListener('click', (e) => { if (e.target === m) closeSheet(m); })
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [medModal, storeModal, cartSheet, trackerSheet, issueModal, historySheet].forEach(m => m.classList.contains('is-open') && closeSheet(m));
    }
  });

  /* ---------------------------------------
     Description + Sections (Accordion)
  --------------------------------------- */
  function buildDescription(m) {
    if (m.id === 'm006') {
      return 'METROGYL 400MG TABLET (Metronidazole) helps manage bacterial and parasitic infections including bacterial vaginosis, trichomoniasis and certain GI infections. Avoid alcohol during therapy. Take after food at the same time daily and complete the full course as prescribed.';
    }
    if (m.cond === 'Pain Relief') return `${m.brand} contains ${m.generic} for pain relief and fever management. Use the lowest effective dose.`;
    if (m.cond === 'Bacterial Infections') return `${m.brand} is an antibiotic (${m.generic}). Use only under medical advice and complete the full course.`;
    if (m.cond === 'Vitamins' || m.cond === 'Supplements') return `${m.brand} supplement helps bridge nutritional gaps. Do not exceed the recommended dose.`;
    return `${m.brand} — ${m.generic} (${m.strength}) for ${m.cond}.`;
  }

  function buildMedSections(m) {
    if (!medSectionsWrap || !medQuickLinks) return;

    const cond = (m.cond || '').toLowerCase();
    const byCond = (map) => map.find(([key]) => cond.includes(key))?.[1];

    const howWorks =
      byCond([
        ['bacterial', `${m.generic} stops the growth of bacteria and helps clear the infection.`],
        ['pain', `${m.generic} lowers prostaglandins to reduce pain and fever.`],
        ['ulcer', `${m.generic} decreases stomach acid to relieve reflux/ulcer symptoms.`],
        ['allerg', `${m.generic} blocks histamine (H1) to ease allergy symptoms.`],
        ['asthma', `${m.generic} helps open airways and reduce inflammation for easier breathing.`],
        ['copd', `${m.generic} helps relax airway muscles and reduce inflammation.`],
        ['diab', `${m.generic} helps improve blood glucose control.`],
        ['cholest', `${m.generic} reduces cholesterol synthesis in the liver.`],
        ['vitamin', `${m.generic} replenishes deficient nutrients.`],
        ['supplement', `${m.generic} supplements dietary needs.`],
      ]) || `${m.generic} works to help with ${m.cond.toLowerCase()}.`;

    const uses = `${m.brand} (${m.generic}) is used for ${m.cond.toLowerCase()}. Use only as advised by a clinician.`;
    const directions = `Take exactly as prescribed. ${m.form} — follow the label; keep consistent timing. Do not exceed the recommended dose.`;
    const side = `Common: mild stomach upset, nausea, headache. Seek medical help for allergic reactions (rash, swelling, breathing trouble) or persistent/worsening symptoms.`;
    const warns = `Inform your clinician about allergies, pregnancy/breast-feeding, liver/kidney issues, and all medicines you take. Avoid alcohol where advised (e.g., with metronidazole).`;
    const interactions = `Tell your clinician about antibiotics, anticoagulants, seizure meds, diabetes or heart medicines, and herbal supplements. Avoid mixing with alcohol if warned.`;
    const synopsis = `${m.brand}: ${m.generic} — ${m.cond}. Benefits when used correctly; complete prescribed courses for Rx items.`;
    const tests =
      byCond([
        ['bacterial', 'Clinician may request CBC or culture tests where appropriate.'],
        ['pain', 'If recurrent, clinician may assess with basic labs as needed.'],
        ['ulcer', 'May include H. pylori tests or endoscopy as advised.'],
        ['allerg', 'Allergy evaluation if symptoms persist.'],
        ['asthma', 'Spirometry/PEF monitoring for control.'],
        ['diab', 'Fasting glucose & HbA1c for control.'],
        ['cholest', 'Lipid profile to track LDL/HDL/TG.'],
        ['vitamin', 'Vitamin levels if deficiency suspected.'],
        ['supplement', 'Specific panels only if clinically indicated.'],
      ]) || 'Relevant tests may be suggested by your clinician based on symptoms.';

    const sections = [
      ['uses','Uses',uses],
      ['how','How it works',howWorks],
      ['dir','Directions for use',directions],
      ['side','Side effects',side],
      ['warn','Warnings & precautions',warns],
      ['int','Interactions',interactions],
      ['syn','Synopsis',synopsis],
      ['tests','Useful diagnostic tests',tests],
    ];

    medSectionsWrap.innerHTML = `
      <div class="acc">
        ${sections.map(([id,label,text], idx) => `
          <details id="sec-${id}" class="acc-item"${idx===0?' open':''}>
            <summary class="acc-head">${label}<span class="tag"></span></summary>
            <div class="acc-body"><p class="note">${text}</p></div>
          </details>
        `).join('')}
      </div>
    `;

    medQuickLinks.innerHTML = sections.map(([id,label], idx) =>
      `<span class="pill${idx===0?' is-active':''}" data-target="sec-${id}" tabindex="0" role="button" aria-label="${label}">${label}</span>`
    ).join('');

    qsa('.pill', medQuickLinks).forEach(p => {
      const go = () => {
        const target = qs('#' + p.dataset.target, medSectionsWrap);
        if (!target) return;
        qsa('.acc-item', medSectionsWrap).forEach(d => { if (d !== target) d.open = false; });
        target.open = true;
        target.scrollIntoView({ block:'start', behavior:'smooth' });
      };
      p.addEventListener('click', go);
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

    qsa('.acc-item', medSectionsWrap).forEach(d => {
      d.addEventListener('toggle', () => {
        const id = d.id;
        qsa('.pill', medQuickLinks).forEach(p => p.classList.toggle('is-active', p.dataset.target === id && d.open));
      });
    });
  }

  /* ---------------------------------------
     Initial render
  --------------------------------------- */
  renderMeds();
  renderStores();

  if (currentOrderId) startEtaCountdown(currentOrderId);
});
