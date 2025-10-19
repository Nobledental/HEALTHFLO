# HealthFlo Hospitals Network Landing Page

This repository contains the production-ready landing page for **HealthFlo Hospitals Network (HHN)**, an AI-powered health-tech marketplace connecting patients with hospital services and managing end-to-end revenue cycle operations.

## Features

- Responsive, accessible layout crafted with semantic HTML, Inter and Noto Sans typography, and WCAG AA contrast compliance.
- Premium hero experience featuring a Three.js flow-field animation with graceful fallbacks (Lottie, CSS gradient, static SVG).
- GSAP-powered scroll animations and counters with `prefers-reduced-motion` support.
- Lenis smooth scrolling, sticky header, keyboard-navigable menus, tabs, and accordions.
- Dual journey storytelling for patients and hospitals, including how-it-works guides, product modules, AI chat demos, diagnostics slot previews, and proof metrics.
- Contact forms with Netlify compatibility, DPDP consent capture, and intelligent department email routing.
- PWA setup with manifest and service worker providing offline caching for the landing shell.
- SEO-friendly metadata, social previews, JSON-LD (Organization, Services, FAQ), and sitemap/robots configuration.

## Structure

```
index.html
assets/
  css/
    main.css
    animations.css
  js/
    main.js
    gsap-init.js
    three-hero.js
    ai-demo.js
    forms.js
  img/
  icons/
  lottie/
manifest.json
service-worker.js
sitemap.xml
robots.txt
```

## Getting Started

1. Serve locally with any static server (e.g. `npx serve .` or `python -m http.server`).
2. Ensure access to the internet for CDN dependencies (GSAP, Three.js, Lenis, Lottie).
3. Deploy to any static hosting provider (Netlify, Vercel, GitHub Pages). Netlify Forms are auto-configured.

## Accessibility & Performance Notes

- Skip link, focus outlines, and keyboard support included by default.
- Animations respect `prefers-reduced-motion`.
- Images and animations include fallbacks and lazy loading where applicable.
- Target Lighthouse scores ≥90 across categories on mobile with optimized assets and caching.

## Contact

HealthFlo Ventures Pvt. Ltd. — [www.healthflo.org](https://www.healthflo.org/) • [info@healthflo.in](mailto:info@healthflo.in) • +91-9342569379 / 8610425342
