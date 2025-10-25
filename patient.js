/* =========================================================
   HealthFlo — Patient Services (Advanced)
   Glassmorphic cards + Android-style ripple + Compact layout
   ========================================================= */

/* ---------- Tiny helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

/* ---------- Services Catalog (demo data) ---------- */
const services = [
  {
    id: 'coverage',
    tags: ['Coverage','Claims'],
    title: 'Know your coverage',
    description: 'Upload policy PDF → see room rent caps, co-pay, waiting periods, and non-payables in plain language.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-1.webp',
    href: '#coverage',
    more: '#coverage-guide',
    features: ['Room cap check','Co-pay','Waiting periods']
  },
  {
    id: 'packages',
    tags: ['Packages','Claims'],
    title: 'Treatment packages',
    description: 'Transparent bundles by city & specialty. Private room / ICU buffer clearly explained.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-5.webp',
    href: '#packages',
    more: '#packages-how',
    features: ['By city','By specialty','Add-ons']
  },
  {
    id: 'reimbursement',
    tags: ['Claims'],
    title: 'Reimbursement concierge',
    description: 'We coordinate with TPA and keep you updated on WhatsApp / Mail while you focus on recovery.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-6.webp',
    href: '#reimbursement',
    more: '#reimbursement-faq',
    features: ['Checklist','Tracking','Escalations']
  },
  {
    id: 'finance',
    tags: ['Finance'],
    title: 'Financial support',
    description: 'Zero-interest EMI (3 months) or standard loan. Check eligibility in under 60 minutes.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-1.webp',
    href: '#finance',
    more: '#finance-eligibility',
    features: ['0% EMI','Quick check','Low docs']
  },
  {
    id: 'denials',
    tags: ['Claims','Support'],
    title: 'Denials & short settlements',
    description: 'Structured appeals, ombudsman support, and escalation templates for shortfalls.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-7.webp',
    href: '#denials',
    more: '#denials-templates',
    features: ['Appeals','Templates','Ombudsman']
  },
  {
    id: 'bills',
    tags: ['Claims'],
    title: 'Bills → Reimbursable check',
    description: 'Upload bills and get a payable/non-payable split (demo).',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-2.webp',
    href: '#bills',
    more: '#bills-demo',
    features: ['OCR','Split view','Non-payables']
  },
  {
    id: 'consult',
    tags: ['Support'],
    title: 'Book OPD / IP / ER',
    description: 'Top specialists with hospital tariffs & coverage guardrails.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-10.webp',
    href: '#consult',
    more: '#consult-tariffs',
    features: ['OPD','IP','ER']
  },
  {
    id: 'support',
    tags: ['Support'],
    title: 'Medical support',
    description: 'Upload reports to get a provisional summary & next-steps guidance.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-11.webp',
    href: '#support',
    more: '#support-how',
    features: ['Report summary','Next steps','Second opinion']
  },
  {
    id: 'home-tests',
    tags: ['Diagnostics'],
    title: 'Home visit tests (30% off)',
    description: 'Direct from hospital / partner labs. Slots 7am–8pm.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-4.webp',
    href: '#home-tests',
    more: '#diagnostics-list',
    features: ['CBC','LFT','RT-PCR']
  },
  {
    id: 'meds',
    tags: ['Pharmacy'],
    title: 'Medicines — same day',
    description: 'Hospital pharmacies or top partners nearby.',
    image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-12.webp',
    href: '#meds',
    more: '#pharmacy-coverage',
    features: ['e-Rx','Same-day','Genuine']
  }
];

/* ---------- Render ---------- */
const grid      = $('#svcGrid');
const searchEl  = $('#svcSearch');
const chipRow   = $('#chipRow');

function featureBadges(list = []) {
  if (!list.length) return '';
  return `<div class="badges">${list.map(f => `<span class="badge">${f}</span>`).join('')}</div>`;
}

