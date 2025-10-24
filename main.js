/* Utilities */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  persona: 'patient',
  theme: 'cosmic'
};

/* Inline SVG icons for steps (stroke follows currentColor) */
function iconSVG(name) {
  const base = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const wrap = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${base} d="${d}"/></svg>`;
  switch (name) {
    case 'upload':      return wrap('M12 16V4m0 0l-3.5 3.5M12 4l3.5 3.5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2');
    case 'decode':      return wrap('M4 6h10M4 12h16M4 18h8M18 6l2 2-6 6');
    case 'cashless':    return wrap('M5 12l5 5L19 7M3 7h7l2 3h9');
    case 'scan':        return wrap('M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3');
    case 'launch':      return wrap('M5 19l5-1 9-9a3 3 0 00-4-4l-9 9-1 5zM15 5l4 4');
    case 'prevent':     return wrap('M12 21c-4.97 0-9-4.03-9-9 0-1.5.37-2.91 1.03-4.15L12 12l7.97-4.15A8.96 8.96 0 0121 12c0 4.97-4.03 9-9 9z');
    default:            return wrap('M4 12h16');
  }
}

/* Personas (Insurer removed) */
const personaConfig = {
  patient: {
    heroCta: 'Decode My Policy →',
    headerCta: 'Decode my policy',
    solutionsTitle: 'Get care on your terms',
    solutionsCopy: 'Where HealthFlo shines when you need transparent cashless care and zero surprises.',
    quote: '“Pre-auth moved from 36h to same-day. The concierge kept us updated without a single follow-up call.” — Caregiver, Bengaluru',
    howCopy: 'Upload policy → decode coverage → we run cashless & update you',
    riskCopy: 'Patients: Policy decode is free. Concierge activates only after you approve the estimated out-of-pocket.',
    pricingCopy: 'Patients: Core tools free; concierge optional.',
    pricingDetails: [
      { title: 'Policy decoder', body: 'Free forever for PDF uploads across major insurers. Includes room rent caps, co-pay, PED, and non-payables.' },
      { title: 'Concierge', body: 'Optional add-on per case. Covers document prep, TPA coordination, admission through discharge, and appeals if needed.' },
      { title: 'City insights', body: 'Benchmark packages by hospital, specialty, and add-ons so you never overpay for cashless care.' }
    ],
    pillars: [
      { title: 'Clarity before care',  copy: 'Package-first pricing, decoded inclusions/exclusions, and city-wise comparisons before you step into the hospital.' },
      { title: 'Velocity when it counts', copy: 'AI-prepared pre-auth kits and WhatsApp nudges keep your case moving—even for compliant pre-network cashless.' },
      { title: 'Recovery & prevention', copy: 'Structured appeals, non-payable checklists, and ombudsman support to recover shortfalls.' }
    ],
    solutionsCards: [
      { title: 'Know your coverage', description: 'Upload PDF → see room rent caps, co-pay, waiting periods, and non-payables in plain language.', cta: 'Decode in 2 minutes →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-1.webp', analytics: 'policy_decode' },
      { title: 'Treatment packages', description: 'Transparent bundles by city & specialty. Add-ons like private room or ICU buffer spelled out.', cta: 'Browse packages →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-5.webp', analytics: 'browse_packages' },
      { title: 'Cashless concierge', description: 'We prep docs, coordinate TPA, and keep you updated on WhatsApp while you focus on recovery.', cta: 'Start cashless →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-6.webp', analytics: 'start_cashless' },
      { title: 'Denials & short settlements', description: 'Structured appeals, ombudsman support, and escalation templates for any shortfall.', cta: 'Get help →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-7.webp', analytics: 'denial_help' }
    ],
    // UPDATED: Iconed steps per your spec
    steps: [
      { title: 'Register with HealthFlo', icon: 'upload',  copy: 'Choose Demo (limited access) or Pro (full concierge). Create your account.' },
      { title: 'Upload policy & create profile', icon: 'decode', copy: 'Add dependents once; we decode coverage and set your guardrails.' },
      { title: 'Care across India, from your palm', icon: 'cashless', copy: 'Packages, cashless helpdesk, reimbursements, pharmacy, labs, physio & more.' }
    ],
    leadTitle: 'Decode my policy with a specialist',
    leadFields: [
      { label: 'Email or WhatsApp', name: 'contact', type: 'text', placeholder: 'you@email.com / +91 98xxxxxxx', required: true },
      { label: 'City', name: 'city', type: 'text', placeholder: 'e.g. Chennai', required: true }
    ],
    showFileUpload: true,
    copilotCopy: 'Summarize my policy',
    copilotPrompts: ['Summarize my policy','Highlight non-payables','Estimate my out-of-pocket','List PED & waiting periods'],
    whatsappText: 'Hi, I’d like a 2-min summary of my policy (PDF attached). City: {{city}}.',
    showPackages: true,
    leadToggleLabel: 'Decode my policy'
  },

  hospital: {
    heroCta: 'Launch RCM Cockpit →',
    headerCta: 'Launch cockpit',
    solutionsTitle: 'Revenue acceleration for hospitals',
    solutionsCopy: 'Compress AR days, expand compliant cashless, and recover denials with connected hospital playbooks.',
    quote: '“Cashless approvals moved from days to hours. The dashboard keeps finance and nursing in sync.” — RCM Head, 250-bed hospital, Chennai',
    howCopy: 'Baseline & gap scan → launch cashless/empanelment → denial prevention + cockpit',
    riskCopy: 'Hospitals: If we miss agreed SLAs for two weeks in a row, we fund an extra ops sprint at no cost.',
    pricingCopy: 'Hospitals: Modular subscription (bed count + features) + optional recovery-share.',
    pricingDetails: [
      { title: 'Cashless Everywhere', body: 'Per-bed subscription covering intake, pre-auth prep, discharge kits, and escalation tracks.' },
      { title: 'Denial recovery', body: 'Recovery-share aligned to targeted denial categories with 98% average recovery on scoped claims.' },
      { title: 'RCM cockpit', body: 'Exception heatmaps, same-day %, AR reduction insights, and KPI reviews with finance weekly.' }
    ],
    pillars: [
      { title: 'Clarity before care',  copy: 'Package-first pricing and coverage decoders arm front-office teams before admission.' },
      { title: 'Velocity when it counts', copy: 'AI-prepared pre-auths and compliant cashless pathways, even in pre-network scenarios.' },
      { title: 'Recovery & prevention', copy: 'Denial playbooks, resubmission templates, and line-item reconciliation built into ops.' }
    ],
    solutionsCards: [
      { title: 'Cashless Everywhere', description: 'Managed & compliant cashless with admission-to-discharge SOPs and a 60-day post-empanelment runway.', cta: 'Enable now →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-2.webp', analytics: 'cashless_everywhere' },
      { title: 'Empanelment desk', description: '20+ insurers & TPAs with live trackers, SLA timers, and tariff governance built in.', cta: 'Expand network →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-8.webp', analytics: 'empanelment' },
      { title: 'Denial & recovery', description: 'Category playbooks, forensic audits, and recovery loops that return cash faster.', cta: 'Recover revenue →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-9.webp', analytics: 'denial_recovery' },
      { title: 'RCM cockpit', description: 'Pre-auth velocity, same-day %, and exception heatmaps to align finance and floor teams.', cta: 'Open dashboard →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-3.webp', analytics: 'rcm_cockpit' }
    ],
    steps: [
      { title: 'Baseline & gap scan', icon: 'scan', copy: 'Assess AR days, denial mix, and cashless readiness with our ops specialists.' },
      { title: 'Launch cashless & empanelment', icon: 'launch', copy: 'Deploy SOPs, trackers, and escalation guards across every desk.' },
      { title: 'Denial prevention + cockpit', icon: 'prevent', copy: 'Daily insights and recovery loops keep finance, nursing, and ops aligned.' }
    ],
    leadTitle: 'Unlock cashless velocity',
    leadFields: [
      { label: 'Name', name: 'name', type: 'text', placeholder: 'Your name', required: true },
      { label: 'Work email', name: 'email', type: 'email', placeholder: 'you@hospital.in', required: true },
      { label: 'Bed strength', name: 'beds', type: 'text', placeholder: 'e.g. 250', required: true }
    ],
    showFileUpload: false,
    copilotCopy: 'Find denial risk in today’s pre-auths',
    copilotPrompts: ['Find denial risk in today’s pre-auths','Show empanelment SLA breaches','Rank units by AR days drop','List cases needing doctor addenda'],
    whatsappText: 'Hi, I want to enable compliant cashless for [dept/TPA]. Beds: {{beds}}.',
    showPackages: false,
    leadToggleLabel: 'Unlock cashless'
  },

  employer: {
    heroCta: 'Design My Employee Plan →',
    headerCta: 'Design my plan',
    solutionsTitle: 'Corporate healthcare your team actually uses',
    solutionsCopy: 'Design plans, issue e-cards, and support employees with concierge guidance from day one.',
    quote: '“E-cards in minutes. Employees actually used benefits.” — HR Lead, 1,200 staff, Bengaluru',
    howCopy: 'Design plan → enroll & issue e-cards → concierge & analytics',
    riskCopy: 'Employers: If e-cards aren’t issued within 48h of clean data, first-month platform fee is waived.',
    pricingCopy: 'Employers: Broker-assisted plan + platform per-employee; wellness add-ons.',
    pricingDetails: [
      { title: 'Plan design', body: 'Model benefits by census & budget with maternity, OPD, and parent riders in one workspace.' },
      { title: 'Cashless helpdesk', body: 'Live pre-auth support prevents shortfalls and keeps HR updates in one trail.' },
      { title: 'HR analytics', body: 'Utilisation trends, top claim categories, SLA tracking, and adoption insights (78% avg.).' }
    ],
    pillars: [
      { title: 'Clarity before care',  copy: 'Plan comparisons, coverage decoders, and census modelling for leadership sign-off.' },
      { title: 'Velocity when it counts', copy: 'Same-day e-cards, concierge guidance, and WhatsApp updates to avoid surprises.' },
      { title: 'Recovery & prevention', copy: 'Denial playbooks, reimbursement templates, and renewal-ready analytics.' }
    ],
    solutionsCards: [
      { title: 'Plan design', description: 'Model benefits by census & budget. Layer maternity, OPD, and parent riders instantly.', cta: 'Design my plan →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/university-computers.webp', analytics: 'plan_design' },
      { title: 'Seamless enrollment', description: 'Bulk import employees, push e-cards in minutes, and sync with HRIS/Payroll.', cta: 'Onboard fast →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/Clinical%20knowledge%20hub%20bg.webp', analytics: 'enrollment' },
      { title: 'Cashless helpdesk', description: 'Live pre-auth guidance and WhatsApp updates prevent shortfalls and confusion.', cta: 'Protect employees →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-12.webp', analytics: 'cashless_helpdesk' },
      { title: 'HR analytics', description: 'Utilisation trends, top claim categories, SLA tracking, and wellness nudges.', cta: 'See HR dashboard →', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-3.webp', analytics: 'hr_analytics' }
    ],
    steps: [
      { title: 'Design plan', icon: 'launch', copy: 'Model census, riders, and budgets with actuarial guardrails.' },
      { title: 'Enroll & issue e-cards', icon: 'upload', copy: 'Bulk import employees, auto-issue cards, and automate communication.' },
      { title: 'Concierge & analytics', icon: 'prevent', copy: 'Cashless helpdesk plus dashboards for utilisation anomalies and renewal prep.' }
    ],
    leadTitle: 'Design a plan employees will love',
    leadFields: [
      { label: 'Headcount band', name: 'headcount', type: 'text', placeholder: 'e.g. 201-500', required: true },
      { label: 'Work email', name: 'email', type: 'email', placeholder: 'you@company.com', required: true },
      { label: 'Target go-live month', name: 'golive', type: 'text', placeholder: 'e.g. July 2026', required: true }
    ],
    showFileUpload: false,
    copilotCopy: 'Show utilization anomalies this month',
    copilotPrompts: ['Show utilization anomalies this month','Summarize top claim categories','List employees needing follow-up','Preview renewal guardrails'],
    whatsappText: 'Hi, we’re {{headcount}} and exploring plan design for {{golive}}.',
    showPackages: false,
    leadToggleLabel: 'Design my plan'
  }
};

/* Elements */
const elements = {
  body: document.body,
  docEl: document.documentElement,
  personaButtons: $$('[data-persona]'),
  heroPrimary: $('[data-persona-label]'),
  headerPrimary: $('[data-cta="header-primary"]'),
  whatsappTriggers: $$('[data-whatsapp-trigger]'),
  quote: $('[data-quote]'),
  pillarsHost: $('[data-pillars]'),
  solutionTitle: $('[data-solutions-title]'),
  solutionCopy: $('[data-solutions-copy]'),
  solutionGrid: $('[data-solution-grid]'),
  packagesBlock: $('[data-packages]'),
  packagesGrid: $('[data-package-grid]'),
  howCopy: $('[data-how-copy]'),
  stepsHost: $('[data-steps]'),
  pricingCopy: $('[data-pricing-copy]'),
  pricingGrid: $('[data-pricing-grid]'),
  riskCopy: $('[data-risk-copy]'),
  /* Lead */
  leadAside: $('#lead'),
  leadToggle: $('[data-lead-toggle]'),
  leadToggleLabel: $('[data-lead-toggle-label]'),
  leadPanel: $('#lead-panel'),
  leadForm: $('[data-lead-form]'),
  leadTitle: $('[data-lead-title]'),
  leadFields: $('[data-lead-fields]'),
  leadFileUpload: $('[data-file-upload]'),
  leadWhatsapp: $('[data-lead-whatsapp]'),
  /* Copilot + Theme + Canvas */
  copilotBtn: $('[data-copilot]'),
  copilotModal: $('[data-copilot-modal]'),
  copilotClose: $$('[data-copilot-close]'),
  copilotCopy: $('[data-copilot-copy]'),
  copilotChips: $('[data-copilot-chips]'),
  copilotOutput: $('[data-copilot-output]'),
  themeButtons: $$('[data-theme-choice]'),
  heroCanvas: $('#heroCanvas'),
};

/* Analytics stub */
const analytics = {
  track: (event, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    const data = { event, ...payload, timestamp: Date.now() };
    window.dataLayer.push(data);
    if (window.console && console.info) console.info('[analytics]', event, payload);
  }
};

/* Theme */
function setTheme(theme, { track = true } = {}) {
  if (!theme || !personaConfig[state.persona]) return;
  state.theme = theme;
  elements.docEl.dataset.theme = theme;
  localStorage.setItem('healthfloTheme', theme);
  elements.themeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.themeChoice === theme));
  if (track) analytics.track('theme_changed', { theme });
}

/* Persona */
function setPersona(persona, { skipTracking = false } = {}) {
  if (!personaConfig[persona]) persona = 'patient';
  state.persona = persona;
  elements.body.dataset.persona = persona;
  elements.personaButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.persona === persona);
    btn.setAttribute('aria-pressed', btn.dataset.persona === persona);
  });
  localStorage.setItem('healthfloPersona', persona);
  if (!skipTracking) {
    analytics.track('persona_selected', { role: persona });
    window.dispatchEvent(new CustomEvent('persona_selected', { detail: { role: persona } }));
  }
  renderPersonaContent();
}

/* Persona-aware rendering */
function renderPersonaContent() {
  const config = personaConfig[state.persona];
  if (!config) return;

  if (elements.heroPrimary)  elements.heroPrimary.textContent = config.heroCta;
  if (elements.headerPrimary) elements.headerPrimary.textContent = config.headerCta;
  if (elements.quote)        elements.quote.textContent = config.quote;
  if (elements.solutionTitle) elements.solutionTitle.textContent = config.solutionsTitle;
  if (elements.solutionCopy)  elements.solutionCopy.textContent = config.solutionsCopy;
  if (elements.howCopy)       elements.howCopy.textContent = config.howCopy || config.steps.map((s) => s.title).join(' → ');
  if (elements.pricingCopy)   elements.pricingCopy.textContent = config.pricingCopy;
  if (elements.riskCopy)      elements.riskCopy.textContent = config.riskCopy;
  if (elements.leadTitle)     elements.leadTitle.textContent = config.leadTitle;
  if (elements.copilotCopy)   elements.copilotCopy.textContent = config.copilotCopy;

  if (elements.leadToggleLabel) elements.leadToggleLabel.textContent = config.leadToggleLabel || 'Get started';

  renderPillars(config.pillars);
  renderSolutions(config.solutionsCards, config.showPackages);
  renderSteps(config.steps);
  renderPricing(config.pricingDetails);
  renderLeadFields(config);
  renderCopilot(config.copilotPrompts);
  updatePackagesVisibility(config.showPackages);
  updateWhatsapp(config.whatsappText);
  observeRevealElements();
}

/* Sections */
function renderPillars(pillars = []) {
  if (!elements.pillarsHost) return;
  elements.pillarsHost.innerHTML = '';
  pillars.forEach((pillar) => {
    const card = document.createElement('article');
    card.className = 'pillar-card';
    card.setAttribute('data-reveal', '');
    card.innerHTML = `<h3>${pillar.title}</h3><p>${pillar.copy}</p>`;
    elements.pillarsHost.appendChild(card);
  });
}

function renderSolutions(cards = [], showPackages = false) {
  if (!elements.solutionGrid) return;
  elements.solutionGrid.innerHTML = '';
  cards.forEach((card) => {
    const article = document.createElement('article');
    article.className = 'solution-card';
    article.setAttribute('data-reveal', '');
    article.innerHTML = `
      <figure><img src="${card.image}" alt="${card.title}" loading="lazy" /></figure>
      <div>
        <h3>${card.title}</h3>
        <p>${card.description}</p>
      </div>
      <button class="btn btn-ghost" type="button" data-card-cta data-analytics="${card.analytics}">${card.cta}</button>
    `;
    elements.solutionGrid.appendChild(article);
  });
  if (elements.packagesBlock) {
    elements.packagesBlock.hidden = !showPackages;
    elements.packagesBlock.setAttribute('aria-hidden', showPackages ? 'false' : 'true');
  }
  renderPackages();
}

function renderPackages() {
  if (!elements.packagesGrid) return;
  const config = personaConfig[state.persona];
  if (!config || !config.showPackages) {
    elements.packagesGrid.innerHTML = '';
    return;
  }
  const packages = (window.healthfloImages && window.healthfloImages.patientPackages) || [];
  elements.packagesGrid.innerHTML = '';
  packages.forEach((pkg) => {
    const card = document.createElement('article');
    card.className = 'package-card';
    card.setAttribute('data-reveal', '');
    const price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pkg.lead_price_inr);
    const tags = [pkg.city, pkg.specialty, pkg.cashless_eligible ? 'Cashless eligible' : 'Reimbursement'];
    card.innerHTML = `
      <img src="${pkg.image}" alt="${pkg.procedure} package" loading="lazy" />
      <div class="package-body">
        <h4>${pkg.procedure}</h4>
        <span class="hospital">${pkg.hospital}</span>
        <span class="price">Lead price: ${price}</span>
        <div class="tags">${tags.filter(Boolean).map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
        <p class="notes">${pkg.notes || ''}</p>
        <button class="btn btn-primary" type="button" data-cta="package-start" data-package-id="${pkg.id}">Start cashless →</button>
      </div>
    `;
    elements.packagesGrid.appendChild(card);
  });
}

/* REPLACED: richer steps with icons + animations */
function renderSteps(steps = []) {
  if (!elements.stepsHost) return;
  elements.stepsHost.innerHTML = '';

  steps.forEach((step, idx) => {
    const li = document.createElement('li');
    li.className = 'step-card step-card--how';
    li.setAttribute('data-reveal', '');
    li.style.setProperty('--i', String(idx)); // stagger
    li.innerHTML = `
      <div class="step-icon">${iconSVG(step.icon)}</div>
      <div class="step-copy">
        <h3>${step.title}</h3>
        <p>${step.copy}</p>
      </div>
    `;
    elements.stepsHost.appendChild(li);
  });

  initHowUX(); // animations, progress, tilt
}

function renderPricing(items = []) {
  if (!elements.pricingGrid) return;
  elements.pricingGrid.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'pricing-card';
    card.setAttribute('data-reveal', '');
    card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>`;
    elements.pricingGrid.appendChild(card);
  });
}

