/* ===== State ===== */
let currentScreen=0, selectedPart=null, painLevel=0, painAreaSize=1;
let timerInterval=null, timerSeconds=1200, timerRunning=false, totalTimerSeconds=1200;
let currentView='front', allZones=[], activeProfile=null;
const CIRCUMFERENCE=2*Math.PI*120;
const painLabels=['No Pain','Minimal','Mild','Uncomfortable','Moderate','Distracting','Distressing','Unmanageable','Intense','Severe','Worst Pain'];
const sizeLabels=['Small','Medium','Large'];
const quotes=["Every step forward is a step toward healing.","Your strength is greater than any pain.","Recovery begins with a single step.","Healing is not linear, but every effort counts.","Breathe. Believe. Begin."];

const profiles=[
  {id:1,name:'John Miller',age:45,gender:'male',photo:'https://randomuser.me/api/portraits/men/32.jpg',sessions:12,lastArea:'Lower Back',lastInt:'6/10'},
  {id:2,name:'Sarah Chen',age:32,gender:'female',photo:'https://randomuser.me/api/portraits/women/44.jpg',sessions:8,lastArea:'Right Knee',lastInt:'4/10'},
  {id:3,name:'Raj Patel',age:58,gender:'male',photo:'https://randomuser.me/api/portraits/men/86.jpg',sessions:15,lastArea:'Left Shoulder',lastInt:'7/10'},
  {id:4,name:'Maria Garcia',age:41,gender:'female',photo:'https://randomuser.me/api/portraits/women/65.jpg',sessions:5,lastArea:'Neck',lastInt:'3/10'},
  {id:5,name:'David Kim',age:67,gender:'male',photo:'https://randomuser.me/api/portraits/men/75.jpg',sessions:20,lastArea:'Right Hip',lastInt:'5/10'},
  {id:6,name:'Anna Novak',age:29,gender:'female',photo:'https://randomuser.me/api/portraits/women/21.jpg',sessions:0,lastArea:'—',lastInt:'—'}
];

function getTimerMinutes(i){if(i<=2)return 5;if(i<=4)return 10;if(i<=6)return 15;if(i<=8)return 20;return 25}

/* ===== Body SVG Data ===== */
const maleOutline=`<g class="body-outline" stroke="rgba(255,255,255,0.13)" stroke-width="1" fill="none">
<ellipse cx="100" cy="32" rx="22" ry="28"/><rect x="90" y="58" width="20" height="14" rx="4"/>
<path d="M66 72Q58 72 56 80L50 150Q48 165 58 172L78 178Q100 182 122 178L142 172Q152 165 150 150L144 80Q142 72 134 72Z"/>
<path d="M56 80Q40 82 34 100L24 155Q22 165 26 170L34 172Q38 168 36 158L46 105Q48 95 52 88"/>
<path d="M144 80Q160 82 166 100L176 155Q178 165 174 170L166 172Q162 168 164 158L154 105Q152 95 148 88"/>
<path d="M78 178Q72 195 70 230L66 310Q64 340 68 360L72 390Q74 400 80 400L86 398Q88 395 86 385L82 360Q80 340 82 310L86 230Q88 210 92 195"/>
<path d="M122 178Q128 195 130 230L134 310Q136 340 132 360L128 390Q126 400 120 400L114 398Q112 395 114 385L118 360Q120 340 118 310L114 230Q112 210 108 195"/>
</g>`;

const femaleOutline=`<g class="body-outline" stroke="rgba(255,255,255,0.13)" stroke-width="1" fill="none">
<ellipse cx="100" cy="32" rx="20" ry="26"/><rect x="91" y="56" width="18" height="14" rx="4"/>
<path d="M72 72Q66 72 64 80L60 108Q58 118 62 128L56 152Q52 168 62 176L82 184Q100 188 118 184L138 176Q148 168 144 152L138 128Q142 118 140 108L136 80Q134 72 128 72Z"/>
<path d="M64 80Q50 82 44 100L34 155Q32 165 36 170L42 172Q46 168 44 158L52 105Q54 95 58 88"/>
<path d="M136 80Q150 82 156 100L166 155Q168 165 164 170L158 172Q154 168 156 158L148 105Q146 95 142 88"/>
<path d="M80 184Q74 200 72 230L68 310Q66 340 70 360L74 390Q76 400 82 400L88 398Q90 395 88 385L84 360Q82 340 84 310L88 230Q90 210 94 200"/>
<path d="M120 184Q126 200 128 230L132 310Q134 340 130 360L126 390Q124 400 118 400L112 398Q110 395 112 385L116 360Q118 340 116 310L112 230Q110 210 106 200"/>
</g>`;

