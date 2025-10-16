const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

document.querySelectorAll('[data-marquee]').forEach(stream => {
  const clone = stream.innerHTML;
  stream.insertAdjacentHTML('beforeend', clone);
});

const stats = document.querySelectorAll('[data-count]');
const countOptions = {
  threshold: 0.6,
};

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = parseInt(el.dataset.duration || '1800', 10);
      let start = null;

      const step = timestamp => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const value = prefix + (target * easeOut).toFixed(target % 1 === 0 ? 0 : 1) + suffix;
        el.textContent = value;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
      countObserver.unobserve(el);
    }
  });
}, countOptions);

stats.forEach(stat => countObserver.observe(stat));

const toggles = document.querySelectorAll('[data-toggle]');

toggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const targetId = toggle.dataset.toggle;
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.toggle('expanded');
    }
  });
});

const demoGroups = document.querySelectorAll('[data-demo-group]');

demoGroups.forEach(group => {
  const targetSelector = group.dataset.demoTarget;
  if (!targetSelector) return;
  const panelContainer = document.querySelector(targetSelector);
  if (!panelContainer) return;

  const buttons = Array.from(group.querySelectorAll('[data-demo-control]'));
  const panels = Array.from(panelContainer.querySelectorAll('[data-demo-panel]'));

  const activate = slug => {
    buttons.forEach(btn => {
      const isActive = btn.dataset.demoControl === slug;
      btn.classList.toggle('active', isActive);
    });
    panels.forEach(panel => {
      const isActive = panel.dataset.demoPanel === slug;
      panel.classList.toggle('active', isActive);
    });
  };

  if (buttons.length) {
    activate(buttons[0].dataset.demoControl);
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      activate(button.dataset.demoControl);
    });
  });
});

const heroCanvas = document.getElementById('networkCanvas');
if (heroCanvas) {
  const ctx = heroCanvas.getContext('2d');
  let particles = [];

  const initParticles = () => {
    const { width, height } = heroCanvas;
    particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
    }));
  };

  const render = () => {
    ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x <= 0 || p.x >= heroCanvas.width) p.vx *= -1;
      if (p.y <= 0 || p.y >= heroCanvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = 'rgba(124, 206, 255, 0.7)';
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      particles.forEach((p2, j) => {
        if (i === j) return;
        const dx = p2.x - p.x;
        const dy = p2.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(90, 111, 240, ${1 - dist / 120})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });

    requestAnimationFrame(render);
  };

  const resizeCanvas = () => {
    const rect = heroCanvas.getBoundingClientRect();
    heroCanvas.width = rect.width;
    heroCanvas.height = rect.height;
    initParticles();
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  render();
}

const organCanvas = document.getElementById('organCanvas');
if (organCanvas) {
  const ctx = organCanvas.getContext('2d');
  let size = { width: organCanvas.clientWidth, height: organCanvas.clientHeight };
  const organNodes = Array.from({ length: 22 }, () => ({
    angle: Math.random() * Math.PI * 2,
    radiusFactor: 0.35 + Math.random() * 0.45,
    speed: 0.003 + Math.random() * 0.004,
    size: 3 + Math.random() * 3,
  }));
  let tick = 0;

  const resizeCanvas = () => {
    const rect = organCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    organCanvas.width = rect.width * ratio;
    organCanvas.height = rect.height * ratio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    size = { width: rect.width, height: rect.height };
  };

  const drawHeart = (cx, cy, scale, pulse) => {
    ctx.save();
    ctx.translate(cx, cy + 10);
    ctx.scale(scale, scale);
    ctx.beginPath();
    for (let angle = 0; angle <= Math.PI * 2; angle += 0.04) {
      const x = 16 * Math.pow(Math.sin(angle), 3);
      const y =
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle);
      const px = (x / 18) * pulse;
      const py = (-y / 18) * pulse;
      if (angle === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    const gradient = ctx.createRadialGradient(0, -0.6, 0, 0, 0, 1.8);
    gradient.addColorStop(0, 'rgba(255, 120, 146, 0.95)');
    gradient.addColorStop(0.5, 'rgba(255, 65, 105, 0.85)');
    gradient.addColorStop(1, 'rgba(150, 20, 60, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = 'rgba(255, 200, 210, 0.8)';
    ctx.stroke();
    ctx.restore();
  };

  const drawArteries = (cx, cy, base, pulse) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(83, 158, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    const scale = base / 120;
    ctx.beginPath();
    ctx.moveTo(-120 * scale, -40 * scale);
    ctx.bezierCurveTo(-60 * scale, -120 * scale, -20 * scale, -80 * scale, -8 * scale, (-28 - pulse * 6) * scale);
    ctx.bezierCurveTo(20 * scale, 20 * scale, 60 * scale, 0, 120 * scale, -30 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-110 * scale, 50 * scale);
    ctx.bezierCurveTo(-50 * scale, 90 * scale, -20 * scale, 60 * scale, 0, (24 + pulse * 4) * scale);
    ctx.bezierCurveTo(30 * scale, -10 * scale, 80 * scale, -20 * scale, 130 * scale, 30 * scale);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const drawPulseRings = (cx, cy, base, beat) => {
    for (let i = 0; i < 3; i += 1) {
      const radius = base + i * base * 0.22 + Math.sin(beat + i) * 6;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(83, 158, 255, ${0.28 - i * 0.06})`;
      ctx.lineWidth = 1.4;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawNodes = (cx, cy, base) => {
    ctx.save();
    ctx.translate(cx, cy);
    organNodes.forEach(node => {
      node.angle += node.speed;
      const radius = base * node.radiusFactor + Math.sin(tick * 0.6 + node.radiusFactor * 10) * 6;
      const x = Math.cos(node.angle) * radius;
      const y = Math.sin(node.angle) * radius * 0.8;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(83, 158, 255, 0.65)';
      ctx.arc(x, y, node.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(83, 158, 255, 0.18)';
      ctx.moveTo(x, y);
      ctx.lineTo(x * 0.6, y * 0.6);
      ctx.stroke();
    });
    ctx.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, size.width, size.height);
    const cx = size.width / 2;
    const cy = size.height / 2;
    const pulse = 1 + Math.sin(tick * 1.5) * 0.08;
    const base = Math.min(size.width, size.height) / 2.6;
    drawPulseRings(cx, cy, base, tick * 0.8);
    drawNodes(cx, cy, base * 0.9);
    drawArteries(cx, cy, base, Math.sin(tick));
    drawHeart(cx, cy, Math.min(size.width, size.height) / 220, pulse);

    // highlight caution markers
    ctx.save();
    ctx.translate(cx, cy);
    const markers = 5;
    for (let i = 0; i < markers; i += 1) {
      const angle = (Math.PI * 2 * i) / markers + tick * 0.3;
      const radius = base * 0.55 + Math.sin(tick + i) * 6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.9;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 230, 120, 0.8)';
      ctx.arc(x, y, 5 + Math.sin(tick * 2 + i) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    tick += 0.02;
    requestAnimationFrame(render);
  };

  resizeCanvas();
  render();
  window.addEventListener('resize', resizeCanvas);
}
