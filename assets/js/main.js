const navToggles = document.querySelectorAll('.nav__toggle');
navToggles.forEach((toggle) => {
  const menu = toggle.nextElementSibling;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.dataset.open = (!expanded).toString();
  });
});

document.querySelectorAll('.select-card').forEach((card) => {
  card.addEventListener('click', () => {
    const target = card.dataset.target;
    if (target) {
      window.location.href = target;
    }
  });
  card.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = card.dataset.target;
      if (target) {
        window.location.href = target;
      }
    }
  });
});

const simulatorSteps = document.querySelectorAll('.simulator__flow-item');
if (simulatorSteps.length) {
  let index = 0;
  setInterval(() => {
    simulatorSteps.forEach((step, i) => {
      step.classList.toggle('active', i <= index);
    });
    index = (index + 1) % simulatorSteps.length;
  }, 4000);
}

const patientSteps = document.querySelectorAll('.patient-demo__step');
if (patientSteps.length) {
  let stepIndex = 0;
  setInterval(() => {
    patientSteps.forEach((step, i) => {
      step.dataset.focus = i === stepIndex ? 'true' : 'false';
    });
    stepIndex = (stepIndex + 1) % patientSteps.length;
  }, 4500);
}

const animatedElements = document.querySelectorAll('[data-animate]');
if (animatedElements.length && 'IntersectionObserver' in window) {
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

  animatedElements.forEach((el) => {
    if (!el.dataset.animate) {
      el.dataset.animate = 'out';
    }
    observer.observe(el);
  });
}

const marqueeTrack = document.querySelector('.geo-marquee__track');
if (marqueeTrack) {
  marqueeTrack.innerHTML += marqueeTrack.innerHTML;
}
