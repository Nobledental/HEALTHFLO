/*
 * HealthFlo Motion & Interaction System
 * Requires GSAP + ScrollTrigger (loaded via CDN in each page).
 */

const HealthFloAnimations = (() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const initPreloader = () => {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;

    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        preloader.classList.add('hidden');
        setTimeout(() => preloader.remove(), 600);
      });
    });
  };

  const initStickyHeader = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  const initNavigation = () => {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
    });

    selectAll('.nav-links a').forEach((link) =>
      link.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  };

  const initThemeToggle = () => {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    const setTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('hf-theme', theme);
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    };

    const savedTheme = localStorage.getItem('hf-theme');
    const defaultTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(defaultTheme);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  };

  const initQuickPageNav = () => {
    const nav = document.querySelector('.quick-page-nav');
    if (!nav) return;

    const toggle = nav.querySelector('.quick-page-nav__toggle');
    const linksWrapper = nav.querySelector('.quick-page-nav__links');
    const links = selectAll('.quick-page-nav__links a', nav);
    const currentPage = document.body.dataset.page;

    const markActiveLink = () => {
      links.forEach((link) => {
        const isActive = link.dataset.page === currentPage;
        link.classList.toggle('is-active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    markActiveLink();

    const setOpenState = (state) => {
      nav.dataset.open = state ? 'true' : 'false';
      toggle?.setAttribute('aria-expanded', state);
      linksWrapper?.setAttribute('aria-hidden', state ? 'false' : 'true');
    };

    if (toggle) {
      setOpenState(false);
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        setOpenState(!isExpanded);

        if (!isExpanded && hasGSAP && !prefersReducedMotion) {
          gsap.from(nav.querySelector('.quick-page-nav__links'), {
            opacity: 0,
            y: -12,
            duration: 0.35,
            ease: 'power2.out',
          });
        }
      });
    } else {
      setOpenState(true);
    }

    links.forEach((link) =>
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) setOpenState(false);
      })
    );

    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setOpenState(true);
      } else if (toggle) {
        setOpenState(false);
      }
    };

    handleResize();
    window.addEventListener('resize', () => {
      window.requestAnimationFrame(handleResize);
    });
  };

  const initDataAnimateObserver = () => {
    const elements = selectAll('[data-animate]');
    if (!elements.length) return;

    elements.forEach((el) => {
      if (!el.dataset.animate) {
        el.dataset.animate = 'out';
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.dataset.animate = 'in';
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );

      elements.forEach((el) => observer.observe(el));
    } else {
      elements.forEach((el) => {
        el.dataset.animate = 'in';
      });
    }
  };

  const initHeroAnimations = () => {
    if (!hasGSAP || prefersReducedMotion) return;
    const timeline = gsap.timeline();

    timeline
      .from('.headline', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out' })
      .from('.subtext', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
      .from('.cta-group a', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.6)',
        stagger: 0.08,
      }, '-=0.3')
      .from('.hero-badges span', { opacity: 0, y: 12, duration: 0.6, ease: 'power2.out' }, '-=0.4');

    const orbits = selectAll('.hero-orbit');
    if (orbits.length) {
      gsap.from(orbits, {
        scale: 0.85,
        opacity: 0,
        duration: 1,
        ease: 'power2.out',
        stagger: 0.1,
      });
    }

    const heroCanvas = document.querySelector('#hero-animation');
    if (heroCanvas) {
      gsap.to(heroCanvas, {
        yPercent: -8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  };

  const initHeroDecor = () => {
    if (!hasGSAP || prefersReducedMotion) return;
    const orbits = selectAll('.hero-orbit');
    if (!orbits.length) return;

    orbits.forEach((orbit, index) => {
      gsap.to(orbit, {
        rotation: index % 2 === 0 ? 360 : -360,
        transformOrigin: '50% 50%',
        duration: 28 + index * 4,
        ease: 'none',
        repeat: -1,
      });

      gsap.to(orbit, {
        yPercent: index % 2 === 0 ? 6 : -6,
        duration: 6 + index,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    });
  };

  const initScrollAnimations = () => {
    if (!hasGSAP || prefersReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'none';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      selectAll('.gsap-reveal, .gsap-stagger, .gsap-scroll, .gsap-counter').forEach((el) => observer.observe(el));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    selectAll('.section-head').forEach((head) => {
      const splitText = head.querySelector('h2');
      if (!splitText) return;
      const chars = splitText.textContent.trim().split('');
      splitText.textContent = '';
      chars.forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.opacity = 0;
        splitText.appendChild(span);
      });

      gsap.to(splitText.children, {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.6,
        stagger: 0.03,
        scrollTrigger: {
          trigger: head,
          start: 'top 80%',
        },
      });
    });

    gsap.utils.toArray('.gsap-reveal').forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    gsap.utils.toArray('.gsap-stagger').forEach((el) => {
      gsap.from(el, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top 80%',
        },
      });
    });

    gsap.utils.toArray('.gsap-scroll').forEach((el, index) => {
      gsap.from(el, {
        x: index % 2 === 0 ? -60 : 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
        },
      });
    });

    selectAll('.parallax-bg').forEach((el) => {
      gsap.to(el, {
        backgroundPosition: '50% 100%',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          scrub: true,
        },
      });
    });
  };

  const initGeoMarquee = () => {
    const track = document.querySelector('.geo-marquee__track');
    if (!track) return;

    if (!track.dataset.duplicated) {
      const items = selectAll('span', track);
      const fragment = document.createDocumentFragment();
      items.forEach((item) => fragment.appendChild(item.cloneNode(true)));
      track.appendChild(fragment);
      track.dataset.duplicated = 'true';
    }

    if (hasGSAP && !prefersReducedMotion) {
      const distance = track.scrollWidth / 2;
      const duration = Math.max(18, distance / 60);
      gsap.fromTo(
        track,
        { x: -distance },
        {
          x: 0,
          duration,
          ease: 'none',
          repeat: -1,
        }
      );
    } else {
      track.classList.add('geo-marquee__track--animated');
    }
  };

  const initProductPathways = () => {
    const section = document.querySelector('#product-pathways');
    if (!section || !hasGSAP || prefersReducedMotion) return;

    const groups = selectAll('.product-pathways__group', section);
    const cards = selectAll('.product-card', section);
    const icons = selectAll('.product-card__icon', section);

    groups.forEach((group, index) => {
      gsap.from(group, {
        opacity: 0,
        y: 60,
        z: -80,
        rotateX: -12,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: group,
          start: 'top 78%',
          once: true,
          onEnter: () => {
            group.dataset.animate = 'in';
          },
        },
      });
    });

    gsap.set(cards, { transformPerspective: 1200, transformOrigin: 'center center -50px' });

    cards.forEach((card, index) => {
      gsap.from(card, {
        opacity: 0,
        y: 32,
        z: -70,
        rotateY: index % 2 === 0 ? -16 : 16,
        duration: 0.7,
        ease: 'power2.out',
        delay: (index % 3) * 0.08,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            card.dataset.animate = 'in';
          },
        },
      });
    });

    icons.forEach((icon, index) => {
      gsap.to(icon, {
        y: -10,
        rotationY: 10,
        duration: 3.2 + index * 0.15,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: index * 0.12,
      });
    });
  };

  const initCardGlow = () => {
    if (!hasGSAP || prefersReducedMotion) return;
    const cards = selectAll('.feature-card, .audience-card, .product-card');
    if (!cards.length) return;

    cards.forEach((card, index) => {
      gsap.to(card, {
        boxShadow: '0 28px 70px rgba(34, 211, 238, 0.22)',
        duration: 6 + index * 0.15,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    });
  };

  const initParallaxHover = () => {
    const tiltable = selectAll('.hover-tilt, .feature-card, .product-card, .audience-card');
    if (!tiltable.length) return;

    const handleMove = (event) => {
      const el = event.currentTarget;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;
      const rotateX = ((y - height / 2) / height) * -6;
      const rotateY = ((x - width / 2) / width) * 6;
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const reset = (event) => {
      event.currentTarget.style.transform = '';
    };

    tiltable.forEach((el) => {
      el.addEventListener('pointermove', handleMove);
      el.addEventListener('pointerleave', reset);
    });
  };

  const initAudienceShowcase = () => {
    const section = document.querySelector('.audience-showcase');
    if (!section) return;

    const tabs = selectAll('.audience-tab', section);
    const panels = selectAll('.audience-panel', section);
    const floatingTweens = new Map();
    const panelObservers = new WeakMap();

    const resetFloating = () => {
      floatingTweens.forEach((tween) => tween.kill());
      floatingTweens.clear();
    };

    const animatePanel = (panel) => {
      if (!hasGSAP || prefersReducedMotion) return;

      const playAnimation = () => {
        panelObservers.get(panel)?.disconnect();
        panelObservers.delete(panel);

        const content = panel.querySelector('.audience-panel__content');

        gsap.from(content, {
          opacity: 0,
          y: 42,
          rotationX: -10,
          duration: 0.7,
          ease: 'power3.out',
        });

        const cards = selectAll('.audience-card', panel);
        if (cards.length) {
          gsap.set(cards, { transformPerspective: 1100, transformOrigin: 'center center -40px' });
        }
        cards.forEach((card, index) => {
          const direction = card.dataset.motion;
          const fromX = direction === 'left' ? -80 : direction === 'right' ? 80 : 0;
          const fromY = direction === 'center' ? 40 : 20;

          gsap.fromTo(
            card,
            {
              x: fromX,
              y: fromY,
              opacity: 0,
              rotateX: -8,
              rotateY: direction === 'center' ? 0 : direction === 'left' ? -14 : 14,
              z: -70,
            },
            {
              x: 0,
              y: 0,
              opacity: 1,
              rotateX: 0,
              rotateY: 0,
              z: 0,
              duration: 0.85,
              ease: 'power3.out',
              delay: index * 0.08,
              onComplete: () => {
                card.dataset.animate = 'in';
              },
            }
          );

          const floatTween = gsap.to(card, {
            y: '+=14',
            duration: 3.8 + index * 0.2,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            delay: index * 0.12,
          });

          floatingTweens.set(card, floatTween);
        });
      };

      const { top } = panel.getBoundingClientRect();
      if (top < window.innerHeight * 0.85) {
        playAnimation();
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          playAnimation();
        });
      }, { threshold: 0.35 });

      panelObservers.get(panel)?.disconnect();
      observer.observe(panel);
      panelObservers.set(panel, observer);
    };

    const activatePanel = (targetId) => {
      if (!targetId) return;
      resetFloating();

      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle('active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
        if (isActive) animatePanel(panel);
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        const targetId = tab.getAttribute('data-target');

        tabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive);
        });

        activatePanel(targetId);
      });
    });

    const initialTab = tabs.find((tab) => tab.classList.contains('active')) || tabs[0];
    if (initialTab) {
      initialTab.setAttribute('aria-selected', 'true');
      activatePanel(initialTab.getAttribute('data-target'));
    }
  };

  const initCounters = () => {
    const counters = selectAll('.gsap-counter strong');
    if (!counters.length) return;

    const parseTarget = (value) => {
      const numeric = parseFloat(value.replace(/[^\d.]/g, ''));
      return Number.isFinite(numeric) ? numeric : 0;
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const counter = entry.target;
        const targetValue = parseTarget(counter.dataset.target || counter.textContent);
        const suffix = counter.dataset.suffix || counter.textContent.replace(/^[\d.,\s]+/, '');
        const prefix = counter.dataset.prefix || counter.textContent.replace(/[\d.,\s]+$/, '');

        if (counter.dataset.animated) return;
        counter.dataset.animated = 'true';

        if (hasGSAP && !prefersReducedMotion) {
          gsap.fromTo(counter, { innerText: 0 }, {
            innerText: targetValue,
            duration: 1.8,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate() {
              counter.textContent = `${prefix}${Math.floor(counter.innerText).toLocaleString()}${suffix}`;
            },
          });
        } else {
          counter.textContent = `${prefix}${targetValue.toLocaleString()}${suffix}`;
        }
      });
    }, { threshold: 0.4 });

    counters.forEach((counter) => {
      const rawText = counter.textContent.trim();
      counter.dataset.prefix = rawText.match(/^[^\d]*/)?.[0] ?? '';
      counter.dataset.suffix = rawText.match(/[^\d]*$/)?.[0] ?? '';
      counter.dataset.target = parseTarget(rawText);
      counter.textContent = `${counter.dataset.prefix}0${counter.dataset.suffix}`;
      observer.observe(counter);
    });
  };

  const initTestimonials = () => {
    const carousel = document.querySelector('.testimonial-carousel');
    if (!carousel) return;

    const slides = selectAll('blockquote', carousel);
    if (!slides.length) return;

    let current = 0;

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    };

    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'carousel-controls';
    const dots = slides.map((_slide, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `carousel-dot${idx === 0 ? ' active' : ''}`;
      btn.setAttribute('aria-label', `Show testimonial ${idx + 1}`);
      btn.addEventListener('click', () => {
        current = idx;
        showSlide(current);
      });
      dotsWrapper.appendChild(btn);
      return btn;
    });
    carousel.after(dotsWrapper);

    showSlide(current);

    setInterval(() => {
      current = (current + 1) % slides.length;
      showSlide(current);
    }, 5000);
  };

  const initSolutionsTabs = () => {
    const tabs = selectAll('.solution-tab');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        selectAll('.solutions-section').forEach((section) => {
          if (section.id === targetId) {
            section.classList.remove('hidden');
          } else {
            section.classList.add('hidden');
          }
        });

        if (hasGSAP && !prefersReducedMotion) {
          gsap.from(targetSection, { opacity: 0, y: 40, duration: 0.6 });
        }
      });
    });
  };

  const initWorkflowTimeline = () => {
    if (!hasGSAP || prefersReducedMotion) return;
    const track = document.querySelector('.workflow-track');
    if (!track) return;

    gsap.to('.workflow-track', {
      xPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.workflow-track',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  };

  const initProductModals = () => {
    const modal = document.querySelector('.modal');
    if (!modal) return;
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    const closeBtn = modal.querySelector('.modal-close');

    const products = selectAll('.product-card');

    const descriptions = {
      'OPD EMR': 'Digitize every outpatient encounter with AI-assisted charting, intake, and care pathways ready to sync with HIS/EMR systems.',
      'Cashless Billing': 'Centralize insurance desk workflows, automate pre-auth packets, and orchestrate real-time approvals across payors.',
      'Denial Prediction AI': 'Predict claim denials before submission with explainable AI models trained on 50M+ transactions.',
      'Financing Engine': 'Unlock zero-interest payment plans, credit scoring, and disbursals managed end-to-end for patient affordability.',
      'Empanelment Tracker': 'Track empanelment status, contract SLAs, and credentialing across TPA, corporate, and government schemes.',
      'RCM Dashboard': 'Single cockpit for CFOs with margin analytics, recovery insights, and automated variance alerts.',
      'Patient Concierge Hub': 'Deliver coordinated bedside and digital support with multilingual guides, live updates, and concierge tasking.',
      'Claim Tracker App': 'Enable patients to upload documents, monitor timelines, and escalate issues with a swipe-based mobile experience.',
      'Care Messaging': 'Automate recovery follow-ups, medication reminders, and satisfaction loops with AI-personalised communication.',
    };

    products.forEach((card) => {
      card.addEventListener('click', () => {
        const title = card.querySelector('h3').textContent;
        modalTitle.textContent = title;
        modalBody.innerHTML = `
          <p>${descriptions[title] || ''}</p>
          <div class="video-placeholder" aria-hidden="true">
            <span>Module walkthrough coming soon</span>
          </div>`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  };

  const initImpactCharts = () => {
    if (!hasGSAP || prefersReducedMotion) return;
    const bars = selectAll('.impact-bar');
    const pies = selectAll('.impact-pie');

    bars.forEach((bar) => {
      gsap.from(bar, {
        scaleY: 0,
        transformOrigin: 'bottom',
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: bar,
          start: 'top 85%',
        },
      });
    });

    pies.forEach((pie) => {
      const circle = pie.querySelector('circle');
      if (!circle) return;
      const length = circle.getTotalLength();
      circle.style.strokeDasharray = length;
      circle.style.strokeDashoffset = length;
      gsap.to(circle, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: pie,
          start: 'top 80%',
        },
      });
    });
  };

  const initContactForm = () => {
    const form = document.querySelector('#contact-form');
    if (!form) return;
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const valid = form.checkValidity();
      if (!valid) {
        status.textContent = 'Please complete the required fields highlighted above.';
        status.style.color = '#ef4444';
        return;
      }
      status.textContent = 'Thanks! Our team will contact you within 1 business day.';
      status.style.color = '#12b2a0';
      form.reset();
    });
  };

  const initCalendarPopup = () => {
    const openBtn = document.querySelector('.schedule-demo');
    const popup = document.querySelector('.calendar-popup');
    if (!openBtn || !popup) return;
    const closeBtn = popup.querySelector('.calendar-close');

    const openPopup = () => {
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closePopup = () => {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    };

    openBtn.addEventListener('click', openPopup);
    closeBtn?.addEventListener('click', closePopup);
    popup.addEventListener('click', (event) => {
      if (event.target === popup) closePopup();
    });
  };

  const initSmoothAnchors = () => {
    selectAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const targetId = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const initFloatingActions = () => {
    const container = document.querySelector('.floating-actions');
    if (!container) return;

    container.querySelectorAll('a').forEach((link) => {
      link.addEventListener('mouseenter', () => link.classList.add('active'));
      link.addEventListener('mouseleave', () => link.classList.remove('active'));
    });
  };

  const initFooterReveal = () => {
    if (!hasGSAP || prefersReducedMotion) return;
    const footer = document.querySelector('.footer');
    if (!footer) return;

    gsap.from(footer, {
      opacity: 0,
      y: 60,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: footer,
        start: 'top 90%',
      },
    });

    const footerCols = selectAll('.footer-grid > div', footer);
    if (footerCols.length) {
      gsap.from(footerCols, {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: footer,
          start: 'top 88%',
        },
      });
    }

    const wavePath = footer.querySelector('.footer-wave path');
    if (wavePath) {
      const animateWave = () => {
        const alt = 'M0 60C150 20 210 88 360 60C510 32 570 96 720 60V160H0Z';
        gsap.to(wavePath, {
          attr: { d: alt },
          repeat: -1,
          yoyo: true,
          duration: 6,
          ease: 'sine.inOut',
          yoyoEase: 'sine.inOut',
        });
      };

      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
          trigger: footer,
          start: 'top 95%',
          once: true,
          onEnter: animateWave,
        });
      } else {
        animateWave();
      }
    }
  };

  const initSolutionsGradient = () => {
    const hero = document.querySelector('.solutions-hero');
    const tabs = selectAll('.solution-tab');
    if (!hero || !tabs.length) return;

    const gradients = {
      hospitals: 'linear-gradient(140deg, rgba(122,163,255,0.35), rgba(34,211,238,0.25))',
      patients: 'linear-gradient(140deg, rgba(18,178,160,0.3), rgba(122,163,255,0.22))',
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-target');
        const target = gradients[key] || gradients.hospitals;
        hero.style.background = target;
      });
    });
  };

  const init = () => {
    initPreloader();
    initStickyHeader();
    initNavigation();
    initThemeToggle();
    initQuickPageNav();
    initDataAnimateObserver();
    initHeroAnimations();
    initHeroDecor();
    initScrollAnimations();
    initGeoMarquee();
    initProductPathways();
    initCardGlow();
    initParallaxHover();
    initAudienceShowcase();
    initCounters();
    initTestimonials();
    initSolutionsTabs();
    initWorkflowTimeline();
    initProductModals();
    initImpactCharts();
    initContactForm();
    initCalendarPopup();
    initSmoothAnchors();
    initFloatingActions();
    initSolutionsGradient();
    initFooterReveal();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  HealthFloAnimations.init();
});
