/*
 * HealthFlo Motion System
 * Subtle, cinematic interactions guided by reduced motion preferences.
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
      if (window.scrollY > 10) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
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
      toggle.setAttribute('aria-expanded', (!expanded).toString());
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
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    markActiveLink();

    const setOpenState = (state) => {
      nav.dataset.open = state ? 'true' : 'false';
      toggle?.setAttribute('aria-expanded', state.toString());
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
            y: -10,
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
      if (window.innerWidth > 1024) setOpenState(true);
      else if (toggle) setOpenState(false);
    };

    handleResize();
    window.addEventListener('resize', () => window.requestAnimationFrame(handleResize));
  };

  const initHeroAnimations = () => {
    if (!hasGSAP || prefersReducedMotion) return;

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
    timeline
      .from('.eyebrow', { y: 16, opacity: 0, duration: 0.5 })
      .from('.headline', { y: 28, opacity: 0, duration: 0.7 }, '-=0.2')
      .from('.subtext', { y: 18, opacity: 0, duration: 0.6 }, '-=0.25')
      .from('.cta-group a', {
        y: 14,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
      }, '-=0.2')
      .from('.hero-metrics div', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.1');

    gsap.from('.hero-slab svg', {
      opacity: 0,
      y: 24,
      duration: 0.8,
      ease: 'power3.out',
    });

    gsap.to('#hero-animation', {
      yPercent: -4,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  };

  const initScrollAnimations = () => {
    const revealElements = selectAll('.gsap-reveal, .gsap-stagger, .gsap-scroll, .gsap-counter');
    if (!revealElements.length) return;

    if (!hasGSAP || prefersReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'none';
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.2 });

      revealElements.forEach((el) => observer.observe(el));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.section-head').forEach((head) => {
      const title = head.querySelector('h2');
      if (!title) return;
      const chars = title.textContent.trim().split('');
      title.textContent = '';
      chars.forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        title.appendChild(span);
      });

      gsap.to(title.children, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.025,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: head,
          start: 'top 85%',
        },
      });
    });

    gsap.utils.toArray('.gsap-reveal').forEach((el) => {
      gsap.from(el, {
        y: 26,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
      });
    });

    gsap.utils.toArray('.gsap-stagger').forEach((el) => {
      gsap.from(el, {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top 80%',
        },
      });
    });

    gsap.utils.toArray('.gsap-scroll').forEach((el, index) => {
      gsap.from(el, {
        x: index % 2 === 0 ? -24 : 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
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
      gsap.to(track, {
        xPercent: 14,
        duration: 16,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    } else {
      track.classList.add('geo-marquee__track--animated');
    }
  };

  const initParallaxHover = () => {
    const tiltable = selectAll('.hover-tilt, .feature-card, .audience-card');
    if (!tiltable.length) return;

    const handleMove = (event) => {
      const el = event.currentTarget;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;
      const rotateX = ((y - height / 2) / height) * -4;
      const rotateY = ((x - width / 2) / width) * 4;
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

    const resetFloating = () => {
      floatingTweens.forEach((tween) => tween?.kill());
      floatingTweens.clear();
    };

    const animatePanel = (panel) => {
      if (!hasGSAP || prefersReducedMotion) return;

      gsap.from(panel.querySelector('.audience-panel__content'), {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power2.out',
      });

      const cards = selectAll('.audience-card', panel);
      cards.forEach((card, index) => {
        const direction = card.dataset.motion;
        const fromX = direction === 'left' ? -28 : direction === 'right' ? 28 : 0;
        const fromY = 24;

        gsap.fromTo(
          card,
          { x: fromX, y: fromY, opacity: 0 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            delay: index * 0.08,
          }
        );

        const floatTween = gsap.to(card, {
          y: '+=8',
          duration: 4 + index * 0.2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });

        floatingTweens.set(card, floatTween);
      });
    };

    const activatePanel = (targetId) => {
      resetFloating();

      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle('active', isActive);
        panel.toggleAttribute('hidden', !isActive);
        if (isActive) animatePanel(panel);
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        const targetId = tab.dataset.target;

        tabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive.toString());
        });

        activatePanel(targetId);
      });
    });

    const initialTab = tabs.find((tab) => tab.classList.contains('active')) || tabs[0];
    if (initialTab) {
      initialTab.setAttribute('aria-selected', 'true');
      activatePanel(initialTab.dataset.target);
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
            duration: 1.6,
            ease: 'power1.out',
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
    }, 6000);
  };

  const initSmoothAnchors = () => {
    selectAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const targetId = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
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
      y: 40,
      duration: 0.7,
      ease: 'power2.out',
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
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: footer,
          start: 'top 88%',
        },
      });
    }
  };

  const init = () => {
    initPreloader();
    initStickyHeader();
    initNavigation();
    initThemeToggle();
    initQuickPageNav();
    initHeroAnimations();
    initScrollAnimations();
    initGeoMarquee();
    initParallaxHover();
    initAudienceShowcase();
    initCounters();
    initTestimonials();
    initSmoothAnchors();
    initFloatingActions();
    initFooterReveal();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  HealthFloAnimations.init();
});
