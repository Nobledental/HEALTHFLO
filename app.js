const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
const on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);
const app=document.body;
const store={get:k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};

/* Ripple press coordinates */
$$('.ripple').forEach(b=>{
  on(b,'pointerdown',e=>{
    const r=b.getBoundingClientRect();
    b.style.setProperty('--x', (e.clientX-r.left)+'px');
    b.style.setProperty('--y', (e.clientY-r.top)+'px');
  });
});

/* Mobile nav */
(()=>{const t=$('.nav__toggle'),links=$('.nav__links');if(!t||!links)return;on(t,'click',()=>{const o=t.getAttribute('aria-expanded')==='true';t.setAttribute('aria-expanded',String(!o));links.dataset.open=String(!o)});})();

/* Theme studio with new Apple Matte */
(()=>{const wrap=$('.theme');if(!wrap)return;const panel=$('.theme__panel',wrap),btns=$$('.tbtn',panel);const saved=store.get('hf-theme')||'night';function apply(n){app.classList.remove('theme--day','theme--aurora','theme--clinic','theme--contrast','theme--apple');if(n!=='night')app.classList.add(`theme--${n}`);btns.forEach(b=>b.classList.toggle('is-active',b.dataset.theme===n));store.set('hf-theme',n);}apply(saved);on($('.theme__toggle',wrap),'click',()=>wrap.setAttribute('aria-expanded',wrap.getAttribute('aria-expanded')!=='true'));btns.forEach(b=>on(b,'click',()=>{apply(b.dataset.theme);wrap.setAttribute('aria-expanded','false')}));on(document,'click',e=>{if(!wrap.contains(e.target))wrap.setAttribute('aria-expanded','false')});})();

/* Persona tabs (home only) + morph + typing */
(()=>{const tabs=$$('.role-tab');if(!tabs.length)return;const bubble=$('#roleBubble'),title=$('#hero-title'),typeSpan=$('#type-line .type-inner'),cta=$('#hero-cta'),path=$('#morphPath');const SHAPES={patient:"M12 20a12 12 0 0 1 12-12h16a12 12 0 0 1 12 12v24a12 12 0 0 1-12 12H24A12 12 0 0 1 12 44V20z",hospital:"M8 20a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v24a12 12 0 0 1-12 12H20A12 12 0 0 1 8 44V20z",insurer:"M10 22a14 14 0 0 1 14-14h16a14 14 0 0 1 14 14v20a20 20 0 0 1-14 19c-10-4-20-9-30-19V22z"};
const GRAD={patient:'url(#gradPatient)',hospital:'url(#gradHospital)',insurer:'url(#gradInsurer)'};
const PHRASES={patient:["Is my surgery cashless?","Show package prices for Bengaluru.","Compare room eligibility across plans.","Enable 0% EMI for approved treatments."],hospital:["Set up RCM with pre-auth SOPs.","Build packages & publish tariffs.","TAT heatmaps + SLA alerts."],insurer:["List plans by specialty & room eligibility.","Run a discount campaign in Chennai.","Enable pre-auth event webhooks."]};

let persona=store.get('hf-persona')||'patient';app.classList.add(`mode--${persona}`);tabs.forEach(t=>t.classList.toggle('is-active',t.dataset.persona===persona));path.setAttribute('fill',GRAD[persona]);

function springTo(el,targetX,dur=420){const start=performance.now();const init=el._x||0,dist=targetX-init;function frame(t){const p=Math.min(1,(t-start)/dur);const ease=1-Math.pow(1-p,3);const v=init+dist*ease;el.style.transform=`translate(${v}px, -50%)`;el._x=v;if(p<1)requestAnimationFrame(frame)}requestAnimationFrame(frame)}
function moveBubble(btn){const b=btn.getBoundingClientRect(), w=btn.parentElement.getBoundingClientRect();bubble.style.width=`${b.width+16}px`;bubble.style.height=`${b.height+8}px`;springTo(bubble,b.left-w.left-8,380)}
moveBubble(tabs.find(t=>t.classList.contains('is-active')));

let timer,idx=0,char=0,arr=[];
function startTyping(list){clearTimeout(timer);arr=list.slice();idx=0;char=0;typeSpan.textContent='';tick()}
function tick(){const s=arr[idx];const speed=26+Math.random()*18;if(char<=s.length){typeSpan.textContent=s.slice(0,char);char++;timer=setTimeout(tick,speed);}else{timer=setTimeout(()=>{idx=(idx+1)%arr.length;char=0;tick()},1600)}}
startTyping(PHRASES[persona]);

function setPersona(p){if(persona===p)return;app.classList.remove(`mode--${persona}`);persona=p;app.classList.add(`mode--${persona}`);store.set('hf-persona',persona);tabs.forEach(t=>{const a=t.dataset.persona===persona;t.classList.toggle('is-active',a);if(a)moveBubble(t)});path.setAttribute('fill',GRAD[persona]);try{if(window.flubber){const interp=flubber.interpolate(path.getAttribute('d'),SHAPES[persona],{maxSegmentLength:2});const D=520,s=performance.now();(function anim(t){const p=Math.min(1,(t-s)/D);path.setAttribute('d',interp(p));if(p<1)requestAnimationFrame(anim)})();}else path.setAttribute('d',SHAPES[persona]);}catch{path.setAttribute('d',SHAPES[persona])}
const copy={patient:["Find, book & pay for care — cashless first.","Start as Patient","#p-scope"],hospital:["RCM that reduces denials & speeds cashless.","Explore Hospital RCM","#h-scope"],insurer:["Distribution & ops built for India.","Explore Insurer Suite","#i-scope"]}[persona];title.textContent=copy[0];cta.textContent=copy[1];cta.setAttribute('href',copy[2]);startTyping(PHRASES[persona]);}
tabs.forEach(b=>on(b,'click',()=>setPersona(b.dataset.persona)));
})();

