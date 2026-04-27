const shareButtons = document.querySelectorAll(".share-btn");
const closeBtn = document.getElementById("closeBtn");

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const row = button.closest(".table-row");
    const title = row.querySelector(".col-title").textContent.trim();
    window.location.href = "sharePage.html?title=" + encodeURIComponent(title);
  });
});

closeBtn.addEventListener("click", function () {
  window.location.href = "dashboard.html";
});

const tourOverlay = document.getElementById("tourOverlay");
const tourHighlight = document.getElementById("tourHighlight");
const tourPopup = document.getElementById("tourPopup");
const tourTitle = document.getElementById("tourTitle");
const tourText = document.getElementById("tourText");
const tourNextBtn = document.getElementById("tourNextBtn");
const tourCloseBtn = document.getElementById("tourCloseBtn");

const tourSteps = [
  {
    element: ".table-card",
    title: "Recordings Table",
    text: "This is where all your saved recordings are displayed."
  },
  {
    element: ".col-title",
    title: "Title Column",
    text: "Each row shows the name of your recording."
  },
  {
    element: ".col-date",
    title: "Date Column",
    text: "This shows when the recording was created."
  },
  {
    element: ".share-btn",
    title: "Share Button",
    text: "Click this to open the share page for that recording."
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

  let top = rect.bottom + 16;
  let left = rect.left;

  if (left + 320 > window.innerWidth - 16) {
    left = window.innerWidth - 336;
  }

  if (top + 200 > window.innerHeight) {
    top = rect.top - 200;
  }

  if (top < 16) {
    top = 16;
  }

  if (left < 16) {
    left = 16;
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
  localStorage.setItem("axolotlRecordingsTourSeen", "true");
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
  if (!localStorage.getItem("axolotlRecordingsTourSeen")) {
    startTour();
  }
});

const savedEmail = localStorage.getItem("loggedInEmail");
const profileLetter = document.getElementById("profileLetter");

if (savedEmail && profileLetter) {
  profileLetter.textContent = savedEmail.charAt(0).toUpperCase();
}