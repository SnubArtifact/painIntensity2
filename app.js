/* ===== State ===== */
let currentScreen=0, selectedPart=null, painLevel=0, painAreaSize=1;
let timerInterval=null, timerSeconds=1200, timerRunning=false, totalTimerSeconds=1200;
let currentView='front', activeProfile=null;
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

/* ===== Realistic Body Paths with Segmentation Lines ===== */
const internalLines = `
<g stroke="rgba(255,255,255,0.25)" stroke-width="1.5" fill="none" opacity="0.7">
  <!-- Shoulders / Arms -->
  <path d="M65 75 Q75 100 60 120"/>
  <path d="M135 75 Q125 100 140 120"/>
  <!-- Elbows -->
  <path d="M40 140 L55 150"/>
  <path d="M160 140 L145 150"/>
  <!-- Neck/Chest -->
  <path d="M85 60 Q100 65 115 60"/>
  <!-- Waist -->
  <path d="M70 180 Q100 170 130 180"/>
  <!-- Knees -->
  <path d="M70 250 L130 250" stroke-dasharray="2 4"/>
  <path d="M70 290 L130 290" stroke-dasharray="2 4"/>
</g>`;

const maleOutline = `<path class="body-outline" d="M100 20 C110 20, 115 30, 115 40 C115 50, 110 55, 105 55 L105 60 C125 60, 140 70, 145 80 L160 140 C165 160, 175 190, 170 195 C165 200, 155 190, 150 170 L140 120 L130 180 C125 210, 135 250, 135 280 L135 370 C140 380, 135 390, 125 390 C115 390, 115 380, 115 370 L110 230 C105 200, 95 200, 90 230 L85 370 C85 380, 85 390, 75 390 C65 390, 60 380, 65 370 L65 280 C65 250, 75 210, 70 180 L60 120 L50 170 C45 190, 35 200, 30 195 C25 190, 35 160, 40 140 L55 80 C60 70, 75 60, 95 60 L95 55 C90 55, 85 50, 85 40 C85 30, 90 20, 100 20 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" stroke-width="2" filter="drop-shadow(0 0 10px rgba(255,255,255,0.1))"/>` + internalLines;

const femaleOutline = `<path class="body-outline" d="M100 22 C108 22, 112 30, 112 38 C112 48, 108 52, 104 54 L104 60 C118 62, 130 70, 134 80 L146 140 C150 160, 160 190, 155 195 C150 200, 142 190, 138 170 L132 120 L126 180 C122 210, 138 230, 134 280 L130 370 C132 380, 130 390, 122 390 C114 390, 114 380, 114 370 L110 230 C106 200, 94 200, 90 230 L86 370 C86 380, 86 390, 78 390 C70 390, 68 380, 70 370 L66 280 C62 230, 78 210, 74 180 L68 120 L62 170 C58 190, 50 200, 45 195 C40 190, 50 160, 54 140 L66 80 C70 70, 82 62, 96 60 L96 54 C92 52, 88 48, 88 38 C88 30, 92 22, 100 22 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" stroke-width="2" filter="drop-shadow(0 0 10px rgba(255,255,255,0.1))"/>` + internalLines;

/* Body points as requested */
const bodyPoints = {
  front: {
    'Neck': {cx: 100, cy: 55},
    'Left Shoulder': {cx: 70, cy: 75},
    'Right Shoulder': {cx: 130, cy: 75},
    'Left Arm': {cx: 55, cy: 120},
    'Right Arm': {cx: 145, cy: 120},
    'Left Elbow': {cx: 45, cy: 150},
    'Right Elbow': {cx: 155, cy: 150},
    'Left Wrist': {cx: 35, cy: 185},
    'Right Wrist': {cx: 165, cy: 185},
    'Abdomen': {cx: 100, cy: 140},
    'Left Thigh': {cx: 75, cy: 220},
    'Right Thigh': {cx: 125, cy: 220},
    'Left Knee': {cx: 75, cy: 275},
    'Right Knee': {cx: 125, cy: 275},
    'Left Calf': {cx: 75, cy: 325},
    'Right Calf': {cx: 125, cy: 325},
    'Left Foot': {cx: 75, cy: 380},
    'Right Foot': {cx: 125, cy: 380}
  },
  back: {
    'Neck': {cx: 100, cy: 55},
    'Left Shoulder': {cx: 70, cy: 75},
    'Right Shoulder': {cx: 130, cy: 75},
    'Upper Back': {cx: 100, cy: 95},
    'Lower Back': {cx: 100, cy: 150},
    'Left Arm': {cx: 55, cy: 120},
    'Right Arm': {cx: 145, cy: 120},
    'Left Elbow': {cx: 45, cy: 150},
    'Right Elbow': {cx: 155, cy: 150},
    'Left Wrist': {cx: 35, cy: 185},
    'Right Wrist': {cx: 165, cy: 185},
    'Left Thigh': {cx: 75, cy: 220},
    'Right Thigh': {cx: 125, cy: 220},
    'Left Calf': {cx: 75, cy: 325},
    'Right Calf': {cx: 125, cy: 325},
    'Left Foot': {cx: 75, cy: 380},
    'Right Foot': {cx: 125, cy: 380}
  }
};
// Smaller uniform ring sizes for all areas
const ringSizes = [10, 16, 24];

