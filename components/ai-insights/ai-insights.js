/*!
 * HealthFlo Insights Drawer
 * ----------------------------------------------------------
 * Single-file, production-ready controller for the animated
 * AI Insights drawer + tabs + speed control + auto-open-on-scroll.
 *
 * Features:
 *  - IIFE, zero external deps (optionally uses GSAP if present)
 *  - Accessible: ARIA tabs, keyboard, focus management, ESC close
 *  - Sticky trigger button; slide-in drawer
 *  - Auto-open when #kpis enters viewport (once; can be disabled)
 *  - Controls KPI engine speed (5s/15s/30s) via HealthFloKPI.setSpeed()
 *  - “Pause Live” / “Resume Live” button to disable/enable KPI engine
 *  - Custom events emitted:
 *      'hf:insightsOpen'      detail:{source}
 *      'hf:insightsClose'     detail:{source}
 *      'hf:insightsTab'       detail:{id}
 *      'hf:insightsSpeed'     detail:{ms,level}
 *      'hf:insightsPaused'    detail:{enabled:false}  // or true when resumed
 *
 * Persisted Preferences (localStorage):
 *  - hf-ai-autopen-done: 'true' once auto-open has been triggered
 *  - hf-kpi-speed: '1' | '2' | '3' (levels) OR a custom ms
 *  - hf-kpi-enabled: 'true' | 'false' (shared with KPI engine)
 */

