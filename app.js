/* ===== State ===== */
let currentScreen = 0;
let selectedPart = null;
let painLevel = 0;
let painAreaSize = 1; // 1-5
let timerInterval = null;
let timerSeconds = 20 * 60;
let timerRunning = false;
let totalTimerSeconds = 20 * 60;
let currentView = 'front'; // 'front' or 'back'
let allZones = [];
let activeProfile = null;

const CIRCUMFERENCE = 2 * Math.PI * 120;

const painLabels = [
  'No Pain', 'Minimal', 'Mild', 'Uncomfortable', 'Moderate',
  'Distracting', 'Distressing', 'Unmanageable', 'Intense', 'Severe', 'Worst Pain'
];

const painEmojis = ['😊', '🙂', '😐', '😕', '😣', '😖', '😫', '😩', '🥵', '😱', '🤯'];

const sizeLabels = ['Small', 'Medium', 'Moderate', 'Large', 'Very Large'];

/* ===== Profile Data ===== */
const profiles = [
  { id: 1, name: 'John Miller', age: 45, initials: 'JM', lastSession: 'Lower Back — 3 days ago', avatar: 'av-1' },
  { id: 2, name: 'Sarah Chen', age: 32, initials: 'SC', lastSession: 'Right Knee — 1 week ago', avatar: 'av-2' },
  { id: 3, name: 'Raj Patel', age: 58, initials: 'RP', lastSession: 'Left Shoulder — Yesterday', avatar: 'av-3' },
  { id: 4, name: 'Maria Garcia', age: 41, initials: 'MG', lastSession: 'Neck — 5 days ago', avatar: 'av-4' },
  { id: 5, name: 'David Kim', age: 67, initials: 'DK', lastSession: 'Right Hip — 2 weeks ago', avatar: 'av-5' },
  { id: 6, name: 'Anna Novak', age: 29, initials: 'AN', lastSession: 'New Patient', avatar: 'av-6' },
];

/* Intensity-to-timer mapping (minutes) */
function getTimerMinutes(intensity) {
  if (intensity <= 2) return 5;
  if (intensity <= 4) return 10;
  if (intensity <= 6) return 15;
  if (intensity <= 8) return 20;
  return 25;
}

/* ===== Profile Rendering ===== */
function renderProfiles() {
  const grid = document.getElementById('profile-grid');
  grid.innerHTML = '';
  profiles.forEach(p => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.profileId = p.id;
    card.innerHTML = `
      <div class="profile-avatar ${p.avatar}">${p.initials}</div>
      <div class="profile-name">${p.name}</div>
      <div class="profile-meta">Age ${p.age}<br/>${p.lastSession}</div>
    `;
    card.addEventListener('click', () => selectProfile(p));
    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      selectProfile(p);
    });
    grid.appendChild(card);
  });
}

function selectProfile(profile) {
  activeProfile = profile;
  document.getElementById('profile-welcome').textContent = `Welcome, ${profile.name.split(' ')[0]}`;
  go(1);
}

/* ===== Screen Navigation ===== */
function go(idx) {
  // Populate summary when navigating to screen 4
  if (idx === 4) {
    document.getElementById('sa').textContent = selectedPart || '—';
    document.getElementById('ss').textContent = selectedPart ? sizeLabels[painAreaSize - 1] : '—';
    document.getElementById('si').textContent = painLevel + ' / 10';
    document.getElementById('sl').textContent = painLabels[painLevel];
    document.getElementById('se').textContent = painEmojis[painLevel];
    const mins = getTimerMinutes(painLevel);
    document.getElementById('sd').textContent = mins + ' minutes';
  }

  // Setup timer screen when navigating to screen 5
  if (idx === 5) {
    setupTimerScreen();
    startTimer();
    document.getElementById('timer-done-bar').classList.add('hidden');
  }

  // Stop timer when leaving screen 5
  if (currentScreen === 5 && idx !== 5) {
    stopTimer();
  }

  const screens = document.querySelectorAll('.screen');
  const prev = screens[currentScreen];
  const next = screens[idx];

  if (!prev || !next) return;

  prev.classList.remove('active');
  prev.classList.add('exit');
  setTimeout(() => prev.classList.remove('exit'), 500);

  next.classList.add('active');
  currentScreen = idx;
}

/* ===== Body View Toggle ===== */
function switchBodyView(view) {
  currentView = view;
  const frontView = document.getElementById('bodymap-front');
  const backView = document.getElementById('bodymap-back');
  const tabFront = document.getElementById('vtab-front');
  const tabBack = document.getElementById('vtab-back');

  if (view === 'front') {
    frontView.classList.remove('hidden');
    backView.classList.add('hidden');
    tabFront.classList.add('active');
    tabBack.classList.remove('active');
  } else {
    frontView.classList.add('hidden');
    backView.classList.remove('hidden');
    tabFront.classList.remove('active');
    tabBack.classList.add('active');
  }

  buildZoneList();
}

