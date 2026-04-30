const supabaseUrl = "https://ogizpqbereqnqcxihkfp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naXpwcWJlcmVxbnFjeGloa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDEyODIsImV4cCI6MjA5MTA3NzI4Mn0.8cWpsMa2pj4-olPORCdzvb4V--UgT9SeceDa1LRErGI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

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
// SAVE PROJECT
// ─────────────────────────────────────────────

const saveBtn = document.getElementById("saveBtn");
const saveModal = document.getElementById("saveModal");
const projectNameInput = document.getElementById("projectNameInput");
const saveConfirmBtn = document.getElementById("saveConfirmBtn");
const saveCancelBtn = document.getElementById("saveCancelBtn");

console.log("saveModal:", saveModal);
console.log("saveConfirmBtn:", saveConfirmBtn);
console.log("saveCancelBtn:", saveCancelBtn);
let recordingStartTime = 0;

if (saveBtn) {
  saveBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    console.log("Save btn clicked");
    console.log("saveModal before:", saveModal.classList.toString());
    projectNameInput.value = "";
    projectNameInput.style.border = "";
    saveModal.classList.remove("hidden");
    console.log("saveModal after:", saveModal.classList.toString());
    projectNameInput.focus();
  });
}

saveCancelBtn.addEventListener("click", function () {
  saveModal.classList.add("hidden");
});

saveConfirmBtn.addEventListener("click", saveProject);


async function saveProject() {
  const name = projectNameInput.value.trim();

  if (!name) {
    projectNameInput.style.border = "2px solid red";
    return;
  }

  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to save.");
      return;
    }

    const projectData = {
      notes: notes.map(n => ({
        time: n.time,
        x: n.x,
        y: n.y,
        preset: n.preset,
        color: n.color,
        isHold: n.isHold || false,
        duration: n.duration || 0
      })),
      preset: currentPreset,
      loopDuration: currentLoopDuration
    };

    const { data, error } = await supabaseClient
      .from("projects")
      .insert([{
        user_id: user.id,
        name: name,
        data: projectData
      }]);

    if (error) {
      console.error("Save error:", error);
      alert("Failed to save project");
      return;
    }

    saveModal.classList.add("hidden");
    alert(`"${name}" saved!`);

  } catch (err) {
    console.error(err);
    alert("Unexpected error saving project");
  }
}

async function loadProject() {
  if (!projectId) return;

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error(error);
    alert("Failed to load project");
    return;
  }

  console.log("Loaded project:", data);

  notes = (data.data.notes || []).map(n => ({
    ...n,
    el: null,
    lastFired: -1,
    firedSlots: new Set()
  }));

  currentPreset = data.data.preset || "acoustic";
  currentLoopDuration = data.data.loopDuration || 6;

  notes.forEach(note => {
    note.el = createNoteDot(note);
  });
}

loadProject();

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

let mediaRecorder = null;
let recordedChunks = [];

recordBtn.addEventListener("click", async function () {
  const isRecording = recordBtn.classList.toggle("recording-active");
  recordBtn.textContent = isRecording ? "Recording" : "Record";
  recordModal.classList.toggle("show", isRecording);

  if (isRecording) {
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") await ctx.resume();

      const master = getMaster();
      const dest = ctx.createMediaStreamDestination();
      
      // Connect master to recorder
      master.connect(dest);
      window._recordDest = dest;

      // Auto start loop if not running
      if (!loopRunning) {
        startLoop();
        playPauseBtn.innerHTML = "&#10074;&#10074;";
      }

      recordedChunks = [];
      mediaRecorder = new MediaRecorder(dest.stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Disconnect recorder from master
        try { master.disconnect(dest); } catch(e) {}
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "recording.webm";
        a.click();
        URL.revokeObjectURL(url);
        window._recordDest = null;
      };

      mediaRecorder.start();

    } catch (err) {
      console.error("Recording failed:", err);
      recordBtn.classList.remove("recording-active");
      recordBtn.textContent = "Record";
      recordModal.classList.remove("show");
    }

  } else {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }
});

settingsBtn.addEventListener("click", function () {
  sessionStorage.setItem("axolotlNotes", JSON.stringify(notes));

  // Save recording state
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    sessionStorage.setItem("axolotlWasRecording", "true");
  }

  window.location.href = "settings.html";
});