/* ===== Render Functions ===== */
function renderProfiles(){
  const g=document.getElementById('profile-grid');g.innerHTML='';
  profiles.forEach(p=>{
    const c=document.createElement('div');c.className='profile-card';
    c.innerHTML=`<img class="profile-photo" src="${p.photo}" alt="${p.name}" onerror="this.style.background='linear-gradient(135deg,#6366f1,#8b5cf6)';this.alt='${p.name[0]}'"/><div class="profile-name">${p.name}</div>`;
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
  const outline = activeProfile.gender==='male' ? maleOutline : femaleOutline;
  const pts = currentView==='front' ? bodyPoints.front : bodyPoints.back;
  const svgId = currentView==='front' ? 'body-svg-front' : 'body-svg-back';
  const svg=document.getElementById(svgId);
  
  let html = outline;
  // Invisible hit areas over coordinates
  Object.keys(pts).forEach(zone => {
    const pt = pts[zone];
    html += `<circle class="bzone" data-zone="${zone}" cx="${pt.cx}" cy="${pt.cy}" r="22"/>`;
  });
  html += `<circle class="pain-ring" id="pain-ring-${currentView}" cx="0" cy="0" r="0"/>`;
  svg.innerHTML = html;
  
  svg.querySelectorAll('.bzone').forEach(z=>{
    z.addEventListener('click',e=>{e.stopPropagation();selectZone(z)});
  });
}

function renderBothViews(){
  const cv=currentView;
  currentView='front';renderBodySvg();
  currentView='back';renderBodySvg();
  currentView=cv;
}

/* ===== Navigation ===== */
function go(idx){
  if(idx===5){ // Summary screen index changed to 5
    document.getElementById('sa').textContent=selectedPart||'—';
    document.getElementById('ss').textContent=selectedPart?sizeLabels[painAreaSize-1]:'—';
    document.getElementById('si').textContent=painLevel+' / 10';
    document.getElementById('sd').textContent=getTimerMinutes(painLevel)+' min';
  }
  if(idx===6){setupTimerScreen();startTimer();document.getElementById('timer-done-bar').classList.add('hidden')}
  if(currentScreen===6&&idx!==6)stopTimer();
  
  // If moving away from intensity screen (now #s4), reset body background
  if(currentScreen===4 && idx!==4) document.body.style.background = 'var(--bg)';
  // If entering intensity screen, set body background based on intensity
  if(idx===4) updateBodyColor(painLevel);

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
  document.getElementById('bodymap-back').classList.toggle('hidden',v==='back');
  document.getElementById('vtab-front').classList.toggle('active',v==='front');
  document.getElementById('vtab-back').classList.toggle('active',v==='back');
  
  // Keep ring on selected view if the selected part exists on this view
  const ring = document.getElementById('pain-ring-'+v);
  if(selectedPart && bodyPoints[v][selectedPart]){
    const pt = bodyPoints[v][selectedPart];
    ring.setAttribute('cx', pt.cx);
    ring.setAttribute('cy', pt.cy);
    ring.setAttribute('r', ringSizes[painAreaSize-1]);
    ring.classList.add('visible');
  } else {
    ring.classList.remove('visible');
  }
}

/* ===== Zone Selection ===== */
function selectZone(zoneEl){
  document.querySelectorAll('.pain-ring').forEach(r=>{r.classList.remove('visible');r.setAttribute('r','0')});
  selectedPart=zoneEl.dataset.zone;
  const pt = bodyPoints[currentView][selectedPart];
  
  const ring=document.getElementById('pain-ring-'+currentView);
  ring.setAttribute('cx', pt.cx);
  ring.setAttribute('cy', pt.cy);
  ring.setAttribute('r', ringSizes[painAreaSize-1]);
  ring.classList.add('visible');
  
  document.getElementById('zone-name').textContent=selectedPart;
  document.getElementById('selection-controls').classList.remove('hidden');
  document.getElementById('bodymap-continue').classList.remove('hidden');
  updateSizeBtns();
}

function updatePainRing(){
  const pt = bodyPoints[currentView][selectedPart];
  if(!pt)return;
  const ring=document.getElementById('pain-ring-'+currentView);
  ring.setAttribute('r', ringSizes[painAreaSize-1]);
}

function updateSizeBtns(){
  document.querySelectorAll('.size-btn').forEach(b=>{
    b.classList.toggle('active',parseInt(b.dataset.size)===painAreaSize);
  });
}

/* ===== Pain Intensity ===== */
function updateBodyColor(level){
  // Full page color shifting
  const colors=[
    '#0a0a0f', '#06201a', '#0a2f26', // Low (Greenish)
    '#211804', '#362306', '#4a2d08', // Mid (Orangish)
    '#4a1508', '#5e1010', '#730d0d', // High (Red)
    '#8a0808', '#a80505' // Severe (Deep Red)
  ];
  document.body.style.background = colors[level];
}

function updInt(val){
  painLevel=parseInt(val);
  document.getElementById('ival').textContent=painLevel;
  document.getElementById('ilbl').textContent=painLabels[painLevel];
  
  // Track fill color of slider
  const sld = document.getElementById('sld');
  const pct = (painLevel / 10) * 100;
  sld.style.background = `linear-gradient(90deg, rgba(255,255,255,0.8) ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;

  updateBodyColor(painLevel);
  
  const ival=document.getElementById('ival');
  if(painLevel<=3)ival.style.textShadow='0 0 50px rgba(52,211,153,.5)';
  else if(painLevel<=6)ival.style.textShadow='0 0 50px rgba(251,191,36,.5)';
  else ival.style.textShadow='0 0 50px rgba(248,113,113,.6)';
}

/* ===== Timer & Electrode Placement ===== */
function setupTimerScreen(){
  const mins=getTimerMinutes(painLevel);
  totalTimerSeconds=mins*60;timerSeconds=totalTimerSeconds;
  document.getElementById('timer-desc').textContent=`${mins}-min session • ${painLabels[painLevel].toLowerCase()}`;
  document.getElementById('electrode-area-label').textContent=selectedPart||'—';
  renderElectrodeView();
}

function renderElectrodeView(){
  const svg=document.getElementById('electrode-svg');
  if(!selectedPart||!activeProfile)return;
  
  // Find which view the selected part is on
  let pt = bodyPoints.front[selectedPart];
  if(!pt) pt = bodyPoints.back[selectedPart];
  if(!pt) return;

  const isMale=activeProfile.gender==='male';
  const outline=isMale?maleOutline:femaleOutline;
  
  // Center SVG view precisely on the coordinate point
  const sz=120; // Tight zoom window
  svg.setAttribute('viewBox',`${pt.cx-sz/2} ${pt.cy-sz/2} ${sz} ${sz}`);
  
  let html = outline.replace('0.12','0.2').replace('0.4','0.6'); // enhance visibility
  
  // Pain ring in zoom
  const rSize = ringSizes[painAreaSize-1];
  html+=`<circle cx="${pt.cx}" cy="${pt.cy}" r="${rSize}" fill="rgba(248,113,113,.2)" stroke="rgba(248,113,113,.6)" stroke-width="2" stroke-dasharray="4 2"/>`;
  
  // Realistic TENS Electrode Placement
  // Pads are placed in a clinical standard cross or parallel setup around the area.
  const padDist = rSize + 8; 
  const padW = 16, padH = 22; // Rectangular pads
  
  const positions = [
    {x: pt.cx - 15, y: pt.cy - padDist - 10, ch: 'a', rot: 0},
    {x: pt.cx + 15, y: pt.cy - padDist - 10, ch: 'a', rot: 0},
    {x: pt.cx - 15, y: pt.cy + padDist + 10, ch: 'b', rot: 180},
    {x: pt.cx + 15, y: pt.cy + padDist + 10, ch: 'b', rot: 180}
  ];
  
  positions.forEach((pos, i)=>{
    // TENS Pad drawing
    html+=`
      <g transform="translate(${pos.x},${pos.y}) rotate(${pos.rot})">
        <!-- Pad Base -->
        <rect x="${-padW/2}" y="${-padH/2}" width="${padW}" height="${padH}" class="elec-pad elec-pad-${pos.ch}"/>
        <!-- Wire Connector Node -->
        <circle cx="0" cy="-6" r="2.5" fill="#1e293b" stroke="#fff" stroke-width="0.5"/>
        <circle cx="0" cy="-6" r="1" fill="#94a3b8"/>
        <!-- Wire Tail -->
        <path d="M0 -8 Q0 -15 -8 -20" stroke="#1e293b" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <!-- Channel Label -->
        <text x="0" y="4" text-anchor="middle" fill="#64748b" font-size="5" font-weight="800" font-family="Inter,sans-serif">${pos.ch.toUpperCase()}</text>
      </g>`;
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
  o.innerHTML=`<div class="stop-icon">🛑</div><div class="stop-text">Session Stopped</div><div class="stop-sub">Emergency stop activated</div><div class="stop-return" id="stop-ret">Return to Menu</div>`;
  document.body.appendChild(o);
  requestAnimationFrame(()=>o.classList.add('visible'));
  o.querySelector('#stop-ret').addEventListener('click',()=>{
    o.classList.remove('visible');setTimeout(()=>{o.remove();resetApp();go(0)},300);
  });
}

function resetApp(){
  selectedPart=null;painLevel=0;painAreaSize=1;activeProfile=null;
  document.getElementById('sld').value=0;updInt(0);
  document.getElementById('selection-controls').classList.add('hidden');
  document.getElementById('bodymap-continue').classList.add('hidden');
  document.querySelectorAll('.pain-ring').forEach(r=>{r.classList.remove('visible');r.setAttribute('r','0')});
}

/* ===== Swipe ===== */
function setupSwipe(){
  let sx=0,sy=0;const app=document.getElementById('app');
  app.addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX;sy=e.changedTouches[0].screenY},{passive:true});
  app.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].screenX-sx,dy=Math.abs(e.changedTouches[0].screenY-sy);
    // Modified back nav map
    if(dx>80&&dy<100){const bk={1:0,2:1,3:2,4:3,5:4};if(bk[currentScreen]!==undefined)go(bk[currentScreen])}
  },{passive:true});
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tprog').style.strokeDasharray=CIRCUMFERENCE;
  document.getElementById('tprog').style.strokeDashoffset=0;
  renderProfiles();

  // Intro
  document.getElementById('intro-start-btn').addEventListener('click',()=>go(1));

  // Profile overlay
  document.getElementById('pd-start').addEventListener('click',()=>{
    closeProfileDetail();
    renderBothViews();
    setTimeout(()=>go(2),350);
  });
  document.getElementById('profile-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeProfileDetail()});

  // Precautions
  document.getElementById('prec-continue').addEventListener('click',()=>go(3));

  // Body map
  document.getElementById('vtab-front').addEventListener('click',()=>switchBodyView('front'));
  document.getElementById('vtab-back').addEventListener('click',()=>switchBodyView('back'));
  document.getElementById('bodymap-continue-btn').addEventListener('click',()=>go(4));

  // Size buttons
  document.querySelectorAll('.size-btn').forEach(b=>{
    b.addEventListener('click',e=>{e.stopPropagation();painAreaSize=parseInt(b.dataset.size);updateSizeBtns();updatePainRing()});
  });

  // Intensity
  document.getElementById('sld').addEventListener('input',e=>updInt(e.target.value));
  document.getElementById('intensity-continue-btn').addEventListener('click',()=>go(5));

  // Summary
  document.getElementById('summary-continue-btn').addEventListener('click',()=>go(6));

  // Timer
  document.getElementById('bpause').addEventListener('click',togTimer);
  document.getElementById('breset').addEventListener('click',rstTimer);
  document.getElementById('btn-estop').addEventListener('click',emergencyStop);
  document.getElementById('timer-done-btn').addEventListener('click',()=>{resetApp();go(0)});

  setupSwipe();
  
  // Set initial slider fill
  updInt(0);
});
