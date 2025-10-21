/* ==========================================================================
   HealthFlo — animations.css (advanced motion system)
   Works with variables & themes from assets/css/main.css
   ========================================================================== */

/* ---------- Reduced motion guard ---------- */
@media (prefers-reduced-motion: reduce){
  *, *::before, *::after{
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}

/* ---------- Base transition tokens ---------- */
:root{
  --e1: cubic-bezier(.2,.8,.2,1);
  --e2: cubic-bezier(.22,1,.36,1);
  --spring: cubic-bezier(.34,1.56,.64,1);
  --fast: .22s;
  --med: .42s;
  --slow: .7s;
}

/* ---------- Scroll reveal primitives ---------- */
[data-animate]{
  opacity: 0; transform: translateY(18px) scale(.98);
  transition: opacity var(--med) var(--e2), transform var(--med) var(--e2);
  will-change: opacity, transform;
}
[data-animate].is-visible{
  opacity: 1; transform: none;
}
.reveal-up   { transform: translateY(22px); }
.reveal-down { transform: translateY(-22px); }
.reveal-left { transform: translateX(22px); }
.reveal-right{ transform: translateX(-22px); }
.reveal-pop  { transform: translateY(14px) scale(.96); }
.reveal-pop.is-visible{ transform: none; }

/* Stagger helper: apply to children */
.stagger > *{
  opacity:0; transform:translateY(16px);
  transition: opacity var(--med) var(--e2), transform var(--med) var(--e2);
}
.stagger.is-visible > *{
  opacity:1; transform:none;
}
.stagger.is-visible > *:nth-child(1){ transition-delay: .02s }
.stagger.is-visible > *:nth-child(2){ transition-delay: .06s }
.stagger.is-visible > *:nth-child(3){ transition-delay: .10s }
.stagger.is-visible > *:nth-child(4){ transition-delay: .14s }
.stagger.is-visible > *:nth-child(5){ transition-delay: .18s }

/* ---------- Premium buttons (micro-spring) ---------- */
.btn{
  transition: transform .18s var(--spring), box-shadow var(--fast) var(--e1), background var(--fast) var(--e1);
}
.btn:hover{ transform: translateY(-1px) scale(1.015); }
.btn:active{ transform: translateY(0) scale(.985); }

/* Glow lift for primary */
.btn--primary{
  box-shadow: 0 12px 28px color-mix(in oklab, var(--accent-1), transparent 78%);
}
.btn--primary:hover{
  box-shadow: 0 16px 38px color-mix(in oklab, var(--accent-2), transparent 70%);
}

/* ---------- Ripple (CSS-only baseline, JS will enhance) ---------- */
.ripple{
  position: relative; overflow: hidden;
}
.ripple::after{
  content:""; position:absolute; inset:auto; width:12px; height:12px;
  background: radial-gradient(circle, color-mix(in oklab, var(--accent-1), #fff 22%) 0%, transparent 60%);
  border-radius:50%; transform: scale(0); opacity:.55; pointer-events:none;
  transition: transform .5s var(--e1), opacity .6s var(--e1);
}
.ripple.is-pressing::after{ transform: scale(16); opacity:0; }

/* ---------- Role bubble subtle spring ---------- */
.role-bubble{
  animation: bubble-idle 6s ease-in-out infinite;
}
@keyframes bubble-idle{
  0%,100%{ transform: translateY(-50%) translateZ(0) }
  50%{ transform: translateY(calc(-50% - 2px)) translateZ(0) }
}

/* ---------- Pills / chips hover micro-move ---------- */
.chip, .pill, .tab, .seg-btn{
  transition: transform var(--fast) var(--e1), background var(--fast) var(--e1), border-color var(--fast) var(--e1);
}
.chip:hover, .pill:hover, .tab:hover, .seg-btn:hover{
  transform: translateY(-1px);
}

/* ---------- Cards (glass + aurora sheen) ---------- */
.product{
  transform: translateZ(0);
}
.product:hover{
  box-shadow: 0 28px 72px color-mix(in oklab, var(--accent-2), transparent 78%);
}
.product::after{
  /* Sweep sheen */
  content:""; position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(95deg, transparent 45%, color-mix(in oklab, #fff, var(--accent-1) 12%) 50%, transparent 55%);
  mix-blend-mode: soft-light; opacity:0; transform: translateX(-40%) skewX(-12deg);
  transition: opacity .5s var(--e1), transform .6s var(--e1);
}
.product:hover::after{
  opacity:.55; transform: translateX(40%) skewX(-12deg);
}

/* ---------- Typing headline shimmer ---------- */
.type-gradient{
  background: linear-gradient(90deg, #fff 0%, var(--accent-1) 50%, var(--accent-2) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: shine 4s linear infinite;
}
@keyframes shine{ 0%{background-position:0 0} 100%{background-position:-200% 0} }

/* ---------- SVG stroke draw ---------- */
.draw-stroke{
  stroke-dasharray: 220; stroke-dashoffset: 220;
  animation: draw .9s var(--e2) forwards;
}
@keyframes draw{ to{ stroke-dashoffset: 0 } }

/* ---------- Orb parallax soft float ---------- */
@keyframes float{
  0%,100%{ transform: translate3d(0,0,0) }
  50%{ transform: translate3d(0,-8px,0) }
}
.orb-left{ animation: float 12s ease-in-out infinite; }
.orb-right{ animation: float 10s ease-in-out infinite; }

/* ---------- Grid HDR twinkle (optional class) ---------- */
.grid-hdr.twinkle{
  animation: twinkle 10s ease-in-out infinite;
}
@keyframes twinkle{
  0%,100%{opacity:.9; filter:saturate(115%)}
  50%{opacity:1; filter:saturate(125%)}
}

/* ---------- Marquee polish ---------- */
.geo-marquee__track{
  animation: marquee var(--marquee-speed) linear infinite;
  will-change: transform;
}
.geo-marquee:hover .geo-marquee__track{
  animation-play-state: paused;
}

/* ---------- Toast entrance ---------- */
.toast{ transition: transform .35s var(--e2), opacity .35s var(--e2) }
.toast.in{ transform: translateX(-50%) translateY(0); opacity:1 }

/* ---------- Icon hover (subtle 3D) ---------- */
.soc{ transition: transform var(--fast) var(--spring), box-shadow var(--fast) var(--e1) }
.soc:hover{ transform: translateY(-2px) scale(1.05); box-shadow: 0 16px 34px color-mix(in oklab, var(--accent-1), transparent 70%) }

/* ---------- Form focus glint ---------- */
.input:focus, .form-grid input:focus, .form-grid select:focus, .form-grid textarea:focus{
  border-color: color-mix(in oklab, var(--accent-1), #fff 12%);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent-1), transparent 82%);
  transition: box-shadow .22s var(--e1), border-color .22s var(--e1);
}

/* ---------- OTP bump on verified (add .ok in JS) ---------- */
.status.ok{
  animation: ok-pulse .7s var(--spring);
}
@keyframes ok-pulse{
  0%{ transform: scale(1); color: #9de9c5 }
  40%{ transform: scale(1.04); color: #6ee7b7 }
  100%{ transform: scale(1); color: inherit }
}

/* ---------- Press feedback helper (add .press on mousedown) ---------- */
.pressable{ transition: transform .14s var(--spring) }
.pressable.press{ transform: scale(.98) }

/* ---------- Floating dots (optional decorative layer) ---------- */
.fx-dots{
  position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; opacity:.35;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(125,231,255,.2) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 40%, rgba(140,125,255,.2) 0 2px, transparent 3px),
    radial-gradient(circle at 70% 30%, rgba(255,134,181,.2) 0 2px, transparent 3px),
    radial-gradient(circle at 85% 75%, rgba(52,211,153,.2) 0 2px, transparent 3px);
  background-size: 140px 140px;
  animation: dots-pan 30s linear infinite;
}
@keyframes dots-pan{ to{ background-position: 140px 140px, -140px 140px, 140px -140px, -140px -140px } }

/* ---------- Section divider shimmer ---------- */
.divider{
  height:1px; width:100%;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent-2), transparent 60%), transparent);
  animation: divider-spark 3.2s linear infinite;
}
@keyframes divider-spark{
  0%{ background-position: -200% 0; background-size: 200% 100%; }
  100%{ background-position: 200% 0; background-size: 200% 100%; }
}

/* ---------- Android-style elevation hover ---------- */
.elevate{
  transition: box-shadow var(--fast) var(--e1), transform var(--fast) var(--e1);
}
.elevate:hover{
  transform: translateY(-3px);
  box-shadow: 0 26px 60px rgba(0,0,0,.35), 0 0 0 1px color-mix(in oklab, var(--accent-1), transparent 75%);
}

/* ---------- Matched persona accent rings ---------- */
.accent-ring{
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent-1), transparent 70%), 0 16px 30px color-mix(in oklab, var(--accent-2), transparent 80%);
}

/* ---------- Spinner utility ---------- */
.spin{ animation: spin 1s linear infinite }
@keyframes spin{ to{ transform: rotate(360deg) } }
