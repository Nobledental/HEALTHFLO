/* =========================
   HealthFlo Landing – Futuristic OS
   ========================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  theme: localStorage.getItem('healthfloTheme') || 'cosmic'
};

const elements = {
  docEl: document.documentElement,
  heroCanvas: $('#heroCanvas'),
  themeButtons: $$('[data-theme-choice]'),
  tickerRoot: $('[data-ticker]'),
  tickerTrack: $('[data-ticker-track]'),
  tickerToggle: $('[data-ticker-toggle]'),
  dirGrid: $('[data-dir-grid]'),
  dirModal: $('[data-dir-modal]'),
  dirTitle: $('[data-dir-title]'),
  dirMenu: $('[data-dir-menu]'),
  leadAside: $('#lead'),
  leadToggle: $('[data-lead-toggle]'),
  leadPanel: $('#lead-panel'),
  leadForms: $$('[data-lead-form]'),
  copilotBtn: $('[data-copilot]'),
  copilotModal: $('[data-copilot-modal]'),
  copilotClose: $$('[data-copilot-close]'),
  copilotChips: $('[data-copilot-chips]'),
  copilotOutput: $('[data-copilot-output]'),
  howProgress: $('.how-progress'),
  stepsHost: $('[data-steps]')
};

const analytics = {
  track: (event, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    const data = { event, ...payload, timestamp: Date.now() };
    window.dataLayer.push(data);
    if (console?.info) console.info('[analytics]', event, payload);
  }
};

function setTheme(theme) {
  if (!theme) return;
  state.theme = theme;
  elements.docEl.dataset.theme = theme;
  localStorage.setItem('healthfloTheme', theme);
  elements.themeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.themeChoice === theme));
  analytics.track('theme_changed', { theme });
}

function initNav() {
  const nav = $('.primary-nav');
  const navToggle = $('.nav-toggle');
  if (!nav || !navToggle) return;
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initRipple() {
  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest('.btn, .copilot-chip, [data-theme-choice], .lead-toggle');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'ripple-span';
    const size = Math.max(rect.width, rect.height);
    const x = (event.clientX || rect.width / 2) - rect.left;
    const y = (event.clientY || rect.height / 2) - rect.top;
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${x - size / 2}px`;
    span.style.top = `${y - size / 2}px`;
    target.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });
}

let revealObserver;
function initReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  observeRevealElements();
}
function observeRevealElements() {
  if (!revealObserver) return;
  $$('[data-reveal]:not(.is-visible)').forEach((el) => revealObserver.observe(el));
}

function initCanvas() {
  const canvas = elements.heroCanvas;
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { canvas.style.display = 'none'; return; }
  let width = canvas.width = canvas.offsetWidth * devicePixelRatio;
  let height = canvas.height = canvas.offsetHeight * devicePixelRatio;
  const particles = Array.from({ length: 90 }, () => createParticle(width, height));

  function createParticle(w, h) {
    return { x: Math.random()*w, y: Math.random()*h, size: Math.random()*2 + .5, speedX: (Math.random()-.5)*.4, speedY: (Math.random()-.5)*.4, orbit: Math.random()*120 + 40, angle: Math.random()*Math.PI*2 };
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    context.save(); context.globalCompositeOperation = 'lighter';
    particles.forEach((p) => {
      p.angle += 0.002; p.x += p.speedX + Math.cos(p.angle)*0.6; p.y += p.speedY + Math.sin(p.angle)*0.6; wrap(p, width, height);
      const gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.orbit);
      gradient.addColorStop(0, 'rgba(84, 179, 255, 0.65)'); gradient.addColorStop(1, 'rgba(14, 21, 48, 0)');
      context.fillStyle = gradient; context.fillRect(p.x - p.orbit, p.y - p.orbit, p.orbit*2, p.orbit*2);
      context.fillStyle = 'rgba(255, 158, 94, 0.26)'; context.beginPath(); context.arc(p.x, p.y, p.size*1.6, 0, Math.PI*2); context.fill();
    });
    context.restore();
    animationFrame = requestAnimationFrame(draw);
  }
  function wrap(p, w, h) { if (p.x < -p.orbit) p.x = w + p.orbit; if (p.x > w + p.orbit) p.x = -p.orbit; if (p.y < -p.orbit) p.y = h + p.orbit; if (p.y > h + p.orbit) p.y = -p.orbit; }
  let animationFrame = requestAnimationFrame(draw);
  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth * devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * devicePixelRatio;
  });
}

function initTicker() {
  const root = elements.tickerRoot;
  const track = elements.tickerTrack;
  const toggle = elements.tickerToggle;
  if (!root || !track) return;
  track.innerHTML = track.innerHTML + track.innerHTML + track.innerHTML;
  requestAnimationFrame(() => {
    const totalWidth = Array.from(track.children).reduce((w, el) => w + el.getBoundingClientRect().width + 24, 0);
    const dur = Math.max(20, Math.round(totalWidth / 110));
    const style = document.createElement('style');
    style.textContent = `
      [data-ticker-track]{ animation: tickerScroll ${dur}s linear infinite; will-change: transform; }
      .ticker.is-paused [data-ticker-track]{ animation-play-state: paused; }
      @keyframes tickerScroll { from { transform: translateX(0) } to { transform: translateX(-${totalWidth/3}px) } }
    `;
    document.head.appendChild(style);
  });
  toggle?.addEventListener('click', () => {
    const paused = root.classList.toggle('is-paused');
    toggle.textContent = paused ? '▶' : '❚❚';
    toggle.setAttribute('aria-label', paused ? 'Play ticker' : 'Pause ticker');
    if (elements.tickerTrack) elements.tickerTrack.style.animationPlayState = paused ? 'paused' : 'running';
  });
}

const hospitals = [
  { id:'apollo',  name:'Apollo Hospitals, Greams Road', city:'Chennai',   img:'https://images.healthflo.org/hospitals/apollo-chennai-knee.jpg',
    tags:['Orthopedics','Cardio','Emergency'], menu:[
      { name:'Total Knee Replacement (Unilateral)', price:'₹1,85,000', meta:'Twin sharing • 2 bed-days' },
      { name:'Angiography',                         price:'₹18,000',   meta:'Daycare' }
    ]},
  { id:'manipal', name:'Manipal Hospital, Old Airport Rd', city:'Bengaluru', img:'https://images.healthflo.org/hospitals/manipal-blr-chole.jpg',
    tags:['General Surgery','Neuro'], menu:[
      { name:'Laparoscopic Cholecystectomy', price:'₹68,000', meta:'1 bed-day (twin)' }
    ]},
  { id:'aster',   name:'Aster Prime', city:'Hyderabad', img:'https://images.healthflo.org/hospitals/aster-hyd-obs.jpg',
    tags:['Obstetrics','NICU'], menu:[
      { name:'Normal Delivery', price:'₹52,000', meta:'Mother + newborn • 2D' }
    ]}
];

function renderDirectory() {
  if (!elements.dirGrid) return;
  elements.dirGrid.innerHTML = hospitals.map(h=>`
    <article class="dir-card" data-reveal>
      <img alt="${h.name}" src="${h.img}">
      <div class="dir-body">
        <h4 class="text-lg font-bold">${h.name}</h4>
        <small style="color:var(--color-subtle)">${h.city}</small>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${h.tags.map(t=>`<span class="dir-tag">${t}</span>`).join('')}
        </div>
        <div class="dir-actions">
          <button class="btn btn-primary" data-open-menu="${h.id}">View menu</button>
          <a class="btn btn-ghost" href="patient.html#cashless">Start cashless</a>
          <a class="btn btn-ghost" href="patient.html#ambulance">Ambulance</a>
        </div>
      </div>
    </article>
  `).join('');
  observeRevealElements();
}

function openMenu(id) {
  const h = hospitals.find(x=>x.id===id); if (!h || !elements.dirModal) return;
  elements.dirTitle.textContent = `${h.name} — Packages`;
  elements.dirMenu.innerHTML = h.menu.map(m => `
    <div class="menu-row">
      <div><strong>${m.name}</strong><br><small style="color:var(--color-subtle)">${m.meta||''}</small></div>
      <div class="menu-price">${m.price}</div>
      <a class="btn btn-primary" href="patient.html#cashless">Select</a>
    </div>
  `).join('');
  elements.dirModal.hidden = false;
}
function closeMenu() { if (elements.dirModal) elements.dirModal.hidden = true; }

function initLeadToggle() {
  if (!elements.leadToggle || !elements.leadAside) return;
  const closePanel = () => {
    elements.leadAside.classList.remove('is-open');
    elements.leadPanel.hidden = true;
    elements.leadToggle.setAttribute('aria-expanded', 'false');
  };
  const openPanel = () => {
    elements.leadAside.classList.add('is-open');
    elements.leadPanel.hidden = false;
    elements.leadToggle.setAttribute('aria-expanded', 'true');
  };
  closePanel();
  elements.leadToggle.addEventListener('click', () => {
    const isOpen = elements.leadAside.classList.toggle('is-open');
    elements.leadPanel.hidden = !isOpen;
    elements.leadToggle.setAttribute('aria-expanded', String(isOpen));
  });
  $$('a[href="#lead"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openPanel(); elements.leadAside.scrollIntoView({ behavior: 'smooth', block: 'end' }); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.leadAside.classList.contains('is-open')) closePanel(); });
}

function initLeadForm() {
  elements.leadForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      analytics.track('lead_submitted', { fields: Array.from(formData.keys()) });
      form.reset();
      toast('<strong>Command received.</strong> A specialist will respond shortly.');
      if (elements.leadPanel && form.closest('#lead')) elements.leadPanel.hidden = true;
    });
  });
}

function initCopilot() {
  if (!elements.copilotBtn || !elements.copilotModal) return;
  const open = () => { elements.copilotModal.hidden = false; analytics.track('copilot_opened'); };
  const close = () => { elements.copilotModal.hidden = true; };
  elements.copilotBtn.addEventListener('click', open);
  elements.copilotClose.forEach((btn) => btn.addEventListener('click', close));
  elements.copilotModal.addEventListener('click', (event) => { if (event.target.dataset?.copilotClose !== undefined || event.target === elements.copilotModal) close(); });
  elements.copilotChips.addEventListener('click', (event) => {
    const chip = event.target.closest('.copilot-chip'); if (!chip) return;
    elements.copilotChips.querySelectorAll('.copilot-chip').forEach((btn) => btn.classList.remove('is-active'));
    chip.classList.add('is-active');
    if (elements.copilotOutput) {
      elements.copilotOutput.innerHTML = `<p><strong>${chip.textContent}</strong><br/>Copilot drafts AI-personalized guidance for your request.</p>`;
    }
    analytics.track('copilot_prompt_selected', { prompt: chip.textContent });
  });
}

function initCTAs() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-cta]');
    if (!target) return;
    const label = target.dataset.cta || target.textContent.trim();
    analytics.track('cta_clicked', { cta_label: label });
  });
  elements.dirGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-menu]');
    if (btn) openMenu(btn.getAttribute('data-open-menu'));
  });
  elements.dirModal?.addEventListener('click', (e) => { if (e.target.hasAttribute('data-dir-close')) closeMenu(); });
}

function initHowSteps() {
  const steps = elements.stepsHost?.querySelectorAll('li');
  if (!steps || !elements.howProgress) return;
  const total = steps.length;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = Array.from(steps).indexOf(entry.target) + 1;
        const pct = (index / total) * 100;
        elements.howProgress.style.width = `${pct}%`;
      }
    });
  }, { threshold: 0.5 });
  steps.forEach((s) => observer.observe(s));
}

function toast(html) {
  const d = document.createElement('div');
  d.className = 'copilot-output';
  d.style.position = 'fixed';
  d.style.right = '24px';
  d.style.bottom = '24px';
  d.style.maxWidth = '320px';
  d.innerHTML = html;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}

function boot() {
  setTheme(state.theme);
  elements.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice)));

  initNav();
  initLeadToggle();
  initLeadForm();
  initCTAs();
  initCopilot();
  initRipple();
  initReveal();
  initCanvas();
  initTicker();
  initHowSteps();
  renderDirectory();

  $$('[data-dir-close]').forEach(b => b.addEventListener('click', closeMenu));
}

document.addEventListener('DOMContentLoaded', boot);
