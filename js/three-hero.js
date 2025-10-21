// Particles (tiny, performant)
(() => {
  const c = document.getElementById('particles'); if(!c) return;
  const ctx = c.getContext('2d'); let W,H, pts=[];
  function resize(){ W= c.width  = innerWidth; H = c.height = innerHeight; pts = Array.from({length:Math.min(120, Math.floor(W*H/40000))},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.6+0.4})) }
  resize(); addEventListener('resize', resize);
  function step(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(124,92,255,.6)';
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W) p.vx*=-1; if(p.y<0||p.y>H) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(step);
  }
  step();
})();

// Lottie hero blob with fallback
(() => {
  const host = document.getElementById('lottieHero'); if(!host) return;
  const src = host.dataset.src, fallback = host.dataset.fallback;
  if (window.lottie){
    try{
      window.lottie.loadAnimation({ container: host, renderer: 'svg', loop: true, autoplay: true, path: src });
    }catch{ host.innerHTML = `<img alt="" src="${fallback}" />`; }
  } else { host.innerHTML = `<img alt="" src="${fallback}" />`; }
})();