function cardTemplate(c) {
  return `
    <article class="solution-card" data-tags="${c.tags.join(',')}">
      <figure>
        <img src="${c.image}" alt="${c.title}" loading="lazy">
      </figure>
      <div>
        <h3>${c.title}</h3>
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
  enhanceButtons(grid);   // ripple + sound on newly added buttons
}

/* ---------- Search & Filter ---------- */
let activeChip = 'all';

function applyFilters() {
  const q = (searchEl?.value || '').toLowerCase().trim();
  const filtered = services.filter(s => {
    const matchesChip = activeChip === 'all' || s.tags.includes(activeChip);
    const matchesText = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    return matchesChip && matchesText;
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
  // Update visual/ARIA
  $$('.chip', chipRow).forEach(c => {
    const isOn = c === btn;
    c.classList.toggle('is-active', isOn);
    c.setAttribute('aria-selected', String(isOn));
  });
  activeChip = btn.dataset.chip || 'all';
  applyFilters();
});

/* ---------- Android-style Ripple & Press Feedback ---------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeRipple(target, x, y) {
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.2;
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
    // Ripple
    on(el, 'pointerdown', (ev) => {
      if (prefersReduced) return;
      const rect = el.getBoundingClientRect();
      makeRipple(el, ev.clientX - rect.left, ev.clientY - rect.top);
    });
    // Keyboard "press" animation
    on(el, 'keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        el.style.transform = 'scale(0.975)';
        setTimeout(() => { el.style.transform = ''; }, 120);
      }
    });
    // Optional tiny click sound on elements that opt-in
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

  densitySelect: $('#viewDensity'),
  themeToggle:   $('#themeToggle'),
  themeIcon:     $('#themeToggle .icon-theme')
};

// Replace with your WhatsApp business number (no plus; country code first)
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

// Topic chips → fill input
on(els.supChips, 'click', (e) => {
  const chip = e.target.closest('button.chip');
  if (!chip) return;
  // Single select behavior for clarity
  $$('.chip', els.supChips).forEach(c => c.classList.toggle('is-active', c === chip));
  const topic = chip.dataset.topic || chip.textContent.trim();
  if (els.supTopic) els.supTopic.value = topic;
  updateWhatsAppLinks();
});

/* Build WhatsApp URL with prefill */
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

/* ---------- Nice metrics tick (optional) ---------- */
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

/* =========================================================
   Density + Theme Switcher (cozy/compact/tight + day/night)
   Matches your HTML: <select id="viewDensity"> and #themeToggle
   Persists in localStorage and updates ARIA/icon states.
   ========================================================= */

const STORE_KEYS = {
  density: 'hf:density',
  theme:   'hf:theme'   // 'light' | 'dark' | 'system'
};

function applyDensity(mode) {
  const m = (mode || 'comfortable').toLowerCase();
  document.body.classList.remove('density-compact','density-tight');
  if (m === 'compact') document.body.classList.add('density-compact');
  if (m === 'tight')   document.body.classList.add('density-tight');
  localStorage.setItem(STORE_KEYS.density, m);
  if (els.densitySelect) {
    // sync select if needed (values: comfortable | tight | compact)
    if (els.densitySelect.value !== m) els.densitySelect.value = m;
  }
}

let mqlDark; // media query listener for system theme

function currentSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function setHtmlTheme(v) {
  document.documentElement.setAttribute('data-theme', v);
}

function updateThemeUI(modeResolved, modeStored) {
  // Update icon + aria based on *stored* mode
  if (!els.themeToggle || !els.themeIcon) return;
  let icon = '🌙', label = 'Toggle dark mode';
  if (modeStored === 'dark') { icon = '☀️'; label = 'Switch to light mode'; }
  if (modeStored === 'system') { icon = '🖥️'; label = 'Follow system theme'; }
  els.themeIcon.textContent = icon;
  els.themeToggle.setAttribute('aria-label', label);
  els.themeToggle.setAttribute('aria-pressed', String(modeResolved === 'dark'));
}

function applyTheme(mode) {
  const stored = (mode || localStorage.getItem(STORE_KEYS.theme) || $('html')?.getAttribute('data-theme') || 'light').toLowerCase();

  // remove previous listener
  if (mqlDark?.removeEventListener) mqlDark.removeEventListener('change', onSystemChange);

  let resolved = stored;
  if (stored === 'system') {
    resolved = currentSystemTheme();
    mqlDark = window.matchMedia('(prefers-color-scheme: dark)');
    mqlDark.addEventListener('change', onSystemChange);
  }
  setHtmlTheme(resolved);
  localStorage.setItem(STORE_KEYS.theme, stored);
  updateThemeUI(resolved, stored);
}

function onSystemChange() {
  if ((localStorage.getItem(STORE_KEYS.theme) || 'light') !== 'system') return;
  setHtmlTheme(currentSystemTheme());
  updateThemeUI(document.documentElement.getAttribute('data-theme'), 'system');
}

/* Wire density select */
on(els.densitySelect, 'change', (e) => {
  applyDensity(e.target.value);
});

/* Wire theme toggle (cycles: light → dark → system → light) */
on(els.themeToggle, 'click', () => {
  const curr = (localStorage.getItem(STORE_KEYS.theme) || $('html')?.getAttribute('data-theme') || 'light').toLowerCase();
  let next = 'dark';
  if (curr === 'dark') next = 'system';
  if (curr === 'system') next = 'light';
  applyTheme(next);
  clickTone();
});

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Initial density
  const savedDensity = localStorage.getItem(STORE_KEYS.density)
    || (document.body.classList.contains('density-compact') ? 'compact' : 'comfortable');
  applyDensity(savedDensity);

  // Initial theme
  const attrTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const savedTheme = localStorage.getItem(STORE_KEYS.theme) || attrTheme;
  applyTheme(savedTheme);

  // Render + interactions
  render(services);
  applyFilters();   // initial
  enhanceButtons(document);
  bumpMetrics();
});
