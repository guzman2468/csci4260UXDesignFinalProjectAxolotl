const recordBtn = document.getElementById("recordBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const menuButton = document.getElementById("menuButton");
const recordModal = document.getElementById("recordModal");
const sideMenu = document.getElementById("sideMenu");

const tourOverlay = document.getElementById("tourOverlay");
const tourHighlight = document.getElementById("tourHighlight");
const tourPopup = document.getElementById("tourPopup");
const tourTitle = document.getElementById("tourTitle");
const tourText = document.getElementById("tourText");
const tourNextBtn = document.getElementById("tourNextBtn");
const tourCloseBtn = document.getElementById("tourCloseBtn");
// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
let globalVolume        = 0.8;
let currentLoopDuration = 6;

const VOLUME_MAP = {
  "Low":    0.3,
  "Medium": 0.6,
  "High":   0.8,
  "Max":    1.0
};

function applySettings() {
  const saved = JSON.parse(sessionStorage.getItem("axolotlSettings") || "{}");
  if (saved.soundPreset) currentPreset        = saved.soundPreset.toLowerCase();
  if (saved.volume)      globalVolume         = VOLUME_MAP[saved.volume] ?? 0.8;
  if (saved.length)      currentLoopDuration  = Number(saved.length) ?? 6;
}

// ─────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────
menuButton.addEventListener("click", function () {
  sideMenu.classList.toggle("show");
});

recordBtn.addEventListener("click",   () => sideMenu.classList.remove("show"));
settingsBtn.addEventListener("click", () => sideMenu.classList.remove("show"));
exitBtn.addEventListener("click",     () => sideMenu.classList.remove("show"));

recordBtn.addEventListener("click", function () {
  const isRecording = recordBtn.classList.toggle("recording-active");
  recordBtn.textContent = isRecording ? "Recording" : "Record";
  recordModal.classList.toggle("show", isRecording);
});

settingsBtn.addEventListener("click", function () {
  sessionStorage.setItem("axolotlNotes", JSON.stringify(notes));
  window.location.href = "settings.html";
});

exitBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});

const contentCard = document.getElementById("contentCard");

const HIGHLIGHT_WINDOW = 0.15;

// ─────────────────────────────────────────────
// TRANSPORT ELEMENTS
// ─────────────────────────────────────────────
const playPauseBtn = document.getElementById("play-pause");
const scrubberEl   = document.getElementById("scrubber");
const timeLabel    = document.getElementById("time-label");
const rulerFill    = document.getElementById("ruler-fill");

// ─────────────────────────────────────────────
// AUDIO ENGINE
// ─────────────────────────────────────────────
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

const audioBuffers = {};

async function loadSample(name, url) {
  const ctx = getCtx();
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  audioBuffers[name] = await ctx.decodeAudioData(buf);
}

async function loadAllSamples() {
  await Promise.all([
    loadSample("kick",     "../sounds/kick.wav"),
    loadSample("snare",    "../sounds/snare.wav"),
    loadSample("hihat",    "../sounds/hihat.wav"),
    loadSample("clap",     "../sounds/clap.wav"),
    loadSample("ac_hihat", "../sounds/acoustic_highhat.mp3"),
    loadSample("ac_kick",  "../sounds/acoustic_kick.mp3"),
    loadSample("ac_snare", "../sounds/acoustic_snare.mp3"),
    loadSample("F_drum",   "../sounds/F_drum.mp3"),
  ]);
}

// ─────────────────────────────────────────────
// PLAYBACK
// ─────────────────────────────────────────────
function play(name, time, rate = 1, vol = globalVolume) {
  const ctx = getCtx();
  const buffer = audioBuffers[name];
  if (!buffer) return;

  const src  = ctx.createBufferSource();
  const gain = ctx.createGain();

  src.buffer             = buffer;
  src.playbackRate.value = rate;
  gain.gain.value        = vol;

  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(time);
}

// ─────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────
const PRESETS = {
  drums: {
    play(y, time) {
      if      (y < 0.25) play("hihat", time);
      else if (y < 0.5)  play("clap",  time);
      else if (y < 0.75) play("snare", time);
      else               play("kick",  time);
    }
  },
  acoustic: {
    play(y, time) {
      if      (y < 0.25) play("ac_hihat", time);
      else if (y < 0.5)  play("ac_kick",  time);
      else if (y < 0.75) play("ac_snare", time);
      else               play("F_drum",   time);
    }
  }
};

let currentPreset = "acoustic";

