(function () {
  const canvas = document.getElementById('hero-flow');
  if (!canvas) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fallbackLottie = document.querySelector('.hero__fallback--lottie');
  const fallbackCss = document.querySelector('.hero__fallback--css');
  const fallbackStatic = document.querySelector('.hero__fallback--static');

  function showFallback(type) {
    canvas.style.display = 'none';
    if (type === 'lottie' && fallbackLottie) {
      fallbackLottie.style.display = 'block';
    } else if (type === 'css' && fallbackCss) {
      fallbackCss.style.display = 'block';
    } else if (fallbackStatic) {
      fallbackStatic.style.display = 'block';
    }
  }

  if (prefersReducedMotion) {
    showFallback('static');
    return;
  }

  if (!window.THREE) {
    showFallback('lottie');
    return;
  }

  let renderer, scene, camera, particles, clock;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const particleCount = 900;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (error) {
    console.warn('Three.js renderer error', error);
    showFallback('css');
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(width, height, false);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 120;

  clock = new THREE.Clock();

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 160;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 1.8,
    color: 0x0057ff,
    transparent: true,
    opacity: 0.8
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const mouse = new THREE.Vector2(0, 0);
  window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  });

  function animate() {
    const delta = clock.getDelta();
    const positionsAttr = particles.geometry.attributes.position;
    for (let i = 0; i < positionsAttr.count; i++) {
      const ix = i * 3;
      positionsAttr.array[ix + 1] += Math.sin(delta + ix) * 0.08;
      positionsAttr.array[ix] += Math.cos(delta + ix) * 0.05;
    }
    positionsAttr.needsUpdate = true;

    particles.rotation.y += delta * 0.1;
    particles.rotation.x += (mouse.y * 0.05 - particles.rotation.x) * 0.02;
    particles.rotation.y += (mouse.x * 0.05 - particles.rotation.y) * 0.02;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
})();