function renderLeadFields(config) {
  if (!elements.leadFields || !config) return;
  elements.leadFields.innerHTML = '';
  config.leadFields.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field';
    const inputEl = document.createElement('input');
    const id = `lead-${field.name}`;
    inputEl.type = field.type;
    inputEl.name = field.name;
    inputEl.placeholder = field.placeholder || '';
    inputEl.id = id;
    if (field.required !== false) inputEl.required = true;
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = field.label;
    wrapper.appendChild(label);
    wrapper.appendChild(inputEl);
    elements.leadFields.appendChild(wrapper);
  });
  if (elements.leadFileUpload) {
    elements.leadFileUpload.hidden = !config.showFileUpload;
    elements.leadFileUpload.setAttribute('aria-hidden', config.showFileUpload ? 'false' : 'true');
  }
}

/* Copilot chips */
function renderCopilot(prompts = []) {
  if (!elements.copilotChips) return;
  elements.copilotChips.innerHTML = '';
  prompts.forEach((prompt, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copilot-chip';
    btn.textContent = prompt;
    btn.dataset.promptIndex = String(index);
    elements.copilotChips.appendChild(btn);
  });
  if (elements.copilotOutput) {
    elements.copilotOutput.innerHTML = '<p>Select a prompt to preview how Copilot guides you.</p>';
  }
}