// ─────────────────────────────────────────────
// SOUND NAME LOOKUP
// ─────────────────────────────────────────────
function getSoundNameForPreset(preset, y) {
  if (preset === "acoustic") {
    if (y < 0.25) return "ac_hihat";
    if (y < 0.5)  return "ac_kick";
    if (y < 0.75) return "ac_snare";
    return "F_drum";
  }
  if (preset === "drums") {
    if (y < 0.25) return "hihat";
    if (y < 0.5)  return "clap";
    if (y < 0.75) return "snare";
    return "kick";
  }
  return null;
}

function getSoundName(y) {
  return getSoundNameForPreset(currentPreset, y);
}

// ─────────────────────────────────────────────
// LOOP CONFIG
// ─────────────────────────────────────────────
let notes          = [];
let loopRunning    = false;
let loopStartTime  = 0;
let pausedLoopTime = 0;

// ─────────────────────────────────────────────
// COLOR
// ─────────────────────────────────────────────
function colorFromY(y) {
  const hue = Math.round(200 - y * 200);
  return `hsl(${hue}, 100%, 62%)`;
}

// ─────────────────────────────────────────────
// PERSISTENT NOTE DOTS
// ─────────────────────────────────────────────
function createNoteDot(note) {
  const el = document.createElement("div");
  el.className = "note-dot-persistent";
  el.style.cssText = `
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    left: ${note.x * 100}%;
    top:  ${note.y * 100}%;
    transform: translate(-50%, -50%);
    background: ${note.color};
    box-shadow: 0 0 0 3px ${note.color}88, 0 0 12px ${note.color}99;
    cursor: pointer;
    z-index: 8;
    transition: transform 0.15s, box-shadow 0.15s;
  `;

  el.addEventListener("mouseenter", () => {
    el.style.transform = "translate(-50%, -50%) scale(1.5)";
    el.style.boxShadow = `0 0 0 4px #fff6, 0 0 18px ${note.color}`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "translate(-50%, -50%) scale(1)";
    el.style.boxShadow = `0 0 0 3px ${note.color}88, 0 0 12px ${note.color}99`;
  });

  contentCard.appendChild(el);
  return el;
}

// ─────────────────────────────────────────────
// HIT BURST
// ─────────────────────────────────────────────
function spawnHit(x, y, color) {
  const ring = document.createElement("div");
  ring.style.cssText = `
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 3px solid ${color};
    left: ${x * 100}%;
    top:  ${y * 100}%;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    pointer-events: none;
    z-index: 20;
    box-shadow: 0 0 8px ${color}, inset 0 0 8px ${color}66;
  `;
  contentCard.appendChild(ring);

  const flash = document.createElement("div");
  flash.style.cssText = `
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${color};
    left: ${x * 100}%;
    top:  ${y * 100}%;
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.9;
    pointer-events: none;
    z-index: 21;
  `;
  contentCard.appendChild(flash);

  requestAnimationFrame(() => {
    ring.style.transition  = "transform 0.45s ease-out, opacity 0.45s ease-out";
    ring.style.transform   = "translate(-50%, -50%) scale(5)";
    ring.style.opacity     = "0";

    flash.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
    flash.style.transform  = "translate(-50%, -50%) scale(2.5)";
    flash.style.opacity    = "0";
  });

  setTimeout(() => { ring.remove(); flash.remove(); }, 480);
}

// ─────────────────────────────────────────────
// DELETE BURST
// ─────────────────────────────────────────────
function spawnDeleteBurst(x, y, color) {
  for (let i = 0; i < 6; i++) {
    const shard = document.createElement("div");
    const angle = (i / 6) * 360;
    const dist  = 28 + Math.random() * 18;
    const dx    = Math.cos((angle * Math.PI) / 180) * dist;
    const dy    = Math.sin((angle * Math.PI) / 180) * dist;

    shard.style.cssText = `
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${color};
      left: ${x * 100}%;
      top:  ${y * 100}%;
      transform: translate(-50%, -50%);
      opacity: 1;
      pointer-events: none;
      z-index: 25;
      transition: transform 0.4s ease-out, opacity 0.4s ease-out;
    `;
    contentCard.appendChild(shard);

    requestAnimationFrame(() => {
      shard.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      shard.style.opacity   = "0";
    });

    setTimeout(() => shard.remove(), 420);
  }
}

// ─────────────────────────────────────────────
// TRANSPORT — update ruler / scrubber / time
// ─────────────────────────────────────────────
function updateTransport() {
  const ctx     = getCtx();
  const elapsed = ctx.currentTime - loopStartTime;
  const lt      = elapsed % currentLoopDuration;
  const pct     = lt / currentLoopDuration;

  rulerFill.style.width = (pct * 100) + "%";
  scrubberEl.value      = Math.round(pct * 600);
  timeLabel.textContent = lt.toFixed(1) + " / " + currentLoopDuration.toFixed(1) + "s";

  highlightNearDots(lt);
}

