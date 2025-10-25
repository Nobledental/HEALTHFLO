/* =========================================================
   HealthFlo — patient.js
   Glassmorphic cards • Android-style ripple • Density/Theme
   Fully wired to service pages (packages, coverage, etc.)
   ========================================================= */

/* ---------- Tiny helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

/* ---------- Base path (GitHub Pages friendly) ---------- */
const BASE_PATH = (() => {
  const segs = location.pathname.split('/').filter(Boolean);
  // If first segment looks like a folder (no dot extension), treat as base
  return segs.length > 0 && !segs[0].includes('.') ? `/${segs[0]}` : '';
})();
const pathTo = (p) => `${BASE_PATH}/${String(p).replace(/^\//, '')}`;

/* ---------- Services Catalog ---------- */
const services = [
  {
    id: 'coverage',
    tags: ['Coverage','Claims'],
    title: 'Know your coverage',
    description: 'Upload policy PDF → see room caps, co-pay, waiting periods, and non-payables in plain language.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-1.webp',
    href: pathTo('coverage.html#coverage'),
    more: pathTo('coverage.html#coverage-guide'),
    features: ['Room cap check','Co-pay','Waiting periods']
  },
  {
    id: 'packages',
    tags: ['Packages','Claims'],
    title: 'Treatment packages',
    description: 'Transparent bundles by area & specialty. Private room / ICU buffer clearly explained.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-5.webp',
    href: pathTo('packages.html'),
    more: pathTo('packages.html#how-it-works'),
    features: ['By area','By specialty','Add-ons']
  },
  {
    id: 'reimbursement',
    tags: ['Claims'],
    title: 'Reimbursement concierge',
    description: 'We coordinate with TPA and keep you updated on WhatsApp/Mail while you focus on recovery.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-6.webp',
    href: pathTo('reimbursement.html'),
    more: pathTo('reimbursement.html#faq'),
    features: ['Checklist','Tracking','Escalations']
  },
  {
    id: 'finance',
    tags: ['Finance'],
    title: 'Financial support',
    description: 'Zero-interest EMI (3 months) or standard loan. Check eligibility in under 60 minutes.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-1.webp',
    href: pathTo('finance.html'),
    more: pathTo('finance.html#eligibility'),
    features: ['0% EMI','Quick check','Low docs']
  },
  {
    id: 'denials',
    tags: ['Claims','Support'],
    title: 'Denials & short settlements',
    description: 'Structured appeals, ombudsman support, and escalation templates for shortfalls.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-7.webp',
    href: pathTo('denials.html'),
    more: pathTo('denials.html#templates'),
    features: ['Appeals','Templates','Ombudsman']
  },
  {
    id: 'bills',
    tags: ['Claims'],
    title: 'Bills → Reimbursable check',
    description: 'Upload bills and get a payable/non-payable split (demo).',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-2.webp',
    href: pathTo('bills.html'),
    more: pathTo('bills.html#demo'),
    features: ['OCR','Split view','Non-payables']
  },
  {
    id: 'consult',
    tags: ['Support'],
    title: 'Book OPD / IP / ER',
    description: 'Top specialists with hospital tariffs & coverage guardrails.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-10.webp',
    href: pathTo('consult.html'),
    more: pathTo('consult.html#tariffs'),
    features: ['OPD','IP','ER']
  },
  {
    id: 'support',
    tags: ['Support'],
    title: 'Medical support',
    description: 'Upload reports to get a provisional summary & next-steps guidance.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-11.webp',
    href: pathTo('support.html'),
    more: pathTo('support.html#how-it-works'),
    features: ['Report summary','Next steps','Second opinion']
  },
  {
    id: 'home-tests',
    tags: ['Diagnostics'],
    title: 'Home visit tests (30% off)',
    description: 'Direct from hospital / partner labs. Slots 7am–8pm.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-4.webp',
    href: pathTo('home-tests.html'),
    more: pathTo('home-tests.html#all-tests'),
    features: ['CBC','LFT','RT-PCR']
  },
  {
    id: 'meds',
    tags: ['Pharmacy'],
    title: 'Medicines — same day',
    description: 'Hospital pharmacies or top partners nearby.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-12.webp',
    href: pathTo('meds.html'),
    more: pathTo('meds.html#coverage'),
    features: ['e-Rx','Same-day','Genuine']
  }
];

/* ---------- DOM refs ---------- */
const grid     = $('#svcGrid');
const searchEl = $('#svcSearch');
const chipRow  = $('#chipRow');

/* ---------- Render ---------- */
function featureBadges(list = []) {
  if (!list.length) return '';
  return `<div class="badges">${list.map(f => `<span class="badge">${f}</span>`).join('')}</div>`;
}