/* News-style cities ticker (duplicates for seamless loop) */
(()=>{const track=$('#cityTrack');if(!track)return;const cities=[['Delhi NCR','Network 320+'],['Mumbai','Network 280+'],['Bengaluru','Network 260+'],['Hyderabad','Network 220+'],['Chennai','Network 210+'],['Pune','Network 160+'],['Kolkata','Network 150+']];function render(){const row=cities.map(c=>`<span class="tag"><i class="ri-map-pin-line"></i>${c[0]} • ${c[1]}</span>`).join('');track.innerHTML=row+row;}render();})();

/* OTP / eligibility / co-pay (present on patient pages) */
(()=>{const phone=$('#phone');if(!phone)return;const send=$('.js-send-otp'),verify=$('.js-verify-otp'),wrap=$('.otp-wrap'),status=$('#otpStatus'),codes=$$('.otp-i');let code='';const gen=()=>String(Math.floor(1000+Math.random()*9000));on(send,'click',()=>{const dig=(phone.value||'').replace(/\D/g,'');if(dig.length<10){status.textContent='Enter a valid phone.';return}code=gen();wrap.classList.remove('hidden');status.textContent='OTP sent — check SMS';codes[0].focus();});codes.forEach((i,ix)=>{on(i,'input',()=>{i.value=i.value.replace(/\D/g,'').slice(0,1);if(i.value&&codes[ix+1])codes[ix+1].focus();});on(i,'keydown',e=>{if(e.key==='Backspace'&&!i.value&&codes[ix-1])codes[ix-1].focus();});});on(verify,'click',()=>{const v=codes.map(x=>x.value).join('');if(v===code){status.textContent='Verified ✓';status.style.color='#22c55e';toast('Phone verified');}else{status.textContent='Incorrect code';status.style.color='#ef4444';}});

const selects={ins:$('#elig-ins'),city:$('#elig-city'),spec:$('#elig-spec'),sum:$('#elig-sum')};const out=$('.elig-result');const copyBtn=$('#elig-copy');if(out&&Object.values(selects).every(Boolean)){function estimate(spec,sum){const base={general:.8,dental:.6,ophthalmology:.72,ivf:.55,orthopedics:.66,cardiac:.62,oncology:.5};const b=base[String(spec).toLowerCase()]??.6;const s=parseInt(sum,10)||5;const adj=s>20?-0.1:s>10?-0.05:0.02;return Math.round(Math.min(.92,Math.max(.3,b+adj))*100)}function render(){const pct=estimate(selects.spec.value,selects.sum.value);out.innerHTML=`Likely eligible: <b>${pct}%</b> — ${selects.spec.value}, ₹${selects.sum.value}L in ${selects.city.value}. <em>${selects.ins.value}</em>`}Object.values(selects).forEach(el=>on(el,'change',render));render();on(copyBtn,'click',async()=>{try{await navigator.clipboard.writeText(out.textContent.trim());toast('Eligibility copied');}catch{toast('Copy failed')}});}
const bill=$('#co-bill'),rate=$('#co-rate'),coOut=$('#co-out');if(bill&&rate&&coOut){function copay(){const b=Number(bill.value||0),r=Math.min(100,Math.max(0,Number(rate.value||0)));if(!b){coOut.textContent='Enter bill to estimate co-pay.';return}const c=Math.round(b*(r/100));coOut.innerHTML=`Estimated co-pay: <b>₹${c.toLocaleString('en-IN')}</b>. Net payable: <b>₹${(b-c).toLocaleString('en-IN')}</b>.`}on(bill,'input',copay);on(rate,'input',copay);}
})();

