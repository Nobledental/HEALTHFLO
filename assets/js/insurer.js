/* =========================================================
   HealthFlo — insurer.js
   - Listing wizard (JSON)
   - Discount lift simulator + tiny canvas chart
   - Copy webhook sample
   ========================================================= */

(function wizard(){
  const name = document.getElementById('wiz-name');
  const sum = document.getElementById('wiz-sum');
  const room = document.getElementById('wiz-room');
  const opd = document.getElementById('wiz-opd');
  const out = document.getElementById('wiz-json');
  const btn = document.getElementById('wiz-build');

  function build(){
    const obj = {
      plan: (name.value||'Unnamed Plan').trim(),
      sum_insured_lakh: Number(sum.value||10),
      room_eligibility: (room.value||'Single AC').trim(),
      opd: opd.value==='Yes',
      schema_version:'1.0',
      created_at: new Date().toISOString()
    };
    out.textContent = JSON.stringify(obj, null, 2);
  }
  btn?.addEventListener('click', build);
})();

(function discounts(){
  const base = document.getElementById('ds-base');
  const disc = document.getElementById('ds-disc');
  const out = document.getElementById('ds-out');
  const canvas = document.getElementById('ds-chart');
  const ctx = canvas?.getContext('2d');

  function sim(){
    const b = Math.max(0, Number(base.value||0));
    const d = Math.max(0, Number(disc.value||0));
    const lift = 1 + (d/100)*0.8; // heuristic
    const cvr = (b * lift);
    out.innerHTML = `Expected CVR: <b>${cvr.toFixed(2)}%</b> (lift ×${lift.toFixed(2)})`;
    draw(b, cvr);
  }
  function draw(b, c){
    if(!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const bar = (x,val,color) => {
      const h = Math.max(2, (val/100)*H);
      ctx.fillStyle = color;
      ctx.fillRect(x, H-h, 80, h);
    };
    bar(40, b, 'rgba(140,125,255,.8)');
    bar(160, c, 'rgba(47,211,238,.9)');
    ctx.fillStyle = '#fff'; ctx.font = '12px Inter';
    ctx.fillText('Base', 58, 14);
    ctx.fillText('New', 182, 14);
  }

  base?.addEventListener('input', sim);
  disc?.addEventListener('input', sim);
  sim();
})();

(function copyWebhook(){
  const pre = document.getElementById('api-json');
  const btn = document.getElementById('api-copy');
  btn?.addEventListener('click', async ()=>{
    try { await navigator.clipboard.writeText(pre.textContent); toast('Webhook JSON copied'); }
    catch { toast('Copy failed'); }
  });
})();

function toast(msg){
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('in');
  clearTimeout(t._h); t._h = setTimeout(()=> t.classList.remove('in'), 1400);
}