/* ===== Body Zone Management ===== */
function buildZoneList() {
  const viewId = currentView === 'front' ? 'zones-front' : 'zones-back';
  allZones = Array.from(document.querySelectorAll(`#${viewId} .bzone`));
}

function selectZone(zoneEl) {
  // Clear all selections across both views
  document.querySelectorAll('.bzone').forEach(z => {
    z.classList.remove('selected', 'size-1', 'size-2', 'size-3', 'size-4', 'size-5');
  });

  // Remove existing pain overlays
  document.querySelectorAll('.pain-overlay').forEach(o => o.remove());

  // Select this zone
  zoneEl.classList.add('selected', `size-${painAreaSize}`);
  selectedPart = zoneEl.dataset.zone;

  // Create pain overlay for visual area size
  createPainOverlay(zoneEl);

  // Update zone info
  document.getElementById('zone-name').textContent = selectedPart;
  document.getElementById('zone-size-wrap').style.display = 'flex';
  updateSizeDots();

  // Show zoom view
  renderZoomView(zoneEl);

  // Show continue button
  document.getElementById('bodymap-continue').classList.remove('hidden');
}

function createPainOverlay(zoneEl) {
  document.querySelectorAll('.pain-overlay').forEach(o => o.remove());

  const svg = zoneEl.closest('svg');
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  overlay.classList.add('pain-overlay');

  const bbox = zoneEl.getBBox();
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  const scaleFactor = 0.6 + (painAreaSize * 0.25);
  const rx = (bbox.width / 2) * scaleFactor;
  const ry = (bbox.height / 2) * scaleFactor;

  overlay.setAttribute('cx', cx);
  overlay.setAttribute('cy', cy);
  overlay.setAttribute('rx', rx);
  overlay.setAttribute('ry', ry);

  svg.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
}

/* ===== Zoom View ===== */
function renderZoomView(zoneEl) {
  const zoomPanel = document.getElementById('zoom-panel');
  const zoomSvg = document.getElementById('zoom-svg');

  // Show the panel
  zoomPanel.classList.add('visible');

  // Get the bounding box of the zone
  const bbox = zoneEl.getBBox();
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  const padding = 30;
  const size = Math.max(bbox.width, bbox.height) + padding * 2;

  // Set viewBox to zoom into the area
  const vbX = cx - size / 2;
  const vbY = cy - size / 2;
  zoomSvg.setAttribute('viewBox', `${vbX} ${vbY} ${size} ${size}`);

  // Clone relevant SVG elements into zoom view
  zoomSvg.innerHTML = '';

  // Get the source SVG
  const sourceSvg = zoneEl.closest('svg');

  // Clone body outline
  const outline = sourceSvg.querySelector('.body-outline');
  if (outline) {
    const clonedOutline = outline.cloneNode(true);
    clonedOutline.setAttribute('stroke', 'rgba(255,255,255,0.1)');
    zoomSvg.appendChild(clonedOutline);
  }

  // Clone the selected zone with enhanced styling
  const clonedZone = zoneEl.cloneNode(true);
  clonedZone.setAttribute('fill', 'rgba(129,140,248,.25)');
  clonedZone.setAttribute('stroke', '#818cf8');
  clonedZone.setAttribute('stroke-width', '2');
  zoomSvg.appendChild(clonedZone);

  // Add pulsing pain overlay in zoom
  const zoomOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  const scaleFactor = 0.6 + (painAreaSize * 0.25);
  zoomOverlay.setAttribute('cx', cx);
  zoomOverlay.setAttribute('cy', cy);
  zoomOverlay.setAttribute('rx', (bbox.width / 2) * scaleFactor);
  zoomOverlay.setAttribute('ry', (bbox.height / 2) * scaleFactor);
  zoomOverlay.setAttribute('fill', 'rgba(129,140,248,.12)');
  zoomOverlay.setAttribute('stroke', 'rgba(129,140,248,.3)');
  zoomOverlay.setAttribute('stroke-width', '1');
  zoomOverlay.setAttribute('stroke-dasharray', '3 2');
  zoomSvg.appendChild(zoomOverlay);

  // Add zone label
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', cx);
  label.setAttribute('y', cy + size / 2 - 6);
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('fill', '#818cf8');
  label.setAttribute('font-size', `${Math.max(6, size / 12)}px`);
  label.setAttribute('font-weight', '600');
  label.setAttribute('font-family', "'Inter', sans-serif");
  label.textContent = zoneEl.dataset.zone;
  zoomSvg.appendChild(label);
}