/* Toast */
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('in');clearTimeout(t._tmr);t._tmr=setTimeout(()=>t.classList.remove('in'),1500);}

/* Tilt hover */
(()=>{$$('.tilt').forEach(card=>{let raf;function move(e){const b=card.getBoundingClientRect();const px=(e.clientX-b.left)/b.width-.5;const py=(e.clientY-b.top)/b.height-.5;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>card.style.transform=`translateY(-6px) rotateX(${py*-6}deg) rotateY(${px*8}deg)`) }function leave(){cancelAnimationFrame(raf);card.style.transform=''}on(card,'mousemove',move);on(card,'mouseleave',leave);});})();

/* Particles */
(()=>{const c=$('#particles');if(!c)return;const dpr=Math.min(2,devicePixelRatio||1),ctx=c.getContext('2d');let W,H,dots=[];function resize(){W=c.width=innerWidth*dpr;H=c.height=innerHeight*dpr;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';dots=Array.from({length:64},()=>({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*1.8,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2}))}resize();addEventListener('resize',resize);(function loop(){ctx.clearRect(0,0,W,H);ctx.fillStyle='rgba(255,255,255,.08)';dots.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(loop)})();})();

/* GSAP entrances (if available) */
(()=>{if(!window.gsap)return;const {gsap}=window;gsap.timeline({defaults:{ease:'power3.out'}}).from('.brand',{y:-12,opacity:0,duration:.5}).from('.nav__links a',{y:-8,opacity:0,stagger:.06,duration:.35},'-=.3').from('.role-tab',{y:16,opacity:0,stagger:.06,duration:.45},'-=.1').from('.morph',{y:18,opacity:0,duration:.45},'-=.2');gsap.utils.toArray('.card,.product').forEach(el=>gsap.from(el,{y:20,opacity:0,duration:.55,scrollTrigger:{trigger:el,start:'top 85%'}}));})();

/* Scroll spy */
(()=>{const links=$$('.nav__links a');if(!links.length)return;const map=new Map(links.map(a=>[a.getAttribute('href'),a]));const obs=new IntersectionObserver((es)=>{es.forEach(({isIntersecting,target})=>{const id='#'+target.id;const a=map.get(id);if(!a)return;if(isIntersecting){links.forEach(x=>x.classList.remove('active'));a.classList.add('active')}})},{rootMargin:'-40% 0px -50% 0px',threshold:0.01});['hero','locations','content','trust','contact'].forEach(id=>{const el=$('#'+id);if(el)obs.observe(el)});})();

/* Pointer ripple for all .ripple (already handled coords above) */

/* Prevent persona click from scrolling (no hash changes); handled because buttons don't change anchor */
