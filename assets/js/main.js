(function () {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.site-nav__toggle');
  const navList = document.querySelector('.site-nav__list');
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select';
  let navOpen = false;
  let navFocusTrapHandlers = [];

  function setHeaderState() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('is-solid');
    } else {
      header.classList.remove('is-solid');
    }
  }

  function trapFocus(container) {
    const focusable = Array.from(container.querySelectorAll(focusableSelectors));
    if (focusable.length === 0) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKey(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener('keydown', handleKey);
    return () => container.removeEventListener('keydown', handleKey);
  }

  function closeNav() {
    if (!navOpen) return;
    navList.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.focus();
    navFocusTrapHandlers.forEach((off) => off());
    navFocusTrapHandlers = [];
    navOpen = false;
  }

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      navOpen = !navOpen;
      navToggle.setAttribute('aria-expanded', String(navOpen));
      navList.classList.toggle('is-open', navOpen);
      if (navOpen) {
        navList.querySelectorAll('a')[0]?.focus();
        navFocusTrapHandlers.push(trapFocus(navList));
      } else {
        navFocusTrapHandlers.forEach((off) => off());
        navFocusTrapHandlers = [];
      }
    });

    navList.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        closeNav();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeNav();
      }
    });
  }

  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();

  // Smooth scrolling using Lenis if available
  let lenis;
  function initLenis() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.Lenis) {
      lenis = new window.Lenis({
        duration: 1.1,
        smoothWheel: true,
        smoothTouch: false
      });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  window.addEventListener('load', initLenis);

  function handleAnchorScroll(event) {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId.length < 2) return;
    const el = document.querySelector(targetId);
    if (!el) return;
    event.preventDefault();
    const scrollTarget = () => el.scrollIntoView({ behavior: lenis ? 'instant' : 'smooth', block: 'start' });
    if (lenis) {
      lenis.scrollTo(el);
    } else {
      scrollTarget();
    }
  }

  document.addEventListener('click', handleAnchorScroll);

  // Switchboard interactions
  document.querySelectorAll('.switch-card').forEach((card) => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-target');
      if (!target) return;
      const section = document.querySelector(target);
      if (section) {
        section.classList.add('is-active');
        setTimeout(() => section.classList.remove('is-active'), 1200);
        if (lenis) {
          lenis.scrollTo(section);
        } else {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
    card.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
  });

    // FAQ tabs
  const faqTabs = document.querySelectorAll('.faq-tabs__tab');
  faqTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      faqTabs.forEach((btn) => {
        const isActive = btn === tab;
        btn.setAttribute('aria-selected', isActive);
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !isActive;
        }
      });
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const index = Array.from(faqTabs).indexOf(tab);
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        const next = (index + dir + faqTabs.length) % faqTabs.length;
        faqTabs[next].focus();
      }
    });
  });

  // Accordions
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const trigger = accordion.querySelector('.accordion__trigger');
    const content = accordion.querySelector('.accordion__content');
    if (!trigger || !content) return;
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      content.hidden = expanded;
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        trigger.click();
      }
    });
  });

