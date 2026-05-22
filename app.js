function attachTimerScreenEvents() {
  document.getElementById('bpause')?.addEventListener('click',togTimer);
  document.getElementById('breset')?.addEventListener('click',rstTimer);
  document.getElementById('btn-estop')?.addEventListener('click',emergencyStop);
  document.getElementById('timer-done-btn')?.addEventListener('click',()=>{resetApp();go(0)});
}
function attachIntensityScreenEvents() {
  document.getElementById('sld')?.addEventListener('input',e=>updInt(e.target.value));
  document.getElementById('intensity-continue-btn')?.addEventListener('click',()=>go(7));
}
function attachBodyMapEvents() {
  document.getElementById('vtab-front')?.addEventListener('click',()=>switchBodyView('front'));
  document.getElementById('vtab-back')?.addEventListener('click',()=>switchBodyView('back'));
  document.getElementById('vtab-lower')?.addEventListener('click',()=>switchBodyView('lower'));
  document.getElementById('bodymap-continue-btn')?.addEventListener('click',()=>{
    if (!selectedPart) {
      alert('Please select a body part before continuing.');
      return;
    }
    go(6);
  });
  document.querySelectorAll('.size-btn').forEach(b=>{
    b.onclick = (e)=>{e.stopPropagation();painAreaSize=parseInt(b.dataset.size);updateSizeBtns();updatePainRing()};
  });
}
/* ===== State ===== */
let currentScreen=0, selectedPart=null, painLevel=0, painAreaSize=1;
let timerInterval=null, timerSeconds=1200, timerRunning=false, totalTimerSeconds=1200;
let currentView='front', activeProfile=null;
const CIRCUMFERENCE=2*Math.PI*120;
const painLabels=['No Pain','Minimal','Mild','Uncomfortable','Moderate','Distracting','Distressing','Unmanageable','Intense','Severe','Worst Pain'];
const sizeLabels=['Small','Medium','Large'];
const quotes=["Every step forward is a step toward healing.","Your strength is greater than any pain.","Recovery begins with a single step.","Healing is not linear, but every effort counts.","Breathe. Believe. Begin."];

const profiles=[
  {id:1,name:'Ishaan Kapoor',age:45,gender:'male',photo:'https://thumbs.dreamstime.com/b/indian-man-young-good-looking-people-smiling-standing-isolated-white-background-31400054.jpg?w=576',sessions:12,lastArea:'Lower Back',lastInt:'6/10',history:[]},
  {id:2,name:'Geetika Kapoor',age:32,gender:'female',photo:'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&w=256&h=256&fit=facearea',sessions:8,lastArea:'Right Knee',lastInt:'4/10',history:[]},
  {id:3,name:'Raj Kapoor',age:58,gender:'male',photo:'https://thumbs.dreamstime.com/b/smart-smiling-middle-aged-indian-business-man-26978835.jpg?w=576',sessions:15,lastArea:'Left Shoulder',lastInt:'7/10',history:[]},
  {id:4,name:'Alia Kapoor',age:41,gender:'female',photo:'https://bridgeindia.org.uk/wp-content/uploads/2019/05/Kamini-Gupta.xa691a87f.jpg',sessions:5,lastArea:'Neck',lastInt:'3/10',history:[]},
  {id:5,name:'Tanmay Arora',age:67,gender:'male',photo:'https://www.discoverwalks.com/blog/wp-content/uploads/2020/10/800px-prime_minister_shri_narendra_modi_in_new_delhi_on_august_08_2019_cropped.jpg',sessions:20,lastArea:'Right Hip',lastInt:'5/10',history:[]},
  {id:6,name:'Janvi Arora',age:29,gender:'female',photo:'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&w=256&h=256&fit=facearea',sessions:0,lastArea:'—',lastInt:'—',history:[]}
];