// ─────────────────────────────────────────────
// DOT HIGHLIGHT
// ─────────────────────────────────────────────
function highlightNearDots(currentLoopTime) {
  notes.forEach(n => {
    if (!n.el) return;
    const dist     = Math.abs(currentLoopTime - n.time);
    const distWrap = Math.abs(dist - currentLoopDuration);
    const near     = Math.min(dist, distWrap) < HIGHLIGHT_WINDOW;

    if (near) {
      n.el.style.transform = "translate(-50%, -50%) scale(1.6)";
      n.el.style.boxShadow = `0 0 0 5px #fff8, 0 0 24px ${n.color}`;
    } else {
      n.el.style.transform = "translate(-50%, -50%) scale(1)";
      n.el.style.boxShadow = `0 0 0 3px ${n.color}88, 0 0 12px ${n.color}99`;
    }
  });
}

// ─────────────────────────────────────────────
// RULER
// ─────────────────────────────────────────────
function buildRuler() {
  const wrap      = document.getElementById("ruler-wrap");
  const tickCount = 6;

  for (let i = 0; i <= tickCount; i++) {
    const pct  = i / tickCount;
    const sec  = (pct * currentLoopDuration).toFixed(1);
    const tick = document.createElement("div");
    tick.className  = "tick-mark";
    tick.style.left = (pct * 100) + "%";
    tick.innerHTML  = `<div class="tick-line"></div><div class="tick-lbl">${sec}s</div>`;
    wrap.appendChild(tick);
  }
}

// ─────────────────────────────────────────────
// HOLD AUDIO — repeating single shots
// ─────────────────────────────────────────────
let holdInterval = null;

function startHoldAudio(y) {
  const ctx    = getCtx();
  const name   = getSoundName(y);
  const buffer = audioBuffers[name];
  if (!buffer) return;

  function fireOnce() {
    const src  = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer      = buffer;
    gain.gain.value = globalVolume;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  fireOnce();
  holdInterval = setInterval(fireOnce, buffer.duration * 1000);
}

function stopHoldAudio() {
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
}

// ─────────────────────────────────────────────
// HOLD-TO-SUSTAIN
// ─────────────────────────────────────────────
let holdNoteRef      = null;
let isHolding        = false;
let holdTimer        = null;
let holdX            = 0;
let holdY            = 0;
let mouseDownTime    = 0;
let justFinishedHold = false;

const HOLD_THRESHOLD_MS = 200;

function startHold(x, y) {
  holdX = x;
  holdY = y;

  holdTimer = setTimeout(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    if (!loopRunning) startLoop();

    const now           = ctx.currentTime;
    const holdStartLoop = (now - loopStartTime) % currentLoopDuration;

    holdNoteRef = {
      time:        holdStartLoop,
      duration:    0,
      x,
      y,
      preset:      currentPreset,
      color:       colorFromY(y),
      lastFired:   -1,
      el:          null,
      isHold:      true,
      placedAt:    performance.now(),
      firedSlots:  new Set()
    };

    holdNoteRef.el = createNoteDot(holdNoteRef);
    notes.push(holdNoteRef);
    spawnHit(x, y, holdNoteRef.color);
    isHolding = true;

    startHoldAudio(y);

  }, HOLD_THRESHOLD_MS);
}

function stopHold() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  stopHoldAudio();

  if (holdNoteRef && isHolding) {
    const heldSeconds     = (performance.now() - holdNoteRef.placedAt) / 1000;
    holdNoteRef.duration  = Math.min(heldSeconds, currentLoopDuration);
    holdNoteRef.lastFired = -1;
    holdNoteRef = null;
    justFinishedHold = true;
  }

  isHolding = false;
}

// ─────────────────────────────────────────────
// INPUT LISTENERS
// ─────────────────────────────────────────────
contentCard.addEventListener("mousedown", (e) => {
  mouseDownTime = performance.now();
  const rect = contentCard.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top)  / rect.height;
  startHold(x, y);
});

contentCard.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect  = contentCard.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / rect.width;
  const y = (touch.clientY - rect.top)  / rect.height;
  startHold(x, y);
}, { passive: false });

contentCard.addEventListener("touchend", stopHold);
document.addEventListener("mouseup", stopHold);

