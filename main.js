/* =========================
   HealthFlo Landing – main.js
   ========================= */

/* ---------- Helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Routes / Targets ---------- */
const ROUTES = {
  PATIENT_APP_URL:   '/patient.html',
  HOSPITAL_APP_URL:  '/hospital.html',
  EMPLOYER_APP_URL:  '/employer.html',

  // Registration landing (you can point these at Google Forms/Apps Script web apps)
  PATIENT_REG_URL:   '/patient.html?signup=1',
  HOSPITAL_REG_URL:  '/hospital.html?signup=1',
  EMPLOYER_REG_URL:  '/employer.html?signup=1'
};

const state = {
  persona: 'patient',
  theme: localStorage.getItem('healthfloTheme') || 'cosmic'
};

/* ---------- Persona Config (content only; design unchanged) ---------- */
const personaConfig = {
  patient: {
    heroCta: 'Decode My Policy →',
    headerCta: 'Decode my policy',
    solutionsTitle: 'Get care on your terms',
    solutionsCopy: 'Where HealthFlo shines when you need transparent cashless care and zero surprises.',
    quote: '“Pre-auth moved from 36h to same-day. The concierge kept us updated without a single follow-up call.” — Caregiver, Bengaluru',
    howCopy: 'Register → Upload policy → decode coverage → run cashless & get updates',
    riskCopy: 'Policy decode is free. Concierge activates only after you approve the estimated out-of-pocket.',
    pricingCopy: 'Patients: Core tools free; concierge optional.',
    pricingDetails: [
      { title: 'Free account', body: 'Limited services. Single user. ₹99/year. Free for kids <5 and seniors ≥70.' },
      { title: 'Family (up to 4)', body: '₹250/year. One family ID, track members & claims in one place.' },
      { title: 'Family (5–6)', body: '₹550/year. Priority support. Concierge optional per case.' },
      { title: 'Note', body: 'Registration charge only. Paid services (reimbursement, pharmacy, investigations, physio, etc.) are billed separately.' }
    ],
    pillars: [
      { title: 'Clarity before care',  copy: 'Package-first pricing, decoded inclusions/exclusions, and city-wise comparisons.' },
      { title: 'Velocity when it counts', copy: 'AI-prepared pre-auth kits and WhatsApp nudges keep your case moving.' },
      { title: 'Recovery & prevention', copy: 'Structured appeals, non-payable checklists, and ombudsman support.' }
    ],
    solutionsCards: [
      { title: 'Know your coverage', description: 'Upload PDF → see room rent caps, co-pay, waiting periods, and non-payables in plain language.', cta: 'Decode in 60 seconds →', href: ROUTES.PATIENT_APP_URL + '?demo=1#coverage', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-1.webp', analytics: 'policy_decode' },
      { title: 'Treatment packages', description: 'Transparent bundles by city & specialty. Add-ons like private room or ICU buffer spelled out.', cta: 'Browse packages →', href: ROUTES.PATIENT_APP_URL + '?demo=1#packages', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-5.webp', analytics: 'browse_packages' },
      { title: 'Reimbursement concierge', description: 'We coordinate with TPA and keep you updated on WhatsApp / Mail while you recover.', cta: 'Start Reimbursement →', href: ROUTES.PATIENT_APP_URL + '?demo=1#reimbursement', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-6.webp', analytics: 'start_reimb' },
      { title: 'Financial Support', description: 'Zero-interest EMI (3 months) or standard loan. Check eligibility in under 60 minutes.', cta: 'Check eligibility →', href: ROUTES.PATIENT_APP_URL + '?demo=1#finance', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-1.webp', analytics: 'finance' },
      { title: 'Denials & short settlements', description: 'Structured appeals, ombudsman support, escalation templates.', cta: 'Get help →', href: ROUTES.PATIENT_APP_URL + '?demo=1#denials', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-7.webp', analytics: 'denial_help' },
      { title: 'Bills → Reimbursable check', description: 'Upload hospital bills and get a payable/non-payable split (demo).', cta: 'Try demo →', href: ROUTES.PATIENT_APP_URL + '?demo=1#bills', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-2.webp', analytics: 'bill_check' },
      { title: 'Book OPD / IP / ER', description: 'TOP specialists with hospital tariffs & coverage guardrails.', cta: 'Book now →', href: ROUTES.PATIENT_APP_URL + '?demo=1#consult', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-10.webp', analytics: 'book_consult' },
      { title: 'Medical Support', description: 'Upload your report, get a provisional summary & direction.', cta: 'Upload report →', href: ROUTES.PATIENT_APP_URL + '?demo=1#support', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-11.webp', analytics: 'med_support' },
      { title: 'Home visit tests (30% off)', description: 'Direct from hospital / partner labs. Slots 7am–8pm.', cta: 'Book a slot →', href: ROUTES.PATIENT_APP_URL + '?demo=1#home-tests', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-4.webp', analytics: 'home_tests' },
      { title: 'Medicines — same day', description: 'Hospital pharmacies or top partners nearby.', cta: 'Order now →', href: ROUTES.PATIENT_APP_URL + '?demo=1#meds', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-12.webp', analytics: 'meds' }
    ],
    steps: [
      { icon: '🆔', title: 'Register with HealthFlo', copy: 'Pick Demo (limited access) or Pro. Create your single-user or family account.' },
      { icon: '📄', title: 'Upload policy & create profile', copy: 'We auto-detect insurer/plan and decode caps, co-pays & waiting periods.' },
      { icon: '📲', title: 'Care at your fingertips', copy: 'Make medical services across India accessible from one simple interface.' }
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
    solutionsCopy: 'Compress AR days, expand compliant cashless, and recover denials.',
    quote: '“Cashless approvals moved from days to hours. The dashboard keeps finance and nursing in sync.” — RCM Head, 250-bed hospital, Chennai',
    howCopy: 'Baseline/gap scan → launch cashless & empanelment → denial prevention + cockpit',
    riskCopy: 'If we miss agreed SLAs for two weeks in a row, we fund an extra ops sprint at no cost.',
    pricingCopy: 'Modular subscription (bed count + features) + optional recovery-share.',
    pricingDetails: [
      { title: 'Cashless Everywhere', body: 'Per-bed subscription covering intake, pre-auth prep, discharge kits, escalations.' },
      { title: 'Denial recovery', body: 'Recovery-share aligned to targeted denial categories.' },
      { title: 'RCM cockpit', body: 'Same-day %, exception heatmaps, KPI reviews with finance weekly.' }
    ],
    pillars: [
      { title: 'Clarity before care',  copy: 'Package-first pricing and decoders arm front-office before admission.' },
      { title: 'Velocity when it counts', copy: 'AI-prepared pre-auths and compliant cashless pathways.' },
      { title: 'Recovery & prevention', copy: 'Denial playbooks, resubmission templates, line-item reconciliation.' }
    ],
    solutionsCards: [
      { title: 'Cashless Everywhere', description: 'Managed & compliant cashless with SOPs and trackers.', cta: 'Enable now →', href: ROUTES.HOSPITAL_APP_URL + '?demo=1', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-2.webp', analytics: 'cashless_everywhere' },
      { title: 'Empanelment desk', description: '20+ insurers & TPAs with SLA timers & tariff governance.', cta: 'Expand network →', href: ROUTES.HOSPITAL_APP_URL + '?demo=1#empanel', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-8.webp', analytics: 'empanelment' },
      { title: 'Denial & recovery', description: 'Category playbooks, audits, recovery loops.', cta: 'Recover revenue →', href: ROUTES.HOSPITAL_APP_URL + '?demo=1#denials', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-9.webp', analytics: 'denial_recovery' },
      { title: 'RCM cockpit', description: 'Pre-auth velocity, same-day %, exception heatmaps.', cta: 'Open dashboard →', href: ROUTES.HOSPITAL_APP_URL + '?demo=1#cockpit', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-3.webp', analytics: 'rcm_cockpit' }
    ],
    steps: [
      { icon: '🧭', title: 'Baseline & gap scan', copy: 'Assess AR days, denial mix, and cashless readiness.' },
      { icon: '🚀', title: 'Launch cashless & empanelment', copy: 'Deploy SOPs, trackers, escalations across desks.' },
      { icon: '📊', title: 'Denial prevention + cockpit', copy: 'Daily insights keep finance, nursing, ops aligned.' }
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
    solutionsCopy: 'Design plans, issue e-cards, and support employees with concierge guidance.',
    quote: '“E-cards in minutes. Employees actually used benefits.” — HR Lead, 1,200 staff, Bengaluru',
    howCopy: 'Design plan → enroll & issue e-cards → concierge & analytics',
    riskCopy: 'If e-cards aren’t issued within 48h of clean data, first-month platform fee is waived.',
    pricingCopy: 'Broker-assisted plan + platform per-employee; wellness add-ons.',
    pricingDetails: [
      { title: 'Plan design', body: 'Model benefits by census & budget with maternity, OPD, and parent riders.' },
      { title: 'Cashless helpdesk', body: 'Live pre-auth support prevents shortfalls and confusion.' },
      { title: 'HR analytics', body: 'Utilization trends, top claim categories, SLA tracking.' }
    ],
    pillars: [
      { title: 'Clarity before care',  copy: 'Plan comparisons & coverage decoders for leadership sign-off.' },
      { title: 'Velocity when it counts', copy: 'Same-day e-cards, concierge guidance, WhatsApp updates.' },
      { title: 'Recovery & prevention', copy: 'Reimbursement templates & renewal-ready analytics.' }
    ],
    solutionsCards: [
      { title: 'Plan design', description: 'Model census & riders instantly.', cta: 'Design my plan →', href: ROUTES.EMPLOYER_APP_URL + '?demo=1#plan', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/university-computers.webp', analytics: 'plan_design' },
      { title: 'Seamless enrollment', description: 'Bulk import employees, push e-cards in minutes.', cta: 'Onboard fast →', href: ROUTES.EMPLOYER_APP_URL + '?demo=1#enroll', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/Clinical%20knowledge%20hub%20bg.webp', analytics: 'enrollment' },
      { title: 'Cashless helpdesk', description: 'Live pre-auth guidance & updates.', cta: 'Protect employees →', href: ROUTES.EMPLOYER_APP_URL + '?demo=1#helpdesk', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/cat-12.webp', analytics: 'cashless_helpdesk' },
      { title: 'HR analytics', description: 'Utilisation trends, SLA tracking, adoption.', cta: 'See dashboard →', href: ROUTES.EMPLOYER_APP_URL + '?demo=1#analytics', image: 'https://storage.googleapis.com/dev_resources_voka_io_303011/common/guide-3.webp', analytics: 'hr_analytics' }
    ],
    steps: [
      { icon: '🧮', title: 'Design plan', copy: 'Model census, riders, and budgets with guardrails.' },
      { icon: '🪪', title: 'Enroll & issue e-cards', copy: 'Bulk import, auto-issue, and automate comms.' },
      { icon: '📈', title: 'Concierge & analytics', copy: 'Helpdesk + dashboards for renewal prep.' }
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

/* ---------- Elements ---------- */
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
  howProgress: $('.how-progress'),
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
  /* Ticker */
  tickerRoot: $('#ticker'),
  tickerTrack: $('[data-ticker-track]'),
  tickerToggle: $('[data-ticker-toggle]'),
  /* Directory */
  dirGrid: $('[data-dir-grid]'),
  dirModal: $('[data-dir-modal]'),
  dirTitle: $('[data-dir-title]'),
  dirMenu: $('[data-dir-menu]')
};

/* ---------- Analytics stub ---------- */
const analytics = {
  track: (event, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    const data = { event, ...payload, timestamp: Date.now() };
    window.dataLayer.push(data);
    if (window.console && console.info) console.info('[analytics]', event, payload);
  }
};

/* ---------- Theme ---------- */
function setTheme(theme, { track = true } = {}) {
  if (!theme) return;
  state.theme = theme;
  elements.docEl.dataset.theme = theme;
  localStorage.setItem('healthfloTheme', theme);
  elements.themeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.themeChoice === theme));
  if (track) analytics.track('theme_changed', { theme });
}

/* ---------- Persona ---------- */
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

/* ---------- Rendering ---------- */
function renderPersonaContent() {
  const config = personaConfig[state.persona];
  if (!config) return;

  if (elements.heroPrimary)    elements.heroPrimary.textContent = config.heroCta;
  if (elements.headerPrimary)  elements.headerPrimary.textContent = config.headerCta;
  if (elements.quote)          elements.quote.textContent = config.quote;
  if (elements.solutionTitle)  elements.solutionTitle.textContent = config.solutionsTitle;
  if (elements.solutionCopy)   elements.solutionCopy.textContent = config.solutionsCopy;
  if (elements.howCopy)        elements.howCopy.textContent = config.howCopy || config.steps.map((s) => s.title).join(' → ');
  if (elements.pricingCopy)    elements.pricingCopy.textContent = config.pricingCopy;
  if (elements.riskCopy)       elements.riskCopy.textContent = config.riskCopy;
  if (elements.leadTitle)      elements.leadTitle.textContent = config.leadTitle;
  if (elements.copilotCopy)    elements.copilotCopy.textContent = config.copilotCopy;
  if (elements.leadToggleLabel) elements.leadToggleLabel.textContent = config.leadToggleLabel || 'Get started';

  renderPillars(config.pillars);
  renderSolutions(config.solutionsCards, config.showPackages);
  renderSteps(config.steps);
  renderPricing(config.pricingDetails);
  renderLeadFields(config);
  renderCopilot(config.copilotPrompts);
  updatePackagesVisibility(config.showPackages);
  updateWhatsapp(config.whatsappText);
  renderDirectory(); // hospitals directory always visible
  observeRevealElements();
}

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
      <a class="btn btn-ghost" ${card.href ? `href="${card.href}"` : ''} data-card-cta data-analytics="${card.analytics}">${card.cta}</a>
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
        <a class="btn btn-primary" href="${ROUTES.PATIENT_APP_URL}?demo=1#cashless" data-cta="package-start" data-package-id="${pkg.id}">Start cashless →</a>
      </div>
    `;
    elements.packagesGrid.appendChild(card);
  });
}

function renderSteps(steps = []) {
  if (!elements.stepsHost) return;
  elements.stepsHost.innerHTML = '';
  steps.forEach((step) => {
    const li = document.createElement('li');
    li.className = 'step-card';
    li.setAttribute('data-reveal', '');
    li.innerHTML = `
      <div class="step-icon">${step.icon || '✨'}</div>
      <div><h3>${step.title}</h3><p>${step.copy}</p></div>
    `;
    elements.stepsHost.appendChild(li);
  });
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
  elements.packagesBlock.setAttribute('aria-hidden', show ? 'true' : 'false'); // visually shown via parent render
}

function updateWhatsapp(text) {
  elements.whatsappTriggers.forEach((btn) => {
    btn.onclick = (event) => {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      analytics.track('whatsapp_optin', { role: state.persona });
      const personalized = personalizeWhatsapp(text);
      const encoded = encodeURIComponent(personalized);
      window.open(`https://wa.me/919940207670?text=${encoded}`, '_blank', 'noopener');
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

/* ---------- Directory (Zomato-style) ---------- */
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
        <h4 style="margin:6px 0">${h.name}</h4>
        <small style="color:var(--color-subtle)">${h.city}</small>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${h.tags.map(t=>`<span class="dir-tag">${t}</span>`).join('')}
        </div>
        <div class="dir-actions">
          <button class="btn btn-primary" data-open-menu="${h.id}">View menu</button>
          <a class="btn" href="${ROUTES.PATIENT_APP_URL}?demo=1#cashless">Start cashless</a>
          <a class="btn" href="${ROUTES.PATIENT_APP_URL}?demo=1#ambulance">Ambulance</a>
        </div>
      </div>
    </article>
  `).join('');
}

/* Modal handling */
function openMenu(id) {
  const h = hospitals.find(x=>x.id===id); if (!h || !elements.dirModal) return;
  elements.dirTitle.textContent = `${h.name} — Packages`;
  elements.dirMenu.innerHTML = h.menu.map(m => `
    <div class="menu-row">
      <div><strong>${m.name}</strong><br><small style="color:var(--color-subtle)">${m.meta||''}</small></div>
      <div class="menu-price">${m.price}</div>
      <a class="btn btn-primary" href="${ROUTES.PATIENT_APP_URL}?demo=1#cashless">Select</a>
    </div>
  `).join('');
  elements.dirModal.hidden = false;
}
function closeMenu() { if (elements.dirModal) elements.dirModal.hidden = true; }

/* ---------- Lead Panel ---------- */
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
  setTimeout(() => { if (!elements.leadAside.classList.contains('is-open')) elements.leadPanel.hidden = true; }, 360);
  localStorage.setItem('healthfloLeadOpen', '0');
  if (track) analytics.track('lead_panel_closed', { role: state.persona });
}
function toggleLeadPanel() { (elements.leadAside?.classList.contains('is-open')) ? closeLeadPanel() : openLeadPanel(); }

/* Lead Form */
function initLeadForm() {
  if (!elements.leadForm) return;
  elements.leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(elements.leadForm);
    analytics.track('lead_submitted', { role: state.persona, fields: Array.from(formData.keys()) });
    elements.leadForm.reset();
    toast('<strong>Thanks!</strong> A specialist will reach out shortly.');
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

/* ---------- Copilot ---------- */
function initCopilot() {
  if (!elements.copilotBtn || !elements.copilotModal) return;
  const open = () => { elements.copilotModal.hidden = false; analytics.track('copilot_opened', { role: state.persona }); };
  const close = () => { elements.copilotModal.hidden = true; };
  elements.copilotBtn.addEventListener('click', open);
  elements.copilotClose.forEach((btn) => btn.addEventListener('click', close));
  elements.copilotModal.addEventListener('click', (event) => { if (event.target.dataset?.copilotClose !== undefined || event.target === elements.copilotModal) close(); });
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

/* ---------- Ripple (nice clicks) ---------- */
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

/* ---------- Reveal on scroll ---------- */
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

/* ---------- Hero canvas (soft glow) ---------- */
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
      context.fillStyle = 'rgba(255, 138, 69, 0.3)'; context.beginPath(); context.arc(p.x, p.y, p.size*1.5, 0, Math.PI*2); context.fill();
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

/* ---------- Ticker (infinite loop + pause) ---------- */
function initTicker() {
  const root = elements.tickerRoot;
  const track = elements.tickerTrack;
  if (!root || !track) return;
  // Duplicate items so it looks infinite
  track.innerHTML = track.innerHTML + track.innerHTML + track.innerHTML;
  const totalWidth = Array.from(track.children).reduce((w, el) => w + el.getBoundingClientRect().width + 28, 0);
  // Inject keyframes for this width
  const dur = Math.max(20, Math.round(totalWidth / 100)); // seconds
  const style = document.createElement('style');
  style.textContent = `
    [data-ticker-track]{ animation: tickerScroll ${dur}s linear infinite; }
    @keyframes tickerScroll { from { transform: translateX(0) } to { transform: translateX(-${totalWidth/3}px) } }
  `;
  document.head.appendChild(style);

  // Pause toggle
  elements.tickerToggle?.addEventListener('click', () => {
    root.classList.toggle('is-paused');
    elements.tickerToggle.textContent = root.classList.contains('is-paused') ? '▶' : '❚❚';
    elements.tickerToggle.setAttribute('aria-label', root.classList.contains('is-paused') ? 'Play ticker' : 'Pause ticker');
  });
}

/* ---------- Nav ---------- */
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

/* ---------- Registration Floaters ---------- */
function initFloaters() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-floater]');
    if (!el) return;
    const type = el.dataset.floater;
    if (type === 'patient')  location.href = ROUTES.PATIENT_REG_URL;
    if (type === 'hospital') location.href = ROUTES.HOSPITAL_REG_URL;
    if (type === 'employer') location.href = ROUTES.EMPLOYER_REG_URL;
  });
}

/* ---------- CTA analytics ---------- */
function initCTAs() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-cta], [data-card-cta]');
    if (!target) return;
    const label = target.dataset.cta || target.dataset.analytics || target.textContent.trim();
    analytics.track('cta_clicked', { role: state.persona, cta_label: label });
  });

  // Directory buttons
  elements.dirGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-menu]');
    if (btn) openMenu(btn.getAttribute('data-open-menu'));
  });
  elements.dirModal?.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-dir-close')) closeMenu();
  });
}

/* ---------- Lead toggle ---------- */
function initLeadToggle() {
  if (!elements.leadToggle || !elements.leadAside) return;
  // Always start closed per requirement
  closeLeadPanel({ track: false });
  // Toggle click
  elements.leadToggle.addEventListener('click', toggleLeadPanel);
  // Keyboard
  document.addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key.toLowerCase() === 'l') toggleLeadPanel();
    if (e.key === 'Escape' && elements.leadAside.classList.contains('is-open')) closeLeadPanel();
  });
  // Any link to #lead should open it
  $$('a[href="#lead"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openLeadPanel(); elements.leadAside.scrollIntoView({ behavior: 'smooth', block: 'end' }); }));
  // If URL has #lead open it
  if (location.hash === '#lead') openLeadPanel({ focusFirstField: false });
}

/* ---------- WhatsApp text + Persona buttons ---------- */
function initPersona() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = (params.get('utm_persona') || params.get('persona') || '').toLowerCase();
  const stored = (localStorage.getItem('healthfloPersona') || '').toLowerCase();
  const persona = personaConfig[fromQuery] ? fromQuery : (personaConfig[stored] ? stored : 'patient');
  setPersona(persona, { skipTracking: true });
  renderPersonaContent();
  elements.personaButtons.forEach((btn) => btn.addEventListener('click', () => setPersona(btn.dataset.persona)));
}

/* ---------- Toast ---------- */
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

/* ---------- Boot ---------- */
function boot() {
  setTheme(state.theme, { track: false });
  elements.themeButtons.forEach((btn) => btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice)));

  initNav();
  initPersona();
  initLeadToggle();
  initLeadForm();
  initCTAs();
  initCopilot();
  initRipple();
  initReveal();
  initCanvas();
  initTicker();
  initFloaters();

  // Directory modal close buttons
  $$('[data-dir-close]').forEach(b => b.addEventListener('click', closeMenu));
}

document.addEventListener('DOMContentLoaded', boot);