function updatePainAreaSize(newSize) {
  painAreaSize = Math.max(1, Math.min(5, newSize));

  const selected = document.querySelector('.bzone.selected');
  if (selected) {
    selected.classList.remove('size-1', 'size-2', 'size-3', 'size-4', 'size-5');
    selected.classList.add(`size-${painAreaSize}`);
    createPainOverlay(selected);
    renderZoomView(selected);
  }
  updateSizeDots();
}

function updateSizeDots() {
  const dots = document.querySelectorAll('.zdot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i < painAreaSize);
  });
}

/* ===== Pain Intensity ===== */
function updInt(val) {
  painLevel = parseInt(val);
  const ival = document.getElementById('ival');
  ival.textContent = painLevel;
  document.getElementById('ilbl').textContent = painLabels[painLevel];
  document.getElementById('iemoji').textContent = painEmojis[painLevel];

  ival.classList.remove('low', 'mid', 'high');
  if (painLevel <= 3) ival.classList.add('low');
  else if (painLevel <= 6) ival.classList.add('mid');
  else ival.classList.add('high');
}

/* ===== Timer Setup ===== */
function setupTimerScreen() {
  const mins = getTimerMinutes(painLevel);
  totalTimerSeconds = mins * 60;
  timerSeconds = totalTimerSeconds;

  document.getElementById('timer-desc').textContent =
    `${mins}-minute session for ${painLabels[painLevel].toLowerCase()} pain.`;

  document.getElementById('electrode-area-label').textContent =
    `Place around: ${selectedPart || '—'}`;

  const pzText = document.getElementById('pain-zone-text');
  if (pzText) {
    pzText.textContent = selectedPart ? selectedPart.split(' ')[0] : 'Pain';
  }

  // Randomize electrode placement
  randomizeElectrodes();
}

/* ===== Randomized Electrode Placement ===== */
function randomizeElectrodes() {
  const group = document.getElementById('electrodes-group');
  group.innerHTML = '';

  const cx = 100, cy = 100, painR = 30;

  // Generate 4 electrode positions with randomized angles and distances
  // Keep them roughly distributed (quadrants) but with random offset
  const baseAngles = [0, 90, 180, 270]; // cardinal quadrants
  const electrodePositions = [];

  baseAngles.forEach((baseAngle, i) => {
    // Add random offset: ±30 degrees
    const angleOffset = (Math.random() - 0.5) * 60;
    const angle = (baseAngle + angleOffset) * (Math.PI / 180);

    // Random distance from pain center (between painR + 20 and painR + 45)
    const dist = painR + 20 + Math.random() * 25;

    const ex = cx + Math.cos(angle) * dist;
    const ey = cy + Math.sin(angle) * dist;

    // Clamp within SVG bounds (16 to 184, accounting for electrode radius)
    const clampedX = Math.max(18, Math.min(182, ex));
    const clampedY = Math.max(18, Math.min(182, ey));

    electrodePositions.push({ x: clampedX, y: clampedY, angle });

    const channel = i < 2 ? 'a' : 'b';
    const elecNum = i + 1;

    // Create electrode group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('electrode');
    g.id = `elec${elecNum}`;
    g.style.setProperty('--elec-pos', `translate(${clampedX}px, ${clampedY}px)`);
    g.setAttribute('transform', `translate(${clampedX}, ${clampedY})`);
    g.style.animationDelay = `${i * 0.5}s`;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '14');
    circle.classList.add('elec-circle', `elec-ch-${channel}`);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('y', '4');
    label.setAttribute('text-anchor', 'middle');
    label.classList.add('elec-label');
    label.textContent = `E${elecNum}`;

    g.appendChild(circle);
    g.appendChild(label);
    group.appendChild(g);

    // Connection line from electrode to pain zone edge
    const lineEndX = cx + Math.cos(angle) * painR;
    const lineEndY = cy + Math.sin(angle) * painR;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', clampedX);
    line.setAttribute('y1', clampedY);
    line.setAttribute('x2', lineEndX);
    line.setAttribute('y2', lineEndY);
    line.classList.add('elec-line', `elec-line-${channel}`);

    // Insert lines before electrodes so electrodes render on top
    group.insertBefore(line, group.querySelector('.electrode'));
  });
}

