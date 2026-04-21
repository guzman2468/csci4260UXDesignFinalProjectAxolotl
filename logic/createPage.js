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

menuButton.addEventListener("click", function () {
  sideMenu.classList.toggle("show");
});

recordBtn.addEventListener("click", () => sideMenu.classList.remove("show"));
settingsBtn.addEventListener("click", () => sideMenu.classList.remove("show"));
exitBtn.addEventListener("click", () => sideMenu.classList.remove("show"));

recordBtn.addEventListener("click", function () {
  const isRecording = recordBtn.classList.toggle("recording-active");
  recordBtn.textContent = isRecording ? "Recording" : "Record";
  recordModal.classList.toggle("show", isRecording);
});

settingsBtn.addEventListener("click", function () {
  window.location.href = "settings.html";
});

exitBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});

const contentCard = document.getElementById("contentCard");

const LOOP_DURATION = 5;
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
    loadSample("kick",  "../sounds/kick.wav"),
    loadSample("snare", "../sounds/snare.wav"),
    loadSample("hihat", "../sounds/hihat.wav"),
    loadSample("clap",  "../sounds/clap.wav"),
    loadSample("ac_hihat",  "../sounds/acoustic_highhat.mp3"),
    loadSample("ac_kick",  "../sounds/acoustic_kick.mp3"),
    loadSample("ac_snare",  "../sounds/acoustic_snare.mp3"),
    loadSample("F_drum",  "../sounds/F_drum.mp3"),
  ]);
}
 
// ─────────────────────────────────────────────
// PLAYBACK
// ─────────────────────────────────────────────
function play(name, time, rate = 1, vol = 0.8) {
  const ctx = getCtx();
  const buffer = audioBuffers[name];
  if (!buffer) return;
 
  const src  = ctx.createBufferSource();
  const gain = ctx.createGain();
 
  src.buffer = buffer;
  src.playbackRate.value = rate;
  gain.gain.value = vol;
 
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
      else               play("F_drum",  time);
    }
  }
};
 
let currentPreset = "acoustic";
 
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
  const lt      = elapsed % LOOP_DURATION;
  const pct     = lt / LOOP_DURATION;
 
  rulerFill.style.width = (pct * 100) + "%";
  scrubberEl.value      = Math.round(pct * 600);
  timeLabel.textContent = lt.toFixed(1) + " / " + LOOP_DURATION.toFixed(1) + "s";
 
  highlightNearDots(lt);
}
 
// ─────────────────────────────────────────────
// DOT HIGHLIGHT
// ─────────────────────────────────────────────

 
function highlightNearDots(currentLoopTime) {
  notes.forEach(n => {
    if (!n.el) return;
    const dist     = Math.abs(currentLoopTime - n.time);
    const distWrap = Math.abs(dist - LOOP_DURATION);
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
    const sec  = (pct * LOOP_DURATION).toFixed(1);
    const tick = document.createElement("div");
    tick.className  = "tick-mark";
    tick.style.left = (pct * 100) + "%";
    tick.innerHTML  = `<div class="tick-line"></div><div class="tick-lbl">${sec}s</div>`;
    wrap.appendChild(tick);
  }
}
 
// ─────────────────────────────────────────────
// HOLD-TO-SUSTAIN
// mousedown starts a looping source, mouseup stops it
// ─────────────────────────────────────────────
let holdSource = null;
let isHolding  = false;
 
function startHold(y) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
 
  const name   = getSoundName(y);
  const buffer = audioBuffers[name];
  if (!buffer) return;
 
  holdSource = ctx.createBufferSource();
  const gain = ctx.createGain();
 
  holdSource.buffer     = buffer;
  holdSource.loop       = true;
  gain.gain.value       = 0.8;
 
  holdSource.connect(gain);
  gain.connect(ctx.destination);
  holdSource.start();
  isHolding = true;
}
 
function stopHold() {
  if (holdSource) {
    try { holdSource.stop(); } catch (_) {}
    holdSource.disconnect();
    holdSource = null;
  }
  isHolding = false;
}
 
// Mirrors PRESETS.drums logic
function getSoundName(y) {
  const preset = PRESETS[currentPreset];

  if (!preset) return null;

  if (y < 0.25) return preset.playMap?.[0] || null;
  if (y < 0.5)  return preset.playMap?.[1] || null;
  if (y < 0.75) return preset.playMap?.[2] || null;
  return preset.playMap?.[3] || null;
}
 
contentCard.addEventListener("mousedown", (e) => {
  const rect = contentCard.getBoundingClientRect();
  const y    = (e.clientY - rect.top) / rect.height;
  startHold(y);
});
 
contentCard.addEventListener("mouseup",    stopHold);
contentCard.addEventListener("mouseleave", stopHold);
 
// Touch support
contentCard.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect  = contentCard.getBoundingClientRect();
  const y     = (touch.clientY - rect.top) / rect.height;
  startHold(y);
}, { passive: false });
 
contentCard.addEventListener("touchend", stopHold);
 
// ─────────────────────────────────────────────
// CLICK HANDLER — add note OR delete near note
// (fires after a clean mousedown+mouseup)
// ─────────────────────────────────────────────
const DELETE_RADIUS_PX = 22;
 
contentCard.addEventListener("click", (e) => {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
 
  const rect   = contentCard.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const cardW  = rect.width;
  const cardH  = rect.height;
 
  // Check if click is near an existing note → DELETE
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
 
  // No nearby note → ADD
  const x = clickX / cardW;
  const y = clickY / cardH;
 
  if (!loopRunning) startLoop();
 
  const now      = ctx.currentTime;
  const loopTime = (now - loopStartTime) % LOOP_DURATION;
 
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
  const currentCycle = Math.floor(elapsed / LOOP_DURATION);
  const lookAhead    = 0.1;
 
  for (const note of notes) {
    const scheduledTime =
      loopStartTime +
      currentCycle * LOOP_DURATION +
      note.time;
 
    if (
      scheduledTime >= now &&
      scheduledTime < now + lookAhead &&
      note.lastFired !== currentCycle
    ) {
      PRESETS[currentPreset].play(note.y, scheduledTime);
      note.lastFired = currentCycle;
 
      const delay = (scheduledTime - now) * 1000;
      setTimeout(() => spawnHit(note.x, note.y, note.color), delay);
    }
  }
 
  requestAnimationFrame(schedule);
}
 
// ─────────────────────────────────────────────
// LOOP CONTROL
// ─────────────────────────────────────────────
function startLoop() {
  const ctx      = getCtx();
  loopRunning    = true;
  loopStartTime  = ctx.currentTime - pausedLoopTime;
  playPauseBtn.innerHTML = "&#10074;&#10074;";
  schedule();
}
 
function stopLoop() {
  const ctx      = getCtx();
  pausedLoopTime = (ctx.currentTime - loopStartTime) % LOOP_DURATION;
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
  const lt  = pct * LOOP_DURATION;
 
  pausedLoopTime = lt;
 
  rulerFill.style.width = (pct * 100) + "%";
  timeLabel.textContent = lt.toFixed(1) + " / " + LOOP_DURATION.toFixed(1) + "s";
 
  highlightNearDots(lt);
 
  if (loopRunning) {
    const ctx     = getCtx();
    loopStartTime = ctx.currentTime - lt;
    notes.forEach(n => (n.lastFired = Math.floor((ctx.currentTime - loopStartTime) / LOOP_DURATION) - 1));
  }
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
buildRuler();
loadAllSamples();


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