const frontZones=[
  {zone:'Head',el:'ellipse',cx:100,cy:32,rx:20,ry:26},
  {zone:'Neck',el:'rect',x:88,y:56,w:24,h:16},
  {zone:'Left Shoulder',el:'rect',x:52,y:72,w:26,h:22},
  {zone:'Right Shoulder',el:'rect',x:122,y:72,w:26,h:22},
  {zone:'Chest',el:'rect',x:72,y:80,w:56,h:36},
  {zone:'Abdomen',el:'rect',x:72,y:120,w:56,h:40},
  {zone:'Left Arm',el:'rect',x:26,y:95,w:22,h:70},
  {zone:'Right Arm',el:'rect',x:152,y:95,w:22,h:70},
  {zone:'Hip',el:'rect',x:68,y:162,w:64,h:22},
  {zone:'Left Thigh',el:'rect',x:66,y:190,w:28,h:55},
  {zone:'Right Thigh',el:'rect',x:106,y:190,w:28,h:55},
  {zone:'Left Knee',el:'rect',x:66,y:250,w:24,h:30},
  {zone:'Right Knee',el:'rect',x:110,y:250,w:24,h:30},
  {zone:'Left Leg',el:'rect',x:64,y:285,w:22,h:55},
  {zone:'Right Leg',el:'rect',x:114,y:285,w:22,h:55},
  {zone:'Left Foot',el:'rect',x:64,y:345,w:24,h:20},
  {zone:'Right Foot',el:'rect',x:112,y:345,w:24,h:20}
];

const backZones=[
  {zone:'Head (Back)',el:'ellipse',cx:100,cy:32,rx:20,ry:26},
  {zone:'Neck (Back)',el:'rect',x:88,y:56,w:24,h:16},
  {zone:'Left Shoulder (Back)',el:'rect',x:52,y:72,w:26,h:22},
  {zone:'Right Shoulder (Back)',el:'rect',x:122,y:72,w:26,h:22},
  {zone:'Upper Back',el:'rect',x:72,y:80,w:56,h:36},
  {zone:'Lower Back',el:'rect',x:72,y:120,w:56,h:40},
  {zone:'Left Arm (Back)',el:'rect',x:26,y:95,w:22,h:70},
  {zone:'Right Arm (Back)',el:'rect',x:152,y:95,w:22,h:70},
  {zone:'Glutes',el:'rect',x:68,y:162,w:64,h:22},
  {zone:'Left Hamstring',el:'rect',x:66,y:190,w:28,h:55},
  {zone:'Right Hamstring',el:'rect',x:106,y:190,w:28,h:55},
  {zone:'Left Calf',el:'rect',x:64,y:270,w:22,h:65},
  {zone:'Right Calf',el:'rect',x:114,y:270,w:22,h:65},
  {zone:'Left Achilles',el:'rect',x:66,y:340,w:20,h:24},
  {zone:'Right Achilles',el:'rect',x:114,y:340,w:20,h:24}
];

/* ===== Render Functions ===== */
function renderProfiles(){
  const g=document.getElementById('profile-grid');g.innerHTML='';
  profiles.forEach(p=>{
    const c=document.createElement('div');c.className='profile-card';
    c.innerHTML=`<img class="profile-photo" src="${p.photo}" alt="${p.name}" onerror="this.style.background='linear-gradient(135deg,#6366f1,#8b5cf6)';this.style.display='flex';this.alt='${p.name[0]}'"/><div class="profile-name">${p.name}</div>`;
    c.addEventListener('click',()=>openProfileDetail(p));
    g.appendChild(c);
  });
}