/* Packages visibility + WhatsApp helpers */
function updatePackagesVisibility(show) {
  if (!elements.packagesBlock) return;
  elements.packagesBlock.hidden = !show;
  elements.packagesBlock.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function updateWhatsapp(text) {
  elements.whatsappTriggers.forEach((btn) => {
    btn.onclick = (event) => {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      analytics.track('whatsapp_optin', { role: state.persona });
      const personalized = personalizeWhatsapp(text);
      const encoded = encodeURIComponent(personalized);
      window.dispatchEvent(new CustomEvent('whatsapp_optin', { detail: { role: state.persona } }));
      const url = `https://wa.me/919940207670?text=${encoded}`;
      window.open(url, '_blank', 'noopener');
    };
  });
}
function personalizeWhatsapp(template) {
  if (!template) return '';
  if (!elements.leadForm) return template.replace(/{{([^}]+)}}/g, '____');
  const formData = new FormData(elements.leadForm);
  return template.replace(/{{([^}]+)}}/g, (_, key) => {
    const value = (formData.get(key.trim()) || '').toString().trim();
    return value || '____';
  });
}

/* THEME + NAV */
function initTheme() {
  const stored = localStorage.getItem('healthfloTheme');
  const theme = stored || state.theme;
  setTheme(theme, { track: false });
  elements.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice)));
}
function initPersona() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = (params.get('utm_persona') || params.get('persona') || '').toLowerCase();
  const stored = localStorage.getItem('healthfloPersona');
  const storedPersona = (stored || '').toLowerCase();
  const persona = personaConfig[fromQuery] ? fromQuery : (personaConfig[storedPersona] ? storedPersona : 'patient');
  setPersona(persona, { skipTracking: true });
  renderPersonaContent();
  elements.personaButtons.forEach((btn) => btn.addEventListener('click', () => setPersona(btn.dataset.persona)));
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