function cardTemplate(c) {
  // Title with optional favorite toggle (small star) – stored in localStorage
  const favs = getFavs();
  const isFav = favs.has(c.id);
  return `
    <article class="solution-card" data-id="${c.id}" data-tags="${c.tags.join(',')}">
      <figure><img src="${c.image}" alt="${c.title}" loading="lazy"></figure>
      <div>
        <h3>${c.title}
          <button class="btn btn-ghost btn-icon fav-toggle" type="button" aria-pressed="${isFav}" title="Add to favorites" data-id="${c.id}" style="margin-left:.35rem;vertical-align:middle;">
            ${isFav ? '★' : '☆'}
          </button>
        </h3>
        <p>${c.description}</p>
        ${featureBadges(c.features)}
      </div>
      <div class="card-cta">
        <a class="btn btn-primary" href="${c.href}" data-sound="click">Open</a>
        <a class="btn btn-ghost"   href="${c.more}" data-sound="click">Learn more</a>
      </div>
    </article>
  `;
}

function render(list) {
  if (!grid) return;
  grid.innerHTML = list.map(cardTemplate).join('');
  enhanceButtons(grid);    // ripple + keyboard press + click tone
  wireFavToggles(grid);    // favorites handling
}

/* ---------- Search & Filter ---------- */
let activeChip = 'all';

function applyFilters() {
  const q = (searchEl?.value || '').toLowerCase().trim();
  const favs = getFavs();

  let pool = services;
  if (activeChip === 'Favorites') {
    if (favs.size === 0) toast('Tip: click the ☆ on any card to add it to Favorites.');
    pool = services.filter(s => favs.has(s.id));
  } else if (activeChip !== 'all') {
    pool = services.filter(s => s.tags.includes(activeChip));
  }

  const filtered = pool.filter(s => {
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  render(filtered);
}

const debounce = (fn, ms = 160) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
on(searchEl, 'input', debounce(applyFilters, 160));

on(chipRow, 'click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', chipRow).forEach(c => {
    const onIt = c === btn;
    c.classList.toggle('is-active', onIt);
    c.setAttribute('aria-selected', String(onIt));
  });
  activeChip = btn.dataset.chip || 'all';
  applyFilters();
});