function openProfileDetail(p){
  activeProfile=p;
  document.getElementById('pd-photo').src=p.photo;
  document.getElementById('pd-welcome').textContent=`Welcome back, ${p.name.split(' ')[0]}!`;
  document.getElementById('pd-quote').textContent=quotes[Math.floor(Math.random()*quotes.length)];
  document.getElementById('pd-sessions').textContent=p.sessions;
  document.getElementById('pd-last-area').textContent=p.lastArea;
  document.getElementById('pd-last-int').textContent=p.lastInt;
  document.getElementById('profile-overlay').classList.add('visible');
}

function closeProfileDetail(){document.getElementById('profile-overlay').classList.remove('visible')}

function renderBodySvg(){
  if(!activeProfile)return;
  const isMale=activeProfile.gender==='male';
  const outline=isMale?maleOutline:femaleOutline;
  const zones=currentView==='front'?frontZones:backZones;
  const svgId=currentView==='front'?'body-svg-front':'body-svg-back';
  const svg=document.getElementById(svgId);
  let html=outline+'<g class="body-zones">';
  zones.forEach(z=>{
    if(z.el==='ellipse') html+=`<ellipse class="bzone" data-zone="${z.zone}" cx="${z.cx}" cy="${z.cy}" rx="${z.rx}" ry="${z.ry}"/>`;
    else html+=`<rect class="bzone" data-zone="${z.zone}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="6"/>`;
  });
  html+='</g><circle class="pain-ring" id="pain-ring-'+currentView+'" cx="0" cy="0" r="0"/>';
  svg.innerHTML=html;
  bindZones(svg);
  allZones=Array.from(svg.querySelectorAll('.bzone'));
}

function renderBothViews(){
  const cv=currentView;
  currentView='front';renderBodySvg();
  currentView='back';renderBodySvg();
  currentView=cv;
}

function bindZones(svg){
  svg.querySelectorAll('.bzone').forEach(z=>{
    z.addEventListener('click',e=>{e.stopPropagation();selectZone(z)});
  });
}

/* ===== Navigation ===== */
function go(idx){
  if(idx===4){
    document.getElementById('sa').textContent=selectedPart||'—';
    document.getElementById('ss').textContent=selectedPart?sizeLabels[painAreaSize-1]:'—';
    document.getElementById('si').textContent=painLevel+' / 10';
    document.getElementById('sd').textContent=getTimerMinutes(painLevel)+' min';
  }
  if(idx===5){setupTimerScreen();startTimer();document.getElementById('timer-done-bar').classList.add('hidden')}
  if(currentScreen===5&&idx!==5)stopTimer();
  const screens=document.querySelectorAll('.screen');
  const prev=screens[currentScreen],next=screens[idx];
  if(!prev||!next)return;
  prev.classList.remove('active');prev.classList.add('exit');
  setTimeout(()=>prev.classList.remove('exit'),500);
  next.classList.add('active');currentScreen=idx;
}

function switchBodyView(v){
  currentView=v;
  document.getElementById('bodymap-front').classList.toggle('hidden',v!=='front');
  document.getElementById('bodymap-back').classList.toggle('hidden',v==='back'?false:true);
  // fix: show correct view
  if(v==='front'){document.getElementById('bodymap-front').classList.remove('hidden');document.getElementById('bodymap-back').classList.add('hidden')}
  else{document.getElementById('bodymap-back').classList.remove('hidden');document.getElementById('bodymap-front').classList.add('hidden')}
  document.getElementById('vtab-front').classList.toggle('active',v==='front');
  document.getElementById('vtab-back').classList.toggle('active',v==='back');
  allZones=Array.from(document.getElementById(v==='front'?'body-svg-front':'body-svg-back').querySelectorAll('.bzone'));
}

/* ===== Zone Selection with Ring ===== */
function getZoneCenter(z){
  const b=z.getBBox();return{cx:b.x+b.width/2,cy:b.y+b.height/2,r:Math.max(b.width,b.height)/2}
}

