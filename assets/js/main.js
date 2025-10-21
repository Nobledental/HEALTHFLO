/* =========================================================
   HealthFlo — main.js
   - Theme studio (Android HDR <-> Apple Matte)
   - Non-scroll persona switches
   - Role bubble spring, typewriter micro-interactions
   - Cities marquee (CSS pauses on hover)
   - Scroll-spy on chips
   - Perf-friendly opts (passive listeners, rIC)
   ========================================================= */

(() => {
  const body = document.body;
  const key = 'hf-theme-v2';
  const toggle = document.getElementById('themeToggle');

  // Restore theme
  const saved = localStorage.getItem(key) || 'android';
  if (saved === 'matte') {
    body.classList.remove('theme--android-glow');
    body.classList.add('theme--apple-matte');
    toggle?.setAttribute('aria-pressed','true');
  } else {
    body.classList.add('theme--android-glow');
    toggle?.setAttribute('aria-pressed','false');
  }

  toggle?.addEventListener('click', () => {
    const isMatte = body.classList.toggle('theme--apple-matte');
    body.classList.toggle('theme--android-glow', !isMatte);
    localStorage.setItem(key, isMatte ? 'matte' : 'android');
    toggle.setAttribute('aria-pressed', isMatte ? 'true' : 'false');
  }, { passive:true });
})();

// Prevent scroll-jumps for persona nav + external links marked data-no-scroll
(() => {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a,button');
    if (!a) return;

    // role buttons do not scroll page
    if (a.matches('.role-btn')) {
      e.preventDefault();
      // If it has a location redirect, follow without #anchors
      const href = a.getAttribute('onclick');
      if (href && href.includes('location.href')) {
        // evaluate just the URL part safely
        const url = href.split("location.href=")[1]?.replace(/['";]/g,'') || null;
        if (url) window.location.href = url;
      } else {
        // On index, just toggle bubble (no auto scroll)
        const all = [...document.querySelectorAll('.role-btn')];
        const idx = all.indexOf(a);
        const bubble = document.getElementById('roleBubble') || document.querySelector('.bubble');
        all.forEach(x => x.classList.remove('is-active'));
        a.classList.add('is-active');
        if (bubble) {
          const rect = a.getBoundingClientRect();
          const parent = a.parentElement.getBoundingClientRect();
          const tx = rect.left - parent.left;
          bubble.style.width = rect.width + 'px';
          bubble.style.transform = `translateX(${tx}px) translateY(-50%)`;
        }
      }
    }

    // links annotated with data-no-scroll never cause anchor jumps
    if (a.hasAttribute('data-no-scroll')) {
      e.preventDefault();
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#')) window.location.href = href;
    }
  });
})();

// Role bubble spring (on load + resize)
(() => {
  function placeInitialBubble() {
    const active = document.querySelector('.role-btn.is-active');
    const bubble = document.getElementById('roleBubble') || document.querySelector('.bubble');
    if (!active || !bubble) return;
    const rect = active.getBoundingClientRect();
    const parent = active.parentElement.getBoundingClientRect();
    const tx = rect.left - parent.left;
    bubble.style.width = rect.width + 'px';
    bubble.style.transform = `translateX(${tx}px) translateY(-50%)`;
  }
  window.addEventListener('load', placeInitialBubble);
  window.addEventListener('resize', placeInitialBubble);
})();

// Typewriter micro-interaction
(() => {
  const el = document.getElementById('typeTarget');
  if (!el) return;
  const phrases = JSON.parse(el.dataset.typing || '[]');
  let i = 0, j = 0, deleting = false;

  function tick() {
    const p = phrases[i] || '';
    if (!deleting) {
      j++;
      el.textContent = p.slice(0, j);
      if (j === p.length) { deleting = true; setTimeout(tick, 1200); return; }
      setTimeout(tick, 28 + Math.random()*60);
    } else {
      j--;
      el.textContent = p.slice(0, j);
      if (j === 0) { deleting = false; i = (i+1)%phrases.length; setTimeout(tick, 300); return; }
      setTimeout(tick, 18 + Math.random()*30);
    }
  }
  tick();
})();

// Scroll-spy for top chips (sections within page only)
(() => {
  const chips = [...document.querySelectorAll('.top-nav .chip')];
  const targets = chips
    .map(c => c.getAttribute('href'))
    .filter(h => h && h.startsWith('#'))
    .map(h => document.querySelector(h))
    .filter(Boolean);

  if (!targets.length) return;

  const map = new Map(targets.map((sec) => [sec.id, chips.find(c => c.getAttribute('href') === `#${sec.id}`)]));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({isIntersecting, target}) => {
      if (!isIntersecting) return;
      chips.forEach(c => c.classList.remove('active'));
      const chip = map.get(target.id);
      chip?.classList.add('active');
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 });

  targets.forEach(sec => io.observe(sec));
})();

// Particle field (lightweight)
(() => {
  const c = document.getElementById('particles');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w=0,h=0; const pts = [];
  function resize(){ w = c.width = innerWidth; h = c.height = innerHeight; pts.length=80; for(let i=0;i<pts.length;i++){ pts[i]={x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3}; } }
  function step(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for(const p of pts){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.arc(p.x,p.y,1.1,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(step);
  }
  resize(); step();
  window.addEventListener('resize', resize, { passive:true });
})();