(() => {
  const DOC = document;
  const WIN = window;

  // ------------------------ Safe Selectors ------------------------
  const $ = (sel, ctx = DOC) => ctx.querySelector(sel);
  const $$ = (sel, ctx = DOC) => Array.from(ctx.querySelectorAll(sel));

  // Elements (created in index.html)
  const root = $('#hf-ai-insights');
  if (!root) return; // Guard if section not present

  const triggerBtn = $('.hf-ai-insights__trigger', root);
  const drawer = $('#hf-ai-insights-drawer');
  const closeBtn = $('.hf-ai-insights__close', drawer);
  const tabs = $$('.hf-tab', drawer);
  const panels = $$('.hf-tabpanel', drawer);
  const speedSlider = $('#hf-refresh-speed', drawer);
  const tabsBar = $('.hf-ai-insights__tabs', drawer);
  const headerBar = $('.hf-ai-insights__header', drawer);

  // State
  const STATE = {
    open: false,
    hasGSAP: typeof WIN.gsap !== 'undefined',
    autoOpened: false,
    focusWas: null
  };

  // Easing helpers for GSAP (optional)
  const animateOpen = () => {
    if (!STATE.hasGSAP) {
      drawer.style.right = '0';
      return;
    }
    WIN.gsap.to(drawer, { right: 0, duration: 0.5, ease: 'power3.out' });
  };
  const animateClose = () => {
    if (!STATE.hasGSAP) {
      drawer.style.right = '-100%';
      return;
    }
    WIN.gsap.to(drawer, { right: '-100%', duration: 0.45, ease: 'power3.in' });
  };

  // ------------------------ Drawer API ------------------------
  const open = (source = 'user') => {
    if (STATE.open) return;
    STATE.open = true;

    drawer.setAttribute('aria-modal', 'true');
    triggerBtn.setAttribute('aria-expanded', 'true');
    drawer.removeAttribute('inert');

    animateOpen();

    // Move focus to first focusable in the drawer
    const firstFocusable = drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    STATE.focusWas = DOC.activeElement;
    (firstFocusable || closeBtn || drawer).focus({ preventScroll: true });

    DOC.dispatchEvent(new CustomEvent('hf:insightsOpen', { detail: { source } }));
  };

  const close = (source = 'user') => {
    if (!STATE.open) return;
    STATE.open = false;

    drawer.setAttribute('aria-modal', 'false');
    triggerBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('inert', '');

    animateClose();

    // Return focus to original element
    try { (STATE.focusWas || triggerBtn).focus({ preventScroll: true }); } catch {}

    DOC.dispatchEvent(new CustomEvent('hf:insightsClose', { detail: { source } }));
  };

  // Expose minimal control for external scripts if needed
  WIN.HealthFloInsights = { open, close };

  // ------------------------ Tabs ------------------------
  const activateTab = (tabBtn) => {
    if (!tabBtn) return;
    const targetId = tabBtn.getAttribute('data-tab');
    const panel = $('#' + targetId);
    if (!panel) return;

    tabs.forEach(t => {
      const active = t === tabBtn;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });

    panels.forEach(p => {
      const active = p === panel;
      p.classList.toggle('active', active);
      p.toggleAttribute('hidden', !active);
    });

    DOC.dispatchEvent(new CustomEvent('hf:insightsTab', { detail: { id: targetId } }));
  };

  // Click + keyboard on tabs
  tabs.forEach(t => {
    t.addEventListener('click', () => activateTab(t));
    t.addEventListener('keydown', (e) => {
      const idx = tabs.indexOf ? tabs.indexOf(t) : tabs.findIndex(x => x === t);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = tabs[(idx + 1) % tabs.length];
        next.focus(); activateTab(next);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
        prev.focus(); activateTab(prev);
      }
    });
  });

  // ------------------------ Speed Control ------------------------
  const sliderToMs = (level) => {
    if (String(level) === '1') return 5000;   // Fast
    if (String(level) === '3') return 30000;  // Slow
    return 15000;                              // Standard
  };

  const applySpeed = (level) => {
    const ms = sliderToMs(level);
    try { WIN.localStorage.setItem('hf-kpi-speed', String(level)); } catch {}
    // Drive KPI engine if present
    if (WIN.HealthFloKPI?.setSpeed) WIN.HealthFloKPI.setSpeed(level);
    DOC.dispatchEvent(new CustomEvent('hf:insightsSpeed', { detail: { ms, level } }));
    return ms;
  };

  if (speedSlider) {
    // Load saved speed preference
    const savedLevel = WIN.localStorage.getItem('hf-kpi-speed');
    if (savedLevel && ['1','2','3'].includes(savedLevel)) {
      speedSlider.value = savedLevel;
      applySpeed(savedLevel);
    }
    speedSlider.addEventListener('input', (e) => {
      const level = e.currentTarget.value;
      applySpeed(level);
    });
  }

  // ------------------------ Pause / Resume Control ------------------------
  // Create a compact "Pause Live" / "Resume Live" button in header
  const liveBtn = DOC.createElement('button');
  liveBtn.className = 'hf-tab';
  liveBtn.style.marginLeft = 'auto';
  liveBtn.setAttribute('type', 'button');
  headerBar?.appendChild(liveBtn);

  const updateLiveBtnLabel = (enabled) => {
    liveBtn.textContent = enabled ? '⏸︎ Pause Live' : '▶︎ Resume Live';
  };

  const readKpiEnabled = () => {
    const saved = WIN.localStorage.getItem('hf-kpi-enabled');
    return saved === null ? true : saved === 'true';
  };

  const setKpiEnabled = (flag) => {
    try { WIN.localStorage.setItem('hf-kpi-enabled', String(!!flag)); } catch {}
    // Notify KPI engine (it listens to this custom event)
    DOC.dispatchEvent(new CustomEvent('hf:kpiSetEnabled', { detail: { enabled: !!flag } }));
    updateLiveBtnLabel(!!flag);
    DOC.dispatchEvent(new CustomEvent('hf:insightsPaused', { detail: { enabled: !!flag } }));
  };

  updateLiveBtnLabel(readKpiEnabled());

  liveBtn.addEventListener('click', () => {
    const currentlyEnabled = readKpiEnabled();
    setKpiEnabled(!currentlyEnabled);
  });

  // Alt-click on trigger also toggles live state quickly (power user shortcut)
  triggerBtn?.addEventListener('click', (e) => {
    if (e.altKey) {
      e.preventDefault();
      setKpiEnabled(!readKpiEnabled());
      return;
    }
    toggleDrawer();
  });

  // ------------------------ Open/Close wiring ------------------------
  const toggleDrawer = () => (STATE.open ? close('user') : open('user'));

  triggerBtn?.addEventListener('click', (e) => {
    if (e.defaultPrevented) return; // handled by altKey path above
    toggleDrawer();
  });

  closeBtn?.addEventListener('click', () => close('user'));

  // Close on Escape and when clicking outside the drawer (optional)
  DOC.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && STATE.open) close('esc');
  });

  // Click outside: if click is on the overlay area (we don't render overlay in HTML),
  // we can close when click target is outside drawer & not trigger.
  DOC.addEventListener('click', (e) => {
    if (!STATE.open) return;
    const withinDrawer = drawer.contains(e.target);
    const isTrigger = triggerBtn.contains?.(e.target);
    if (!withinDrawer && !isTrigger) close('outside');
  });

  // ------------------------ Auto-open on KPI viewport ------------------------
  const autopenKey = 'hf-ai-autopen-done';
  const autoOpenDone = () => WIN.localStorage.getItem(autopenKey) === 'true';
  const markAutoOpenDone = () => { try { WIN.localStorage.setItem(autopenKey, 'true'); } catch {} };

  const kpiSection = $('#kpis');
  if (kpiSection && !autoOpenDone()) {
    // Use IntersectionObserver; fallback to click hint if unsupported
    if ('IntersectionObserver' in WIN) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (STATE.autoOpened) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            open('autoscroll');
            STATE.autoOpened = true;
            markAutoOpenDone();
            io.disconnect();
          }
        });
      }, { threshold: [0, 0.4, 0.75] });
      io.observe(kpiSection);
    } else {
      // Fallback: open after first KPI refresh if user scrolled a bit
      let scrolled = false;
      WIN.addEventListener('scroll', () => { scrolled = true; }, { passive: true });
      DOC.addEventListener('hf:refreshComplete', () => {
        if (!scrolled || STATE.autoOpened) return;
        STATE.autoOpened = true; markAutoOpenDone(); open('refresh-fallback');
      }, { once: true });
    }
  }

  // ------------------------ Focus outline management (UX polish) ------------------------
  // Add .is-keyboard-user to body when Tab is used so we can show focus rings only then.
  const onFirstTab = (e) => {
    if (e.key !== 'Tab') return;
    DOC.body.classList.add('is-keyboard-user');
    WIN.removeEventListener('keydown', onFirstTab);
  };
  WIN.addEventListener('keydown', onFirstTab);

  // ------------------------ Initial Tab Activation ------------------------
  // Ensure first tab is active if none marked
  if (!tabs.find?.(t => t.classList.contains('active'))) {
    activateTab(tabs[0]);
  }

  // ------------------------ Announce ready ------------------------
  DOC.dispatchEvent(new CustomEvent('hf:insightsReady'));
})();