// Generate random session history for each profile based on their session count
const allZones = [
  'Neck','Left Shoulder','Right Shoulder','Left Arm','Right Arm','Left Elbow','Right Elbow','Left Wrist','Right Wrist','Abdomen','Upper Back','Lower Back','Left Thigh','Right Thigh','Left Knee','Right Knee','Left Calf','Right Calf','Left Foot','Right Foot'
];
function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0,10);
}
function randomSession(idx) {
  const area = allZones[Math.floor(Math.random()*allZones.length)];
  const intensity = Math.floor(Math.random()*11);
  const size = ['Small','Medium','Large'][Math.floor(Math.random()*3)];
  const duration = getTimerMinutes(intensity);
  const date = randomDate(idx*2 + Math.floor(Math.random()*2));
  return {area,intensity,size,duration,date};
}
profiles.forEach(p => {
  p.history = [];
  for(let i=0;i<p.sessions;i++) {
    p.history.push(randomSession(i));
  }
  if(p.history.length) {
    p.lastArea = p.history[p.history.length-1].area;
    p.lastInt = p.history[p.history.length-1].intensity + '/10';
  }
});

function getTimerMinutes(i){if(i<=2)return 5;if(i<=4)return 10;if(i<=6)return 15;if(i<=8)return 20;return 25}

/* ===== Realistic Body Paths with Segmentation Lines ===== */
const internalLines = `
<g stroke="rgba(255,255,255,0.18)" stroke-width="1" fill="none" opacity="0.6">
  <!-- Collarbones -->
  <path d="M 75 75 Q 100 80 125 75"/>
  <!-- Chest / Pecs -->
  <path d="M 80 105 Q 100 112 120 105" />
  <!-- Ribs / Waist details -->
  <path d="M 82 135 Q 100 140 118 135" />
  <!-- Knees -->
  <path d="M 68 275 L 82 275" stroke-dasharray="1 2"/>
  <path d="M 118 275 L 132 275" stroke-dasharray="1 2"/>
</g>`;

const maleOutline = `
<g class="body-group">
  <!-- Head -->
  <ellipse class="body-outline" cx="100" cy="38" rx="13" ry="17" />
  <!-- Neck -->
  <path class="body-outline" d="M94 54 C94 62, 95 66, 95 66 L105 66 C105 66, 106 62, 106 54 Z" />
  <!-- Torso -->
  <path class="body-outline" d="M70 74 C68 85, 72 105, 72 110 C72 125, 78 150, 78 160 C78 170, 74 185, 74 195 L126 195 C126 185, 122 170, 122 160 C122 150, 128 125, 128 110 C128 105, 132 85, 130 74 Z" />
  <!-- Left Arm -->
  <path class="body-outline" d="M70 74 C60 76, 52 100, 52 110 C52 122, 47 135, 47 145 C47 160, 39 175, 39 185 C39 192, 34 200, 34 205 C36 207, 44 200, 46 195 L50 185 C55 170, 62 145, 62 135 L62 115 C62 110, 66 90, 70 74 Z" />
  <!-- Right Arm -->
  <path class="body-outline" d="M130 74 C140 76, 148 100, 148 110 C148 122, 153 135, 153 145 C153 160, 161 175, 161 185 C161 192, 166 200, 166 205 C164 207, 156 200, 154 195 L150 185 C145 170, 138 145, 138 135 L138 115 C138 110, 134 90, 130 74 Z" />
  <!-- Left Leg -->
  <path class="body-outline" d="M74 195 C70 215, 68 245, 68 260 C68 275, 70 290, 70 305 C70 325, 71 345, 71 365 C71 372, 69 382, 69 385 C73 388, 81 385, 83 383 L83 370 C83 345, 87 315, 87 295 C87 270, 89 240, 89 220 L96 200 Z" />
  <!-- Right Leg -->
  <path class="body-outline" d="M126 195 C130 215, 132 245, 132 260 C132 275, 130 290, 130 305 C130 325, 129 345, 129 365 C129 372, 131 382, 131 385 C127 388, 119 385, 117 383 L117 370 C117 345, 113 315, 113 295 C113 270, 111 240, 111 220 L104 200 Z" />
</g>` + internalLines;