exitBtn.addEventListener("click", function () {
  sessionStorage.removeItem("axolotlNotes");
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

let masterGain = null;

function getMaster() {
  if (!masterGain) {
    const ctx = getCtx();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
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
    loadSample("dr1_kick",     "../sounds/drums/kick.wav"),
    loadSample("dr1_snare",    "../sounds/drums/snare.wav"),
    loadSample("dr1_hihat",    "../sounds/drums/hihat.wav"),
    loadSample("dr1_clap",     "../sounds/drums/clap.wav"),
    loadSample("ac_hihat", "../sounds/acoustic/acoustic_highhat.mp3"),
    loadSample("ac_kick",  "../sounds/acoustic/acoustic_kick.mp3"),
    loadSample("ac_snare", "../sounds/acoustic/acoustic_snare.mp3"),
    loadSample("F_drum",   "../sounds/acoustic/F_drum.mp3"),
    loadSample("dr2_clap", "../sounds/drum2/Drum Clap.wav"),
    loadSample("dr2_hat",  "../sounds/drum2/Drum Hat.wav"),
    loadSample("dr2_snare", "../sounds/drum2/Drum snare.wav"),
    loadSample("dr2_snare2",   "../sounds/drum2/Drum snare 2.wav"),
    loadSample("el_guitar", "../sounds/electric/Electric Guitar.wav"),
    loadSample("el_piano",  "../sounds/electric/Electric Piano.wav"),
    loadSample("piano", "../sounds/electric/Piano.wav"),
    loadSample("el_808",   "../sounds/electric/808.wav"),
    loadSample("synth_bass", "../sounds/synth/Bass Synth.wav"),
    loadSample("synth_kick",  "../sounds/synth/kick.wav"),
    loadSample("synth", "../sounds/synth/Synth.wav"),
    loadSample("synth_violin",   "../sounds/synth/Violin Synth.wav"),
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
  gain.connect(getMaster());

  src.start(Math.max(time, ctx.currentTime));
}

// ─────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────
const PRESETS = {
  drums: {
    play(y, time) {
      if      (y < 0.25) play("dr1_hihat", time);
      else if (y < 0.5)  play("dr1_clap",  time);
      else if (y < 0.75) play("dr1_snare", time);
      else               play("dr1_kick",  time);
    }
  },
  acoustic: {
    play(y, time) {
      if      (y < 0.25) play("ac_hihat", time);
      else if (y < 0.5)  play("ac_kick",  time);
      else if (y < 0.75) play("ac_snare", time);
      else               play("F_drum",   time);
    }
  },
  drums2: {
    play(y, time) {
      if      (y < 0.25) play("dr2_clap", time);
      else if (y < 0.5)  play("dr2_hat",  time);
      else if (y < 0.75) play("dr2_snare", time);
      else               play("dr2_snare2",   time);
    }
  },
  electric: {
    play(y, time) {
      if      (y < 0.25) play("el_guitar", time);
      else if (y < 0.5)  play("el_piano",  time);
      else if (y < 0.75) play("piano", time);
      else               play("el_808",   time);
    }
  },
  synth: {
    play(y, time) {
      if      (y < 0.25) play("synth_kick", time);
      else if (y < 0.5)  play("synth_violin",  time);
      else if (y < 0.75) play("synth", time);
      else               play("synth_bass",   time);
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
    if (y < 0.25) return "dr1_hihat";
    if (y < 0.5)  return "dr1_clap";
    if (y < 0.75) return "dr1_snare";
    return "dr1_kick";
  }
  if (preset === "drums2") {
    if (y < 0.25) return "dr2_clap";
    if (y < 0.5)  return "dr2_hat";
    if (y < 0.75) return "dr2_snare";
    return "dr2_snare2";
  }
  if (preset === "electric") {
    if (y < 0.25) return "el_guitar";
    if (y < 0.5)  return "el_piano";
    if (y < 0.75) return "piano";
    return "el_808";
  }
  if (preset === "synth") {
    if (y < 0.25) return "synth_kick";
    if (y < 0.5)  return "synth_violin";
    if (y < 0.75) return "synth";
    return "synth_bass";
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

  wrap.querySelectorAll(".tick-mark").forEach(t => t.remove());

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
    gain.connect(getMaster());
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

  const ctx = getCtx();
  const now = ctx.currentTime;

  const isRecording = mediaRecorder && mediaRecorder.state === "recording";

  // ✅ KEY FIX: use recording timeline when recording
  const baseTime = isRecording ? recordingStartTime : loopStartTime;

  const elapsed = now - baseTime;
  const currentCycle = Math.floor(elapsed / currentLoopDuration);

  // tighter timing while recording
  const lookAhead = isRecording ? 0.05 : 0.15;

  for (const note of notes) {

    // ── TAP NOTE ──
    if (!note.isHold) {
      const scheduledTime =
        baseTime +
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

    const name = getSoundNameForPreset(note.preset, note.y);
    const buffer = audioBuffers[name];
    if (!buffer) continue;

    const sampleDuration = buffer.duration;

    // ✅ FIXED: use baseTime here too
    const cycleStart = baseTime + currentCycle * currentLoopDuration;
    const holdStart = cycleStart + note.time;
    const holdEnd = cycleStart + Math.min(note.time + note.duration, currentLoopDuration);

    let t = holdStart;

    while (t < holdEnd) {
      if (t >= now && t < now + lookAhead) {
        const slotIndex = Math.round((t - cycleStart) / sampleDuration);
        const slotKey = `${currentCycle}-${slotIndex}`;

        if (!note.firedSlots) note.firedSlots = new Set();

        if (!note.firedSlots.has(slotKey)) {
          note.firedSlots.add(slotKey);

          const src = ctx.createBufferSource();
          const gain = ctx.createGain();

          src.buffer = buffer;
          gain.gain.value = globalVolume;

          src.connect(gain);
          gain.connect(getMaster());

          src.start(t);

          const delay = (t - now) * 1000;
          setTimeout(() => spawnHit(note.x, note.y, note.color), delay);
        }
      }
      t += sampleDuration;
    }

    // cleanup old slots
    if (note.firedSlots && note.firedSlots.size > 500) {
      const keysToDelete = [];
      note.firedSlots.forEach(k => {
        const cycle = parseInt(k.split("-")[0]);
        if (cycle < currentCycle - 1) keysToDelete.push(k);
      });
      keysToDelete.forEach(k => note.firedSlots.delete(k));
    }
  }

  requestAnimationFrame(schedule);
}

// ─────────────────────────────────────────────
// LOOP CONTROL
// ─────────────────────────────────────────────
function startLoop() {
  const ctx = getCtx();
  loopRunning   = true;
  loopStartTime = ctx.currentTime - pausedLoopTime;
  playPauseBtn.innerHTML = "&#10074;&#10074;";

  // Reset all notes so nothing gets skipped
  notes.forEach(n => {
    n.lastFired = -1;
    if (n.firedSlots) n.firedSlots.clear();
  });

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
    const ctx = getCtx();
    loopStartTime = ctx.currentTime - lt;

    // Reset ALL notes fully
    notes.forEach(n => {
      n.lastFired = -1;
      if (n.firedSlots) n.firedSlots.clear();
    });
  } else {
    // Also reset when paused so resuming plays correctly
    notes.forEach(n => {
      n.lastFired = -1;
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
applySettings();
buildRuler();
loadAllSamples();
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
  // Resume recording if we were recording before going to settings
  if (sessionStorage.getItem("axolotlWasRecording") === "true") {
    sessionStorage.removeItem("axolotlWasRecording");
    
    // Show the recording UI
    recordBtn.classList.add("recording-active");
    recordBtn.textContent = "Recording";
    recordModal.classList.add("show");

    // Start a fresh recording session
    const ctx = getCtx();
    const dest = ctx.createMediaStreamDestination();
    window._recordDest = dest;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(dest.stream);

    // ✅ anchor recording timeline
    recordingStartTime = ctx.currentTime;

    // reset notes so scheduling is clean
    notes.forEach(n => {
      n.lastFired = -1;
      if (n.firedSlots) n.firedSlots.clear();
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      a.click();
      URL.revokeObjectURL(url);
      window._recordDest = null;
    };

    mediaRecorder.start();
  }
});

const savedEmail = localStorage.getItem("loggedInEmail");
const profileLetter = document.getElementById("profileLetter");

if (savedEmail && profileLetter) {
  profileLetter.textContent = savedEmail.charAt(0).toUpperCase();
}

profileIcon.addEventListener("click", function (event) {
  event.stopPropagation();
  profileDropdown.classList.toggle("hidden");
});

logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("loggedInEmail");
  sessionStorage.removeItem("axolotlSettings");
  window.location.href = "login.html";
});

document.addEventListener("click", function (event) {
  if (!profileIcon.contains(event.target) && !profileDropdown.contains(event.target)) {
    profileDropdown.classList.add("hidden");
  }
});