/* ======= Expandable Lead Panel ======= */
function openLeadPanel({ focusFirstField = true, track = true } = {}) {
  if (!elements.leadAside || !elements.leadPanel || !elements.leadToggle) return;
  elements.leadAside.classList.add('is-open');
  elements.leadAside.classList.remove('is-collapsed');
  elements.leadPanel.hidden = false;
  elements.leadToggle.setAttribute('aria-expanded', 'true');
  localStorage.setItem('healthfloLeadOpen', '1');
  if (track) analytics.track('lead_panel_opened', { role: state.persona });
  if (focusFirstField && elements.leadFields) {
    const input = elements.leadFields.querySelector('input,select,textarea');
    if (input) setTimeout(() => input.focus({ preventScroll: true }), 150);
  }
}
function closeLeadPanel({ track = true } = {}) {
  if (!elements.leadAside || !elements.leadPanel || !elements.leadToggle) return;
  elements.leadAside.classList.remove('is-open');
  elements.leadAside.classList.add('is-collapsed');
  elements.leadToggle.setAttribute('aria-expanded', 'false');
  setTimeout(() => {
    if (!elements.leadAside.classList.contains('is-open')) elements.leadPanel.hidden = true;
  }, 360);
  localStorage.setItem('healthfloLeadOpen', '0');
  if (track) analytics.track('lead_panel_closed', { role: state.persona });
}
function toggleLeadPanel() {
  if (elements.leadAside?.classList.contains('is-open')) closeLeadPanel({ track: true });
  else openLeadPanel({ track: true });
}