const femaleOutline = `
<g class="body-group">
  <!-- Head -->
  <ellipse class="body-outline" cx="100" cy="38" rx="12" ry="16" />
  <!-- Neck -->
  <path class="body-outline" d="M95 54 C95 62, 96 66, 96 66 L104 66 C104 66, 105 62, 105 54 Z" />
  <!-- Torso -->
  <path class="body-outline" d="M73 76 C71 85, 74 105, 74 110 C74 125, 82 145, 82 155 C82 168, 72 182, 72 192 L128 192 C128 182, 118 168, 118 155 C118 145, 126 125, 126 110 C126 105, 129 85, 127 76 Z" />
  <!-- Left Arm -->
  <path class="body-outline" d="M73 76 C64 78, 56 100, 56 110 C56 122, 51 135, 51 145 C51 160, 43 175, 43 185 C43 192, 38 200, 38 205 C40 207, 48 200, 50 195 L54 185 C59 170, 66 145, 66 135 L66 115 C66 110, 70 90, 73 76 Z" />
  <!-- Right Arm -->
  <path class="body-outline" d="M127 76 C136 78, 144 100, 144 110 C144 122, 149 135, 149 145 C149 160, 157 175, 157 185 C157 192, 162 200, 162 205 C160 207, 152 200, 150 195 L146 185 C141 170, 134 145, 134 135 L134 115 C134 110, 130 90, 127 76 Z" />
  <!-- Left Leg -->
  <path class="body-outline" d="M72 192 C68 212, 66 242, 66 257 C66 272, 68 287, 68 302 C68 322, 69 342, 69 362 C69 369, 67 379, 67 382 C71 385, 79 382, 81 380 L81 367 C81 342, 85 312, 85 292 C85 267, 87 237, 87 217 L94 197 Z" />
  <!-- Right Leg -->
  <path class="body-outline" d="M128 192 C132 212, 134 242, 134 257 C134 272, 132 287, 132 302 C132 322, 131 342, 131 362 C131 369, 133 379, 133 382 C129 385, 121 382, 119 380 L119 367 C119 342, 115 312, 115 292 C115 267, 113 237, 113 217 L106 197 Z" />
</g>` + internalLines;

const lowerOutline = `
<g class="body-group">
  <!-- Left Thigh -->
  <path class="body-outline" d="M74 10 C70 25, 68 50, 68 75 C68 90, 70 100, 70 110 L89 110 C89 100, 91 90, 91 75 C91 50, 89 25, 85 10 Z" />
  <!-- Right Thigh -->
  <path class="body-outline" d="M126 10 C130 25, 132 50, 132 75 C132 90, 130 100, 130 110 L111 110 C111 100, 109 90, 109 75 C109 50, 111 25, 115 10 Z" />
  <!-- Left Calf -->
  <path class="body-outline" d="M70 110 C68 130, 66 160, 66 185 C66 200, 68 210, 70 215 L89 215 C91 210, 93 200, 93 185 C93 160, 91 130, 89 110 Z" />
  <!-- Right Calf -->
  <path class="body-outline" d="M130 110 C132 130, 134 160, 134 185 C134 200, 132 210, 130 215 L111 215 C109 210, 107 200, 107 185 C107 160, 109 130, 111 110 Z" />
  <!-- Left Foot -->
  <path class="body-outline" d="M70 215 L89 215 C89 220, 85 235, 75 235 C65 235, 61 220, 70 215 Z" />
  <!-- Right Foot -->
  <path class="body-outline" d="M130 215 L111 215 C111 220, 115 235, 125 235 C135 235, 139 220, 130 215 Z" />
</g>`;

