const createBtn = document.getElementById("createBtn");
const recordingsBtn = document.getElementById("recordingsBtn");
const shareButtons = document.querySelectorAll(".share-btn");
const signInBtn = document.querySelector(".sign-in");
const signUpBtn = document.querySelector(".sign-up");

signInBtn.addEventListener("click", function () {
  window.location.href = "login.html";
});

signUpBtn.addEventListener("click", function () {
  window.location.href = "signup.html";
});

const tourOverlay = document.getElementById("tourOverlay");
const tourHighlight = document.getElementById("tourHighlight");
const tourPopup = document.getElementById("tourPopup");
const tourTitle = document.getElementById("tourTitle");
const tourText = document.getElementById("tourText");
const tourNextBtn = document.getElementById("tourNextBtn");
const tourCloseBtn = document.getElementById("tourCloseBtn");

createBtn.addEventListener("click", function () {
  window.location.href = "createPage.html";
});

recordingsBtn.addEventListener("click", function () {
  window.location.href = "recordings.html";
});

shareButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const row = button.closest(".table-row");
    const title = row.querySelector(".col-title").textContent.trim();
    window.location.href = "sharePage.html?title=" + encodeURIComponent(title);
  });
});

const tourSteps = [
  {
    element: "#createBtn",
    title: "Create Button",
    text: "Click here to go to the create page and start a new recording flow."
  },
  {
    element: "#recordingsBtn",
    title: "Recordings Button",
    text: "Click here to open the recordings page and view saved items."
  },
  {
    element: ".table-card",
    title: "Recordings List",
    text: "This section shows your saved recordings with their date and sharing options."
  },
  {
    element: ".share-btn",
    title: "Share Button",
    text: "Use any share button to open the share page for that recording."
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
  localStorage.setItem("axolotlDashboardTourSeen", "true");
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
  const hasSeenTour = localStorage.getItem("axolotlDashboardTourSeen");

  if (!hasSeenTour) {
    startTour();
  }
});