function initLeadToggle() {
  if (!elements.leadToggle || !elements.leadAside) return;
  const persisted = localStorage.getItem('healthfloLeadOpen');
  if (persisted === '1') { closeLeadPanel({ track: false }); } else { closeLeadPanel({ track: false }); }
  elements.leadToggle.addEventListener('click', toggleLeadPanel);

  document.addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key.toLowerCase() === 'l') toggleLeadPanel();
    if (e.key === 'Escape' && elements.leadAside.classList.contains('is-open')) closeLeadPanel();
  });

  $$('a[href="#lead"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openLeadPanel();
      elements.leadAside.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  });

  if (location.hash === '#lead') openLeadPanel({ focusFirstField: false });
}

/* Lead form */
function initLeadForm() {
  if (!elements.leadForm) return;
  elements.leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(elements.leadForm);
    const payload = { role: state.persona, fields: Array.from(formData.keys()) };
    analytics.track('lead_submitted', payload);
    window.dispatchEvent(new CustomEvent('lead_submitted', { detail: payload }));
    elements.leadForm.reset();
    const toast = document.createElement('div');
    toast.className = 'copilot-output';
    toast.style.position = 'fixed';
    toast.style.right = '24px';
    toast.style.bottom = '24px';
    toast.style.maxWidth = '320px';
    toast.innerHTML = '<strong>Thanks!</strong> A specialist will reach out shortly.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
    closeLeadPanel();
  });
  const altButton = elements.leadForm.querySelector('[data-cta="playbook"]');
  if (altButton) {
    altButton.addEventListener('click', () => {
      analytics.track('cta_clicked', { role: state.persona, cta_label: 'playbook' });
      if (elements.copilotOutput) {
        elements.copilotOutput.innerHTML = '<p>Playbook sent! Check your inbox for a 3-slide summary curated for your city & specialty.</p>';
      }
    });
  }
}