/* ---------- Favorites (localStorage) ---------- */
const FKEY = 'hf:favs';
function getFavs(){
  try {
    const raw = localStorage.getItem(FKEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function setFavs(set){
  try { localStorage.setItem(FKEY, JSON.stringify([...set])); } catch {}
}
function wireFavToggles(scope=document){
  $$('.fav-toggle', scope).forEach(btn=>{
    on(btn, 'click', ()=>{
      const id = btn.dataset.id;
      const favs = getFavs();
      if (favs.has(id)) {
        favs.delete(id);
        btn.textContent = '☆';
        btn.setAttribute('aria-pressed','false');
      } else {
        favs.add(id);
        btn.textContent = '★';
        btn.setAttribute('aria-pressed','true');
      }
      setFavs(favs);
      // If viewing Favorites tab, re-filter to update list
      if (activeChip === 'Favorites') applyFilters();
    });
  });
}

/* ---------- Android-style Ripple & Press Feedback ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeRipple(target, x, y) {
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.3;
  const ripple = document.createElement('span');
  ripple.className = 'md-ripple';
  ripple.style.width  = ripple.style.height = `${size}px`;
  ripple.style.left   = `${(x ?? rect.width/2) - size/2}px`;
  ripple.style.top    = `${(y ?? rect.height/2) - size/2}px`;
  target.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

function enhanceButtons(scope = document) {
  $$('a.btn, button.btn, .chip, .fab', scope).forEach(el => {
    on(el, 'pointerdown', (ev) => {
      if (prefersReduced) return;
      const rect = el.getBoundingClientRect();
      makeRipple(el, ev.clientX - rect.left, ev.clientY - rect.top);
    });
    on(el, 'keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        el.style.transform = 'scale(0.975)';
        setTimeout(() => { el.style.transform = ''; }, 120);
      }
    });
    on(el, 'click', () => { if (el.dataset.sound === 'click') clickTone(); });
  });
}

/* Tiny synth click (no assets) */
let audioCtx;
function clickTone() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(420, audioCtx.currentTime);
    g.gain.setValueAtTime(0.09, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.07);
  } catch {}
}

/* ---------- Support & WhatsApp ---------- */
const els = {
  fabSupport:   $('#fabSupport'),
  fabWA:        $('#fabWA'),
  supportScrim: $('#supportScrim'),
  supportPanel: $('#supportPanel'),
  supportClose: $('#supportClose'),
  supName:  $('#supName'),
  supTopic: $('#supTopic'),
  supMsg:   $('#supMsg'),
  supChips: $('#supChips'),
  supWhatsApp: $('#supWhatsApp'),
  supCall:     $('#supCall'),
  supEmail:    $('#supEmail'),
};

// Replace with your WhatsApp business number (no +, country code first)
const WA_NUMBER = '919999999999';

function toggleSupport(show) {
  if (!els.supportPanel || !els.supportScrim) return;
  const on = Boolean(show);
  els.supportPanel.hidden = !on;
  els.supportScrim.hidden = !on;
  requestAnimationFrame(() => {
    els.supportPanel.classList.toggle('is-open', on);
    els.supportScrim.classList.toggle('is-visible', on);
  });
}
on(els.fabSupport, 'click', () => toggleSupport(true));
on(els.supportClose, 'click', () => toggleSupport(false));
on(els.supportScrim, 'click', (e) => { if (e.target === els.supportScrim) toggleSupport(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleSupport(false); });

on(els.supChips, 'click', (e) => {
  const chip = e.target.closest('button.chip');
  if (!chip) return;
  $$('.chip', els.supChips).forEach(c => c.classList.toggle('is-active', c === chip));
  const topic = chip.dataset.topic || chip.textContent.trim();
  if (els.supTopic) els.supTopic.value = topic;
  updateWhatsAppLinks();
});

function buildWAURL({ name, topic, message }) {
  const base = `https://wa.me/${WA_NUMBER}`;
  const lines = [
    `Hi HealthFlo, I need help.`,
    name ? `Name: ${name}` : '',
    topic ? `Topic: ${topic}` : '',
    message ? `Message: ${message}` : ''
  ].filter(Boolean).join('\n');
  return `${base}?text=${encodeURIComponent(lines)}`;
}

function updateWhatsAppLinks() {
  const name = els.supName?.value?.trim() || '';
  const topic = els.supTopic?.value?.trim() || '';
  const message = els.supMsg?.value?.trim() || '';
  const url = buildWAURL({ name, topic, message });
  if (els.supWhatsApp) els.supWhatsApp.href = url;
  if (els.fabWA)       els.fabWA.href       = url;
}
['input','change'].forEach(ev => {
  ['supName','supTopic','supMsg'].forEach(k => on(els[k], ev, updateWhatsAppLinks));
});
updateWhatsAppLinks();

/* ---------- Metrics tick (optional) ---------- */
function bumpMetrics() {
  const nums = $$('.metric strong');
  nums.forEach(n => {
    const target = Number((n.textContent || '0').replace(/[^\d]/g, '')) || 0;
    if (!target) return;
    let c = 0, steps = 20;
    const inc = Math.ceil(target / steps);
    const t = setInterval(() => {
      c += inc;
      if (c >= target) { c = target; clearInterval(t); }
      n.textContent = c.toLocaleString();
    }, 28);
  });
}

/* ---------- Toast ---------- */
function toast(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  Object.assign(d.style, {
    position: 'fixed',
    left: '50%',
    bottom: '22px',
    transform: 'translateX(-50%)',
    background: '#0e2244',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '12px',
    boxShadow: '0 14px 36px -18px rgba(8,34,78,.45)',
    zIndex: 1200,
    fontWeight: 700,
    fontSize: '0.92rem',
    maxWidth: '88vw',
    textAlign: 'center'
  });
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2200);
}

/* =========================================================
   Density + Theme Switcher (chips with data-attrs)
   Persists in localStorage. Supports 'system' theme with
   media-query listener.
   ========================================================= */
(function(){
  const DKEY = 'hf:density'; // comfortable | cozy | compact | tight
  const TKEY = 'hf:theme';   // light | dark | system

  const root = document.documentElement;
  const body = document.body;
  const densityBtns = Array.from(document.querySelectorAll('[data-density]'));
  const themeBtns   = Array.from(document.querySelectorAll('[data-theme]'));
  let _mm; // mediaQueryList for system theme

  function applyDensity(mode='comfortable'){
    const m = String(mode).toLowerCase();
    body.classList.remove('density-compact','density-tight');
    if (m === 'compact') body.classList.add('density-compact');
    if (m === 'cozy' || m === 'tight') body.classList.add('density-tight');
    localStorage.setItem(DKEY, m);
    densityBtns.forEach(b=>{
      const on = (b.dataset.density || '').toLowerCase() === m;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function systemTheme(){
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function setHtmlTheme(v){ root.setAttribute('data-theme', v); }
  function onSystemChange(){ setHtmlTheme(systemTheme()); }

  function applyTheme(mode='system'){
    const m = String(mode).toLowerCase();
    localStorage.setItem(TKEY, m);
    if (_mm && _mm.removeEventListener) _mm.removeEventListener('change', onSystemChange);

    if (m === 'system'){
      setHtmlTheme(systemTheme());
      _mm = window.matchMedia('(prefers-color-scheme: dark)');
      _mm.addEventListener('change', onSystemChange);
    } else {
      setHtmlTheme(m);
    }
    themeBtns.forEach(b=>{
      const on = (b.dataset.theme || '').toLowerCase() === m;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  document.addEventListener('click', (e)=>{
    const dBtn = e.target.closest('[data-density]');
    if (dBtn) applyDensity(dBtn.dataset.density);

    const tBtn = e.target.closest('[data-theme]');
    if (tBtn) applyTheme(tBtn.dataset.theme);
  });

  // Boot: restore prefs (defaults compact + system)
  applyDensity(localStorage.getItem(DKEY) || 'compact');
  applyTheme(localStorage.getItem(TKEY) || 'system');
})();

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  render(services);
  applyFilters();   // initial render (respects Favorites)
  enhanceButtons(document);
  bumpMetrics();
});
