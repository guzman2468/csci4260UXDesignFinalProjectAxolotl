const recordingTitle = document.getElementById("recordingTitle");
const shareLink = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusText = document.getElementById("statusText");
const closeBtn = document.getElementById("closeBtn");

const params = new URLSearchParams(window.location.search);
const titleFromUrl = params.get("title");

if (titleFromUrl) {
  recordingTitle.textContent = titleFromUrl;
  const slug = titleFromUrl
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  shareLink.value = "https://axolotl.app/share/" + slug;
}

copyBtn.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    statusText.textContent = "Link copied.";
  } catch (error) {
    statusText.textContent = "Copy failed.";
  }
});

downloadBtn.addEventListener("click", function () {
  statusText.textContent = "Download started.";
});

closeBtn.addEventListener("click", function () {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "dashboard.html";
  }
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
    element: ".share-title",
    title: "Share Title",
    text: "This shows which recording you are currently sharing."
  },
  {
    element: ".link-box",
    title: "Share Link",
    text: "This is the link you can send to someone else."
  },
  {
    element: "#copyBtn",
    title: "Copy Button",
    text: "Click this to copy the share link to your clipboard."
  },
  {
    element: "#downloadBtn",
    title: "Download Button",
    text: "Click this to start downloading the recording."
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
  localStorage.setItem("axolotlShareTourSeen", "true");
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
  const hasSeenTour = localStorage.getItem("axolotlShareTourSeen");

  if (!hasSeenTour) {
    startTour();
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