/* CTA analytics + ripple targets */
function initCTAs() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-cta], [data-card-cta]');
    if (!target) return;
    const label = target.dataset.cta || target.dataset.analytics || target.textContent.trim();
    const payload = { role: state.persona, cta_label: label };
    analytics.track('cta_clicked', payload);
  });
}

/* Copilot */
function initCopilot() {
  if (!elements.copilotBtn || !elements.copilotModal) return;
  const open = () => { elements.copilotModal.hidden = false; analytics.track('copilot_opened', { role: state.persona }); };
  const close = () => { elements.copilotModal.hidden = true; };
  elements.copilotBtn.addEventListener('click', open);
  elements.copilotClose.forEach((btn) => btn.addEventListener('click', close));
  elements.copilotModal.addEventListener('click', (event) => { if (event.target === elements.copilotModal) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.copilotModal.hidden) close(); });
  elements.copilotChips.addEventListener('click', (event) => {
    const chip = event.target.closest('.copilot-chip'); if (!chip) return;
    elements.copilotChips.querySelectorAll('.copilot-chip').forEach((btn) => btn.classList.remove('is-active'));
    chip.classList.add('is-active');
    if (elements.copilotOutput) {
      elements.copilotOutput.innerHTML = `<p><strong>${chip.textContent}</strong><br/>Here’s how Copilot responds for ${state.persona} personas with actionable next steps.</p>`;
    }
    analytics.track('copilot_prompt_selected', { role: state.persona, prompt: chip.textContent });
  });
}

