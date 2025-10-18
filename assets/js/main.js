const navToggle = document.querySelector('.nav__toggle');
const navList = document.getElementById('primary-navigation');

if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!expanded));
        navList.classList.toggle('nav__list--open');
    });
}

// Scroll animations
const animatedElements = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const delay = target.getAttribute('data-animate-delay');
            if (delay) {
                target.style.transitionDelay = `${delay}ms`;
            }
            target.classList.add('is-visible');
            observer.unobserve(target);
        }
    });
}, {
    threshold: 0.2
});

animatedElements.forEach(el => observer.observe(el));

// Counter animation for highlight metrics
const counters = document.querySelectorAll('.highlight__value');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix ?? '';
            const duration = 1400;
            const startTime = performance.now();

            function update(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                const value = Math.floor(progress * target);
                if (target >= 1000) {
                    const formatted = Math.round((value / 1000) * 10) / 10;
                    el.textContent = `${formatted.toFixed(formatted % 1 === 0 ? 0 : 1)}k${suffix}`;
                } else {
                    el.textContent = `${value}${suffix}`;
                }
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.6 });

counters.forEach(counter => counterObserver.observe(counter));

// Canvas nebula animation
const canvas = document.querySelector('.hero__nebula');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        createParticles();
    }

    function createParticles() {
        const count = Math.min(120, Math.floor(width / 16));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.8 + 0.6,
            speedX: (Math.random() - 0.5) * 0.25,
            speedY: (Math.random() - 0.5) * 0.25,
            alpha: Math.random() * 0.5 + 0.1
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createRadialGradient(width * 0.3, height * 0.2, 0, width * 0.3, height * 0.2, width * 0.8);
        gradient.addColorStop(0, 'rgba(79, 156, 255, 0.25)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(particle => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(140, 199, 255, ${particle.alpha})`;
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();

            particle.x += particle.speedX;
            particle.y += particle.speedY;

            if (particle.x < 0 || particle.x > width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > height) particle.speedY *= -1;
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
}