function selectZone(zoneEl){
  document.querySelectorAll('.pain-ring').forEach(r=>{r.classList.remove('visible');r.setAttribute('r','0')});
  selectedPart=zoneEl.dataset.zone;
  const c=getZoneCenter(zoneEl);
  const ringId='pain-ring-'+currentView;
  const ring=document.getElementById(ringId);
  const sizes=[c.r*1.1, c.r*1.6, c.r*2.2];
  ring.setAttribute('cx',c.cx);ring.setAttribute('cy',c.cy);
  ring.setAttribute('r',sizes[painAreaSize-1]);
  ring.classList.add('visible');
  document.getElementById('zone-name').textContent=selectedPart;
  document.getElementById('size-selector').classList.remove('hidden');
  document.getElementById('bodymap-continue').classList.remove('hidden');
  renderZoomView(zoneEl);
  updateSizeBtns();
}

function updatePainRing(){
  const sel=document.querySelector('.bzone[data-zone="'+selectedPart+'"]');
  if(!sel)return;
  const c=getZoneCenter(sel);
  const ring=document.getElementById('pain-ring-'+currentView);
  const sizes=[c.r*1.1, c.r*1.6, c.r*2.2];
  ring.setAttribute('r',sizes[painAreaSize-1]);
  renderZoomView(sel);
}

function updateSizeBtns(){
  document.querySelectorAll('.size-btn').forEach(b=>{
    b.classList.toggle('active',parseInt(b.dataset.size)===painAreaSize);
  });
}

/* ===== Zoom View ===== */
function renderZoomView(zoneEl){
  const panel=document.getElementById('zoom-panel');
  const svg=document.getElementById('zoom-svg');
  panel.classList.add('visible');
  const b=zoneEl.getBBox();
  const cx=b.x+b.width/2,cy=b.y+b.height/2;
  const pad=35,sz=Math.max(b.width,b.height)+pad*2;
  svg.setAttribute('viewBox',`${cx-sz/2} ${cy-sz/2} ${sz} ${sz}`);
  const srcSvg=zoneEl.closest('svg');
  const outline=srcSvg.querySelector('.body-outline');
  let html='';
  if(outline)html+=outline.outerHTML.replace('0.13','0.08');
  // zone highlight
  if(zoneEl.tagName==='ellipse')
    html+=`<ellipse cx="${zoneEl.getAttribute('cx')}" cy="${zoneEl.getAttribute('cy')}" rx="${zoneEl.getAttribute('rx')}" ry="${zoneEl.getAttribute('ry')}" fill="rgba(129,140,248,.15)" stroke="#818cf8" stroke-width="1.5"/>`;
  else
    html+=`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="6" fill="rgba(129,140,248,.15)" stroke="#818cf8" stroke-width="1.5"/>`;
  // ring
  const sizes=[getZoneCenter(zoneEl).r*1.1,getZoneCenter(zoneEl).r*1.6,getZoneCenter(zoneEl).r*2.2];
  html+=`<circle cx="${cx}" cy="${cy}" r="${sizes[painAreaSize-1]}" fill="none" stroke="rgba(129,140,248,.4)" stroke-width="1.5" stroke-dasharray="4 2"/>`;
  svg.innerHTML=html;
}

/* ===== Pain Intensity ===== */
function updInt(val){
  painLevel=parseInt(val);
  document.getElementById('ival').textContent=painLevel;
  document.getElementById('ilbl').textContent=painLabels[painLevel];
  // Color shift
  const bg=document.getElementById('intensity-bg');
  const colors=[
    'rgba(52,211,153,.06)','rgba(52,211,153,.1)','rgba(45,212,191,.12)',
    'rgba(251,191,36,.08)','rgba(251,191,36,.12)','rgba(251,146,60,.14)',
    'rgba(249,115,22,.14)','rgba(248,113,113,.12)','rgba(239,68,68,.15)',
    'rgba(220,38,38,.18)','rgba(185,28,28,.22)'
  ];
  bg.style.background=`radial-gradient(ellipse at center,${colors[painLevel]},transparent 70%)`;
  const ival=document.getElementById('ival');
  if(painLevel<=3)ival.style.textShadow='0 0 40px rgba(52,211,153,.3)';
  else if(painLevel<=6)ival.style.textShadow='0 0 40px rgba(251,191,36,.3)';
  else ival.style.textShadow='0 0 40px rgba(248,113,113,.4)';
}