/* Ripple */
function initRipple() {
  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest('.btn, .persona-option, .copilot-chip, [data-theme-choice], .lead-toggle');
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

/* Reveal on scroll */
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

/* Hero canvas */
function initCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { canvas.style.display = 'none'; return; }
  let width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  let height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
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
      context.fillStyle = 'rgba(255, 138, 69, 0.3)'; context.beginPath(); context.arc(p.x, p.y, p.size*1.5, 0, Math.PI*2); context.fill();
    });
    context.restore();
    animationFrame = requestAnimationFrame(draw);
  }
  function wrap(p, w, h) { if (p.x < -p.orbit) p.x = w + p.orbit; if (p.x > w + p.orbit) p.x = -p.orbit; if (p.y < -p.orbit) p.y = h + p.orbit; if (p.y > h + p.orbit) p.y = -p.orbit; }
  let animationFrame = requestAnimationFrame(draw);
  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  });
}

/* HOW: reveal on view, 3D tilt on hover, scroll-linked progress */
function initHowUX() {
  const cards = $$('.step-card--how');
  if (!cards.length) return;

  // In-view stagger reveal
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });
  cards.forEach(c => obs.observe(c));

  // 3D tilt micro-interaction
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) / r.width;   // -0.5..0.5
      const dy = (e.clientY - (r.top + r.height/2)) / r.height;  // -0.5..0.5
      card.style.setProperty('--ry', `${dx * 6}deg`);
      card.style.setProperty('--rx', `${-dy * 6}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--ry', `0deg`);
      card.style.setProperty('--rx', `0deg`);
    });
  });

  // Scroll progress for "How it works"
  const bar = $('.how-progress');
  const section = $('#how');
  const onScroll = () => {
    if (!section || !bar) return;
    const rect = section.getBoundingClientRect();
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const start = Math.min(vh, Math.max(0, vh - rect.top));
    const total = rect.height + vh;
    const progress = Math.max(0, Math.min(1, start / total));
    bar.style.width = `${progress * 100}%`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

/* NEW: Infinite ticker init (areas we operate) */
function initTicker() {
  const track = $('[data-ticker-track]');
  if (!track) return;
  const viewport = track.parentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { track.style.animation = 'none'; return; }

  // Duplicate content until it comfortably exceeds 2x viewport width for a seamless loop
  let safety = 0;
  const original = track.innerHTML;
  while (track.scrollWidth < (viewport.offsetWidth * 2) && safety < 20) {
    track.insertAdjacentHTML('beforeend', original);
    safety++;
  }

  // Duration based on content width for consistent speed (~90px/s)
  const pxPerSec = 90;
  const duration = track.scrollWidth / pxPerSec;
  track.style.setProperty('--ticker-anim-duration', `${duration}s`);

  // Pause/Play control
  const toggle = $('[data-ticker-toggle]');
  const setBtn = (paused) => {
    if (!toggle) return;
    toggle.textContent = paused ? '▶' : '❚❚';
    toggle.setAttribute('aria-label', paused ? 'Play ticker' : 'Pause ticker');
  };
  if (toggle) {
    toggle.addEventListener('click', () => {
      track.classList.toggle('is-paused');
      setBtn(track.classList.contains('is-paused'));
    });
  }

  // Pause on hover/focus
  viewport.addEventListener('mouseenter', () => { track.classList.add('is-paused'); setBtn(true); });
  viewport.addEventListener('mouseleave', () => { track.classList.remove('is-paused'); setBtn(false); });
  viewport.addEventListener('focusin', () => { track.classList.add('is-paused'); setBtn(true); });
  viewport.addEventListener('focusout', () => { track.classList.remove('is-paused'); setBtn(false); });
}

/* Boot */
function boot() {
  initTheme();
  initPersona();
  initNav();
  initLeadToggle();
  initLeadForm();
  initCTAs();
  initCopilot();
  initRipple();
  initReveal();
  initCanvas();
  initTicker();           // NEW: run the infinite ticker
  renderPersonaContent();
}

document.addEventListener('DOMContentLoaded', boot);