// ─────────────────────────────────────────────
// CLICK HANDLER — add note OR delete near note
// ─────────────────────────────────────────────
const DELETE_RADIUS_PX = 22;

contentCard.addEventListener("click", (e) => {
  if (justFinishedHold) {
    justFinishedHold = false;
    return;
  }

  const rect   = contentCard.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const cardW  = rect.width;
  const cardH  = rect.height;

  // DELETE check
  for (let i = notes.length - 1; i >= 0; i--) {
    const n    = notes[i];
    const nx   = n.x * cardW;
    const ny   = n.y * cardH;
    const dist = Math.hypot(clickX - nx, clickY - ny);

    if (dist <= DELETE_RADIUS_PX) {
      if (n.el) n.el.remove();
      spawnDeleteBurst(n.x, n.y, n.color);
      notes.splice(i, 1);
      return;
    }
  }

  // Short tap → ADD
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();

  const x = clickX / cardW;
  const y = clickY / cardH;

  if (!loopRunning) startLoop();

  const now      = ctx.currentTime;
  const loopTime = (now - loopStartTime) % currentLoopDuration;

  const note = {
    time:      loopTime,
    x,
    y,
    preset:    currentPreset,
    color:     colorFromY(y),
    lastFired: -1,
    el:        null
  };

  note.el = createNoteDot(note);
  notes.push(note);
  PRESETS[currentPreset].play(note.y, ctx.currentTime);
  spawnHit(note.x, note.y, note.color);
});

// ─────────────────────────────────────────────
// LOOP SCHEDULER
// ─────────────────────────────────────────────
function schedule() {
  updateTransport();
  if (!loopRunning) return;

  const ctx          = getCtx();
  const now          = ctx.currentTime;
  const elapsed      = now - loopStartTime;
  const currentCycle = Math.floor(elapsed / currentLoopDuration);
  const lookAhead    = 0.1;

  for (const note of notes) {

    // ── TAP NOTE ──
    if (!note.isHold) {
      const scheduledTime =
        loopStartTime +
        currentCycle * currentLoopDuration +
        note.time;

      if (
        scheduledTime >= now &&
        scheduledTime < now + lookAhead &&
        note.lastFired !== currentCycle
      ) {
        note.lastFired = currentCycle;
        PRESETS[note.preset].play(note.y, scheduledTime);
        const delay = (scheduledTime - now) * 1000;
        setTimeout(() => spawnHit(note.x, note.y, note.color), delay);
      }
      continue;
    }

    // ── HOLD NOTE ──
    if (note.duration <= 0) continue;

    const name   = getSoundNameForPreset(note.preset, note.y);
    const buffer = audioBuffers[name];
    if (!buffer) continue;

    const sampleDuration = buffer.duration;
    const cycleStart     = loopStartTime + currentCycle * currentLoopDuration;
    const holdStart      = cycleStart + note.time;
    const holdEnd        = cycleStart + Math.min(note.time + note.duration, currentLoopDuration);

    let t = holdStart;
    while (t < holdEnd) {
      if (t >= now && t < now + lookAhead) {
        const slotIndex = Math.round((t - loopStartTime) / sampleDuration);
        const slotKey   = `${currentCycle}-${slotIndex}`;

        if (!note.firedSlots) note.firedSlots = new Set();

        if (!note.firedSlots.has(slotKey)) {
          note.firedSlots.add(slotKey);

          const src  = ctx.createBufferSource();
          const gain = ctx.createGain();
          src.buffer      = buffer;
          src.loop        = false;
          gain.gain.value = globalVolume;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start(t);

          const delay = (t - now) * 1000;
          setTimeout(() => spawnHit(note.x, note.y, note.color), delay);
        }
      }
      t += sampleDuration;
    }

    // Trim old slot keys to prevent memory growth
    if (note.firedSlots && note.firedSlots.size > 2000) {
      note.firedSlots.clear();
    }
  }

  requestAnimationFrame(schedule);
}

// ─────────────────────────────────────────────
// LOOP CONTROL
// ─────────────────────────────────────────────
function startLoop() {
  const ctx     = getCtx();
  loopRunning   = true;
  loopStartTime = ctx.currentTime - pausedLoopTime;
  playPauseBtn.innerHTML = "&#10074;&#10074;";
  schedule();
}

function stopLoop() {
  const ctx      = getCtx();
  pausedLoopTime = (ctx.currentTime - loopStartTime) % currentLoopDuration;
  loopRunning    = false;
}

