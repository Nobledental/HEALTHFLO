/* ============================================================
📊 HealthFlo Control Panel – Cinematic UX Layer
Author: GPT-5 · 2025
Enhances control panel with smooth GSAP animations, scroll behavior,
micro-interactions, and animated status transitions.
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  const panel = document.querySelector("#hf-controls");
  const controlsPanel = document.querySelector("#hf-controls-panel");
  const compactToggle = document.querySelector(".hf-controls__compact-toggle");
  const status = document.querySelector(".hf-status");
  let lastScroll = 0;

  /* ------------------------------------------------------------
   🎞️ 1. Intro animation – fade + slide in
  ------------------------------------------------------------ */
  gsap.from(panel, {
    opacity: 0,
    y: -40,
    duration: 0.9,
    ease: "power3.out",
    delay: 0.4,
  });

  /* ------------------------------------------------------------
   🪄 2. Compact toggle animation (expand/collapse)
  ------------------------------------------------------------ */
  if (compactToggle && controlsPanel) {
    compactToggle.addEventListener("click", () => {
      const expanded = compactToggle.getAttribute("aria-expanded") === "true";
      compactToggle.setAttribute("aria-expanded", (!expanded).toString());

      if (!expanded) {
        gsap.to(controlsPanel, {
          height: "auto",
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      } else {
        gsap.to(controlsPanel, {
          height: 0,
          opacity: 0,
          y: -10,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }
    });
  }

  /* ------------------------------------------------------------
   📊 3. Filter checkbox micro-interactions
  ------------------------------------------------------------ */
  document.querySelectorAll(".hf-filters__grid input[type='checkbox']").forEach((box) => {
    box.addEventListener("change", (e) => {
      gsap.fromTo(
        e.target.parentElement,
        { scale: 1 },
        { scale: 1.1, duration: 0.2, ease: "power1.out", yoyo: true, repeat: 1 }
      );
    });
  });

  /* ------------------------------------------------------------
   📍 4. Scope and date range transitions
  ------------------------------------------------------------ */
  document.querySelectorAll("input[name='hf-scope']").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      gsap.fromTo(
        e.target.parentElement,
        { backgroundColor: "#f1f5f9" },
        { backgroundColor: "#ffffff", duration: 0.5, ease: "power1.out" }
      );
    });
  });

  const dateRangeSelect = document.querySelector("#hf-date-range-select");
  if (dateRangeSelect) {
    dateRangeSelect.addEventListener("change", () => {
      gsap.from(dateRangeSelect, {
        scale: 1.08,
        duration: 0.25,
        ease: "back.out(2)",
        yoyo: true,
        repeat: 1,
      });
    });
  }

  /* ------------------------------------------------------------
   📡 5. Sync status animation
  ------------------------------------------------------------ */
  const syncStatus = document.querySelector("#hf-connection-status");
  const lastSyncTime = document.querySelector("#hf-last-sync");

  const animateStatusPing = () => {
    if (syncStatus) {
      gsap.fromTo(
        syncStatus,
        { backgroundColor: "#22c55e", scale: 1 },
        {
          backgroundColor: "#16a34a",
          scale: 1.05,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut",
        }
      );
    }
    if (lastSyncTime) {
      gsap.from(lastSyncTime, { opacity: 0, y: -4, duration: 0.4, ease: "power2.out" });
    }
  };

  // Auto-ping status every time dashboard refreshes
  document.addEventListener("hf:dashboardRefreshed", animateStatusPing);

  /* ------------------------------------------------------------
   📜 6. Sticky auto-hide on scroll
  ------------------------------------------------------------ */
  let isHidden = false;
  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > lastScroll && currentScroll > 100 && !isHidden) {
      // scrolling down – hide
      isHidden = true;
      gsap.to(panel, {
        y: -100,
        opacity: 0,
        duration: 0.6,
        ease: "power3.inOut",
      });
    } else if (currentScroll < lastScroll && isHidden) {
      // scrolling up – show
      isHidden = false;
      gsap.to(panel, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
      });
    }
    lastScroll = currentScroll;
  });

  /* ------------------------------------------------------------
   🔁 7. Refresh speed slider animation
  ------------------------------------------------------------ */
  const refreshSlider = document.querySelector("#hf-refresh-speed");
  if (refreshSlider) {
    refreshSlider.addEventListener("input", (e) => {
      const thumb = e.target;
      gsap.fromTo(
        thumb,
        { scale: 1.05 },
        { scale: 1, duration: 0.3, ease: "power1.inOut" }
      );
    });
  }
});
