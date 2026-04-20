const recordBtn = document.getElementById("recordBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const menuButton = document.getElementById("menuButton");

const tourOverlay = document.getElementById("tourOverlay");
const tourHighlight = document.getElementById("tourHighlight");
const tourPopup = document.getElementById("tourPopup");
const tourTitle = document.getElementById("tourTitle");
const tourText = document.getElementById("tourText");
const tourNextBtn = document.getElementById("tourNextBtn");
const tourCloseBtn = document.getElementById("tourCloseBtn");

menuButton.addEventListener("click", function () {
  alert("Menu button clicked.");
});

recordBtn.addEventListener("click", function () {
  const isRecording = recordBtn.classList.toggle("recording-active");
  recordBtn.textContent = isRecording ? "Recording" : "Record";
});

settingsBtn.addEventListener("click", function () {
  window.location.href = "settings.html";
});

exitBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});

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
  positionTour(tourSteps[currentTourStep]);
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