/* ===== Timer ===== */
function setupTimerScreen(){
  const mins=getTimerMinutes(painLevel);
  totalTimerSeconds=mins*60;timerSeconds=totalTimerSeconds;
  document.getElementById('timer-desc').textContent=`${mins}-min session • ${painLabels[painLevel].toLowerCase()} pain`;
  document.getElementById('electrode-area-label').textContent=selectedPart||'—';
  renderElectrodeView();
}

function renderElectrodeView(){
  const svg=document.getElementById('electrode-svg');
  if(!selectedPart||!activeProfile)return;
  const isMale=activeProfile.gender==='male';
  const outline=isMale?maleOutline:femaleOutline;
  const zones=currentView==='front'?frontZones:backZones;
  const z=zones.find(zn=>zn.zone===selectedPart);
  if(!z)return;
  let cx,cy,zr;
  if(z.el==='ellipse'){cx=z.cx;cy=z.cy;zr=Math.max(z.rx,z.ry)}
  else{cx=z.x+z.w/2;cy=z.y+z.h/2;zr=Math.max(z.w,z.h)/2}
  const pad=50,sz=Math.max(zr*2,40)+pad*2;
  svg.setAttribute('viewBox',`${cx-sz/2} ${cy-sz/2} ${sz} ${sz}`);
  let html=outline.replace('0.13','0.1');
  // Zone highlight
  if(z.el==='ellipse') html+=`<ellipse cx="${z.cx}" cy="${z.cy}" rx="${z.rx}" ry="${z.ry}" fill="rgba(129,140,248,.1)" stroke="rgba(129,140,248,.3)" stroke-width="1" stroke-dasharray="3 2"/>`;
  else html+=`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="6" fill="rgba(129,140,248,.1)" stroke="rgba(129,140,248,.3)" stroke-width="1" stroke-dasharray="3 2"/>`;
  // Pain ring
  const ringR=[zr*1.1,zr*1.6,zr*2.2][painAreaSize-1];
  html+=`<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="rgba(129,140,248,.25)" stroke-width="1" stroke-dasharray="4 2"/>`;
  // 4 Electrodes at randomized positions
  const baseAngles=[0,90,180,270];
  baseAngles.forEach((ba,i)=>{
    const aOff=(Math.random()-.5)*50;
    const angle=(ba+aOff)*Math.PI/180;
    const dist=ringR+12+Math.random()*15;
    let ex=cx+Math.cos(angle)*dist, ey=cy+Math.sin(angle)*dist;
    const ch=i<2?'a':'b';
    const lx=cx+Math.cos(angle)*(ringR+2), ly=cy+Math.sin(angle)*(ringR+2);
    html+=`<line x1="${ex}" y1="${ey}" x2="${lx}" y2="${ly}" class="elec-line elec-line-${ch}"/>`;
    html+=`<g class="elec-marker" transform="translate(${ex},${ey})"><circle r="10" class="elec-circle elec-ch-${ch}"/><text y="3.5" text-anchor="middle" class="elec-label">E${i+1}</text></g>`;
  });
  svg.innerHTML=html;
}

function startTimer(){
  timerRunning=true;document.getElementById('bpause').textContent='⏸';
  updateTimerDisplay();
  timerInterval=setInterval(()=>{
    if(!timerRunning)return;timerSeconds--;updateTimerDisplay();
    if(timerSeconds<=0){clearInterval(timerInterval);timerRunning=false;
      document.getElementById('ttime').textContent='00:00';
      document.getElementById('bpause').textContent='✅';
      document.getElementById('timer-done-bar').classList.remove('hidden');
    }
  },1000);
}
function stopTimer(){clearInterval(timerInterval);timerRunning=false}
function togTimer(){if(timerSeconds<=0)return;timerRunning=!timerRunning;document.getElementById('bpause').textContent=timerRunning?'⏸':'▶️'}
function rstTimer(){clearInterval(timerInterval);timerSeconds=totalTimerSeconds;document.getElementById('timer-done-bar').classList.add('hidden');startTimer()}
function updateTimerDisplay(){
  const m=Math.floor(timerSeconds/60),s=timerSeconds%60;
  document.getElementById('ttime').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  const p=(totalTimerSeconds-timerSeconds)/totalTimerSeconds;
  document.getElementById('tprog').style.strokeDashoffset=CIRCUMFERENCE*p;
}