/* Body points as requested */
const bodyPoints = {
  front: {
    'Neck': {cx: 100, cy: 55},
    'Left Shoulder': {cx: 70, cy: 75},
    'Right Shoulder': {cx: 130, cy: 75},
    'Left Arm': {cx: 55, cy: 120},
    'Right Arm': {cx: 145, cy: 120},
    'Left Elbow': {cx: 54, cy: 150},
    'Right Elbow': {cx: 145, cy: 150},
    'Left Wrist': {cx: 47, cy: 185},
    'Right Wrist': {cx: 158, cy: 185},
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
    'Left Elbow': {cx: 54, cy: 150},
    'Right Elbow': {cx: 145, cy: 150},
    'Left Wrist': {cx: 47, cy: 185},
    'Right Wrist': {cx: 158, cy: 185},
    'Left Thigh': {cx: 75, cy: 220},
    'Right Thigh': {cx: 125, cy: 220},
    'Left Calf': {cx: 75, cy: 325},
    'Right Calf': {cx: 125, cy: 325},
    'Left Foot': {cx: 75, cy: 380},
    'Right Foot': {cx: 125, cy: 380}
  },
  lower: {
    'Left Thigh': {cx: 75, cy: 60},
    'Right Thigh': {cx: 125, cy: 60},
    'Left Knee': {cx: 75, cy: 115},
    'Right Knee': {cx: 125, cy: 115},
    'Left Calf': {cx: 75, cy: 165},
    'Right Calf': {cx: 125, cy: 165},
    'Left Foot': {cx: 75, cy: 220},
    'Right Foot': {cx: 125, cy: 220}
  }
};
// Smaller uniform ring sizes for all areas
const ringSizes = [6, 10, 14];
const ringSizeLookup = {
  tiny: ['Neck','Left Elbow','Right Elbow','Left Wrist','Right Wrist','Left Foot','Right Foot'],
  narrow: ['Left Arm','Right Arm','Left Calf','Right Calf','Left Thigh','Right Thigh'],
  medium: ['Left Shoulder','Right Shoulder','Left Knee','Right Knee','Upper Back','Lower Back','Abdomen']
};
function getRingRadius(zone, size){
  if(size < 1 || size > 3) size = 1;
  if(ringSizeLookup.tiny.includes(zone)) return [3, 6, 9][size - 1];
  if(ringSizeLookup.narrow.includes(zone)) return [4, 7, 10][size - 1];
  if(ringSizeLookup.medium.includes(zone)) return [6, 10, 14][size - 1];
  return [7, 11, 15][size - 1];
}

