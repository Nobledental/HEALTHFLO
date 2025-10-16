# HEALTHFLO
NEW WEBSITE
# HealthFlo Web Experience

HealthFlo is a premium, animation-heavy marketing site for an AI-powered healthcare revenue cycle platform. The experience focuses on differentiated journeys for hospitals and patients, with bespoke motion design and a shared component system.

## ✨ Highlights
- **Immersive landing page** with animated hero, geo marquee, pathway toggles, preloader, counters, testimonials, and floating CTAs.
- **Audience-specific storytelling** across dedicated Solutions, Products, Impact, and Contact pages with rich GSAP timelines and modals.
- **Glassmorphism design system** using gradients, depth effects, and particle layers defined in `assets/css/styles.css`.
- **Modular animation suite** in `assets/js/animations.js` powered by GSAP ScrollTrigger, Intersection Observer fallbacks, and custom hover interactions.
- **Responsive quick navigation** that adapts for desktop/mobile and provides one-tap access to core pages.

## 🗂️ Project Structure
```
healthflo-website/
├── index.html              # Landing page with hero, pathways, marquee, testimonials
├── solutions.html          # Hospital vs patient solution narratives with workflow animations
├── products.html           # Interactive product grids, modals, and floating CTA
├── impact.html             # Case studies, animated metrics, and partner carousel
├── contact.html            # Animated form, engagement widgets, and map placeholder
├── assets/
│   ├── css/
│   │   └── styles.css      # Global styles, variables, components, responsive grid
│   ├── js/
│   │   └── animations.js   # GSAP scenes, counters, marquee duplication, nav logic
│   └── images/
│       └── favicon.svg     # Animated gradient emblem used as favicon/logo
└── README.md               # Project overview and developer guide
```

## 🚀 Getting Started

1. **Install dependencies** (only if you plan to use a live-reload server). The site itself is static HTML/CSS/JS and needs no build step.
2. **Serve locally** using any static server. For example:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser to explore the site.

> **Tip:** GSAP animations require scripts to be loaded from a server context to avoid CORS issues when referencing local assets. Using a simple HTTP server avoids these problems.

## 🧱 Design & Animation System
- **Color & depth**: Aurora gradients, neon accents, and glass panels configured through CSS variables.
- **Motion**: GSAP timelines for hero entrances, scroll-triggered reveals, marquee duplication, counters, hover tilt, and CTA pulses.
- **Accessibility**: Semantic HTML5 structure, ARIA labels on key regions, focus-visible treatments, and reduced-motion fallbacks.
- **Responsiveness**: Mobile-first breakpoints with fluid typography (`clamp()`), adaptive grids, and touch-friendly navigation.

## 🔧 Customization
- Update copy, assets, or modules directly in the HTML files.
- Extend styling in `assets/css/styles.css`; utility classes and component blocks follow BEM-inspired naming.
- Modify or add animations in `assets/js/animations.js` through modular init functions (e.g., `initHeroAnimations`, `initPathwayToggle`).

## 📄 License
This project is delivered as-is for demonstration and can be adapted to your deployment requirements.