/* ===== Timer ===== */
function startTimer() {
  timerRunning = true;
  document.getElementById('bpause').textContent = '⏸';
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (!timerRunning) return;
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('ttime').textContent = '00:00';
      document.getElementById('bpause').textContent = '✅';
      document.querySelector('.tring-wrap').style.animation = 'pulse-outer 1s ease-in-out 3';
      // Show done button
      document.getElementById('timer-done-bar').classList.remove('hidden');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function togTimer() {
  if (timerSeconds <= 0) return;
  timerRunning = !timerRunning;
  document.getElementById('bpause').textContent = timerRunning ? '⏸' : '▶️';
}

function rstTimer() {
  clearInterval(timerInterval);
  timerSeconds = totalTimerSeconds;
  document.querySelector('.tring-wrap').style.animation = '';
  document.getElementById('timer-done-bar').classList.add('hidden');
  startTimer();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  document.getElementById('ttime').textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  const progress = (totalTimerSeconds - timerSeconds) / totalTimerSeconds;
  const offset = CIRCUMFERENCE * progress;
  document.getElementById('tprog').style.strokeDashoffset = offset;
}

/* ===== Emergency Stop ===== */
function emergencyStop() {
  clearInterval(timerInterval);
  timerRunning = false;

  const overlay = document.createElement('div');
  overlay.className = 'stop-overlay';
  overlay.innerHTML = `
    <div class="stop-icon">🛑</div>
    <div class="stop-text">Session Stopped</div>
    <div class="stop-sub">Emergency stop activated</div>
    <div class="stop-return" id="stop-return-btn">Return to Profiles</div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // Attach tap handler
  overlay.querySelector('#stop-return-btn').addEventListener('click', () => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
      resetApp();
      go(0);
    }, 300);
  });
}

function resetApp() {
  selectedPart = null;
  painLevel = 0;
  painAreaSize = 1;
  activeProfile = null;
  document.getElementById('sld').value = 0;
  updInt(0);
  document.querySelectorAll('.bzone').forEach(z => {
    z.classList.remove('selected', 'size-1', 'size-2', 'size-3', 'size-4', 'size-5');
  });
  document.querySelectorAll('.pain-overlay').forEach(o => o.remove());
  document.getElementById('zoom-panel').classList.remove('visible');
  document.getElementById('bodymap-continue').classList.add('hidden');
  document.getElementById('zone-name').textContent = 'Tap a body area';
  document.getElementById('zone-size-wrap').style.display = 'none';
}

/* ===== Swipe Gesture Detection ===== */
function setupSwipeGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let isSwiping = false;

  const app = document.getElementById('app');

  app.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isSwiping = true;
  }, { passive: true });

  app.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    touchEndX = e.changedTouches[0].screenX;
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);

    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(diffX) > 80 && diffY < 100) {
      if (diffX > 0) {
        // Swipe RIGHT → go back
        handleSwipeBack();
      }
    }
  }, { passive: true });
}

function handleSwipeBack() {
  // Map current screen to its previous screen
  const backMap = {
    1: 0,   // Welcome → Profiles
    2: 1,   // Body Map → Welcome
    3: 2,   // Intensity → Body Map
    4: 3,   // Summary → Intensity
    // Timer (5) — no swipe back during active session
  };

  if (backMap[currentScreen] !== undefined) {
    go(backMap[currentScreen]);
  }
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Set initial timer ring
  document.getElementById('tprog').style.strokeDasharray = CIRCUMFERENCE;
  document.getElementById('tprog').style.strokeDashoffset = 0;

  // Render profiles
  renderProfiles();

  // Build initial zone list
  buildZoneList();

  // Add touch/click handlers to all body zones
  document.querySelectorAll('.bzone').forEach(zone => {
    zone.addEventListener('click', (e) => {
      e.stopPropagation();
      selectZone(zone);
    });
  });

  // View toggle (Front/Back) - touch handlers
  document.getElementById('vtab-front').addEventListener('click', () => switchBodyView('front'));
  document.getElementById('vtab-back').addEventListener('click', () => switchBodyView('back'));

  // Welcome screen tap to continue
  document.getElementById('welcome-tap').addEventListener('click', () => {
    if (currentScreen === 1) go(2);
  });

  // Body map continue button
  document.getElementById('bodymap-continue-btn').addEventListener('click', () => go(3));

  // Pain intensity slider
  document.getElementById('sld').addEventListener('input', (e) => updInt(e.target.value));

  // Intensity continue button
  document.getElementById('intensity-continue-btn').addEventListener('click', () => go(4));

  // Summary start session
  document.getElementById('summary-continue-btn').addEventListener('click', () => go(5));

  // Timer controls
  document.getElementById('bpause').addEventListener('click', togTimer);
  document.getElementById('breset').addEventListener('click', rstTimer);

  // Emergency stop
  document.getElementById('btn-estop').addEventListener('click', emergencyStop);

  // Timer done → return to profiles
  document.getElementById('timer-done-btn').addEventListener('click', () => {
    resetApp();
    go(0);
  });

  // Size dots (tap to set size)
  document.querySelectorAll('.zdot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const size = parseInt(dot.dataset.size);
      if (size) updatePainAreaSize(size);
    });
  });

  // Swipe gestures
  setupSwipeGestures();
});