/* ===== Emergency Stop ===== */
function emergencyStop(){
  clearInterval(timerInterval);timerRunning=false;
  const o=document.createElement('div');o.className='stop-overlay';
  o.innerHTML=`<div class="stop-icon">🛑</div><div class="stop-text">Session Stopped</div><div class="stop-sub">Emergency stop activated</div><div class="stop-return" id="stop-ret">Return to Profiles</div>`;
  document.body.appendChild(o);
  requestAnimationFrame(()=>o.classList.add('visible'));
  o.querySelector('#stop-ret').addEventListener('click',()=>{
    o.classList.remove('visible');setTimeout(()=>{o.remove();resetApp();go(0)},300);
  });
}

function resetApp(){
  selectedPart=null;painLevel=0;painAreaSize=1;activeProfile=null;
  document.getElementById('sld').value=0;updInt(0);
  document.getElementById('zoom-panel').classList.remove('visible');
  document.getElementById('bodymap-continue').classList.add('hidden');
  document.getElementById('size-selector').classList.add('hidden');
  document.getElementById('zone-name').textContent='Tap a body area';
  document.querySelectorAll('.pain-ring').forEach(r=>{r.classList.remove('visible');r.setAttribute('r','0')});
}

/* ===== Swipe ===== */
function setupSwipe(){
  let sx=0,sy=0;const app=document.getElementById('app');
  app.addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX;sy=e.changedTouches[0].screenY},{passive:true});
  app.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].screenX-sx,dy=Math.abs(e.changedTouches[0].screenY-sy);
    if(dx>80&&dy<100){const bk={1:0,2:1,3:2,4:3};if(bk[currentScreen]!==undefined)go(bk[currentScreen])}
  },{passive:true});
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tprog').style.strokeDasharray=CIRCUMFERENCE;
  document.getElementById('tprog').style.strokeDashoffset=0;
  renderProfiles();

  // Profile detail
  document.getElementById('pd-start').addEventListener('click',()=>{
    closeProfileDetail();
    renderBothViews();
    setTimeout(()=>go(1),350);
  });
  document.getElementById('profile-overlay').addEventListener('click',e=>{
    if(e.target===e.currentTarget)closeProfileDetail();
  });

  // Precautions
  document.getElementById('prec-continue').addEventListener('click',()=>go(2));

  // Body map
  document.getElementById('vtab-front').addEventListener('click',()=>switchBodyView('front'));
  document.getElementById('vtab-back').addEventListener('click',()=>switchBodyView('back'));
  document.getElementById('bodymap-continue-btn').addEventListener('click',()=>go(3));

  // Size buttons
  document.querySelectorAll('.size-btn').forEach(b=>{
    b.addEventListener('click',e=>{
      e.stopPropagation();painAreaSize=parseInt(b.dataset.size);updateSizeBtns();updatePainRing();
    });
  });

  // Intensity
  document.getElementById('sld').addEventListener('input',e=>updInt(e.target.value));
  document.getElementById('intensity-continue-btn').addEventListener('click',()=>go(4));

  // Summary
  document.getElementById('summary-continue-btn').addEventListener('click',()=>go(5));

  // Timer
  document.getElementById('bpause').addEventListener('click',togTimer);
  document.getElementById('breset').addEventListener('click',rstTimer);
  document.getElementById('btn-estop').addEventListener('click',emergencyStop);
  document.getElementById('timer-done-btn').addEventListener('click',()=>{resetApp();go(0)});

  setupSwipe();
});