// ─────────────────────────────────────────────
// PLAY / PAUSE BUTTON
// ─────────────────────────────────────────────
playPauseBtn.addEventListener("click", function () {
  if (loopRunning) {
    stopLoop();
    playPauseBtn.innerHTML = "&#9654;";
  } else {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    startLoop();
  }
});

// ─────────────────────────────────────────────
// SCRUBBER
// ─────────────────────────────────────────────
scrubberEl.addEventListener("input", function () {
  const pct = scrubberEl.value / 600;
  const lt  = pct * currentLoopDuration;

  pausedLoopTime = lt;

  rulerFill.style.width = (pct * 100) + "%";
  timeLabel.textContent = lt.toFixed(1) + " / " + currentLoopDuration.toFixed(1) + "s";

  highlightNearDots(lt);

  if (loopRunning) {
    const ctx     = getCtx();
    loopStartTime = ctx.currentTime - lt;
    notes.forEach(n => {
      n.lastFired = Math.floor((ctx.currentTime - loopStartTime) / currentLoopDuration) - 1;
      if (n.firedSlots) n.firedSlots.clear();
    });
  }
});


function loadNotes() {
  const saved = JSON.parse(sessionStorage.getItem("axolotlNotes") || "[]");

  notes = saved;

  // recreate DOM elements
  notes.forEach(note => {
    note.el = createNoteDot(note);
    note.lastFired = -1;

    // fix missing fields for older notes
    if (note.isHold) {
    note.firedSlots = new Set();
  }
  });
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
buildRuler();
loadAllSamples();
applySettings();
loadNotes();


const tourSteps = [
  {
    element: ".menu-button",
    title: "Menu Button",
    text: "This is the main menu button on the create page."
  },
  {
    element: "#recordBtn",
    title: "Record Button",
    text: "Click this to start recording your session. Click again to stop recording."
  },
  {
    element: "#settingsBtn",
    title: "Settings Button",
    text: "Use this to open the settings page and adjust various options for sounds"
  },
  {
    element: ".content-card",
    title: "Workspace",
    text: "This is the main area where your create and recording flow will happen."
  }
];

let currentTourStep = 0;

function positionTour(step) {
  const target = document.querySelector(step.element);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const padding = 8;

  tourHighlight.style.top = rect.top - padding + "px";
  tourHighlight.style.left = rect.left - padding + "px";
  tourHighlight.style.width = rect.width + padding * 2 + "px";
  tourHighlight.style.height = rect.height + padding * 2 + "px";

  tourTitle.textContent = step.title;
  tourText.textContent = step.text;

  tourPopup.classList.remove("hidden");

  const popupWidth = 320;
  const gap = 16;

  let top = rect.bottom + gap;
  let left = rect.left;

  if (left + popupWidth > window.innerWidth - 16) {
    left = window.innerWidth - popupWidth - 16;
  }

  if (left < 16) {
    left = 16;
  }

  if (top + tourPopup.offsetHeight > window.innerHeight - 16) {
    top = rect.top - tourPopup.offsetHeight - gap;
  }

  if (top < 16) {
    top = 16;
  }

  tourPopup.style.top = top + "px";
  tourPopup.style.left = left + "px";
}

function showTourStep() {
  const step = tourSteps[currentTourStep];

  // Open menu if needed
  if (step.element === "#recordBtn" || step.element === "#settingsBtn") {
    sideMenu.classList.add("show");

    // Wait for menu to render before positioning
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionTour(step);
      });
    });

  } else {
    sideMenu.classList.remove("show");

    requestAnimationFrame(() => {
      positionTour(step);
    });
  }
}

function startTour() {
  tourOverlay.classList.remove("hidden");
  currentTourStep = 0;
  showTourStep();
}

function endTour() {
  tourOverlay.classList.add("hidden");
  tourPopup.classList.add("hidden");
  localStorage.setItem("axolotlCreateTourSeen", "true");
}

tourNextBtn.addEventListener("click", function () {
  currentTourStep++;

  if (currentTourStep >= tourSteps.length) {
    endTour();
    return;
  }

  showTourStep();
});

tourCloseBtn.addEventListener("click", function () {
  endTour();
});

window.addEventListener("resize", function () {
  if (!tourOverlay.classList.contains("hidden")) {
    showTourStep();
  }
});

window.addEventListener("load", function () {
  const hasSeenTour = localStorage.getItem("axolotlCreateTourSeen");

  if (!hasSeenTour) {
    startTour();
  }
});

const savedEmail = localStorage.getItem("loggedInEmail");
const profileLetter = document.getElementById("profileLetter");

if (savedEmail && profileLetter) {
  profileLetter.textContent = savedEmail.charAt(0).toUpperCase();
}