// Diagnostics data rendering
  const diagnosticsData = {
    Hyderabad: [
      { modality: 'MRI Brain', price: '₹7,500 - ₹9,200', slot: 'Next slot: Today 5:30 PM' },
      { modality: 'CT Angio', price: '₹8,800 - ₹10,500', slot: 'Next slot: Today 7:00 PM' },
      { modality: 'Digital X-Ray', price: '₹900 - ₹1,200', slot: 'Next slot: Today 4:20 PM' },
      { modality: 'Ultrasound Abdomen', price: '₹1,500 - ₹2,100', slot: 'Next slot: Tomorrow 9:00 AM' },
      { modality: 'Cardiac Echo', price: '₹2,500 - ₹3,800', slot: 'Next slot: Tomorrow 10:45 AM' },
      { modality: 'PET-CT Whole Body', price: '₹19,500 - ₹23,000', slot: 'Next slot: Thursday 11:30 AM' }
    ],
    Bengaluru: [
      { modality: 'MRI Spine', price: '₹8,200 - ₹10,000', slot: 'Next slot: Today 6:10 PM' },
      { modality: 'CT Chest HRCT', price: '₹5,600 - ₹6,800', slot: 'Next slot: Today 8:15 PM' },
      { modality: 'Lab - CBC Panel', price: '₹750 - ₹1,050', slot: 'Next slot: Today 2:30 PM' },
      { modality: 'Mammography', price: '₹2,800 - ₹3,500', slot: 'Next slot: Tomorrow 9:40 AM' },
      { modality: 'Stress Test TMT', price: '₹3,500 - ₹4,400', slot: 'Next slot: Tomorrow 8:30 AM' },
      { modality: 'DEXA Scan', price: '₹2,900 - ₹3,700', slot: 'Next slot: Friday 12:20 PM' }
    ],
    Pune: [
      { modality: 'CT KUB', price: '₹4,500 - ₹5,800', slot: 'Next slot: Today 3:15 PM' },
      { modality: 'Ultrasound Doppler', price: '₹2,200 - ₹2,900', slot: 'Next slot: Today 5:00 PM' },
      { modality: 'Lab - Thyroid Panel', price: '₹1,100 - ₹1,450', slot: 'Next slot: Today 6:45 PM' },
      { modality: 'ECG & Consultation', price: '₹850 - ₹1,200', slot: 'Next slot: Tomorrow 10:10 AM' },
      { modality: 'MRI Knee', price: '₹6,200 - ₹7,400', slot: 'Next slot: Tomorrow 11:55 AM' },
      { modality: 'CT Coronary', price: '₹9,900 - ₹12,300', slot: 'Next slot: Friday 2:30 PM' }
    ],
    Delhi: [
      { modality: 'MRI Brain Contrast', price: '₹9,000 - ₹11,200', slot: 'Next slot: Today 8:20 PM' },
      { modality: 'CT PNS', price: '₹4,100 - ₹4,950', slot: 'Next slot: Today 5:45 PM' },
      { modality: 'Ultrasound Obstetrics', price: '₹1,600 - ₹2,200', slot: 'Next slot: Today 4:40 PM' },
      { modality: 'Lab - Renal Panel', price: '₹1,200 - ₹1,650', slot: 'Next slot: Tomorrow 8:20 AM' },
      { modality: 'Cardiac MRI', price: '₹14,500 - ₹18,200', slot: 'Next slot: Thursday 1:15 PM' },
      { modality: 'Sleep Study', price: '₹6,800 - ₹8,500', slot: 'Next slot: Friday 9:30 PM' }
    ]
  };

  const diagnosticsGrid = document.querySelector('[data-diagnostics-grid]');
  const cityButtons = document.querySelectorAll('.filter-chip');

  function renderDiagnostics(city) {
    if (!diagnosticsGrid) return;
    diagnosticsGrid.innerHTML = '';
    diagnosticsGrid.setAttribute('aria-busy', 'true');
    const skeletons = Array.from({ length: 6 }, (_, index) => {
      const div = document.createElement('div');
      div.className = 'slot-card shimmer';
      div.style.height = '140px';
      div.setAttribute('aria-hidden', 'true');
      return div;
    });
    skeletons.forEach((skeleton) => diagnosticsGrid.appendChild(skeleton));

    setTimeout(() => {
      diagnosticsGrid.innerHTML = '';
      (diagnosticsData[city] || []).forEach((slot) => {
        const card = document.createElement('article');
        card.className = 'slot-card fade-up';
        card.innerHTML = `
          <span class="slot-card__tag">${slot.modality}</span>
          <strong class="slot-card__price">${slot.price}</strong>
          <span>${slot.slot}</span>
          <button class="btn btn--ghost">Reserve</button>
        `;
        diagnosticsGrid.appendChild(card);
      });
      diagnosticsGrid.removeAttribute('aria-busy');
    }, 450);
  }

  cityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      cityButtons.forEach((b) => b.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      renderDiagnostics(btn.dataset.city);
    });
  });

  renderDiagnostics('Hyderabad');

  const marqueeTrack = document.querySelector('.geo-marquee__track');
  if (marqueeTrack) {
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
  }

  // Modal logic
  const modal = document.querySelector('[data-modal]');
  const modalOverlay = modal?.querySelector('[data-modal-close]');
  const modalClose = modal?.querySelector('.modal__close');
  const modalTrigger = document.querySelector('[data-contact-modal]');
  const modalForm = modal?.querySelector('[data-modal-form]');
  let modalFocusOff = () => {};

  function openModal(department) {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const select = modal.querySelector('[data-modal-department]');
    if (select && department) {
      Array.from(select.options).forEach((option) => {
        option.selected = option.textContent === department;
      });
    }
    const firstInput = modal.querySelector('input, select, textarea, button');
    firstInput?.focus();
    modalFocusOff = trapFocus(modal);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    modalFocusOff();
    modalFocusOff = () => {};
  }

  modalTrigger?.addEventListener('click', (event) => {
    const department = event.currentTarget.getAttribute('data-department');
    openModal(department);
  });

  modalOverlay?.addEventListener('click', closeModal);
  modalClose?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal?.hidden) {
      closeModal();
    }
  });

  modalForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    closeModal();
    alert('Thank you! Our team will reach out shortly.');
  });

  // Service worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        console.warn('Service worker registration failed');
      });
    });
  }
})();