/* ===== Render Functions ===== */
function renderProfiles(){
    console.log('Rendering profiles');
    const g=document.getElementById('profile-grid');g.innerHTML='';
    profiles.forEach(p=>{
      const c=document.createElement('div');c.className='profile-card';
      c.innerHTML=`<img class="profile-photo" src="${p.photo}" alt="${p.name}" onerror="this.style.background='linear-gradient(135deg,#6366f1,#8b5cf6)';this.alt='${p.name[0]}'"/><div class="profile-name">${p.name}</div>`;
      c.addEventListener('click',()=>{console.log('Profile clicked', p.id); openProfileDetail(p);});
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
  // Set previous session details
  document.getElementById('ps-area').textContent=p.lastArea||'—';
  document.getElementById('ps-intensity').textContent=p.lastInt||'—';
  document.getElementById('ps-duration').textContent=p.lastArea!=='—' ? getTimerMinutes(parseInt(p.lastInt)||0)+' min' : '—';
  renderBothViews();
  currentView='front';switchBodyView('front');
  // Delay navigation to ensure UI is ready
  setTimeout(() => go(2), 0);
}

function goToScreen(screenId){
  const screens=document.querySelectorAll('.screen');
  const target = document.getElementById(screenId);
  if(!target)return;
  const prev=screens[currentScreen];
  if(!prev)return;
  prev.classList.remove('active');prev.classList.add('exit');
  setTimeout(()=>prev.classList.remove('exit'),500);
  target.classList.add('active');
  // Update currentScreen to the index (for consistent state)
  currentScreen = Array.from(screens).indexOf(target);
  // Attach event for view all sessions if on s2
  if(screenId==='s2') {
    attachSessionModalEvents();
  }
}

function viewPreviousSession(){
  goToScreen('s2b');
}

function renderBodySvg(){
  if(!activeProfile)return;
  let outline, pts, svgId;
  
  if(currentView==='lower'){
    outline = lowerOutline;
    pts = bodyPoints.lower;
    svgId = 'body-svg-lower';
  } else {
    outline = activeProfile.gender==='male' ? maleOutline : femaleOutline;
    pts = currentView==='front' ? bodyPoints.front : bodyPoints.back;
    svgId = currentView==='front' ? 'body-svg-front' : 'body-svg-back';
  }
  
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
  currentView='lower';renderBodySvg();
  currentView=cv;
}

/* ===== Navigation ===== */
function go(idx){
      if(idx===5){
        setTimeout(attachIntensityScreenEvents, 0);
      }
    if(idx===4){
      setTimeout(attachBodyMapEvents, 0);
    }
  if(idx===6){ // Summary screen index is s6
    document.getElementById('sa').textContent=selectedPart||'—';
    document.getElementById('ss').textContent=selectedPart?sizeLabels[painAreaSize-1]:'—';
    document.getElementById('si').textContent=painLevel+' / 10';
    document.getElementById('sd').textContent=getTimerMinutes(painLevel)+' min';
    // Re-attach continue button event for robustness
    const contBtn = document.getElementById('summary-continue-btn');
    if (contBtn) {
      contBtn.onclick = () => {
        if (painLevel === 0) {
          alert('No pain detected. No therapy session is needed.');
          resetApp();
          go(0);
          return;
        }
        go(8);
      };
    }
  }
  if(idx===8){
  setupTimerScreen();
  startTimer();
  document.getElementById('timer-done-bar').classList.add('hidden');
    setTimeout(attachTimerScreenEvents, 0);
}

if(currentScreen===8 && idx!==8){
  stopTimer();
}
  
  // If moving away from intensity screen (now #s5), reset body background
  if(currentScreen===5 && idx!==5) document.body.style.background = 'var(--bg)';
  // If entering intensity screen, set body background based on intensity
  if(idx===5) updateBodyColor(painLevel);

  const screens=document.querySelectorAll('.screen');
  const prev=screens[currentScreen],next=screens[idx];
  if(!prev||!next)return;
  prev.classList.remove('active');prev.classList.add('exit');
  setTimeout(()=>prev.classList.remove('exit'),500);
  next.classList.add('active');currentScreen=idx;
}

function switchBodyView(v){
  currentView = v;

  // 1. Hide all body SVG containers safely
  document.getElementById('bodymap-front').classList.add('hidden');
  document.getElementById('bodymap-back').classList.add('hidden');
  document.getElementById('bodymap-lower').classList.add('hidden');

  // 2. Show ONLY the selected body map container
  document.getElementById('bodymap-' + v).classList.remove('hidden');

  // 3. Make sure the view toggle container itself stays visible
  const viewToggle = document.querySelector('.view-toggle');
  if (viewToggle) {
    viewToggle.style.display = 'flex'; 
    viewToggle.classList.remove('hidden');
    // Hide lower tab in front/back, show in lower
    const lowerTab = document.getElementById('vtab-lower');
    if (lowerTab) {
      if (v === 'front' || v === 'back') {
        lowerTab.style.display = 'none';
      } else {
        lowerTab.style.display = '';
      }
    }
  }

  // 4. Cycle and update active tab styling
  document.querySelectorAll('.vtab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  const activeTab = document.getElementById('vtab-' + v);
  if (activeTab) activeTab.classList.add('active');

  renderBodySvg();

  // 5. Re-render selected ring if the current view contains it
  if(selectedPart && bodyPoints[v][selectedPart]){
    const pt = bodyPoints[v][selectedPart];
    const ring = document.getElementById('pain-ring-' + v);

    if (ring) {
      ring.setAttribute('cx', pt.cx);
      ring.setAttribute('cy', pt.cy);
      ring.setAttribute('r', getRingRadius(selectedPart, painAreaSize));
      ring.classList.add('visible');
    }
  }
}

function selectZone(zoneEl){
  // Remove previous rings across all views
  document.querySelectorAll('.pain-ring').forEach(r=>{
    r.classList.remove('visible');
    r.setAttribute('r','0');
  });

  selectedPart = zoneEl.dataset.zone;
  const pt = bodyPoints[currentView][selectedPart];
  const ring = document.getElementById('pain-ring-' + currentView);
  const radius = getRingRadius(selectedPart, painAreaSize);

  if (ring) {
    ring.setAttribute('cx', pt.cx);
    ring.setAttribute('cy', pt.cy);
    ring.setAttribute('r', radius);
    ring.classList.add('visible');
  }

  // Update text labels and control wrappers
  document.getElementById('zone-name').textContent = selectedPart;
  document.getElementById('selection-controls').classList.remove('hidden');
  document.getElementById('bodymap-continue').classList.remove('hidden');

  updateSizeBtns();

  // Always keep view switching tabs visible and enabled
  const viewToggle = document.querySelector('.view-toggle');
  if (viewToggle) {
    viewToggle.style.display = 'flex';
    viewToggle.classList.remove('hidden');
    viewToggle.querySelectorAll('.vtab').forEach(tab => {
      tab.style.pointerEvents = 'auto';
      tab.style.opacity = '1';
    });
  }
}
function updatePainRing(){
  const pt = bodyPoints[currentView][selectedPart];
  if(!pt)return;
  const ring=document.getElementById('pain-ring-'+currentView);
  ring.setAttribute('r', getRingRadius(selectedPart,painAreaSize));
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
  // Set correct tab active for timer view switcher
  if(document.querySelector('.timer-view-toggle')) {
    document.querySelectorAll('.timer-view-toggle .vtab').forEach(tab=>{
      tab.classList.remove('active');
      if(tab.dataset.view===currentView) tab.classList.add('active');
    });
  }
  renderElectrodeView();

  // Attach event listeners for pause and reset buttons every time timer screen is set up
  setTimeout(() => {
    const pauseBtn = document.getElementById('bpause');
    const resetBtn = document.getElementById('breset');
    if (pauseBtn) pauseBtn.onclick = togTimer;
    if (resetBtn) resetBtn.onclick = rstTimer;
  }, 0);
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
  
  // Center SVG view with more zoom for small parts (more aggressive zoom)
  let sz = 70;
  if(['Left Wrist','Right Wrist','Left Elbow','Right Elbow','Left Knee','Right Knee','Left Foot','Right Foot','Neck'].includes(selectedPart)) sz = 48;
  svg.setAttribute('viewBox',`${pt.cx-sz/2} ${pt.cy-sz/2} ${sz} ${sz}`);

  let html = outline;

  // Pain ring in zoom
  const rSize = getRingRadius(selectedPart,painAreaSize);
  html+=`<circle cx="${pt.cx}" cy="${pt.cy}" r="${rSize}" fill="rgba(248,113,113,.15)" stroke="rgba(248,113,113,.6)" stroke-width="1.5" stroke-dasharray="3 2"/>`;

  // Dot-style electrode pads (smaller, no wires, no text)
  let positions = [];
  if(['Left Shoulder','Right Shoulder','Left Thigh','Right Thigh','Left Calf','Right Calf'].includes(selectedPart)) {
    positions = [
      {x: pt.cx-6, y: pt.cy-10},
      {x: pt.cx+6, y: pt.cy-4},
      {x: pt.cx-6, y: pt.cy+4},
      {x: pt.cx+6, y: pt.cy+10}
    ];
  } else if(['Left Arm','Right Arm'].includes(selectedPart)) {
    positions = [
      {x: pt.cx-7, y: pt.cy-8},
      {x: pt.cx+7, y: pt.cy-2},
      {x: pt.cx-7, y: pt.cy+2},
      {x: pt.cx+7, y: pt.cy+8}
    ];
  } else if(['Left Knee','Right Knee'].includes(selectedPart)) {
    positions = [
      {x: pt.cx-5, y: pt.cy-7},
      {x: pt.cx+5, y: pt.cy-7},
      {x: pt.cx-5, y: pt.cy+7},
      {x: pt.cx+5, y: pt.cy+7}
    ];
  } else if(['Left Foot','Right Foot'].includes(selectedPart)) {
    positions = [
      {x: pt.cx-4, y: pt.cy-4},
      {x: pt.cx+4, y: pt.cy-4},
      {x: pt.cx-4, y: pt.cy+4},
      {x: pt.cx+4, y: pt.cy+4}
    ];
  } else if(['Neck','Abdomen','Upper Back','Lower Back'].includes(selectedPart)) {
    positions = [
      {x: pt.cx-8, y: pt.cy},
      {x: pt.cx+8, y: pt.cy},
      {x: pt.cx-8, y: pt.cy+10},
      {x: pt.cx+8, y: pt.cy+10}
    ];
  } else {
    // Default: cross pattern
    positions = [
      {x: pt.cx-6, y: pt.cy-8},
      {x: pt.cx+6, y: pt.cy-8},
      {x: pt.cx-6, y: pt.cy+8},
      {x: pt.cx+6, y: pt.cy+8}
    ];
  }

  positions.forEach((pos)=>{
    html+=`<circle cx="${pos.x}" cy="${pos.y}" r="2.8" fill="#6366f1" stroke="#fff" stroke-width="1.1" />`;
  });

  svg.innerHTML=html;
}

function startTimer(){
  timerRunning=true;document.getElementById('bpause').textContent='⏸';
  updateTimerDisplay();
  // Vibration pattern based on pain level
  const vibPattern = painLevel <= 3 ? [80, 220] : painLevel <= 6 ? [150, 200] : [250, 150];
  const breakInterval = painLevel <= 3 ? 6 : painLevel <= 6 ? 5 : 4; // shorter breaks for higher pain
  let breakPhase = false;
  timerInterval=setInterval(()=>{
    if(!timerRunning)return;
    // Vibration on break phase
    if(timerSeconds>0 && timerSeconds%breakInterval===0 && navigator.vibrate) {
      breakPhase = !breakPhase;
      if(breakPhase) navigator.vibrate(vibPattern);
    }
    timerSeconds--;
    updateTimerDisplay();
    if(timerSeconds<=0){clearInterval(timerInterval);timerRunning=false;
      document.getElementById('ttime').textContent='00:00';
      document.getElementById('bpause').textContent='✅';
      document.getElementById('timer-done-bar').classList.remove('hidden');
      if(navigator.vibrate) navigator.vibrate([500, 100, 500]);
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
  o.innerHTML=`
    <div class="stop-icon">🛑</div>
    <div class="stop-text">Session Stopped</div>
    <div class="stop-sub">Emergency stop activated</div>
    <div class="stop-actions">
      <div class="stop-btn" id="stop-resume">Return to Session</div>
      <div class="stop-btn stop-return" id="stop-ret">Return to Menu</div>
    </div>`;
  document.body.appendChild(o);
  requestAnimationFrame(()=>o.classList.add('visible'));

  o.querySelector('#stop-resume').addEventListener('click',()=>{
    o.classList.remove('visible');
    setTimeout(()=>{o.remove(); timerRunning=true; startTimer();},300);
  });
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
  app.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});
  app.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-sx,dy=Math.abs(e.changedTouches[0].clientY-sy);
    // Back nav map supporting all screens - swipe right to go back
    if(dx>50&&dy<80){const bk={1:0,2:1,3:2,4:3,5:4,6:5,7:6,8:7};if(bk[currentScreen]!==undefined)go(bk[currentScreen])}
  },{passive:true});
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded',()=>{
    // Session history modal logic
    function showSessionHistoryModal() {
      if(!activeProfile) return;
      const modal = document.getElementById('session-history-modal');
      const list = document.getElementById('session-history-list');
      list.innerHTML = '';
      if(activeProfile.history && activeProfile.history.length) {
        activeProfile.history.slice().reverse().forEach((sess, idx) => {
          const row = document.createElement('div');
          row.className = 'session-history-row';
          row.style.cursor = 'pointer';
          row.innerHTML = `<div><b>${sess.area}</b> <span style="color:#6366f1;font-size:0.9em;">${sess.date}</span></div><div>Intensity: <b>${sess.intensity}</b> | Size: <b>${sess.size}</b> | Duration: <b>${sess.duration} min</b></div>`;
          row.addEventListener('click', () => {
            selectedPart = sess.area;
            painLevel = sess.intensity;
            painAreaSize = sizeLabels.indexOf(sess.size) + 1;
            document.getElementById('sa').textContent = selectedPart;
            document.getElementById('ss').textContent = sizeLabels[painAreaSize-1];
            document.getElementById('si').textContent = painLevel + ' / 10';
            document.getElementById('sd').textContent = getTimerMinutes(painLevel) + ' min';
            modal.classList.add('hidden');
            go(8);
            setTimeout(()=>{
              setupTimerScreen();
              startTimer();
            }, 100);
          });
          list.appendChild(row);
        });
      } else {
        list.innerHTML = '<div style="color:#888;padding:16px;">No session history found.</div>';
      }
      modal.classList.remove('hidden');
    }

    document.getElementById('view-all-sessions-btn')?.addEventListener('click',showSessionHistoryModal);
    document.getElementById('close-session-history')?.addEventListener('click',()=>{
      document.getElementById('session-history-modal').classList.add('hidden');
    });
    // Save session to history when session ends (idx==0 from timer screen)
    if(currentScreen===8 && idx===0 && activeProfile) {
      if(!activeProfile.history) activeProfile.history = [];
      activeProfile.history.push({
        area: selectedPart,
        intensity: painLevel,
        size: sizeLabels[painAreaSize-1],
        duration: getTimerMinutes(painLevel),
        date: new Date().toISOString().slice(0,10)
      });
      activeProfile.lastArea = selectedPart;
      activeProfile.lastInt = painLevel + '/10';
    }
  // Attach modal event listeners on DOMContentLoaded for robustness
  function attachSessionModalEvents() {
    const btn = document.getElementById('view-all-sessions-btn');
    if(btn) btn.onclick = showSessionHistoryModal;
    const closeBtn = document.getElementById('close-session-history');
    if(closeBtn) closeBtn.onclick = ()=>{
      document.getElementById('session-history-modal').classList.add('hidden');
    };
  }

  attachSessionModalEvents();
  document.getElementById('tprog').style.strokeDasharray=CIRCUMFERENCE;
  document.getElementById('tprog').style.strokeDashoffset=0;
  renderProfiles();

  // Intro
  document.getElementById('intro-start-btn').addEventListener('click',()=>go(1));

  // Welcome back screen (full page s2)
  document.getElementById('pd-start')?.addEventListener('click',()=>go(3));
  document.getElementById('pd-history')?.addEventListener('click',viewPreviousSession);

  // Previous session detail screen
  document.getElementById('ps-continue-btn')?.addEventListener('click',()=>{
    // Get previous session area and intensity
    const area = document.getElementById('ps-area').textContent;
    const intensityStr = document.getElementById('ps-intensity').textContent;
    if(area && area !== '—' && intensityStr && intensityStr !== '—') {
      selectedPart = area;
      painLevel = parseInt(intensityStr) || 0;
      // Update summary screen fields
      document.getElementById('sa').textContent = selectedPart;
      document.getElementById('ss').textContent = sizeLabels[painAreaSize-1];
      document.getElementById('si').textContent = painLevel + ' / 10';
      document.getElementById('sd').textContent = getTimerMinutes(painLevel) + ' min';
      // Go directly to timer screen (screen 7, index 7)
      go(7);
      setTimeout(()=>{
        setupTimerScreen();
        startTimer();
      }, 100);
    }
  });
  document.getElementById('ps-new-session-btn')?.addEventListener('click',()=>{go(4)});
  document.getElementById('ps-back-btn')?.addEventListener('click',()=>go(2));

  // Precautions
  document.getElementById('prec-continue').addEventListener('click',()=>go(5));

  // Body map
  document.getElementById('vtab-front').addEventListener('click',()=>switchBodyView('front'));
  document.getElementById('vtab-back').addEventListener('click',()=>switchBodyView('back'));
  document.getElementById('vtab-lower').addEventListener('click',()=>switchBodyView('lower'));
  document.getElementById('bodymap-continue-btn').addEventListener('click',()=>{
    if (!selectedPart) {
      alert('Please select a body part before continuing.');
      return;
    }
    go(6);
  });

  // Size buttons
  document.querySelectorAll('.size-btn').forEach(b=>{
    b.addEventListener('click',e=>{e.stopPropagation();painAreaSize=parseInt(b.dataset.size);updateSizeBtns();updatePainRing()});
  });

  // Intensity
  document.getElementById('sld').addEventListener('input',e=>updInt(e.target.value));
  document.getElementById('intensity-continue-btn').addEventListener('click',()=>go(7));

  // Summary
document.getElementById('summary-continue-btn')
  .addEventListener('click', () => {
    if (painLevel === 0) {
      alert('No pain detected. No therapy session is needed.');
      resetApp();
      go(0);
      return;
    }

    go(8);
  });

  // Timer
  document.getElementById('bpause').addEventListener('click',togTimer);
  document.getElementById('breset').addEventListener('click',rstTimer);
  document.getElementById('btn-estop').addEventListener('click',emergencyStop);
  document.getElementById('timer-done-btn').addEventListener('click',()=>{resetApp();go(0)});

  setupSwipe();
  
  // Set initial slider fill
  updInt(0);
});
